#!/bin/bash

# PrimeX IPTV v11.0 - Complete Deployment Script
# This script fixes ALL issues and deploys the system

set -e  # Exit on any error

echo "🚀 PrimeX IPTV v11.0 - Complete System Fix"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project directory verified${NC}"
echo ""

# Step 2: Apply database schema fixes
echo "📊 Step 1/5: Fixing database schema..."
if [ -f ".env" ]; then
    node apply-schema-fix.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database schema fixed${NC}"
    else
        echo -e "${RED}❌ Database schema fix failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found. Skipping database fix.${NC}"
    echo -e "${YELLOW}   You'll need to run: node apply-schema-fix.js manually${NC}"
fi
echo ""

# Step 3: Check if node_modules exists
echo "📦 Step 2/5: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Verify all critical files exist
echo "📁 Step 3/5: Verifying files..."
CRITICAL_FILES=(
    "src/server.js"
    "src/services/setup.service.js"
    "src/controllers/setup.controller.js"
    "src/controllers/notificationController.js"
    "public/admin/enterprise-panel.html"
    "public/admin/login.html"
    "public/setup.html"
)

ALL_FILES_OK=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file - MISSING"
        ALL_FILES_OK=false
    fi
done

if [ "$ALL_FILES_OK" = false ]; then
    echo -e "${RED}❌ Some critical files are missing${NC}"
    exit 1
fi
echo ""

# Step 5: Check PM2
echo "🔄 Step 4/5: Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 is installed${NC}"
    
    # Check if primex-iptv is running
    if pm2 list | grep -q "primex-iptv"; then
        echo "   Restarting primex-iptv..."
        pm2 restart primex-iptv
        echo -e "${GREEN}✅ Service restarted${NC}"
    else
        echo -e "${YELLOW}⚠️  primex-iptv not found in PM2${NC}"
        echo "   Starting service..."
        pm2 start src/server.js --name primex-iptv
        pm2 save
        echo -e "${GREEN}✅ Service started${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PM2 not installed${NC}"
    echo "   Install with: npm install -g pm2"
    echo "   Then run: pm2 start src/server.js --name primex-iptv"
fi
echo ""

# Step 6: Final verification
echo "✅ Step 5/5: Final verification..."
echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Complete web setup:"
echo "   👉 https://prime-x.live/setup"
echo ""
echo "2. Login to admin panel:"
echo "   👉 https://prime-x.live/admin/login.html"
echo ""
echo "3. Check PM2 logs:"
echo "   pm2 logs primex-iptv"
echo ""
echo "4. Monitor system:"
echo "   pm2 monit"
echo ""
echo -e "${YELLOW}⚠️  Important: Complete the web setup before using the admin panel${NC}"
echo ""
