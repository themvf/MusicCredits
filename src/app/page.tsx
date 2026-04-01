import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

/**
 * Landing page: signed-in users go straight to the dashboard,
 * everyone else sees a simple hero with sign-in / sign-up links.
 */
export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
          Sound<span className="text-green-400">Swap</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10">
          A credit-based music listening exchange. Listen to other artists&apos;
          tracks, earn credits, and get your own music heard.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/sign-in"
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Account
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-sm text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🎵</span>
            <span>Submit your Spotify track (10 credits)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">👂</span>
            <span>Listen to others for 30 seconds</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span>Rate and earn +1 credit</span>
          </div>
        </div>
      </div>
    </main>
  )
}
