#!/usr/bin/env bash
# setup-cdn-cost-alert.sh
# Creates an AWS billing alert for CloudFront spend.
# Run once after initial CloudFront provisioning.
#
# Usage:
#   export AWS_ACCESS_KEY_ID=...
#   export AWS_SECRET_ACCESS_KEY=...
#   bash scripts/setup-cdn-cost-alert.sh --email your@email.com --threshold 10

set -euo pipefail

THRESHOLD="${COST_THRESHOLD:-10}"
EMAIL=""
REGION="us-east-1"  # Billing alerts must be in us-east-1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email) EMAIL="$2"; shift 2 ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if [[ -z "$EMAIL" ]]; then
  echo "❌ --email is required"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NexaSphere CDN Cost Alert Setup"
echo "  Threshold: \$$THRESHOLD / month"
echo "  Alert email: $EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Create SNS topic for billing alerts ───────────────────────────────────

echo ""
echo "1️⃣  Creating SNS topic..."
TOPIC_ARN=$(aws sns create-topic \
  --name nexasphere-cdn-billing-alert \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)
echo "   Topic ARN: $TOPIC_ARN"

# Subscribe email to topic
aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$EMAIL" \
  --region "$REGION" \
  --output text > /dev/null
echo "   ✅ Subscribed $EMAIL — check your inbox to confirm!"

# ─── 2. Create CloudWatch billing alarm ──────────────────────────────────────

echo ""
echo "2️⃣  Creating CloudWatch billing alarm..."

# CloudFront estimated charges metric
aws cloudwatch put-metric-alarm \
  --alarm-name "NexaSphere-CDN-Monthly-Spend-Over-\$${THRESHOLD}" \
  --alarm-description "Alert when NexaSphere CloudFront monthly cost exceeds \$$THRESHOLD" \
  --namespace "AWS/Billing" \
  --metric-name "EstimatedCharges" \
  --dimensions "Name=ServiceName,Value=AmazonCloudFront" \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold "$THRESHOLD" \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions "$TOPIC_ARN" \
  --region "$REGION"

echo "   ✅ Alarm created: NexaSphere-CDN-Monthly-Spend-Over-\$$THRESHOLD"

# ─── 3. Create AWS Budget ─────────────────────────────────────────────────────

echo ""
echo "3️⃣  Creating AWS Budget..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
YEAR=$(date +%Y)
MONTH=$(date +%m)

aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "{
    \"BudgetName\": \"NexaSphere-CDN-Monthly\",
    \"BudgetLimit\": {
      \"Amount\": \"$THRESHOLD\",
      \"Unit\": \"USD\"
    },
    \"TimeUnit\": \"MONTHLY\",
    \"TimePeriod\": {
      \"Start\": \"${YEAR}-${MONTH}-01T00:00:00Z\",
      \"End\": \"2087-06-15T00:00:00Z\"
    },
    \"BudgetType\": \"COST\",
    \"CostFilters\": {
      \"Service\": [\"Amazon CloudFront\"],
      \"TagKeyValue\": [\"user:Project\$NexaSphere\"]
    }
  }" \
  --notifications-with-subscribers "[
    {
      \"Notification\": {
        \"NotificationType\": \"ACTUAL\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 80,
        \"ThresholdType\": \"PERCENTAGE\",
        \"NotificationState\": \"ALARM\"
      },
      \"Subscribers\": [
        {
          \"SubscriptionType\": \"EMAIL\",
          \"Address\": \"$EMAIL\"
        }
      ]
    }
  ]"

echo "   ✅ Budget created: NexaSphere-CDN-Monthly (\$$THRESHOLD/month)"

# ─── 4. Enable Cost Allocation Tags ──────────────────────────────────────────

echo ""
echo "4️⃣  Activating cost allocation tags..."
aws ce create-cost-category-definition \
  --name "NexaSphere-CDN" \
  --rule-version "CostCategoryExpression.v1" \
  --rules "[
    {
      \"Value\": \"CDN\",
      \"Rule\": {
        \"Tags\": {
          \"Key\": \"Component\",
          \"Values\": [\"CDN\"],
          \"MatchOptions\": [\"EQUALS\"]
        }
      }
    }
  ]" 2>/dev/null || echo "   ℹ️  Cost category may already exist — skipping."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Cost tracking setup complete!"
echo ""
echo "  What was configured:"
echo "  • SNS topic: nexasphere-cdn-billing-alert"
echo "  • CloudWatch alarm: fires when CDN > \$$THRESHOLD/month"
echo "  • AWS Budget: monthly cap \$$THRESHOLD with 80% warning"
echo "  • Cost allocation tag: Project=NexaSphere, Component=CDN"
echo ""
echo "  ⚠️  Check your email to confirm the SNS subscription."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
