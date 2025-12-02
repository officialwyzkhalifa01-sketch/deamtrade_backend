import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
import { signJwt } from '@/lib/jwt';
import { sanitizeUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';
import { handleError } from '@/lib/errorHandler';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email and password are required');
    }

    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });
    if (existing) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email).toLowerCase(),
        passwordHash,
        role: 'USER',
      },
    });

    const token = signJwt({ userId: user.id, role: user.role });

    return NextResponse.json(
      { user: sanitizeUser(user), token },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}