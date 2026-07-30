import { twMerge } from 'tailwind-merge'
import { Panel } from '../../components/ui'

export function Skeleton({ className }: { className?: string }) {
  return <div className={twMerge('rounded bg-white/10', className)} />
}

export function MetricsRowSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Panel key={i} variant="raised-dark" className="flex flex-col gap-2 rounded-2xl p-4 min-w-[110px] animate-pulse">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-7 w-10" />
          <Skeleton className="h-2 w-20" />
        </Panel>
      ))}
      <Panel variant="raised-dark" className="flex-1 rounded-2xl p-4 animate-pulse">
        <Skeleton className="h-full w-full min-h-[48px]" />
      </Panel>
    </>
  )
}

export function VisitorTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table className="w-full table-fixed text-sm animate-pulse">
      <thead>
        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
          <th className="py-2 px-4 font-semibold w-28">Visitor</th>
          <th className="py-2 pr-4 font-semibold w-36">Last seen</th>
          <th className="py-2 pr-4 font-semibold w-36">Name</th>
          <th className="py-2 pr-4 font-semibold">Email</th>
          <th className="py-2 pr-4 font-semibold text-right w-16">Chat</th>
          <th className="py-2 pr-4 font-semibold text-right w-24">Contact</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-white/5">
            <td className="py-3 px-4"><Skeleton className="h-3 w-20" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-28" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-20" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-36" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-4 ml-auto" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-4 ml-auto" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex gap-8 border-b border-white/10 pb-2.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end"><Skeleton className="h-9 w-48 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
        <div className="flex justify-end"><Skeleton className="h-9 w-36 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-12 w-52 rounded-2xl" /></div>
      </div>
    </div>
  )
}

export function MetaFieldSkeletons({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 min-w-0 animate-pulse">
          <Skeleton className="shrink-0 w-7 h-7 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-2 w-10" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </>
  )
}
