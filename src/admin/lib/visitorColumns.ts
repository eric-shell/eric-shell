import type { SortKey } from './sortVisitors'

/**
 * The visitor table's column set — one source of truth for the header row, the
 * loading skeleton, and the `colSpan` the open-detail row needs.
 *
 * These three read the same fact and used to state it three times. The skeleton
 * had drifted furthest: it was still rendering a Name and an Email column that
 * merged into `Contact` long ago, and had never heard of Flags, Location or
 * Activity. `readColumnCount` restated the fold points as a pair of media
 * queries, which is the kind of duplication that survives right up until
 * someone adds a column.
 */

/**
 * Which widths a column renders at.
 *
 * The table folds rather than drops — `belowXl` is the merged `Activity`
 * column that `xl` splits back into Engagement / Chat / Sent, and `lg` is
 * Flags, which rides under the visitor id below that. Nothing here is ever
 * lost, only merged; `SortBar` keeps the folded columns' sort keys reachable.
 */
export type ColumnVisibility = 'always' | 'lg' | 'xl' | 'belowXl'

/** The three column sets the table renders, named by the breakpoint they open at. */
export type ColumnBreakpoint = 'md' | 'lg' | 'xl'

export interface SkeletonBar {
  /** Tailwind width class for the bar. */
  w: string
  /** Line box it sits in. Defaults to `h-5`, the table's `text-sm` line. */
  h?: string
  /** Drawn as a badge rather than a line of text — the Flags column. */
  pill?: boolean
}

export interface VisitorColumn {
  /** Stable React key. Not the sort key — Activity and Engagement share one. */
  id: string
  sortKey: SortKey
  label: string
  visible: ColumnVisibility
  /** Width and display classes for the `<th>`, shared with the skeleton's. */
  className?: string
  align?: 'left' | 'right'
  title?: string
  /**
   * Placeholder bars for this column's skeleton cell, top to bottom.
   *
   * More than one entry means the real cell stacks lines — a name over an
   * email, views over engaged time — and `h` is the line box each one sits in,
   * defaulting to the table's own `text-sm` (20px). Getting these right is what
   * keeps a skeleton row the height of the row it stands in for.
   */
  skeleton: SkeletonBar[]
}

export const VISITOR_COLUMNS: VisitorColumn[] = [
  {
    id: 'visitor',
    sortKey: 'visitor',
    label: 'Visitor',
    visible: 'always',
    className: 'px-4 w-36 lg:w-32',
    // The id is `font-mono text-xs`, a 16px line rather than the table's 20px.
    skeleton: [{ w: 'w-24', h: 'h-4' }],
  },
  {
    id: 'flags',
    sortKey: 'flags',
    label: 'Flags',
    visible: 'lg',
    /* w-48, not w-44: `Converted` + `Returning` needs 164px on one line, and
       w-44 (176px) minus this column's pr-4 left exactly 160px of content box —
       four pixels short, so the pair wrapped to two lines on every converted
       visitor who came back. That combination only started appearing when the
       Returning tag was fixed; before that it had never rendered once. w-48
       gives 176px of content, 12px of slack.

       Three-tag rows still wrap by design — `Converted`+`Spam?`+`Returning`
       wants 223px — and buying that would cost Location another 48px. Wrapping
       is the right failure for the rare case. */
    className: 'hidden w-48 lg:table-cell',
    title: 'Heuristic traffic-quality flags. Sorts by severity — possible spam first, then automated, then bounces.',
    // A tag badge measures 17px: 9px type, py-0.5, and a 1px ring.
    skeleton: [{ w: 'w-16', h: 'h-[17px]', pill: true }],
  },
  {
    id: 'lastSeen',
    sortKey: 'lastSeen',
    label: 'Last seen',
    visible: 'always',
    /* 8.5rem, not 8: the widest realistic value ("May 28, 10:01 AM") measures
       114px, and w-32 left 112px inside the gutter — so the one row a month
       with a two-digit hour wrapped to two lines. */
    className: 'w-34 xl:w-36',
    skeleton: [{ w: 'w-24' }],
  },
  {
    id: 'location',
    sortKey: 'location',
    label: 'Location',
    visible: 'always',
    /* Location takes the spare width, not Contact: most visitors are anonymous,
       so a flexible Contact column just grew whitespace, while a corrected
       location can be a long hand-typed string. */
    skeleton: [{ w: 'w-28' }],
  },
  {
    id: 'contact',
    sortKey: 'contact',
    label: 'Contact',
    visible: 'always',
    className: 'w-40 lg:w-48 xl:w-56',
    // Name over email.
    skeleton: [{ w: 'w-24' }, { w: 'w-32', h: 'h-4' }],
  },
  {
    id: 'activity',
    sortKey: 'engagement',
    label: 'Activity',
    visible: 'belowXl',
    className: 'text-right w-36 xl:hidden',
    align: 'right',
    title: 'Page views and engaged time, with chat messages and submissions. Sorts by views, then engaged time.',
    // Views, engaged time, then the folded-in chat and submission counts.
    skeleton: [{ w: 'w-16' }, { w: 'w-12', h: 'h-4' }, { w: 'w-14', h: 'h-4' }],
  },
  {
    id: 'engagement',
    sortKey: 'engagement',
    label: 'Engagement',
    visible: 'xl',
    className: 'hidden text-right w-28 xl:table-cell',
    align: 'right',
    title: 'Page views and engaged time across all sessions. Sorts by views, then engaged time.',
    skeleton: [{ w: 'w-16' }, { w: 'w-10', h: 'h-4' }],
  },
  {
    id: 'chat',
    sortKey: 'chat',
    label: 'Chat',
    visible: 'xl',
    className: 'hidden text-right w-16 xl:table-cell',
    align: 'right',
    title: 'Chat messages',
    skeleton: [{ w: 'w-4' }],
  },
  {
    id: 'sent',
    sortKey: 'sent',
    label: 'Sent',
    visible: 'xl',
    className: 'hidden text-right w-20 xl:table-cell',
    align: 'right',
    title: 'Contact form submissions',
    skeleton: [{ w: 'w-4' }],
  },
]

/** The columns actually rendered at one of the three breakpoints. */
export function visibleColumns(bp: ColumnBreakpoint): VisitorColumn[] {
  return VISITOR_COLUMNS.filter(c => {
    switch (c.visible) {
      case 'always':  return true
      case 'lg':      return bp !== 'md'
      case 'xl':      return bp === 'xl'
      case 'belowXl': return bp !== 'xl'
    }
  })
}
