import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { canvasTexture, speckle, logoTexture, enableShadows } from './shared'

// Veyra Spin: a belt-driven turntable. The record turns at a real 33⅓ rpm.
// `explodeRef.current` 0 → 1: the tonearm swings back and lifts, the record and platter
// rise off the plinth to show the sub-platter, belt and motor.

const W = 2.2 // plinth width
const D = 1.6 // plinth depth
const PH = 0.22 // plinth height
const TOP = PH / 2 // plinth top (plinth centred at y = 0)
const CENTER = [-0.28, 0] // platter centre (x, z)
const PIVOT = [0.74, -0.46] // tonearm pivot (x, z)
const MOTOR = [-0.98, 0.56] // motor pulley (x, z), front-left corner
const RPM = (33.333 / 60) * Math.PI * 2 // radians per second
const ARM_PLAY = -0.66 // arm angle with the stylus on the record
const lerp = THREE.MathUtils.lerp
const ease = (t) => t * t * (3 - 2 * t)

// The drive belt hugs the sub-platter and the motor pulley: trace the outline around both
function beltCurve() {
  const pts = []
  const circles = [[CENTER[0], CENTER[1], 0.3], [MOTOR[0], MOTOR[1], 0.045]]
  circles.forEach(([cx, cz, r]) => {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r])
    }
  })
  // Convex hull (monotone chain) gives the tight loop a belt makes
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  const upper = []
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1))
  return new THREE.CatmullRomCurve3(hull.map(([x, z]) => new THREE.Vector3(x, TOP + 0.03, z)), true, 'centripetal')
}

export default function Spin({ color, accent = '#c9a456', explodeRef, anchors }) {
  const root = useRef()
  const platter = useRef()
  const record = useRef()
  const spinner = useRef() // everything that turns
  const arm = useRef()
  const armLift = useRef()
  const platterPin = useRef() // label anchors that lift with the parts but don't spin
  const recordPin = useRef()
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])
  const accentColor = useMemo(() => new THREE.Color(accent), [accent])
  const belt = useMemo(() => beltCurve(), [])

  const m = useMemo(() => {
    const satin = canvasTexture(256, (g, s) => speckle(g, s, 8000, 0.4, 1), { repeat: 4 })
    // Vinyl grooves: fine concentric rings, with a gap between tracks
    const grooves = canvasTexture(1024, (g, s) => {
      const c = s / 2
      g.fillStyle = '#0b0b0c'
      g.fillRect(0, 0, s, s)
      for (let r = c * 0.36; r < c * 0.985; r += 1.6) {
        const track = Math.floor((r / c - 0.36) / 0.13)
        const gap = ((r / c - 0.36) % 0.13) < 0.006
        g.strokeStyle = gap ? '#050505' : (Math.round(r) % 2 ? '#1b1b1d' : '#0f0f10')
        g.lineWidth = gap ? 2.2 : 1
        g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke()
        void track
      }
    }, { srgb: true })
    const label = canvasTexture(512, (g, s) => {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, s, s)
      g.fillStyle = 'rgba(0,0,0,0.75)'
      g.textAlign = 'center'
      g.font = "700 64px 'Archivo Variable', system-ui, sans-serif"
      g.fillText('veyra', s / 2, s * 0.36)
      g.font = "500 30px 'Archivo Variable', system-ui, sans-serif"
      g.fillText('SIDE A · 33⅓', s / 2, s * 0.7)
      g.beginPath(); g.arc(s / 2, s / 2, s * 0.03, 0, Math.PI * 2); g.fill()
    }, { srgb: true })
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color, roughness: 0.42, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.22, bumpMap: satin, bumpScale: 0.25,
      }),
      alu: new THREE.MeshPhysicalMaterial({ color: '#cfcdc8', metalness: 1, roughness: 0.24, anisotropy: 0.9, bumpMap: satin, bumpScale: 0.15 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1a1a1d', roughness: 0.6, metalness: 0.4 }),
      vinyl: new THREE.MeshPhysicalMaterial({ map: grooves, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
      label: new THREE.MeshStandardMaterial({ map: label, color: accent, roughness: 0.7 }),
      carbon: new THREE.MeshPhysicalMaterial({ color: '#1c1c1f', roughness: 0.3, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#cfae6a', metalness: 1, roughness: 0.25 }),
      belt: new THREE.MeshStandardMaterial({ color: '#0d0d0f', roughness: 0.9 }),
      foot: new THREE.MeshStandardMaterial({ color: '#111113', roughness: 0.9 }),
      led: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(accent), emissiveIntensity: 2.5, toneMapped: false }),
      logo: new THREE.MeshStandardMaterial({
        map: logoTexture(), transparent: true, opacity: 0.55, metalness: 0.6, roughness: 0.3, depthWrite: false,
      }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => enableShadows(root.current, [m.logo, m.led]), [m])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 4)
    m.shell.color.lerp(target, k)
    m.label.color.lerp(accentColor, k)
    m.led.emissive.lerp(accentColor, k)

    const e = ease(explodeRef.current)
    spinner.current.rotation.y -= RPM * dt * (1 - e * 0.6) // keeps turning, slower when apart
    platter.current.position.y = e * 0.4
    record.current.position.y = e * 0.88
    arm.current.rotation.y = lerp(ARM_PLAY, 0.12, e)
    armLift.current.position.y = e * 0.32
    platterPin.current.position.y = TOP + 0.075 + e * 0.4
    recordPin.current.position.y = TOP + 0.12 + e * 0.88
  })

  return (
    <group ref={root} position={[0, -0.1, 0]}>
      {/* Plinth with soft edges, feet, speed knob and status light */}
      <RoundedBox args={[W, PH, D]} radius={0.06} smoothness={6} material={m.shell} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.2), -PH / 2 - 0.05, sz * (D / 2 - 0.2)]} material={m.foot}>
          <cylinderGeometry args={[0.11, 0.13, 0.1, 32]} />
        </mesh>
      ))}
      <mesh position={[0.8, TOP + 0.025, 0.52]} material={m.alu}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 48]} />
      </mesh>
      <mesh position={[0.8, TOP + 0.052, 0.52]} material={m.dark}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 24]} />
      </mesh>
      <mesh position={[0.62, TOP + 0.006, 0.52]} material={m.led}>
        <sphereGeometry args={[0.014, 16, 16]} />
      </mesh>
      <mesh position={[-0.75, -0.005, D / 2 + 0.001]} material={m.logo}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>

      {/* Motor, pulley and belt (seen once the platter lifts) */}
      <mesh position={[MOTOR[0], TOP + 0.03, MOTOR[1]]} material={m.dark}>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 32]} />
      </mesh>
      <mesh position={[MOTOR[0], TOP + 0.07, MOTOR[1]]} material={m.alu}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 32]} />
      </mesh>
      <mesh>
        <tubeGeometry args={[belt, 160, 0.006, 8, true]} />
        <primitive object={m.belt} attach="material" />
      </mesh>
      <group ref={anchor('motor')} position={[MOTOR[0], TOP + 0.1, MOTOR[1]]} />

      {/* Everything that turns: sub-platter, platter and record */}
      <group ref={spinner} position={[CENTER[0], 0, CENTER[1]]}>
        <mesh position={[0, TOP + 0.03, 0]} material={m.dark}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 64]} />
        </mesh>
        <mesh position={[0, TOP + 0.08, 0]} material={m.alu}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 16]} />
        </mesh>
        <group ref={platter}>
          <mesh position={[0, TOP + 0.075, 0]} material={m.alu}>
            <cylinderGeometry args={[0.78, 0.78, 0.07, 128]} />
          </mesh>
        </group>
        <group ref={record}>
          <mesh position={[0, TOP + 0.117, 0]} material={m.vinyl}>
            <cylinderGeometry args={[0.74, 0.74, 0.012, 128]} />
          </mesh>
          <mesh position={[0, TOP + 0.1235, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.label}>
            <circleGeometry args={[0.26, 64]} />
          </mesh>
          <mesh position={[0, TOP + 0.14, 0]} material={m.alu}>
            <cylinderGeometry args={[0.012, 0.012, 0.04, 16]} />
          </mesh>
        </group>
      </group>

      <group ref={(o) => { platterPin.current = o; anchor('platter')(o) }} position={[CENTER[0] - 0.78, TOP + 0.075, CENTER[1] + 0.05]} />
      <group ref={(o) => { recordPin.current = o; anchor('record')(o) }} position={[CENTER[0] - 0.1, TOP + 0.12, CENTER[1] + 0.6]} />

      {/* Tonearm: base, then a lifting group, then the swinging arm */}
      <mesh position={[PIVOT[0], TOP + 0.05, PIVOT[1]]} material={m.alu}>
        <cylinderGeometry args={[0.09, 0.1, 0.1, 48]} />
      </mesh>
      <group ref={armLift}>
        <group ref={arm} position={[PIVOT[0], TOP + 0.17, PIVOT[1]]}>
          <mesh material={m.alu}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 32]} />
          </mesh>
          <group rotation={[0.035, 0, 0]}>
            <mesh position={[0, 0, 0.46]} rotation={[Math.PI / 2, 0, 0]} material={m.carbon}>
              <cylinderGeometry args={[0.013, 0.016, 0.96, 24]} />
            </mesh>
            <mesh position={[0, 0, -0.17]} rotation={[Math.PI / 2, 0, 0]} material={m.alu}>
              <cylinderGeometry args={[0.055, 0.055, 0.11, 40]} />
            </mesh>
            {/* Headshell and cartridge */}
            <mesh position={[0, -0.01, 0.97]} rotation={[0, 0.3, 0]} material={m.alu}>
              <boxGeometry args={[0.08, 0.016, 0.13]} />
            </mesh>
            <mesh position={[0, -0.04, 0.98]} rotation={[0, 0.3, 0]} material={m.gold}>
              <boxGeometry args={[0.045, 0.04, 0.07]} />
            </mesh>
            <group ref={anchor('tonearm')} position={[0, 0, 0.5]} />
          </group>
        </group>
      </group>
    </group>
  )
}
