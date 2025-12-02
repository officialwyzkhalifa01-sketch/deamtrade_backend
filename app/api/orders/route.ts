import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';
import { CryptoType } from '@prisma/client';

export const runtime = 'nodejs';

function isValidCryptoType(value: string): value is CryptoType {
  return value === 'BTC' || value === 'ETH' || value === 'USDT';
}

// ============================================================
// 👇 THIS IS THE FIXED GET FUNCTION
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get('all');

    const where =
      all === 'true' && user.role === 'ADMIN'
        ? {}
        : { userId: user.id };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // 🟢 THIS WAS MISSING!
      // We tell Prisma: "Fetch the User, and also fetch their Bank Accounts"
      include: {
        user: {
          include: {
            bankAccounts: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// (POST Function remains the same as you wrote it)
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    
    const { cryptoType, cryptoAmount, amountInUsd } = body ?? {};

    if (!cryptoType || !cryptoAmount) {
      throw new ApiError(
        400,
        'cryptoType and cryptoAmount are required'
      );
    }

    const type = String(cryptoType).toUpperCase();
    if (!isValidCryptoType(type)) {
      throw new ApiError(400, 'Invalid cryptoType');
    }

    const amountNumber = Number(cryptoAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new ApiError(400, 'cryptoAmount must be a positive number');
    }

    const rateRecord = await prisma.exchangeRate.findUnique({
      where: { cryptoType: type },
    });

    if (!rateRecord) {
      throw new ApiError(
        400,
        'Exchange rate not configured for this crypto type'
      );
    }

    const rate = Number(rateRecord.rate);

    let fiatAmount = 0;

    if (amountInUsd && Number(amountInUsd) > 0) {
        fiatAmount = Number(amountInUsd) * rate;
    } else {
        fiatAmount = amountNumber * rate;
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        cryptoType: type,
        cryptoAmount: amountNumber,
        fiatAmount: fiatAmount,
        status: 'PENDING',
      },
      // We also include the user data in the response immediately
      // so the app doesn't crash if it tries to read it right away
      include: {
        user: {
            include: {
                bankAccounts: true
            }
        }
      }
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}