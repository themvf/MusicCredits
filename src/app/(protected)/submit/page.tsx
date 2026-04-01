import { getAuthenticatedUser } from '@/lib/auth'
import SubmitTrackForm from '@/components/SubmitTrackForm'

export default async function SubmitPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Submit a Track</h1>
      <p className="text-gray-400 mb-8">
        Share your Spotify track URL. It costs{' '}
        <span className="text-white font-semibold">10 credits</span> to submit.
        You currently have{' '}
        <span className="text-green-400 font-semibold">{user.credits} credits</span>.
      </p>

      <SubmitTrackForm credits={user.credits} />

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
        <p className="font-semibold text-gray-300 mb-2">How to find your Spotify track URL:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open Spotify (desktop or web)</li>
          <li>Find the track you want to promote</li>
          <li>Right-click (or tap the three dots) → Share → Copy Song Link</li>
          <li>Paste it in the field above</li>
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          Example:{' '}
          <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">
            https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
          </code>
        </p>
      </div>
    </div>
  )
}
