import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// Over-ear headphones built entirely from code (no model file needed).
// `explodeRef.current` (0 → 1) pulls each ear cup apart to reveal the driver.

const OVAL = [1, 1.14, 0.94] // ear cups are taller than they are wide, like real ones

/* ---------- Geometry helpers ---------- */

// Ear-cup shell profile (spun around its axis with a lathe)
const SHELL_PROFILE = [
  [0, -0.15], [0.3, -0.15], [0.4, -0.138], [0.455, -0.11], [0.484, -0.06],
  [0.492, 0.0], [0.488, 0.07], [0.47, 0.11], [0.43, 0.125], [0, 0.125],
].map(([x, y]) => new THREE.Vector2(x, y))

// Cushion cross-section: a soft, squarish "pillow" (superellipse) spun into a ring
function cushionProfile() {
  const pts = []
  const r0 = 0.335, a = 0.135, b = 0.1, n = 2.8
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2
    const c = Math.cos(t), s = Math.sin(t)
    const x = r0 + a * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = b * Math.sign(s) * Math.abs(s) ** (2 / n)
    pts.push(new THREE.Vector2(x, y))
  }
  return pts
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// The headband follows a natural arch rather than a perfect semicircle
const BAND = new THREE.CatmullRomCurve3(
  [
    [1.03, -0.06], [1.045, 0.25], [0.99, 0.62], [0.79, 0.95], [0.43, 1.15], [0, 1.215],
    [-0.43, 1.15], [-0.79, 0.95], [-0.99, 0.62], [-1.045, 0.25], [-1.03, -0.06],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  false, 'centripetal',
)

// Points along the inside of the band, for the leather pad and its stitching
function padPoints(inset, from = 0.2, to = 0.8, z = 0) {
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const t = from + ((to - from) * i) / 40
    const p = BAND.getPointAt(t)
    const tan = BAND.getTangentAt(t)
    const n = new THREE.Vector3(-tan.y, tan.x, 0)
    if (n.dot(new THREE.Vector3(-p.x, 0.25 - p.y, 0)) < 0) n.negate() // point inward
    pts.push(p.clone().addScaledVector(n, inset).setZ(z))
  }
  return pts
}

/* ---------- Procedural textures ---------- */

function canvasTexture(size, draw, { repeat = 1, srgb = false } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Fine random speckle: reads as bead-blasted aluminium or leather grain when used as a bump map
function noise(g, size, blobs, rMin, rMax) {
  g.fillStyle = '#808080'
  g.fillRect(0, 0, size, size)
  for (let i = 0; i < blobs; i++) {
    const v = Math.floor(90 + Math.random() * 80)
    g.fillStyle = `rgb(${v},${v},${v})`
    g.beginPath()
    g.arc(Math.random() * size, Math.random() * size, rMin + Math.random() * (rMax - rMin), 0, Math.PI * 2)
    g.fill()
  }
}

function makeTextures() {
  return {
    blast: canvasTexture(256, (g, s) => noise(g, s, 9000, 0.4, 1.1), { repeat: 3 }),
    leather: canvasTexture(256, (g, s) => {
      noise(g, s, 6000, 0.6, 1.8)
      g.filter = 'blur(0.6px)'
      g.drawImage(g.canvas, 0, 0)
    }, { repeat: 4 }),
    perforation: canvasTexture(256, (g, s) => {
      g.fillStyle = '#29292d'
      g.fillRect(0, 0, s, s)
      g.fillStyle = '#0c0c0e'
      for (let y = 8; y < s; y += 16) {
        for (let x = (y / 16) % 2 ? 16 : 8; x < s; x += 16) {
          g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill()
        }
      }
    }, { repeat: 3, srgb: true }),
    logo: canvasTexture(512, (g) => {
      g.fillStyle = 'rgba(255,255,255,0.9)'
      g.font = "600 60px 'Archivo Variable', system-ui, sans-serif"
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('veyra', 256, 256)
    }, { srgb: true }),
  }
}

/* ---------- Parts ---------- */

function EarCup({ side, m, explodeRef, anchor }) {
  const shell = useRef()
  const driver = useRef()
  const cushion = useRef()
  const s = side // +1 right, -1 left
  const cushionGeo = useMemo(() => cushionProfile(), [])

  useFrame(() => {
    const e = explodeRef.current
    shell.current.position.x = s * e * 0.45
    driver.current.position.x = s * (-0.05 + e * 0.1)
    cushion.current.position.x = s * (-0.2 - e * 0.45)
  })

  return (
    <group position={[s * 1.0, -0.8, 0]}>
      {/* Shell, yoke and slider move together */}
      <group ref={shell}>
        <group scale={OVAL}>
          <mesh rotation={[0, 0, (s * Math.PI) / 2]} material={m.shell}>
            <latheGeometry args={[SHELL_PROFILE, 128]} />
          </mesh>
          {/* Chamfered steel ring and engraved logo on the outer face */}
          <mesh position={[s * 0.151, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.metal}>
            <torusGeometry args={[0.33, 0.011, 16, 128]} />
          </mesh>
          <mesh position={[s * 0.1505, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]} material={m.logo}>
            <circleGeometry args={[0.28, 64]} />
          </mesh>
          {/* Yoke: a flat steel arc that holds the cup at two pivots */}
          <mesh rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.55]} material={m.metal}>
            <torusGeometry args={[0.56, 0.03, 20, 128, Math.PI]} />
          </mesh>
          {[-1, 1].map((z) => (
            <mesh key={z} position={[0, 0, z * 0.56]} rotation={[0, 0, Math.PI / 2]} material={m.metal}>
              <cylinderGeometry args={[0.045, 0.045, 0.07, 32]} />
            </mesh>
          ))}
          {/* Controls on the right cup: power button, status light, USB-C, mic openings */}
          {s === 1 && (
            <>
              <mesh position={[0.02, -0.2, -0.455]} rotation={[Math.PI / 2, 0, 0]} material={m.metal}>
                <cylinderGeometry args={[0.028, 0.028, 0.03, 24]} />
              </mesh>
              <mesh position={[0.02, -0.3, -0.39]} material={m.led}>
                <sphereGeometry args={[0.01, 12, 12]} />
              </mesh>
              <mesh position={[0.02, -0.488, -0.05]} material={m.port}>
                <boxGeometry args={[0.03, 0.02, 0.09]} />
              </mesh>
            </>
          )}
          {[0.24, -0.24].map((z) => (
            <mesh key={z} position={[s * 0.05, 0.43, z]} rotation={[0, 0, Math.PI / 2]} material={m.port}>
              <cylinderGeometry args={[0.009, 0.009, 0.03, 12]} />
            </mesh>
          ))}
        </group>
        {/* Hinge block and steel slider rising into the headband */}
        <mesh position={[0, 0.66, 0]} material={m.metal}>
          <boxGeometry args={[0.06, 0.05, 0.11]} />
        </mesh>
        <mesh position={[s * 0.02, 0.73, 0]} material={m.metal}>
          <boxGeometry args={[0.035, 0.14, 0.07]} />
        </mesh>
        {s === 1 && <group ref={anchor('yoke')} position={[0, 0.66, 0]} />}
      </group>

      {/* Driver: hidden inside until exploded */}
      <group ref={driver}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.driverBase}>
          <cylinderGeometry args={[0.31, 0.31, 0.02, 96]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-s * 0.012, 0, 0]} material={m.driver}>
          <cylinderGeometry args={[0.24, 0.27, 0.012, 96]} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-s * 0.02, 0, 0]} material={m.metal}>
          <torusGeometry args={[0.2, 0.006, 8, 96]} />
        </mesh>
        <mesh position={[-s * 0.024, 0, 0]} scale={[0.35, 1, 1]} material={m.driver}>
          <sphereGeometry args={[0.1, 48, 48]} />
        </mesh>
        {s === 1 && <group ref={anchor('driver')} position={[0, -0.31, 0]} />}
      </group>

      {/* Memory-foam cushion in protein leather, with a perforated fabric face */}
      <group ref={cushion}>
        <group scale={OVAL}>
          <mesh rotation={[0, 0, (s * Math.PI) / 2]} material={m.cushion}>
            <latheGeometry args={[cushionGeo, 128]} />
          </mesh>
          <mesh position={[s * 0.06, 0, 0]} rotation={[0, s * -Math.PI / 2, 0]} material={m.fabric}>
            <circleGeometry args={[0.24, 64]} />
          </mesh>
        </group>
        {s === -1 && <group ref={anchor('foam')} position={[0, 0.54, 0]} />}
      </group>
    </group>
  )
}

function Headband({ m }) {
  const bandGeo = useMemo(
    () => new THREE.ExtrudeGeometry(roundedRect(0.22, 0.062, 0.028), { steps: 200, bevelEnabled: false, extrudePath: BAND }),
    [],
  )
  const padGeo = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(padPoints(0.06))
    return new THREE.ExtrudeGeometry(roundedRect(0.19, 0.065, 0.03), { steps: 120, bevelEnabled: false, extrudePath: path })
  }, [])
  // Stitching along both edges of the pad
  const stitches = useMemo(() => [-0.082, 0.082].map((z) => padPoints(0.063, 0.21, 0.79, z)), [])

  return (
    <group>
      <mesh geometry={bandGeo} material={m.shell} />
      <mesh geometry={padGeo} material={m.cushion} />
      {stitches.map((pts, i) => (
        <Line key={i} points={pts} color="#5a5650" lineWidth={1} dashed dashSize={0.018} gapSize={0.014} />
      ))}
    </group>
  )
}

// `anchors` collects empty points on the model that the page's labels are pinned to
export default function Headphones({ color, explodeRef, anchors }) {
  const root = useRef()
  const anchor = (id) => (obj) => { if (obj) anchors.current[id] = obj }
  const target = useMemo(() => new THREE.Color(color), [color])

  const m = useMemo(() => {
    const tx = makeTextures()
    return {
      // Bead-blasted, satin-finished aluminium shell
      shell: new THREE.MeshPhysicalMaterial({
        color, roughness: 0.5, metalness: 0.15, clearcoat: 0.35, clearcoatRoughness: 0.4,
        bumpMap: tx.blast, bumpScale: 0.6,
      }),
      // Brushed stainless steel
      metal: new THREE.MeshPhysicalMaterial({
        color: '#d2d1cd', metalness: 1, roughness: 0.26, anisotropy: 0.85, bumpMap: tx.blast, bumpScale: 0.2,
      }),
      // Protein leather with a soft sheen
      cushion: new THREE.MeshPhysicalMaterial({
        color: '#1b1a1d', roughness: 0.58, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#8a837b'),
        clearcoat: 0.12, clearcoatRoughness: 0.6, bumpMap: tx.leather, bumpScale: 0.45,
      }),
      fabric: new THREE.MeshStandardMaterial({ map: tx.perforation, roughness: 1, side: THREE.DoubleSide }),
      driver: new THREE.MeshPhysicalMaterial({ color: '#cfae6a', metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
      driverBase: new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.6, roughness: 0.5 }),
      port: new THREE.MeshStandardMaterial({ color: '#08080a', roughness: 0.8 }),
      led: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#7dffb0', emissiveIntensity: 3 }),
      logo: new THREE.MeshStandardMaterial({
        map: tx.logo, transparent: true, opacity: 0.5, metalness: 0.7, roughness: 0.3, depthWrite: false,
      }),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Every part casts and receives soft shadows, so the band shades the cups like a real product shot
  useEffect(() => {
    root.current.traverse((o) => {
      if (o.isMesh && o.material !== m.logo) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [m])

  // Blend smoothly to the selected finish
  useFrame((_, dt) => {
    m.shell.color.lerp(target, 1 - Math.exp(-dt * 4))
  })

  return (
    <group ref={root} position={[0, 0.05, 0]}>
      <Headband m={m} />
      <EarCup side={1} m={m} explodeRef={explodeRef} anchor={anchor} />
      <EarCup side={-1} m={m} explodeRef={explodeRef} anchor={anchor} />
    </group>
  )
}
