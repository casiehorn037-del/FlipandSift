# Deploy FlipandSift to Render

## Quick Deploy

### Option 1: Using render.yaml (Blueprint)

1. Push this code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repo
5. Render will auto-detect `render.yaml` and set up the service
6. Add your environment variables in the Render dashboard

### Option 2: Manual Setup

1. Push code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: flipandsift
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add environment variables (see below)
7. Click "Create Web Service"

## Required Environment Variables

Add these in the Render dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key-here` |
| `VITE_APP_ID` | Your Manus/App ID | `app_xxx` |
| `OAUTH_SERVER_URL` | OAuth server URL | `https://auth.manus.im` |
| `OWNER_OPEN_ID` | Admin user OpenID | `u_xxx` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxx` |

## Database Setup

1. Create a MySQL database (Render offers managed MySQL, or use PlanetScale, AWS RDS)
2. Run migrations:
   ```bash
   npm run db:push
   ```

## Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domain"
3. Add your domain and follow DNS instructions

## Troubleshooting

**Build fails:**
- Check that all environment variables are set
- Ensure `DATABASE_URL` is valid

**App won't start:**
- Check logs in Render dashboard
- Verify database is accessible from Render

**Stripe webhooks not working:**
- Update webhook URL in Stripe dashboard to: `https://your-app.onrender.com/api/stripe/webhook`