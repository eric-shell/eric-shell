import { Suspense, use } from 'react'
import { ArrowLeft, ArrowRight, GitCommitHorizontal } from 'lucide-react'
import type { NoteMeta } from '@/data/notes-index'
import { commitUrl, noteBody, noteBySlug, noteNeighbours } from '@/data/notes-index'
import { loadMarkdown, noteMdComponents } from '@/lib/markdown'
import { Button, Card, CascadeGroup, CascadeItem, Container, Label, Lead, Markdown, Page, PageHero, Pill, SectionTitle, Sheet, descDelay } from '../../ui'
import { formatNoteDate } from './formatDate'

/*
 * Started at module scope, not in an effect and not on idle.
 *
 * On every other route the markdown parser is optional — the chat needs it only
 * once there is a reply. Here it *is* the page: the entire body renders through
 * <Markdown>. Starting the fetch the moment this route's chunk lands, rather
 * than when the article first renders, takes one round trip off the time until
 * the page is interactive.
 */
void loadMarkdown()

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
    <Page tone="white">
      <PageHero>
        <CascadeGroup mountOnly className="flex flex-col max-w-4xl">
          {/*
            No eyebrow. On the index it labels the page, but here the reader
            arrived at one entry and the masthead's job is to identify that
            entry, not the section it belongs to — which the breadcrumb, the
            URL and the "All notes" button below already do three times over.

            Date and tags are one meta block above the title, matching the
            order the index cards use, on the beat an eyebrow would take.
          */}
          <CascadeItem index={0}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Label as="time" dateTime={note.date}>{formatNoteDate(note.date)}</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {note.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </div>
          </CascadeItem>
          <CascadeItem delayMs={80}>
            {/*
              Sans, not the Display face the other routes' mastheads rise in.
              Display is uppercase black italic, built for a one or two word
              poster title; a note title is a full sentence, and set that way
              it becomes four lines of shouting before the reader reaches a
              verb. It takes the heading's beat in the rhythm instead.
            */}
            <h1 className="pt-6 font-sans text-[clamp(32px,4.4vw,60px)] font-semibold leading-[1.08] tracking-[-0.025em] text-white text-balance">
              {note.title}
            </h1>
          </CascadeItem>
          <CascadeItem delayMs={descDelay(0)}>
            <Lead size="lg" className="max-w-3xl pt-6">{note.summary}</Lead>
          </CascadeItem>
          <CascadeItem delayMs={descDelay(1)}>
            <div className="flex flex-wrap items-center gap-2.5 pt-8">
              <Button
                href="/notes"
                variant="white"
                leftIcon={<ArrowLeft size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                All notes
              </Button>
              {note.commit && (
                <Button
                  href={commitUrl(note.commit)}
                  variant="tint-white"
                  leftIcon={<GitCommitHorizontal size={15} strokeWidth={2.5} aria-hidden="true" />}
                >
                  {note.commit}
                </Button>
              )}
            </div>
          </CascadeItem>
        </CascadeGroup>
      </PageHero>

      <Sheet tone="white" className="py-16 md:py-24">
        <Container>
          {/* The body is this note's own chunk, so it arrives a moment after
              the masthead. Nothing as a fallback, on purpose: in a built page
              the article is already in the document (see scripts/prerender.mjs)
              and React keeps that HTML on screen until the chunk lands, so a
              fallback would never be seen.

              The boundary wraps the CascadeGroup, not the other way round, and
              that order matters — see NoteArticle. */}
          <Suspense fallback={null}>
            <NoteArticle slug={note.slug} />
          </Suspense>

          {(previous || next) && (
            <CascadeGroup
              as="nav"
              aria-label="More notes"
              className="pt-14 mt-16 border-t border-ink/10"
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
      </Sheet>
    </Page>
  )
}

/**
 * The article itself. Split from `Note` so that only this suspends while the
 * body chunk is in flight, and the masthead above it renders straight away.
 *
 * Two rules here, both about hydrating the prerendered page:
 *
 * It waits for the markdown parser as well as the body, even though it never
 * touches the parser itself. `<Markdown>` below has its own Suspense boundary,
 * and that boundary sits under this CascadeGroup's context, which changes when
 * the article scrolls into view. If the parser were still loading at that
 * moment React would drop the prerendered article and show the fallback. Having
 * it settled before anything here renders is what rules that out; the full
 * account is on `loadMarkdown`.
 *
 * And the CascadeGroup lives INSIDE this component, so inside the Suspense
 * boundary in `Note`, for the same reason one level up: a boundary underneath a
 * CascadeGroup is a boundary underneath a context that is about to change.
 */
function NoteArticle({ slug }: { slug: string }) {
  const body = use(noteBody(slug))
  use(loadMarkdown())
  return (
    <CascadeGroup threshold={0.05}>
      <CascadeItem index={0}>
        {/* 672px: the measure `NOTE_IMAGE_SIZES` (NoteFigure) has always
            assumed, and a readable line for a long body. */}
        <article className="max-w-2xl">
          <Markdown components={noteMdComponents}>{body}</Markdown>
        </article>
      </CascadeItem>
    </CascadeGroup>
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
  note?: NoteMeta
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
      The link is labelled explicitly: "Older" is the one thing this card says
      that the destination cannot, so it belongs in the name. The tags are
      static here. A tag on this card describes the destination, and there is
      no list on this page for it to filter.

      The direction also reads as the card's action, mirrored: Older sits left
      behind a back arrow, Newer right behind a forward one. `as="span"` and
      `aria-hidden` because the card is already the link, so a real button
      would be a second control to the same place, and the direction is in the
      link's name already.

      The summary is clamped rather than trimmed in the data: a half-width card
      takes two lines of a summary written for the index's full width, and the
      cut is the layout's business, not the content's.
    */
    <Card
      tone="sheet"
      href={`/notes/${note.slug}`}
      rel={isNext ? 'next' : 'prev'}
      linkLabel={`${isNext ? 'Newer' : 'Older'} note: ${note.title}`}
      title={note.title}
      titleAs="span"
      description={note.summary}
      clampDescription
      meta={<Label as="time" dateTime={note.date} className="text-ink-mute">{formatNoteDate(note.date)}</Label>}
      arrow={false}
      tags={note.tags}
      bar="lum"
      barOrigin={isNext ? 'right' : 'left'}
      className="min-h-0"
      footer={
        <div className={`flex ${isNext ? 'justify-end' : 'justify-start'}`}>
          <Button
            as="span"
            aria-hidden="true"
            variant="luminous"
            size="sm"
            leftIcon={isNext ? undefined : <ArrowLeft />}
            rightIcon={isNext ? <ArrowRight /> : undefined}
          >
            {isNext ? 'Newer' : 'Older'}
          </Button>
        </div>
      }
    />
  )
}

function NoteNotFound() {
  return (
    <Page tone="lum">
      <PageHero className="min-h-[70vh] pb-24 md:pb-32">
        <SectionTitle
          as="h1"
          mountOnly
          eyebrow="Notes"
          title="No such note"
          eyebrowClassName="text-white"
        >
          <CascadeItem delayMs={descDelay(0)}>
            <Lead size="lg" className="max-w-xl pt-8">
              That entry doesn't exist. It may have been renamed since the link was made.
            </Lead>
          </CascadeItem>
          <CascadeItem delayMs={descDelay(1)}>
            <div className="pt-8">
              <Button
                href="/notes"
                variant="white"
                leftIcon={<ArrowLeft size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                All notes
              </Button>
            </div>
          </CascadeItem>
        </SectionTitle>
      </PageHero>
    </Page>
  )
}
