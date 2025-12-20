#!/bin/bash

# PrimeX IPTV - RBAC Testing Script
# Tests role-based access control implementation

echo "🧪 PrimeX IPTV - RBAC Testing Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
ADMIN_TOKEN=""
SELLER_TOKEN=""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Test 1: Check database migration
echo "Test 1: Database Migration"
echo "--------------------------"
ROLE_CHECK=$(mysql -u primex_user -pprimex_password primex_db -se "SHOW COLUMNS FROM admin_users LIKE 'role'" 2>/dev/null | grep -c "codes_seller")

if [ "$ROLE_CHECK" -eq 1 ]; then
    pass "codes_seller role exists in database"
else
    fail "codes_seller role not found in database"
    info "Run: mysql -u primex_user -p primex_db < migrations/add_codes_seller_role.sql"
fi
echo ""

# Test 2: Check RBAC middleware exists
echo "Test 2: RBAC Middleware"
echo "----------------------"
if [ -f "src/middleware/rbac.js" ]; then
    pass "RBAC middleware file exists"
    
    # Check for key functions
    if grep -q "checkModuleAccess" src/middleware/rbac.js; then
        pass "checkModuleAccess function found"
    else
        fail "checkModuleAccess function not found"
    fi
    
    if grep -q "codes_seller" src/middleware/rbac.js; then
        pass "codes_seller role defined in permissions"
    else
        fail "codes_seller role not defined in permissions"
    fi
else
    fail "RBAC middleware file not found"
fi
echo ""

# Test 3: Check admin management controller
echo "Test 3: Admin Management Controller"
echo "-----------------------------------"
if [ -f "src/controllers/adminManagementController.js" ]; then
    pass "Admin management controller exists"
else
    fail "Admin management controller not found"
fi
echo ""

# Test 4: Check frontend files
echo "Test 4: Frontend Files"
echo "----------------------"
if [ -f "public/admin/js/admin-management.js" ]; then
    pass "Admin management JS exists"
else
    fail "Admin management JS not found"
fi

if [ -f "public/admin/templates/admin-management.html" ]; then
    pass "Admin management template exists"
else
    fail "Admin management template not found"
fi

if grep -q "admin-management" public/admin/enterprise-panel.html; then
    pass "Admin management linked in main panel"
else
    fail "Admin management not linked in main panel"
fi
echo ""

# Test 5: Check routes protection
echo "Test 5: Routes Protection"
echo "------------------------"
if grep -q "checkModuleAccess('codes')" src/routes/index.js; then
    pass "Codes routes protected with RBAC"
else
    fail "Codes routes not protected"
fi

if grep -q "checkModuleAccess('users')" src/routes/index.js; then
    pass "Users routes protected with RBAC"
else
    fail "Users routes not protected"
fi

if grep -q "requireSuperAdmin" src/routes/index.js; then
    pass "Admin management requires super admin"
else
    fail "Admin management not properly protected"
fi
echo ""

# Test 6: Check header icons consistency
echo "Test 6: Header Icons Consistency"
echo "--------------------------------"
if grep -q "width: 40px" public/admin/enterprise-panel.css && \
   grep -q "height: 40px" public/admin/enterprise-panel.css && \
   grep -q "border-radius: 8px" public/admin/enterprise-panel.css; then
    pass "Header icons have consistent sizing"
else
    fail "Header icons sizing inconsistent"
fi

if grep -q "margin-left: 8px" public/admin/enterprise-panel.css; then
    pass "Header icons have consistent spacing"
else
    fail "Header icons spacing inconsistent"
fi
echo ""

# Test 7: Check Core.js permissions
echo "Test 7: Core.js Permissions"
echo "--------------------------"
if grep -q "loadPermissions" public/admin/js/core.js; then
    pass "Core.js loads permissions"
else
    fail "Core.js doesn't load permissions"
fi

if grep -q "hasPermission" public/admin/js/core.js; then
    pass "Core.js has permission check function"
else
    fail "Core.js missing permission check"
fi

if grep -q "applyPermissions" public/admin/js/core.js; then
    pass "Core.js applies permissions to UI"
else
    fail "Core.js doesn't apply permissions"
fi
echo ""

# Test 8: Check auth service updates
echo "Test 8: Auth Service Updates"
echo "----------------------------"
if grep -q "role: role" src/services/authService.js; then
    pass "Auth service includes role in JWT"
else
    fail "Auth service doesn't include role in JWT"
fi

if grep -q "adminSessionService.createSession" src/services/authService.js; then
    pass "Auth service creates admin sessions"
else
    fail "Auth service doesn't create sessions"
fi
echo ""

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run database migration if not done"
    echo "2. Start the server"
    echo "3. Login as super admin"
    echo "4. Create a codes_seller account"
    echo "5. Test access restrictions"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
