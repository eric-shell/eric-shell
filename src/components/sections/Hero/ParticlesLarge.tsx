import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { DEBUG_PARTICLES } from '../../../debug'

const COUNT = 7

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

export default function ParticlesLarge() {
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
    const baseColor = DEBUG_PARTICLES
      ? new THREE.Color(1.0, 0.45, 0.0)
      : new THREE.Color(1.0, 0.97, 0.88)

    const px   = new Float32Array(COUNT)
    const py   = new Float32Array(COUNT)
    const velY = new Float32Array(COUNT)
    const velX = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)
    const meshes: THREE.Mesh[] = []

    for (let i = 0; i < COUNT; i++) {
      px[i] = (Math.random() - 0.5) * W
      py[i] = (Math.random() - 0.5) * H

      sizes[i] = baseSize * (0.7 + Math.random() * 0.8)
      velY[i]  = -(0.008 + Math.random() * 0.012)
      velX[i]  = (Math.random() - 0.5) * 0.006
      phase[i] = Math.random() * Math.PI * 2

      const opacity = DEBUG_PARTICLES
        ? 0.3 + Math.random() * 0.4
        : 0.018 + Math.random() * 0.2

      const mat = new THREE.MeshBasicMaterial({
        map:         sprite,
        color:       baseColor,
        transparent: true,
        opacity,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      })

      const mesh = new THREE.Mesh(planeGeo, mat)
      mesh.position.set(px[i], py[i], 0)
      mesh.scale.setScalar(sizes[i])
      scene.add(mesh)
      meshes.push(mesh)
    }

    let raf: number
    let t = 0

    function tick() {
      raf = requestAnimationFrame(tick)
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[25]"
    />
  )
}
