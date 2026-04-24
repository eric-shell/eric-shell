import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 220

export type ParticlesMode = 'fall-across' | 'fall-toward'

interface ParticlesSmallProps {
  mode?: ParticlesMode
}

function makeSprite(): THREE.Texture {
  const sz = 128
  const c = document.createElement('canvas')
  c.width = sz
  c.height = sz
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2)
  g.addColorStop(0,    'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.6,  'rgba(255,255,255,0.25)')
  g.addColorStop(1,    'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, sz, sz)
  return new THREE.CanvasTexture(c)
}

const VERT = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aAlpha;
  varying   vec3  vColor;
  varying   float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_PointSize = aSize;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform sampler2D uSprite;
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float alpha = texture2D(uSprite, gl_PointCoord).a;
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`

// Close/large = warm gold. Far/small = cool forest-white.
const PALETTE_ACROSS: [number, number, number][] = [
  [0.89, 0.93, 0.86], // far — cool green-white
  [1.00, 1.00, 0.93], // near-white
  [0.96, 0.93, 0.83], // warm white
  [0.98, 0.92, 0.73], // pale gold
  [0.97, 0.86, 0.57], // golden amber
  [0.96, 0.78, 0.46], // close — rich gold
]

// Dust-in-sky palette: cool daylight whites mixed with a few warm honey/gold motes.
const PALETTE_TOWARD: [number, number, number][] = [
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

    const W = canvas.offsetWidth  || window.innerWidth
    const H = canvas.offsetHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setSize(W, H, false)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100)
    camera.position.z = 10

    const scene = new THREE.Scene()

    const pos    = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes  = new Float32Array(COUNT)
    const alphas = new Float32Array(COUNT)
    const velY   = new Float32Array(COUNT)
    const velX   = new Float32Array(COUNT)
    const phase  = new Float32Array(COUNT)

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

    function rerollToward(i: number) {
      const angle = Math.random() * Math.PI * 2
      dirX[i]    = Math.cos(angle)
      dirY[i]    = Math.sin(angle)
      speed[i]   = 0.00025 + Math.random() * 0.0005
      maxSize[i] = 5 + Math.random() * 18
      phase[i]   = Math.random() * Math.PI * 2
      wobbleX[i] = 12 + Math.random() * 18
      wobbleY[i] = 8 + Math.random() * 14

      const ci = Math.floor(Math.random() * palette.length)
      const [r, g, b] = palette[ci]
      colors[i * 3]     = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    for (let i = 0; i < COUNT; i++) {
      const depth = Math.random()

      if (mode === 'fall-toward') {
        rerollToward(i)
        // Stagger life so particles don't all bloom at once.
        life[i] = Math.random()
      } else {
        pos[i * 3]     = (Math.random() - 0.5) * W * 1.4
        pos[i * 3 + 1] = (Math.random() - 0.5) * H * 1.4
        pos[i * 3 + 2] = 0

        sizes[i]  = 2 + Math.pow(depth, 1.8) * 72
        alphas[i] = 0.05 + depth * 0.25
        velY[i]   = -(0.04 + Math.random() * 0.10)
        velX[i]   = (Math.random() - 0.5) * 0.03
        phase[i]  = Math.random() * Math.PI * 2

        const ci = Math.round(depth * (palette.length - 1))
        const [r, g, b] = palette[ci]
        colors[i * 3]     = r
        colors[i * 3 + 1] = g
        colors[i * 3 + 2] = b
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos,    3))
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes,  1))
    geo.setAttribute('aAlpha',   new THREE.BufferAttribute(alphas, 1))

    const sprite = makeSprite()
    const mat = new THREE.ShaderMaterial({
      uniforms:       { uSprite: { value: sprite } },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false,
    })

    scene.add(new THREE.Points(geo, mat))

    let raf: number
    let t = 0

    function tickAcross() {
      t += 0.006

      for (let i = 0; i < COUNT; i++) {
        pos[i * 3 + 1] += velY[i]
        pos[i * 3]     += Math.sin(t + phase[i]) * 0.07 + velX[i]

        if (pos[i * 3 + 1] < -H / 2 - 50) {
          pos[i * 3 + 1] = H / 2 + 50
          pos[i * 3]     = (Math.random() - 0.5) * W * 1.3
        }
      }

      geo.attributes.position.needsUpdate = true
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

        pos[i * 3]     = dirX[i] * r + wx
        pos[i * 3 + 1] = dirY[i] * r - p * H * 0.006 + wy
        pos[i * 3 + 2] = 0

        sizes[i]  = 1.5 + p * maxSize[i]
        alphas[i] = Math.sin(p * Math.PI) * 0.22
      }

      geo.attributes.position.needsUpdate = true
      geo.attributes.aSize.needsUpdate    = true
      geo.attributes.aAlpha.needsUpdate   = true
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      if (mode === 'fall-toward') tickToward()
      else tickAcross()
      renderer.render(scene, camera)
    }

    tick()

    const onResize = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      renderer.setSize(w, h, false)
      camera.left   = -w / 2
      camera.right  =  w / 2
      camera.top    =  h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      sprite.dispose()
      mat.dispose()
      geo.dispose()
    }
  }, [mode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[7]"
    />
  )
}
