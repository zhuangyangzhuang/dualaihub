import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// USDT TRC20 Transaction confirmation
// Uses TronWeb/TRON API for blockchain verification

const confirmSchema = z.object({
  transactionHash: z.string().min(1, 'Transaction hash is required'),
  expectedAmount: z.number().min(0),
  expectedAddress: z.string().optional(),
});

const TRON_API_KEY = process.env.TRON_API_KEY ?? '';
const TRON_GRID_API = 'https://api.trongrid.io';

// USDT TRC20 contract address
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = confirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { transactionHash, expectedAmount, expectedAddress } = validation.data;
    const userId = session.user.id;

    // Check if already processed
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        externalId: transactionHash,
        type: 'USDT',
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction already processed', status: existingTransaction.status },
        { status: 400 }
      );
    }

    // Get settings for USDT address
    const settings = await prisma.settings.findUnique({
      where: { id: 'global' },
    });

    const receivingAddress = expectedAddress || settings?.usdtAddress;

    if (!receivingAddress) {
      return NextResponse.json(
        { error: 'USDT address not configured' },
        { status: 500 }
      );
    }

    // Verify transaction on blockchain
    const verification = await verifyTRC20Transaction(
      transactionHash,
      receivingAddress,
      expectedAmount
    );

    if (!verification.isValid) {
      // Log failed verification
      await prisma.transaction.create({
        data: {
          userId,
          type: 'USDT',
          amount: expectedAmount,
          currency: 'USDT',
          status: 'FAILED',
          paymentMethod: 'usdt',
          externalId: transactionHash,
          description: verification.error,
        },
      });

      return NextResponse.json(
        { error: verification.error || 'Transaction verification failed' },
        { status: 400 }
      );
    }

    // Calculate credits based on amount (1 USD = 100 credits)
    const creditsGranted = Math.floor(expectedAmount * 100);

    // Process successful transaction
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId },
        data: {
          amount: { increment: creditsGranted },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'USDT',
          amount: expectedAmount,
          currency: 'USDT',
          status: 'COMPLETED',
          paymentMethod: 'usdt',
          externalId: transactionHash,
          creditsGranted,
          description: `USDT deposit: ${expectedAmount} USDT = ${creditsGranted} credits`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      creditsGranted,
      transactionHash,
      amount: expectedAmount,
    });
  } catch (error) {
    console.error('USDT confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm transaction' },
      { status: 500 }
    );
  }
}

interface TransactionVerification {
  isValid: boolean;
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  confirmations?: number;
  error?: string;
}

async function verifyTRC20Transaction(
  txHash: string,
  expectedToAddress: string,
  expectedAmount: number
): Promise<TransactionVerification> {
  try {
    // Get transaction info from TRON API
    const response = await fetch(
      `${TRON_GRID_API}/v1/transactions/${txHash}/info`,
      {
        headers: {
          'TRON-PRO-API-KEY': TRON_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return { isValid: false, error: 'Failed to fetch transaction from blockchain' };
    }

    const txInfo = await response.json();

    if (!txInfo.data || txInfo.data.length === 0) {
      return { isValid: false, error: 'Transaction not found' };
    }

    const txData = txInfo.data[0];

    // Parse the transaction data
    // For TRC20 transfers, we need to look at the contract_data
    const contractData = txData.contract_data || txData.raw_data?.contract?.[0]?.parameter?.value;

    if (!contractData) {
      return { isValid: false, error: 'Invalid transaction format' };
    }

    // Verify it's a TRC20 transfer
    const toAddress = contractData.to_address;
    const contractAddress = contractData.contract_address;

    // Convert from hex if needed
    const normalizedToAddress = normalizeTronAddress(toAddress);
    const normalizedExpectedAddress = normalizeTronAddress(expectedToAddress);
    const normalizedContractAddress = normalizeTronAddress(contractAddress);

    // Verify contract address is USDT
    if (normalizedContractAddress !== normalizeTronAddress(USDT_CONTRACT_ADDRESS)) {
      return { isValid: false, error: 'Not a USDT transaction' };
    }

    // Verify recipient
    if (normalizedToAddress !== normalizedExpectedAddress) {
      return { isValid: false, error: 'Incorrect recipient address' };
    }

    // Get the amount (USDT uses 6 decimals)
    const amount = parseInt(contractData.data || '0', 10) / 1e6;

    if (amount < expectedAmount) {
      return { isValid: false, error: `Amount mismatch: expected ${expectedAmount}, got ${amount}` };
    }

    // Check transaction status
    if (txData.confirmed) {
      return {
        isValid: true,
        fromAddress: normalizeTronAddress(txData.from_address || contractData.from_address),
        toAddress: normalizedToAddress,
        amount,
        confirmations: txData.confirmations || 1,
      };
    }

    return { isValid: false, error: 'Transaction not yet confirmed' };
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Blockchain verification failed',
    };
  }
}

function normalizeTronAddress(address: string): string {
  if (!address) return '';

  // If it starts with 41, it's a hex address that needs to be converted to base58
  if (address.startsWith('41')) {
    // Convert hex to base58 using Tron prefix
    try {
      // This is a simplified version - in production use proper TronWeb library
      const hexString = '41' + address.slice(2);
      return hexToBase58(hexString);
    } catch {
      return address;
    }
  }

  // Already in base58 format
  return address;
}

function hexToBase58(hex: string): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  let num = BigInt('0x' + hex);

  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    result = chars[remainder] + result;
  }

  return result;
}
