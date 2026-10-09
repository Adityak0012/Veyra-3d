import { useState, useEffect, useRef } from 'react'
import {
  motion, AnimatePresence, MotionConfig, useScroll, useSpring, useReducedMotion, useMotionValueEvent,
  useMotionValue, useTransform,
} from 'motion/react'
import { Check, Loader2, Plus, Move3d } from 'lucide-react'
import Lenis from 'lenis'
import Scene from './components/Scene'
import Listen from './components/Listen'
import { INTRO, drag } from './interaction'
import { FINISHES, STATS, INSIDE, SPECS, FAQ } from './data'

const ease = [0.16, 1, 0.3, 1]
const PRICE = '₹24,999'

// Gentle opacity-only reveal for headings
const fade = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.6 },
  transition: { duration: 0.9, ease },
}

function useSmoothScroll(reduced) {
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: 0 }, lerp: 0.09 })
    return () => lenis.destroy()
  }, [reduced])
}

function Nav() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev && y > 200)
    setSolid(y > 40)
  })

  return (
    <motion.header
      className={`nav ${solid ? 'nav--solid' : ''}`}
      initial={{ y: -80 }}
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <a href="#top" className="logo" aria-label="Veyra, back to top">veyra</a>
      <nav aria-label="Sections">
        <a href="#sound">Sound</a>
        <a href="#listen">Listen</a>
        <a href="#inside">Inside</a>
        <a href="#finishes">Finishes</a>
        <a href="#specs">Specs</a>
      </nav>
      <motion.a href="#reserve" className="btn btn--small" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        Reserve
      </motion.a>
    </motion.header>
  )
}

// Giant wordmark that sits *behind* the 3D canvas, drifting up as you scroll
function Wordmark() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, -180])
  const opacity = useTransform(scrollY, [0, 700], [1, 0])
  return (
    <motion.div className="wordmark" aria-hidden style={{ y, opacity }}>
      {'VEYRA'.split('').map((ch, i) => (
        <span key={i} className="wordmark-mask">
          <motion.span
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.3, ease, delay: INTRO + 0.05 + i * 0.07 }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}

// Slow-moving colour light behind everything, tinted by the chosen finish
function Aura() {
  return (
    <div className="aura" aria-hidden>
      <span className="aura-blob aura-blob--1" />
      <span className="aura-blob aura-blob--2" />
      <span className="aura-blob aura-blob--3" />
    </div>
  )
}

// Small glass cards that float beside the product and lean away from the cursor
function useParallax(strength) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  useEffect(() => {
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2)
      my.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my])
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })
  return {
    x: useTransform(sx, (v) => v * -strength),
    y: useTransform(sy, (v) => v * -strength),
  }
}

function Chip({ className, delay, strength, bob, children }) {
  const p = useParallax(strength)
  return (
    <motion.div className={`chip ${className}`} style={p} aria-hidden>
      <motion.div
        className="chip-inner"
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: [0, -bob, 0] }}
        transition={{
          opacity: { duration: 0.8, delay, ease },
          scale: { duration: 0.8, delay, ease },
          filter: { duration: 0.8, delay, ease },
          y: { duration: 5 + bob / 4, delay, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

const HEADLINE = ['Silence,', 'shaped', 'around', 'you.']

function Hero({ finish, setFinish }) {
  const { scrollY } = useScroll()
  const chipsOpacity = useTransform(scrollY, [0, 350], [1, 0])
  const active = FINISHES.find((f) => f.id === finish)

  return (
    <section id="top" className="section hero" data-stage>
      <motion.div className="chips" style={{ opacity: chipsOpacity }}>
        <Chip className="chip--anc" delay={INTRO + 1.6} strength={18} bob={8}>
          <span className="eq" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * -0.23}s` }} />)}
          </span>
          <span className="chip-text">
            <span className="chip-title">Noise cancelling</span>
            <span className="chip-value">−42 dB, adaptive</span>
          </span>
        </Chip>
        <Chip className="chip--battery" delay={INTRO + 1.85} strength={26} bob={12}>
          <svg className="battery-ring" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r="16" className="battery-track" />
            <motion.circle
              cx="20" cy="20" r="16" className="battery-fill"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.86 }}
              transition={{ duration: 1.8, delay: INTRO + 2.0, ease }}
            />
          </svg>
          <span className="chip-text">
            <span className="chip-title">Battery</span>
            <span className="chip-value">40 hours</span>
          </span>
        </Chip>
        <Chip className="chip--spatial" delay={INTRO + 2.1} strength={12} bob={6}>
          <span className="orbit" aria-hidden><span /></span>
          <span className="chip-text">
            <span className="chip-title">Spatial audio</span>
            <span className="chip-value">Head tracking on</span>
          </span>
        </Chip>
      </motion.div>

      <div className="hero-row">
        <h1 aria-label="Silence, shaped around you.">
          {HEADLINE.map((w, i) => (
            <span key={w} className="word-mask" aria-hidden>
              <motion.span
                className="word"
                initial={{ y: '110%', rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.1, delay: INTRO + 0.5 + i * 0.09, ease }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div
          className="hero-side"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: INTRO + 0.9, ease }}
        >
          <p>Veyra One wireless over-ear headphones. Adaptive noise cancelling, 40-hour battery, 254&nbsp;g.</p>
          <div className="hero-finish" role="radiogroup" aria-label="Finish">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                role="radio"
                aria-checked={f.id === finish}
                aria-label={f.name}
                className="mini-swatch"
                onClick={() => setFinish(f.id)}
              >
                {f.id === finish && (
                  <motion.span layoutId="hero-ring" className="mini-ring" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
                )}
                <span style={{ background: f.hex }} />
              </button>
            ))}
            <span className="hero-finish-name">{active.name}</span>
          </div>
          <div className="actions">
            <motion.a href="#reserve" className="btn btn--shine" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              Reserve yours
            </motion.a>
            <span className="price">{PRICE}</span>
          </div>
        </motion.div>
      </div>
      <motion.a
        href="#sound"
        className="scroll-cue"
        aria-label="Scroll to the next section"
        style={{ opacity: chipsOpacity }}
      >
        <span />
      </motion.a>
    </section>
  )
}

function Sound() {
  return (
    <section id="sound" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>Everything you want to hear. Nothing you don’t.</motion.h2>
        <dl className="stats">
          {STATS.map((s) => (
            <div key={s.unit} className="stat">
              <dt><span className="stat-value">{s.value}</span><span className="stat-unit">{s.unit}</span></dt>
              <dd>{s.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Inside() {
  return (
    <section id="inside" className="section section--top" data-stage>
      <div className="copy">
        <motion.h2 {...fade}>Take it apart. Every layer earns its place.</motion.h2>
        <p className="body">Three parts do most of the work. Scroll back up to put it together again.</p>
        {/* On phones the 3D labels are hidden, so the parts are listed here */}
        <ul className="parts">
          {INSIDE.map((p) => (
            <li key={p.label}>
              <h3>{p.label}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// An invisible area over the headphones: drag sideways to turn them, let go and they glide back
function DragZone() {
  const last = useRef(null)
  const [hinted, setHinted] = useState(false)

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.active = true
    drag.velocity = 0
    last.current = { x: e.clientX, t: performance.now() }
    setHinted(true)
  }
  const move = (e) => {
    if (!drag.active || !last.current) return
    const now = performance.now()
    const dx = e.clientX - last.current.x
    const dt = Math.max((now - last.current.t) / 1000, 0.001)
    drag.spin += dx * 0.012
    drag.velocity = (dx * 0.012) / dt
    last.current = { x: e.clientX, t: now }
  }
  const up = () => {
    drag.active = false
    drag.velocity = THREE_CLAMP(drag.velocity, -14, 14)
    last.current = null
  }

  return (
    <div
      className="drag-zone"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      aria-hidden
    >
      <AnimatePresence>
        {!hinted && (
          <motion.span
            className="drag-hint"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Move3d size={15} /> Drag to turn
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
const THREE_CLAMP = (v, a, b) => Math.min(b, Math.max(a, v))

function Finishes({ finish, setFinish }) {
  const active = FINISHES.find((f) => f.id === finish)
  return (
    <section id="finishes" className="section section--right section--drag" data-stage>
      <DragZone />
      <div className="copy">
        <motion.h2 {...fade}>Four finishes.</motion.h2>
        <div className="finish-name" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={active.id}
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { duration: 0.5, ease } }}
              exit={{ y: '-100%', transition: { duration: 0.25, ease: 'easeIn' } }}
            >
              {active.name}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="body finish-note">{active.note}</p>
        <div className="swatches" role="radiogroup" aria-label="Finish">
          {FINISHES.map((f) => (
            <button
              key={f.id}
              role="radio"
              aria-checked={f.id === finish}
              aria-label={f.name}
              className="swatch"
              onClick={() => setFinish(f.id)}
            >
              {f.id === finish && (
                <motion.span layoutId="ring" className="ring" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              <span className="dot" style={{ background: f.hex }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Specs() {
  return (
    <section id="specs" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>Technical details</motion.h2>
        <dl className="specs">
          {SPECS.map(([k, v]) => (
            <div key={k} className="spec">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>Questions, answered</motion.h2>
        <div className="faq">
          {FAQ.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                <h3>
                  <button
                    className="faq-q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {q}
                    <motion.span className="faq-icon" animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3, ease }}>
                      <Plus size={18} aria-hidden />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      className="faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease }}
                    >
                      <p>{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Opening curtain: the name, a counter, then it lifts to reveal the page
function Loader() {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min((now - start) / ((INTRO - 0.35) * 1000), 1)
      setCount(Math.round(100 * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loader"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <span className="loader-name">veyra</span>
          <span className="loader-count">{count}</span>
          <span className="loader-bar"><span style={{ transform: `scaleX(${count / 100})` }} /></span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Reserve({ finish }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const name = FINISHES.find((f) => f.id === finish).name

  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter an email address like name@example.com.')
      return
    }
    setError('')
    setStatus('sending')
    setTimeout(() => setStatus('done'), 1200) // demo: connect a real backend here
  }

  return (
    <section id="reserve" className="section section--end" data-stage>
      <div className="reserve">
        <div className="reserve-head">
          <h2>Veyra One in {name}</h2>
          <span className="price price--lg">{PRICE}</span>
        </div>
        <p className="body">Ships November 2026. Nothing is charged until your pair ships.</p>
        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.p
              key="done"
              className="success"
              role="status"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
            >
              <Check size={18} aria-hidden /> Reserved. We’ll email {email} before it ships.
            </motion.p>
          ) : (
            <motion.form key="form" className="form" onSubmit={submit} noValidate exit={{ opacity: 0 }}>
              <label htmlFor="email">Email for shipping updates</label>
              <div className="field">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                />
                <motion.button type="submit" className="btn" disabled={status === 'sending'} whileTap={{ scale: 0.97 }}>
                  {status === 'sending' ? <><Loader2 size={18} className="spin" aria-hidden /> Reserving</> : 'Reserve yours'}
                </motion.button>
              </div>
              {error && <p id="email-error" className="error">{error}</p>}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default function App() {
  const [finish, setFinish] = useState('sand')
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const active = FINISHES.find((f) => f.id === finish)

  useSmoothScroll(reduced)

  // The whole page's light follows the chosen finish
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--bg', active.bg)
    root.setProperty('--glow', active.glow)
    active.aura.forEach((c, i) => root.setProperty(`--a${i + 1}`, c))
  }, [active])

  return (
    <MotionConfig reducedMotion="user">
      <Loader />
      <Aura />
      <div className="glow" aria-hidden />
      <Wordmark />
      <Scene color={active.hex} accent={active.aura[0]} reduced={reduced} />
      <div className="grain" aria-hidden />
      <motion.div className="progress" style={{ scaleX: progress }} aria-hidden />
      <Nav />
      <main>
        <Hero finish={finish} setFinish={setFinish} />
        <Sound />
        <Listen />
        <Inside />
        <Finishes finish={finish} setFinish={setFinish} />
        <Specs />
        <Faq />
        <Reserve finish={finish} />
      </main>
      <footer className="footer">
        Veyra One is a concept product, built with React Three Fiber and Motion.
      </footer>
    </MotionConfig>
  )
}
