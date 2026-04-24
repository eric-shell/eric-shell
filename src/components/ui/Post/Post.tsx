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
