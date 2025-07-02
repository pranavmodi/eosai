#!/bin/bash

# Setup script for automatic rebuild system
echo "🔄 Setting up Automatic Rebuild for Reports"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 What this setup will accomplish:${NC}"
echo "✅ Configure automatic rebuilds when reports are published"
echo "✅ Reports will be live within 2-4 minutes"
echo "✅ No external database needed"
echo "✅ Reports persist through all deployments"
echo ""

echo -e "${YELLOW}📝 Setup Steps:${NC}"
echo ""

echo -e "${BLUE}Step 1: Create a Netlify Build Hook${NC}"
echo "1. Go to your Netlify dashboard"
echo "2. Navigate to: Site Settings → Build & Deploy → Build Hooks"
echo "3. Click 'Add Build Hook'"
echo "4. Name: 'Report Publishing'"
echo "5. Copy the webhook URL"
echo ""

echo -e "${YELLOW}⏳ Please complete Step 1 and return here with your build hook URL...${NC}"
echo ""
read -p "Enter your Netlify build hook URL: " BUILD_HOOK_URL

# Validate the build hook URL
if [[ ! $BUILD_HOOK_URL =~ ^https://api\.netlify\.com/build_hooks/ ]]; then
    echo -e "${RED}❌ Invalid build hook URL. It should start with 'https://api.netlify.com/build_hooks/'${NC}"
    echo "Please check the URL and try again."
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Valid build hook URL received!${NC}"
echo ""

echo -e "${BLUE}Step 2: Add Environment Variable to Netlify${NC}"
echo "1. In your Netlify dashboard, go to: Site Settings → Environment Variables"
echo "2. Click 'Add a variable'"
echo "3. Key: NETLIFY_BUILD_HOOK"
echo "4. Value: $BUILD_HOOK_URL"
echo "5. Click 'Create variable'"
echo ""

echo -e "${YELLOW}⏳ Please complete Step 2 and press Enter when done...${NC}"
read -p "Press Enter to continue..."

echo ""
echo -e "${BLUE}Step 3: Deploy the Updated Function${NC}"
echo "The publish-report.js function has been updated with auto-rebuild functionality."
echo ""

# Check if we're in a git repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}🚀 Ready to deploy? This will commit and push the changes.${NC}"
    read -p "Deploy now? (y/n): " DEPLOY_NOW
    
    if [[ $DEPLOY_NOW =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}📤 Deploying changes...${NC}"
        
        # Add files
        git add netlify/functions/publish-report.js AUTO_REBUILD_SETUP.md setup-auto-rebuild.sh
        
        # Commit
        git commit -m "feat: Add automatic rebuild system for reports

- Auto-trigger Netlify builds when reports are published
- Reports available within 2-4 minutes
- Persistent storage through build system
- Enhanced response with build status and timing"
        
        # Push
        git push
        
        echo -e "${GREEN}✅ Changes deployed!${NC}"
    else
        echo -e "${YELLOW}📝 Manual deployment needed:${NC}"
        echo "git add ."
        echo "git commit -m 'Add automatic rebuild system'"
        echo "git push"
    fi
else
    echo -e "${YELLOW}📝 Deploy manually:${NC}"
    echo "Commit and push the updated publish-report.js function to deploy the changes."
fi

echo ""
echo -e "${BLUE}Step 4: Test the System${NC}"
echo ""

echo -e "${YELLOW}🧪 Testing automatic rebuild...${NC}"

# Test the system
TEST_PAYLOAD='{
  "company_name": "Auto-Rebuild Test Company",
  "markdown_report": "# Auto-Rebuild Test Report\n\n## Overview\nThis report was created to test the automatic rebuild system.\n\n## Test Details\n- Created: '$(date)'\n- Purpose: Verify automatic rebuilds work\n- Expected: Report available in 2-4 minutes\n\n## Results\nIf you can read this report on the website, the automatic rebuild system is working perfectly!",
  "company_website": "https://test-auto-rebuild.com"
}'

echo "Publishing test report..."
RESPONSE=$(curl -s -X POST "https://possibleminds.in/.netlify/functions/publish-report" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

echo ""
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test report published successfully!${NC}"
    
    # Extract build info
    BUILD_TRIGGERED=$(echo "$RESPONSE" | grep -o '"buildTriggered":[^,]*' | cut -d':' -f2)
    ESTIMATED_TIME=$(echo "$RESPONSE" | grep -o '"estimatedAvailableAt":"[^"]*"' | cut -d'"' -f4)
    
    if [[ $BUILD_TRIGGERED == "true" ]]; then
        echo -e "${GREEN}🔄 Build triggered automatically!${NC}"
        echo -e "📅 Estimated availability: $ESTIMATED_TIME"
        echo -e "⏱️  Expected wait time: 2-4 minutes"
        echo ""
        echo -e "${BLUE}📊 Monitor your build:${NC}"
        echo "1. Go to Netlify dashboard → Deploys"
        echo "2. Look for build: 'New Report: Auto-Rebuild Test Company'"
        echo ""
        echo -e "${BLUE}🌐 Test URL (available after build):${NC}"
        echo "https://possibleminds.in/reports/auto-rebuild-test-company"
    else
        echo -e "${RED}❌ Build was not triggered. Check environment variable setup.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Test failed. Response:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Automatic rebuild system configured"
echo "✅ Test report published and build triggered"
echo "✅ Future reports will auto-deploy within 2-4 minutes"
echo ""

echo -e "${BLUE}🔄 How it works now:${NC}"
echo "1. Salesbot posts report → Immediate storage + Build trigger"
echo "2. Netlify builds site → Report becomes permanently available"
echo "3. Build completes → Report live at possibleminds.in/reports/[slug]"
echo ""

echo -e "${YELLOW}⏱️  Next: Wait 2-4 minutes and check the test report URL above!${NC}"
echo ""

echo -e "${GREEN}🚀 Your automatic rebuild system is ready for production!${NC}" 