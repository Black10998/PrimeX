#!/bin/bash

# PrimeX IPTV - Admin Management JS Test
# Verifies that admin-management.js can load correctly

echo "🧪 Testing Admin Management JavaScript"
echo "======================================"
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

echo "Test 1: Check script loading order"
echo "----------------------------------"

# Get line numbers
CORE_LINE=$(grep -n "script src=\"js/core.js\"" public/admin/enterprise-panel.html | cut -d: -f1)
ADMIN_MGMT_LINE=$(grep -n "script src=\"js/admin-management.js\"" public/admin/enterprise-panel.html | cut -d: -f1)

if [ -z "$CORE_LINE" ]; then
    fail "core.js not found in enterprise-panel.html"
elif [ -z "$ADMIN_MGMT_LINE" ]; then
    fail "admin-management.js not found in enterprise-panel.html"
elif [ "$CORE_LINE" -lt "$ADMIN_MGMT_LINE" ]; then
    pass "core.js loads before admin-management.js (line $CORE_LINE < $ADMIN_MGMT_LINE)"
else
    fail "core.js loads AFTER admin-management.js (line $CORE_LINE > $ADMIN_MGMT_LINE)"
fi
echo ""

echo "Test 2: Check Core alias exists"
echo "-------------------------------"

if grep -q "const Core = PrimeXCore" public/admin/js/core.js; then
    pass "Core alias defined in core.js"
else
    fail "Core alias not found in core.js"
fi
echo ""

echo "Test 3: Check required methods exist"
echo "------------------------------------"

METHODS=("apiCall" "apiRequest" "showLoading" "hideLoading" "showToast" "closeModal" "debounce" "escapeHtml" "formatDate")

for method in "${METHODS[@]}"; do
    if grep -q "$method" public/admin/js/core.js; then
        pass "$method() exists in core.js"
    else
        fail "$method() not found in core.js"
    fi
done
echo ""

echo "Test 4: Check admin-management.js uses Core"
echo "------------------------------------------"

if grep -q "Core\." public/admin/js/admin-management.js; then
    pass "admin-management.js uses Core methods"
else
    fail "admin-management.js doesn't use Core"
fi

if grep -q "Core.apiRequest" public/admin/js/admin-management.js; then
    pass "admin-management.js uses Core.apiRequest"
else
    fail "admin-management.js doesn't use Core.apiRequest"
fi
echo ""

echo "Test 5: Check admin-management module structure"
echo "----------------------------------------------"

if grep -q "const AdminManagement = {" public/admin/js/admin-management.js; then
    pass "AdminManagement object defined"
else
    fail "AdminManagement object not found"
fi

if grep -q "title: 'Admin Management'" public/admin/js/admin-management.js; then
    pass "AdminManagement has title property"
else
    fail "AdminManagement missing title property"
fi

if grep -q "async render()" public/admin/js/admin-management.js; then
    pass "AdminManagement has render() method"
else
    fail "AdminManagement missing render() method"
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
    echo "Admin Management JavaScript is properly configured:"
    echo "1. ✅ core.js loads before admin-management.js"
    echo "2. ✅ Core alias exists for backward compatibility"
    echo "3. ✅ All required methods present"
    echo "4. ✅ admin-management.js uses Core correctly"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push changes"
    echo "2. Deploy to server"
    echo "3. Clear browser cache"
    echo "4. Test Admin Management page"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed.${NC}"
    exit 1
fi
