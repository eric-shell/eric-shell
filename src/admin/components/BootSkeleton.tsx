import { Container, Eyebrow, H2, Panel } from '../../components/ui'
import InsightsPanel from './InsightsPanel'
import VisitorsPanel from './VisitorsPanel'
import { MetricsRowSkeleton, Skeleton } from './Skeleton'
import { DEFAULT_TIMEFRAME } from '../lib/timeframe'

/**
 * What fills the screen while `/api/admin/session` is still in flight.
 *
 * Every panel inside the dashboard already has a skeleton, but they only start
 * once `Dashboard` is mounted — and it can't mount until the auth probe has
 * resolved, because neither UI may flash before its redirect lands (see
 * App.tsx). That left a cold-start-length gap where the whole page was the word
 * "Loading…", which is the one moment the page is least able to explain itself.
 *
 * The shape is chosen by the ROUTE, which is known synchronously, not by the
 * answer we're waiting on. Asking for `/dashboard` and being shown a dashboard
 * frame is honest even if the probe subsequently redirects you — the frame
 * carries no data and asserts nothing about the session.
 */

/** The dashboard, at rest, with every panel in its own loading state. */
export function DashboardBoot() {
  return (
    <Container className="flex flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10">
      {/* The title pair is static, so it renders for real. A skeleton over text
          we already know would be a placeholder standing in for itself. */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow className="text-white/85">eric.sh CRM</Eyebrow>
          <H2 className="text-white">Admin</H2>
        </div>
        {/* Refresh and Sign out: size="sm" buttons, py-1.5 around a 16px
            text-xs line box plus the border. */}
        <div className="flex animate-pulse items-center gap-2">
          <Skeleton className="h-7.5 w-24 rounded-lg" />
          <Skeleton className="h-7.5 w-24 rounded-lg" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:items-stretch xl:min-h-[116px]">
        <MetricsRowSkeleton />
      </div>

      {/* Both panels already render their own skeleton from a null/absent
          payload, so they're driven rather than duplicated — the placeholder
          can't drift away from the thing it stands in for. */}
      <InsightsPanel data={null} />

      <VisitorsPanel
        visitors={null}
        totalCount={0}
        loading={false}
        // Hides the filter row: with no rows loaded there is nothing yet to say
        // how much a filter would remove, and a row of chips reporting zero
        // would have to un-report it a moment later.
        hasAnyVisitors={false}
        timeframe={DEFAULT_TIMEFRAME}
        onTimeframeChange={NOOP}
        hideBots={false}
        botCount={0}
        onToggleBots={NOOP}
        engagedOnly={false}
        quietCount={0}
        onToggleEngaged={NOOP}
        onVisitorDeleted={NOOP}
      />
    </Container>
  )
}

const NOOP = () => {}

/**
 * The sign-in card, at rest.
 *
 * Deliberately no headline copy: on this route the probe may still come back
 * "already signed in", and "This area is private. Sign in to continue." is
 * exactly the sentence that shouldn't flash at someone who is. Bare geometry
 * asserts nothing. The logos are on both screens, so they're safe to draw.
 */
export function LoginBoot() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-120">
        <div className="mb-10 flex justify-center gap-3">
          <img src="/icon.svg" alt="" className="h-10" />
          <img src="/logo.svg" alt="Eric Shell" className="h-10" />
        </div>
        <div className="animate-pulse">
          {/* H1 on the login clamp, then the two-line lede above the card. */}
          <Skeleton className="mx-auto mb-5 h-[clamp(2.25rem,9vw,4.5rem)] w-40" />
          <Skeleton className="mx-auto mb-2 h-4 w-full max-w-104" />
          <Skeleton className="mx-auto mb-8 h-4 w-3/5 max-w-104" />
          <Panel variant="raised-dark" className="mx-auto w-full max-w-sm rounded-2xl p-6 shadow-2xl shadow-black/40">
            {/* Input label, field, then the right-aligned submit. */}
            <Skeleton className="mb-1.5 h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="mt-4 ml-auto h-9.5 w-24 rounded-lg" />
          </Panel>
        </div>
      </div>
    </div>
  )
}
