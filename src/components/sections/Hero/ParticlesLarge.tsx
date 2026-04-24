import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { ParticlesMode } from './ParticlesSmall'

const COUNT = 7

interface ParticlesLargeProps {
  mode?: ParticlesMode
  color?: THREE.ColorRepresentation
}

function makeSprite(): THREE.Texture {
  const sz = 256
  const c = document.createElement('canvas')
  c.width = sz
  c.height = sz
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2)
  g.addColorStop(0,    'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.6)')
  g.addColorStop(0.5,  'rgba(255,255,255,0.1)')
  g.addColorStop(1,    'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, sz, sz)
  return new THREE.CanvasTexture(c)
}

export default function ParticlesLarge({
  mode = 'fall-across',
  color,
}: ParticlesLargeProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return

    const W = canvas.offsetWidth  || window.innerWidth
    const H = canvas.offsetHeight || window.innerHeight
    const baseSize = W * 0.5

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setSize(W, H, false)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100)
    camera.position.z = 10

    const scene = new THREE.Scene()
    const sprite = makeSprite()
    const planeGeo = new THREE.PlaneGeometry(1, 1)
    const defaultWarm = new THREE.Color(1.0, 0.97, 0.88)
    // Soft daylight tint — cool leaning, with a hint of warmth for whimsy.
    const defaultCool = new THREE.Color(0.94, 0.95, 0.98)
    const baseColor = color
      ? new THREE.Color(color)
      : mode === 'fall-toward'
        ? defaultCool
        : defaultWarm

    const px   = new Float32Array(COUNT)
    const py   = new Float32Array(COUNT)
    const velY = new Float32Array(COUNT)
    const velX = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)

    // fall-toward state
    const dirX        = new Float32Array(COUNT)
    const dirY        = new Float32Array(COUNT)
    const life        = new Float32Array(COUNT)
    const speed       = new Float32Array(COUNT)
    const baseOpacity = new Float32Array(COUNT)
    const wobbleAmpX  = new Float32Array(COUNT)
    const wobbleAmpY  = new Float32Array(COUNT)
    const radiusMax   = Math.max(W, H) * 0.28

    // Subtle palette variation for fall-toward: most cool, a few warm motes.
    const TOWARD_TINTS: THREE.Color[] = [
      new THREE.Color(0.94, 0.95, 0.98),
      new THREE.Color(0.88, 0.93, 1.00),
      new THREE.Color(1.00, 0.98, 0.93),
      new THREE.Color(1.00, 0.93, 0.80),
      new THREE.Color(0.98, 0.87, 0.65),
    ]

    const meshes: THREE.Mesh[] = []

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

      if (meshes[i]) {
        const tint = TOWARD_TINTS[Math.floor(Math.random() * TOWARD_TINTS.length)]
        ;(meshes[i].material as THREE.MeshBasicMaterial).color.copy(tint)
      }
    }

    for (let i = 0; i < COUNT; i++) {
      if (mode === 'fall-toward') {
        rerollToward(i)
        life[i] = Math.random()
      } else {
        px[i] = (Math.random() - 0.5) * W
        py[i] = (Math.random() - 0.5) * H

        sizes[i] = baseSize * (0.7 + Math.random() * 0.8)
        velY[i]  = -(0.008 + Math.random() * 0.012)
        velX[i]  = (Math.random() - 0.5) * 0.006
        phase[i] = Math.random() * Math.PI * 2

        baseOpacity[i] = 0.018 + Math.random() * 0.2
      }

      const initialColor = mode === 'fall-toward' && !color
        ? TOWARD_TINTS[Math.floor(Math.random() * TOWARD_TINTS.length)]
        : baseColor

      const mat = new THREE.MeshBasicMaterial({
        map:         sprite,
        color:       initialColor,
        transparent: true,
        opacity:     mode === 'fall-toward' ? 0 : baseOpacity[i],
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      })

      const mesh = new THREE.Mesh(planeGeo, mat)
      if (mode === 'fall-across') {
        mesh.position.set(px[i], py[i], 0)
        mesh.scale.setScalar(sizes[i])
      }
      scene.add(mesh)
      meshes.push(mesh)
    }

    let raf: number
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

        meshes[i].position.set(px[i], py[i], 0)
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

        meshes[i].position.set(
          dirX[i] * r + wx,
          dirY[i] * r - p * H * 0.008 + wy,
          0,
        )
        meshes[i].scale.setScalar(sizes[i] * (0.2 + p * 0.55))
        ;(meshes[i].material as THREE.MeshBasicMaterial).opacity =
          Math.sin(p * Math.PI) * baseOpacity[i]
      }
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
      planeGeo.dispose()
      meshes.forEach(m => (m.material as THREE.MeshBasicMaterial).dispose())
    }
  }, [mode, color])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[25]"
    />
  )
}
