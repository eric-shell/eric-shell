import { instagramPosts } from '@/data'
import { Backdrop, Button, CascadeGroup, CascadeItem, Container, Post, SectionHeader } from '../../ui'

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

export default function Visuals() {
  return (
    <section id="visuals" className="relative bg-gradient-to-br from-white via-blue-50 to-blue-100 skew-section z-[150]">
      <Backdrop tone="light" flip />
      <Container className="unskew-inner">

        <CascadeGroup threshold={0.15}>
          <CascadeItem index={0}>
            <SectionHeader
              eyebrow="Creative Supplements"
              title="Visuals"
              eyebrowClassName="text-blue-900"
              titleClassName="text-blue-950"
              action={
                <Button
                  href="https://www.instagram.com/ericshell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="md"
                  className="shrink-0"
                  leftIcon={<InstagramIcon size={15} />}
                >
                  Follow on Instagram
                </Button>
              }
            />
          </CascadeItem>
        </CascadeGroup>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-16 items-start">

          <CascadeGroup
            className="flex flex-col gap-5 font-sans text-base leading-relaxed text-blue-900"
            threshold={0.1}
          >
            <CascadeItem index={0}>
              <p>
                Not many of my peers know that I have a formal education in Design from Lehigh University and a strong professional background in visual arts.  I moved across the country to be the Digital Media Director for AccuAir Suspension immediately after graduating where I expected to pursue this further but my career pulled me in a different direction.
              </p>
            </CascadeItem>
            <CascadeItem index={1}>
              <p>
                While my strongest skills opened the path to a fulfilling career, my creative pursuits perfectly aided as a complimentary skillset as a developer. My passion has always been on the visual side of digital media and I find it continues to help me find balance in the technical space and push in regions where my professional peers don't typically navigate.
              </p>
            </CascadeItem>
            <CascadeItem index={2}>
              <p>
                I still produce photo and video content to fulfill my creative ambutions and maintain technical expertise in that space.  Plus, I love documenting adventures and projects with the people who are important in my life.  Please check out some of my latest work and contact me if you have an idea for a shoot!
              </p>
            </CascadeItem>
          </CascadeGroup>

          <div className="lg:col-span-3">
            <CascadeGroup as="ul" className="grid grid-cols-2 sm:grid-cols-3 gap-3" threshold={0.05}>
              {instagramPosts.map((post, i) => (
                <CascadeItem as="li" key={post.id} index={i}>
                  <Post post={post} />
                </CascadeItem>
              ))}
            </CascadeGroup>
          </div>

        </div>
      </Container>
    </section>
  )
}
