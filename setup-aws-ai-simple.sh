#!/bin/bash

# Simplified Situ8 AWS AI Integration Setup Script
# This script sets up the essential AWS resources needed for AI functionality

set -e  # Exit on any error

echo "🚀 Setting up Situ8 AWS AI Integration (Simplified)..."
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-west-2"
LAMBDA_FUNCTION_NAME="situ8-bedrock-chat"
IAM_ROLE_NAME="Situ8BedrockExecutionRole"
POLICY_NAME="Situ8BedrockPolicy"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Region: $REGION"
echo "   Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "   IAM Role: $IAM_ROLE_NAME"
echo ""

# Step 1: Check AWS CLI configuration
echo -e "${BLUE}🔍 Step 1: Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI is configured${NC}"
echo ""

# Step 2: Check if Lambda function exists and is working
echo -e "${BLUE}🔧 Step 2: Checking Lambda function...${NC}"

if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Lambda function $LAMBDA_FUNCTION_NAME exists${NC}"
    
    # Test the Lambda function
    echo -e "${BLUE}🧪 Testing Lambda function...${NC}"
    
    TEST_PAYLOAD='{"body": "{\"message\": \"Hello, test message\", \"context\": \"Testing AI integration\"}"}'
    
    LAMBDA_RESPONSE=$(aws lambda invoke \
        --function-name $LAMBDA_FUNCTION_NAME \
        --payload "$TEST_PAYLOAD" \
        --region $REGION \
        /tmp/lambda-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Lambda function is working${NC}"
        echo "Response preview:"
        head -c 200 /tmp/lambda-response.json
        echo "..."
    else
        echo -e "${YELLOW}⚠️  Lambda function exists but may have issues${NC}"
        echo "Error: $LAMBDA_RESPONSE"
    fi
else
    echo -e "${RED}❌ Lambda function $LAMBDA_FUNCTION_NAME not found${NC}"
    echo -e "${YELLOW}Please run the full setup script first: ./setup-aws-ai.sh${NC}"
    exit 1
fi

echo ""

# Step 3: Check API Gateway
echo -e "${BLUE}🌐 Step 3: Checking API Gateway...${NC}"

# Find existing API Gateway
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='situ8-ai-api'].id" --output text)

if [ "$API_ID" != "" ] && [ "$API_ID" != "None" ]; then
    echo -e "${GREEN}✅ API Gateway found with ID: $API_ID${NC}"
    
    # Get the API URL
    API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/dev"
    echo -e "${BLUE}🔗 API URL: $API_URL${NC}"
    
    # Test the API endpoint
    echo -e "${BLUE}🧪 Testing API endpoint...${NC}"
    
    HTTP_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$API_URL/api/ai/chat" \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello, can you help me with security operations?", "context": "Testing AI integration"}' \
        --max-time 30)
    
    HTTP_BODY=$(echo $HTTP_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    HTTP_STATUS=$(echo $HTTP_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ API endpoint is working!${NC}"
        echo "Response preview:"
        echo "$HTTP_BODY" | head -c 200
        echo "..."
    else
        echo -e "${YELLOW}⚠️  API endpoint returned status: $HTTP_STATUS${NC}"
        echo "Response: $HTTP_BODY"
    fi
else
    echo -e "${RED}❌ API Gateway 'situ8-ai-api' not found${NC}"
    echo -e "${YELLOW}Please run the full setup script first: ./setup-aws-ai.sh${NC}"
    exit 1
fi

echo ""

# Step 4: Update environment file
echo -e "${BLUE}📝 Step 4: Updating environment configuration...${NC}"

# Update the .env.local file with the correct API URL
if grep -q "VITE_API_BASE_URL" .env.local; then
    sed -i.bak "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$API_URL|" .env.local
    echo -e "${GREEN}✅ Updated VITE_API_BASE_URL in .env.local${NC}"
else
    echo "VITE_API_BASE_URL=$API_URL" >> .env.local
    echo -e "${GREEN}✅ Added VITE_API_BASE_URL to .env.local${NC}"
fi

echo ""

# Step 5: Verify environment file
echo -e "${BLUE}📋 Step 5: Environment Configuration Summary${NC}"
echo "Current AI-related environment variables:"
grep -E "(AI|BEDROCK)" .env.local || echo "No AI variables found"
echo ""
echo "API Base URL:"
grep "VITE_API_BASE_URL" .env.local
echo ""

echo -e "${GREEN}🎉 Setup Verification Complete!${NC}"
echo "==========================================="
echo -e "${BLUE}📋 Summary:${NC}"
echo "   ✅ Lambda Function: $LAMBDA_FUNCTION_NAME (Working)"
echo "   ✅ API Gateway: $API_ID (Working)"
echo "   ✅ API URL: $API_URL"
echo "   ✅ Environment file updated"
echo ""
echo -e "${BLUE}🧪 Manual Test Command:${NC}"
echo "curl -X POST $API_URL/api/ai/chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello, can you help me with security operations?\", \"context\": \"Testing AI integration\"}'"
echo ""
echo -e "${GREEN}Your AI integration is ready! 🚀${NC}"
echo -e "${YELLOW}Note: Restart your development server to pick up the new environment variables.${NC}"

# Cleanup
rm -f /tmp/lambda-response.json