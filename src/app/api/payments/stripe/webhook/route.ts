import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getPlanFromPriceId, PLAN_PRICING } from '@/types/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-04-10',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancel(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleOneTimePayment(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const credits = session.metadata?.credits;

  if (!userId) return;

  if (planId) {
    // Subscription purchase
    const plan = getPlanFromPriceId(planId);
    if (plan) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });

      // Get plan credits
      const planPricing = PLAN_PRICING.find((p) => p.plan === plan);
      const dailyCredits = planPricing?.credits || 100;

      await prisma.credit.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          amount: 0,
          dailyUsed: 0,
          lastReset: new Date(),
        },
      });
    }
  } else if (credits) {
    // One-time credit purchase
    const creditAmount = parseInt(credits, 10);

    await prisma.$transaction([
      prisma.credit.update({
        where: { userId },
        data: {
          amount: { increment: creditAmount },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'ONE_TIME',
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? 'USD',
          status: 'COMPLETED',
          paymentMethod: 'stripe',
          externalId: session.payment_intent as string,
          creditsGranted: creditAmount,
          description: `Purchased ${creditAmount} credits`,
        },
      }),
    ]);
  }

  // Create completed transaction record
  await prisma.transaction.create({
    data: {
      userId,
      type: planId ? 'SUBSCRIPTION' : 'ONE_TIME',
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency?.toUpperCase() ?? 'USD',
      status: 'COMPLETED',
      paymentMethod: 'stripe',
      externalId: session.id,
      planId,
      creditsGranted: credits ? parseInt(credits, 10) : undefined,
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  if (plan) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }
}

async function handleSubscriptionCancel(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'FREE' },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    if (userId) {
      await prisma.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency?.toUpperCase() ?? 'USD',
          status: 'COMPLETED',
          paymentMethod: 'stripe',
          externalId: invoice.id,
        },
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    if (userId) {
      await prisma.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: (invoice.amount_due ?? 0) / 100,
          currency: invoice.currency?.toUpperCase() ?? 'USD',
          status: 'FAILED',
          paymentMethod: 'stripe',
          externalId: invoice.id,
        },
      });
    }
  }
}

async function handleOneTimePayment(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  if (!userId || paymentIntent.metadata?.type !== 'one_time') return;

  const credits = parseInt(paymentIntent.metadata?.credits ?? '0', 10);

  if (credits > 0) {
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId },
        data: {
          amount: { increment: credits },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'ONE_TIME',
          amount: (paymentIntent.amount ?? 0) / 100,
          currency: paymentIntent.currency?.toUpperCase() ?? 'USD',
          status: 'COMPLETED',
          paymentMethod: 'stripe',
          externalId: paymentIntent.id,
          creditsGranted: credits,
        },
      }),
    ]);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntent = charge.payment_intent;
  if (typeof paymentIntent !== 'string') return;

  const transaction = await prisma.transaction.findFirst({
    where: { externalId: paymentIntent },
  });

  if (transaction) {
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'REFUNDED' },
      }),
      ...(transaction.creditsGranted
        ? [
            prisma.credit.update({
              where: { userId: transaction.userId },
              data: { amount: { decrement: transaction.creditsGranted } },
            }),
          ]
        : []),
    ]);
  }
}
