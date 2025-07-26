require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enable CORS for all origins
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/videos', express.static(uploadsDir));

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Environment variables
const PORT = process.env.PORT || 3000;
const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram_webhook_verify_123';
const MOBILE_APP_SCHEME = 'com.maxkos.raw';

console.log('🔧 Social Media Bridge Server Starting...', {
  port: PORT,
  verifyToken: INSTAGRAM_VERIFY_TOKEN ? 'Set' : 'Missing',
  mobileScheme: MOBILE_APP_SCHEME,
  platforms: ['Instagram', 'TikTok'],
  features: ['OAuth Bridge', 'Video CDN']
});

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({
    status: 'Social Media Bridge Server Running',
    platforms: ['Instagram', 'TikTok'],
    endpoints: {
      instagram: {
        oauth: '/auth/instagram/callback',
        webhook: '/webhook/instagram'
      },
      tiktok: {
        oauth: '/auth/tiktok/callback'
      },
      videos: {
        upload: 'POST /api/videos/upload',
        serve: 'GET /videos/:filename'
      },
      health: '/'
    },
    timestamp: new Date().toISOString()
  });
});

// Video upload endpoint for Instagram CDN
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    const baseUrl = req.get('host').includes('localhost') 
      ? `http://${req.get('host')}` 
      : `https://${req.get('host')}`;
    
    const publicUrl = `${baseUrl}/videos/${req.file.filename}`;

    console.log('📹 Video uploaded successfully:', {
      filename: req.file.filename,
      size: req.file.size,
      publicUrl: publicUrl
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        publicUrl: publicUrl
      }
    });

  } catch (error) {
    console.error('❌ Video upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video upload failed',
      message: error.message
    });
  }
});

// Video deletion endpoint (for cleanup)
app.delete('/api/videos/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Video deleted:', filename);
      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
  } catch (error) {
    console.error('❌ Video deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video deletion failed',
      message: error.message
    });
  }
});

// Get video info endpoint
app.get('/api/videos/:filename/info', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const baseUrl = req.get('host').includes('localhost') 
        ? `http://${req.get('host')}` 
        : `https://${req.get('host')}`;
      
      res.json({
        success: true,
        data: {
          filename: filename,
          size: stats.size,
          created: stats.birthtime,
          publicUrl: `${baseUrl}/videos/${filename}`
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
  } catch (error) {
    console.error('❌ Video info failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get video info',
      message: error.message
    });
  }
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

// TikTok OAuth Callback Bridge
// Receives OAuth redirect from TikTok → forwards to mobile app
app.get('/auth/tiktok/callback', (req, res) => {
  console.log('📱 TikTok OAuth Callback received:', {
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('❌ TikTok OAuth Error:', { error, error_description });
    
    // Redirect to mobile app with error
    const mobileUrl = `${MOBILE_APP_SCHEME}://auth/tiktok/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'OAuth failed')}`;
    
    return res.redirect(mobileUrl);
  }

  if (code) {
    console.log('✅ TikTok OAuth Success - Authorization code received');
    
    // Redirect to mobile app with authorization code
    const mobileUrl = `${MOBILE_APP_SCHEME}://auth/tiktok/success?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
    
    console.log('🔄 Redirecting to mobile app:', mobileUrl);
    
    return res.redirect(mobileUrl);
  }

  // No code or error - invalid request
  console.error('❌ Invalid TikTok OAuth callback - no code or error provided');
  const mobileUrl = `${MOBILE_APP_SCHEME}://auth/tiktok/error?error=invalid_request&description=No authorization code received`;
  
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

// Test endpoint for OAuth flows
app.get('/test/oauth', (req, res) => {
  const baseUrl = `https://${req.get('host')}`;
  
  const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?` + 
    `client_id=${process.env.INSTAGRAM_APP_ID || '1257332929203574'}&` +
    `redirect_uri=${encodeURIComponent(`${baseUrl}/auth/instagram/callback`)}&` +
    `scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish&` +
    `response_type=code&` +
    `state=test`;

  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?` + 
    `client_key=${process.env.TIKTOK_CLIENT_KEY || 'sbaw2j48qq5sj78h3s'}&` +
    `redirect_uri=${encodeURIComponent(`${baseUrl}/auth/tiktok/callback`)}&` +
    `scope=${encodeURIComponent('user.info.basic,user.info.profile,video.upload,video.publish')}&` +
    `response_type=code&` +
    `state=test`;

  res.json({
    message: 'Test OAuth URLs',
    platforms: {
      instagram: {
        authUrl: instagramAuthUrl,
        callback: `${baseUrl}/auth/instagram/callback`
      },
      tiktok: {
        authUrl: tiktokAuthUrl,
        callback: `${baseUrl}/auth/tiktok/callback`
      }
    },
    note: 'These URLs will redirect back to the mobile app after OAuth'
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
      '/auth/tiktok/callback',
      '/webhook/instagram',
      '/test/oauth'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Social Media Bridge Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 Instagram OAuth: http://localhost:${PORT}/auth/instagram/callback`);
  console.log(`🔗 TikTok OAuth: http://localhost:${PORT}/auth/tiktok/callback`);
  console.log(`📡 Instagram Webhook: http://localhost:${PORT}/webhook/instagram`);
  console.log(`🧪 Test OAuth URLs: http://localhost:${PORT}/test/oauth`);
});

module.exports = app; 