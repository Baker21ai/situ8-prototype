#!/bin/bash

# Deploy Ambient Webhook Lambda Function
# Usage: ./deploy.sh [dev|staging|prod]

ENVIRONMENT=${1:-dev}
FUNCTION_NAME="situ8-ambient-webhook-${ENVIRONMENT}"
REGION="us-west-2"
TIMEOUT=30
MEMORY_SIZE=256

echo "Deploying Ambient Webhook Lambda for environment: $ENVIRONMENT"

# Create deployment package
echo "Creating deployment package..."
rm -rf package/
mkdir -p package/
cp ambient-webhook-receiver.py package/lambda_function.py
cp requirements.txt package/

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -t package/

# Create zip package
echo "Creating zip package..."
cd package/
zip -r ../ambient-webhook-lambda.zip .
cd ..

# Deploy or update Lambda function
echo "Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://ambient-webhook-lambda.zip \
        --region $REGION
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/situ8-lambda-execution-role" \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://ambient-webhook-lambda.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --environment Variables="{
            ACTIVITIES_TABLE=situ8-activities-${ENVIRONMENT},
            EVENT_BUS_NAME=situ8-events-${ENVIRONMENT},
            DLQ_URL=https://sqs.${REGION}.amazonaws.com/$(aws sts get-caller-identity --query Account --output text)/situ8-webhook-dlq-${ENVIRONMENT},
            TENANT_ID=default,
            AMBIENT_API_KEY=${AMBIENT_API_KEY}
        }" \
        --region $REGION
fi

# Update environment variables if function already exists
echo "Updating environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{
        ACTIVITIES_TABLE=situ8-activities-${ENVIRONMENT},
        EVENT_BUS_NAME=situ8-events-${ENVIRONMENT},
        DLQ_URL=https://sqs.${REGION}.amazonaws.com/$(aws sts get-caller-identity --query Account --output text)/situ8-webhook-dlq-${ENVIRONMENT},
        TENANT_ID=default,
        AMBIENT_API_KEY=${AMBIENT_API_KEY}
    }" \
    --region $REGION

echo "Lambda function deployed successfully!"
echo "Function Name: $FUNCTION_NAME"
echo "Function ARN: $(aws lambda get-function --function-name $FUNCTION_NAME --query Configuration.FunctionArn --output text --region $REGION)"

# Clean up
rm -rf package/
rm ambient-webhook-lambda.zip

echo "Deployment complete!"