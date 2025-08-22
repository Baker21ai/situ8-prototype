#!/bin/bash

# Situ8 AWS AI Integration Setup Script
# This script sets up the AWS resources needed for AI functionality

set -e  # Exit on any error

echo "🚀 Setting up Situ8 AWS AI Integration..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-west-2"
API_NAME="situ8-ai-api"
LAMBDA_FUNCTION_NAME="situ8-bedrock-chat"
IAM_ROLE_NAME="Situ8BedrockExecutionRole"
POLICY_NAME="Situ8BedrockPolicy"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Region: $REGION"
echo "   API Name: $API_NAME"
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

# Step 2: Create IAM Role for Lambda
echo -e "${BLUE}🔐 Step 2: Creating IAM Role for Lambda...${NC}"

# Create trust policy for Lambda
cat > /tmp/lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the IAM role
if aws iam get-role --role-name $IAM_ROLE_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  IAM Role $IAM_ROLE_NAME already exists${NC}"
else
    aws iam create-role \
        --role-name $IAM_ROLE_NAME \
        --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
        --region $REGION
    echo -e "${GREEN}✅ Created IAM Role: $IAM_ROLE_NAME${NC}"
fi

# Create policy for Bedrock access
cat > /tmp/bedrock-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

# Attach policies to the role
aws iam attach-role-policy \
    --role-name $IAM_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

if aws iam get-role-policy --role-name $IAM_ROLE_NAME --policy-name $POLICY_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Policy $POLICY_NAME already exists${NC}"
else
    aws iam put-role-policy \
        --role-name $IAM_ROLE_NAME \
        --policy-name $POLICY_NAME \
        --policy-document file:///tmp/bedrock-policy.json
    echo -e "${GREEN}✅ Attached Bedrock policy to role${NC}"
fi

echo ""

# Step 3: Create Lambda function
echo -e "${BLUE}🔧 Step 3: Creating Lambda function...${NC}"

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE_NAME --query 'Role.Arn' --output text)
echo "Role ARN: $ROLE_ARN"

# Create a simple Lambda function code
mkdir -p /tmp/lambda-code
cat > /tmp/lambda-code/index.js << 'EOF'
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-west-2' });

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { message, context } = body;
        
        if (!message) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: 'Message is required' })
            };
        }
        
        // Prepare the prompt for Claude
        const prompt = `Human: You are an AI assistant for Situ8, a security management platform. 
        
Context: ${context || 'General security platform assistance'}
        
User message: ${message}
        
Please provide a helpful response focused on security operations, incident management, or guard activities. Keep responses concise and actionable.
        
Assistant:`;
        
        // Invoke Claude model
        const command = new InvokeModelCommand({
            modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            }),
            contentType: 'application/json',
            accept: 'application/json'
        });
        
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                response: responseBody.content[0].text,
                model: 'claude-3-5-sonnet',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
EOF

# Create package.json
cat > /tmp/lambda-code/package.json << EOF
{
  "name": "situ8-bedrock-chat",
  "version": "1.0.0",
  "description": "Situ8 AI Chat Lambda Function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0"
  }
}
EOF

# Install dependencies and create deployment package
cd /tmp/lambda-code
npm install
zip -r ../lambda-deployment.zip .
cd -

# Create or update Lambda function
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Lambda function $LAMBDA_FUNCTION_NAME already exists, updating...${NC}"
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb:///tmp/lambda-deployment.zip \
        --region $REGION
else
    echo -e "${BLUE}Creating new Lambda function...${NC}"
    # Wait for role to be available
    echo "Waiting for IAM role to be available..."
    sleep 10
    
    aws lambda create-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb:///tmp/lambda-deployment.zip \
        --timeout 30 \
        --memory-size 256 \
        --region $REGION
fi

echo -e "${GREEN}✅ Lambda function created/updated${NC}"
echo ""

# Step 4: Create API Gateway
echo -e "${BLUE}🌐 Step 4: Setting up API Gateway...${NC}"

# Check if API already exists
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ "$API_ID" != "" ] && [ "$API_ID" != "None" ]; then
    echo -e "${YELLOW}⚠️  API Gateway $API_NAME already exists with ID: $API_ID${NC}"
else
    # Create API Gateway
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "Situ8 AI Chat API" \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✅ Created API Gateway with ID: $API_ID${NC}"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/`].id' \
    --output text)

# Create /api resource
API_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`api`].id' \
    --output text)

if [ "$API_RESOURCE_ID" == "" ] || [ "$API_RESOURCE_ID" == "None" ]; then
    API_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part api \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✅ Created /api resource${NC}"
fi

# Create /api/ai resource
AI_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`ai`].id' \
    --output text)

if [ "$AI_RESOURCE_ID" == "" ] || [ "$AI_RESOURCE_ID" == "None" ]; then
    AI_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $API_RESOURCE_ID \
        --path-part ai \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✅ Created /api/ai resource${NC}"
fi

# Create /api/ai/chat resource
CHAT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`chat`].id' \
    --output text)

if [ "$CHAT_RESOURCE_ID" == "" ] || [ "$CHAT_RESOURCE_ID" == "None" ]; then
    CHAT_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $AI_RESOURCE_ID \
        --path-part chat \
        --region $REGION \
        --query 'id' \
        --output text)
    echo -e "${GREEN}✅ Created /api/ai/chat resource${NC}"
fi

# Create POST method
if aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  POST method already exists${NC}"
else
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method POST \
        --authorization-type NONE \
        --region $REGION
    echo -e "${GREEN}✅ Created POST method${NC}"
fi

# Create OPTIONS method for CORS
if aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  OPTIONS method already exists${NC}"
else
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION
    echo -e "${GREEN}✅ Created OPTIONS method for CORS${NC}"
fi

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $REGION \
    --query 'Configuration.FunctionArn' \
    --output text)

# Set up Lambda integration for POST
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

# Set up CORS integration for OPTIONS
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --region $REGION

# Set up integration response for OPTIONS
aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --region $REGION

# Set up method response for OPTIONS
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
    --region $REGION

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
    --region $REGION 2>/dev/null || echo -e "${YELLOW}⚠️  Permission already exists${NC}"

echo -e "${GREEN}✅ API Gateway integration completed${NC}"
echo ""

# Step 5: Deploy API
echo -e "${BLUE}🚀 Step 5: Deploying API...${NC}"

aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev \
    --region $REGION

echo -e "${GREEN}✅ API deployed to dev stage${NC}"
echo ""

# Step 6: Update environment file
echo -e "${BLUE}📝 Step 6: Updating environment configuration...${NC}"

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/dev"

# Update the .env.local file with the new API URL
sed -i.bak "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$API_URL|" .env.local

echo -e "${GREEN}✅ Updated .env.local with new API URL${NC}"
echo ""

# Cleanup temporary files
rm -f /tmp/lambda-trust-policy.json
rm -f /tmp/bedrock-policy.json
rm -rf /tmp/lambda-code
rm -f /tmp/lambda-deployment.zip

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "==========================================="
echo -e "${BLUE}📋 Summary:${NC}"
echo "   ✅ IAM Role: $IAM_ROLE_NAME"
echo "   ✅ Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "   ✅ API Gateway: $API_NAME ($API_ID)"
echo "   ✅ API URL: $API_URL"
echo "   ✅ Environment file updated"
echo ""
echo -e "${BLUE}🔗 API Endpoints:${NC}"
echo "   POST $API_URL/api/ai/chat"
echo ""
echo -e "${BLUE}🧪 Test your setup:${NC}"
echo "   curl -X POST $API_URL/api/ai/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"Hello, can you help me with security operations?\", \"context\": \"Testing AI integration\"}'"
echo ""
echo -e "${GREEN}Your AI integration is now ready! 🚀${NC}"
echo -e "${YELLOW}Note: Make sure to restart your development server to pick up the new environment variables.${NC}"