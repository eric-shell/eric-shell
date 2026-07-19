export type ParticlesMode = 'fall-across' | 'fall-toward'

export type RGB = [number, number, number]

// One pre-tinted sprite per palette color replaces the WebGL per-vertex tint.
export function makeSprite(sz: number, stops: [number, number][], [r, g, b]: RGB): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = sz
  c.height = sz
  const ctx = c.getContext('2d')!
  const R = Math.round(r * 255)
  const G = Math.round(g * 255)
  const B = Math.round(b * 255)
  const grad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2)
  for (const [offset, a] of stops) grad.addColorStop(offset, `rgba(${R},${G},${B},${a})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, sz, sz)
  return c
}
