interface Props {
  label: string
  value: string | number
  sub?: string
}

/**
 * A single stat number card used in the dashboard stats bar.
 */
export default function StatCard({ label, value, sub }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs">{sub}</p>}
    </div>
  )
}
