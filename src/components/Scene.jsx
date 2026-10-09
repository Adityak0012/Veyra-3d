import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, Sparkles, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import Headphones from './Headphones'
import { INTRO, drag } from '../interaction'

const TAU = Math.PI * 2

// One pose per page section (same order as the [data-stage] sections in App).
// pos: x, y, z · rot: x, y, z · s: scale · e: explode amount (0 = assembled, 1 = apart)
const DESKTOP = [
  { pos: [0, 0.08, 0], rot: [0.14, -0.42, 0.04], s: 0.82, e: 0 },          // hero
  { pos: [1.3, 0, 0], rot: [0.1, 0.9, -0.08], s: 0.86, e: 0 },             // sound
  { pos: [1.4, -0.05, 0], rot: [0.28, -0.85, 0.05], s: 0.8, e: 0 },        // listen
  { pos: [0.45, -0.05, 0], rot: [0.16, -0.22, 0], s: 0.76, e: 1 },         // inside
  { pos: [-1.2, 0, 0], rot: [0.1, TAU - 0.4, 0], s: 0.92, e: 0 },          // finishes
  { pos: [1.35, 0, -0.4], rot: [0.3, TAU + 0.6, 0.08], s: 0.76, e: 0 },    // specs
  { pos: [1.5, -0.1, -0.6], rot: [0.2, TAU + 1.5, 0.1], s: 0.7, e: 0 },    // faq
  { pos: [0, 0.72, 0], rot: [0.12, TAU, 0], s: 0.42, e: 0 },               // reserve
]

const MOBILE = DESKTOP.map((p, i) => ({
  ...p,
  pos: [0, i === 0 ? 0.42 : 0.72, 0],
  s: p.e ? 0.36 : i === 0 ? 0.52 : 0.48,
}))

// Labels shown when the headphones come apart (pinned to anchors in Headphones.jsx)
const CALLOUTS = [
  { id: 'foam', text: 'Slow-rebound memory foam', dir: 'up' },
  { id: 'yoke', text: 'Machined aluminium yoke', dir: 'up' },
  { id: 'driver', text: '40 mm beryllium-coated driver', dir: 'down' },
]

const lerp = THREE.MathUtils.lerp
const smooth = (t) => t * t * (3 - 2 * t)

// How far between two sections the viewport is (e.g. 2.4 = 40% from section 2 to 3)
function stageProgress() {
  const els = document.querySelectorAll('[data-stage]')
  const mid = window.innerHeight / 2
  const centers = [...els].map((el) => {
    const r = el.getBoundingClientRect()
    return r.top + r.height / 2
  })
  if (!centers.length || mid <= centers[0]) return 0
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid <= centers[i + 1]) return i + smooth((mid - centers[i]) / (centers[i + 1] - centers[i]))
  }
  return centers.length - 1
}

// Rings of light that pulse outward from the headphones, like sound leaving the cups.
// They only show in the hero and fade out as you scroll on.
function SoundRings({ follow, hero, color, reduced }) {
  const group = useRef()
  const rings = useRef([])
  const target = useMemo(() => new THREE.Color(color), [color])
  const mats = useMemo(
    () => Array.from({ length: 4 }, () => new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame((state, dt) => {
    const g = follow.current
    if (!g || !group.current) return
    group.current.position.set(g.position.x, g.position.y - 0.32 * g.scale.x, g.position.z - 0.9)
    const time = reduced ? 0 : state.clock.elapsedTime
    rings.current.forEach((ring, i) => {
      const phase = (time * 0.28 + i / 4) % 1
      ring.scale.setScalar((0.75 + phase * 2.4) * g.scale.x)
      mats[i].opacity = Math.pow(1 - phase, 1.6) * Math.min(phase * 6, 1) * 0.55 * hero.current
      mats[i].color.lerp(target, 1 - Math.exp(-dt * 4))
    })
  })

  return (
    <group ref={group}>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => { rings.current[i] = el }} material={m}>
          <ringGeometry args={[0.985, 1, 160]} />
        </mesh>
      ))}
    </group>
  )
}

function Rig({ color, accent, reduced, labels }) {
  const group = useRef()
  const explode = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const projected = useRef(new THREE.Vector3())
  const anchors = useRef({})
  const glow = useRef(null)
  const hero = useRef(1) // 1 while the hero is in view, 0 once scrolled past

  useEffect(() => {
    const el = document.querySelector('.glow')
    if (el) glow.current = { el, gx: null, gy: null }
  }, [])
  const { size, camera } = useThree()
  const mobile = size.width < 820

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, dt) => {
    const poses = mobile ? MOBILE : DESKTOP
    const p = stageProgress()
    const i = Math.min(Math.floor(p), poses.length - 2)
    const t = p - i
    const a = poses[i]
    const b = poses[i + 1]
    const k = 1 - Math.exp(-dt * (reduced ? 20 : 4.5))
    const g = group.current
    const time = state.clock.elapsedTime
    const idle = reduced ? 0 : 1
    hero.current = 1 - THREE.MathUtils.clamp(p * 1.4, 0, 1)

    // Load-in: one full turn while rising, easing out over ~2.6 s
    const intro = reduced ? 0 : 1 - Math.pow(THREE.MathUtils.clamp((time - INTRO + 0.3) / 2.6, 0, 1), 3)

    g.position.x = lerp(g.position.x, lerp(a.pos[0], b.pos[0], t), k)
    g.position.y = lerp(g.position.y, lerp(a.pos[1], b.pos[1], t) + Math.sin(time * 1.1) * 0.035 * idle, k)
    g.position.z = lerp(g.position.z, lerp(a.pos[2], b.pos[2], t), k)
    g.rotation.x = lerp(g.rotation.x, lerp(a.rot[0], b.rot[0], t) + mouse.current.y * 0.1 * idle, k)
    // Drag-to-rotate: momentum after release, then ease back to the pose
    if (!drag.active) {
      drag.spin += drag.velocity * dt
      drag.velocity *= Math.exp(-dt * 3)
      drag.spin *= Math.exp(-dt * 0.9)
    }
    g.rotation.y = lerp(g.rotation.y, lerp(a.rot[1], b.rot[1], t) + mouse.current.x * 0.22 * idle - intro * TAU + drag.spin, drag.active ? 1 - Math.exp(-dt * 14) : k)
    g.rotation.z = lerp(g.rotation.z, lerp(a.rot[2], b.rot[2], t), k)
    g.scale.setScalar(lerp(g.scale.x, lerp(a.s, b.s, t), k))
    explode.current = lerp(explode.current, lerp(a.e, b.e, t), k)

    // Tell the page where the product is, so the backlight glow can follow it
    projected.current.copy(g.position).project(camera)
    const gx = Math.round(((projected.current.x + 1) / 2) * 1000) / 10
    const gy = Math.round(((1 - projected.current.y) / 2) * 1000) / 10
    if (glow.current && (gx !== glow.current.gx || gy !== glow.current.gy)) {
      glow.current.gx = gx
      glow.current.gy = gy
      glow.current.el.style.setProperty('--gx', `${gx}%`)
      glow.current.el.style.setProperty('--gy', `${gy}%`)
    }

    // Pin each label to its point on the model, fading in as the parts separate
    const show = mobile ? 0 : THREE.MathUtils.clamp((explode.current - 0.6) / 0.35, 0, 1)
    for (const { id } of CALLOUTS) {
      const el = labels.current[id]
      const obj = anchors.current[id]
      if (!el || !obj) continue
      obj.getWorldPosition(projected.current).project(camera)
      const x = ((projected.current.x + 1) / 2) * size.width
      const y = ((1 - projected.current.y) / 2) * size.height
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      el.style.opacity = show
      el.style.setProperty('--draw', show)
    }
  })

  return (
    <>
      {/* Starts low and small so it rises into place on load */}
      <group ref={group} position={[0, -2.2, 0]} scale={0.5} rotation={[0.6, -TAU - 0.4, 0]}>
        <Headphones color={color} explodeRef={explode} anchors={anchors} />
      </group>
      <SoundRings follow={group} hero={hero} color={accent} reduced={reduced} />
    </>
  )
}

export default function Scene({ color, accent, reduced }) {
  const labels = useRef({})
  // Drops render resolution if the device can't keep a smooth frame rate (e.g. integrated graphics)
  const [dpr, setDpr] = useState(1.5)
  return (
    <>
    <Canvas
      shadows="soft"
      className="scene"
      dpr={dpr}
      camera={{ position: [0, 0, 5], fov: 35 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />
      <ambientLight intensity={0.15} />
      {/* Key, warm fill and cool rim lights */}
      <spotLight
        position={[4, 5, 4]} angle={0.5} penumbra={1} intensity={60} decay={2}
        castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.025}
      />
      <directionalLight position={[-4, 1, 2]} intensity={0.6} color="#ffd9b8" />
      <directionalLight position={[0, 3, -5]} intensity={2.2} color="#bcd4ff" />
      <Rig color={color} accent={accent} reduced={reduced} labels={labels} />
      {/* Dust catching the light */}
      <Sparkles count={60} scale={[8, 5, 3]} position={[0, 0, -1]} size={2.4} speed={reduced ? 0 : 0.25} opacity={0.55} noise={0.8} color={accent} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={9} blur={2.8} far={3.5} resolution={256} />
      {/* Studio light panels, so reflections look photographed (no HDR download) */}
      <Environment resolution={256}>
        <Lightformer intensity={2.4} position={[0, 5, 1]} scale={[10, 1.2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.6} position={[-5, 1, 1]} scale={[1.2, 8, 1]} rotation-y={Math.PI / 2} />
        <Lightformer intensity={1.6} position={[5, 1, 1]} scale={[1.2, 8, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={2} position={[2, 2, 5]} scale={1.6} />
        <Lightformer intensity={0.6} color="#9fb8ff" position={[0, -1, -5]} scale={[8, 2, 1]} />
        {/* Thin strip lights: give the steel and the shell crisp, long highlights */}
        <Lightformer form="rect" intensity={4} position={[-2.5, 3, 3]} scale={[0.25, 5, 1]} rotation={[0, 0.5, 0.3]} />
        <Lightformer form="rect" intensity={3} position={[3, -0.5, 3]} scale={[4, 0.18, 1]} rotation={[0, -0.6, 0]} />
      </Environment>
    </Canvas>
    <div className="callouts" aria-hidden="true">
      {CALLOUTS.map((c) => (
        <div key={c.id} ref={(el) => { labels.current[c.id] = el }} className="callout-anchor" style={{ opacity: 0 }}>
          <div className={`callout callout--${c.dir}`}>
            <span className="callout-label">{c.text}</span>
            <span className="callout-line" />
            <span className="callout-dot" />
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
