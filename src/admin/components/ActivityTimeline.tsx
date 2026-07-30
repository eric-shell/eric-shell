import { Clock, MonitorSmartphone, MousePointer2, Scroll } from 'lucide-react'
import { formatDuration, formatLong } from '../lib/dateFormat'
import type { PageView, VisitorSession } from '@/../api/_lib/types'

interface Props {
  sessions: VisitorSession[]
  pageViews: PageView[]
}

function Stat({ icon: Icon, children, title }: {
  icon: typeof Clock
  children: React.ReactNode
  title?: string
}) {
  return (
    <span className="inline-flex items-center gap-1 text-white/85" title={title}>
      <Icon size={11} className="text-white/80" />
      {children}
    </span>
  )
}

export default function ActivityTimeline({ sessions, pageViews }: Props) {
  if (sessions.length === 0 && pageViews.length === 0) {
    return (
      <p className="text-sm text-white/65">
        No browsing activity recorded. Visitors who arrived before page-view tracking shipped, or
        who send Global Privacy Control / Do Not Track, won't have sessions here.
      </p>
    )
  }

  // Views not attached to any session row (e.g. a pageview whose session insert
  // failed) would otherwise vanish from this view entirely.
  const bySession = new Map<string, PageView[]>()
  const orphans: PageView[] = []
  for (const pv of pageViews) {
    if (pv.session_id && sessions.some(s => s.id === pv.session_id)) {
      const list = bySession.get(pv.session_id) ?? []
      list.push(pv)
      bySession.set(pv.session_id, list)
    } else {
      orphans.push(pv)
    }
  }

  return (
    <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1">
      {sessions.map(s => {
        const views = bySession.get(s.id) ?? []
        return (
          <div key={s.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px]">
              <span className="font-semibold text-white">{formatLong(s.started_at)}</span>
              <span className="flex flex-wrap items-center gap-3">
                <Stat icon={Clock} title="Engaged time — counts only while the tab was visible">
                  {formatDuration(s.engaged_ms)}
                </Stat>
                <Stat icon={Scroll} title="Furthest scroll depth reached">
                  {s.max_scroll_pct}%
                </Stat>
                <Stat icon={MousePointer2} title="Page views in this session">
                  {s.page_view_count} {s.page_view_count === 1 ? 'view' : 'views'}
                </Stat>
                {s.viewport_w && s.viewport_h && (
                  <Stat icon={MonitorSmartphone} title="Viewport, and screen size in parentheses">
                    {s.viewport_w}×{s.viewport_h}
                    {s.screen_w && s.screen_h && (
                      <span className="text-white/80"> ({s.screen_w}×{s.screen_h})</span>
                    )}
                  </Stat>
                )}
              </span>
            </div>

            {s.referrer && (
              <p className="mb-1.5 truncate text-[10px] text-white/65">
                Referred by <span className="text-white/85">{s.referrer}</span>
              </p>
            )}

            {views.length > 0 ? (
              <ul className="flex flex-col gap-0.5 border-t border-white/5 pt-1.5">
                {/* Sort explicitly rather than reversing: a visit reads best
                    oldest-first, and this shouldn't depend on the API's order. */}
                {[...views].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(v => (
                  <li key={v.id} className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate font-mono text-white/90">{v.path}</span>
                    <span className="shrink-0 text-[10px] text-white/80">
                      {new Date(v.created_at).toLocaleTimeString(undefined, {
                        hour: 'numeric', minute: '2-digit', second: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-white/5 pt-1.5 text-[10px] text-white/80">
                Heartbeat only — no page view recorded for this session.
              </p>
            )}
          </div>
        )
      })}

      {orphans.length > 0 && (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/65">
            Unattributed views
          </p>
          <ul className="flex flex-col gap-0.5">
            {orphans.map(v => (
              <li key={v.id} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-mono text-white/90">{v.path}</span>
                <span className="shrink-0 text-[10px] text-white/80">{formatLong(v.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
