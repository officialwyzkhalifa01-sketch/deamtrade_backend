import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';
import { CryptoType } from '@prisma/client';

export const runtime = 'nodejs';

function isValidCryptoType(value: string): value is CryptoType {
  return value === 'BTC' || value === 'ETH' || value === 'USDT';
}

export async function GET() {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { cryptoType: 'asc' },
    });
    return NextResponse.json({ rates });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    void admin; // unused variable just confirms admin access

    const body = await req.json();
    const { cryptoType, rate } = body ?? {};

    if (!cryptoType || rate === undefined) {
      throw new ApiError(400, 'cryptoType and rate are required');
    }

    const type = String(cryptoType).toUpperCase();
    if (!isValidCryptoType(type)) {
      throw new ApiError(400, 'Invalid cryptoType');
    }

    const rateNumber = Number(rate);
    if (!Number.isFinite(rateNumber) || rateNumber <= 0) {
      throw new ApiError(400, 'rate must be a positive number');
    }

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: { cryptoType: type },
      update: { rate: rateNumber },
      create: { cryptoType: type, rate: rateNumber },
    });

    return NextResponse.json({ rate: exchangeRate });
  } catch (error) {
    return handleError(error);
  }
}