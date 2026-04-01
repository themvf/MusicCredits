import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CSP headers to all routes so the Spotify embed iframe loads
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow Clerk scripts and our own scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.accounts.dev https://*.clerk.accounts.dev https://js.clerk.dev",
              // Allow Spotify iframe embeds
              "frame-src 'self' https://open.spotify.com",
              // Allow connections to Clerk, Neon, Spotify APIs
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev wss://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
