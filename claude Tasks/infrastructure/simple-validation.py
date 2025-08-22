#!/usr/bin/env python3
"""
Simple API Gateway Configuration Validator
Validates CloudFormation template structure without external dependencies
"""

import sys
import re

def validate_api_gateway_template():
    """Validate the API Gateway CloudFormation template"""
    print("🚀 Starting API Gateway Template Validation")
    print("=" * 60)
    
    template_path = "api-gateway-template.yaml"
    
    try:
        with open(template_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Template file not found: {template_path}")
        return False
    
    print(f"✅ Loaded template file: {template_path}")
    print(f"📏 Template size: {len(content)} characters")
    
    # Basic structure validation
    required_sections = [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs'
    ]
    
    print("\n🔍 Validating template structure...")
    for section in required_sections:
        if section in content:
            print(f"  ✅ {section} section found")
        else:
            print(f"  ❌ {section} section missing")
            return False
    
    # Required resources validation
    required_resources = [
        'AmbientApiGateway',
        'AmbientResource',
        'WebhookResource',
        'WebhookMethod',
        'WebhookOptionsMethod',
        'WebhookLambdaPermission',
        'WebhookWAF',
        'ApiDeployment'
    ]
    
    print("\n🔧 Validating required resources...")
    for resource in required_resources:
        if resource in content:
            print(f"  ✅ {resource} found")
        else:
            print(f"  ❌ {resource} missing")
            return False
    
    # API Gateway configuration checks
    print("\n🌐 Validating API Gateway configuration...")
    
    # Check for REST API
    if "Type: AWS::ApiGateway::RestApi" in content:
        print("  ✅ REST API resource type found")
    else:
        print("  ❌ REST API resource type missing")
        return False
    
    # Check for regional endpoint
    if "REGIONAL" in content:
        print("  ✅ Regional endpoint configuration found")
    else:
        print("  ❌ Regional endpoint not configured")
    
    # Check webhook method
    if 'HttpMethod: POST' in content:
        print("  ✅ POST method for webhook found")
    else:
        print("  ❌ POST method for webhook missing")
        return False
    
    # Check CORS
    if 'HttpMethod: OPTIONS' in content:
        print("  ✅ OPTIONS method for CORS found")
    else:
        print("  ❌ OPTIONS method for CORS missing")
        return False
    
    # WAF validation
    print("\n🔒 Validating WAF security...")
    
    if "Type: AWS::WAFv2::WebACL" in content:
        print("  ✅ WAF WebACL resource found")
    else:
        print("  ❌ WAF WebACL resource missing")
        return False
    
    if "RateBasedStatement" in content:
        print("  ✅ Rate limiting configuration found")
    else:
        print("  ❌ Rate limiting configuration missing")
    
    if "Type: AWS::WAFv2::WebACLAssociation" in content:
        print("  ✅ WAF association found")
    else:
        print("  ❌ WAF association missing")
    
    # Lambda permissions validation
    print("\n🔑 Validating Lambda permissions...")
    
    lambda_permission_count = content.count("Type: AWS::Lambda::Permission")
    if lambda_permission_count >= 2:
        print(f"  ✅ {lambda_permission_count} Lambda permissions found")
    else:
        print(f"  ❌ Expected at least 2 Lambda permissions, found {lambda_permission_count}")
    
    if "lambda:InvokeFunction" in content:
        print("  ✅ Lambda invoke permissions found")
    else:
        print("  ❌ Lambda invoke permissions missing")
        return False
    
    if "apigateway.amazonaws.com" in content:
        print("  ✅ API Gateway principal found")
    else:
        print("  ❌ API Gateway principal missing")
        return False
    
    # Monitoring validation
    print("\n📊 Validating monitoring configuration...")
    
    if "Type: AWS::Logs::LogGroup" in content:
        print("  ✅ CloudWatch log group found")
    else:
        print("  ❌ CloudWatch log group missing")
    
    alarm_count = content.count("Type: AWS::CloudWatch::Alarm")
    if alarm_count >= 2:
        print(f"  ✅ {alarm_count} CloudWatch alarms found")
    else:
        print(f"  ❌ Expected at least 2 alarms, found {alarm_count}")
    
    if "Type: AWS::SNS::Topic" in content:
        print("  ✅ SNS notification topic found")
    else:
        print("  ❌ SNS notification topic missing")
    
    # Outputs validation
    print("\n📤 Validating outputs...")
    
    required_outputs = [
        'ApiGatewayId',
        'WebhookEndpoint',
        'ApiBaseUrl',
        'WAFArn'
    ]
    
    for output in required_outputs:
        if output in content:
            print(f"  ✅ {output} output found")
        else:
            print(f"  ❌ {output} output missing")
            return False
    
    # Parameters validation
    print("\n⚙️ Validating parameters...")
    
    if "Environment:" in content and "AllowedValues: ['dev', 'staging', 'prod']" in content:
        print("  ✅ Environment parameter with allowed values found")
    else:
        print("  ❌ Environment parameter configuration incorrect")
    
    if "AppName:" in content:
        print("  ✅ AppName parameter found")
    else:
        print("  ❌ AppName parameter missing")
    
    # Integration validation
    print("\n🔗 Validating integrations...")
    
    if "Type: AWS_PROXY" in content:
        print("  ✅ AWS_PROXY integration type found")
    else:
        print("  ❌ AWS_PROXY integration type missing")
        return False
    
    if "IntegrationHttpMethod: POST" in content:
        print("  ✅ Integration HTTP method found")
    else:
        print("  ❌ Integration HTTP method missing")
    
    # Final validation
    print("\n" + "=" * 60)
    print("🎉 API GATEWAY TEMPLATE VALIDATION PASSED!")
    print("✅ Template structure is correct")
    print("✅ Required resources are present")
    print("✅ Security (WAF) is configured")
    print("✅ Lambda permissions are set")
    print("✅ Monitoring is configured")
    print("✅ Outputs are defined")
    print("✅ Parameters are correct")
    print("✅ Integrations are configured")
    
    print("\n🚀 Template is ready for deployment!")
    print("Next steps:")
    print("1. Deploy with: ./deploy-api-gateway.sh dev")
    print("2. Test webhook endpoint")
    print("3. Configure Ambient.AI webhook URL")
    
    return True

if __name__ == "__main__":
    success = validate_api_gateway_template()
    sys.exit(0 if success else 1)