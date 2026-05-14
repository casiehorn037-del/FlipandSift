# FlipAndSift Standalone Platform - Deploy Checklist

## ✅ Pre-Deploy Verification

### Build Status
- [x] Build successful
- [x] All 32 tests passing
- [x] No TypeScript errors
- [x] Bundle size optimized

---

## 🚀 Deploy Steps

### 1. Database Migration
```bash
# Run database migration to add domainFeed table
pnpm db:push
```

**Verify:**
- [ ] domainFeed table created
- [ ] All columns present
- [ ] Indexes created

---

### 2. Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/dbname

# Auth
JWT_SECRET=your-jwt-secret
VITE_APP_ID=flipandsift_app
OAUTH_SERVER_URL=https://auth.manus.im

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for enhanced metrics)
MAJESTIC_API_KEY=...
GODADDY_API_KEY=...
GODADDY_API_SECRET=...
NAMECHEAP_USERNAME=...
NAMECHEAP_API_KEY=...
```

---

### 3. Deploy to Render

**Option A: Using render.yaml (Blueprint)**
```bash
# Push to GitHub
git add .
git commit -m "FlipAndSift v2.0 - Standalone Platform"
git push origin main

# Go to Render Dashboard
# Click "New +" → "Blueprint"
# Connect your repo
```

**Option B: Manual Web Service**
```bash
# Build Command
pnpm install && pnpm build

# Start Command
pnpm start

# Environment Variables
# (Add all from step 2)
```

---

### 4. Post-Deploy Setup

**Initial Data Population:**
```bash
# SSH into server or use Render Shell
# Run initial domain discovery
pnpm tsx server/services/domainDiscovery.ts
```

**Set Up Cron Job (Domain Discovery):**
```bash
# Add to crontab or use Render Cron Jobs
# Run every hour
0 * * * * cd /app && pnpm tsx -e "import { dailyDomainSync } from './server/services/domainDiscovery.js'; dailyDomainSync()"
```

---

### 5. Verify Deployment

**Check These URLs:**
- [ ] https://your-app.com/ - Landing page loads
- [ ] https://your-app.com/discovery - Domain Discovery dashboard
- [ ] https://your-app.com/domain-checker - Domain Checker works
- [ ] https://your-app.com/pricing - Pricing page

**Test Core Flow:**
1. [ ] Sign up / Log in
2. [ ] Visit Discovery page
3. [ ] Filter domains by niche
4. [ ] Add domain to watchlist
5. [ ] Check domain availability

---

## 🎉 Launch Announcement

### New Positioning:
> **"FlipAndSift - The only platform that discovers, analyzes, and ranks expired domains automatically. Find hidden gems before anyone else."**

### Key Features to Highlight:
1. ✅ **Domain Discovery** - Browse hundreds of expired domains updated hourly
2. ✅ **AI Scoring** - Opportunity scores (0-100) based on 15+ metrics
3. ✅ **Real-time Availability** - Check availability across registrars
4. ✅ **Affiliate Intelligence** - Find monetization opportunities
5. ✅ **No Screenshots Needed** - Fully standalone platform

---

## 📊 Success Metrics to Track

### Week 1:
- [ ] Sign-ups: Target 50+
- [ ] Discovery page views: Target 200+
- [ ] Domains added to watchlist: Target 100+
- [ ] Conversion to paid: Target 5%+

### Month 1:
- [ ] Active users: Target 200+
- [ ] MRR: Target $500+
- [ ] Churn rate: <10%

---

## 🆘 Troubleshooting

### Issue: Domain Discovery Not Working
**Check:**
- [ ] Cron job is running
- [ ] API keys are configured
- [ ] Database connection is working

### Issue: Build Fails
**Check:**
- [ ] All dependencies installed
- [ ] Environment variables set
- [ ] Database URL is correct

### Issue: Tests Failing
**Check:**
- [ ] Database is accessible
- [ ] Test database is configured
- [ ] No breaking schema changes

---

## 📞 Support

If issues arise:
1. Check logs: `pnpm logs` or Render dashboard
2. Run tests: `pnpm test`
3. Check database: `pnpm db:check`
4. Review: `DEPLOY_README.md`

---

## 🎊 You're Ready to Launch!

**FlipAndSift is now a fully standalone platform:**
- ✅ No SpamZilla dependency
- ✅ No screenshot uploads
- ✅ Automatic domain discovery
- ✅ AI-powered analysis
- ✅ Real-time availability
- ✅ Direct purchase integration

**Go live and start finding hidden gems!** 🚀
