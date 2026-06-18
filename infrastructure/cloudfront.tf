terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "nexasphere-terraform-state"
    key    = "cdn/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1" # CloudFront is global; ACM certs must be in us-east-1
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "origin_domain" {
  description = "Origin domain (Vercel / Render deployment URL)"
  type        = string
  default     = "nexasphere.vercel.app"
}

variable "custom_domain" {
  description = "Custom domain for CloudFront (leave empty to skip ACM)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Deployment environment (production | staging)"
  type        = string
  default     = "production"
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_All | PriceClass_200 | PriceClass_100)"
  type        = string
  default     = "PriceClass_100" # US, CA, EU — cheapest; change to All for global
}

# ─── S3 bucket for access logs ────────────────────────────────────────────────

resource "aws_s3_bucket" "cdn_logs" {
  bucket        = "nexasphere-cdn-logs-${var.environment}"
  force_destroy = true

  tags = {
    Project     = "NexaSphere"
    Environment = var.environment
    Component   = "CDN"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_ownership_controls" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cdn_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.cdn_logs]
  bucket     = aws_s3_bucket.cdn_logs.id
  acl        = "log-delivery-write"
}

resource "aws_s3_bucket_lifecycle_configuration" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id
  rule {
    id     = "expire-old-logs"
    status = "Enabled"
    expiration {
      days = 90
    }
  }
}

# ─── Cache policies ───────────────────────────────────────────────────────────

# Long-lived cache for hashed static assets (JS, CSS, images, fonts)
resource "aws_cloudfront_cache_policy" "static_assets" {
  name        = "nexasphere-static-assets-${var.environment}"
  comment     = "Cache hashed static assets for 1 year"
  default_ttl = 31536000 # 1 year
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Short-lived cache for HTML (not hashed, must stay fresh)
resource "aws_cloudfront_cache_policy" "html_pages" {
  name        = "nexasphere-html-pages-${var.environment}"
  comment     = "Short TTL for HTML to pick up new deploys quickly"
  default_ttl = 60   # 1 minute
  max_ttl     = 300  # 5 minutes max
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Pass-through for API calls (never cache at CDN)
resource "aws_cloudfront_cache_policy" "api_passthrough" {
  name        = "nexasphere-api-passthrough-${var.environment}"
  comment     = "No caching for API routes"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "all"
    }
    headers_config {
      header_behavior = "allViewer"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
    enable_accept_encoding_gzip   = false
    enable_accept_encoding_brotli = false
  }
}

# ─── Origin request policy ────────────────────────────────────────────────────

resource "aws_cloudfront_origin_request_policy" "forward_host" {
  name    = "nexasphere-forward-host-${var.environment}"
  comment = "Forward Host header so Vercel routing works"

  cookies_config {
    cookie_behavior = "none"
  }
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Host", "Origin", "CloudFront-Viewer-Country"]
    }
  }
  query_strings_config {
    query_string_behavior = "none"
  }
}

# ─── Response headers policy (security + CORS) ────────────────────────────────

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "nexasphere-security-headers-${var.environment}"
  comment = "HSTS, CSP, and cache control for static assets"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    origin_override = true
  }
}

# ─── CloudFront distribution ──────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "nexasphere" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "NexaSphere CDN — ${var.environment}"
  price_class         = var.price_class
  aliases             = var.custom_domain != "" ? [var.custom_domain] : []
  http_version        = "http2and3"
  wait_for_deployment = false

  # Origin: Vercel / Render
  origin {
    domain_name = var.origin_domain
    origin_id   = "nexasphere-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 30
      origin_keepalive_timeout = 5
    }

    custom_header {
      name  = "X-CDN-Secret"
      value = var.cdn_secret
    }
  }

  # Default behavior: HTML pages (short TTL)
  default_cache_behavior {
    target_origin_id             = "nexasphere-origin"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["GET", "HEAD", "OPTIONS"]
    cached_methods               = ["GET", "HEAD"]
    cache_policy_id              = aws_cloudfront_cache_policy.html_pages.id
    origin_request_policy_id     = aws_cloudfront_origin_request_policy.forward_host.id
    response_headers_policy_id   = aws_cloudfront_response_headers_policy.security_headers.id
    compress                     = true
  }

  # Static assets: JS, CSS (content-hashed filenames, 1-year TTL)
  ordered_cache_behavior {
    path_pattern                 = "/assets/*"
    target_origin_id             = "nexasphere-origin"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["GET", "HEAD"]
    cached_methods               = ["GET", "HEAD"]
    cache_policy_id              = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id   = aws_cloudfront_response_headers_policy.security_headers.id
    compress                     = true
  }

  # Static images and media
  ordered_cache_behavior {
    path_pattern                 = "/images/*"
    target_origin_id             = "nexasphere-origin"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["GET", "HEAD"]
    cached_methods               = ["GET", "HEAD"]
    cache_policy_id              = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id   = aws_cloudfront_response_headers_policy.security_headers.id
    compress                     = true
  }

  # Fonts
  ordered_cache_behavior {
    path_pattern                 = "/fonts/*"
    target_origin_id             = "nexasphere-origin"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["GET", "HEAD"]
    cached_methods               = ["GET", "HEAD"]
    cache_policy_id              = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id   = aws_cloudfront_response_headers_policy.security_headers.id
    compress                     = true
  }

  # API routes: never cache, pass everything through
  ordered_cache_behavior {
    path_pattern                 = "/api/*"
    target_origin_id             = "nexasphere-origin"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods               = ["GET", "HEAD"]
    cache_policy_id              = aws_cloudfront_cache_policy.api_passthrough.id
    origin_request_policy_id     = aws_cloudfront_origin_request_policy.forward_host.id
    compress                     = false
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn_logs.bucket_domain_name
    prefix          = "cloudfront/${var.environment}/"
  }

  # Geo restrictions (none — global delivery)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # TLS certificate
  viewer_certificate {
    cloudfront_default_certificate = var.custom_domain == ""
    # Uncomment and set acm_certificate_arn when using a custom domain:
    # acm_certificate_arn      = aws_acm_certificate.cdn.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Project     = "NexaSphere"
    Environment = var.environment
    Component   = "CDN"
    ManagedBy   = "Terraform"
    CostCenter  = "cdn-${var.environment}"
  }
}

# ─── Variables needed above ───────────────────────────────────────────────────

variable "cdn_secret" {
  description = "Secret header value passed to origin to block direct access"
  type        = string
  sensitive   = true
  default     = "change-me-in-tfvars"
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.nexasphere.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for cache invalidation)"
  value       = aws_cloudfront_distribution.nexasphere.id
}

output "cdn_logs_bucket" {
  description = "S3 bucket storing CloudFront access logs"
  value       = aws_s3_bucket.cdn_logs.bucket
}
