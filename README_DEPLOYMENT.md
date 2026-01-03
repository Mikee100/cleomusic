# Frontend Setup & Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js installed
- Backend server running locally on `http://localhost:5000`

### Environment Variables for Local Development

1. Create a `.env.local` file in the `frontend` directory (this file is gitignored):

```env
# Leave VITE_API_URL empty to use Vite proxy (localhost:5000)
VITE_API_URL=

# Add your Stripe test key for local development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Important**: Leave `VITE_API_URL` empty (or don't set it) for local development. This allows Vite's proxy to forward `/api` requests to `http://localhost:5000`.

### Running Locally

1. **Start the backend server** (in a separate terminal):
```bash
cd backend
npm run dev
```

2. **Start the frontend** (in another terminal):
```bash
cd frontend
npm run dev
```

3. The frontend will be available at `http://localhost:5173`
4. API requests to `/api/*` will be automatically proxied to `http://localhost:5000/api/*`

### How It Works Locally

- When `VITE_API_URL` is empty, `axios.defaults.baseURL` is set to an empty string
- Relative URLs like `/api/auth/login` are used
- Vite's proxy intercepts these requests and forwards them to `http://localhost:5000`

---

## Vercel Deployment (Production)

### Prerequisites
- Backend is deployed on Render (or another hosting service)
- You have a Vercel account
- GitHub repository connected to Vercel

### 1. Vercel Project Settings

**Root Directory**: Set to `frontend` (not `./`)

**Build Settings** (should auto-detect):
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2. Environment Variables in Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variables:

```
VITE_API_URL=https://your-backend-app.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Important**: 
- Replace `https://your-backend-app.onrender.com` with your actual backend URL (without trailing slash)
- These variables are used during the build process and in the production app

### 3. How It Works in Production

- `VITE_API_URL` is set to your hosted backend URL
- `axios.defaults.baseURL` uses this URL
- All API requests go directly to your hosted backend
- Vite proxy is **not used** in production builds

### 4. Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy on push to your main/master branch
3. Check the deployment logs for any errors

### 5. CORS Configuration

Make sure your backend has CORS configured to allow requests from your Vercel domain:

In your backend's `.env` or Render environment variables:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## Summary: Local vs Production

| Environment | VITE_API_URL | API Requests Go To |
|------------|--------------|-------------------|
| **Local Dev** | Empty/Not set | `http://localhost:5000` (via Vite proxy) |
| **Production** | `https://your-backend.onrender.com` | `https://your-backend.onrender.com` (direct) |

---

## Troubleshooting

### Local Development
- **Proxy error**: Make sure your backend is running on `http://localhost:5000`
- **API calls failing**: Check that `VITE_API_URL` is empty in `.env.local`
- **Connection reset**: Backend server might not be running

### Production (Vercel)
- **API calls failing**: Check that `VITE_API_URL` is set correctly in Vercel
- **Build errors**: Check the build logs in Vercel dashboard
- **Root Directory error**: Make sure it's set to `frontend` (not `./`)
- **CORS errors**: Verify `FRONTEND_URL` in backend matches your Vercel URL
- **Images/media not loading**: Ensure `VITE_API_URL` includes the full backend URL (e.g., `https://your-backend.onrender.com`)

