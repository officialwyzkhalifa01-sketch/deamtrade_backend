import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';
import { OrderStatus } from '@prisma/client';

export const runtime = 'nodejs';

function isValidOrderStatus(value: string): value is OrderStatus {
  return (
    value === 'PENDING' ||
    value === 'PROCESSING' ||
    value === 'COMPLETED' ||
    value === 'CANCELLED'
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { status } = body ?? {};

    if (!status) {
      throw new ApiError(400, 'status is required');
    }

    const statusStr = String(status).toUpperCase();
    if (!isValidOrderStatus(statusStr)) {
      throw new ApiError(400, 'Invalid status');
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: statusStr },
    });

    return NextResponse.json({ order });
  } catch (error) {
    return handleError(error);
  }
}