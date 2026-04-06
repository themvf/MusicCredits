/**
 * Canonical genre list — single source of truth.
 * Used by both the track submission form and the curator application form.
 * The matching algorithm compares tracks.genres against curator_genres.genre
 * so both lists MUST stay identical.
 */
export const GENRES = [
  'Pop',
  'Hip-Hop / Rap',
  'R&B / Soul',
  'Electronic / Dance',
  'Rock',
  'Alternative / Indie',
  'Latin',
  'Afrobeats',
  'Jazz',
  'Classical',
  'Country',
  'Folk / Singer-Songwriter',
  'Metal',
  'Reggae / Dancehall',
  'Gospel / Christian',
  'Other',
] as const

export type Genre = (typeof GENRES)[number]
