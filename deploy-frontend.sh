#!/bin/bash

# PrimeX IPTV - Frontend Deployment Script
# Developer: PAX
# This script deploys the frontend fix to the VPS

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║         PrimeX IPTV - Frontend Deployment             ║"
echo "║                  Developer: PAX                        ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-prime-x.live}"
VPS_PATH="${VPS_PATH:-/var/www/PrimeX}"
PM2_APP_NAME="${PM2_APP_NAME:-primex-iptv}"

echo "📋 Deployment Configuration:"
echo "   VPS User: $VPS_USER"
echo "   VPS Host: $VPS_HOST"
echo "   VPS Path: $VPS_PATH"
echo "   PM2 App: $PM2_APP_NAME"
echo ""

# Check if we have SSH access
echo "🔍 Checking SSH access..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_USER@$VPS_HOST" exit 2>/dev/null; then
    echo "❌ Cannot connect to VPS via SSH"
    echo ""
    echo "Please ensure:"
    echo "  1. SSH key is configured"
    echo "  2. VPS_USER and VPS_HOST are correct"
    echo "  3. You have access to the server"
    echo ""
    echo "Manual deployment instructions:"
    echo "  1. SSH to VPS: ssh $VPS_USER@$VPS_HOST"
    echo "  2. Navigate: cd $VPS_PATH"
    echo "  3. Pull changes: git pull origin main"
    echo "  4. Restart PM2: pm2 restart $PM2_APP_NAME"
    echo ""
    exit 1
fi

echo "✅ SSH access confirmed"
echo ""

# Deploy via git pull
echo "📦 Deploying frontend fix..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
set -e

cd /var/www/PrimeX

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔍 Verifying fix is present..."
if grep -q "parseInt(formData.get('plan_id'))" public/admin/dashboard-v2.js; then
    echo "✅ Frontend fix verified in dashboard-v2.js"
else
    echo "⚠️  Warning: Fix not found in file. Check git pull output."
fi

echo "🔄 Restarting PM2..."
pm2 restart primex-iptv

echo "📊 PM2 Status:"
pm2 status primex-iptv

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║              ✅ DEPLOYMENT SUCCESSFUL ✅               ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "   1. Clear browser cache (Ctrl+Shift+Delete)"
echo "   2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)"
echo "   3. Login to https://prime-x.live"
echo "   4. Test code generation"
echo ""
echo "🔍 Verification:"
echo "   - Open DevTools (F12)"
echo "   - Network tab → Generate codes"
echo "   - Check payload shows: {\"count\":1,\"plan_id\":4}"
echo "   - Numbers, not strings!"
echo ""
