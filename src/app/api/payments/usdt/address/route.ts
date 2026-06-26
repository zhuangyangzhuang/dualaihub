import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Return current USDT wallet address
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'global' },
      select: {
        usdtAddress: true,
        usdtEnabled: true,
      },
    });

    return NextResponse.json({
      address: settings?.usdtAddress || null,
      enabled: settings?.usdtEnabled || false,
    });
  } catch (error) {
    console.error('USDT address GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get USDT address' },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  enabled: z.boolean().optional(),
});

// PUT: Update USDT wallet address (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { address, enabled } = validation.data;

    // Validate TRON address format
    if (!isValidTronAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid TRON address format' },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        usdtAddress: address,
        ...(enabled !== undefined && { usdtEnabled: enabled }),
      },
      create: {
        id: 'global',
        usdtAddress: address,
        usdtEnabled: enabled ?? false,
      },
    });

    return NextResponse.json({
      address: settings.usdtAddress,
      enabled: settings.usdtEnabled,
    });
  } catch (error) {
    console.error('USDT address PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update USDT address' },
      { status: 500 }
    );
  }
}

function isValidTronAddress(address: string): boolean {
  if (!address) return false;

  // TRON addresses start with 'T' and are 34 characters long
  if (!address.startsWith('T') || address.length !== 34) {
    return false;
  }

  // Check if all remaining characters are valid base58
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return address.slice(1).split('').every((char) => base58Chars.includes(char));
}
