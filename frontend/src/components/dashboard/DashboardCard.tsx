interface Props {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: React.ReactNode
}

export default function DashboardCard({ label, value, sub, color = 'text-accentLight', icon }: Props) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-surface3 border border-white/[0.06] flex items-center justify-center text-gray-500">
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}
