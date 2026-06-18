# NexaSphere CDN Integration

CloudFront CDN integration for global static asset delivery, cache invalidation on deploy, cost tracking, and performance measurement.

---

## Architecture Overview

```
User → CloudFront Edge (100+ PoPs) → Vercel/Render Origin
         │
         ├── /assets/*   → cache 1 year (content-hashed JS/CSS)
         ├── /images/*   → cache 1 year
         ├── /fonts/*    → cache 1 year
         ├── / (HTML)    → cache 60s (short TTL, always fresh)
         └── /api/*      → no cache, pass through
```

CloudFront sits in front of the existing Vercel deployment. All static asset requests are served from the nearest edge location globally, while API calls are passed through uncached.

---

## Files Changed

| File | Purpose |
|------|---------|
| `infrastructure/cloudfront.tf` | Terraform config for CloudFront distribution, cache policies, S3 access logs |
| `scripts/cdn-invalidate.sh` | Manual cache invalidation script |
| `scripts/setup-cdn-cost-alert.sh` | One-time billing alert setup |
| `scripts/measure-cdn-performance.js` | Baseline vs post-CDN performance comparison |
| `.github/workflows/cdn-invalidate.yml` | Automated invalidation + cost annotation on deploy |
| `docs/CDN_SETUP.md` | This document |

---

## Initial Setup

### 1. Prerequisites

- AWS account with permissions for CloudFront, S3, CloudWatch, Budgets
- Terraform ≥ 1.5 installed
- AWS CLI v2 configured (`aws configure`)

### 2. Provision CloudFront

```bash
cd infrastructure

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan \
  -var="origin_domain=nexasphere.vercel.app" \
  -var="environment=production"

# Apply
terraform apply \
  -var="origin_domain=nexasphere.vercel.app" \
  -var="environment=production"

# Note the outputs:
# cloudfront_domain = xxxxxxxx.cloudfront.net
# cloudfront_distribution_id = EXXXXXXXXXXXXXX
```

### 3. Set GitHub Secrets

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key (CDN-only permissions) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | From Terraform output |
| `CLOUDFRONT_DOMAIN` | e.g. `xxxxxxxx.cloudfront.net` or your custom domain |
| `ORIGIN_DOMAIN` | e.g. `nexasphere.vercel.app` |

### 4. Set up cost alerts

```bash
bash scripts/setup-cdn-cost-alert.sh \
  --email your@email.com \
  --threshold 10
```

This creates:
- CloudWatch alarm (fires when monthly CDN spend > $10)
- AWS Budget with 80% warning notification
- Cost allocation tags (Project=NexaSphere, Component=CDN)

### 5. Update VITE_CDN_URL (optional)

If you want assets served from a custom domain instead of CloudFront's generated domain, update your Vercel env vars:

```
VITE_CDN_URL=https://cdn.nexasphere.com
```

The `vite.config.js` already reads `VITE_CDN_URL` as the `base` path for asset URLs.

---

## Cache Invalidation

### Automatic (on every deploy)

The workflow `.github/workflows/cdn-invalidate.yml` runs on every push to `main` and:
1. Creates a `/*` CloudFront invalidation
2. Waits for completion
3. Verifies cache state via `x-cache` header
4. Annotates the run with CDN cost data

### Manual

```bash
export AWS_DISTRIBUTION_ID=EXXXXXXXXXXXXXX

# Invalidate everything
bash scripts/cdn-invalidate.sh

# Invalidate specific paths only
bash scripts/cdn-invalidate.sh --paths "/assets/* /images/*"

# Dry run (no AWS call)
bash scripts/cdn-invalidate.sh --dry-run
```

### Manual via AWS CLI

```bash
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXXX \
  --paths "/*"
```

---

## Cache Behaviors

| Path | Cache Policy | TTL | Notes |
|------|-------------|-----|-------|
| `/assets/*` | Static Assets | 31,536,000s (1 year) | Content-hashed filenames; safe to cache forever |
| `/images/*` | Static Assets | 31,536,000s (1 year) | Content-hashed |
| `/fonts/*` | Static Assets | 31,536,000s (1 year) | Content-hashed |
| `/` (HTML) | HTML Pages | 60s default, 300s max | Short TTL; invalidated on deploy anyway |
| `/api/*` | API Passthrough | 0s | Never cached; all headers/cookies forwarded |

---

## Performance Measurement

### Capture baseline (before CDN)

```bash
node scripts/measure-cdn-performance.js \
  --url https://nexasphere.vercel.app \
  --label baseline \
  --runs 5
```

### Measure post-CDN

```bash
node scripts/measure-cdn-performance.js \
  --url https://xxxxxxxx.cloudfront.net \
  --label post-cdn \
  --runs 5
```

### Compare

```bash
node scripts/measure-cdn-performance.js --compare
# → generates reports/cdn-performance-report.md
```

### What is measured

- **TTFB** — multiple runs, avg/min/max
- **x-cache header** — confirms edge serving (`Hit from cloudfront`)
- **Lighthouse** — FCP, LCP, TBT, CLS, Performance score (requires `npm install -g lighthouse`)
- **Cache hit rate** — % of TTFB runs that returned a cache hit

### Verifying cache hit manually

```bash
curl -sI https://xxxxxxxx.cloudfront.net/assets/index-abc123.js | grep -i "x-cache"
# Expected: x-cache: Hit from cloudfront
```

---

## Cost Tracking

### What you pay for
- **Data transfer out** — $0.0085/GB (US/EU), cheaper than most origins
- **HTTP requests** — $0.0075 per 10,000 requests
- **Cache invalidations** — first 1,000 paths/month free, then $0.005/path
- **S3 access logs** — negligible

### Typical cost for NexaSphere
At ~10,000 DAU with average 500KB cached assets per session:
- Data transfer: ~150 GB/month = ~$1.28
- Requests: ~300,000/month = ~$0.23
- **Total: ~$1.50-3.00/month** (well within $10 alert threshold)

### Viewing spend
```bash
aws ce get-cost-and-usage \
  --time-period "Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d)" \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon CloudFront"]}}' \
  --metrics "UnblendedCost"
```

---

## IAM Policy (Least Privilege)

Create a dedicated IAM user for CI/CD with only these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/EXXXXXXXXXXXXXX"
    },
    {
      "Sid": "CostExplorerRead",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Troubleshooting

**Assets still served from origin after invalidation**
→ Invalidation propagation takes 1-5 minutes globally. Wait and retry.

**x-cache shows `Miss` on every request**
→ Check that your origin is returning `Cache-Control` headers. Vite builds set these automatically for hashed assets.

**x-cache shows `Error from cloudfront`**
→ Origin is returning 5xx. Check Vercel/Render deployment status.

**`Hit from cloudfront` not appearing on HTML**
→ Expected — HTML has a 60s TTL and is frequently expired. This is intentional.

**Terraform `custom_domain` variable and ACM cert**
→ ACM certificates for CloudFront must be in `us-east-1`. Uncomment the `viewer_certificate` block in `cloudfront.tf` and set the ARN after cert validation.
