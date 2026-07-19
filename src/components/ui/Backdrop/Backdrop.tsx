import type { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type Tone = 'light' | 'dark' | 'photo'

interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** `light`/`dark` render drifting hue-shifting gradient blobs + grain; `photo` is grain only, for sections with photographic backgrounds. */
  tone?: Tone
  /** Mirror the blob layout horizontally so adjacent same-tone sections don't read as copies. */
  flip?: boolean
  className?: string
}

interface Blob {
  className: string
  background: string
}

// Positioned via top/left/right only — never translate classes, because the
// drift animations own the transform property and would discard them.
const BLOBS: Record<Exclude<Tone, 'photo'>, Blob[]> = {
  light: [
    {
      className: 'absolute -top-1/4 right-[-12%] w-[55%] animate-ambient-a',
      background: 'radial-gradient(circle at center, oklch(0.68 0.11 235 / 0.16) 0%, transparent 62%)',
    },
    {
      className: 'absolute top-1/4 left-[-14%] w-[48%] animate-ambient-b',
      background: 'radial-gradient(circle at center, oklch(0.78 0.10 200 / 0.14) 0%, transparent 62%)',
    },
    {
      className: 'absolute bottom-[-28%] left-[30%] w-[52%] animate-ambient-c',
      background: 'radial-gradient(circle at center, oklch(0.62 0.14 285 / 0.10) 0%, transparent 62%)',
    },
  ],
  dark: [
    {
      className: 'absolute top-[12%] right-[-18%] w-[70%] animate-ambient-a',
      background: 'radial-gradient(circle at center, oklch(0.55 0.17 280 / 0.30) 0%, transparent 62%)',
    },
    {
      className: 'absolute top-[-22%] left-[-16%] w-[55%] animate-ambient-b',
      background: 'radial-gradient(circle at center, oklch(0.60 0.15 300 / 0.20) 0%, transparent 62%)',
    },
    {
      className: 'absolute bottom-[-25%] left-[18%] w-[48%] animate-ambient-c',
      background: 'radial-gradient(circle at center, oklch(0.72 0.12 205 / 0.14) 0%, transparent 62%)',
    },
  ],
}

const GRAIN: Record<Tone, string> = {
  light: 'opacity-[0.06]',
  dark: 'opacity-[0.07]',
  photo: 'opacity-[0.08]',
}

export default function Backdrop({ tone = 'light', flip = false, className, ...props }: BackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={twMerge('pointer-events-none absolute inset-0 overflow-hidden', className)}
      {...props}
    >
      {tone !== 'photo' && (
        <div className={`absolute inset-0 animate-ambient-hue ${flip ? '-scale-x-100' : ''}`}>
          {BLOBS[tone].map((blob, i) => (
            <div
              key={i}
              className={`${blob.className} aspect-square rounded-full`}
              style={{ background: blob.background }}
            />
          ))}
        </div>
      )}
      <div className={`absolute inset-0 bg-noise mix-blend-overlay ${GRAIN[tone]}`} />
    </div>
  )
}
