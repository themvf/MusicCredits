export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-[#111111] p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Curator Applications</h2>
        <p className="text-sm text-white/40">
          Review pending applications. Build out this UI when the first applications arrive.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#111111] p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Platform Settings</h2>
        <p className="text-sm text-white/40">
          Adjust runtime configuration (e.g. curator_min_followers). Build out this UI when needed.
        </p>
      </div>
    </div>
  )
}
