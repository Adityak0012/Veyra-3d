import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useTransform } from 'motion/react'
import { Check, Loader2, Plus, Move3d } from 'lucide-react'
import Listen from './Listen'
import { INTRO, drag, session } from '../interaction'
import { FINISHES } from '../products'

const ease = [0.16, 1, 0.3, 1]

// Gentle opacity-only reveal for headings
const fade = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.6 },
  transition: { duration: 0.9, ease },
}

// Giant wordmark that sits *behind* the 3D canvas, drifting up as you scroll
function Wordmark({ text, delay }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, -180])
  const opacity = useTransform(scrollY, [0, 700], [1, 0])
  return (
    <motion.div className="wordmark" aria-hidden style={{ y, opacity }}>
      {text.toUpperCase().split('').map((ch, i) => (
        <span key={i} className="wordmark-mask">
          <motion.span
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.3, ease, delay: delay + 0.05 + i * 0.07 }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </motion.div>
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

// The three chip visuals: an equaliser, a filling battery ring and an orbiting dot
function ChipIcon({ chip, delay }) {
  if (chip.type === 'eq') {
    return (
      <span className="eq" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * -0.23}s` }} />)}
      </span>
    )
  }
  if (chip.type === 'battery') {
    return (
      <svg className="battery-ring" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="16" className="battery-track" />
        <motion.circle
          cx="20" cy="20" r="16" className="battery-fill"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: chip.fill }}
          transition={{ duration: 1.8, delay, ease }}
        />
      </svg>
    )
  }
  return <span className="orbit" aria-hidden><span /></span>
}

const CHIP_LAYOUT = [
  { className: 'chip--anc', strength: 18, bob: 8 },
  { className: 'chip--battery', strength: 26, bob: 12 },
  { className: 'chip--spatial', strength: 12, bob: 6 },
]

function Hero({ product, finish, setFinish, delay }) {
  const { scrollY } = useScroll()
  const chipsOpacity = useTransform(scrollY, [0, 350], [1, 0])
  const active = FINISHES.find((f) => f.id === finish)

  return (
    <section id="top" className="section hero" data-stage>
      <motion.div className="chips" style={{ opacity: chipsOpacity }}>
        {product.chips.map((chip, i) => (
          <Chip key={chip.title} {...CHIP_LAYOUT[i]} delay={delay + 1.6 + i * 0.25}>
            <ChipIcon chip={chip} delay={delay + 2.0} />
            <span className="chip-text">
              <span className="chip-title">{chip.title}</span>
              <span className="chip-value">{chip.value}</span>
            </span>
          </Chip>
        ))}
      </motion.div>

      <div className="hero-row">
        <h1 aria-label={product.headline.join(' ')}>
          {product.headline.map((w, i) => (
            <span key={w} className="word-mask" aria-hidden>
              <motion.span
                className="word"
                initial={{ y: '110%', rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.1, delay: delay + 0.5 + i * 0.09, ease }}
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
          transition={{ duration: 1, delay: delay + 0.9, ease }}
        >
          <p>{product.heroText}</p>
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
            <span className="price">{product.price}</span>
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

function Sound({ sound }) {
  return (
    <section id="sound" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>{sound.title}</motion.h2>
        <dl className="stats">
          {sound.stats.map((s) => (
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

function Inside({ inside }) {
  return (
    <section id="inside" className="section section--top" data-stage>
      <div className="copy">
        <motion.h2 {...fade}>{inside.title}</motion.h2>
        <p className="body">{inside.body}</p>
        {/* On phones the 3D labels are hidden, so the parts are listed here */}
        <ul className="parts">
          {inside.parts.map((p) => (
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

// An invisible area over the product: drag sideways to turn them, let go and they glide back
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

function Specs({ specs }) {
  return (
    <section id="specs" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>Technical details</motion.h2>
        <dl className="specs">
          {specs.map(([k, v]) => (
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

function Faq({ faq }) {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="section" data-stage>
      <div className="copy copy--wide">
        <motion.h2 {...fade}>Questions, answered</motion.h2>
        <div className="faq">
          {faq.map(([q, a], i) => {
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

function Reserve({ product, finish }) {
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
          <h2>{product.name} in {name}</h2>
          <span className="price price--lg">{product.price}</span>
        </div>
        <p className="body">{product.ships}</p>
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

// One full product page. Every section reads its content from the product's entry in products.js.
export default function ProductPage({ product, finish, setFinish }) {
  // The first page waits for the opening loader; pages opened later start almost at once
  const [delay] = useState(() => (session.booted ? 0.45 : INTRO))

  useEffect(() => {
    document.title = `${product.name} · ${product.kind}`
  }, [product])

  return (
    <>
      <Wordmark text={product.short} delay={delay} />
      <main>
        <Hero product={product} finish={finish} setFinish={setFinish} delay={delay} />
        <Sound sound={product.sound} />
        {product.listen && <Listen listen={product.listen} />}
        <Inside inside={product.inside} />
        <Finishes finish={finish} setFinish={setFinish} />
        <Specs specs={product.specs} />
        <Faq faq={product.faq} />
        <Reserve product={product} finish={finish} />
      </main>
    </>
  )
}
