import { ArrowUpRight, Camera } from 'lucide-react'
import type { InstagramPost } from '../../data/instagram'
import { instagramPosts } from '../../data/instagram'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H2 } from '../ui'

function PostCard({ post }: { post: InstagramPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View Instagram post: ${post.altText}`}
      className="group relative block aspect-square overflow-hidden rounded-xl border border-off-black/10 bg-white hover:border-off-black/30 hover:shadow-md transition"
    >
      <img
        src={post.imageUrl}
        alt={post.altText}
        className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-off-black/80 via-off-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"
        aria-hidden="true"
      >
        <div className="flex items-end justify-between gap-2">
          <p className="font-sans text-xs leading-snug text-white line-clamp-2">
            {post.caption}
          </p>
          <ArrowUpRight size={16} className="shrink-0 text-white/80" aria-hidden="true" />
        </div>
      </div>
    </a>
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
                size="md"
                className="shrink-0"
                leftIcon={<Camera size={15} aria-hidden="true" />}
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
                  <PostCard post={post} />
                </CascadeItem>
              ))}
            </CascadeGroup>
          </div>

        </div>
      </div>
    </section>
  )
}
