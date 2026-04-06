'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { ArrowUpRightIcon } from '@/components/AppIcons'

interface Track {
  id: string
  title: string
  artistName: string
  spotifyUrl: string
  artworkUrl: string | null
}

interface CuratorPlaylist {
  id: string
  name: string
  spotifyPlaylistId: string
  genres: string[]
  followers: number
}

interface Props {
  track: Track
  playlists: CuratorPlaylist[]
  credits: number | null
}

export default function CuratorAddClient({ track, playlists, credits }: Props) {
  const router = useRouter()

  function handleDone() {
    const creditsParam = credits !== null ? `&credits=${credits}` : ''
    router.push(`/review?submitted=1${creditsParam}&decision=added`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="surface-card p-6">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-acid">
          Review submitted
        </p>
        <h1 className="mt-2 text-xl font-black text-white">
          Now add it to your playlist
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Open Spotify and add the track to your matching playlist(s), then confirm below.
        </p>
      </div>

      {/* Track card */}
      <div className="surface-card flex items-center gap-4 p-5">
        {track.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-lg bg-white/[0.04]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-white">{track.title}</p>
          <p className="text-sm text-white/50">{track.artistName}</p>
        </div>
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="button-secondary shrink-0"
        >
          Open track
          <ArrowUpRightIcon className="h-4 w-4" />
        </a>
      </div>

      {/* Matching playlists */}
      {playlists.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
            Your matching playlists
          </p>
          {playlists.map((playlist) => (
            <div key={playlist.id} className="surface-card flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-white">{playlist.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {playlist.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-white/40"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/30">
                  {playlist.followers.toLocaleString()} followers
                </p>
              </div>
              <a
                href={`https://open.spotify.com/playlist/${playlist.spotifyPlaylistId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="button-secondary shrink-0"
              >
                Open playlist
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-white/40">
            No matching playlists found for this track&apos;s genres.
          </p>
        </div>
      )}

      {/* Done button */}
      <div className="space-y-3">
        {credits !== null && (
          <p className="text-center text-sm font-medium text-acid">
            +1 credit earned · {credits} total
          </p>
        )}
        <button
          type="button"
          onClick={handleDone}
          className={cn('button-primary w-full')}
        >
          Done — I&apos;ve added it to Spotify
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/40 transition hover:border-white/20 hover:text-white/60"
        >
          Skip — I&apos;ll add it later
        </button>
      </div>
    </div>
  )
}
