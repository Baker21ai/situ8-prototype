#!/bin/bash

# Deploy WebSocket Authorizer Lambda
# This script packages and deploys the Lambda function for WebSocket API authorization

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
LAMBDA_DIR="$PROJECT_ROOT/lambdas/websocket/authorizer"
FUNCTION_NAME="situ8-ws-authorizer"
HANDLER="lambda_function.lambda_handler"
RUNTIME="python3.9"
REGION="us-west-2"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get User Pool ID from environment or use default
USER_POOL_ID="${REACT_APP_COGNITO_USER_POOL_ID:-us-west-2_ECLKvbdSp}"
APP_CLIENT_ID="${REACT_APP_COGNITO_CLIENT_ID:-5ouh548bibh1rrp11neqcvvqf6}"

echo "🔧 Packaging Lambda function..."
cd "$LAMBDA_DIR"

# Create a virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -t .
deactivate

# Create deployment package
zip -r lambda-package.zip . -x "venv/*" "*.pyc" "__pycache__/*"

echo "📦 Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://lambda-package.zip \
        --region "$REGION"
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables={USER_POOL_ID=$USER_POOL_ID,APP_CLIENT_ID=$APP_CLIENT_ID}" \
        --timeout 30 \
        --memory-size 128 \
        --region "$REGION"
else
    echo "✨ Creating new function..."
    
    # Create IAM role for Lambda
    ROLE_NAME="${FUNCTION_NAME}-role"
    
    # Create trust policy
    cat > trust-policy.json <<EOF
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
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://trust-policy.json \
        --description "Role for WebSocket Authorizer Lambda" || true
    
    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Wait for role to be available
    echo "⏳ Waiting for IAM role to be available..."
    sleep 10
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
    
    # Create function
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://lambda-package.zip \
        --description "Cognito authorizer for WebSocket API" \
        --timeout 30 \
        --memory-size 128 \
        --environment "Variables={USER_POOL_ID=$USER_POOL_ID,APP_CLIENT_ID=$APP_CLIENT_ID}" \
        --region "$REGION"
    
    # Clean up
    rm trust-policy.json
fi

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

echo "✅ Lambda function deployed successfully!"
echo "📋 Function ARN: $FUNCTION_ARN"

# Grant API Gateway permission to invoke the function
echo "🔐 Granting API Gateway permission to invoke function..."
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:*:*/authorizers/*" \
    --region "$REGION" 2>/dev/null || true

# Clean up
rm -rf venv lambda-package.zip

echo "🎉 WebSocket Authorizer Lambda deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update your WebSocket API Gateway to use this authorizer"
echo "2. Configure the $connect route to use this Lambda authorizer"
echo "3. Test WebSocket connections with valid Cognito tokens"