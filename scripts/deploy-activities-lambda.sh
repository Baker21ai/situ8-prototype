#!/bin/bash

# Deploy Activities Lambda Function
# This creates the Lambda function and connects it to API Gateway

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$PROJECT_ROOT/lambda/activities"
FUNCTION_NAME="situ8-activities-api-dev"
REGION="us-west-2"
ROLE_NAME="situ8-lambda-execution-role"
API_GATEWAY_ID="xb3rai5taf"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to create IAM role for Lambda
create_lambda_role() {
    print_status "Creating IAM role for Lambda execution..."
    
    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" >/dev/null 2>&1; then
        print_warning "IAM role $ROLE_NAME already exists"
        return 0
    fi
    
    # Create trust policy document
    cat > /tmp/trust-policy.json << EOF
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

    # Create IAM role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region "$REGION" \
        >/dev/null
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region "$REGION"
    
    # Create and attach DynamoDB policy
    cat > /tmp/dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/situ8-*"
      ]
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "DynamoDBAccessPolicy" \
        --policy-document file:///tmp/dynamodb-policy.json \
        --region "$REGION"
    
    # Clean up temp files
    rm -f /tmp/trust-policy.json /tmp/dynamodb-policy.json
    
    print_success "IAM role created: $ROLE_NAME"
}

# Function to build and package Lambda function
build_lambda_package() {
    print_status "Building Lambda deployment package..."
    
    cd "$LAMBDA_DIR"
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing Lambda dependencies..."
        npm install --production
    fi
    
    # Create deployment package
    print_status "Creating deployment ZIP..."
    zip -r "../activities-lambda.zip" . -x "*.git*" "*.DS_Store*" "test/*" "*.md"
    
    print_success "Lambda package created: activities-lambda.zip"
    cd "$PROJECT_ROOT"
}

# Function to deploy or update Lambda function
deploy_lambda_function() {
    local role_arn="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"
    
    print_status "Deploying Lambda function: $FUNCTION_NAME"
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
        print_status "Function exists. Updating code..."
        
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file "fileb://$PROJECT_ROOT/lambda/activities-lambda.zip" \
            --region "$REGION" \
            >/dev/null
        
        # Update environment variables
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --environment "Variables={ACTIVITIES_TABLE_NAME=situ8-activities-dev,AWS_REGION=$REGION}" \
            --region "$REGION" \
            >/dev/null
        
        print_success "Lambda function updated"
    else
        print_status "Creating new Lambda function..."
        
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime "nodejs18.x" \
            --role "$role_arn" \
            --handler "index.handler" \
            --zip-file "fileb://$PROJECT_ROOT/lambda/activities-lambda.zip" \
            --timeout 30 \
            --memory-size 256 \
            --environment "Variables={ACTIVITIES_TABLE_NAME=situ8-activities-dev,AWS_REGION=$REGION}" \
            --region "$REGION" \
            >/dev/null
        
        # Wait for function to be ready
        print_status "Waiting for Lambda function to be ready..."
        sleep 10
        
        print_success "Lambda function created"
    fi
}

# Function to connect Lambda to API Gateway
connect_to_api_gateway() {
    print_status "Connecting Lambda to API Gateway..."
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local lambda_arn="arn:aws:lambda:$REGION:$account_id:function:$FUNCTION_NAME"
    local source_arn="arn:aws:execute-api:$REGION:$account_id:$API_GATEWAY_ID/*/*"
    
    # Add permission for API Gateway to invoke Lambda
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "apigateway-invoke" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "$source_arn" \
        --region "$REGION" \
        >/dev/null 2>&1 || true  # Ignore if permission already exists
    
    print_success "Lambda connected to API Gateway"
    print_status "Lambda ARN: $lambda_arn"
    print_status "Next: Update API Gateway to use Lambda integration instead of mock"
}

# Function to create API Gateway integration update script
create_integration_update_script() {
    local update_script="$PROJECT_ROOT/update-api-gateway-integration.sh"
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local lambda_arn="arn:aws:lambda:$REGION:$account_id:function:$FUNCTION_NAME"
    
    cat > "$update_script" << EOF
#!/bin/bash
# Update API Gateway to use Lambda integration instead of mock

API_ID="$API_GATEWAY_ID"
REGION="$REGION"
LAMBDA_ARN="$lambda_arn"

echo "Updating API Gateway integration to use Lambda..."

# You would typically update the CloudFormation template and redeploy
# For now, this shows the AWS CLI commands needed:

echo "API Gateway ID: \$API_ID"
echo "Lambda ARN: \$LAMBDA_ARN"
echo ""
echo "To complete the integration:"
echo "1. Update infrastructure/api-gateway-stack.yaml"
echo "2. Change Integration Type from MOCK to AWS_PROXY"
echo "3. Set Integration URI to \$LAMBDA_ARN"
echo "4. Redeploy the CloudFormation stack"
EOF
    
    chmod +x "$update_script"
    print_success "Created integration update script: update-api-gateway-integration.sh"
}

# Function to test Lambda function
test_lambda_function() {
    print_status "Testing Lambda function..."
    
    # Create test event
    cat > /tmp/test-event.json << EOF
{
  "httpMethod": "GET",
  "pathParameters": null,
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-123",
        "cognito:username": "testuser",
        "custom:role": "officer"
      }
    }
  }
}
EOF

    # Invoke Lambda
    local result=$(aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload file:///tmp/test-event.json \
        --region "$REGION" \
        /tmp/lambda-response.json)
    
    if [ $? -eq 0 ]; then
        print_success "Lambda test successful"
        echo "Response:"
        cat /tmp/lambda-response.json | jq '.'
    else
        print_error "Lambda test failed"
        cat /tmp/lambda-response.json
    fi
    
    # Clean up temp files
    rm -f /tmp/test-event.json /tmp/lambda-response.json
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Activities Lambda Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_status "Deploying to region: $REGION"
    print_status "Function name: $FUNCTION_NAME"
    print_status "API Gateway ID: $API_GATEWAY_ID"
    echo ""
    
    # Create IAM role
    create_lambda_role
    sleep 5  # Wait for role propagation
    
    # Build and package
    build_lambda_package
    
    # Deploy function
    deploy_lambda_function
    
    # Connect to API Gateway
    connect_to_api_gateway
    
    # Create integration update script
    create_integration_update_script
    
    # Test function
    test_lambda_function
    
    echo ""
    print_success "Activities Lambda deployment complete!"
    echo ""
    print_status "Next steps:"
    echo "1. Update API Gateway CloudFormation template to use Lambda integration"
    echo "2. Redeploy API Gateway stack"
    echo "3. Test endpoints with real Lambda backend"
    echo "4. Deploy other Lambda functions (incidents, cases, etc.)"
}

# Run main function
main "$@"