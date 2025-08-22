#!/bin/bash

echo "🔧 SITU8 AUTHENTICATION FIX SCRIPT"
echo "=================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📁 Found .env.local file"
    
    # Check if it contains the problematic placeholder
    if grep -q "your-client-id-here" .env.local; then
        echo "🚨 FOUND THE PROBLEM: .env.local contains placeholder values!"
        echo "   This is overriding your correct .env.development configuration"
        echo ""
        
        # Ask user what they want to do
        echo "Choose your fix:"
        echo "1) Delete .env.local (RECOMMENDED - use .env.development values)"
        echo "2) Update .env.local with correct VITE_ prefixed values"
        echo "3) Backup .env.local and delete it"
        echo ""
        read -p "Enter choice (1-3): " choice
        
        case $choice in
            1)
                echo "🗑️  Deleting .env.local..."
                rm .env.local
                echo "✅ .env.local deleted successfully"
                ;;
            2)
                echo "📝 Updating .env.local with correct values..."
                # Backup original
                cp .env.local .env.local.backup
                echo "📄 Original backed up to .env.local.backup"
                
                # Create new .env.local with correct values
                cat > .env.local << 'EOF'
# Situ8 Security Platform - Local Development (Fixed)
# Using VITE_ prefixes for proper loading

# AWS Configuration
VITE_USE_AWS_API=true
VITE_AWS_REGION=us-west-2
VITE_COGNITO_USER_POOL_ID=us-west-2_ECLKvbdSp
VITE_COGNITO_CLIENT_ID=5ouh548bibh1rrp11neqcvvqf6
VITE_COGNITO_IDENTITY_POOL_ID=us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4

# Development settings
VITE_ENVIRONMENT=development
VITE_DEBUG=true

# API Configuration
VITE_API_BASE_URL=https://xb3rai5taf.execute-api.us-west-2.amazonaws.com/dev
EOF
                echo "✅ .env.local updated with correct VITE_ prefixed values"
                ;;
            3)
                echo "💾 Backing up and deleting .env.local..."
                mv .env.local .env.local.backup
                echo "✅ .env.local backed up to .env.local.backup and removed"
                ;;
            *)
                echo "❌ Invalid choice. Please run the script again."
                exit 1
                ;;
        esac
        
    else
        echo "ℹ️  .env.local exists but doesn't contain obvious placeholder values"
        echo "   However, it may still be overriding your .env.development settings"
        echo ""
        read -p "Delete .env.local to use .env.development values? (y/n): " confirm
        
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            mv .env.local .env.local.backup
            echo "✅ .env.local backed up and removed"
        else
            echo "ℹ️  Keeping .env.local as is"
        fi
    fi
else
    echo "✅ No .env.local file found - .env.development values will be used"
fi

echo ""
echo "🧪 TESTING ENVIRONMENT SETUP..."
echo ""

# Check if required VITE_ variables exist in remaining env files
echo "Checking environment variables in remaining files:"

for file in .env .env.development .env.production; do
    if [ -f "$file" ]; then
        echo "📄 $file:"
        
        # Check for COGNITO variables
        if grep -q "VITE_COGNITO_USER_POOL_ID" "$file"; then
            pool_id=$(grep "VITE_COGNITO_USER_POOL_ID" "$file" | cut -d'=' -f2)
            echo "   ✅ VITE_COGNITO_USER_POOL_ID: ${pool_id:0:15}..."
        else
            echo "   ❌ VITE_COGNITO_USER_POOL_ID: not found"
        fi
        
        if grep -q "VITE_COGNITO_CLIENT_ID" "$file"; then
            client_id=$(grep "VITE_COGNITO_CLIENT_ID" "$file" | cut -d'=' -f2)
            echo "   ✅ VITE_COGNITO_CLIENT_ID: ${client_id:0:15}..."
        else
            echo "   ❌ VITE_COGNITO_CLIENT_ID: not found"
        fi
        
        echo ""
    fi
done

echo "🚀 NEXT STEPS:"
echo "============="
echo "1. Restart your development server:"
echo "   npm run dev"
echo ""
echo "2. Open browser console and run this test:"
echo "   console.log('Env check:', {"
echo "     VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,"
echo "     VITE_COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID"
echo "   });"
echo ""
echo "3. Try logging in with:"
echo "   Email: yamen@example.com"
echo "   Password: TempPassword123!"
echo ""
echo "4. If still having issues, open: auth-debug-comprehensive.html"
echo ""
echo "✨ Authentication should now work!"