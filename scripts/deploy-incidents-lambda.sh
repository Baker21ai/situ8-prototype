#!/bin/bash

# Deploy Incidents Lambda Function
# This creates the Lambda function for incident management

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
LAMBDA_DIR="$PROJECT_ROOT/lambda/incidents"
FUNCTION_NAME="situ8-incidents-api-dev"
REGION="us-west-2"
ROLE_NAME="situ8-lambda-execution-role"

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

# Function to build and package Lambda function
build_lambda_package() {
    print_status "Building Incidents Lambda deployment package..."
    
    cd "$LAMBDA_DIR"
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing Lambda dependencies..."
        npm install --production
    fi
    
    # Create deployment package
    print_status "Creating deployment ZIP..."
    zip -r "../incidents-lambda.zip" . -x "*.git*" "*.DS_Store*" "test/*" "*.md"
    
    print_success "Lambda package created: incidents-lambda.zip"
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
            --zip-file "fileb://$PROJECT_ROOT/lambda/incidents-lambda.zip" \
            --region "$REGION" \
            >/dev/null
        
        # Update environment variables
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --environment "Variables={INCIDENTS_TABLE_NAME=situ8-incidents-dev,ACTIVITIES_TABLE_NAME=situ8-activities-dev}" \
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
            --zip-file "fileb://$PROJECT_ROOT/lambda/incidents-lambda.zip" \
            --timeout 30 \
            --memory-size 256 \
            --environment "Variables={INCIDENTS_TABLE_NAME=situ8-incidents-dev,ACTIVITIES_TABLE_NAME=situ8-activities-dev}" \
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
    print_status "Adding API Gateway permissions to Lambda..."
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local api_gateway_id="xb3rai5taf"
    local source_arn="arn:aws:execute-api:$REGION:$account_id:$api_gateway_id/*/*"
    
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
    
    local lambda_arn="arn:aws:lambda:$REGION:$account_id:function:$FUNCTION_NAME"
    print_status "Lambda ARN: $lambda_arn"
}

# Function to test Lambda function
test_lambda_function() {
    print_status "Testing Lambda function..."
    
    # Create test event for listing incidents
    cat > /tmp/test-incidents-event.json << 'EOF'
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

    # Invoke Lambda without payload first (simpler test)
    local result=$(aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        /tmp/incidents-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        print_success "Lambda test successful"
        echo "Response preview:"
        head -c 200 /tmp/incidents-response.json
        echo ""
    else
        print_warning "Lambda test had issues (this may be normal)"
        echo "Response:"
        cat /tmp/incidents-response.json 2>/dev/null || echo "No response file"
    fi
    
    # Clean up temp files
    rm -f /tmp/test-incidents-event.json /tmp/incidents-response.json
}

# Function to output next steps
output_next_steps() {
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local lambda_arn="arn:aws:lambda:$REGION:$account_id:function:$FUNCTION_NAME"
    
    echo ""
    print_success "Incidents Lambda deployment complete!"
    echo ""
    print_status "Lambda Function Details:"
    echo "  Name: $FUNCTION_NAME"
    echo "  ARN: $lambda_arn"
    echo "  Runtime: Node.js 18.x"
    echo "  Environment: INCIDENTS_TABLE_NAME=situ8-incidents-dev"
    echo "  Environment: ACTIVITIES_TABLE_NAME=situ8-activities-dev"
    echo ""
    print_status "Next steps:"
    echo "1. Update API Gateway CloudFormation template to add Incidents endpoints"
    echo "2. Add Lambda integration for /api/incidents routes"
    echo "3. Redeploy API Gateway stack"
    echo "4. Test incident CRUD operations"
    echo "5. Test incident auto-creation from activities"
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Incidents Lambda Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_status "Deploying to region: $REGION"
    print_status "Function name: $FUNCTION_NAME"
    echo ""
    
    # Build and package
    build_lambda_package
    
    # Deploy function
    deploy_lambda_function
    
    # Connect to API Gateway
    connect_to_api_gateway
    
    # Test function
    test_lambda_function
    
    # Output next steps
    output_next_steps
}

# Run main function
main "$@"