#!/bin/bash

# Fix DynamoDB table definitions for PAY_PER_REQUEST billing mode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DYNAMODB_DIR="$PROJECT_ROOT/infrastructure/dynamodb"

echo "Fixing DynamoDB table definitions..."

# For each JSON file in the dynamodb directory
for file in "$DYNAMODB_DIR"/*.json; do
    echo "Fixing: $(basename "$file")"
    
    # Remove ProvisionedThroughput from GlobalSecondaryIndexes when using PAY_PER_REQUEST
    # This uses jq to remove the ProvisionedThroughput property from each GSI
    jq 'if .BillingMode == "PAY_PER_REQUEST" and .GlobalSecondaryIndexes then 
        .GlobalSecondaryIndexes |= map(del(.ProvisionedThroughput))
    else . end' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "All table definitions fixed!"