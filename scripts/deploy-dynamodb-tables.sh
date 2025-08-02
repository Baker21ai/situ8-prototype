#!/bin/bash

# Deploy DynamoDB Tables for Situ8 Security Platform
# Usage: ./scripts/deploy-dynamodb-tables.sh [environment]

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
DYNAMODB_DIR="$PROJECT_ROOT/infrastructure/dynamodb"
REGION="us-west-2"

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if table exists
table_exists() {
    local table_name=$1
    aws dynamodb describe-table \
        --table-name "$table_name" \
        --region "$REGION" \
        --output text >/dev/null 2>&1
}

# Function to wait for table to be active
wait_for_table() {
    local table_name=$1
    print_status "Waiting for table $table_name to become active..."
    
    aws dynamodb wait table-exists \
        --table-name "$table_name" \
        --region "$REGION"
    
    print_success "Table $table_name is active"
}

# Function to create a table
create_table() {
    local json_file=$1
    local table_name=$(jq -r '.TableName' "$json_file")
    
    # Update table name with environment suffix if not dev
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        table_name="${table_name//-dev/-$ENVIRONMENT}"
    fi
    
    if table_exists "$table_name"; then
        print_status "Table $table_name already exists, skipping..."
        return 0
    fi
    
    print_status "Creating table: $table_name"
    
    # Create temporary file with updated table name
    local temp_file="/tmp/$(basename "$json_file")"
    jq ".TableName = \"$table_name\"" "$json_file" > "$temp_file"
    
    # Create the table
    aws dynamodb create-table \
        --cli-input-json "file://$temp_file" \
        --region "$REGION" \
        --output text >/dev/null
    
    # Clean up temp file
    rm -f "$temp_file"
    
    # Wait for table to be active
    wait_for_table "$table_name"
}

# Function to enable point-in-time recovery
enable_pitr() {
    local table_name=$1
    
    print_status "Enabling point-in-time recovery for $table_name"
    
    aws dynamodb update-continuous-backups \
        --table-name "$table_name" \
        --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
        --region "$REGION" \
        >/dev/null 2>&1 || true
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Situ8 DynamoDB Tables Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_status "Deploying to environment: $ENVIRONMENT"
    print_status "Region: $REGION"
    echo ""
    
    # Check AWS CLI configuration
    if ! aws sts get-caller-identity --region "$REGION" --output text >/dev/null 2>&1; then
        print_error "AWS CLI is not configured properly for region $REGION"
        exit 1
    fi
    
    # Create tables
    local tables=(
        "user-profiles-table.json"
        "activities-table.json"
        "incidents-table.json"
        "cases-table.json"
        "bol-table.json"
        "audit-table.json"
    )
    
    for table_json in "${tables[@]}"; do
        create_table "$DYNAMODB_DIR/$table_json"
    done
    
    # Enable point-in-time recovery for production
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        print_status "Enabling point-in-time recovery for production tables..."
        for table_json in "${tables[@]}"; do
            local table_name=$(jq -r '.TableName' "$DYNAMODB_DIR/$table_json")
            table_name="${table_name//-dev/-$ENVIRONMENT}"
            enable_pitr "$table_name"
        done
    fi
    
    echo ""
    print_success "All DynamoDB tables deployed successfully!"
    
    # List created tables
    print_status "Created tables:"
    aws dynamodb list-tables \
        --region "$REGION" \
        --query "TableNames[?contains(@, 'situ8')]" \
        --output table
    
    echo ""
    print_status "Next steps:"
    echo "1. Install DynamoDB Local: npm install -g dynamodb-local"
    echo "2. Run local setup: ./scripts/setup-dynamodb-local.sh"
    echo "3. Update your .env files with table names"
}

# Run main function
main "$@"