import { NextResponse } from 'next/server';
import { ApiError } from './errors';

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}