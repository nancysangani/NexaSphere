#!/usr/bin/env bash
# cdn-invalidate.sh — Invalidate CloudFront cache on deploy
# Usage: bash scripts/cdn-invalidate.sh [--paths "/assets/* /images/*"]
#
# Required env vars:
#   AWS_DISTRIBUTION_ID  — CloudFront distribution ID
#   AWS_ACCESS_KEY_ID    — AWS access key (set in GitHub Secrets)
#   AWS_SECRET_ACCESS_KEY — AWS secret key (set in GitHub Secrets)
#   AWS_DEFAULT_REGION   — AWS region (default: us-east-1)
#
# Optional env vars:
#   INVALIDATION_PATHS   — Space-separated paths to invalidate (default: /*)
#   CDN_INVALIDATE_DRY_RUN — Set to "true" to skip actual AWS call

set -euo pipefail

# ─── Defaults ─────────────────────────────────────────────────────────────────

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
PATHS="${INVALIDATION_PATHS:-/*}"
DRY_RUN="${CDN_INVALIDATE_DRY_RUN:-false}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="logs/cdn-invalidation-$(date -u +"%Y%m%d-%H%M%S").log"

# ─── Parse args ───────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --paths)
      PATHS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ─── Validate ─────────────────────────────────────────────────────────────────

if [[ -z "${AWS_DISTRIBUTION_ID:-}" ]]; then
  echo "❌ AWS_DISTRIBUTION_ID is not set. Export it or add it to GitHub Secrets."
  exit 1
fi

if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Install it: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
  exit 1
fi

# ─── Log setup ────────────────────────────────────────────────────────────────

mkdir -p logs
exec > >(tee -a "$LOG_FILE") 2>&1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NexaSphere CDN Invalidation"
echo "  Time:           $TIMESTAMP"
echo "  Distribution:   $AWS_DISTRIBUTION_ID"
echo "  Region:         $REGION"
echo "  Paths:          $PATHS"
echo "  Dry run:        $DRY_RUN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Build path items ─────────────────────────────────────────────────────────

# Convert space-separated paths to JSON array
PATH_COUNT=0
ITEMS_JSON="["
for p in $PATHS; do
  ITEMS_JSON+="\"$p\","
  ((PATH_COUNT++))
done
ITEMS_JSON="${ITEMS_JSON%,}]"  # Remove trailing comma

echo ""
echo "📋 Paths to invalidate ($PATH_COUNT total):"
for p in $PATHS; do echo "   • $p"; done

# ─── Dry run ──────────────────────────────────────────────────────────────────

if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "🔵 DRY RUN — skipping actual invalidation."
  echo "   Would have run:"
  echo "   aws cloudfront create-invalidation \\"
  echo "     --distribution-id $AWS_DISTRIBUTION_ID \\"
  echo "     --paths $PATHS"
  exit 0
fi

# ─── Create invalidation ──────────────────────────────────────────────────────

echo ""
echo "🚀 Creating CloudFront invalidation..."

CALLER_REF="nexasphere-deploy-$(date -u +%s)"

RESULT=$(aws cloudfront create-invalidation \
  --region "$REGION" \
  --distribution-id "$AWS_DISTRIBUTION_ID" \
  --invalidation-batch "{
    \"Paths\": {
      \"Quantity\": $PATH_COUNT,
      \"Items\": $ITEMS_JSON
    },
    \"CallerReference\": \"$CALLER_REF\"
  }" \
  --output json)

INVALIDATION_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Invalidation']['Id'])")
STATUS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Invalidation']['Status'])")

echo "✅ Invalidation created:"
echo "   ID:     $INVALIDATION_ID"
echo "   Status: $STATUS"
echo ""

# ─── Wait for completion (optional) ──────────────────────────────────────────

WAIT="${CDN_INVALIDATE_WAIT:-false}"
if [[ "$WAIT" == "true" ]]; then
  echo "⏳ Waiting for invalidation to complete (can take 1-5 minutes)..."
  aws cloudfront wait invalidation-completed \
    --distribution-id "$AWS_DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"
  echo "✅ Invalidation completed."
fi

# ─── Verify (spot-check one path) ─────────────────────────────────────────────

CF_DOMAIN="${CLOUDFRONT_DOMAIN:-}"
if [[ -n "$CF_DOMAIN" ]]; then
  echo ""
  echo "🔎 Spot-checking cache state via x-cache header..."
  sleep 3
  HEADERS=$(curl -sI "https://${CF_DOMAIN}/assets/" 2>/dev/null || true)
  X_CACHE=$(echo "$HEADERS" | grep -i "x-cache" | head -1 || echo "  x-cache: (not found)")
  echo "   $X_CACHE"
  echo "   (Expected: 'RefreshHit' or 'Miss from cloudfront' immediately after invalidation)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Invalidation complete. Log saved to: $LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
