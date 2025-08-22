#!/bin/bash

# Deploy Cognito Stack for Situ8 Security Platform
# Usage: ./scripts/deploy-cognito.sh [environment]

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
STACK_NAME="situ8-cognito"
TEMPLATE_FILE="$PROJECT_ROOT/infrastructure/cognito-stack.yaml"

# Parse environment argument
ENVIRONMENT=${1:-dev}
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Use: dev, staging, or prod${NC}"
    exit 1
fi

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check AWS CLI configuration
check_aws_config() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS CLI is not configured or credentials are invalid."
        print_status "Run 'aws configure' to set up your credentials."
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local region=$(aws configure get region)
    
    print_success "AWS CLI configured successfully"
    print_status "Account ID: $account_id"
    print_status "Region: $region"
}

# Function to validate CloudFormation template
validate_template() {
    print_status "Validating CloudFormation template..."
    
    if ! aws cloudformation validate-template --template-body "file://$TEMPLATE_FILE" &> /dev/null; then
        print_error "CloudFormation template validation failed."
        exit 1
    fi
    
    print_success "Template validation passed"
}

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name "$STACK_NAME-$ENVIRONMENT" &> /dev/null
    return $?
}

# Function to deploy or update stack
deploy_stack() {
    local action
    local full_stack_name="$STACK_NAME-$ENVIRONMENT"
    
    if stack_exists; then
        action="update"
        print_status "Updating existing stack: $full_stack_name"
    else
        action="create"
        print_status "Creating new stack: $full_stack_name"
    fi
    
    # Deploy stack
    local changeset_name="changeset-$(date +%Y%m%d-%H%M%S)"
    
    print_status "Creating changeset: $changeset_name"
    aws cloudformation create-change-set \
        --stack-name "$full_stack_name" \
        --template-body "file://$TEMPLATE_FILE" \
        --change-set-name "$changeset_name" \
        --parameters ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                    ParameterKey=AppName,ParameterValue="situ8-security-platform" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --tags Key=Environment,Value="$ENVIRONMENT" \
               Key=Application,Value="situ8-security-platform" \
               Key=Service,Value="authentication" \
               Key=ManagedBy,Value="cloudformation"
    
    # Wait for changeset creation
    print_status "Waiting for changeset creation..."
    aws cloudformation wait change-set-create-complete \
        --stack-name "$full_stack_name" \
        --change-set-name "$changeset_name"
    
    # Describe changes
    print_status "Changeset details:"
    aws cloudformation describe-change-set \
        --stack-name "$full_stack_name" \
        --change-set-name "$changeset_name" \
        --query 'Changes[].{Action:Action,Resource:ResourceChange.LogicalResourceId,Type:ResourceChange.ResourceType}' \
        --output table
    
    # Confirm execution
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        echo -e "${YELLOW}WARNING: Deploying to PRODUCTION environment!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    fi
    
    # Execute changeset
    print_status "Executing changeset..."
    aws cloudformation execute-change-set \
        --stack-name "$full_stack_name" \
        --change-set-name "$changeset_name"
    
    # Wait for completion
    print_status "Waiting for stack $action to complete..."
    if [[ "$action" == "create" ]]; then
        aws cloudformation wait stack-create-complete --stack-name "$full_stack_name"
    else
        aws cloudformation wait stack-update-complete --stack-name "$full_stack_name"
    fi
    
    print_success "Stack $action completed successfully!"
}

# Function to get stack outputs
get_stack_outputs() {
    local full_stack_name="$STACK_NAME-$ENVIRONMENT"
    
    print_status "Retrieving stack outputs..."
    
    local outputs=$(aws cloudformation describe-stacks \
        --stack-name "$full_stack_name" \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    if [[ "$outputs" == "null" ]]; then
        print_warning "No outputs found for stack"
        return
    fi
    
    echo -e "${GREEN}Stack Outputs:${NC}"
    echo "$outputs" | jq -r '.[] | "  \(.OutputKey): \(.OutputValue)"'
    
    # Extract key values for environment configuration
    local user_pool_id=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
    local client_id=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
    local identity_pool_id=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="IdentityPoolId") | .OutputValue')
    local domain=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="UserPoolDomain") | .OutputValue')
    
    # Generate environment configuration
    print_status "Environment configuration for $ENVIRONMENT:"
    echo -e "${BLUE}Add these to your .env.$ENVIRONMENT file:${NC}"
    echo "REACT_APP_COGNITO_USER_POOL_ID=$user_pool_id"
    echo "REACT_APP_COGNITO_CLIENT_ID=$client_id"
    echo "REACT_APP_COGNITO_IDENTITY_POOL_ID=$identity_pool_id"
    echo "REACT_APP_COGNITO_DOMAIN=$domain"
    echo "REACT_APP_AWS_REGION=us-west-2"
}

# Function to create initial users
create_initial_users() {
    local full_stack_name="$STACK_NAME-$ENVIRONMENT"
    
    print_status "Creating initial users..."
    
    # Get User Pool ID
    local user_pool_id=$(aws cloudformation describe-stacks \
        --stack-name "$full_stack_name" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    if [[ -z "$user_pool_id" ]]; then
        print_error "Could not retrieve User Pool ID"
        return 1
    fi
    
    # Create admin user
    print_status "Creating admin user: river@example.com"
    aws cognito-idp admin-create-user \
        --user-pool-id "$user_pool_id" \
        --username "river@example.com" \
        --user-attributes Name=email,Value="river@example.com" \
                          Name="custom:role",Value="admin" \
                          Name="custom:department",Value="management" \
                          Name="custom:clearanceLevel",Value="5" \
                          Name="custom:badgeNumber",Value="ADM001" \
                          Name="custom:facilityCodes",Value="ALL" \
                          Name=email_verified,Value="true" \
        --temporary-password "TempPassword123!" \
        --message-action SUPPRESS \
        --force-alias-creation || print_warning "Admin user may already exist"
    
    # Create security officer user
    print_status "Creating security officer user: celine@example.com"
    aws cognito-idp admin-create-user \
        --user-pool-id "$user_pool_id" \
        --username "celine@example.com" \
        --user-attributes Name=email,Value="celine@example.com" \
                          Name="custom:role",Value="security-officer" \
                          Name="custom:department",Value="security" \
                          Name="custom:clearanceLevel",Value="4" \
                          Name="custom:badgeNumber",Value="SEC001" \
                          Name="custom:facilityCodes",Value="ALL" \
                          Name=email_verified,Value="true" \
        --temporary-password "TempPassword123!" \
        --message-action SUPPRESS \
        --force-alias-creation || print_warning "Security officer user may already exist"
    
    # Create developer user
    print_status "Creating developer user: yamen@example.com"
    aws cognito-idp admin-create-user \
        --user-pool-id "$user_pool_id" \
        --username "yamen@example.com" \
        --user-attributes Name=email,Value="yamen@example.com" \
                          Name="custom:role",Value="developer" \
                          Name="custom:department",Value="it" \
                          Name="custom:clearanceLevel",Value="3" \
                          Name="custom:badgeNumber",Value="DEV001" \
                          Name="custom:facilityCodes",Value="MAIN,LAB" \
                          Name=email_verified,Value="true" \
        --temporary-password "TempPassword123!" \
        --message-action SUPPRESS \
        --force-alias-creation || print_warning "Developer user may already exist"
    
    # Create viewer user
    print_status "Creating viewer user: phil@example.com"
    aws cognito-idp admin-create-user \
        --user-pool-id "$user_pool_id" \
        --username "phil@example.com" \
        --user-attributes Name=email,Value="phil@example.com" \
                          Name="custom:role",Value="viewer" \
                          Name="custom:department",Value="operations" \
                          Name="custom:clearanceLevel",Value="1" \
                          Name="custom:badgeNumber",Value="VIE001" \
                          Name="custom:facilityCodes",Value="MAIN" \
                          Name=email_verified,Value="true" \
        --temporary-password "TempPassword123!" \
        --message-action SUPPRESS \
        --force-alias-creation || print_warning "Viewer user may already exist"
    
    print_success "Initial users created successfully"
    print_status "Default password for all users: TempPassword123!"
    print_warning "Users will be prompted to change password on first login"
}

# Main execution
main() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  Situ8 Cognito Stack Deployment${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""
    
    print_status "Deploying to environment: $ENVIRONMENT"
    echo ""
    
    # Run deployment steps
    check_aws_config
    validate_template
    deploy_stack
    get_stack_outputs
    
    # Create initial users for dev environment
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        echo ""
        read -p "Create initial test users? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_initial_users
        fi
    fi
    
    echo ""
    print_success "Cognito deployment completed successfully!"
    print_status "Stack name: $STACK_NAME-$ENVIRONMENT"
    print_status "Environment: $ENVIRONMENT"
    
    echo ""
    print_status "Next steps:"
    echo "1. Update your .env.$ENVIRONMENT file with the configuration above"
    echo "2. Install AWS Amplify: npm install @aws-amplify/auth @aws-amplify/core"
    echo "3. Configure Amplify in your React app with the Cognito settings"
    echo "4. Test authentication with the created users"
}

# Run main function
main "$@"