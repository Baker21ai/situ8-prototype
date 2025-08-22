#!/bin/bash

# Deploy API Gateway Infrastructure for Ambient.AI Integration
# Usage: ./deploy-api-gateway.sh [dev|staging|prod]

ENVIRONMENT=${1:-dev}
STACK_NAME="situ8-ambient-api-${ENVIRONMENT}"
TEMPLATE_FILE="api-gateway-template.yaml"
REGION="us-west-2"

echo "Deploying API Gateway infrastructure for environment: $ENVIRONMENT"

# Validate template
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

if [ $? -ne 0 ]; then
    echo "Template validation failed!"
    exit 1
fi

# Deploy stack
echo "Deploying CloudFormation stack: $STACK_NAME"

aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        AppName=situ8-ambient \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --tags \
        Environment=$ENVIRONMENT \
        Application=situ8-ambient \
        Service=api-gateway \
        ManagedBy=cloudformation

if [ $? -eq 0 ]; then
    echo "API Gateway deployment successful!"
    
    # Get outputs
    echo "Getting stack outputs..."
    
    WEBHOOK_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs[?OutputKey=='WebhookEndpoint'].OutputValue" \
        --output text \
        --region $REGION)
    
    API_BASE_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs[?OutputKey=='ApiBaseUrl'].OutputValue" \
        --output text \
        --region $REGION)
    
    API_GATEWAY_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayId'].OutputValue" \
        --output text \
        --region $REGION)
    
    echo ""
    echo "=========================================="
    echo "API Gateway Deployment Complete!"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "API Gateway ID: $API_GATEWAY_ID"
    echo "Webhook Endpoint: $WEBHOOK_ENDPOINT"
    echo "API Base URL: $API_BASE_URL"
    echo ""
    echo "Configure Ambient.AI to send webhooks to:"
    echo "$WEBHOOK_ENDPOINT"
    echo ""
    echo "Next steps:"
    echo "1. Deploy Lambda functions with webhook endpoint permissions"
    echo "2. Configure Ambient.AI webhook settings"
    echo "3. Test webhook integration"
    echo "=========================================="
    
else
    echo "API Gateway deployment failed!"
    exit 1
fi