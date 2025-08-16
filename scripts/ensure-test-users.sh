#!/bin/bash

# Ensure test users always exist with correct passwords
# Run this anytime to guarantee users are ready

echo "🔐 Ensuring Test Users Are Ready..."
echo "=================================="

USER_POOL_ID="us-west-2_ECLKvbdSp"
REGION="us-west-2"
PASSWORD="SecurePass123!"

# Test users that MUST always work
declare -a USERS=(
    "yamen@example.com"
    "dispatcher01@situ8.com"
    "admin@situ8.test"
    "guard@situ8.test"
    "supervisor@situ8.test"
)

echo ""
echo "Checking/Creating Test Users:"
echo ""

# Function to ensure user exists with permanent password
ensure_user() {
    local email=$1
    
    echo -n "  $email ... "
    
    # Check if user exists
    if aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" \
        --region "$REGION" &>/dev/null; then
        
        # User exists - set permanent password
        if aws cognito-idp admin-set-user-password \
            --user-pool-id "$USER_POOL_ID" \
            --username "$email" \
            --password "$PASSWORD" \
            --permanent \
            --region "$REGION" 2>/dev/null; then
            echo "✅ Ready (password updated)"
        else
            echo "⚠️  Exists (password update failed)"
        fi
    else
        # User doesn't exist - create it
        if aws cognito-idp admin-create-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$email" \
            --user-attributes \
                Name=email,Value="$email" \
                Name=email_verified,Value=true \
            --message-action SUPPRESS \
            --region "$REGION" &>/dev/null; then
            
            # Set permanent password
            if aws cognito-idp admin-set-user-password \
                --user-pool-id "$USER_POOL_ID" \
                --username "$email" \
                --password "$PASSWORD" \
                --permanent \
                --region "$REGION" 2>/dev/null; then
                echo "✅ Created & Ready"
            else
                echo "⚠️  Created (password set failed)"
            fi
        else
            echo "❌ Failed to create"
        fi
    fi
}

# Process all users
for email in "${USERS[@]}"; do
    ensure_user "$email"
done

echo ""
echo "=================================="
echo "✅ Test Users Ready!"
echo ""
echo "Login with any of these:"
for email in "${USERS[@]}"; do
    echo "  📧 $email"
    echo "     Password: $PASSWORD"
    echo ""
done
echo "=================================="