import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasTexture, speckle, logoTexture, superellipse, enableShadows } from './shared'

// Veyra Arc: a cylindrical speaker wrapped in knit fabric, with a glowing ring on top.
// `explodeRef.current` 0 → 1: the cap lifts and the fabric splits to show the drivers.

const R = 0.56 // body radius
const H = 1.5 // fabric height
const lerp = THREE.MathUtils.lerp
const ease = (t) => t * t * (3 - 2 * t)

function Driver({ radius, m }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.frame}>
        <cylinderGeometry args={[radius * 1.12, radius * 1.12, 0.04, 64]} />
      </mesh>
      {/* Rubber surround and cone */}
      <mesh position={[0, 0, 0.025]} material={m.rubber}>
        <torusGeometry args={[radius * 0.98, radius * 0.07, 16, 96]} />
      </mesh>
      <mesh position={[0, 0, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={m.cone}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.3, 0.06, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} scale={[1, 1, 0.45]} material={m.dome}>
        <sphereGeometry args={[radius * 0.3, 48, 32]} />
      </mesh>
    </group>
  )
}

export default function Arc({ color, accent = '#ffffff', explodeRef, anchors }) {
  const root = useRef()
  const cap = useRef()
  const halves = useRef([])
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])

  const geo = useMemo(() => ({
    cap: superellipse(R + 0.012, 0.11, 3, 0, Math.PI / 2, 40),
    foot: superellipse(R + 0.012, 0.09, 3, -Math.PI / 2, 0, 40),
  }), [])

  const m = useMemo(() => {
    // Knit: rows of small interlocking loops
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
    }, { repeat: [10, 6], srgb: true })
    const knitBump = knit.clone()
    knitBump.colorSpace = THREE.NoColorSpace
    const satin = canvasTexture(256, (g, s) => speckle(g, s, 8000, 0.4, 1), { repeat: 3 })
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color, map: knit, bumpMap: knitBump, bumpScale: 2.2, roughness: 0.95, sheen: 0.6,
        sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.8, side: THREE.DoubleSide,
      }),
      cap: new THREE.MeshPhysicalMaterial({ color: '#c9c7c2', metalness: 1, roughness: 0.3, anisotropy: 0.8, bumpMap: satin, bumpScale: 0.2 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0d0d10', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
      ring: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(accent), emissiveIntensity: 2.4, toneMapped: false }),
      foot: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 }),
      core: new THREE.MeshStandardMaterial({ color: '#1c1c20', roughness: 0.7, metalness: 0.3 }),
      frame: new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.5, metalness: 0.6 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#0f0f11', roughness: 0.9 }),
      cone: new THREE.MeshStandardMaterial({ color: '#1a1a1d', roughness: 0.6, side: THREE.DoubleSide }),
      dome: new THREE.MeshPhysicalMaterial({ color: '#cfae6a', metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
      radiator: new THREE.MeshPhysicalMaterial({ color: '#bdbcb8', metalness: 1, roughness: 0.35, anisotropy: 0.6 }),
      strap: new THREE.MeshPhysicalMaterial({
        color: '#1b1a1d', roughness: 0.6, sheen: 0.8, sheenColor: new THREE.Color('#8a837b'), sheenRoughness: 0.5,
      }),
      port: new THREE.MeshStandardMaterial({ color: '#07070a', roughness: 0.8 }),
      logo: new THREE.MeshStandardMaterial({
        map: logoTexture(), transparent: true, opacity: 0.55, metalness: 0.6, roughness: 0.3, depthWrite: false,
      }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => enableShadows(root.current, [m.logo, m.ring]), [m])

  const accentColor = useMemo(() => new THREE.Color(accent), [accent])

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 4)
    m.shell.color.lerp(target, k)
    m.ring.emissive.lerp(accentColor, k)
    // The light ring breathes gently
    m.ring.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 1.6) * 0.6

    const e = ease(explodeRef.current)
    cap.current.position.y = H / 2 + e * 0.55
    halves.current.forEach((h, i) => {
      if (!h) return
      const s = i === 0 ? 1 : -1
      h.position.x = s * e * 0.75
      h.rotation.y = s * e * 0.35
    })
  })

  return (
    <group ref={root} position={[0, 0.05, 0]}>
      {/* Inner core with the drivers (hidden until the fabric opens) */}
      <mesh material={m.core}>
        <cylinderGeometry args={[0.46, 0.46, H * 0.98, 64]} />
      </mesh>
      <group position={[0, 0.3, 0.44]}>
        <Driver radius={0.2} m={m} />
        <group ref={anchor('drivers')} position={[0, 0.24, 0]} />
      </group>
      <group position={[0, -0.12, 0.44]}>
        <Driver radius={0.2} m={m} />
      </group>
      <group position={[0, -0.52, 0.44]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.radiator}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.012]} material={m.rubber}>
          <torusGeometry args={[0.215, 0.02, 12, 96]} />
        </mesh>
        <group ref={anchor('radiator')} position={[0, -0.22, 0.02]} />
      </group>

      {/* Knit fabric in two halves that part like curtains */}
      {[1, -1].map((s, i) => (
        <group key={s} ref={(el) => { halves.current[i] = el }}>
          <mesh material={m.shell}>
            <cylinderGeometry args={[R, R, H, 96, 1, true, s === 1 ? 0 : Math.PI, Math.PI]} />
          </mesh>
        </group>
      ))}

      {/* Rubber foot */}
      <mesh position={[0, -H / 2, 0]} material={m.foot}>
        <latheGeometry args={[geo.foot, 96]} />
      </mesh>
      <mesh position={[0, -H / 2 - 0.02, R - 0.02]} material={m.port}>
        <boxGeometry args={[0.13, 0.04, 0.04]} />
      </mesh>

      {/* Fabric carry strap on the side */}
      <mesh position={[R - 0.015, H / 2 - 0.3, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.85, 2.4]} material={m.strap}>
        <torusGeometry args={[0.14, 0.022, 16, 64, Math.PI]} />
      </mesh>

      {/* Top cap: brushed metal, a glass centre and the glowing ring */}
      <group ref={cap} position={[0, H / 2, 0]}>
        <mesh material={m.cap}>
          <latheGeometry args={[geo.cap, 96]} />
        </mesh>
        <mesh position={[0, 0.111, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.glass}>
          <circleGeometry args={[0.36, 96]} />
        </mesh>
        <mesh position={[0, 0.113, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.ring}>
          <torusGeometry args={[0.38, 0.012, 12, 128]} />
        </mesh>
        <mesh position={[0, 0.114, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.logo}>
          <planeGeometry args={[0.55, 0.55]} />
        </mesh>
        <group ref={anchor('ring')} position={[0, 0.14, 0.3]} />
      </group>
    </group>
  )
}
