# FlipAndSift - Complete Deployment Guide

## 🎉 PLATFORM COMPLETE

**All features integrated:**
- ✅ Domain Discovery (available/expired domains)
- ✅ Affiliate Intelligence
- ✅ AI Domain Analysis
- ✅ Project Management
- ✅ Watchlist & Alerts
- ✅ API Access
- ✅ Admin Dashboard
- ✅ Stripe Payments
- ✅ User Dashboard

---

## 🚀 Deploy Now

### Step 1: Environment Setup

Create `.env` file:
```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/flipandsift

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
VITE_APP_ID=flipandsift_app
OAUTH_SERVER_URL=https://auth.manus.im
OWNER_OPEN_ID=u_your_owner_id

# Stripe (Get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...

# Optional APIs (for enhanced features)
MAJESTIC_API_KEY=...
GODADDY_API_KEY=...
GODADDY_API_SECRET=...
OPENAI_API_KEY=...
```

---

### Step 2: Database Migration

```bash
cd /root/.openclaw/workspace/flipandsift-improved

# Install dependencies
pnpm install

# Run migration
pnpm db:push

# Verify tables created
pnpm db:check
```

**Tables created:**
- ✅ users
- ✅ domainFeed
- ✅ projects
- ✅ watchlist
- ✅ priceAlerts
- ✅ monitoringLogs
- ✅ apiKeys
- ✅ AND 20+ more

---

### Step 3: Seed Initial Data

```bash
# Option A: Via API (after deploy)
# POST to /api/trpc/discovery.seedDomains as admin

# Option B: Direct script
pnpm tsx -e "
  import { seedCuratedDomains } from './server/services/domainCuration.js';
  seedCuratedDomains().then(() => process.exit(0));
"
```

**Seeds 12 high-quality available domains**

---

### Step 4: Build & Test

```bash
# Run tests
pnpm test

# Build
pnpm build

# Verify build
ls -la dist/
```

---

### Step 5: Deploy to Render

**Option A: Blueprint (Recommended)**

Your `render.yaml` is already configured:
```yaml
services:
  - type: web
    name: flipandsift
    runtime: node
    plan: starter
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

**Deploy:**
```bash
git add .
git commit -m "FlipAndSift v2.0 - Complete Platform"
git push origin main
```

Then:
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your repo
4. Add environment variables
5. Deploy!

---

### Step 6: Post-Deploy Setup

**1. Create Admin User:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

**2. Seed Domains:**
- Login as admin
- Go to /admin
- Click "Seed All Curated Domains"

**3. Configure Stripe:**
- Create products in Stripe Dashboard
- Add price IDs to environment
- Test checkout flow

**4. Set Up Domain Discovery:**
- Apply for Majestic API
- Add API key to environment
- Enable automated discovery

---

## 🎯 What's Live After Deploy

### **Landing Page**
- https://your-app.com/
- Shows value proposition
- Pricing tiers
- Sign up CTA

### **Core Features**
- **/discovery** - Browse available expired domains
- **/domain-checker** - Bulk availability check
- **/affiliate-intelligence** - Product URL analysis
- **/projects** - Manage your domain portfolio
- **/watchlist** - Track domains
- **/alerts** - Price drop notifications
- **/api-keys** - Generate API keys

### **User Dashboard**
- **/dashboard** - Overview and stats
- **/settings** - Profile and billing

### **Admin**
- **/admin** - Manage everything

---

## 💰 Pricing Live

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 domains/day, basic filters |
| **Pro** | $49/mo | Unlimited, alerts, API (100/day) |
| **Agency** | $149/mo | Team seats, unlimited API |

**Stripe checkout ready!**

---

## 📊 Success Metrics

Track in admin dashboard:
- User signups
- MRR growth
- Domain views
- API usage
- Conversion rates

---

## 🆘 Troubleshooting

### Build fails?
```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

### Database issues?
```bash
pnpm db:push --force
```

### Stripe not working?
- Check webhook URL in Stripe dashboard
- Verify price IDs match
- Test in Stripe test mode first

### Domains not showing?
- Run seed script as admin
- Check database connection
- Verify domainFeed table exists

---

## 🎉 You're Ready!

**FlipAndSift is a complete platform with:**
- ✅ Domain discovery
- ✅ Affiliate intelligence
- ✅ AI analysis
- ✅ Project management
- ✅ API access
- ✅ Payments
- ✅ Admin panel

**Deploy and start helping people find great domains!** 🚀

---

## 📞 Support

If issues:
1. Check logs: `pnpm logs`
2. Run tests: `pnpm test`
3. Check database: `pnpm db:check`
4. Review this guide

**Launch successful!** 🎊