#!/bin/bash

# Test runner script for GitForMeDearAi
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 GitForMeDearAi Test Suite${NC}"
echo "================================"

# Function to run tests with custom output
run_test_suite() {
    local test_pattern="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}▶ Running: $description${NC}"
    echo "Pattern: $test_pattern"
    echo "----------------------------------------"
    
    if npm test -- --testPathPattern="$test_pattern" --verbose; then
        echo -e "${GREEN}✅ $description - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FAILED${NC}"
        return 1
    fi
}

# Function to run tests with coverage
run_with_coverage() {
    echo -e "\n${BLUE}📊 Running tests with coverage...${NC}"
    echo "========================================"
    
    if npm run test:coverage; then
        echo -e "${GREEN}✅ Coverage report generated${NC}"
        echo -e "${BLUE}📁 Coverage report available in: ./coverage/lcov-report/index.html${NC}"
        return 0
    else
        echo -e "${RED}❌ Coverage generation failed${NC}"
        return 1
    fi
}

# Initialize counters
passed=0
failed=0

# Test suites to run
echo -e "\n${BLUE}🎯 Test Plan:${NC}"
echo "1. Status Commands (git_status, git_log, git_diff, git_blame, git_show)"
echo "2. Branch Commands (git_branch_list, git_branch_create, git_branch_switch, git_branch_delete)"
echo "3. Commit Commands (git_add, git_commit, git_push, git_pull)"
echo "4. Merge & Stash Commands (git_merge, git_stash)"
echo "5. Integration Tests (end-to-end workflows)"
echo ""

# 1. Status Commands Tests
if run_test_suite "tests/unit/status" "Status Commands"; then
    ((passed++))
else
    ((failed++))
fi

# 2. Branch Commands Tests
if run_test_suite "tests/unit/branches" "Branch Commands"; then
    ((passed++))
else
    ((failed++))
fi

# 3. Commit Commands Tests (when implemented)
if [[ -d "tests/unit/commits" ]]; then
    if run_test_suite "tests/unit/commits" "Commit Commands"; then
        ((passed++))
    else
        ((failed++))
    fi
else
    echo -e "\n${YELLOW}⏭ Commit Commands tests not yet implemented${NC}"
fi

# 4. Merge & Stash Commands Tests (when implemented)
if [[ -d "tests/unit/stash" ]]; then
    if run_test_suite "tests/unit/stash" "Merge & Stash Commands"; then
        ((passed++))
    else
        ((failed++))
    fi
else
    echo -e "\n${YELLOW}⏭ Merge & Stash Commands tests not yet implemented${NC}"
fi

# 5. Integration Tests (when implemented)
if [[ -d "tests/integration" ]]; then
    if run_test_suite "tests/integration" "Integration Tests"; then
        ((passed++))
    else
        ((failed++))
    fi
else
    echo -e "\n${YELLOW}⏭ Integration tests not yet implemented${NC}"
fi

# Run all tests together
echo -e "\n${BLUE}🔄 Running all implemented tests together...${NC}"
echo "============================================="

if npm test; then
    echo -e "${GREEN}✅ All tests passed successfully${NC}"
    all_tests_passed=true
else
    echo -e "${RED}❌ Some tests failed${NC}"
    all_tests_passed=false
fi

# Generate coverage report if all tests pass
if $all_tests_passed; then
    run_with_coverage
fi

# Summary
echo -e "\n${BLUE}📋 Test Results Summary${NC}"
echo "========================="
echo -e "Passed Test Suites: ${GREEN}$passed${NC}"
echo -e "Failed Test Suites: ${RED}$failed${NC}"

if [[ $failed -eq 0 ]] && $all_tests_passed; then
    echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${GREEN}✨ Test suite is ready for production${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please fix the issues before proceeding.${NC}"
    exit 1
fi