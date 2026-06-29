#!/bin/bash
# Certificate renewal script - intended to be run as a cron job
# ./cert-renew.sh
# Add to crontab: 0 3 * * * /path/to/cert-renew.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Renew certificates
docker compose -f docker-compose.ssl.yml run --rm certbot renew --webroot -w /var/www/certbot --quiet

# Reload nginx to pick up new certificates
docker compose -f docker-compose.ssl.yml exec nginx-ssl nginx -s reload

echo "Certificate renewal check completed at $(date)"
