// AWS Amplify configuration
const awsConfig = {
  aws_project_region: 'us-west-2',
  aws_cognito_identity_pool_id: 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4',
  aws_cognito_region: 'us-west-2',
  aws_user_pools_id: 'us-west-2_ECLKvbdSp',
  aws_user_pools_web_client_id: '5ouh548bibh1rrp11neqcvvqf6',
  oauth: {
    domain: 'situ8-platform-auth-dev.auth.us-west-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://situ8-prototype.vercel.app/auth/callback',
    redirectSignOut: 'https://situ8-prototype.vercel.app/auth/logout',
    responseType: 'code'
  },
  federationTarget: 'COGNITO_USER_POOLS',
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_mfa_types: [],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [
      'REQUIRES_LOWERCASE',
      'REQUIRES_UPPERCASE',
      'REQUIRES_NUMBERS',
      'REQUIRES_SYMBOLS'
    ]
  },
  aws_cognito_verification_mechanisms: ['EMAIL']
};

export default awsConfig;