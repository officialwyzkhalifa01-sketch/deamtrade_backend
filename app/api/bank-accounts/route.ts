import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bankAccounts });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { bankName, accountName, accountNumber } = body ?? {};

    if (!bankName || !accountName || !accountNumber) {
      throw new ApiError(
        400,
        'bankName, accountName and accountNumber are required'
      );
    }

    // 🔴 FIX: Delete existing bank accounts first so they don't pile up
    await prisma.bankAccount.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // 🟢 Then create the new one (It becomes the only one)
    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: String(bankName),
        accountName: String(accountName),
        accountNumber: String(accountNumber),
      },
    });

    return NextResponse.json({ bankAccount }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}