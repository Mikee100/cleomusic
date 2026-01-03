# Quick Setup Guide

## Local Development

### Step 1: Create `.env.local` file

In the `frontend` directory, create a file named `.env.local` with:

```env
# Leave empty for local development (uses proxy to localhost:5000)
VITE_API_URL=

# Your Stripe test key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

Backend should run on `http://localhost:5000`

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173` and automatically proxy API calls to your local backend.

---

## Production (Vercel)

### In Vercel Dashboard:

1. **Root Directory**: `frontend`
2. **Environment Variables**:
   - `VITE_API_URL` = `https://your-backend.onrender.com` (your hosted backend URL)
   - `VITE_STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key

That's it! The frontend will use your hosted backend automatically.

