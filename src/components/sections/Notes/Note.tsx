import { ArrowLeft, ArrowRight, GitCommitHorizontal } from 'lucide-react'
import type { Note as NoteEntry } from '@/data/notes'
import { commitUrl, noteBySlug, noteNeighbours } from '@/data/notes'
import { noteMdComponents, prefetchMarkdown } from '@/lib/markdown'
import { Backdrop, Button, CascadeGroup, CascadeItem, Container, Eyebrow, H1, Markdown, Panel, Pill } from '../../ui'
import { formatNoteDate } from './formatDate'

/*
 * Warmed at module scope, not in an effect.
 *
 * On every other route the markdown parser is optional — the chat needs it only
 * once there is a reply. Here it *is* the page: the entire body renders through
 * <Markdown>, whose Suspense fallback is a single raw-text paragraph. Starting
 * the fetch when this route's chunk lands, rather than after the first paint an
 * effect would wait for, is what keeps that fallback from being seen.
 */
prefetchMarkdown()

interface NoteProps {
  slug: string
}

export default function Note({ slug }: NoteProps) {
  const note = noteBySlug(slug)

  // Unreachable through the generated routes — every /notes/<slug> document
  // exists because this array produced it. It covers a hand-typed URL and a
  // slug renamed without its document being regenerated.
  if (!note) return <NoteNotFound />

  const { previous, next } = noteNeighbours(slug)

  return (
    <main id="main" className="bg-white text-blue-950">
      {/* pt is 2rem beyond the visual target to offset skew-hero's -2rem margin. */}
      <section className="relative bg-gradient-to-br from-blue-950 to-blue-900 text-white overflow-hidden skew-hero pt-40 pb-16 md:pt-48 md:pb-24">
        {/* Unflipped, where the Footer's is flipped — two dark Backdrops on the
            same page read as copies of each other otherwise. */}
        <Backdrop tone="dark" />
        <Container className="unskew-hero">
          <CascadeGroup mountOnly className="flex flex-col gap-4">
            {/*
              No eyebrow. On the index it labels the page, but here the reader
              arrived at one entry and the masthead's job is to identify that
              entry, not the section it belongs to — which the breadcrumb, the
              URL and the "All notes" button below already do three times over.

              Date and tags are one meta block above the title, matching the
              order the index cards use. The date carries the card's uppercase
              treatment now that it stands alone; at the old body-text size it
              read as a stray line rather than as metadata.
            */}
            <CascadeItem index={0}>
              <div className="flex flex-col gap-3">
                <time
                  dateTime={note.date}
                  className="font-sans text-xs font-semibold uppercase tracking-wider text-white"
                >
                  {formatNoteDate(note.date)}
                </time>
                <div className="flex flex-wrap items-center gap-2">
                  {note.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              </div>
            </CascadeItem>
            <CascadeItem index={1}>
              {/*
                Sans, not the display face the other routes use for H1. Display
                is uppercase and set at text-8xl, which is built for a two-word
                masthead — a note title is a full sentence, and at that size it
                becomes four lines of shouting before the reader reaches a verb.
              */}
              <h1 className="font-sans text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-white">
                {note.title}
              </h1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-lg md:text-xl text-white/80 pt-1 pb-3 leading-relaxed">
                {note.summary}
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/notes" variant="primary" leftIcon={<ArrowLeft size={14} />}>
                  All notes
                </Button>
                {note.commit && (
                  <Button
                    href={commitUrl(note.commit)}
                    variant="glass-light"
                    leftIcon={<GitCommitHorizontal size={14} />}
                  >
                    {note.commit}
                  </Button>
                )}
              </div>
            </CascadeItem>
          </CascadeGroup>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <CascadeGroup threshold={0.05}>
            <CascadeItem index={0}>
              <article>
                <Markdown components={noteMdComponents}>{note.body}</Markdown>
              </article>
            </CascadeItem>
          </CascadeGroup>

          {(previous || next) && (
            <CascadeGroup
              as="nav"
              aria-label="More notes"
              className="pt-14 mt-14 border-t border-blue-950/10"
              threshold={0.1}
            >
              <CascadeItem index={0}>
                {/* Older sits left, newer right — reading direction, so the pair
                    reads as a timeline rather than as two buttons. A grid rather
                    than flex, so a missing neighbour can leave its column empty
                    and the surviving card stays on its own side. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <NotePagerLink note={previous} direction="previous" />
                  <NotePagerLink note={next} direction="next" />
                </div>
              </CascadeItem>
            </CascadeGroup>
          )}
        </Container>
      </section>
    </main>
  )
}

/**
 * A neighbouring note, rendered as the same card the index uses.
 *
 * It used to be a label and a title. The label said "Older", which describes
 * the *relationship* and not the destination, so the only real information was
 * a title with nothing around it to judge whether it was worth the click. These
 * carry what the index carries — date, title, summary, tags — because a reader
 * who has just finished an entry is deciding whether to read another one, and
 * that is the same decision the index exists to support.
 *
 * The direction label stays, and stays mirrored: left with a back arrow for
 * older, right with a forward arrow for newer. That is the one thing a card on
 * the index cannot tell you, and it is what keeps the pair reading as a
 * position in a timeline rather than as two unrelated suggestions.
 */
function NotePagerLink({
  note,
  direction,
}: {
  note?: NoteEntry
  direction: 'previous' | 'next'
}) {
  // Holds the column rather than rendering nothing, so at either end of the
  // archive the surviving card stays on its own side instead of sliding across
  // and implying the wrong direction. Hidden on mobile, where the grid is one
  // column and an empty cell would just be a gap.
  if (!note) return <div className="hidden sm:block" aria-hidden="true" />

  const isNext = direction === 'next'
  return (
    /*
      Labelled explicitly, because the computed name would otherwise be the
      whole card read out: "Older, August 1 2026, <title>, <summary>, Canvas,
      Performance, Animation". The card's own tags are static spans here, so
      unlike the index card there is nothing interactive inside the link and it
      can stay a plain wrapper. The direction belongs in the name — "Older" is
      the one thing this card says that the destination cannot.
    */
    <a
      href={`/notes/${note.slug}`}
      rel={isNext ? 'next' : 'prev'}
      aria-label={`${isNext ? 'Newer' : 'Older'} note: ${note.title}`}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    >
      <Panel
        variant="white"
        className="h-full p-5 md:p-6 rounded-xl transition group-hover:shadow-lg group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
      >
        <div className="flex flex-col gap-2.5 h-full">
          <time
            dateTime={note.date}
            className="font-sans text-xs font-semibold uppercase tracking-wider text-blue-950/50"
          >
            {formatNoteDate(note.date)}
          </time>

          <span className="font-sans text-lg font-semibold leading-snug">{note.title}</span>

          {/* Clamped rather than trimmed in the data: a half-width card takes
              two lines of a summary written for the index's full width, and the
              cut is the layout's business, not the content's. */}
          <p className="font-sans text-sm text-blue-950/70 leading-relaxed line-clamp-2">
            {note.summary}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Static, unlike the index's. A tag here is describing the
                destination, and there is no list on this page for it to filter. */}
            {note.tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>

          {/*
            The direction now reads as the card's action, in the slot the index
            card puts "Read" in, so the two surfaces resolve to the same shape.
            Mirrored: Older sits left behind a back arrow, Newer sits right
            behind a forward one, which is the position cue the label used to
            carry at the top of the card.

            `as="span"` and `aria-hidden` for the same reasons as the index
            card's Read button. The card is already the link, so a real button
            here would be invalid nesting, and the direction is in the link's
            aria-label already — announcing "Older" twice names nothing new.
          */}
          <div className={`mt-auto pt-3 flex ${isNext ? 'justify-end' : 'justify-start'}`}>
            <Button
              as="span"
              aria-hidden="true"
              variant="primary"
              size="sm"
              leftIcon={isNext ? undefined : <ArrowLeft />}
              rightIcon={isNext ? <ArrowRight /> : undefined}
            >
              {isNext ? 'Newer' : 'Older'}
            </Button>
          </div>
        </div>
      </Panel>
    </a>
  )
}

function NoteNotFound() {
  return (
    <main id="main" className="bg-blue-950 text-white min-h-[70vh] flex items-center">
      <Container>
        <div className="flex flex-col gap-4 max-w-xl">
          <Eyebrow size="lg" className="text-white">Notes</Eyebrow>
          <H1 className="text-white">No such note</H1>
          <p className="font-sans text-lg text-white/80 pb-2">
            That entry doesn't exist. It may have been renamed since the link was made.
          </p>
          <div>
            <Button href="/notes" variant="primary" leftIcon={<ArrowLeft size={14} />}>
              All notes
            </Button>
          </div>
        </div>
      </Container>
    </main>
  )
}
