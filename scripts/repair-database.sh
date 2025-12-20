#!/bin/bash

###############################################################################
# PrimeX IPTV - Database Repair Script
# 
# This script safely repairs and verifies the database configuration
# 
# What it does:
# 1. Verifies MySQL is running
# 2. Checks if primex database exists
# 3. Verifies/recreates primex_user with correct privileges
# 4. Tests database connection
# 5. Verifies all required tables exist
# 6. Confirms .env configuration matches database
#
# Developer: PAX
# Support: info@paxdes.com
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║         PrimeX IPTV - Database Repair Script          ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Step 1: Check MySQL Service
###############################################################################
echo -e "${YELLOW}[1/7] Checking MySQL service...${NC}"

if ! systemctl is-active --quiet mysql 2>/dev/null && ! systemctl is-active --quiet mariadb 2>/dev/null; then
    echo -e "${RED}❌ MySQL/MariaDB service is not running${NC}"
    echo -e "${YELLOW}   Attempting to start MySQL...${NC}"
    
    if sudo systemctl start mysql 2>/dev/null || sudo systemctl start mariadb 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL service started${NC}"
    else
        echo -e "${RED}❌ Failed to start MySQL service${NC}"
        echo -e "${YELLOW}   Please start MySQL manually and run this script again${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ MySQL service is running${NC}"
fi

###############################################################################
# Step 2: Load Environment Configuration
###############################################################################
echo -e "\n${YELLOW}[2/7] Loading environment configuration...${NC}"

ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found at: $ENV_FILE${NC}"
    echo -e "${YELLOW}   Creating .env from production template...${NC}"
    
    if [ -f "$PROJECT_ROOT/.env.production" ]; then
        cp "$PROJECT_ROOT/.env.production" "$ENV_FILE"
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: You must edit .env and set your actual passwords!${NC}"
        echo -e "${YELLOW}   Required fields: DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_PASSWORD${NC}"
        echo ""
        read -p "Press Enter after you've updated the .env file..."
    else
        echo -e "${RED}❌ .env.production template not found${NC}"
        exit 1
    fi
fi

# Source .env file
set -a
source "$ENV_FILE"
set +a

echo -e "${GREEN}✅ Environment configuration loaded${NC}"
echo -e "   Database: ${DB_NAME}"
echo -e "   User: ${DB_USER}"
echo -e "   Host: ${DB_HOST}:${DB_PORT}"

###############################################################################
# Step 3: Verify Database Exists
###############################################################################
echo -e "\n${YELLOW}[3/7] Verifying database exists...${NC}"

# Check if we can connect as root
if ! mysql -u root -p"${DB_PASSWORD}" -e "SELECT 1" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Cannot connect as root with provided password${NC}"
    echo -e "${YELLOW}   Attempting connection without password...${NC}"
    
    if mysql -u root -e "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✅ Connected as root (no password)${NC}"
        MYSQL_ROOT_CMD="mysql -u root"
    else
        echo -e "${RED}❌ Cannot connect to MySQL as root${NC}"
        echo -e "${YELLOW}   Please provide MySQL root password:${NC}"
        read -s MYSQL_ROOT_PASSWORD
        MYSQL_ROOT_CMD="mysql -u root -p${MYSQL_ROOT_PASSWORD}"
        
        if ! $MYSQL_ROOT_CMD -e "SELECT 1" &>/dev/null; then
            echo -e "${RED}❌ Invalid root password${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Connected as root${NC}"
    fi
else
    echo -e "${GREEN}✅ Connected as root${NC}"
    MYSQL_ROOT_CMD="mysql -u root -p${DB_PASSWORD}"
fi

# Check if database exists
if $MYSQL_ROOT_CMD -e "USE ${DB_NAME}" &>/dev/null; then
    echo -e "${GREEN}✅ Database '${DB_NAME}' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database '${DB_NAME}' does not exist${NC}"
    echo -e "${YELLOW}   Creating database...${NC}"
    
    $MYSQL_ROOT_CMD <<EOF
CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    
    echo -e "${GREEN}✅ Database '${DB_NAME}' created${NC}"
fi

###############################################################################
# Step 4: Verify/Create Database User
###############################################################################
echo -e "\n${YELLOW}[4/7] Verifying database user...${NC}"

# Check if user exists
USER_EXISTS=$($MYSQL_ROOT_CMD -sse "SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = '${DB_USER}' AND host = 'localhost')")

if [ "$USER_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  User '${DB_USER}' exists - updating password and privileges...${NC}"
    
    $MYSQL_ROOT_CMD <<EOF
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo -e "${GREEN}✅ User '${DB_USER}' updated${NC}"
else
    echo -e "${YELLOW}⚠️  User '${DB_USER}' does not exist${NC}"
    echo -e "${YELLOW}   Creating user...${NC}"
    
    $MYSQL_ROOT_CMD <<EOF
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo -e "${GREEN}✅ User '${DB_USER}' created with full privileges${NC}"
fi

###############################################################################
# Step 5: Test Database Connection
###############################################################################
echo -e "\n${YELLOW}[5/7] Testing database connection...${NC}"

if mysql -u "${DB_USER}" -p"${DB_PASSWORD}" -h "${DB_HOST}" -P "${DB_PORT}" "${DB_NAME}" -e "SELECT 1" &>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}   Credentials in .env may not match database${NC}"
    exit 1
fi

###############################################################################
# Step 6: Verify Required Tables
###############################################################################
echo -e "\n${YELLOW}[6/7] Verifying database tables...${NC}"

REQUIRED_TABLES=(
    "admins"
    "users"
    "subscription_plans"
    "subscription_codes"
    "channels"
    "categories"
    "servers"
    "user_devices"
    "notifications"
    "security_events"
    "blocked_ips"
)

MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    if mysql -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "DESCRIBE ${table}" &>/dev/null; then
        echo -e "${GREEN}   ✓ ${table}${NC}"
    else
        echo -e "${RED}   ✗ ${table} (missing)${NC}"
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required tables exist${NC}"
else
    echo -e "${YELLOW}⚠️  Missing ${#MISSING_TABLES[@]} tables${NC}"
    echo -e "${YELLOW}   These will be created automatically on server startup${NC}"
fi

###############################################################################
# Step 7: Verify .env Configuration
###############################################################################
echo -e "\n${YELLOW}[7/7] Verifying .env configuration...${NC}"

ISSUES=0

# Check required variables
if [ -z "$DB_HOST" ]; then
    echo -e "${RED}   ✗ DB_HOST is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ DB_HOST: ${DB_HOST}${NC}"
fi

if [ -z "$DB_PORT" ]; then
    echo -e "${RED}   ✗ DB_PORT is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ DB_PORT: ${DB_PORT}${NC}"
fi

if [ -z "$DB_NAME" ]; then
    echo -e "${RED}   ✗ DB_NAME is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ DB_NAME: ${DB_NAME}${NC}"
fi

if [ -z "$DB_USER" ]; then
    echo -e "${RED}   ✗ DB_USER is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ DB_USER: ${DB_USER}${NC}"
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}   ✗ DB_PASSWORD is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ DB_PASSWORD: [set]${NC}"
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "generate_64_character_secret_here" ]; then
    echo -e "${RED}   ✗ JWT_SECRET is not set or using default${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ JWT_SECRET: [set]${NC}"
fi

if [ -z "$JWT_REFRESH_SECRET" ] || [ "$JWT_REFRESH_SECRET" = "generate_another_64_character_secret_here" ]; then
    echo -e "${RED}   ✗ JWT_REFRESH_SECRET is not set or using default${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ JWT_REFRESH_SECRET: [set]${NC}"
fi

if [ -z "$ADMIN_USERNAME" ]; then
    echo -e "${RED}   ✗ ADMIN_USERNAME is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ ADMIN_USERNAME: ${ADMIN_USERNAME}${NC}"
fi

if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "ChangeThisImmediately123!" ]; then
    echo -e "${RED}   ✗ ADMIN_PASSWORD is not set or using default${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ ADMIN_PASSWORD: [set]${NC}"
fi

if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}   ✗ ADMIN_EMAIL is not set${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}   ✓ ADMIN_EMAIL: ${ADMIN_EMAIL}${NC}"
fi

if [ $ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found ${ISSUES} configuration issues${NC}"
    echo -e "${YELLOW}   Please update .env file with correct values${NC}"
else
    echo -e "${GREEN}✅ .env configuration is valid${NC}"
fi

###############################################################################
# Summary
###############################################################################
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║                  Repair Complete                       ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Database configuration is correct${NC}"
    echo -e "${GREEN}✅ User '${DB_USER}' has proper privileges${NC}"
    echo -e "${GREEN}✅ Database connection verified${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Restart PM2: ${BLUE}pm2 restart primex-iptv${NC}"
    echo -e "  2. Check logs: ${BLUE}pm2 logs primex-iptv --lines 50${NC}"
    echo -e "  3. Test admin login at your admin panel URL"
    echo ""
    echo -e "${GREEN}The system should now work correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  Please fix the configuration issues above${NC}"
    echo -e "${YELLOW}   Edit: ${ENV_FILE}${NC}"
    echo -e "${YELLOW}   Then run this script again${NC}"
fi

echo ""
