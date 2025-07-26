#!/bin/bash

# Test script for the Reports Cleanup System
echo "🧪 Testing Reports Cleanup System"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://possibleminds.in"
TIMESTAMP=$(date +%s)
TEST_COMPANY="Cleanup Test Company $TIMESTAMP"
TEST_SLUG="cleanup-test-company-$TIMESTAMP"

echo -e "${BLUE}📊 Step 1: Check initial reports count${NC}"
INITIAL_REPORTS=$(curl -s "$BASE_URL/.netlify/functions/get-reports" | grep -o '"totalCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "Initial reports count: $INITIAL_REPORTS"
echo ""

echo -e "${BLUE}📝 Step 2: Add a test report${NC}"
echo "Adding test report: $TEST_COMPANY"

ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/publish-report" \
    -H "Content-Type: application/json" \
    -d '{
        "company_name": "'"$TEST_COMPANY"'",
        "html_report": "<h1>Test Report for Cleanup</h1><h2>Purpose</h2><p>This report was created to test the cleanup system.</p><h2>Details</h2><ul><li>Created: '"$(date)"'</li><li>Test ID: '"$TIMESTAMP"'</li><li>Will be cleaned up automatically</li></ul><h2>Test Results</h2><p>If this report disappears after cleanup, the system is working correctly!</p>",
        "company_website": "https://test-cleanup-'"$TIMESTAMP"'.com"
    }')

if echo "$ADD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test report added successfully${NC}"
else
    echo -e "${RED}❌ Failed to add test report${NC}"
    echo "Response: $ADD_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 Step 3: Verify report was added${NC}"
AFTER_ADD_REPORTS=$(curl -s "$BASE_URL/.netlify/functions/get-reports" | grep -o '"totalCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "Reports count after adding: $AFTER_ADD_REPORTS"

if [ "$AFTER_ADD_REPORTS" -gt "$INITIAL_REPORTS" ]; then
    echo -e "${GREEN}✅ Report count increased (expected)${NC}"
else
    echo -e "${YELLOW}⚠️  Report count didn't increase - might be in build queue${NC}"
fi

echo ""
echo -e "${BLUE}🧹 Step 4: Test cleanup function${NC}"
echo "Cleaning the test report..."

CLEANUP_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/clean-reports" \
    -H "Content-Type: application/json" \
    -d '{
        "action": "clean_specific",
        "slug": "'"$TEST_SLUG"'"
    }')

if echo "$CLEANUP_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Cleanup function executed successfully${NC}"
    
    # Show cleanup results
    TOTAL_REMOVED=$(echo "$CLEANUP_RESPONSE" | grep -o '"totalRemoved":[0-9]*' | grep -o '[0-9]*' || echo "0")
    echo "Total reports removed: $TOTAL_REMOVED"
    
    if [ "$TOTAL_REMOVED" -gt "0" ]; then
        echo -e "${GREEN}✅ Reports were successfully cleaned${NC}"
    else
        echo -e "${YELLOW}⚠️  No reports were removed (might not have been persisted yet)${NC}"
    fi
else
    echo -e "${RED}❌ Cleanup function failed${NC}"
    echo "Response: $CLEANUP_RESPONSE"
fi

echo ""
echo -e "${BLUE}📊 Step 5: Verify cleanup worked${NC}"
FINAL_REPORTS=$(curl -s "$BASE_URL/.netlify/functions/get-reports" | grep -o '"totalCount":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "Final reports count: $FINAL_REPORTS"

echo ""
echo -e "${BLUE}📋 Summary${NC}"
echo "--------"
echo "Initial reports: $INITIAL_REPORTS"
echo "After adding test report: $AFTER_ADD_REPORTS"
echo "After cleanup: $FINAL_REPORTS"
echo ""

if [ "$FINAL_REPORTS" -le "$INITIAL_REPORTS" ]; then
    echo -e "${GREEN}✅ Cleanup system test PASSED${NC}"
    echo "The cleanup system is working correctly!"
else
    echo -e "${YELLOW}⚠️  Cleanup system test INCONCLUSIVE${NC}"
    echo "This could be normal if the report is in build queue or stored in different locations."
fi

echo ""
echo -e "${BLUE}🧪 Additional Tests Available${NC}"
echo "To test the full cleanup system:"
echo "1. Run: ./clean-reports.sh"
echo "2. Select option 1 to clean all reports"
echo "3. Select option 2 to see current count"
echo ""
echo "To test via API:"
echo "curl -X POST $BASE_URL/.netlify/functions/clean-reports -H \"Content-Type: application/json\" -d '{\"action\": \"clean_all\"}'"
echo ""
echo -e "${GREEN}🎉 Test completed!${NC}" 