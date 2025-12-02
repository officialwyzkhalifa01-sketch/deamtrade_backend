import { NextRequest } from 'next/server';
import type { User } from '@prisma/client';

import { prisma } from './prisma';
import { verifyJwt } from './jwt';
import { ApiError } from './errors';

export async function getUserFromRequest(
  req: NextRequest
): Promise<User | null> {
  const authHeader =
    req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}

export async function requireUser(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<User> {
  const user = await requireUser(req);
  if (user.role !== 'ADMIN') {
    throw new ApiError(403, 'Forbidden');
  }
  return user;
}

export function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}