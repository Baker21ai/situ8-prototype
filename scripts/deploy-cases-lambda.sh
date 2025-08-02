#!/bin/bash

# Deploy Cases Lambda Function
# This creates the Lambda function for case management and evidence tracking

set -e  # Exit on any error

FUNCTION_NAME="situ8-cases-api-dev"
REGION="us-west-2"
ROLE_NAME="situ8-lambda-execution-role"
LAMBDA_DIR="/Users/yamenk/Desktop/Situ8/Situ81/lambda/cases"

echo "Building Cases Lambda package..."
cd "$LAMBDA_DIR"
npm install --production >/dev/null 2>&1
zip -r "../cases-lambda.zip" . -x "*.git*" "*.DS_Store*" "test/*" "*.md" >/dev/null

echo "Deploying Cases Lambda function..."
role_arn="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"

# Check if function exists and create or update accordingly
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$LAMBDA_DIR/../cases-lambda.zip" \
        --region "$REGION" >/dev/null
    echo "Cases Lambda function updated successfully"
else
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "nodejs18.x" \
        --role "$role_arn" \
        --handler "index.handler" \
        --zip-file "fileb://$LAMBDA_DIR/../cases-lambda.zip" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={CASES_TABLE_NAME=situ8-cases-dev,INCIDENTS_TABLE_NAME=situ8-incidents-dev}" \
        --region "$REGION" >/dev/null
    echo "Cases Lambda function created successfully"
fi

# Add API Gateway permission
account_id=$(aws sts get-caller-identity --query Account --output text)
source_arn="arn:aws:execute-api:$REGION:$account_id:xb3rai5taf/*/*"

aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "$source_arn" \
    --region "$REGION" >/dev/null 2>&1 || true

echo "Cases Lambda ARN: arn:aws:lambda:$REGION:$account_id:function:$FUNCTION_NAME"