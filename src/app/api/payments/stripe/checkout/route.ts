import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { PLAN_PRICING, CREDIT_PACKAGES } from '@/types/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-04-10',
});

const checkoutSchema = z.object({
  type: z.enum(['subscription', 'credits']),
  planId: z.string().optional(),
  creditsId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, planId, creditsId } = validation.data;
    const userId = session.user.id;

    let stripeSession: Stripe.Checkout.Session;

    if (type === 'subscription') {
      if (!planId) {
        return NextResponse.json({ error: 'Plan ID is required for subscription' }, { status: 400 });
      }

      const plan = PLAN_PRICING.find((p) => p.plan.toLowerCase() === planId.toLowerCase());
      if (!plan || !plan.stripePriceId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      stripeSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
        metadata: {
          userId,
          planId: plan.stripePriceId,
        },
      });
    } else if (type === 'credits') {
      if (!creditsId) {
        return NextResponse.json({ error: 'Credits package ID is required' }, { status: 400 });
      }

      const packageIndex = parseInt(creditsId, 10);
      const creditPackage = CREDIT_PACKAGES[packageIndex];

      if (!creditPackage) {
        return NextResponse.json({ error: 'Invalid credits package' }, { status: 400 });
      }

      const totalCredits = creditPackage.credits + (creditPackage.bonus || 0);

      stripeSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${creditPackage.credits} Credits${creditPackage.bonus ? ` + ${creditPackage.bonus} Bonus` : ''}`,
                description: `${totalCredits} total credits`,
              },
              unit_amount: Math.round(creditPackage.price * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=purchased`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?credits=cancelled`,
        metadata: {
          userId,
          credits: totalCredits.toString(),
          type: 'one_time',
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
