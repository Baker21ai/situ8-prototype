#!/bin/bash

# Deploy Passdowns API Gateway and Lambda Functions
# This script deploys the complete Passdowns module infrastructure

set -e

# Configuration
AWS_REGION=${AWS_REGION:-"us-west-2"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
API_NAME="situ8-passdowns-api-${ENVIRONMENT}"
STAGE_NAME=${ENVIRONMENT}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Passdowns API deployment...${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${AWS_REGION}"
echo ""

# Step 1: Package Lambda functions
echo -e "${YELLOW}📦 Packaging Lambda functions...${NC}"

LAMBDA_DIR="../claude-tasks/passdowns/03-lambda"
DIST_DIR="../dist/passdowns-lambdas"

# Create dist directory
mkdir -p ${DIST_DIR}

# Package each Lambda function
for lambda in createPassdown getPassdowns updatePassdown acknowledgePassdown getPassdownById; do
    echo "Packaging ${lambda}..."
    
    # Create temp directory
    mkdir -p ${DIST_DIR}/${lambda}
    
    # Copy function code
    cp ${LAMBDA_DIR}/${lambda}.js ${DIST_DIR}/${lambda}/index.js
    
    # Install dependencies
    cd ${DIST_DIR}/${lambda}
    npm init -y > /dev/null 2>&1
    npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid --save > /dev/null 2>&1
    
    # Create deployment package
    zip -r ../${lambda}.zip . > /dev/null
    cd - > /dev/null
    
    # Clean up temp directory
    rm -rf ${DIST_DIR}/${lambda}
done

echo -e "${GREEN}✅ Lambda functions packaged${NC}"

# Step 2: Deploy Lambda functions
echo -e "${YELLOW}🔧 Deploying Lambda functions...${NC}"

# Create IAM role for Lambda if it doesn't exist
ROLE_NAME="situ8-passdowns-lambda-role-${ENVIRONMENT}"
ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} 2>/dev/null | jq -r '.Role.Arn' || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
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

    # Create role
    ROLE_ARN=$(aws iam create-role \
        --role-name ${ROLE_NAME} \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region ${AWS_REGION} | jq -r '.Role.Arn')
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name ${ROLE_NAME} \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region ${AWS_REGION}
    
    # Create and attach DynamoDB policy
    cat > /tmp/dynamodb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS_REGION}:*:table/Situ8_Passdowns*",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/Situ8_PassdownReceipts*",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/Situ8_PassdownAttachments*"
      ]
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name ${ROLE_NAME} \
        --policy-name PassdownsDynamoDBPolicy \
        --policy-document file:///tmp/dynamodb-policy.json \
        --region ${AWS_REGION}
    
    # Wait for role to be ready
    sleep 10
fi

# Deploy each Lambda function
declare -A LAMBDA_ARNS

for lambda in createPassdown getPassdowns updatePassdown acknowledgePassdown getPassdownById; do
    echo "Deploying ${lambda} function..."
    
    FUNCTION_NAME="situ8-passdowns-${lambda}-${ENVIRONMENT}"
    
    # Check if function exists
    if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${AWS_REGION} 2>/dev/null; then
        # Update existing function
        aws lambda update-function-code \
            --function-name ${FUNCTION_NAME} \
            --zip-file fileb://${DIST_DIR}/${lambda}.zip \
            --region ${AWS_REGION} > /dev/null
    else
        # Create new function
        LAMBDA_ARN=$(aws lambda create-function \
            --function-name ${FUNCTION_NAME} \
            --runtime nodejs18.x \
            --role ${ROLE_ARN} \
            --handler index.handler \
            --zip-file fileb://${DIST_DIR}/${lambda}.zip \
            --timeout 30 \
            --memory-size 256 \
            --environment Variables="{PASSDOWNS_TABLE=Situ8_Passdowns,RECEIPTS_TABLE=Situ8_PassdownReceipts,ATTACHMENTS_TABLE=Situ8_PassdownAttachments,ENVIRONMENT=${ENVIRONMENT}}" \
            --region ${AWS_REGION} | jq -r '.FunctionArn')
    fi
    
    # Store Lambda ARN
    LAMBDA_ARNS[${lambda}]=$(aws lambda get-function --function-name ${FUNCTION_NAME} --region ${AWS_REGION} | jq -r '.Configuration.FunctionArn')
done

echo -e "${GREEN}✅ Lambda functions deployed${NC}"

# Step 3: Create/Update API Gateway
echo -e "${YELLOW}🌐 Setting up API Gateway...${NC}"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --region ${AWS_REGION} | jq -r ".items[] | select(.name==\"${API_NAME}\") | .id" || echo "")

if [ -z "$API_ID" ]; then
    echo "Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name ${API_NAME} \
        --description "Situ8 Passdowns API for ${ENVIRONMENT}" \
        --region ${AWS_REGION} | jq -r '.id')
else
    echo "Using existing API: ${API_ID}"
fi

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id ${API_ID} --region ${AWS_REGION} | jq -r '.items[0].id')

# Create /passdowns resource if it doesn't exist
PASSDOWNS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id ${API_ID} --region ${AWS_REGION} | jq -r '.items[] | select(.path=="/passdowns") | .id' || echo "")

if [ -z "$PASSDOWNS_RESOURCE_ID" ]; then
    PASSDOWNS_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${ROOT_ID} \
        --path-part passdowns \
        --region ${AWS_REGION} | jq -r '.id')
fi

# Create /passdowns/{id} resource if it doesn't exist
PASSDOWN_ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id ${API_ID} --region ${AWS_REGION} | jq -r '.items[] | select(.path=="/passdowns/{id}") | .id' || echo "")

if [ -z "$PASSDOWN_ID_RESOURCE_ID" ]; then
    PASSDOWN_ID_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${PASSDOWNS_RESOURCE_ID} \
        --path-part "{id}" \
        --region ${AWS_REGION} | jq -r '.id')
fi

# Create /passdowns/{id}/acknowledge resource
ACK_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id ${API_ID} --region ${AWS_REGION} | jq -r '.items[] | select(.path=="/passdowns/{id}/acknowledge") | .id' || echo "")

if [ -z "$ACK_RESOURCE_ID" ]; then
    ACK_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${PASSDOWN_ID_RESOURCE_ID} \
        --path-part acknowledge \
        --region ${AWS_REGION} | jq -r '.id')
fi

echo -e "${GREEN}✅ API Gateway resources created${NC}"

# Step 4: Configure methods and integrations
echo -e "${YELLOW}🔗 Configuring API methods...${NC}"

# Helper function to create method
create_method() {
    local resource_id=$1
    local http_method=$2
    local lambda_name=$3
    
    # Delete existing method if it exists
    aws apigateway delete-method \
        --rest-api-id ${API_ID} \
        --resource-id ${resource_id} \
        --http-method ${http_method} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Create method
    aws apigateway put-method \
        --rest-api-id ${API_ID} \
        --resource-id ${resource_id} \
        --http-method ${http_method} \
        --authorization-type COGNITO_USER_POOLS \
        --region ${AWS_REGION} > /dev/null
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id ${API_ID} \
        --resource-id ${resource_id} \
        --http-method ${http_method} \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARNS[${lambda_name}]}/invocations" \
        --region ${AWS_REGION} > /dev/null
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name ${LAMBDA_ARNS[${lambda_name}]} \
        --statement-id "apigateway-${resource_id}-${http_method}" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${AWS_REGION}:*:${API_ID}/*/${http_method}/*" \
        --region ${AWS_REGION} 2>/dev/null || true
}

# Configure all methods
create_method ${PASSDOWNS_RESOURCE_ID} GET getPassdowns
create_method ${PASSDOWNS_RESOURCE_ID} POST createPassdown
create_method ${PASSDOWN_ID_RESOURCE_ID} GET getPassdownById
create_method ${PASSDOWN_ID_RESOURCE_ID} PUT updatePassdown
create_method ${ACK_RESOURCE_ID} POST acknowledgePassdown

echo -e "${GREEN}✅ API methods configured${NC}"

# Step 5: Deploy API
echo -e "${YELLOW}🚀 Deploying API to ${STAGE_NAME} stage...${NC}"

aws apigateway create-deployment \
    --rest-api-id ${API_ID} \
    --stage-name ${STAGE_NAME} \
    --region ${AWS_REGION} > /dev/null

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/${STAGE_NAME}"

echo -e "${GREEN}✅ API deployed successfully!${NC}"
echo ""
echo "API Endpoint: ${API_ENDPOINT}"
echo ""
echo "Example endpoints:"
echo "  GET    ${API_ENDPOINT}/passdowns"
echo "  POST   ${API_ENDPOINT}/passdowns"
echo "  GET    ${API_ENDPOINT}/passdowns/{id}"
echo "  PUT    ${API_ENDPOINT}/passdowns/{id}"
echo "  POST   ${API_ENDPOINT}/passdowns/{id}/acknowledge"
echo ""
echo -e "${YELLOW}⚠️  Note: You'll need to configure Cognito authorizer separately${NC}"

# Clean up
rm -rf ${DIST_DIR}
rm -f /tmp/trust-policy.json /tmp/dynamodb-policy.json

echo -e "${GREEN}🎉 Passdowns API deployment complete!${NC}"