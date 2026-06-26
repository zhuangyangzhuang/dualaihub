# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/dualaihub)

## Manual Deployment

### 1. Prepare Your Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/dualaihub.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - Framework: Next.js
   - Root Directory: `.` or `/`
   - Build Command: `prisma generate && next build`

### 3. Environment Variables

Configure these in Vercel dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-strong-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
KIMI_API_KEY=...
# ... other API keys
```

### 4. Database Setup

Use Vercel Postgres:
1. Create a Postgres database from Vercel dashboard
2. Copy the `DATABASE_URL` to environment variables
3. The build command will run `prisma generate` and `next build`

### 5. Domain Configuration

1. Add custom domain in Vercel settings
2. Update `NEXTAUTH_URL` to your domain
3. Configure DNS records as instructed

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your production URL | Yes |
| `NEXTAUTH_SECRET` | Random string for session encryption | Yes |
| AI API Keys | API keys for each AI provider | For production |

## Webhook Configuration

### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/stripe/webhook`
3. Events to listen:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### PayPal Webhooks

1. Go to PayPal Developer → My Apps → Webhooks
2. Add webhook: `https://your-domain.com/api/payments/paypal/webhook`
3. Events: Payment sale completed, Billing subscription activated, etc.

## Post-Deployment

1. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. Verify admin access:
   - Register a new account
   - Manually update role to ADMIN in database:
     ```sql
     UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
     ```

3. Test payment flows in test/sandbox mode first

## Performance Optimization

The project includes:
- Server-side rendering (SSR) for SEO
- API route caching where applicable
- Image optimization with Next.js Image
- Font optimization with next/font
- Automatic code splitting

## Troubleshooting

### Build Failures

1. Check Prisma generation: `npx prisma generate`
2. Verify TypeScript: `npx tsc --noEmit`
3. Check for missing dependencies: `npm install`

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check IP whitelist settings (for external databases)
3. Ensure SSL mode is enabled for production

### Authentication Issues

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches production URL
3. Verify OAuth credentials if using social login
