#!/bin/bash

# Create AWS Cognito User Script
# This script creates a real user in your AWS Cognito User Pool

USER_POOL_ID="us-west-2_ECLKvbdSp"

echo "🔐 Creating AWS Cognito User"
echo "=============================="

# Get user details
read -p "Enter email address: " EMAIL
read -p "Enter username (or press enter to use email): " USERNAME
read -p "Enter role (admin/security_officer/officer/developer/viewer): " ROLE
read -p "Enter clearance level (1-5): " CLEARANCE
read -p "Enter badge number: " BADGE
read -s -p "Enter temporary password: " TEMP_PASSWORD
echo ""

# Use email as username if not provided
if [ -z "$USERNAME" ]; then
    USERNAME="$EMAIL"
fi

echo ""
echo "Creating user with:"
echo "  Email: $EMAIL"
echo "  Username: $USERNAME"
echo "  Role: $ROLE"
echo "  Clearance Level: $CLEARANCE"
echo "  Badge Number: $BADGE"
echo ""

# Create the user
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --user-attributes \
        Name=email,Value="$EMAIL" \
        Name=email_verified,Value=true \
        Name="custom:role",Value="$ROLE" \
        Name="custom:clearanceLevel",Value="$CLEARANCE" \
        Name="custom:badgeNumber",Value="$BADGE" \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS

if [ $? -eq 0 ]; then
    echo "✅ User created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. User can login with:"
    echo "   Email: $EMAIL"
    echo "   Temporary Password: $TEMP_PASSWORD"
    echo ""
    echo "2. They will be prompted to set a permanent password on first login"
    echo ""
    echo "3. To set a permanent password now (optional):"
    echo "   aws cognito-idp admin-set-user-password \\"
    echo "     --user-pool-id $USER_POOL_ID \\"
    echo "     --username \"$USERNAME\" \\"
    echo "     --password \"YourSecurePassword123!\" \\"
    echo "     --permanent"
else
    echo "❌ Failed to create user. Check your AWS credentials and permissions."
fi