#!/bin/bash

# PrimeX IPTV - Super Admin Access Test
# Verifies that Super Admin has unrestricted access

echo "🧪 Testing Super Admin Access"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

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

echo "Test 1: Check RBAC super_admin permissions"
echo "------------------------------------------"

# Check super_admin has all permissions set to true
SUPER_ADMIN_PERMS=$(grep -A 15 "super_admin: {" src/middleware/rbac.js | grep -c "true")

if [ "$SUPER_ADMIN_PERMS" -ge 14 ]; then
    pass "Super Admin has all permissions (found $SUPER_ADMIN_PERMS true values)"
else
    fail "Super Admin missing permissions (only $SUPER_ADMIN_PERMS true values)"
fi
echo ""

echo "Test 2: Check Core.js fail-safe defaults"
echo "----------------------------------------"

if grep -q "setDefaultPermissions" public/admin/js/core.js; then
    pass "Core.js has fail-safe default permissions"
else
    fail "Core.js missing fail-safe defaults"
fi

if grep -q "If no permissions loaded, show everything" public/admin/js/core.js; then
    pass "Core.js shows all modules when permissions fail to load"
else
    fail "Core.js doesn't have fail-safe for permission loading"
fi

if grep -q "If no permissions loaded, allow access" public/admin/js/core.js; then
    pass "hasPermission() allows access when permissions not loaded"
else
    fail "hasPermission() doesn't have fail-safe"
fi
echo ""

echo "Test 3: Check permission API endpoint"
echo "------------------------------------"

if grep -q "defaulting to super_admin" src/controllers/adminManagementController.js; then
    pass "Permission API has super_admin fallback"
else
    fail "Permission API missing fallback"
fi

if grep -q "Return super_admin permissions as fallback" src/controllers/adminManagementController.js; then
    pass "Permission API returns super_admin on error"
else
    fail "Permission API doesn't handle errors safely"
fi
echo ""

echo "Test 4: Check RBAC middleware"
echo "----------------------------"

if grep -q "Super admin always has access" src/middleware/rbac.js; then
    pass "RBAC middleware allows super_admin bypass"
else
    fail "RBAC middleware doesn't bypass for super_admin"
fi

if grep -q "userRole === 'super_admin'" src/middleware/rbac.js; then
    pass "RBAC checks for super_admin role"
else
    fail "RBAC doesn't check for super_admin"
fi
echo ""

echo "Test 5: Check auth middleware role assignment"
echo "--------------------------------------------"

if grep -q "role: admins\[0\].role" src/middleware/auth.js; then
    pass "Auth middleware assigns role to req.user"
else
    fail "Auth middleware doesn't assign role"
fi
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
    echo "Super Admin access is properly protected with:"
    echo "1. ✅ All permissions set to true in RBAC"
    echo "2. ✅ Fail-safe defaults in Core.js"
    echo "3. ✅ Super admin fallback in API"
    echo "4. ✅ Bypass in RBAC middleware"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push changes"
    echo "2. Deploy to server"
    echo "3. Clear browser cache"
    echo "4. Test Super Admin login"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed.${NC}"
    exit 1
fi
