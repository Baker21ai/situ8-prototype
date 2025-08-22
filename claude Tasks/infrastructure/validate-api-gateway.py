#!/usr/bin/env python3
"""
API Gateway Configuration Validator
Validates CloudFormation template for Ambient.AI integration
"""

import yaml
import json
import sys
import os
from typing import Dict, List, Any

def load_cloudformation_template(file_path: str) -> Dict[str, Any]:
    """Load and parse CloudFormation template"""
    try:
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"❌ Failed to load template {file_path}: {e}")
        return {}

def validate_api_gateway_structure(template: Dict[str, Any]) -> List[str]:
    """Validate API Gateway structure and configuration"""
    errors = []
    resources = template.get('Resources', {})
    
    # Required resources
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
    
    print("🔍 Validating required API Gateway resources...")
    for resource in required_resources:
        if resource not in resources:
            errors.append(f"Missing required resource: {resource}")
        else:
            print(f"  ✅ {resource} found")
    
    # Validate API Gateway configuration
    if 'AmbientApiGateway' in resources:
        api_gateway = resources['AmbientApiGateway']
        properties = api_gateway.get('Properties', {})
        
        # Check endpoint configuration
        endpoint_config = properties.get('EndpointConfiguration', {})
        if endpoint_config.get('Types') != ['REGIONAL']:
            errors.append("API Gateway should use REGIONAL endpoint")
        else:
            print("  ✅ REGIONAL endpoint configuration correct")
    
    # Validate webhook method
    if 'WebhookMethod' in resources:
        webhook_method = resources['WebhookMethod']
        properties = webhook_method.get('Properties', {})
        
        if properties.get('HttpMethod') != 'POST':
            errors.append("Webhook method should be POST")
        else:
            print("  ✅ Webhook POST method correct")
        
        if properties.get('AuthorizationType') != 'NONE':
            errors.append("Webhook should use NONE auth (handled in Lambda)")
        else:
            print("  ✅ Webhook auth type correct")
        
        # Check integration type
        integration = properties.get('Integration', {})
        if integration.get('Type') != 'AWS_PROXY':
            errors.append("Webhook should use AWS_PROXY integration")
        else:
            print("  ✅ AWS_PROXY integration correct")
    
    # Validate CORS configuration
    if 'WebhookOptionsMethod' in resources:
        options_method = resources['WebhookOptionsMethod']
        properties = options_method.get('Properties', {})
        
        if properties.get('HttpMethod') != 'OPTIONS':
            errors.append("CORS method should be OPTIONS")
        else:
            print("  ✅ CORS OPTIONS method correct")
    
    return errors

def validate_waf_configuration(template: Dict[str, Any]) -> List[str]:
    """Validate WAF configuration for security"""
    errors = []
    resources = template.get('Resources', {})
    
    print("\n🔒 Validating WAF security configuration...")
    
    if 'WebhookWAF' not in resources:
        errors.append("Missing WAF configuration")
        return errors
    
    waf = resources['WebhookWAF']
    properties = waf.get('Properties', {})
    
    # Check scope
    if properties.get('Scope') != 'REGIONAL':
        errors.append("WAF scope should be REGIONAL")
    else:
        print("  ✅ WAF REGIONAL scope correct")
    
    # Check default action
    default_action = properties.get('DefaultAction', {})
    if 'Allow' not in default_action:
        errors.append("WAF should have Allow default action")
    else:
        print("  ✅ WAF default allow action correct")
    
    # Check for rate limiting rule
    rules = properties.get('Rules', [])
    has_rate_limit = False
    has_signature_check = False
    
    for rule in rules:
        rule_name = rule.get('Name', '')
        if 'RateLimit' in rule_name:
            has_rate_limit = True
            # Check rate limit configuration
            statement = rule.get('Statement', {})
            rate_statement = statement.get('RateBasedStatement', {})
            limit = rate_statement.get('Limit', 0)
            if limit < 100 or limit > 10000:
                errors.append(f"Rate limit {limit} may be too restrictive or permissive")
            else:
                print(f"  ✅ Rate limiting rule found (limit: {limit})")
        
        if 'Signature' in rule_name:
            has_signature_check = True
            print("  ✅ Signature validation rule found")
    
    if not has_rate_limit:
        errors.append("Missing rate limiting rule in WAF")
    
    if not has_signature_check:
        errors.append("Missing signature validation rule in WAF")
    
    return errors

def validate_lambda_permissions(template: Dict[str, Any]) -> List[str]:
    """Validate Lambda function permissions"""
    errors = []
    resources = template.get('Resources', {})
    
    print("\n🔑 Validating Lambda permissions...")
    
    required_permissions = [
        'WebhookLambdaPermission',
        'ActivitiesLambdaPermission'
    ]
    
    for permission in required_permissions:
        if permission not in resources:
            errors.append(f"Missing Lambda permission: {permission}")
            continue
        
        perm_resource = resources[permission]
        properties = perm_resource.get('Properties', {})
        
        if properties.get('Action') != 'lambda:InvokeFunction':
            errors.append(f"{permission}: Incorrect action")
        else:
            print(f"  ✅ {permission} action correct")
        
        if properties.get('Principal') != 'apigateway.amazonaws.com':
            errors.append(f"{permission}: Incorrect principal")
        else:
            print(f"  ✅ {permission} principal correct")
    
    return errors

def validate_monitoring_setup(template: Dict[str, Any]) -> List[str]:
    """Validate CloudWatch monitoring and alarms"""
    errors = []
    resources = template.get('Resources', {})
    
    print("\n📊 Validating monitoring configuration...")
    
    # Check for log group
    if 'ApiGatewayLogGroup' not in resources:
        errors.append("Missing CloudWatch log group")
    else:
        log_group = resources['ApiGatewayLogGroup']
        properties = log_group.get('Properties', {})
        retention = properties.get('RetentionInDays', 0)
        if retention < 7 or retention > 365:
            errors.append(f"Log retention {retention} days may not be appropriate")
        else:
            print(f"  ✅ Log group with {retention} day retention")
    
    # Check for alarms
    alarm_types = ['HighErrorRateAlarm', 'WebhookLatencyAlarm']
    for alarm_type in alarm_types:
        if alarm_type not in resources:
            errors.append(f"Missing alarm: {alarm_type}")
        else:
            print(f"  ✅ {alarm_type} configured")
    
    # Check for SNS topic for notifications
    if 'ErrorNotificationTopic' not in resources:
        errors.append("Missing SNS topic for error notifications")
    else:
        print("  ✅ Error notification topic configured")
    
    return errors

def validate_outputs(template: Dict[str, Any]) -> List[str]:
    """Validate CloudFormation outputs"""
    errors = []
    outputs = template.get('Outputs', {})
    
    print("\n📤 Validating template outputs...")
    
    required_outputs = [
        'ApiGatewayId',
        'ApiGatewayRootResourceId', 
        'WebhookEndpoint',
        'ApiBaseUrl',
        'WAFArn'
    ]
    
    for output in required_outputs:
        if output not in outputs:
            errors.append(f"Missing output: {output}")
        else:
            print(f"  ✅ {output} output configured")
    
    # Validate webhook endpoint format
    if 'WebhookEndpoint' in outputs:
        webhook_output = outputs['WebhookEndpoint']
        value = webhook_output.get('Value', '')
        if 'execute-api' not in str(value) or '/ambient/webhook' not in str(value):
            errors.append("WebhookEndpoint output format incorrect")
        else:
            print("  ✅ WebhookEndpoint format correct")
    
    return errors

def validate_parameters(template: Dict[str, Any]) -> List[str]:
    """Validate template parameters"""
    errors = []
    parameters = template.get('Parameters', {})
    
    print("\n⚙️ Validating template parameters...")
    
    # Check Environment parameter
    if 'Environment' not in parameters:
        errors.append("Missing Environment parameter")
    else:
        env_param = parameters['Environment']
        allowed_values = env_param.get('AllowedValues', [])
        if set(allowed_values) != {'dev', 'staging', 'prod'}:
            errors.append("Environment parameter should allow dev, staging, prod")
        else:
            print("  ✅ Environment parameter correct")
    
    # Check AppName parameter
    if 'AppName' not in parameters:
        errors.append("Missing AppName parameter")
    else:
        print("  ✅ AppName parameter present")
    
    return errors

def run_validation():
    """Run comprehensive API Gateway validation"""
    print("🚀 Starting API Gateway Configuration Validation")
    print("=" * 60)
    
    template_path = "api-gateway-template.yaml"
    
    # Load template
    template = load_cloudformation_template(template_path)
    if not template:
        print("❌ Could not load CloudFormation template")
        return False
    
    print(f"✅ Loaded CloudFormation template: {template_path}")
    
    # Run all validations
    all_errors = []
    
    all_errors.extend(validate_parameters(template))
    all_errors.extend(validate_api_gateway_structure(template))
    all_errors.extend(validate_waf_configuration(template))
    all_errors.extend(validate_lambda_permissions(template))
    all_errors.extend(validate_monitoring_setup(template))
    all_errors.extend(validate_outputs(template))
    
    # Report results
    print("\n" + "=" * 60)
    if all_errors:
        print("❌ VALIDATION FAILED")
        print(f"Found {len(all_errors)} error(s):")
        for i, error in enumerate(all_errors, 1):
            print(f"  {i}. {error}")
        return False
    else:
        print("🎉 VALIDATION PASSED!")
        print("✅ API Gateway structure correct")
        print("✅ WAF security configuration correct")
        print("✅ Lambda permissions correct")
        print("✅ Monitoring and alarms configured")
        print("✅ Template outputs correct")
        print("✅ Parameters configured properly")
        print("\n🚀 API Gateway template is ready for deployment!")
        return True

if __name__ == "__main__":
    success = run_validation()
    sys.exit(0 if success else 1)