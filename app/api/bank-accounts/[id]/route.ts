import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(req);

    const account = await prisma.bankAccount.findUnique({
      where: { id: params.id },
    });

    if (!account) {
      throw new ApiError(404, 'Bank account not found');
    }

    if (account.userId !== user.id && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden');
    }

    await prisma.bankAccount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}