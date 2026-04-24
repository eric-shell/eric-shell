import { instagramPosts } from '../../../data'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H2, Post } from '../../ui'

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

export default function Creative() {
  return (
    <section id="creative" className="bg-off-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">

        <CascadeGroup threshold={0.15}>
          <CascadeItem index={0}>
            <div className="flex items-start justify-between gap-4 pb-10">
              <div>
                <Eyebrow className="text-off-black mb-4 block">Life Outside the IDE</Eyebrow>
                <H2 className="text-off-black">Creative</H2>
              </div>
              <Button
                href="https://www.instagram.com/ericshell/"
                target="_blank"
                rel="noopener noreferrer"
                variant="dark"
                size="md"
                className="shrink-0"
                leftIcon={<InstagramIcon size={15} />}
              >
                Follow on Instagram
              </Button>
            </div>
          </CascadeItem>
        </CascadeGroup>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-16 items-start">

          <CascadeGroup
            className="flex flex-col gap-5 font-sans text-base leading-relaxed text-off-black/70"
            threshold={0.1}
          >
            <CascadeItem index={0}>
              <p>
                When I step away from the terminal, I pick up a camera. Photography
                is how I stay visually calibrated — studying light, composition, and
                the moments that don&apos;t wait for a second take.
              </p>
            </CascadeItem>
            <CascadeItem index={1}>
              <p>
                The same instincts that make a UI feel considered apply here: attention
                to negative space, the weight of contrast, and the difference between
                what is present and what is necessary.
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
      </div>
    </section>
  )
}
