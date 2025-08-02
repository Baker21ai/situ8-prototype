#!/bin/bash

# Deploy Complete API Gateway Stack with all Lambda integrations
# This updates the API Gateway to include Activities, Incidents, Cases, BOL, and Audit endpoints

set -e  # Exit on any error

STACK_NAME="situ8-platform-api-dev"
REGION="us-west-2"
TEMPLATE_FILE="/Users/yamenk/Desktop/Situ8/Situ81/infrastructure/api-gateway-stack-complete.yaml"

echo "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body "file://$TEMPLATE_FILE" \
    --region "$REGION" >/dev/null

echo "Deploying complete API Gateway stack..."

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "Updating existing stack: $STACK_NAME"
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters ParameterKey=Environment,ParameterValue="dev" \
                    ParameterKey=AppName,ParameterValue="situ8-platform" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --tags Key=Environment,Value="dev" \
               Key=Application,Value="situ8-platform" \
               Key=Service,Value="api-gateway" \
               Key=ManagedBy,Value="cloudformation" \
        --region "$REGION"
    
    echo "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
    echo "Stack update completed successfully"
else
    echo "Creating new stack: $STACK_NAME"
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters ParameterKey=Environment,ParameterValue="dev" \
                    ParameterKey=AppName,ParameterValue="situ8-platform" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --tags Key=Environment,Value="dev" \
               Key=Application,Value="situ8-platform" \
               Key=Service,Value="api-gateway" \
               Key=ManagedBy,Value="cloudformation" \
        --region "$REGION"
    
    echo "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
    echo "Stack creation completed successfully"
fi

# Get API Gateway URL
api_url=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

echo ""
echo "✅ API Gateway deployment completed successfully!"
echo "🔗 API Gateway URL: $api_url"
echo ""
echo "Available endpoints:"
echo "  GET    $api_url/api/activities"
echo "  POST   $api_url/api/activities"
echo "  GET    $api_url/api/activities/{id}"
echo "  PUT    $api_url/api/activities/{id}"
echo "  DELETE $api_url/api/activities/{id}"
echo ""
echo "  GET    $api_url/api/incidents"
echo "  POST   $api_url/api/incidents"
echo "  GET    $api_url/api/incidents/{id}"
echo "  PUT    $api_url/api/incidents/{id}"
echo "  DELETE $api_url/api/incidents/{id}"
echo ""
echo "  GET    $api_url/api/cases"
echo "  POST   $api_url/api/cases"
echo "  GET    $api_url/api/cases/{id}"
echo "  PUT    $api_url/api/cases/{id}"
echo "  DELETE $api_url/api/cases/{id}"
echo ""
echo "  GET    $api_url/api/bol"
echo "  POST   $api_url/api/bol"
echo "  GET    $api_url/api/bol/{id}"
echo "  PUT    $api_url/api/bol/{id}"
echo "  DELETE $api_url/api/bol/{id}"
echo ""
echo "  GET    $api_url/api/audit"
echo "  POST   $api_url/api/audit"
echo "  GET    $api_url/api/audit/{id}"
echo ""