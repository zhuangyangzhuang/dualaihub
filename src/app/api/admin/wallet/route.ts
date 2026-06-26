import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get wallet configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'global' },
      select: {
        usdtAddress: true,
        usdtEnabled: true,
        maintenance: true,
      },
    });

    return NextResponse.json({
      usdtAddress: settings?.usdtAddress || null,
      usdtEnabled: settings?.usdtEnabled || false,
      maintenance: settings?.maintenance || false,
    });
  } catch (error) {
    console.error('Admin wallet GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet configuration' },
      { status: 500 }
    );
  }
}

const updateWalletSchema = z.object({
  usdtAddress: z.string().min(1, 'USDT address is required').optional(),
  usdtEnabled: z.boolean().optional(),
  maintenance: z.boolean().optional(),
});

// PUT: Update wallet configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateWalletSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { usdtAddress, usdtEnabled, maintenance } = validation.data;

    // Validate TRON address if provided
    if (usdtAddress && !isValidTronAddress(usdtAddress)) {
      return NextResponse.json(
        { error: 'Invalid TRON address format' },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        ...(usdtAddress !== undefined && { usdtAddress }),
        ...(usdtEnabled !== undefined && { usdtEnabled }),
        ...(maintenance !== undefined && { maintenance }),
      },
      create: {
        id: 'global',
        usdtAddress: usdtAddress || null,
        usdtEnabled: usdtEnabled ?? false,
        maintenance: maintenance ?? false,
      },
    });

    return NextResponse.json({
      usdtAddress: settings.usdtAddress,
      usdtEnabled: settings.usdtEnabled,
      maintenance: settings.maintenance,
    });
  } catch (error) {
    console.error('Admin wallet PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet configuration' },
      { status: 500 }
    );
  }
}

function isValidTronAddress(address: string): boolean {
  if (!address) return false;
  if (!address.startsWith('T') || address.length !== 34) {
    return false;
  }
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return address.slice(1).split('').every((char) => base58Chars.includes(char));
}
