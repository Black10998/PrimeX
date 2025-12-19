#!/bin/bash

# ============================================
# PrimeX IPTV v11.0 - Automated Setup Script
# ============================================
# Zero-configuration deployment
# Developer: PAX | info@paxdes.com
# ============================================

set -e  # Exit on any error

echo "============================================"
echo "  PrimeX IPTV v11.0 - Auto Setup"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Install Node.js 18+ first: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed${NC}"
    echo "Install MySQL 8.0+ first"
    exit 1
fi
echo -e "${GREEN}✓ MySQL installed${NC}"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 not found, installing...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 installed${NC}"

echo ""

# ============================================
# Step 2: Install Dependencies
# ============================================
echo -e "${YELLOW}[2/8] Installing Node.js dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ============================================
# Step 3: Generate Secure Secrets
# ============================================
echo -e "${YELLOW}[3/8] Generating secure secrets...${NC}"

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
ADMIN_PASSWORD="Admin@PrimeX$(date +%Y)"

echo -e "${GREEN}✓ Secrets generated${NC}"
echo ""

# ============================================
# Step 4: Create .env File
# ============================================
echo -e "${YELLOW}[4/8] Creating production .env file...${NC}"

cat > .env << EOF
# ============================================
# PrimeX IPTV v11.0 - Production Configuration
# ============================================
# Auto-generated on $(date)
# ============================================

NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=primex
DB_USER=primex_user
DB_PASSWORD=${DB_PASSWORD}

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Admin Account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=info@paxdes.com

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# System
DEFAULT_LANGUAGE=en
ENABLE_DEVICE_BINDING=true
MAX_DEVICES_PER_USER=1
SUPPORT_EMAIL=info@paxdes.com

# API
API_PREFIX=/api/v1
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# ============================================
# Step 5: Setup MySQL Database
# ============================================
echo -e "${YELLOW}[5/8] Setting up MySQL database...${NC}"

# Prompt for MySQL root password
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Create database and user
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" << MYSQL_SCRIPT
-- Create database
DROP DATABASE IF EXISTS primex;
CREATE DATABASE primex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
DROP USER IF EXISTS 'primex_user'@'localhost';
CREATE USER 'primex_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON primex.* TO 'primex_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Database and user created successfully' AS Status;
MYSQL_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${RED}❌ Database creation failed${NC}"
    exit 1
fi
echo ""

# ============================================
# Step 6: Initialize Database Schema
# ============================================
echo -e "${YELLOW}[6/8] Initializing database schema...${NC}"

node src/scripts/initDatabase.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${RED}❌ Database initialization failed${NC}"
    exit 1
fi
echo ""

# ============================================
# Step 7: Create Required Directories
# ============================================
echo -e "${YELLOW}[7/8] Creating required directories...${NC}"

mkdir -p logs
mkdir -p uploads
chmod 755 logs uploads

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# ============================================
# Step 8: Start Application with PM2
# ============================================
echo -e "${YELLOW}[8/8] Starting application with PM2...${NC}"

# Stop if already running
pm2 stop primex-iptv 2>/dev/null || true
pm2 delete primex-iptv 2>/dev/null || true

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup | tail -n 1 | bash

echo -e "${GREEN}✓ Application started${NC}"
echo ""

# ============================================
# Setup Complete
# ============================================
echo "============================================"
echo -e "${GREEN}  ✓ Setup Complete!${NC}"
echo "============================================"
echo ""
echo "📋 System Information:"
echo "   • Version: v11.0.0"
echo "   • Port: 3000"
echo "   • Database: primex"
echo ""
echo "🔐 Admin Credentials:"
echo "   • Username: admin"
echo "   • Password: ${ADMIN_PASSWORD}"
echo "   • Email: info@paxdes.com"
echo ""
echo "🌐 Access URLs:"
echo "   • Admin Panel: http://$(hostname -I | awk '{print $1}'):3000"
echo "   • Health Check: http://$(hostname -I | awk '{print $1}'):3000/health"
echo ""
echo "📊 PM2 Commands:"
echo "   • View logs: pm2 logs primex-iptv"
echo "   • Restart: pm2 restart primex-iptv"
echo "   • Stop: pm2 stop primex-iptv"
echo "   • Monitor: pm2 monit"
echo ""
echo "⚠️  IMPORTANT:"
echo "   • Save your admin password: ${ADMIN_PASSWORD}"
echo "   • Configure firewall to allow port 3000"
echo "   • Setup SSL/HTTPS for production"
echo ""
echo "============================================"
echo ""

# Show application status
pm2 status

echo ""
echo -e "${GREEN}🎉 PrimeX IPTV v11.0 is now running!${NC}"
echo ""
