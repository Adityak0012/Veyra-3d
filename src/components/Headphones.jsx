import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Over-ear headphones built entirely from code (no model file needed).
// `explodeRef.current` (0 → 1) pulls each ear cup apart to reveal the driver.

const SHELL_PROFILE = [
  [0, -0.14], [0.34, -0.14], [0.43, -0.12], [0.48, -0.06],
  [0.49, 0.04], [0.47, 0.1], [0.42, 0.12], [0, 0.12],
].map(([x, y]) => new THREE.Vector2(x, y))

// Small canvas textures for surface detail
function makeLogoTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.font = "600 64px 'Archivo Variable', system-ui, sans-serif"
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('veyra', 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function makePerforationTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#2a2a2e'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#0d0d0f'
  for (let y = 8; y < 256; y += 16) {
    for (let x = (y / 16) % 2 ? 16 : 8; x < 256; x += 16) {
      g.beginPath()
      g.arc(x, y, 3.2, 0, Math.PI * 2)
      g.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function EarCup({ side, m, explodeRef, anchor }) {
  const shell = useRef()
  const driver = useRef()
  const cushion = useRef()
  const s = side // +1 right, -1 left

  useFrame(() => {
    const e = explodeRef.current
    shell.current.position.x = s * e * 0.45
    driver.current.position.x = s * (-0.04 + e * 0.1)
    cushion.current.position.x = s * (-0.19 - e * 0.45)
  })

  return (
    <group position={[s * 1.0, -0.75, 0]}>
      {/* Outer shell, fork and slider move together */}
      <group ref={shell}>
        <mesh rotation={[0, 0, (s * Math.PI) / 2]} material={m.shell}>
          <latheGeometry args={[SHELL_PROFILE, 96]} />
        </mesh>
        <mesh position={[s * 0.142, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.metal}>
          <torusGeometry args={[0.36, 0.012, 12, 96]} />
        </mesh>
        <mesh position={[s * 0.1415, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]} material={m.logo}>
          <circleGeometry args={[0.3, 48]} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.metal}>
          <torusGeometry args={[0.56, 0.028, 20, 96, Math.PI]} />
        </mesh>
        {[-1, 1].map((z) => (
          <mesh key={z} position={[0, 0, z * 0.56]} material={m.metal}>
            <sphereGeometry args={[0.05, 32, 32]} />
          </mesh>
        ))}
        <mesh position={[s * 0.04, 0.68, 0]} material={m.metal}>
          <cylinderGeometry args={[0.03, 0.03, 0.26, 24]} />
        </mesh>
        {s === 1 && <group ref={anchor('yoke')} position={[0, 0.6, 0]} />}
      </group>

      {/* Driver: hidden inside until exploded */}
      <group ref={driver}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.driver}>
          <cylinderGeometry args={[0.3, 0.3, 0.025, 96]} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-s * 0.014, 0, 0]} material={m.metal}>
          <torusGeometry args={[0.22, 0.008, 8, 96]} />
        </mesh>
        <mesh position={[-s * 0.02, 0, 0]} scale={[0.4, 1, 1]} material={m.driver}>
          <sphereGeometry args={[0.1, 32, 32]} />
        </mesh>
        {s === 1 && <group ref={anchor('driver')} position={[0, -0.3, 0]} />}
      </group>

      {/* Memory-foam cushion + perforated fabric */}
      <group ref={cushion}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.cushion}>
          <torusGeometry args={[0.36, 0.1, 32, 96]} />
        </mesh>
        <mesh position={[s * 0.02, 0, 0]} rotation={[0, s * -Math.PI / 2, 0]} material={m.fabric}>
          <circleGeometry args={[0.3, 48]} />
        </mesh>
        {s === -1 && <group ref={anchor('foam')} position={[0, 0.47, 0]} />}
      </group>
    </group>
  )
}

// `anchors` collects empty points on the model that the page's labels are pinned to
export default function Headphones({ color, explodeRef, anchors }) {
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])

  const m = useMemo(() => {
    const perf = makePerforationTexture()
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color, roughness: 0.48, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.28,
      }),
      metal: new THREE.MeshPhysicalMaterial({
        color: '#d4d2cc', metalness: 1, roughness: 0.18, anisotropy: 0.7,
      }),
      cushion: new THREE.MeshPhysicalMaterial({
        color: '#18171a', roughness: 0.62, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#6b6560'),
      }),
      fabric: new THREE.MeshStandardMaterial({ map: perf, roughness: 1, side: THREE.DoubleSide }),
      driver: new THREE.MeshStandardMaterial({ color: '#cfae6a', metalness: 1, roughness: 0.26 }),
      logo: new THREE.MeshStandardMaterial({
        map: makeLogoTexture(), transparent: true, opacity: 0.55, metalness: 0.6, roughness: 0.3, depthWrite: false,
      }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Blend smoothly to the selected finish
  useFrame((_, dt) => {
    m.shell.color.lerp(target, 1 - Math.exp(-dt * 4))
  })

  return (
    <group position={[0, 0.05, 0]}>
      <mesh material={m.shell}>
        <torusGeometry args={[1.05, 0.075, 32, 128, Math.PI]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI * 0.22]} material={m.cushion}>
        <torusGeometry args={[0.96, 0.055, 24, 96, Math.PI * 0.56]} />
      </mesh>
      <EarCup side={1} m={m} explodeRef={explodeRef} anchor={anchor} />
      <EarCup side={-1} m={m} explodeRef={explodeRef} anchor={anchor} />
    </group>
  )
}
