export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton h-44 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="skeleton h-3.5 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-1/3 mt-1" />
        <div className="skeleton h-8 w-full mt-2" />
      </div>
    </div>
  )
}
