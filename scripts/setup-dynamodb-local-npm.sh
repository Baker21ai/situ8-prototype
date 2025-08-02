#!/bin/bash

# Setup DynamoDB Local using NPM package
# This is a simpler and faster approach

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
DYNAMODB_PORT=8000

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

# Function to create local tables
create_local_tables() {
    print_status "Creating tables in DynamoDB Local..."
    
    local endpoint="http://localhost:$DYNAMODB_PORT"
    local tables=(
        "user-profiles-table.json"
        "activities-table.json"
        "incidents-table.json"
        "cases-table.json"
        "bol-table.json"
        "audit-table.json"
    )
    
    for table_json in "${tables[@]}"; do
        local table_name=$(jq -r '.TableName' "$DYNAMODB_DIR/$table_json")
        
        # Check if table exists
        if aws dynamodb describe-table \
            --table-name "$table_name" \
            --endpoint-url "$endpoint" \
            --output text >/dev/null 2>&1; then
            print_status "Table $table_name already exists locally"
            continue
        fi
        
        print_status "Creating local table: $table_name"
        
        # Create the table
        aws dynamodb create-table \
            --cli-input-json "file://$DYNAMODB_DIR/$table_json" \
            --endpoint-url "$endpoint" \
            --output text >/dev/null
        
        print_success "Created table: $table_name"
    done
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DynamoDB Local Setup (NPM)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_status "Installing serverless-dynamodb-local..."
    cd "$PROJECT_ROOT"
    
    # Install as dev dependency
    npm install --save-dev serverless-dynamodb-local
    
    # Create npm scripts in package.json
    print_status "Adding npm scripts for DynamoDB Local..."
    
    # Check if scripts exist, if not add them
    if ! grep -q "dynamodb:start" package.json; then
        # Use npm pkg to add scripts
        npm pkg set scripts.dynamodb:start="npx dynamodb-local -p $DYNAMODB_PORT"
        npm pkg set scripts.dynamodb:start:bg="npx dynamodb-local -p $DYNAMODB_PORT &"
        npm pkg set scripts.dynamodb:stop="pkill -f DynamoDBLocal"
        npm pkg set scripts.dynamodb:setup="node scripts/setup-local-tables.js"
        
        print_success "Added npm scripts to package.json"
    fi
    
    # Create setup script for tables
    cat > "$PROJECT_ROOT/scripts/setup-local-tables.js" << 'EOF'
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK for local DynamoDB
const dynamodb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'us-west-2',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});

const tableDir = path.join(__dirname, '..', 'infrastructure', 'dynamodb');

async function createTable(tableDef) {
  try {
    await dynamodb.createTable(tableDef).promise();
    console.log(`✅ Created table: ${tableDef.TableName}`);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log(`⏭️  Table already exists: ${tableDef.TableName}`);
    } else {
      console.error(`❌ Error creating table ${tableDef.TableName}:`, error.message);
    }
  }
}

async function setupTables() {
  console.log('Setting up DynamoDB Local tables...\n');
  
  const tableFiles = [
    'user-profiles-table.json',
    'activities-table.json',
    'incidents-table.json',
    'cases-table.json',
    'bol-table.json',
    'audit-table.json'
  ];
  
  for (const file of tableFiles) {
    const tableDef = JSON.parse(
      fs.readFileSync(path.join(tableDir, file), 'utf8')
    );
    await createTable(tableDef);
  }
  
  console.log('\n✅ DynamoDB Local setup complete!');
}

setupTables().catch(console.error);
EOF
    
    print_success "Created table setup script"
    
    # Start DynamoDB Local
    print_status "Starting DynamoDB Local on port $DYNAMODB_PORT..."
    npm run dynamodb:start:bg
    
    # Wait for it to start
    sleep 3
    
    # Create tables
    create_local_tables
    
    echo ""
    print_success "DynamoDB Local setup complete!"
    echo ""
    print_status "Usage:"
    echo "  Start: npm run dynamodb:start"
    echo "  Stop:  npm run dynamodb:stop"
    echo "  Setup tables: npm run dynamodb:setup"
    echo ""
    print_status "Connection:"
    echo "  Endpoint: http://localhost:$DYNAMODB_PORT"
    echo "  Use REACT_APP_DYNAMODB_ENDPOINT=http://localhost:$DYNAMODB_PORT for local development"
    echo ""
    print_status "Test with:"
    echo "  aws dynamodb list-tables --endpoint-url http://localhost:$DYNAMODB_PORT"
}

# Run main function
main "$@"