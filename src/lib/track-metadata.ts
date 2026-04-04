import 'server-only'

import { prisma } from '@/lib/prisma'
import { fetchSpotifyTrackMetadataByUrl } from '@/lib/spotify-api'
import { getSpotifyTrackLabel } from '@/lib/spotify'

interface TrackMetadataRecord {
  id: string
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string | null
  artistName: string | null
  artworkUrl: string | null
}

export interface HydratedTrackMetadata {
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string
  artistName: string
  artworkUrl: string | null
}

function hasStoredTrackMetadata(track: TrackMetadataRecord) {
  return Boolean(track.title && track.artistName)
}

function getFallbackTrackMetadata(
  track: Pick<
    TrackMetadataRecord,
    'spotifyUrl' | 'spotifyTrackId' | 'artworkUrl' | 'title' | 'artistName'
  >
): HydratedTrackMetadata {
  return {
    spotifyUrl: track.spotifyUrl,
    spotifyTrackId: track.spotifyTrackId,
    title: track.title ?? getSpotifyTrackLabel(track.spotifyUrl),
    artistName: track.artistName ?? 'Unknown artist',
    artworkUrl: track.artworkUrl ?? null,
  }
}

export async function hydrateTrackMetadata(
  track: TrackMetadataRecord
): Promise<HydratedTrackMetadata> {
  if (hasStoredTrackMetadata(track)) {
    return getFallbackTrackMetadata(track)
  }

  try {
    const metadata = await fetchSpotifyTrackMetadataByUrl(track.spotifyUrl)

    await prisma.track.update({
      where: { id: track.id },
      data: {
        spotifyTrackId: metadata.spotifyTrackId,
        spotifyUrl: metadata.spotifyUrl,
        title: metadata.title,
        artistName: metadata.artistName,
        artworkUrl: metadata.artworkUrl,
      },
    })

    return metadata
  } catch (error) {
    console.error('[Track metadata hydration failed]', track.id, error)
    return getFallbackTrackMetadata(track)
  }
}

export async function hydrateTrackMetadataList<T extends TrackMetadataRecord>(
  tracks: T[]
): Promise<Array<T & HydratedTrackMetadata>> {
  return Promise.all(
    tracks.map(async (track) => ({
      ...track,
      ...(await hydrateTrackMetadata(track)),
    }))
  )
}
