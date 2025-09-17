# 🔒 Secure Backend Setup for Prospect Agent

## Overview
This setup keeps all API keys secure on your own backend server, away from Vercel.

## Quick Setup Options

### Option 1: Railway (Recommended - Easiest)
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select your Prospect_Agent repository
4. Set environment variables:
   - `APOLLO_API_KEY`: Your Apollo.io API key
   - `OPENAI_API_KEY`: Your OpenAI API key
5. Deploy and get your backend URL

### Option 2: Heroku
1. Install Heroku CLI
2. `heroku create your-backend-name`
3. Set environment variables in Heroku dashboard
4. Deploy with Git

### Option 3: DigitalOcean/AWS/VPS
1. Upload files to your server
2. Set environment variables
3. Run `node backend-server.js`

## Backend Server Code
Create a file called `backend-server.js` on your server:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Your API keys from environment variables
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

// Add your Apollo.io and OpenAI proxy endpoints here
// (Copy the endpoints from your local apollo.ts and openai.ts files)

app.listen(PORT, () => {
  console.log(`Secure backend running on port ${PORT}`);
});
```

## Vercel Configuration
In Vercel dashboard, add **only** this environment variable:
- `BACKEND_API_URL`: `https://your-backend-url.com`

## Security Benefits
- ✅ API keys never stored in Vercel
- ✅ Complete control over your backend
- ✅ Easy to rotate keys without touching frontend
- ✅ Audit trail of all API usage
- ✅ No exposed secrets in public repositories

## Next Steps
1. Deploy backend server with your API keys
2. Add BACKEND_API_URL to Vercel
3. Your app will automatically use the secure backend
