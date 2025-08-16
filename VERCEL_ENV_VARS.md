# Vercel Environment Variables Configuration

## Step-by-Step Instructions

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your `situ8-prototype` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add each variable below by clicking **Add New**

## Required Environment Variables

Copy and paste these EXACTLY:

```
Variable Name: VITE_AWS_REGION
Value: us-west-2
Environment: Production
```

```
Variable Name: VITE_COGNITO_USER_POOL_ID
Value: us-west-2_ECLKvbdSp
Environment: Production
```

```
Variable Name: VITE_COGNITO_CLIENT_ID
Value: 5ouh548bibh1rrp11neqcvvqf6
Environment: Production
```

```
Variable Name: VITE_COGNITO_IDENTITY_POOL_ID
Value: us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4
Environment: Production
```

```
Variable Name: VITE_COGNITO_DOMAIN
Value: https://situ8-platform-auth-dev.auth.us-west-2.amazoncognito.com
Environment: Production
```

```
Variable Name: VITE_WEBSOCKET_URL
Value: wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev
Environment: Production
```

```
Variable Name: VITE_API_BASE_URL
Value: https://xb3rai5taf.execute-api.us-west-2.amazonaws.com/prod
Environment: Production
```

```
Variable Name: VITE_ENABLE_WEBSOCKET
Value: true
Environment: Production
```

```
Variable Name: VITE_ENABLE_MOCK_DATA
Value: false
Environment: Production
```

```
Variable Name: VITE_VIRTUAL_SCROLL_ENABLED
Value: true
Environment: Production
```

```
Variable Name: VITE_BATCH_SIZE
Value: 100
Environment: Production
```

## After Adding All Variables

1. Click **Save** after each variable
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment to apply new environment variables

## Verification

Your project should now have all the environment variables needed for:
- ✅ AWS Cognito authentication
- ✅ WebSocket real-time messaging
- ✅ API communication
- ✅ Proper feature flags