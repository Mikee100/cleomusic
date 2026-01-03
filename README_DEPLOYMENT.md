# Vercel Deployment Guide

## Prerequisites
- Backend is deployed on Render (or another hosting service)
- You have a Vercel account

## Setup Steps

### 1. Environment Variables in Vercel

After connecting your repository to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your project settings → Environment Variables
2. Add the following:

```
VITE_API_URL=https://your-backend-app.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Important**: Replace `https://your-backend-app.onrender.com` with your actual Render backend URL (without trailing slash).

### 2. Build Settings

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy on push to your main branch
3. Check the deployment logs for any errors

### 4. CORS Configuration

Make sure your Render backend has CORS configured to allow requests from your Vercel domain:

In your backend's `.env` or Render environment variables:
```
FRONTEND_URL=https://your-app.vercel.app
```

## Troubleshooting

- **API calls failing**: Check that `VITE_API_URL` is set correctly in Vercel
- **Build errors**: Check the build logs in Vercel dashboard
- **CORS errors**: Verify `FRONTEND_URL` in backend matches your Vercel URL
- **Images/media not loading**: Ensure `VITE_API_URL` includes the full backend URL (e.g., `https://your-backend.onrender.com`)

