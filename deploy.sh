#!/bin/bash

# ============================================
# PrimeX IPTV v11.0 - One-Command Deployment
# ============================================
# Usage: ./deploy.sh
# ============================================

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   PrimeX IPTV v11.0 Deployment         ║"
echo "║   Developer: PAX | paxdes.com          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please do not run as root"
    exit 1
fi

# Run auto-setup
if [ -f "./auto-setup.sh" ]; then
    ./auto-setup.sh
else
    echo "❌ auto-setup.sh not found"
    exit 1
fi
