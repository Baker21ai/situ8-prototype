#!/bin/bash

# Deploy API Gateway for Situ8 Security Platform
# This creates the REST API with Cognito authentication

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
STACK_NAME="situ8-api-gateway-dev"
TEMPLATE_FILE="$PROJECT_ROOT/infrastructure/api-gateway-stack.yaml"
REGION="us-west-2"
COGNITO_USER_POOL_ID="us-west-2_ECLKvbdSp"

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

# Function to validate template
validate_template() {
    print_status "Validating CloudFormation template..."
    
    if aws cloudformation validate-template \
        --template-body "file://$TEMPLATE_FILE" \
        --region "$REGION" \
        --output text >/dev/null 2>&1; then
        print_success "Template validation passed"
        return 0
    else
        print_error "Template validation failed"
        aws cloudformation validate-template \
            --template-body "file://$TEMPLATE_FILE" \
            --region "$REGION"
        return 1
    fi
}

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --output text >/dev/null 2>&1
}

# Function to deploy or update stack
deploy_stack() {
    local action="create"
    if stack_exists; then
        action="update"
        print_status "Stack exists. Updating..."
    else
        print_status "Creating new stack..."
    fi
    
    aws cloudformation "$action-stack" \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters \
            ParameterKey=Environment,ParameterValue="dev" \
            ParameterKey=AppName,ParameterValue="situ8-platform" \
            ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --tags \
            Key=Environment,Value="dev" \
            Key=Application,Value="situ8-platform" \
            Key=Service,Value="api-gateway" \
            Key=ManagedBy,Value="cloudformation" \
        --region "$REGION"
    
    # Wait for stack to complete
    print_status "Waiting for stack $action to complete..."
    
    aws cloudformation wait "stack-$action-complete" \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
    
    print_success "Stack $action completed successfully!"
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Retrieving API Gateway endpoints..."
    
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
        --output text)
    
    local api_id=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='RestApiId'].OutputValue" \
        --output text)
    
    echo ""
    print_success "API Gateway deployed successfully!"
    echo ""
    print_status "API Gateway Details:"
    echo "  API URL: $api_url"
    echo "  API ID: $api_id"
    echo ""
    print_status "Available Endpoints:"
    echo "  Activities: $api_url/api/activities"
    echo "  Incidents: $api_url/api/incidents"
    echo "  Cases: $api_url/api/cases"
    echo "  BOL: $api_url/api/bol"
    echo "  Audit: $api_url/api/audit"
    echo "  User Profile: $api_url/api/user/profile"
}

# Function to test API endpoint
test_api_endpoint() {
    local api_url=$1
    
    print_status "Testing API endpoint (should return 401 Unauthorized without auth)..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_url/api/activities")
    
    if [ "$response_code" = "401" ]; then
        print_success "API is properly secured (returned 401 Unauthorized)"
    else
        print_warning "Unexpected response code: $response_code"
    fi
}

# Function to create test script
create_test_script() {
    local test_script="$PROJECT_ROOT/test-api-gateway.sh"
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
        --output text)
    
    cat > "$test_script" << EOF
#!/bin/bash
# Test API Gateway endpoints with Cognito authentication

API_URL="$api_url"
COGNITO_CLIENT_ID="[YOUR_COGNITO_CLIENT_ID]"
USERNAME="[YOUR_USERNAME]"
PASSWORD="[YOUR_PASSWORD]"

# Function to get auth token
get_auth_token() {
    echo "Getting authentication token..."
    # Add your authentication logic here
    # This would typically use AWS Cognito InitiateAuth API
}

# Test GET /api/activities
echo "Testing GET /api/activities..."
curl -X GET "\$API_URL/api/activities" \\
  -H "Authorization: Bearer \$AUTH_TOKEN" \\
  -H "Content-Type: application/json"

# Test POST /api/activities
echo ""
echo "Testing POST /api/activities..."
curl -X POST "\$API_URL/api/activities" \\
  -H "Authorization: Bearer \$AUTH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "patrol",
    "title": "Test Activity",
    "description": "Testing API Gateway"
  }'

# Add more test cases as needed
EOF
    
    chmod +x "$test_script"
    print_success "Created test script: test-api-gateway.sh"
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  API Gateway Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_status "Deploying to region: $REGION"
    print_status "Using Cognito User Pool: $COGNITO_USER_POOL_ID"
    echo ""
    
    # Validate template
    if ! validate_template; then
        exit 1
    fi
    
    # Deploy stack
    deploy_stack
    
    # Get outputs
    get_stack_outputs
    
    # Test endpoint
    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
        --output text)
    
    test_api_endpoint "$api_url"
    
    # Create test script
    create_test_script
    
    echo ""
    print_status "Next steps:"
    echo "1. Update frontend environment variables with API URL"
    echo "2. Configure Cognito app client for authentication"
    echo "3. Test endpoints with JWT tokens from Cognito"
    echo "4. Begin implementing Lambda functions (Phase 2)"
    echo ""
    print_status "Environment variables to add:"
    echo "  REACT_APP_API_URL=$api_url"
    echo "  REACT_APP_AWS_REGION=$REGION"
    echo "  REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID"
}

# Run main function
main "$@"