#!/bin/bash

# Setup DynamoDB Local for Situ8 Security Platform
# This allows offline development without AWS

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
LOCAL_DYNAMODB_DIR="$PROJECT_ROOT/.dynamodb-local"
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if DynamoDB Local is installed
check_dynamodb_local() {
    if [ ! -d "$LOCAL_DYNAMODB_DIR" ]; then
        print_status "DynamoDB Local not found. Installing..."
        mkdir -p "$LOCAL_DYNAMODB_DIR"
        
        # Download DynamoDB Local
        cd "$LOCAL_DYNAMODB_DIR"
        curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
        tar -xzf dynamodb_local_latest.tar.gz
        rm dynamodb_local_latest.tar.gz
        cd "$PROJECT_ROOT"
        
        print_success "DynamoDB Local installed"
    else
        print_status "DynamoDB Local already installed"
    fi
}

# Function to check if Java is installed
check_java() {
    if ! command -v java &> /dev/null; then
        print_error "Java is required to run DynamoDB Local"
        print_status "Please install Java 8 or higher"
        exit 1
    fi
    
    print_success "Java is installed"
}

# Function to start DynamoDB Local
start_dynamodb_local() {
    print_status "Starting DynamoDB Local on port $DYNAMODB_PORT..."
    
    # Check if already running
    if lsof -Pi :$DYNAMODB_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "DynamoDB Local is already running on port $DYNAMODB_PORT"
        return 0
    fi
    
    # Start DynamoDB Local in background
    java -Djava.library.path="$LOCAL_DYNAMODB_DIR/DynamoDBLocal_lib" \
         -jar "$LOCAL_DYNAMODB_DIR/DynamoDBLocal.jar" \
         -sharedDb \
         -port $DYNAMODB_PORT \
         -dbPath "$LOCAL_DYNAMODB_DIR/data" \
         > "$LOCAL_DYNAMODB_DIR/dynamodb-local.log" 2>&1 &
    
    # Save PID
    echo $! > "$LOCAL_DYNAMODB_DIR/dynamodb-local.pid"
    
    # Wait for startup
    sleep 3
    
    # Check if started successfully
    if lsof -Pi :$DYNAMODB_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "DynamoDB Local started successfully"
        print_status "Access at: http://localhost:$DYNAMODB_PORT"
        print_status "Log file: $LOCAL_DYNAMODB_DIR/dynamodb-local.log"
    else
        print_error "Failed to start DynamoDB Local"
        cat "$LOCAL_DYNAMODB_DIR/dynamodb-local.log"
        exit 1
    fi
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

# Function to create start script
create_start_script() {
    local start_script="$PROJECT_ROOT/start-dynamodb-local.sh"
    
    cat > "$start_script" << 'EOF'
#!/bin/bash
# Start DynamoDB Local for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DYNAMODB_DIR="$SCRIPT_DIR/.dynamodb-local"
DYNAMODB_PORT=8000

# Check if already running
if lsof -Pi :$DYNAMODB_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "DynamoDB Local is already running on port $DYNAMODB_PORT"
    exit 0
fi

echo "Starting DynamoDB Local..."
java -Djava.library.path="$LOCAL_DYNAMODB_DIR/DynamoDBLocal_lib" \
     -jar "$LOCAL_DYNAMODB_DIR/DynamoDBLocal.jar" \
     -sharedDb \
     -port $DYNAMODB_PORT \
     -dbPath "$LOCAL_DYNAMODB_DIR/data"
EOF
    
    chmod +x "$start_script"
    print_success "Created start script: start-dynamodb-local.sh"
}

# Function to create stop script
create_stop_script() {
    local stop_script="$PROJECT_ROOT/stop-dynamodb-local.sh"
    
    cat > "$stop_script" << 'EOF'
#!/bin/bash
# Stop DynamoDB Local

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DYNAMODB_DIR="$SCRIPT_DIR/.dynamodb-local"
PID_FILE="$LOCAL_DYNAMODB_DIR/dynamodb-local.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill $PID 2>/dev/null; then
        echo "Stopped DynamoDB Local (PID: $PID)"
        rm "$PID_FILE"
    else
        echo "DynamoDB Local process not found"
        rm "$PID_FILE"
    fi
else
    # Try to find by port
    PID=$(lsof -ti:8000)
    if [ ! -z "$PID" ]; then
        kill $PID
        echo "Stopped DynamoDB Local (PID: $PID)"
    else
        echo "DynamoDB Local is not running"
    fi
fi
EOF
    
    chmod +x "$stop_script"
    print_success "Created stop script: stop-dynamodb-local.sh"
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DynamoDB Local Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Setup steps
    check_java
    check_dynamodb_local
    start_dynamodb_local
    create_local_tables
    create_start_script
    create_stop_script
    
    # Update .gitignore
    if ! grep -q ".dynamodb-local" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
        echo -e "\n# DynamoDB Local\n.dynamodb-local/" >> "$PROJECT_ROOT/.gitignore"
        print_status "Added .dynamodb-local to .gitignore"
    fi
    
    echo ""
    print_success "DynamoDB Local setup complete!"
    echo ""
    print_status "Usage:"
    echo "  Start: ./start-dynamodb-local.sh"
    echo "  Stop:  ./stop-dynamodb-local.sh"
    echo ""
    print_status "Connection:"
    echo "  Endpoint: http://localhost:8000"
    echo "  Use REACT_APP_DYNAMODB_ENDPOINT=http://localhost:8000 for local development"
    echo ""
    print_status "AWS CLI with local endpoint:"
    echo "  aws dynamodb list-tables --endpoint-url http://localhost:8000"
}

# Run main function
main "$@"