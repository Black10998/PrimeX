#!/bin/bash

# PrimeX IPTV - Admin Management Access Test
# Verifies Super Admin can access admin management endpoints

echo "🧪 Testing Admin Management Access"
echo "==================================="
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

echo "Test 1: Check RBAC middleware checks req.admin"
echo "----------------------------------------------"

if grep -q "req.admin?.role || req.user?.role" src/middleware/rbac.js; then
    pass "RBAC checks req.admin first, then req.user"
else
    fail "RBAC doesn't check req.admin properly"
fi

if grep -q "hasReqAdmin: !!req.admin" src/middleware/rbac.js; then
    pass "RBAC logs req.admin presence for debugging"
else
    fail "RBAC doesn't log req.admin"
fi
echo ""

echo "Test 2: Check auth.middleware sets req.user"
echo "-------------------------------------------"

if grep -q "req.user = {" src/middleware/auth.middleware.js; then
    pass "auth.middleware.js sets req.user"
else
    fail "auth.middleware.js doesn't set req.user"
fi

if grep -q "role: admins\[0\].role" src/middleware/auth.middleware.js; then
    pass "auth.middleware.js includes role in req.user"
else
    fail "auth.middleware.js doesn't include role"
fi
echo ""

echo "Test 3: Check permissions endpoint"
echo "----------------------------------"

if grep -q "req.admin?.role || req.user?.role" src/controllers/adminManagementController.js; then
    pass "Permissions endpoint checks req.admin first"
else
    fail "Permissions endpoint doesn't check req.admin"
fi
echo ""

echo "Test 4: Check admin management UI CSS"
echo "------------------------------------"

CSS_CLASSES=("module-container" "module-header" "filters-bar" "filter-select" "action-buttons" "pagination" "badge")

for class in "${CSS_CLASSES[@]}"; do
    if grep -q "\.$class" public/admin/enterprise-panel.css; then
        pass ".$class exists in CSS"
    else
        fail ".$class not found in CSS"
    fi
done
echo ""

echo "Test 5: Check badge styles"
echo "-------------------------"

BADGE_TYPES=("badge-primary" "badge-success" "badge-warning" "badge-danger" "badge-info" "badge-secondary")

for badge in "${BADGE_TYPES[@]}"; do
    if grep -q "\.$badge" public/admin/enterprise-panel.css; then
        pass ".$badge style exists"
    else
        fail ".$badge style not found"
    fi
done
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
    echo "Admin Management is properly configured:"
    echo "1. ✅ RBAC checks req.admin first"
    echo "2. ✅ auth.middleware sets req.user with role"
    echo "3. ✅ Permissions endpoint checks req.admin"
    echo "4. ✅ All UI CSS classes present"
    echo "5. ✅ All badge styles defined"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push changes"
    echo "2. Deploy to server"
    echo "3. Clear browser cache"
    echo "4. Test Super Admin access"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed.${NC}"
    exit 1
fi
