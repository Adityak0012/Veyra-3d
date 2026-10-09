// A small sound engine for the "Hear the difference" demo, built with the Web Audio API.
// Everything is generated in the browser: a busy street (traffic rumble, wind, horns)
// and a soft piece of music. Turning noise cancelling on filters and lowers only the street.

const STREET_DB = 72 // what the meter shows with cancelling off
const ANC_GAIN = 0.008 // street level with cancelling on (about −36 dB)

let ctx = null
let nodes = null
let hornTimer = null
let noteTimer = null

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
  music.connect(master)
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

  nodes = { master, analyser, street, streetFilter, music, swellDepth }
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

export async function play(ancOn) {
  if (!ctx) build()
  await ctx.resume()
  setAnc(ancOn, true)
  nodes.master.gain.cancelScheduledValues(ctx.currentTime)
  nodes.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.15)
  clearTimeout(hornTimer)
  clearTimeout(noteTimer)
  hornTimer = setTimeout(horn, 1500)
  noteTimer = setTimeout(pluck, 400)
}

export function pause() {
  if (!ctx) return
  clearTimeout(hornTimer)
  clearTimeout(noteTimer)
  nodes.master.gain.setTargetAtTime(0, ctx.currentTime, 0.1)
  setTimeout(() => ctx && ctx.state === 'running' && nodes.master.gain.value < 0.02 && ctx.suspend(), 600)
}

// Cancelling on: the street drops ~36 dB and loses its highs; the music stays
export function setAnc(on, instant = false) {
  if (!ctx) return
  const t = ctx.currentTime
  const tc = instant ? 0.01 : 0.25
  nodes.street.gain.cancelScheduledValues(t)
  nodes.street.gain.setTargetAtTime(on ? ANC_GAIN : 0.5, t, tc)
  nodes.swellDepth.gain.setTargetAtTime(on ? ANC_GAIN * 0.3 : 0.18, t, tc)
  nodes.streetFilter.frequency.setTargetAtTime(on ? 260 : 1400, t, tc)
  nodes.music.gain.setTargetAtTime(on ? 0.42 : 0.32, t, tc)
}

// Level of the street you'd hear, in dB, for the on-screen meter
export function streetDb() {
  if (!nodes) return STREET_DB
  const g = Math.max(nodes.street.gain.value, 0.0001)
  return STREET_DB + 20 * Math.log10(g / 0.5)
}

export function analyser() {
  return nodes?.analyser ?? null
}
