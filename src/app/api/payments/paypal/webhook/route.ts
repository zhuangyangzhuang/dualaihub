import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLAN_PRICING, getPlanFromPriceId } from '@/types/payment';

// PayPal webhook handler
// Note: This is a simplified implementation. In production, you should verify
// the webhook signature using PayPal's verification API.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the event for debugging
    console.log('PayPal webhook received:', body.event_type);

    const eventType = body.event_type;
    const resource = body.resource;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        if (resource?.purchase_units?.[0]?.custom_id) {
          const userId = resource.purchase_units[0].custom_id;
          const planId = resource.purchase_units[0].amount?.currency_code;

          // Check if subscription or one-time
          if (resource.purchase_units[0]?.subscriptions) {
            // Subscription
            const subscriptionId = resource.purchase_units[0].subscriptions[0].id;
            await handleSubscriptionCreated(userId, planId, subscriptionId);
          } else {
            // One-time payment
            const amount = parseFloat(resource.purchase_units[0]?.amount?.value || '0');
            const credits = resource.purchase_units[0]?.custom_metadata?.credits;
            await handleOneTimePayment(userId, amount, credits);
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = resource.id;
        const userId = resource.custom_id;
        const planId = resource.plan_id;
        await handleSubscriptionCreated(userId, planId, subscriptionId);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId = resource.id;
        await handleSubscriptionCancelled(subscriptionId);
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        if (resource?.billing_agreement_id) {
          const userId = resource.custom;
          const amount = parseFloat(resource.amount?.total || '0');
          await handleSubscriptionPayment(userId, amount, resource.id);
        }
        break;
      }

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(
  userId: string | undefined,
  planId: string | undefined,
  subscriptionId: string
) {
  if (!userId) return;

  const plan = getPlanFromPriceId(planId || '');
  if (plan) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: 'SUBSCRIPTION',
      amount: 0,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'paypal',
      externalId: subscriptionId,
      planId,
    },
  });
}

async function handleSubscriptionCancelled(subscriptionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { externalId: subscriptionId },
  });

  if (transaction) {
    await prisma.user.update({
      where: { id: transaction.userId },
      data: { plan: 'FREE' },
    });
  }
}

async function handleSubscriptionPayment(
  userId: string | undefined,
  amount: number,
  paymentId: string
) {
  if (!userId) return;

  await prisma.transaction.create({
    data: {
      userId,
      type: 'SUBSCRIPTION',
      amount,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'paypal',
      externalId: paymentId,
    },
  });
}

async function handleOneTimePayment(
  userId: string | undefined,
  amount: number,
  credits: string | undefined
) {
  if (!userId || !credits) return;

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
        amount,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod: 'paypal',
        creditsGranted: creditAmount,
      },
    }),
  ]);
}
