import { useEffect, useRef } from 'react'
import { makeSprite, type ParticlesMode, type RGB } from './particleSprite'
import { visibleRafLoop } from './visibleRafLoop'

const COUNT = 7

interface ParticlesLargeProps {
  mode?: ParticlesMode
  color?: RGB
}

// Alpha ramp of the large soft glow sprite (offset, alpha).
const SPRITE_STOPS: [number, number][] = [
  [0, 1],
  [0.25, 0.6],
  [0.5, 0.1],
  [1, 0],
]

const DEFAULT_WARM: RGB = [1.0, 0.97, 0.88]
// Soft daylight tint — cool leaning, with a hint of warmth for whimsy.
const DEFAULT_COOL: RGB = [0.94, 0.95, 0.98]

// Subtle palette variation for fall-toward: most cool, a few warm motes.
const TOWARD_TINTS: RGB[] = [
  [0.94, 0.95, 0.98],
  [0.88, 0.93, 1.00],
  [1.00, 0.98, 0.93],
  [1.00, 0.93, 0.80],
  [0.98, 0.87, 0.65],
]

export default function ParticlesLarge({
  mode = 'fall-across',
  color,
}: ParticlesLargeProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(devicePixelRatio, 2)
    let W = canvas.offsetWidth  || window.innerWidth
    let H = canvas.offsetHeight || window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const baseSize = W * 0.5

    const baseColor: RGB = color ?? (mode === 'fall-toward' ? DEFAULT_COOL : DEFAULT_WARM)
    const useTints = mode === 'fall-toward' && !color
    const palette = useTints ? TOWARD_TINTS : [baseColor]
    const sprites = palette.map((rgb) => makeSprite(256, SPRITE_STOPS, rgb))

    const px      = new Float32Array(COUNT)
    const py      = new Float32Array(COUNT)
    const velY    = new Float32Array(COUNT)
    const velX    = new Float32Array(COUNT)
    const phase   = new Float32Array(COUNT)
    const sizes   = new Float32Array(COUNT)
    const scales  = new Float32Array(COUNT)
    const alphas  = new Float32Array(COUNT)
    const colorIx = new Uint8Array(COUNT)

    // fall-toward state
    const dirX        = new Float32Array(COUNT)
    const dirY        = new Float32Array(COUNT)
    const life        = new Float32Array(COUNT)
    const speed       = new Float32Array(COUNT)
    const baseOpacity = new Float32Array(COUNT)
    const wobbleAmpX  = new Float32Array(COUNT)
    const wobbleAmpY  = new Float32Array(COUNT)
    const radiusMax   = Math.max(W, H) * 0.28

    function rerollToward(i: number) {
      const angle = Math.random() * Math.PI * 2
      dirX[i]        = Math.cos(angle)
      dirY[i]        = Math.sin(angle)
      speed[i]       = 0.00008 + Math.random() * 0.00022
      sizes[i]       = baseSize * (0.5 + Math.random() * 0.7)
      baseOpacity[i] = 0.012 + Math.random() * 0.06
      phase[i]       = Math.random() * Math.PI * 2
      wobbleAmpX[i]  = 25 + Math.random() * 35
      wobbleAmpY[i]  = 18 + Math.random() * 28
      colorIx[i]     = Math.floor(Math.random() * palette.length)
    }

    for (let i = 0; i < COUNT; i++) {
      if (mode === 'fall-toward') {
        rerollToward(i)
        life[i]   = Math.random()
        alphas[i] = 0
        scales[i] = 0
      } else {
        px[i] = (Math.random() - 0.5) * W
        py[i] = (Math.random() - 0.5) * H

        sizes[i]       = baseSize * (0.7 + Math.random() * 0.8)
        velY[i]        = -(0.008 + Math.random() * 0.012)
        velX[i]        = (Math.random() - 0.5) * 0.006
        phase[i]       = Math.random() * Math.PI * 2
        baseOpacity[i] = 0.018 + Math.random() * 0.2
        scales[i]      = sizes[i]
        alphas[i]      = baseOpacity[i]
        colorIx[i]     = 0
      }
    }

    let t = 0

    function tickAcross() {
      t += 0.003

      for (let i = 0; i < COUNT; i++) {
        py[i] += velY[i]
        px[i] += Math.sin(t + phase[i]) * 0.04 + velX[i]

        if (py[i] < -H / 2 - sizes[i]) {
          py[i] = H / 2 + sizes[i]
          px[i] = (Math.random() - 0.5) * W
        }
      }
    }

    function tickToward() {
      t += 0.0007

      for (let i = 0; i < COUNT; i++) {
        life[i] += speed[i]
        if (life[i] >= 1) {
          life[i] = 0
          rerollToward(i)
        }

        const p = life[i]
        const r = Math.pow(p, 1.5) * radiusMax
        const wx = Math.sin(t * 1.1 + phase[i]) * wobbleAmpX[i]
        const wy = Math.cos(t * 0.85 + phase[i] * 1.4) * wobbleAmpY[i]

        px[i] = dirX[i] * r + wx
        py[i] = dirY[i] * r - p * H * 0.008 + wy

        scales[i] = sizes[i] * (0.2 + p * 0.55)
        alphas[i] = Math.sin(p * Math.PI) * baseOpacity[i]
      }
    }

    function draw() {
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      // Matches the WebGL version's additive blending.
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < COUNT; i++) {
        const a = alphas[i]
        if (a <= 0) continue
        // Mesh scale is in world units (CSS px), so device size = scale * dpr.
        const s = scales[i] * dpr
        const cx = (W / 2 + px[i]) * dpr
        const cy = (H / 2 - py[i]) * dpr
        ctx.globalAlpha = a
        ctx.drawImage(sprites[colorIx[i]], cx - s / 2, cy - s / 2, s, s)
      }
      ctx.globalAlpha = 1
    }

    // Only runs while the canvas is actually on screen — see visibleRafLoop
    // for why pausing is safe for a fixed-step sim.
    const stopLoop = visibleRafLoop(canvas, () => {
      if (mode === 'fall-toward') tickToward()
      else tickAcross()
      draw()
    })

    const onResize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    window.addEventListener('resize', onResize)

    return () => {
      stopLoop()
      window.removeEventListener('resize', onResize)
    }
  }, [mode, color])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[25]"
    />
  )
}
