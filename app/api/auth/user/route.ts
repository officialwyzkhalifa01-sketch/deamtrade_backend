import { NextRequest, NextResponse } from 'next/server';
import { requireUser, sanitizeUser } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleError(error);
  }
}