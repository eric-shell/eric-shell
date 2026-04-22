import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { DEBUG_PARTICLES } from '../../../debug'

const COUNT = 220

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
const PALETTE: [number, number, number][] = [
  [0.89, 0.93, 0.86], // far — cool green-white
  [1.00, 1.00, 0.93], // near-white
  [0.96, 0.93, 0.83], // warm white
  [0.98, 0.92, 0.73], // pale gold
  [0.97, 0.86, 0.57], // golden amber
  [0.96, 0.78, 0.46], // close — rich gold
]

export default function ParticlesSmall() {
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

    for (let i = 0; i < COUNT; i++) {
      const depth = Math.random()

      pos[i * 3]     = (Math.random() - 0.5) * W * 1.4
      pos[i * 3 + 1] = (Math.random() - 0.5) * H * 1.4
      pos[i * 3 + 2] = 0

      sizes[i]  = 2 + Math.pow(depth, 1.8) * 72
      alphas[i] = DEBUG_PARTICLES ? 0.6 + Math.random() * 0.4 : 0.05 + depth * 0.25
      velY[i]   = -(0.04 + Math.random() * 0.10)
      velX[i]   = (Math.random() - 0.5) * 0.03
      phase[i]  = Math.random() * Math.PI * 2

      const ci = Math.round(depth * (PALETTE.length - 1))
      const [r, g, b] = DEBUG_PARTICLES ? [1.0, 0.15, 0.15] : PALETTE[ci]
      colors[i * 3]     = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
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

    function tick() {
      raf = requestAnimationFrame(tick)
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[7]"
    />
  )
}
