import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiRouteError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiRouteError'
  }
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export function handleApiError(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : 'Unknown error'

  if (message === 'Unauthorized') {
    return jsonError(401, 'Unauthorized')
  }

  if (error instanceof ApiRouteError) {
    return jsonError(error.status, error.message)
  }

  if (error instanceof ZodError) {
    return jsonError(400, error.issues[0]?.message ?? 'Invalid request body')
  }

  if (error instanceof SyntaxError) {
    return jsonError(400, 'Invalid JSON body')
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(`[${context}] Database initialization failed`, error)
    return jsonError(503, 'Database unavailable')
  }

  console.error(`[${context}]`, error)
  return jsonError(500, 'Internal server error')
}
