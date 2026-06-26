# DUALAIHUB - Global AI Platform

A comprehensive AI services platform featuring intelligent dual-engine scheduling that automatically routes requests to optimal AI providers.

## Features

- **Dual AI Scheduling System**: Automatically routes to Chinese AI (Kimi, Doubao, Qwen, Zhipu) for realistic content and Global AI (GPT-4o, Claude, Pika, Sora) for creative content
- **AI Services**: Text, Code, Image, Music, and Video generation
- **User Management**: Registration, authentication, daily free quotas
- **Membership Plans**: Free, Starter, Pro, Enterprise tiers
- **Payment Integration**: Stripe, PayPal, USDT TRC20
- **Admin Dashboard**: User management, transactions, wallet configuration
- **Mobile Responsive**: Optimized for all devices
- **SEO Optimized**: Full English TDK implementation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe, PayPal, USDT (TRC20)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AI API keys (optional for development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dualaihub/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (public)/     # Public pages
│   │   ├── (protected)/  # Protected pages (auth required)
│   │   ├── admin/        # Admin pages
│   │   └── api/          # API routes
│   ├── components/      # React components
│   │   ├── ai/           # AI workspace components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   ├── payment/      # Payment components
│   │   ├── pricing/      # Pricing components
│   │   └── ui/           # Base UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and AI integrations
│   │   └── ai/           # AI provider integrations
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Deployment

The project is optimized for Vercel deployment:

1. Push to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

See [VERCEL.md](VERCEL.md) for detailed deployment instructions.

## Configuration

### AI Providers

Configure API keys in environment variables:

**Chinese AI:**
- `KIMI_API_KEY` - Kimi (Moonshot)
- `DOUBAN_API_KEY` - Doubao (ByteDance)
- `QWEN_API_KEY` - Qwen (Alibaba)
- `ZHIPU_API_KEY` - Zhipu AI

**Global AI:**
- `OPENAI_API_KEY` - GPT-4o
- `ANTHROPIC_API_KEY` - Claude
- `PIKA_API_KEY` - Pika
- `SORA_API_KEY` - Sora

### Payment Configuration

**Stripe:** Set up Stripe account and configure price IDs
**PayPal:** Configure PayPal app credentials
**USDT:** Configure TRC20 wallet address in admin panel

## License

Proprietary - All rights reserved.
