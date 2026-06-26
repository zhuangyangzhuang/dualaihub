import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch all AI service pricing
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');

    const where: Record<string, unknown> = {};
    if (serviceType) {
      where.serviceType = serviceType;
    }

    const pricing = await prisma.aIServicePricing.findMany({
      where,
      orderBy: { serviceType: 'asc' },
    });

    // Calculate final price for each service
    const pricingWithFinalPrice = pricing.map((p) => ({
      ...p,
      baseCost: Number(p.baseCost),
      profitMultiplier: Number(p.profitMultiplier),
      finalPrice: Number(p.baseCost) * Number(p.profitMultiplier),
    }));

    return NextResponse.json({ pricing: pricingWithFinalPrice });
  } catch (error) {
    console.error('Admin pricing GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

// PUT: Update pricing for a service
const updatePricingSchema = z.object({
  modelId: z.string().min(1),
  baseCost: z.number().min(0).optional(),
  profitMultiplier: z.number().min(0).optional(),
  isEnabled: z.boolean().optional(),
  serviceType: z.string().min(1).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updatePricingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { modelId, ...updateData } = validation.data;

    const existing = await prisma.aIServicePricing.findUnique({
      where: { modelId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Service pricing not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.aIServicePricing.update({
      where: { modelId },
      data: {
        ...(updateData.baseCost !== undefined && { baseCost: updateData.baseCost }),
        ...(updateData.profitMultiplier !== undefined && { profitMultiplier: updateData.profitMultiplier }),
        ...(updateData.isEnabled !== undefined && { isEnabled: updateData.isEnabled }),
      },
    });

    return NextResponse.json({
      success: true,
      pricing: {
        ...updated,
        baseCost: Number(updated.baseCost),
        profitMultiplier: Number(updated.profitMultiplier),
        finalPrice: Number(updated.baseCost) * Number(updated.profitMultiplier),
      },
    });
  } catch (error) {
    console.error('Admin pricing PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

// POST: Add new service pricing
const createPricingSchema = z.object({
  serviceType: z.string().min(1),
  modelId: z.string().min(1),
  baseCost: z.number().min(0),
  profitMultiplier: z.number().min(0).default(1.0),
  isEnabled: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createPricingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceType, modelId, baseCost, profitMultiplier, isEnabled } = validation.data;

    // Check if modelId already exists
    const existing = await prisma.aIServicePricing.findUnique({
      where: { modelId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Service pricing already exists for this model' },
        { status: 409 }
      );
    }

    const pricing = await prisma.aIServicePricing.create({
      data: {
        serviceType,
        modelId,
        baseCost,
        profitMultiplier,
        isEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      pricing: {
        ...pricing,
        baseCost: Number(pricing.baseCost),
        profitMultiplier: Number(pricing.profitMultiplier),
        finalPrice: Number(pricing.baseCost) * Number(pricing.profitMultiplier),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin pricing POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing' },
      { status: 500 }
    );
  }
}