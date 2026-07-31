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
        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/65">
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

/**
 * A chat bubble and the timestamp under it, at the geometry
 * ConversationTimeline renders: `px-4 py-2.5` around a 20px `text-sm` line box,
 * so `height` is 20px per line of copy plus 20px of padding — `h-10` for one
 * line, `h-15` for two, `h-20` for three. Then a `mt-1.5` stamp.
 */
function BubbleSkeleton({ role, height }: { role: 'user' | 'assistant'; height: string }) {
  return (
    <div className={twMerge('flex flex-col', role === 'user' ? 'items-end' : 'items-start')}>
      <Skeleton className={twMerge('w-[70%] max-w-[85%] rounded-2xl', height)} />
      <Skeleton className="mt-1.5 mx-2 h-3 w-28" />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Mirrors TabBar: three tabs at `px-4 py-2` around a 16px `text-xs` line
          box, over the same 2px selected-tab rail. Two stubs in a bare flex row
          sat ~12px shorter than the real bar and the panel jumped on load. */}
      <div className="mb-4 flex border-b border-white/10">
        {['w-16', 'w-20', 'w-20'].map((w, i) => (
          <div key={i} className="px-4 py-2 border-b-2 border-transparent -mb-px">
            <Skeleton className={twMerge('h-4', w)} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <BubbleSkeleton role="user" height="h-10" />
        <BubbleSkeleton role="assistant" height="h-20" />
        <BubbleSkeleton role="user" height="h-10" />
        <BubbleSkeleton role="assistant" height="h-15" />
      </div>

      {/* The Location / Notes / actions footer is always present once the fetch
          resolves, so leaving it out of the skeleton grew the drawer by ~230px
          on load and shoved every row below it down the page. */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <Skeleton className="mb-1.5 h-3 w-16" />
        {/* px-3 py-2 around a 20px text-sm line box, plus the 1px border. */}
        <Skeleton className="h-9.5 w-full rounded-lg" />
        <Skeleton className="mt-1.5 h-2.5 w-full" />
        <Skeleton className="mt-1 h-2.5 w-2/3" />

        <Skeleton className="mt-4 mb-1.5 h-3 w-12" />
        {/* Same, over rows={3}. */}
        <Skeleton className="h-19.5 w-full rounded-lg" />

        {/* size="sm" buttons: py-1.5 around a 16px text-xs line box + border. */}
        <div className="mt-2 flex items-center justify-end gap-2">
          <Skeleton className="h-7.5 w-24 rounded-lg" />
          <Skeleton className="h-7.5 w-20 rounded-lg" />
        </div>
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
