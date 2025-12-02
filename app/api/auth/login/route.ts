import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/bcrypt';
import { signJwt } from '@/lib/jwt';
import { sanitizeUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const valid = await comparePassword(String(password), user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = signJwt({ userId: user.id, role: user.role });

    return NextResponse.json({ user: sanitizeUser(user), token });
  } catch (error) {
    return handleError(error);
  }
}