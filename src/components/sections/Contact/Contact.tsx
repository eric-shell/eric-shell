import { CascadeGroup, CascadeItem, ContactForm, Container, Section, SectionTitle, TextLink, descDelay } from '../../ui'

/**
 * A full Luminous Blue field with the white contact card. The photo, particles
 * and frosted form this replaced are gone: the hero is the page's one
 * photographic moment, and the blue carries the close.
 */
export default function Contact() {
  return (
    <Section id="contact" tone="lum" className="overflow-hidden">
      <Container className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
        <SectionTitle eyebrow="Say What's up" title="Get in Touch" eyebrowClassName="text-white">
          <div className="flex flex-col gap-5 pt-8 font-sans text-lg leading-relaxed max-w-lg">
            <CascadeItem delayMs={descDelay(0)}>
              <p>
                Have a project in mind, a role to fill, or just want to connect?
                Drop me a message and I'll get back to you.
              </p>
            </CascadeItem>
            <CascadeItem delayMs={descDelay(1)}>
              <p className="text-white/90 text-base">
                I read every message and usually reply within a day or two.
                A little context goes a long way!  The more you can share, the better I can respond.
              </p>
            </CascadeItem>
            <CascadeItem delayMs={descDelay(2)}>
              <p className="text-white/90 text-base">
                Prefer to skip the form? Here's my email:<br/><TextLink tone="field" href="mailto:ericjshell@gmail.com">ericjshell@gmail.com</TextLink>
              </p>
            </CascadeItem>
          </div>
        </SectionTitle>

        {/* Its own group (it sits in the other column), on the description's beat. */}
        <CascadeGroup threshold={0.15}>
          <CascadeItem delayMs={descDelay(2)}>
            <ContactForm className="shadow-float" />
          </CascadeItem>
        </CascadeGroup>
      </Container>
    </Section>
  )
}
