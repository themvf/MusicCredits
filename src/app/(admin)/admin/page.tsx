import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { REJECTION_REASONS } from '@/app/api/admin/applications/[id]/review/route'
import AdminApplicationRow from '@/components/AdminApplicationRow'

export default async function AdminPage() {
  const applications = await prisma.curatorApplication.findMany({
    where: {
      status: 'pending',
      playlists: { some: { spotifyCheckStatus: 'passed' } },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      playlists: {
        where: { spotifyCheckStatus: 'passed' },
        select: {
          spotifyPlaylistId: true,
          playlistName: true,
          followerCountAtApply: true,
          genres: true,
        },
      },
      user: {
        include: {
          artistProfile: { select: { displayName: true } },
          sessions: {
            where: { completed: true },
            select: { id: true },
          },
        },
      },
    },
  })

  // Fetch avg rating per applicant
  const applicantStats = await Promise.all(
    applications.map(async (app) => {
      const ratings = await prisma.rating.findMany({
        where: { session: { userId: app.userId, completed: true } },
        select: { score: true },
      })
      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
          : null
      return { userId: app.userId, completedSessions: app.user.sessions.length, avgRating }
    })
  )

  const statsMap = Object.fromEntries(applicantStats.map((s) => [s.userId, s]))

  // Fetch Clerk display names for applicants without an ArtistProfile displayName
  const clerk = await clerkClient()
  const clerkUsers = await Promise.all(
    applications
      .filter((app) => !app.user.artistProfile?.displayName)
      .map((app) =>
        clerk.users
          .getUser(app.user.clerkId)
          .then((u) => ({
            clerkId: app.user.clerkId,
            name:
              [u.firstName, u.lastName].filter(Boolean).join(' ') ||
              u.username ||
              app.user.id.slice(-8),
          }))
          .catch(() => ({ clerkId: app.user.clerkId, name: app.user.id.slice(-8) }))
      )
  )
  const clerkNameMap = Object.fromEntries(clerkUsers.map((u) => [u.clerkId, u.name]))

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Pending applications</h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/40">
            {applications.length} waiting
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-white/40">
            No pending applications.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const displayName =
                app.user.artistProfile?.displayName ||
                clerkNameMap[app.user.clerkId] ||
                app.user.id.slice(-8)

              const stats = statsMap[app.userId]

              return (
                <AdminApplicationRow
                  key={app.id}
                  applicationId={app.id}
                  displayName={displayName}
                  appliedAt={app.createdAt.toISOString()}
                  playlists={app.playlists}
                  completedSessions={stats?.completedSessions ?? 0}
                  avgRating={stats?.avgRating ?? null}
                  rejectionReasons={REJECTION_REASONS as unknown as string[]}
                />
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white">Platform settings</h2>
        <div className="surface-card p-6 text-sm text-white/40">
          Build out this UI when needed.
        </div>
      </section>
    </div>
  )
}
