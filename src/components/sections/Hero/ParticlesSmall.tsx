import { useEffect, useRef } from 'react'
import { makeSprite, type ParticlesMode, type RGB } from './particleSprite'
import { visibleRafLoop } from './visibleRafLoop'

export type { ParticlesMode }

const COUNT = 220

interface ParticlesSmallProps {
  mode?: ParticlesMode
}

// Alpha ramp of the soft round sprite (offset, alpha).
const SPRITE_STOPS: [number, number][] = [
  [0, 1],
  [0.25, 0.85],
  [0.6, 0.25],
  [1, 0],
]

// Close/large = warm gold. Far/small = cool forest-white.
const PALETTE_ACROSS: RGB[] = [
  [0.89, 0.93, 0.86], // far — cool green-white
  [1.00, 1.00, 0.93], // near-white
  [0.96, 0.93, 0.83], // warm white
  [0.98, 0.92, 0.73], // pale gold
  [0.97, 0.86, 0.57], // golden amber
  [0.96, 0.78, 0.46], // close — rich gold
]

// Dust-in-sky palette: cool daylight whites mixed with a few warm honey/gold motes.
const PALETTE_TOWARD: RGB[] = [
  [0.93, 0.96, 1.00], // cool blue-white
  [1.00, 1.00, 1.00], // pure white
  [0.88, 0.93, 0.98], // pale sky
  [0.82, 0.90, 0.98], // soft sky
  [1.00, 0.98, 0.92], // cream
  [0.99, 0.92, 0.78], // soft honey
  [0.97, 0.85, 0.62], // pale gold
]

export default function ParticlesSmall({ mode = 'fall-across' }: ParticlesSmallProps = {}) {
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

    const px      = new Float32Array(COUNT)
    const py      = new Float32Array(COUNT)
    const colorIx = new Uint8Array(COUNT)
    const sizes   = new Float32Array(COUNT)
    const alphas  = new Float32Array(COUNT)
    const velY    = new Float32Array(COUNT)
    const velX    = new Float32Array(COUNT)
    const phase   = new Float32Array(COUNT)

    // fall-toward state (unused in fall-across)
    const dirX    = new Float32Array(COUNT)
    const dirY    = new Float32Array(COUNT)
    const life    = new Float32Array(COUNT)
    const speed   = new Float32Array(COUNT)
    const maxSize = new Float32Array(COUNT)
    const wobbleX = new Float32Array(COUNT)
    const wobbleY = new Float32Array(COUNT)
    const radiusMax = Math.max(W, H) * 0.35

    const palette = mode === 'fall-toward' ? PALETTE_TOWARD : PALETTE_ACROSS
    const sprites = palette.map((rgb) => makeSprite(128, SPRITE_STOPS, rgb))

    function rerollToward(i: number) {
      const angle = Math.random() * Math.PI * 2
      dirX[i]    = Math.cos(angle)
      dirY[i]    = Math.sin(angle)
      speed[i]   = 0.00025 + Math.random() * 0.0005
      maxSize[i] = 5 + Math.random() * 18
      phase[i]   = Math.random() * Math.PI * 2
      wobbleX[i] = 12 + Math.random() * 18
      wobbleY[i] = 8 + Math.random() * 14
      colorIx[i] = Math.floor(Math.random() * palette.length)
    }

    for (let i = 0; i < COUNT; i++) {
      const depth = Math.random()

      if (mode === 'fall-toward') {
        rerollToward(i)
        // Stagger life so particles don't all bloom at once.
        life[i] = Math.random()
      } else {
        px[i] = (Math.random() - 0.5) * W * 1.4
        py[i] = (Math.random() - 0.5) * H * 1.4

        sizes[i]   = 2 + Math.pow(depth, 1.8) * 72
        alphas[i]  = 0.05 + depth * 0.25
        velY[i]    = -(0.04 + Math.random() * 0.10)
        velX[i]    = (Math.random() - 0.5) * 0.03
        phase[i]   = Math.random() * Math.PI * 2
        colorIx[i] = Math.round(depth * (palette.length - 1))
      }
    }

    let t = 0

    function tickAcross() {
      t += 0.006

      for (let i = 0; i < COUNT; i++) {
        py[i] += velY[i]
        px[i] += Math.sin(t + phase[i]) * 0.07 + velX[i]

        if (py[i] < -H / 2 - 50) {
          py[i] = H / 2 + 50
          px[i] = (Math.random() - 0.5) * W * 1.3
        }
      }
    }

    function tickToward() {
      t += 0.0014

      for (let i = 0; i < COUNT; i++) {
        life[i] += speed[i]
        if (life[i] >= 1) {
          life[i] = 0
          rerollToward(i)
        }

        const p = life[i]
        const r = Math.pow(p, 1.4) * radiusMax
        const wx = Math.sin(t * 1.2 + phase[i]) * wobbleX[i]
        const wy = Math.cos(t * 0.8 + phase[i] * 1.7) * wobbleY[i]

        px[i] = dirX[i] * r + wx
        py[i] = dirY[i] * r - p * H * 0.006 + wy

        sizes[i]  = 1.5 + p * maxSize[i]
        alphas[i] = Math.sin(p * Math.PI) * 0.22
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
        // World coords are CSS px, origin center, +y up; point size is device px.
        const s = sizes[i]
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
  }, [mode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[7]"
    />
  )
}
