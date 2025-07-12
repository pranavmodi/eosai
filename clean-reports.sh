#!/bin/bash

# 🧹 Clean Reports Script - Remove all reports from the website
# This script provides multiple cleanup options for the reports system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="https://possibleminds.in"

echo -e "${CYAN}🧹 Reports Cleanup Script${NC}"
echo "=========================="
echo ""

# Function to display cleanup options
show_cleanup_options() {
    echo -e "${BLUE}Available cleanup options:${NC}"
    echo ""
    echo "1. 🚀 Clean all reports (recommended)"
    echo "2. 📊 Show current reports count"
    echo "3. 🔄 Clean + trigger rebuild"
    echo "4. 🛠️  Clean specific report by slug"
    echo "5. 🎯 Clean by storage type"
    echo "6. ❌ Exit"
    echo ""
}

# Function to get current reports count
get_reports_count() {
    echo -e "${YELLOW}📊 Fetching current reports count...${NC}"
    
    REPORTS_RESPONSE=$(curl -s "$BASE_URL/.netlify/functions/get-reports")
    
    if [ $? -eq 0 ]; then
        # Parse the JSON response to get counts
        TOTAL_COUNT=$(echo "$REPORTS_RESPONSE" | grep -o '"totalCount":[0-9]*' | grep -o '[0-9]*')
        DYNAMIC_COUNT=$(echo "$REPORTS_RESPONSE" | grep -o '"dynamicCount":[0-9]*' | grep -o '[0-9]*')
        STATIC_COUNT=$(echo "$REPORTS_RESPONSE" | grep -o '"staticCount":[0-9]*' | grep -o '[0-9]*')
        
        echo -e "${GREEN}✅ Current reports status:${NC}"
        echo "   Total reports: $TOTAL_COUNT"
        echo "   Dynamic reports: $DYNAMIC_COUNT"
        echo "   Static reports: $STATIC_COUNT"
        echo ""
        
        return 0
    else
        echo -e "${RED}❌ Failed to fetch reports count${NC}"
        return 1
    fi
}

# Function to clean all reports
clean_all_reports() {
    echo -e "${YELLOW}🧹 Cleaning all reports...${NC}"
    
    # Call the cleanup function
    CLEANUP_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/clean-reports" \
        -H "Content-Type: application/json" \
        -d '{"action": "clean_all"}')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cleanup completed successfully${NC}"
        echo "Response: $CLEANUP_RESPONSE"
    else
        echo -e "${RED}❌ Cleanup failed${NC}"
    fi
}

# Function to clean specific report
clean_specific_report() {
    echo ""
    read -p "Enter the company slug to clean: " SLUG
    
    if [ -z "$SLUG" ]; then
        echo -e "${RED}❌ No slug provided${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🧹 Cleaning report: $SLUG${NC}"
    
    CLEANUP_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/clean-reports" \
        -H "Content-Type: application/json" \
        -d '{"action": "clean_specific", "slug": "'$SLUG'"}')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Report cleaned successfully${NC}"
        echo "Response: $CLEANUP_RESPONSE"
    else
        echo -e "${RED}❌ Failed to clean report${NC}"
    fi
}

# Function to clean by storage type
clean_by_storage_type() {
    echo ""
    echo -e "${BLUE}Storage types:${NC}"
    echo "1. memory - In-memory storage"
    echo "2. blobs - Netlify Blobs"
    echo "3. database - External database (if configured)"
    echo ""
    
    read -p "Enter storage type (memory/blobs/database): " STORAGE_TYPE
    
    if [ -z "$STORAGE_TYPE" ]; then
        echo -e "${RED}❌ No storage type provided${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🧹 Cleaning $STORAGE_TYPE storage...${NC}"
    
    CLEANUP_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/clean-reports" \
        -H "Content-Type: application/json" \
        -d '{"action": "clean_storage", "storage_type": "'$STORAGE_TYPE'"}')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Storage cleaned successfully${NC}"
        echo "Response: $CLEANUP_RESPONSE"
    else
        echo -e "${RED}❌ Failed to clean storage${NC}"
    fi
}

# Function to clean and trigger rebuild
clean_and_rebuild() {
    echo -e "${YELLOW}🧹 Cleaning all reports and triggering rebuild...${NC}"
    
    CLEANUP_RESPONSE=$(curl -s -X POST "$BASE_URL/.netlify/functions/clean-reports" \
        -H "Content-Type: application/json" \
        -d '{"action": "clean_all", "trigger_rebuild": true}')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cleanup and rebuild triggered successfully${NC}"
        echo "Response: $CLEANUP_RESPONSE"
        echo -e "${BLUE}⏳ Rebuild will take 2-4 minutes to complete${NC}"
    else
        echo -e "${RED}❌ Cleanup and rebuild failed${NC}"
    fi
}

# Function to create the cleanup function if it doesn't exist
create_cleanup_function() {
    echo -e "${YELLOW}🛠️  Creating cleanup function...${NC}"
    
    # Check if cleanup function exists
    FUNCTION_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.netlify/functions/clean-reports")
    
    if [ "$FUNCTION_EXISTS" = "404" ]; then
        echo -e "${BLUE}📄 Cleanup function doesn't exist. Creating it...${NC}"
        
        # The cleanup function will be created in the next step
        return 1
    else
        echo -e "${GREEN}✅ Cleanup function exists${NC}"
        return 0
    fi
}

# Main script logic
main() {
    echo -e "${CYAN}🔍 Checking system status...${NC}"
    
    # Check if cleanup function exists
    if ! create_cleanup_function; then
        echo -e "${YELLOW}⚠️  Cleanup function needs to be created first${NC}"
        echo -e "${BLUE}📝 Please run this script again after the cleanup function is deployed${NC}"
        echo ""
        echo -e "${YELLOW}The cleanup function will be created automatically.${NC}"
        return 1
    fi
    
    # Get current reports count
    get_reports_count
    
    while true; do
        show_cleanup_options
        read -p "Select an option (1-6): " choice
        
        case $choice in
            1)
                clean_all_reports
                ;;
            2)
                get_reports_count
                ;;
            3)
                clean_and_rebuild
                ;;
            4)
                clean_specific_report
                ;;
            5)
                clean_by_storage_type
                ;;
            6)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please select 1-6.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${BLUE}Press Enter to continue...${NC}"
        read
        echo ""
    done
}

# Run the main function
main 