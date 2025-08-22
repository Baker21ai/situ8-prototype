#!/bin/bash

echo "🧹 SITU8 Development Server - Fresh Start Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clear Vite caches
print_status "Clearing Vite development caches..."
rm -rf node_modules/.vite
rm -rf .vite
echo "✅ Vite caches cleared"

# Clear build artifacts
print_status "Removing build artifacts..."
rm -rf dist
echo "✅ Build artifacts removed"

# Clear browser-related caches
print_status "Clearing browser storage files..."
rm -rf .eslintcache 2>/dev/null || true
echo "✅ Cache files removed"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    print_status ".env.local found - environment variables ready"
else
    print_warning ".env.local not found - copying from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_status "Created .env.local from .env.example"
    else
        print_error ".env.example not found - please create .env.local manually"
    fi
fi

# Display current environment variables for debugging
print_status "Current AWS Cognito configuration:"
echo "COGNITO_USER_POOL_ID: ${COGNITO_USER_POOL_ID:-'Not set in shell'}"
echo "COGNITO_CLIENT_ID: ${COGNITO_CLIENT_ID:-'Not set in shell'}"

# Check if required packages are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found - running npm install..."
    npm install
    echo "✅ Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Start the development server
print_status "Starting development server with fresh state..."
echo ""
echo "🚀 Starting Vite development server..."
echo "📱 Your app will be available at: ${BLUE}http://localhost:5173${NC}"
echo "🧪 Test authentication at: ${BLUE}http://localhost:5173/auth-test.html${NC}"
echo ""

# Start the server
vite