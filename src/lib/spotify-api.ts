import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiRouteError } from '@/lib/api-error'
import { serverEnv } from '@/lib/server-env'
import { extractSpotifyTrackId, getSpotifyTrackUri } from '@/lib/spotify'

const SPOTIFY_ACCOUNTS_BASE_URL = 'https://accounts.spotify.com'
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'
const TOKEN_REFRESH_BUFFER_MS = 60_000

export const SPOTIFY_OAUTH_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
] as const

export const PLAYLIST_VERIFY_DELAY_MS = 15_000
export const PLAYLIST_PERSISTENCE_RECHECK_MS = 5 * 60_000
export const PLAYLIST_MINIMUM_LISTEN_MS = 30_000

interface SpotifyTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: 'Bearer'
}

interface SpotifyProfileResponse {
  id: string
  display_name: string | null
}

interface SpotifyPaging<T> {
  items: T[]
  next: string | null
}

interface SpotifyPlaylistSummary {
  id: string
  name: string
  external_urls?: {
    spotify?: string
  }
  tracks: {
    total: number
  }
}

interface SpotifyPlaylistDetail extends SpotifyPlaylistSummary {
  followers?: {
    total: number
  }
}

interface SpotifyPlaylistItemPage {
  items: Array<{
    track?: {
      id?: string | null
      type?: string
    } | null
  }>
  next: string | null
}

export interface SyncedPlaylistRecord {
  id: string
  spotifyPlaylistId: string
  name: string
  spotifyUrl: string | null
  followers: number
  trackCount: number
  lastSyncedAt: string
}

export function buildSpotifyAuthorizeUrl(state: string) {
  const url = new URL('/authorize', SPOTIFY_ACCOUNTS_BASE_URL)
  url.searchParams.set('client_id', serverEnv.SPOTIFY_CLIENT_ID)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', serverEnv.SPOTIFY_REDIRECT_URI)
  url.searchParams.set('scope', SPOTIFY_OAUTH_SCOPES.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('show_dialog', 'false')
  return url.toString()
}

export function normalizeReturnTo(returnTo?: string | null) {
  if (!returnTo || !returnTo.startsWith('/')) {
    return '/dashboard'
  }

  return returnTo
}

function buildBasicAuthHeader() {
  const credentials = `${serverEnv.SPOTIFY_CLIENT_ID}:${serverEnv.SPOTIFY_CLIENT_SECRET}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

async function requestSpotifyToken(params: URLSearchParams) {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: buildBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    console.error('[Spotify token exchange failed]', response.status, message)
    throw new ApiRouteError(502, 'Spotify token exchange failed')
  }

  return (await response.json()) as SpotifyTokenResponse
}

function getExpiryDate(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000)
}

export async function exchangeSpotifyCode(code: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: serverEnv.SPOTIFY_REDIRECT_URI,
  })

  return requestSpotifyToken(params)
}

export async function refreshSpotifyToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return requestSpotifyToken(params)
}

export async function fetchSpotifyJson<T>(
  accessToken: string,
  pathOrUrl: string,
  init?: RequestInit
) {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `${SPOTIFY_API_BASE_URL}${pathOrUrl}`

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    console.error('[Spotify API request failed]', response.status, url, message)

    if (response.status === 401) {
      throw new ApiRouteError(401, 'Spotify authorization expired')
    }

    if (response.status === 403) {
      throw new ApiRouteError(403, 'Spotify denied access to this playlist')
    }

    if (response.status === 404) {
      throw new ApiRouteError(404, 'Spotify resource not found')
    }

    if (response.status === 429) {
      throw new ApiRouteError(429, 'Spotify rate limit reached')
    }

    throw new ApiRouteError(502, 'Spotify API request failed')
  }

  return (await response.json()) as T
}

export async function fetchSpotifyProfile(accessToken: string) {
  return fetchSpotifyJson<SpotifyProfileResponse>(accessToken, '/me')
}

export async function requireSpotifyAccount(userId: string) {
  const account = await prisma.spotifyAccount.findUnique({
    where: { userId },
  })

  if (!account) {
    throw new ApiRouteError(404, 'Connect Spotify before using playlist verification')
  }

  return account
}

export async function getValidSpotifyAccessToken(userId: string) {
  const account = await requireSpotifyAccount(userId)

  if (account.expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return account.accessToken
  }

  const refreshed = await refreshSpotifyToken(account.refreshToken)

  const updated = await prisma.spotifyAccount.update({
    where: { id: account.id },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? account.refreshToken,
      expiresAt: getExpiryDate(refreshed.expires_in),
    },
  })

  return updated.accessToken
}

async function fetchAllSpotifyPages<T>(accessToken: string, initialPath: string) {
  const items: T[] = []
  let nextUrl: string | null = `${SPOTIFY_API_BASE_URL}${initialPath}`

  while (nextUrl) {
    const page: SpotifyPaging<T> = await fetchSpotifyJson<SpotifyPaging<T>>(
      accessToken,
      nextUrl
    )
    items.push(...page.items)
    nextUrl = page.next
  }

  return items
}

async function fetchSpotifyPlaylistDetail(
  accessToken: string,
  spotifyPlaylistId: string
) {
  return fetchSpotifyJson<SpotifyPlaylistDetail>(
    accessToken,
    `/playlists/${spotifyPlaylistId}?fields=id,name,followers(total),tracks(total),external_urls(spotify)`
  )
}

async function runInBatches<T, TResult>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<TResult>
) {
  const results: TResult[] = []

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }

  return results
}

export async function syncSpotifyPlaylistsForUser(userId: string) {
  const accessToken = await getValidSpotifyAccessToken(userId)
  const summaries = await fetchAllSpotifyPages<SpotifyPlaylistSummary>(
    accessToken,
    '/me/playlists?limit=50'
  )

  const details = await runInBatches(summaries, 5, async (playlist) => {
    const detail = await fetchSpotifyPlaylistDetail(accessToken, playlist.id)

    return {
      spotifyPlaylistId: detail.id,
      spotifyUrl: detail.external_urls?.spotify ?? null,
      name: detail.name,
      followers: detail.followers?.total ?? 0,
      trackCount: detail.tracks.total,
    }
  })

  const syncedAt = new Date()

  await prisma.$transaction([
    prisma.playlist.deleteMany({
      where: {
        userId,
        spotifyPlaylistId: {
          notIn: details.length > 0 ? details.map((playlist) => playlist.spotifyPlaylistId) : ['__none__'],
        },
      },
    }),
    ...details.map((playlist) =>
      prisma.playlist.upsert({
        where: {
          userId_spotifyPlaylistId: {
            userId,
            spotifyPlaylistId: playlist.spotifyPlaylistId,
          },
        },
        create: {
          userId,
          spotifyPlaylistId: playlist.spotifyPlaylistId,
          spotifyUrl: playlist.spotifyUrl,
          name: playlist.name,
          followers: playlist.followers,
          trackCount: playlist.trackCount,
          lastSyncedAt: syncedAt,
        },
        update: {
          spotifyUrl: playlist.spotifyUrl,
          name: playlist.name,
          followers: playlist.followers,
          trackCount: playlist.trackCount,
          lastSyncedAt: syncedAt,
        },
      })
    ),
  ])

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: [{ followers: 'desc' }, { name: 'asc' }],
  })

  return playlists.map((playlist) => ({
    id: playlist.id,
    spotifyPlaylistId: playlist.spotifyPlaylistId,
    name: playlist.name,
    spotifyUrl: playlist.spotifyUrl,
    followers: playlist.followers,
    trackCount: playlist.trackCount,
    lastSyncedAt: playlist.lastSyncedAt.toISOString(),
  })) satisfies SyncedPlaylistRecord[]
}

export async function fetchAllPlaylistTrackIds(
  accessToken: string,
  spotifyPlaylistId: string
) {
  const trackIds: string[] = []
  let nextUrl: string | null =
    `${SPOTIFY_API_BASE_URL}/playlists/${spotifyPlaylistId}/tracks?limit=100&fields=items(track(id,type)),next`

  while (nextUrl) {
    const page: SpotifyPlaylistItemPage = await fetchSpotifyJson<SpotifyPlaylistItemPage>(
      accessToken,
      nextUrl
    )

    for (const item of page.items) {
      if (item.track?.type === 'track' && item.track.id) {
        trackIds.push(item.track.id)
      }
    }

    nextUrl = page.next
  }

  return trackIds
}

export async function fetchPlaylistTrackIdsForUser(
  userId: string,
  spotifyPlaylistId: string
) {
  const accessToken = await getValidSpotifyAccessToken(userId)
  return fetchAllPlaylistTrackIds(accessToken, spotifyPlaylistId)
}

export async function fetchPlaylistTrackIdsForPlatform(
  spotifyPlaylistId: string
) {
  const accessToken = await getPlatformSpotifyAccessToken()
  return fetchAllPlaylistTrackIds(accessToken, spotifyPlaylistId)
}

export function getTrackIdsFromSnapshot(trackIds: Prisma.JsonValue) {
  if (!Array.isArray(trackIds)) {
    return []
  }

  return trackIds.filter((trackId): trackId is string => typeof trackId === 'string')
}

export async function requireTrackSpotifyId(trackId: string) {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
  })

  if (!track) {
    throw new ApiRouteError(404, 'Track not found')
  }

  const spotifyTrackId = extractSpotifyTrackId(track.spotifyUrl)

  if (!spotifyTrackId) {
    throw new ApiRouteError(422, 'Stored Spotify track URL is invalid')
  }

  return {
    track,
    spotifyTrackId,
    spotifyTrackUri: getSpotifyTrackUri(track.spotifyUrl) as string,
  }
}

export async function assertPlaylistVerificationEligibility(
  userId: string,
  trackId: string
) {
  const session = await prisma.listeningSession.findUnique({
    where: {
      userId_trackId: {
        userId,
        trackId,
      },
    },
  })

  if (!session || !session.completed || session.activeListenTimeMs < PLAYLIST_MINIMUM_LISTEN_MS) {
    throw new ApiRouteError(
      409,
      'Complete a full 30-second listening session before verifying a playlist add'
    )
  }

  return session
}

export async function getPlatformSpotifyAccessToken() {
  if (!serverEnv.SPOTIFY_PLATFORM_REFRESH_TOKEN) {
    throw new ApiRouteError(501, 'Platform playlist add is not configured')
  }

  const refreshed = await refreshSpotifyToken(serverEnv.SPOTIFY_PLATFORM_REFRESH_TOKEN)
  return refreshed.access_token
}

export async function addTrackToPlaylistWithPlatformToken(
  spotifyPlaylistId: string,
  spotifyTrackUri: string
) {
  const accessToken = await getPlatformSpotifyAccessToken()

  return fetchSpotifyJson<{ snapshot_id: string }>(accessToken, `/playlists/${spotifyPlaylistId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      uris: [spotifyTrackUri],
    }),
  })
}

export async function fetchSpotifyPlaylistDetailForPlatform(
  spotifyPlaylistId: string
) {
  const accessToken = await getPlatformSpotifyAccessToken()
  return fetchSpotifyPlaylistDetail(accessToken, spotifyPlaylistId)
}

export function getSpotifyTokenExpiry(expiresInSeconds: number) {
  return getExpiryDate(expiresInSeconds)
}
