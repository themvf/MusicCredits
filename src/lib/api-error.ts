import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export function handleApiError(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : 'Unknown error'

  if (message === 'Unauthorized') {
    return jsonError(401, 'Unauthorized')
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
