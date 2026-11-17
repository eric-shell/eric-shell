import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/components/ui/cn'
import { Button, CascadeGroup, CascadeItem, Code, Container, Label, Lead, Page, PageHero, Section, SectionTitle, Sheet, TextLink, descDelay } from '../../ui'
import { useHydrated } from '@/lib/hydration'
import { peekVisitorId } from '@/lib/visitorId'

/** One row of "What's collected": the item on the left from `md`, what it means beside it. */
const ROW = 'grid grid-cols-1 gap-1.5 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-8 border-t border-ink/10 py-5 last:pb-0'

/**
 * One section of the policy: its head in the left 4/12, sticky, and the copy in
 * the right 8/12, the resume's layout, so the two document pages read alike.
 * The copy enters on the description's beat of the head beside it.
 */
function PolicySection({ title, first = false, children }: { title: string; first?: boolean; children: ReactNode }) {
  return (
    <Section tone="inherit" rhythm="tight" className={cn('grid-split gap-6 lg:gap-20', !first && 'border-t border-ink/10')}>
      <SectionTitle size="compact" title={title} sticky />
      <CascadeGroup className="max-w-3xl" threshold={0.1}>
        <CascadeItem delayMs={descDelay(0)}>
          {children}
        </CascadeItem>
      </CascadeGroup>
    </Section>
  )
}

export default function Privacy() {
  return (
    <Page tone="white">
      <PageHero>
        <SectionTitle
          as="h1"
          mountOnly
          eyebrow="How this site handles your data"
          title="Privacy"
          eyebrowClassName="text-white"
          action={
            <Button
              href="/"
              variant="white"
              leftIcon={<ArrowLeft size={15} strokeWidth={2.5} aria-hidden="true" />}
            >
              Back to home
            </Button>
          }
        >
          <CascadeItem delayMs={descDelay(1)}>
            <Lead size="lg" className="max-w-2xl pt-8">
              Plain-language summary of what eric.sh collects, why, and how to ask for it to be removed.
            </Lead>
          </CascadeItem>
        </SectionTitle>
      </PageHero>

      <Sheet tone="white" className="pt-6 pb-16 md:pt-10 md:pb-24">
        <Container>

            <PolicySection title="What's collected" first>
              <div className="flex flex-col gap-4">
                <Lead>
                  When you visit this site, a few categories of data are recorded:
                </Lead>
                <dl className="flex flex-col font-sans text-base leading-relaxed">
                  <div className={ROW}>
                    <dt className="font-semibold">Anonymous visitor ID</dt>
                    <dd className="text-ink-soft">A random UUID generated in your browser and stored in localStorage. It's not tied to your identity unless you submit the contact form. A second random UUID identifies the current visit, and is sent with page views, chat messages, and contact submissions so the records of one visit stay together even if the first ID changes.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Approximate location and device</dt>
                    <dd className="text-ink-soft">Country, region, city, timezone, browser user-agent string, and the page that referred you here. The location fields are estimated from your IP at request time — they're often imprecise and can be wrong by hundreds of miles. Your IP address itself is not stored. Your browser's own language setting, reported timezone, and window and screen dimensions are also recorded.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Pages viewed and time spent</dt>
                    <dd className="text-ink-soft">Which pages you open, when, and the page that referred you, grouped into a visit. Each visit also records how long this tab was actually in the foreground and how far down the page you scrolled. Nothing about what you type or hover is captured.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Links you follow off this site</dt>
                    <dd className="text-ink-soft">When you click a link that leaves eric.sh — a project, a code repository, a social profile, or an email address — the destination address, the link's own wording, and the section of the page it sat in are recorded. This tells me which work people actually open. It stops at the click: nothing follows you to the destination, and there is no record of what you do once you get there.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Filters you apply to a list</dt>
                    <dd className="text-ink-soft">The work grid and the build notes can both be narrowed by tag and re-ordered. When you settle on a selection, the tags you picked and the sort order are recorded, along with which of the two lists you were on. This tells me which kinds of work people come here looking for. Only the selection is recorded, not the individual clicks that built it, and nothing you type into the tag search box is captured.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Campaign tags on the link you arrived by</dt>
                    <dd className="text-ink-soft">If the link you followed here carried <Code>utm_source</Code>, <Code>utm_medium</Code>, or <Code>utm_campaign</Code> in its address, those labels are stored with your visit. They're words I wrote when I shared the link, so I can tell which place I posted it actually reaches people. They describe the link, not you.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Chat transcripts</dt>
                    <dd className="text-ink-soft">If you chat with the assistant on the home page, both your messages and the assistant's replies are saved so I can review the conversations.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Chat interface actions</dt>
                    <dd className="text-ink-soft">A count of a few deliberate actions in the chat panel: clearing a conversation and starting voice input. Voice input is worth spelling out — dictation runs through your own browser's speech recognition, which on Chrome sends the audio to Google and on Safari to Apple, under their privacy policies rather than mine. No audio, and no transcript beyond the message you choose to send, ever reaches this site. All that's recorded here is that the microphone button was pressed.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Contact form submissions</dt>
                    <dd className="text-ink-soft">Your name, email, and message are emailed to me and saved in the database.</dd>
                  </div>
                  <div className={ROW}>
                    <dt className="font-semibold">Errors</dt>
                    <dd className="text-ink-soft">When something on the page breaks — a section fails to render, or a chat message doesn't go through — the failure is recorded so I can fix it. That means which section or which step failed, an error type, and how long the request took. No message content, and nothing about you.</dd>
                  </div>
                </dl>
              </div>
            </PolicySection>

            <PolicySection title="Why">
              <div className="flex flex-col gap-4">
                <Lead>
                  This is a personal portfolio. The data exists so I can see who's reaching out, follow up on legitimate inquiries, and understand which work resonates. Nothing is sold, shared with third parties for advertising, or used to build a profile beyond this site.
                </Lead>
              </div>
            </PolicySection>

            <PolicySection title="Opting out">
              <div className="flex flex-col gap-4">
                <Lead>
                  If your browser sends Global Privacy Control or Do Not Track, no page views, visit durations, scroll depths, outbound link clicks, list filters, campaign tags, or chat interface actions are recorded — the tracking code exits before it sends anything. Neither signal is legally binding in the US; this site honors them anyway. Clearing your browser's localStorage for this site discards your visitor ID, after which you're indistinguishable from a new visitor.
                </Lead>
              </div>
            </PolicySection>

            <PolicySection title="Retention">
              <div className="flex flex-col gap-4">
                <Lead>
                  Page views and visit records (time on page, scroll depth, window size, and campaign tags) are deleted automatically six months after the visit. Your visitor record, chat transcripts, contact submissions, and the interactions listed above are kept until you ask me to remove them.
                </Lead>
                <Lead>
                  To have everything about you deleted, email <TextLink href="mailto:ericjshell@gmail.com?subject=Privacy%20request">ericjshell@gmail.com</TextLink> with the visitor ID shown below, or the email address you used to contact me. I'll delete the record promptly.
                </Lead>
                <VisitorIdNotice />
              </div>
            </PolicySection>

            <PolicySection title="Cookies">
              <div className="flex flex-col gap-4">
                <Lead>
                  This site sets no cookies. It uses localStorage to remember your visitor ID and chat history on the home page, and clearing site data in your browser removes all of it.
                </Lead>
              </div>
            </PolicySection>

        </Container>
      </Sheet>
    </Page>
  )
}

/**
 * This browser's visitor ID, so a reader can quote it in a deletion request.
 *
 * The Retention copy has promised "the visitor ID shown below" for as long as
 * it has existed, and nothing was ever shown.
 *
 * Read after hydration, not during render: the page is prerendered at build
 * time, where there is no localStorage, and the build's HTML and the browser's
 * first render have to match. And read with `peekVisitorId`, which never
 * creates one — see there.
 */
function VisitorIdNotice() {
  const hydrated = useHydrated()
  const id = hydrated ? peekVisitorId() : null
  return (
    <div className="rounded-2xl bg-ice px-5 py-4 font-sans text-sm leading-relaxed">
      <Label as="p" className="text-lum-deep">Your visitor ID</Label>
      {/* `min-h` reserves the line before hydration, so the box does not grow
          when the ID arrives. */}
      <p className="min-h-6 pt-1 text-ink">
        {!hydrated ? null : id ? (
          <code className="font-mono text-[0.95em] break-all select-all">{id}</code>
        ) : (
          'This browser has no visitor ID, so there is nothing tied to it to delete.'
        )}
      </p>
    </div>
  )
}
