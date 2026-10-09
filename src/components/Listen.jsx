import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Play, Pause, Headphones as HeadphonesIcon } from 'lucide-react'
import * as audio from '../audio'

// Live waveform of what you're hearing; idles as a slow sine when stopped
function Waveform({ playing, anc }) {
  const canvas = useRef()

  useEffect(() => {
    const c = canvas.current
    const g = c.getContext('2d')
    let raf
    let data = null

    const draw = (time) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = c.clientWidth
      const h = c.clientHeight
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)

      const css = getComputedStyle(document.documentElement)
      const grad = g.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, css.getPropertyValue('--a2').trim() || '#888')
      grad.addColorStop(0.5, css.getPropertyValue('--text').trim() || '#fff')
      grad.addColorStop(1, css.getPropertyValue('--a1').trim() || '#888')

      const an = audio.analyser()
      g.beginPath()
      if (playing && an) {
        if (!data || data.length !== an.fftSize) data = new Uint8Array(an.fftSize)
        an.getByteTimeDomainData(data)
        const step = data.length / w
        for (let x = 0; x < w; x++) {
          const v = (data[Math.floor(x * step)] - 128) / 128
          const y = h / 2 + v * h * 0.9
          x ? g.lineTo(x, y) : g.moveTo(x, y)
        }
      } else {
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x / 38 + time / 900) * 3
          x ? g.lineTo(x, y) : g.moveTo(x, y)
        }
      }
      g.strokeStyle = grad
      g.lineWidth = 1.6
      g.shadowColor = css.getPropertyValue('--a1').trim()
      g.shadowBlur = anc ? 6 : 14
      g.stroke()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, anc])

  return <canvas ref={canvas} className="waveform" aria-hidden />
}

// Live reading for the demo: street level (noise cancelling) or low-end lift (bass boost)
function Meter({ playing }) {
  const [reading, setReading] = useState(audio.meter())
  useEffect(() => {
    let raf
    const tick = () => { setReading(audio.meter()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{reading.label}</span>
        <span className="meter-value">{reading.value}</span>
      </div>
      <div className="meter-track"><span style={{ transform: `scaleX(${reading.pct})` }} /></div>
    </div>
  )
}

export default function Listen({ listen }) {
  const [playing, setPlaying] = useState(false)
  const [anc, setAnc] = useState(false)

  // Each product page has its own demo mode; stop the sound when leaving the page
  useEffect(() => {
    audio.setMode(listen.mode)
    return () => audio.pause()
  }, [listen.mode])

  const toggle = async () => {
    if (playing) { audio.pause(); setPlaying(false) } else { await audio.play(anc, listen.mode); setPlaying(true) }
  }
  const flip = () => {
    const next = !anc
    setAnc(next)
    audio.set(next)
  }

  return (
    <section id="listen" className="section" data-stage>
      <div className="copy copy--wide listen">
        <h2>{listen.title}</h2>
        <p className="body">{listen.body}</p>

        <div className={`player ${anc ? 'player--anc' : ''}`}>
          <div className="player-row">
            <motion.button
              className="play"
              onClick={toggle}
              whileTap={{ scale: 0.94 }}
              aria-label={playing ? 'Pause the demo' : 'Play the demo'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={playing ? 'pause' : 'play'}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {playing ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 3 }} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <button className="switch" role="switch" aria-checked={anc} onClick={flip}>
              <span className="switch-track">
                <motion.span className="switch-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
              </span>
              <span className="switch-label">
                {listen.toggle} <strong>{anc ? 'On' : 'Off'}</strong>
              </span>
            </button>
          </div>

          <Waveform playing={playing} anc={anc} />
          <Meter playing={playing} />
          {!playing && (
            <p className="player-hint"><HeadphonesIcon size={14} aria-hidden /> Turn your volume down a little first.</p>
          )}
        </div>
      </div>
    </section>
  )
}
