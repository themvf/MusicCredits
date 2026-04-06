import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'

// All routes under /admin/* are protected behind role: admin.
// The admin account is intentionally separate from artist/curator personas.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-white/8 pb-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-acid">
              SoundSwap Admin
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Control Panel
            </h1>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-white/30 transition hover:text-white"
          >
            ← Back to app
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
