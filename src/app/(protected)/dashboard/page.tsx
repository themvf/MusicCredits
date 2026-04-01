import { getAuthenticatedUser } from '@/lib/auth'
import StartListeningButton from '@/components/StartListeningButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Welcome back! You have{' '}
        <span className="text-green-400 font-semibold">{user.credits} credits</span>.
      </p>

      {/* Credit balance card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">
              Credit Balance
            </p>
            <p className="text-4xl font-extrabold text-white">
              {user.credits}
              <span className="text-lg font-normal text-gray-400 ml-2">
                credits
              </span>
            </p>
          </div>
          <span className="text-5xl">⚡</span>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <span className="text-white font-semibold">-10</span> per track
            submission
          </div>
          <div>
            <span className="text-white font-semibold">+1</span> per listening
            session
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start listening — client component handles the API call + redirect */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white">Start Listening</h2>
          <p className="text-gray-400 text-sm flex-1">
            Listen to another artist&apos;s track for 30 seconds and earn +1
            credit.
          </p>
          <StartListeningButton />
        </div>

        {/* Submit a track */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white">Submit a Track</h2>
          <p className="text-gray-400 text-sm flex-1">
            Submit your Spotify track to get it heard. Costs 10 credits.{' '}
            {user.credits < 10 && (
              <span className="text-red-400">
                You need {10 - user.credits} more credits.
              </span>
            )}
          </p>
          <Link
            href="/submit"
            className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              user.credits >= 10
                ? 'bg-green-500 hover:bg-green-400 text-black'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            Submit Track (10 credits)
          </Link>
        </div>
      </div>
    </div>
  )
}
