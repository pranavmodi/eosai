#!/bin/bash

# 🎯 Click Tracking System Test Script
# This script tests the click tracking implementation

echo "🎯 Testing Click Tracking System"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="https://possibleminds.in"

# Test 1: Basic click tracking with redirect
echo -e "\n${YELLOW}Test 1: Basic Click Tracking (GET with redirect)${NC}"
echo "Testing: GET /.netlify/functions/click-tracking?company_id=test-company&utm_source=test"

response=$(curl -s -I "${BASE_URL}/.netlify/functions/click-tracking?company_id=test-company&utm_source=test")
status_code=$(echo "$response" | grep -o "HTTP/[0-9.]* [0-9]*" | grep -o "[0-9]*$")
location=$(echo "$response" | grep -i "location:" | cut -d' ' -f2- | tr -d '\r')

if [ "$status_code" = "302" ]; then
    echo -e "${GREEN}✅ Redirect successful (302)${NC}"
    echo -e "   Redirected to: ${location}"
else
    echo -e "${RED}❌ Expected 302, got ${status_code}${NC}"
fi

# Test 2: Full UTM parameters
echo -e "\n${YELLOW}Test 2: Full UTM Parameters${NC}"
echo "Testing: Full UTM parameter set"

full_url="${BASE_URL}/.netlify/functions/click-tracking?company_id=acme-corp&utm_source=email&utm_medium=outreach&utm_campaign=deep_research&utm_content=strategic_analysis&company=Acme%20Corp&recipient=john_doe&campaign_id=123&tracking_id=tr_abc123"

response=$(curl -s -I "$full_url")
status_code=$(echo "$response" | grep -o "HTTP/[0-9.]* [0-9]*" | grep -o "[0-9]*$")
location=$(echo "$response" | grep -i "location:" | cut -d' ' -f2- | tr -d '\r')

if [ "$status_code" = "302" ]; then
    echo -e "${GREEN}✅ Full UTM tracking successful${NC}"
    echo -e "   Redirected to: ${location}"
else
    echo -e "${RED}❌ Expected 302, got ${status_code}${NC}"
fi

# Test 3: Direct POST tracking
echo -e "\n${YELLOW}Test 3: Direct POST Tracking${NC}"
echo "Testing: POST /.netlify/functions/click-tracking"

post_data='{
  "company_slug": "test-company",
  "utm_source": "email",
  "utm_medium": "outreach",
  "utm_campaign": "deep_research",
  "recipient": "john_doe",
  "campaign_id": "123",
  "tracking_id": "tr_abc123"
}'

response=$(curl -s -X POST "${BASE_URL}/.netlify/functions/click-tracking" \
  -H "Content-Type: application/json" \
  -d "$post_data")

if echo "$response" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Direct tracking successful${NC}"
    echo -e "   Response: $(echo "$response" | jq -r '.message // .error // .')"
else
    echo -e "${RED}❌ Direct tracking failed${NC}"
    echo -e "   Response: $response"
fi

# Test 4: Error handling - missing parameters
echo -e "\n${YELLOW}Test 4: Error Handling${NC}"
echo "Testing: Missing required parameters"

response=$(curl -s -I "${BASE_URL}/.netlify/functions/click-tracking?utm_source=test")
status_code=$(echo "$response" | grep -o "HTTP/[0-9.]* [0-9]*" | grep -o "[0-9]*$")

if [ "$status_code" = "400" ]; then
    echo -e "${GREEN}✅ Error handling working (400 for missing params)${NC}"
else
    echo -e "${YELLOW}⚠️  Expected 400, got ${status_code} (may redirect to /reports on error)${NC}"
fi

# Test 5: Check report exists
echo -e "\n${YELLOW}Test 5: Report Accessibility${NC}"
echo "Testing: Can access report after click tracking"

response=$(curl -s -I "${BASE_URL}/reports/test-company")
status_code=$(echo "$response" | grep -o "HTTP/[0-9.]* [0-9]*" | grep -o "[0-9]*$")

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ Report accessible${NC}"
elif [ "$status_code" = "404" ]; then
    echo -e "${YELLOW}⚠️  Report not found (404) - Create a test report first${NC}"
else
    echo -e "${RED}❌ Unexpected status: ${status_code}${NC}"
fi

# Test 6: Analytics webhook (if configured)
echo -e "\n${YELLOW}Test 6: Analytics Configuration${NC}"
echo "Checking if environment variables are set..."

# This would need to be run in Netlify environment or with env vars
echo -e "   ${YELLOW}Note: Environment variables can only be checked in Netlify environment${NC}"
echo -e "   Required: GA4_MEASUREMENT_ID, GA4_API_SECRET"
echo -e "   Optional: ANALYTICS_WEBHOOK_URL, MIXPANEL_TOKEN"

# Test 7: Function logs
echo -e "\n${YELLOW}Test 7: Function Logs${NC}"
echo "To check function logs, run:"
echo "   netlify functions:log click-tracking"
echo "   netlify functions:log track-engagement"

echo -e "\n${GREEN}🎉 Click Tracking Test Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Check Netlify function logs for tracking events"
echo "2. Verify GA4 events in Google Analytics (Real-time reports)"
echo "3. Test webhook endpoint if configured"
echo "4. Create test reports for full end-to-end testing"

echo -e "\n${YELLOW}Example Salesbot Integration URL:${NC}"
echo "${BASE_URL}/.netlify/functions/click-tracking?company_id=TARGET_COMPANY&utm_source=email&utm_medium=outreach&utm_campaign=CAMPAIGN_NAME&recipient=RECIPIENT_ID&tracking_id=TRACKING_ID" 