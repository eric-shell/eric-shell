import { ArrowUpRight } from 'lucide-react'
import type { InstagramPost } from '../../../data'

interface PostProps {
  post: InstagramPost
}

export default function Post({ post }: PostProps) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View Instagram post: ${post.altText}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-blue-950/10 bg-white hover:border-blue-950/30 hover:shadow-md transition"
    >
      {(() => {
        const lastDot = post.imageUrl.lastIndexOf('.')
        const base = post.imageUrl.slice(0, lastDot)
        const ext = post.imageUrl.slice(lastDot + 1)
        const sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 350px'
        return (
          <picture>
            <source
              type="image/avif"
              srcSet={`${base}-320.avif 320w, ${base}-640.avif 640w, ${base}-960.avif 960w`}
              sizes={sizes}
            />
            <source
              type="image/webp"
              srcSet={`${base}-320.webp 320w, ${base}-640.webp 640w, ${base}-960.webp 960w`}
              sizes={sizes}
            />
            <img
              src={`${base}-640.${ext}`}
              srcSet={`${base}-320.${ext} 320w, ${base}-640.${ext} 640w, ${base}-960.${ext} 960w`}
              sizes={sizes}
              alt={post.altText}
              className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </picture>
        )
      })()}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"
        aria-hidden="true"
      >
        <div className="flex items-end justify-between gap-2">
          <p className="font-sans text-xs leading-snug text-white line-clamp-2">
            {post.caption}
          </p>
          <ArrowUpRight size={16} strokeWidth={2.5} className="shrink-0 text-white/80" aria-hidden="true" />
        </div>
      </div>
    </a>
  )
}
