import { ArrowLeft } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Container, Eyebrow, H1, H2 } from '../../ui'

export default function Privacy() {
  return (
    <main id="main" className="bg-white text-blue-950">
      <section className="relative bg-blue-950 text-white overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <Container>
          <CascadeGroup mountOnly className="flex flex-col gap-4">
            <CascadeItem index={0}>
              <Eyebrow size="lg" className="text-white">Privacy</Eyebrow>
            </CascadeItem>
            <CascadeItem index={1}>
              <H1 className="text-white">How this site handles your data</H1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-lg md:text-xl text-white max-w-2xl pt-1 pb-3 leading-relaxed">
                Plain-language summary of what eric.sh collects, why, and how to ask for it to be removed.
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              <Button
                href="/"
                variant="glass-light"
                leftIcon={<ArrowLeft size={14} />}
              >
                Back to home
              </Button>
            </CascadeItem>
          </CascadeGroup>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <CascadeGroup className="flex flex-col gap-12 max-w-3xl" threshold={0.1}>

            <CascadeItem index={0}>
              <div className="flex flex-col gap-4">
                <H2>What's collected</H2>
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  When you visit this site, a few categories of data are recorded:
                </p>
                <dl className="flex flex-col gap-4 font-sans text-base leading-relaxed">
                  <div>
                    <dt className="font-semibold">Anonymous visitor ID</dt>
                    <dd className="text-blue-950/80">A random UUID generated in your browser and stored in localStorage. It's not tied to your identity unless you submit the contact form.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Approximate location and device</dt>
                    <dd className="text-blue-950/80">Country, region, city, timezone, browser user-agent string, and the page that referred you here. The location fields are estimated from your IP at request time — they're often imprecise and can be wrong by hundreds of miles. Your IP address itself is not stored. Your browser's own language setting, reported timezone, and window and screen dimensions are also recorded.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Pages viewed and time spent</dt>
                    <dd className="text-blue-950/80">Which pages you open, when, and the page that referred you, grouped into a visit. Each visit also records how long this tab was actually in the foreground and how far down the page you scrolled. Nothing about what you type, hover, or click is captured, and this stops at the boundary of this site — there is no tracking of where you go next.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Chat transcripts</dt>
                    <dd className="text-blue-950/80">If you chat with the assistant on the home page, both your messages and the assistant's replies are saved so I can review the conversations.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Chat interface actions</dt>
                    <dd className="text-blue-950/80">A count of a few deliberate actions in the chat panel: turning high-contrast mode on or off, clearing a conversation, and starting voice input. Voice input is worth spelling out — dictation runs through your own browser's speech recognition, which on Chrome sends the audio to Google and on Safari to Apple, under their privacy policies rather than mine. No audio, and no transcript beyond the message you choose to send, ever reaches this site. All that's recorded here is that the microphone button was pressed.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Contact form submissions</dt>
                    <dd className="text-blue-950/80">Your name, email, and message are emailed to me and saved in the database.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Google Analytics</dt>
                    <dd className="text-blue-950/80">Aggregate page-view and session metrics via Google Analytics 4. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">Google's Privacy Policy</a>. You can block this with a privacy extension or browser setting at any time.</dd>
                  </div>
                </dl>
              </div>
            </CascadeItem>

            <CascadeItem index={1}>
              <div className="flex flex-col gap-4">
                <H2>Why</H2>
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  This is a personal portfolio. The data exists so I can see who's reaching out, follow up on legitimate inquiries, and understand which work resonates. Nothing is sold, shared with third parties for advertising, or used to build a profile beyond this site.
                </p>
              </div>
            </CascadeItem>

            <CascadeItem index={2}>
              <div className="flex flex-col gap-4">
                <H2>Opting out</H2>
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  If your browser sends Global Privacy Control or Do Not Track, no page views, visit durations, scroll depths, or chat interface actions are recorded — the tracking code exits before it sends anything. Neither signal is legally binding in the US; this site honors them anyway. Clearing your browser's localStorage for this site discards your visitor ID, after which you're indistinguishable from a new visitor.
                </p>
              </div>
            </CascadeItem>

            <CascadeItem index={3}>
              <div className="flex flex-col gap-4">
                <H2>Retention</H2>
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  Records are kept indefinitely by default. If you'd like your visitor record, chat transcripts, or contact submission removed, email <a href="mailto:ericjshell@gmail.com?subject=Privacy%20request" className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">ericjshell@gmail.com</a> with the visitor ID shown below (if you have it) or the email you used to contact me. I'll delete the record promptly.
                </p>
              </div>
            </CascadeItem>

            <CascadeItem index={4}>
              <div className="flex flex-col gap-4">
                <H2>Cookies</H2>
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  This site uses localStorage (not cookies) to remember your visitor ID and chat history on the home page. Google Analytics sets its own cookies; clearing site data in your browser removes all of it.
                </p>
              </div>
            </CascadeItem>

          </CascadeGroup>
        </Container>
      </section>
    </main>
  )
}
