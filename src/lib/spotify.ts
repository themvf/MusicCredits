/**
 * Spotify URL utilities.
 * All validation logic lives here so it can be shared between
 * client-side hints and server-side Zod schemas.
 */

// Matches exactly: https://open.spotify.com/track/<22 alphanumeric chars>
// The URL may also have query params (e.g. ?si=...) which we intentionally
// allow in the regex capture but strip when extracting the ID.
export const SPOTIFY_TRACK_URL_REGEX =
  /^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/

/**
 * Returns the 22-character Spotify track ID from a full track URL.
 * Returns null if the URL does not match the expected format.
 */
export function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(SPOTIFY_TRACK_URL_REGEX)
  return match ? match[1] : null
}

/**
 * Returns the Spotify embed URL for an iframe given a track URL.
 * Used in the SpotifyEmbed component.
 */
export function getEmbedUrl(spotifyUrl: string): string | null {
  const trackId = extractSpotifyTrackId(spotifyUrl)
  if (!trackId) return null
  return `https://open.spotify.com/embed/track/${trackId}`
}
