import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasTexture, speckle, logoTexture, superellipse, enableShadows } from './shared'

// Veyra Buds: a pebble-shaped charging case with two earbuds inside.
// `explodeRef.current`: 0 = closed case, ~0.5 = lid open and buds hovering, 1 = fully apart.

const CASE_SCALE = [1.3, 1, 0.8] // round lathe → oval pebble
const R = 0.62 // case radius before scaling
const BASE_H = 0.42
const LID_H = 0.25
const lerp = THREE.MathUtils.lerp
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOut = (t) => t * t * (3 - 2 * t)

// One earbud: a soft pebble body, a steel-ringed touch surface, a nozzle and a foam tip.
// Built facing +z (touch side) with the tip pointing back and slightly inward.
function Bud({ side, m, anchor }) {
  const s = side
  return (
    <group>
      {/* Bean-shaped body */}
      <mesh material={m.shell} scale={[1.12, 0.9, 0.78]}>
        <sphereGeometry args={[0.21, 64, 48]} />
      </mesh>
      {/* Touch panel: a brushed-metal cap set into the outer face */}
      <mesh position={[0, 0, 0.153]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1, 0.92]} material={m.touch}>
        <cylinderGeometry args={[0.112, 0.12, 0.035, 64]} />
      </mesh>
      {/* Mic opening on the top edge */}
      <mesh position={[s * 0.08, 0.17, 0.04]} material={m.port}>
        <sphereGeometry args={[0.011, 12, 12]} />
      </mesh>
      {/* Nozzle and foam tip, angled toward the ear canal */}
      <group rotation={[0.25, s * -0.45, 0]}>
        <mesh position={[0, 0, -0.17]} rotation={[Math.PI / 2, 0, 0]} material={m.shell}>
          <cylinderGeometry args={[0.07, 0.085, 0.14, 48]} />
        </mesh>
        <mesh position={[0, 0, -0.27]} scale={[1, 1, 0.8]} material={m.tip}>
          <sphereGeometry args={[0.1, 48, 32]} />
        </mesh>
        {s === -1 && <group ref={anchor('tip')} position={[0, 0.1, -0.27]} />}
      </group>
      {s === 1 && <group ref={anchor('driver')} position={[0, 0.2, 0]} />}
    </group>
  )
}

export default function Buds({ color, explodeRef, anchors }) {
  const root = useRef()
  const lid = useRef()
  const buds = useRef([])
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])

  const geo = useMemo(() => ({
    base: superellipse(R, BASE_H, 2.6, -Math.PI / 2, 0, 48),
    lid: superellipse(R, LID_H, 2.6, 0, Math.PI / 2, 48),
  }), [])

  const m = useMemo(() => {
    const satin = canvasTexture(256, (g, s) => speckle(g, s, 8000, 0.4, 1), { repeat: 3 })
    // Inside of the case: a dark tray with two moulded wells
    const tray = canvasTexture(512, (g, s) => {
      g.fillStyle = '#1c1a18'
      g.fillRect(0, 0, s, s)
      g.fillStyle = '#0c0b0a'
      ;[0.31, 0.69].forEach((x) => {
        g.beginPath(); g.ellipse(x * s, s / 2, s * 0.17, s * 0.22, 0, 0, Math.PI * 2); g.fill()
      })
      g.strokeStyle = '#2a2a2e'
      g.lineWidth = 3
      ;[0.31, 0.69].forEach((x) => {
        g.beginPath(); g.ellipse(x * s, s / 2, s * 0.17, s * 0.22, 0, 0, Math.PI * 2); g.stroke()
      })
    }, { srgb: true })
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color, roughness: 0.38, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18, bumpMap: satin, bumpScale: 0.3,
        side: THREE.DoubleSide, // the open lid shows its inside
      }),
      touch: new THREE.MeshPhysicalMaterial({ color: '#d8ccb0', metalness: 0.55, roughness: 0.38, anisotropy: 0.9, clearcoat: 0.5 }),
      metal: new THREE.MeshPhysicalMaterial({ color: '#d2d1cd', metalness: 1, roughness: 0.22, anisotropy: 0.7 }),
      tip: new THREE.MeshPhysicalMaterial({
        color: '#2c2b2f', roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color('#77716a'), sheenRoughness: 0.6,
      }),
      tray: new THREE.MeshStandardMaterial({ map: tray, roughness: 0.95, metalness: 0, envMapIntensity: 0.3, side: THREE.DoubleSide }),
      port: new THREE.MeshStandardMaterial({ color: '#07070a', roughness: 0.8 }),
      led: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#7dffb0', emissiveIntensity: 3 }),
      logo: new THREE.MeshStandardMaterial({
        map: logoTexture(), transparent: true, opacity: 0.5, metalness: 0.6, roughness: 0.3, depthWrite: false,
      }),
      hinge: new THREE.MeshPhysicalMaterial({ color: '#c9c8c4', metalness: 1, roughness: 0.3 }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => enableShadows(root.current, [m.logo]), [m])

  useFrame((_, dt) => {
    m.shell.color.lerp(target, 1 - Math.exp(-dt * 4))
    const e = explodeRef.current
    const open = easeInOut(clamp01(e / 0.45)) // lid opens over the first part
    const lift = easeInOut(clamp01((e - 0.2) / 0.45)) // then the buds rise
    const apart = easeInOut(clamp01((e - 0.55) / 0.45)) // then they spread for the exploded view

    lid.current.rotation.x = -open * 1.6

    buds.current.forEach((b, i) => {
      if (!b) return
      const s = i === 0 ? 1 : -1
      b.position.set(
        s * lerp(0.36, lerp(0.42, 0.78, apart), lift),
        lerp(-0.02, lerp(0.62, 0.78, apart), lift),
        lerp(0, 0.18, lift),
      )
      b.rotation.set(lerp(-Math.PI / 2, lerp(0.05, 0.2, apart), lift), s * lerp(0, lerp(-0.35, -0.7, apart), lift), 0)
    })
  })

  return (
    <group ref={root} position={[0, -0.35, 0]}>
      {/* Case base */}
      <group scale={CASE_SCALE}>
        <mesh material={m.shell}>
          <latheGeometry args={[geo.base, 128]} />
        </mesh>
        <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.tray}>
          <circleGeometry args={[R * 0.985, 96]} />
        </mesh>
      </group>
      {/* Front status light and USB-C port */}
      <mesh position={[0, -0.13, R * CASE_SCALE[2] * 0.97]} material={m.led}>
        <sphereGeometry args={[0.014, 16, 16]} />
      </mesh>
      <mesh position={[0, -BASE_H + 0.012, 0.0]} material={m.port}>
        <boxGeometry args={[0.16, 0.02, 0.06]} />
      </mesh>
      {/* Hinge along the back */}
      <mesh position={[0, 0, -R * CASE_SCALE[2] + 0.02]} rotation={[0, 0, Math.PI / 2]} material={m.hinge}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 24]} />
      </mesh>
      <group ref={anchor('case')} position={[0, -BASE_H, 0.3]} />

      {/* Lid pivots on the hinge at the back */}
      <group ref={lid} position={[0, 0, -R * CASE_SCALE[2]]}>
        <group position={[0, 0, R * CASE_SCALE[2]]} scale={CASE_SCALE}>
          <mesh material={m.shell}>
            <latheGeometry args={[geo.lid, 128]} />
          </mesh>
          <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.shell}>
            <circleGeometry args={[R * 0.985, 96]} />
          </mesh>
          <mesh position={[0, LID_H + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.logo}>
            <planeGeometry args={[0.6, 0.6]} />
          </mesh>
        </group>
      </group>

      {/* The buds */}
      {[1, -1].map((s, i) => (
        <group key={s} ref={(el) => { buds.current[i] = el }}>
          <Bud side={s} m={m} anchor={anchor} />
        </group>
      ))}
    </group>
  )
}
