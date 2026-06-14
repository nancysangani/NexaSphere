resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${var.project_name}-${var.environment}-media-oac"
  description                       = "OAC for ${var.project_name} ${var.environment} media bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} CloudFront distribution"
  default_root_object = "index.html"
  price_class         = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"

  aliases = var.domain_name != "" ? [var.domain_name] : []

  origin {
    domain_name              = var.media_bucket_regional_domain
    origin_id                = "media-bucket"
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "media-bucket"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 604800
  }

  ordered_cache_behavior {
    path_pattern           = "static/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "media-bucket"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == ""
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = { Name = "${var.project_name}-${var.environment}-cdn" }
}
