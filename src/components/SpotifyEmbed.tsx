'use client'

interface Props {
  /** The 22-character Spotify track ID (NOT the full URL) */
  trackId: string
}

/**
 * Renders the official Spotify embed iframe.
 * The frame-src CSP header in next.config.ts allows open.spotify.com.
 */
export default function SpotifyEmbed({ trackId }: Props) {
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <iframe
        src={embedUrl}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify track player"
        className="block"
      />
    </div>
  )
}
