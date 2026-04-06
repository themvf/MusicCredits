import 'server-only'

import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Neon/Postgres URL'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  SPOTIFY_CLIENT_ID: z.string().min(1, 'SPOTIFY_CLIENT_ID is required'),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, 'SPOTIFY_CLIENT_SECRET is required'),
  SPOTIFY_REDIRECT_URI: z.string().url('SPOTIFY_REDIRECT_URI must be a valid URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_SIGN_IN_URL is required'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_SIGN_UP_URL is required'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL is required'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL is required'),
  SPOTIFY_PLATFORM_REFRESH_TOKEN: z.string().min(1).optional(),
  // Transactional email — optional; emails are skipped gracefully when unset
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  // Base URL for email links — defaults to soundswap.fm if unset
  APP_URL: z.string().url().optional(),
})

const parsedEnv = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  SPOTIFY_PLATFORM_REFRESH_TOKEN: process.env.SPOTIFY_PLATFORM_REFRESH_TOKEN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  APP_URL: process.env.APP_URL,
})

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')

  throw new Error(`Invalid server environment: ${message}`)
}

export const serverEnv = parsedEnv.data
