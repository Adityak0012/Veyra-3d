import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasTexture, superellipse, enableShadows } from './shared'

// Veyra Halo: a fabric-covered smart speaker with a glowing light ring on a glass top.
// `explodeRef.current` 0 → 1: the top of the fabric lifts and the bottom drops,
// showing three tweeters around the core and a woofer firing down.

const R = 0.85 // body radius
const H = 0.62 // half height
const N = 2.5 // superellipse exponent: a soft, plump puck
const SPLIT = 0.08 // where the fabric splits (as an angle)
const TOP_R = 0.5 // radius of the flat glass top
const ease = (t) => t * t * (3 - 2 * t)

// Height of the body surface at a given radius
const surfaceY = (r) => H * Math.pow(1 - Math.pow(r / R, N), 1 / N)
const TOP_Y = surfaceY(TOP_R)

function Tweeter({ angle, m }) {
  return (
    <group rotation={[0, angle, 0]}>
      <group position={[0, 0, 0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.frame}>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} scale={[1, 1, 0.5]} material={m.dome}>
          <sphereGeometry args={[0.07, 32, 24]} />
        </mesh>
      </group>
    </group>
  )
}

export default function Halo({ color, accent = '#e0552a', explodeRef, anchors }) {
  const root = useRef()
  const upper = useRef()
  const lower = useRef()
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])
  const accentColor = useMemo(() => new THREE.Color(accent), [accent])

  const geo = useMemo(() => {
    const lowerPts = superellipse(R, H, N, -Math.PI / 2, SPLIT, 48)
    // Upper part flattens into a disc where the glass top sits
    const upperPts = superellipse(R, H, N, SPLIT, Math.PI / 2, 48)
      .map((p) => (p.x < TOP_R ? new THREE.Vector2(p.x, TOP_Y) : p))
    return { lower: lowerPts, upper: upperPts }
  }, [])

  const m = useMemo(() => {
    const knit = canvasTexture(256, (g, s) => {
      g.fillStyle = '#d9d9d9'
      g.fillRect(0, 0, s, s)
      for (let y = 0; y < s; y += 8) {
        for (let x = (y / 8) % 2 ? 4 : 0; x < s; x += 8) {
          const grd = g.createRadialGradient(x + 4, y + 4, 0.5, x + 4, y + 4, 5)
          grd.addColorStop(0, '#f4f4f4')
          grd.addColorStop(1, '#9a9a9a')
          g.fillStyle = grd
          g.beginPath(); g.ellipse(x + 4, y + 4, 3.2, 4.2, 0, 0, Math.PI * 2); g.fill()
        }
      }
    }, { repeat: [14, 4], srgb: true })
    const knitBump = knit.clone()
    knitBump.colorSpace = THREE.NoColorSpace
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color, map: knit, bumpMap: knitBump, bumpScale: 2, roughness: 0.95, sheen: 0.6,
        sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.8, side: THREE.DoubleSide,
      }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0b0b0d', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, metalness: 0.2 }),
      ring: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: accentColor.clone(), emissiveIntensity: 2.4, toneMapped: false }),
      core: new THREE.MeshStandardMaterial({ color: '#1c1c20', roughness: 0.7, metalness: 0.3 }),
      frame: new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.5, metalness: 0.6 }),
      dome: new THREE.MeshPhysicalMaterial({ color: '#cfae6a', metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
      cone: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.6, side: THREE.DoubleSide }),
      rubber: new THREE.MeshStandardMaterial({ color: '#0f0f11', roughness: 0.9 }),
      mic: new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.8 }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => enableShadows(root.current, [m.ring]), [m])

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 4)
    m.shell.color.lerp(target, k)
    m.ring.emissive.lerp(accentColor, k)
    // The ring breathes, as if listening
    m.ring.emissiveIntensity = 1.9 + Math.sin(state.clock.elapsedTime * 2.1) * 0.7

    const e = ease(explodeRef.current)
    upper.current.position.y = e * 0.6
    lower.current.position.y = -e * 0.42
  })

  return (
    <group ref={root} position={[0, 0.02, 0]}>
      {/* Core with three tweeters around it and a woofer underneath */}
      <mesh position={[0, 0.08, 0]} material={m.core}>
        <cylinderGeometry args={[0.6, 0.6, 0.62, 64]} />
      </mesh>
      {[0, (2 * Math.PI) / 3, (-2 * Math.PI) / 3].map((a) => <Tweeter key={a} angle={a} m={m} />)}
      <group ref={anchor('tweeters')} position={[0, 0.12, 0.62]} />
      <group position={[0, -0.24, 0]}>
        <mesh material={m.frame}>
          <cylinderGeometry args={[0.5, 0.52, 0.04, 64]} />
        </mesh>
        <mesh position={[0, -0.06, 0]} material={m.cone}>
          <cylinderGeometry args={[0.18, 0.46, 0.1, 64, 1, true]} />
        </mesh>
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.rubber}>
          <torusGeometry args={[0.47, 0.025, 12, 96]} />
        </mesh>
        <group ref={anchor('woofer')} position={[0, -0.12, 0.45]} />
      </group>

      {/* Lower half of the fabric, with a rubber foot */}
      <group ref={lower}>
        <mesh material={m.shell}>
          <latheGeometry args={[geo.lower, 128]} />
        </mesh>
        <mesh position={[0, -H - 0.005, 0]} material={m.rubber}>
          <cylinderGeometry args={[0.42, 0.45, 0.03, 64]} />
        </mesh>
      </group>

      {/* Upper half: fabric, glass top, light ring and microphone holes */}
      <group ref={upper}>
        <mesh material={m.shell}>
          <latheGeometry args={[geo.upper, 128]} />
        </mesh>
        <mesh position={[0, TOP_Y + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.glass}>
          <circleGeometry args={[TOP_R, 96]} />
        </mesh>
        <mesh position={[0, TOP_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.ring}>
          <torusGeometry args={[TOP_R * 0.82, 0.014, 12, 128]} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.2, TOP_Y + 0.006, Math.sin(a) * 0.2]} rotation={[-Math.PI / 2, 0, 0]} material={m.mic}>
              <circleGeometry args={[0.012, 16]} />
            </mesh>
          )
        })}
        <group ref={anchor('ring')} position={[0, TOP_Y + 0.02, TOP_R * 0.82]} />
      </group>
    </group>
  )
}
