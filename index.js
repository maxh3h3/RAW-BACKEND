require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables
const PORT = process.env.PORT || 3000;
const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram_webhook_verify_123';
const MOBILE_APP_SCHEME = 'com.maxkos.raw';

console.log('🔧 Instagram Bridge Server Starting...', {
  port: PORT,
  verifyToken: INSTAGRAM_VERIFY_TOKEN ? 'Set' : 'Missing',
  mobileScheme: MOBILE_APP_SCHEME
});

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({
    status: 'Instagram Bridge Server Running',
    endpoints: {
      oauth: '/auth/instagram/callback',
      webhook: '/webhook/instagram',
      health: '/'
    },
    timestamp: new Date().toISOString()
  });
});

// Instagram OAuth Callback Bridge
// Receives OAuth redirect from Instagram → forwards to mobile app
app.get('/auth/instagram/callback', (req, res) => {
  console.log('📱 Instagram OAuth Callback received:', {
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('❌ Instagram OAuth Error:', { error, error_description });
    
    // Redirect to mobile app with error
    const mobileUrl = `${MOBILE_APP_SCHEME}://auth/instagram/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'OAuth failed')}`;
    
    return res.redirect(mobileUrl);
  }

  if (code) {
    console.log('✅ Instagram OAuth Success - Authorization code received');
    
    // Redirect to mobile app with authorization code
    const mobileUrl = `${MOBILE_APP_SCHEME}://auth/instagram/success?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
    
    console.log('🔄 Redirecting to mobile app:', mobileUrl);
    
    return res.redirect(mobileUrl);
  }

  // No code or error - invalid request
  console.error('❌ Invalid OAuth callback - no code or error provided');
  const mobileUrl = `${MOBILE_APP_SCHEME}://auth/instagram/error?error=invalid_request&description=No authorization code received`;
  
  res.redirect(mobileUrl);
});

// Instagram Webhook Verification (GET request)
app.get('/webhook/instagram', (req, res) => {
  console.log('🔍 Instagram Webhook Verification Request:', {
    query: req.query,
    timestamp: new Date().toISOString()
  });

  const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;

  // Validate verification request
  if (mode === 'subscribe' && verifyToken === INSTAGRAM_VERIFY_TOKEN) {
    console.log('✅ Instagram Webhook Verification Successful');
    console.log('🔐 Returning challenge:', challenge);
    
    // Return the challenge as plain text (required by Instagram)
    return res.status(200).send(challenge);
  } else {
    console.error('❌ Instagram Webhook Verification Failed:', {
      expectedToken: INSTAGRAM_VERIFY_TOKEN,
      receivedToken: verifyToken,
      mode: mode
    });
    
    return res.status(403).json({ error: 'Verification failed' });
  }
});

// Instagram Webhook Events (POST request)
app.post('/webhook/instagram', (req, res) => {
  console.log('📬 Instagram Webhook Event Received:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Process the webhook payload
  const { object, entry } = req.body;

  if (object === 'instagram') {
    entry?.forEach(item => {
      console.log('📱 Processing Instagram event:', {
        id: item.id,
        changes: item.changes,
        time: item.time
      });

      // Here you can add logic to handle different Instagram events:
      // - New posts
      // - Comments
      // - Messages
      // - Mentions
      // etc.
    });
  }

  // Always respond with 200 OK to acknowledge receipt
  res.status(200).json({ status: 'received' });
});

// Test endpoint for OAuth flow
app.get('/test/oauth', (req, res) => {
  const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?` + 
    `client_id=${process.env.INSTAGRAM_APP_ID || '1257332929203574'}&` +
    `redirect_uri=${encodeURIComponent('https://your-server.com/auth/instagram/callback')}&` +
    `scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish&` +
    `response_type=code&` +
    `state=test`;

  res.json({
    message: 'Test Instagram OAuth URL',
    authUrl: instagramAuthUrl,
    note: 'Replace your-server.com with your actual domain'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❓ 404 Not Found:', req.path);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/',
      '/auth/instagram/callback',
      '/webhook/instagram',
      '/test/oauth'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Instagram Bridge Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 OAuth callback: http://localhost:${PORT}/auth/instagram/callback`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/instagram`);
});

module.exports = app; 