import * as THREE from 'three'

// Helpers for procedural textures, shared by the Buds and Arc models

export function canvasTexture(size, draw, { repeat = 1, srgb = false } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (Array.isArray(repeat)) t.repeat.set(repeat[0], repeat[1])
  else t.repeat.set(repeat, repeat)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Fine random speckle; as a bump map it reads as bead-blasted metal or soft-touch plastic
export function speckle(g, size, blobs, rMin, rMax) {
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

export function logoTexture(text = 'veyra') {
  return canvasTexture(512, (g) => {
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.font = "600 60px 'Archivo Variable', system-ui, sans-serif"
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 256, 256)
  }, { srgb: true })
}

// Superellipse quarter/half profiles: soft, squarish curves that look manufactured
export function superellipse(r, h, n, from, to, steps = 32) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps
    const c = Math.cos(t), s = Math.sin(t)
    pts.push(new THREE.Vector2(r * Math.abs(c) ** (2 / n), h * Math.sign(s) * Math.abs(s) ** (2 / n)))
  }
  return pts
}

// Turn on soft shadows for every mesh in a model
export function enableShadows(root, skip = []) {
  root.traverse((o) => {
    if (o.isMesh && !skip.includes(o.material)) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
}
