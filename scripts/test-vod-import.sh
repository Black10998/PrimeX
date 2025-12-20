#!/bin/bash

###############################################################################
# Test VOD Import Endpoint
# Tests the /api/v1/admin/vod/import-m3u endpoint
###############################################################################

echo "🧪 Testing VOD Import Endpoint"
echo ""

# Get admin token (you'll need to replace with actual token)
TOKEN="${ADMIN_TOKEN:-your_admin_token_here}"

if [ "$TOKEN" = "your_admin_token_here" ]; then
    echo "⚠️  Please set ADMIN_TOKEN environment variable"
    echo "   Example: export ADMIN_TOKEN='your_token'"
    exit 1
fi

# Test M3U URL
M3U_URL="https://raw.githubusercontent.com/jromero88/iptv/master/VOD.m3u"

echo "Testing with URL: $M3U_URL"
echo ""

# Test Movies Import
echo "1️⃣  Testing Movies Import..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/v1/admin/vod/import-m3u \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"m3u_url\": \"$M3U_URL\",
    \"content_type\": \"movie\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Movies import test passed"
else
    echo "❌ Movies import test failed"
fi

echo ""
echo "2️⃣  Testing Series Import..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/v1/admin/vod/import-m3u \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"m3u_url\": \"$M3U_URL\",
    \"content_type\": \"series\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Series import test passed"
else
    echo "❌ Series import test failed"
fi

echo ""
echo "Done!"
