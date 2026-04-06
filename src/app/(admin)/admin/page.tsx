import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { REJECTION_REASONS } from '@/app/api/admin/applications/[id]/review/route'
import AdminApplicationRow from '@/components/AdminApplicationRow'
import AdminCuratorRow from '@/components/AdminCuratorRow'

export default async function AdminPage() {
  const [applications, activeCurators] = await Promise.all([
    prisma.curatorApplication.findMany({
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
            sessions: { where: { completed: true }, select: { id: true } },
          },
        },
      },
    }),
    prisma.curatorProfile.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        playlists: { select: { playlistName: true, followers: true } },
        user: {
          include: {
            artistProfile: { select: { displayName: true } },
            sessions: { where: { completed: true, isCuratorReview: true }, select: { id: true } },
          },
        },
        approvedFrom: { select: { createdAt: true } },
      },
    }),
  ])

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

  // Gather Clerk users for anyone missing an ArtistProfile displayName
  const usersNeedingClerk = [
    ...applications.filter((a) => !a.user.artistProfile?.displayName).map((a) => a.user),
    ...activeCurators.filter((c) => !c.user.artistProfile?.displayName).map((c) => c.user),
  ]
  const clerk = await clerkClient()
  const clerkUsers = await Promise.all(
    usersNeedingClerk.map((u) =>
      clerk.users
        .getUser(u.clerkId)
        .then((cu) => ({
          clerkId: u.clerkId,
          name: [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.username || u.id.slice(-8),
        }))
        .catch(() => ({ clerkId: u.clerkId, name: u.id.slice(-8) }))
    )
  )
  const clerkNameMap = Object.fromEntries(clerkUsers.map((u) => [u.clerkId, u.name]))

  function resolveDisplayName(user: { id: string; clerkId: string; artistProfile: { displayName: string | null } | null }) {
    return user.artistProfile?.displayName || clerkNameMap[user.clerkId] || user.id.slice(-8)
  }

  return (
    <div className="space-y-10">
      {/* ─── Pending applications ───────────────────────────────────────────── */}
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
              const stats = statsMap[app.userId]
              return (
                <AdminApplicationRow
                  key={app.id}
                  applicationId={app.id}
                  displayName={resolveDisplayName(app.user)}
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

      {/* ─── Active curators ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active curators</h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/40">
            {activeCurators.length} total
          </span>
        </div>

        {activeCurators.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-white/40">
            No active curators yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activeCurators.map((curator) => (
              <AdminCuratorRow
                key={curator.id}
                userId={curator.userId}
                displayName={resolveDisplayName(curator.user)}
                approvedAt={curator.approvedFrom?.createdAt.toISOString() ?? curator.createdAt.toISOString()}
                playlists={curator.playlists}
                reviewsCompleted={curator.user.sessions.length}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Platform settings ──────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-white">Platform settings</h2>
        <div className="surface-card p-6 text-sm text-white/40">
          Build out this UI when needed.
        </div>
      </section>
    </div>
  )
}
