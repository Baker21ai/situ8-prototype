#!/bin/bash

# Set permanent passwords for existing Cognito users
# This bypasses the FORCE_CHANGE_PASSWORD requirement

echo "🔐 Setting permanent passwords for Cognito users..."
echo "=================================================="

USER_POOL_ID="us-west-2_ECLKvbdSp"
REGION="us-west-2"
PASSWORD="SecurePass123!"

# List of users to update
USERS=(
    "yamen@example.com"
    "dispatcher01@situ8.com"
    "dispatcher02@situ8.com"
    "responder01@situ8.com"
    "responder02@situ8.com"
    "supervisor01@situ8.com"
)

echo ""
echo "Users to update:"
for email in "${USERS[@]}"; do
    echo "  - $email"
done
echo ""

# Function to set permanent password
set_permanent_password() {
    local email=$1
    
    echo -n "Setting password for $email... "
    
    # Set permanent password using admin-set-user-password
    if aws cognito-idp admin-set-user-password \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" \
        --password "$PASSWORD" \
        --permanent \
        --region "$REGION" 2>/dev/null; then
        echo "✅ Success"
        return 0
    else
        # If user doesn't exist, show different message
        if aws cognito-idp admin-get-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$email" \
            --region "$REGION" &>/dev/null; then
            echo "⚠️  Failed to set password"
        else
            echo "❌ User does not exist"
        fi
        return 1
    fi
}

# Process each user
success_count=0
fail_count=0

for email in "${USERS[@]}"; do
    if set_permanent_password "$email"; then
        ((success_count++))
    else
        ((fail_count++))
    fi
done

echo ""
echo "=================================================="
echo "Results:"
echo "  ✅ Successful: $success_count users"
if [ $fail_count -gt 0 ]; then
    echo "  ❌ Failed: $fail_count users"
fi
echo ""
echo "Test credentials:"
echo "  Email: yamen@example.com"
echo "  Password: $PASSWORD"
echo ""
echo "You can now log in with these credentials without needing to change the password!"
echo ""

# Show how to create new users if needed
if [ $fail_count -gt 0 ]; then
    echo "To create missing users, use AWS CLI:"
    echo ""
    echo "aws cognito-idp admin-create-user \\"
    echo "  --user-pool-id $USER_POOL_ID \\"
    echo "  --username user@example.com \\"
    echo "  --user-attributes Name=email,Value=user@example.com \\"
    echo "  --temporary-password 'TempPass123!' \\"
    echo "  --region $REGION"
    echo ""
fi