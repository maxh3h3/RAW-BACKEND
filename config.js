// Instagram Bridge Server Configuration
module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  
  // Instagram Webhook Verification Token
  // This must match what you set in Instagram Developer Console
  INSTAGRAM_VERIFY_TOKEN: process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram_webhook_verify_123',
  
  // Instagram App Credentials
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID || '1257332929203574',
  
  // Production Domain (replace with your actual domain when deployed)
  PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN || 'https://your-server.com',
  
  // Mobile app scheme
  MOBILE_APP_SCHEME: 'com.maxkos.raw'
}; 