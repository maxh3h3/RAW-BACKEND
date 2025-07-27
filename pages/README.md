# RAW App - Legal Documents

This folder contains the legal documents for the RAW mobile application, designed to be hosted on Netlify for TikTok API compliance and general legal requirements.

## 📋 Documents Included

- **`index.html`** - Landing page linking to all legal documents
- **`privacy-policy.html`** - Comprehensive privacy policy covering data collection, OAuth, and platform integrations
- **`terms-of-service.html`** - Terms of service covering user rights, content usage, and platform responsibilities
- **`netlify.toml`** - Netlify deployment configuration with security headers and redirects

## 🚀 Netlify Deployment Options

### Option 1: Drag & Drop Deployment (Fastest)
1. Go to [netlify.com](https://netlify.com) and sign up/log in
2. Drag the entire `pages` folder to the deployment area
3. Your site will be live with a random URL like `https://amazing-cupcake-123456.netlify.app`

### Option 2: Git Repository Deployment
1. Create a new Git repository
2. Copy all files from `pages/` to the repository root
3. Connect the repository to Netlify
4. Auto-deploys on every commit

### Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to pages folder
cd pages

# Deploy
netlify deploy --prod --dir .
```

## 🔗 Expected URLs

After deployment, your legal documents will be available at:

- **Landing Page**: `https://your-site.netlify.app/`
- **Privacy Policy**: `https://your-site.netlify.app/privacy-policy.html`
- **Terms of Service**: `https://your-site.netlify.app/terms-of-service.html`

### Redirect URLs (for convenience):
- `https://your-site.netlify.app/privacy` → Privacy Policy
- `https://your-site.netlify.app/terms` → Terms of Service

## 📱 TikTok API Application

Use these URLs when applying for TikTok API access:

1. **Privacy Policy URL**: `https://your-site.netlify.app/privacy-policy.html`
2. **Terms of Service URL**: `https://your-site.netlify.app/terms-of-service.html`

## ✅ Features Included

- **Mobile Responsive** - Works perfectly on all devices
- **Professional Design** - Clean, modern styling
- **SEO Optimized** - Proper meta tags and structure
- **Security Headers** - HTTPS, XSS protection, content type protection
- **Fast Loading** - Optimized static files
- **Easy Navigation** - Clear links between documents

## 🔧 Customization

Before deploying, you may want to update:

1. **Contact Information**:
   - Update email addresses (`privacy@rawapp.com`, `legal@rawapp.com`)
   - Add your business address in Terms of Service

2. **Jurisdiction**:
   - Update `[Your Jurisdiction]` in Terms of Service section 14.1

3. **Domain**:
   - Once deployed, you can add a custom domain in Netlify settings

## 📄 Compliance Notes

These documents are designed to meet requirements for:

- ✅ **TikTok API** - Privacy policy and terms of service
- ✅ **Instagram Business API** - Data usage and privacy compliance
- ✅ **YouTube API** - Google's developer policy requirements
- ✅ **App Store Guidelines** - Apple and Google Play legal requirements
- ✅ **GDPR Compliance** - European privacy regulations
- ✅ **CCPA Compliance** - California privacy regulations

## 🔄 Updates

To update the documents:
1. Edit the HTML files
2. Update the "Last Updated" dates
3. Redeploy to Netlify (automatic if using Git integration)

---

**Note**: These are comprehensive legal templates. Consider having them reviewed by a legal professional for your specific use case and jurisdiction. 