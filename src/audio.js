// A small sound engine for the listening demos, built with the Web Audio API.
// Everything is generated in the browser: a busy street (traffic rumble, wind, horns)
// and a soft piece of music with a bass line.
// Three modes:
//   'anc'   – street + music; the toggle (noise cancelling) filters and lowers only the street
//   'bass'  – music only; the toggle (bass boost) lifts the low end with a shelf filter
//   'vinyl' – music only; the toggle (vinyl warmth) rounds off the highs and adds surface crackle
//   'room'  – music only; the toggle (room fill) adds the reflections of a living room

const STREET_DB = 72 // what the meter shows with cancelling off
const ANC_GAIN = 0.008 // street level with cancelling on (about −36 dB)

let ctx = null
let nodes = null
let hornTimer = null
let noteTimer = null
let bassTimer = null
let mode = 'anc'
const BASS_BOOST_DB = 10

function makeNoiseBuffer(c, seconds = 4) {
  const len = c.sampleRate * seconds
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let last = 0
    for (let i = 0; i < len; i++) {
      // Brown-ish noise: deep, like distant traffic
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      d[i] = last * 3.5
    }
  }
  return buf
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  master.connect(analyser).connect(ctx.destination)

  // --- Street ---
  const street = ctx.createGain()
  street.gain.value = 0.5
  const streetFilter = ctx.createBiquadFilter()
  streetFilter.type = 'lowpass'
  streetFilter.frequency.value = 1400
  street.connect(streetFilter).connect(master)

  const rumble = ctx.createBufferSource()
  rumble.buffer = makeNoiseBuffer(ctx)
  rumble.loop = true
  rumble.connect(street)

  const hiss = ctx.createBufferSource() // wind and tyre hiss
  hiss.buffer = makeNoiseBuffer(ctx, 3)
  hiss.loop = true
  const hissHP = ctx.createBiquadFilter()
  hissHP.type = 'highpass'
  hissHP.frequency.value = 900
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0.18
  hiss.connect(hissHP).connect(hissGain).connect(street)

  // Traffic swelling past
  const swell = ctx.createOscillator()
  swell.frequency.value = 0.13
  const swellDepth = ctx.createGain()
  swellDepth.gain.value = 0.18
  swell.connect(swellDepth).connect(street.gain)

  // --- Music: a slow chord pad and gentle plucks ---
  const music = ctx.createGain()
  music.gain.value = 0.32
  const shelf = ctx.createBiquadFilter() // bass boost
  shelf.type = 'lowshelf'
  shelf.frequency.value = 140
  shelf.gain.value = 0
  const warmth = ctx.createBiquadFilter() // vinyl: softer top end
  warmth.type = 'lowpass'
  warmth.frequency.value = 20000
  music.connect(warmth).connect(shelf).connect(master)

  // Room fill: a convolution reverb with a generated 2.4 s living-room response
  const room = ctx.createConvolver()
  const len = Math.floor(ctx.sampleRate * 2.4)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
  }
  room.buffer = ir
  const roomWet = ctx.createGain()
  roomWet.gain.value = 0
  shelf.connect(room).connect(roomWet).connect(master)

  // Vinyl surface noise: sparse clicks and a faint hiss, looped
  const crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
  const cd = crackleBuf.getChannelData(0)
  for (let i = 0; i < cd.length; i++) {
    cd[i] = (Math.random() * 2 - 1) * 0.015
    if (Math.random() < 0.0004) cd[i] = (Math.random() * 2 - 1) * 0.9
  }
  const crackle = ctx.createBufferSource()
  crackle.buffer = crackleBuf
  crackle.loop = true
  const crackleGain = ctx.createGain()
  crackleGain.gain.value = 0
  crackle.connect(crackleGain).connect(master)
  crackle.start()
  const padFilter = ctx.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 1100
  padFilter.connect(music)
  const pad = [220, 261.63, 329.63, 392].map((f, i) => {
    const o = ctx.createOscillator()
    o.type = i % 2 ? 'triangle' : 'sine'
    o.frequency.value = f
    o.detune.value = (i - 1.5) * 4
    const g = ctx.createGain()
    g.gain.value = 0.07
    o.connect(g).connect(padFilter)
    return o
  })

  const startAll = [rumble, hiss, swell, ...pad]
  startAll.forEach((s) => s.start())

  nodes = { master, analyser, street, streetFilter, music, swellDepth, shelf, warmth, crackleGain, roomWet }
  return nodes
}

function horn() {
  if (!ctx || !nodes) return
  const t = ctx.currentTime
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.06, t + 0.03)
  g.gain.setValueAtTime(0.06, t + 0.32)
  g.gain.linearRampToValueAtTime(0, t + 0.45)
  ;[392, 494].forEach((f) => {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f * (0.95 + Math.random() * 0.1)
    o.connect(g)
    o.start(t)
    o.stop(t + 0.5)
  })
  g.connect(nodes.street)
  hornTimer = setTimeout(horn, 3500 + Math.random() * 4000)
}

const SCALE = [440, 523.25, 587.33, 659.25, 783.99, 880]
function pluck() {
  if (!ctx || !nodes) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'triangle'
  o.frequency.value = SCALE[Math.floor(Math.random() * SCALE.length)]
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.09, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
  o.connect(g).connect(nodes.music)
  o.start(t)
  o.stop(t + 1.5)
  noteTimer = setTimeout(pluck, 380 + Math.floor(Math.random() * 3) * 190)
}

// A slow, round bass line under the music
const BASS = [55, 55, 65.41, 49]
let bassStep = 0
function bassNote() {
  if (!ctx || !nodes) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = BASS[bassStep++ % BASS.length]
  const o2 = ctx.createOscillator() // a little harmonic so it's audible on small speakers
  o2.type = 'triangle'
  o2.frequency.value = o.frequency.value * 2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.32, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  const g2 = ctx.createGain()
  g2.gain.value = 0.18
  o.connect(g)
  o2.connect(g2).connect(g)
  g.connect(nodes.music)
  o.start(t); o2.start(t)
  o.stop(t + 0.75); o2.stop(t + 0.75)
  bassTimer = setTimeout(bassNote, 760)
}

export async function play(on, playMode = 'anc') {
  if (!ctx) build()
  mode = playMode
  await ctx.resume()
  set(on, true)
  nodes.master.gain.cancelScheduledValues(ctx.currentTime)
  nodes.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.15)
  clearTimeout(hornTimer)
  clearTimeout(noteTimer)
  clearTimeout(bassTimer)
  if (mode === 'anc') hornTimer = setTimeout(horn, 1500)
  noteTimer = setTimeout(pluck, 400)
  bassTimer = setTimeout(bassNote, 200)
}

export function pause() {
  if (!ctx) return
  clearTimeout(hornTimer)
  clearTimeout(noteTimer)
  clearTimeout(bassTimer)
  nodes.master.gain.setTargetAtTime(0, ctx.currentTime, 0.1)
  setTimeout(() => ctx && ctx.state === 'running' && nodes.master.gain.value < 0.02 && ctx.suspend(), 600)
}

// Flip the demo's toggle for the current mode
export function set(on, instant = false) {
  if (!ctx) return
  const t = ctx.currentTime
  const tc = instant ? 0.01 : 0.25
  const ROOM_WET = 0.6
  nodes.roomWet.gain.setTargetAtTime(mode === 'room' && on ? ROOM_WET : 0, t, tc * 1.6)
  if (mode === 'bass' || mode === 'vinyl' || mode === 'room') {
    nodes.street.gain.cancelScheduledValues(t)
    nodes.street.gain.setTargetAtTime(0, t, 0.01)
    nodes.swellDepth.gain.setTargetAtTime(0, t, 0.01)
    nodes.music.gain.setTargetAtTime(0.36, t, tc)
  }
  if (mode === 'bass') {
    nodes.warmth.frequency.setTargetAtTime(20000, t, tc)
    nodes.crackleGain.gain.setTargetAtTime(0, t, tc)
    nodes.shelf.gain.setTargetAtTime(on ? BASS_BOOST_DB : 0, t, tc)
    return
  }
  if (mode === 'room') {
    nodes.warmth.frequency.setTargetAtTime(20000, t, tc)
    nodes.crackleGain.gain.setTargetAtTime(0, t, tc)
    nodes.shelf.gain.setTargetAtTime(on ? 2 : 0, t, tc)
    return
  }
  if (mode === 'vinyl') {
    nodes.warmth.frequency.setTargetAtTime(on ? 4200 : 20000, t, tc)
    nodes.shelf.gain.setTargetAtTime(on ? 4 : 0, t, tc)
    nodes.crackleGain.gain.setTargetAtTime(on ? 0.5 : 0, t, tc)
    return
  }
  nodes.warmth.frequency.setTargetAtTime(20000, t, tc)
  nodes.crackleGain.gain.setTargetAtTime(0, t, tc)
  nodes.shelf.gain.setTargetAtTime(0, t, tc)
  setAnc(on, t, tc)
}

// Cancelling on: the street drops ~36 dB and loses its highs; the music stays
function setAnc(on, t, tc) {
  nodes.street.gain.cancelScheduledValues(t)
  nodes.street.gain.setTargetAtTime(on ? ANC_GAIN : 0.5, t, tc)
  nodes.swellDepth.gain.setTargetAtTime(on ? ANC_GAIN * 0.3 : 0.18, t, tc)
  nodes.streetFilter.frequency.setTargetAtTime(on ? 260 : 1400, t, tc)
  nodes.music.gain.setTargetAtTime(on ? 0.42 : 0.32, t, tc)
}

// What the on-screen meter shows: street level ('anc'), bass lift ('bass'), warmth ('vinyl') or room fill ('room')
export function meter() {
  if (mode === 'room') {
    const amount = nodes ? Math.min(1, nodes.roomWet.gain.value / 0.6) : 0
    return { label: 'Room fill', value: `${Math.round(amount * 100)}%`, pct: 0.08 + amount * 0.92 }
  }
  if (mode === 'vinyl') {
    const f = nodes ? nodes.warmth.frequency.value : 20000
    const amount = Math.max(0, Math.min(1, (20000 - f) / (20000 - 4200)))
    return { label: 'Analogue warmth', value: `${Math.round(amount * 100)}%`, pct: 0.08 + amount * 0.92 }
  }
  if (mode === 'bass') {
    const lift = nodes ? nodes.shelf.gain.value : 0
    return { label: 'Low-end lift', value: `+${Math.round(lift)} dB`, pct: 0.25 + (lift / BASS_BOOST_DB) * 0.75 }
  }
  const db = streetDb()
  return { label: 'Street noise reaching you', value: `${Math.round(db)} dB`, pct: Math.max(0, Math.min(1, (db - 25) / 50)) }
}

export function setMode(m) { mode = m }

// Level of the street you'd hear, in dB
function streetDb() {
  if (!nodes) return STREET_DB
  const g = Math.max(nodes.street.gain.value, 0.0001)
  return STREET_DB + 20 * Math.log10(g / 0.5)
}

export function analyser() {
  return nodes?.analyser ?? null
}
