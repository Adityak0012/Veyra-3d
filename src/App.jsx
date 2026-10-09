import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring, useReducedMotion, useMotionValueEvent } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ArrowUp } from 'lucide-react'
import Lenis from 'lenis'
import Scene from './components/Scene'
import ProductPage from './components/ProductPage'
import { INTRO, drag, session, scroller } from './interaction'
import { FINISHES, PRODUCTS, productByPath } from './products'

const ease = [0.16, 1, 0.3, 1]

function useSmoothScroll(reduced) {
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: 0 }, lerp: 0.09 })
    scroller.lenis = lenis
    return () => { lenis.destroy(); scroller.lenis = null }
  }, [reduced])
}

/* ---------- Switching products: a curtain sweeps up, the page changes underneath, it lifts ---------- */

const TransitionContext = createContext(() => {})

// A link to another product page that plays the curtain transition instead of jumping
function ProductLink({ to, children, ...rest }) {
  const go = useContext(TransitionContext)
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return // let new-tab clicks through
        e.preventDefault()
        go(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

function Curtain({ pending, onCovered }) {
  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          key="curtain"
          className="curtain"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={(def) => { if (def.clipPath === 'inset(0% 0 0 0)') onCovered() }}
          aria-hidden
        >
          <motion.span
            className="curtain-name"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
          >
            {pending.name}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
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
      else { setDone(true); session.booted = true }
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

function Nav({ product }) {
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
      <ProductLink to="/" className="logo" aria-label="Veyra home">veyra</ProductLink>
      {/* Product switcher: a pill slides to the current product */}
      <nav className="tabs" aria-label="Products">
        {PRODUCTS.map((p) => {
          const active = p.id === product.id
          return (
            <ProductLink key={p.id} to={p.path} className={`tab ${active ? 'tab--active' : ''}`} aria-current={active ? 'page' : undefined}>
              {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="tab-label">{p.short}</span>
            </ProductLink>
          )
        })}
      </nav>
      <motion.a href="#reserve" className="btn btn--small nav-cta" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        Reserve
      </motion.a>
    </motion.header>
  )
}

// Brand icons (lucide no longer ships brand logos)
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

const FOOTER_LINKS = [
  { title: 'Products', links: PRODUCTS.map((p) => [p.name, p.path]) },
  { title: 'Help', links: [['Questions', '#faq'], ['Technical details', '#specs'], ['Reserve', '#reserve']] },
  { title: 'Project', links: [['Source code on GitHub', 'https://github.com/Adityak0012/Veyra-3d']] },
]

function Footer() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter an email address like name@example.com.')
      return
    }
    setError('')
    setDone(true) // demo: connect a real mailing list here
  }

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-news">
          <h2>Hear it first.</h2>
          <p className="body">Launch news and early access, about once a month. No spam.</p>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.p
                key="done"
                className="success"
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
              >
                <Check size={18} aria-hidden /> You’ll hear from us at {email}.
              </motion.p>
            ) : (
              <motion.form key="form" className="form" onSubmit={submit} noValidate exit={{ opacity: 0 }}>
                <label htmlFor="news-email" className="sr-only">Email for launch news</label>
                <div className="field">
                  <input
                    id="news-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'news-error' : undefined}
                  />
                  <motion.button type="submit" className="btn" whileTap={{ scale: 0.97 }}>Notify me</motion.button>
                </div>
                {error && <p id="news-error" className="error">{error}</p>}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <nav className="footer-cols" aria-label="Footer">
          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="footer-col">
              <h3>{col.title}</h3>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith('/')
                      ? <ProductLink to={href}>{label}</ProductLink>
                      : <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>{label}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col">
            <h3>Built by</h3>
            <p className="footer-author">Aditya Kale<br /><span>Pune, India</span></p>
            <div className="socials">
              <a href="https://github.com/Adityak0012" target="_blank" rel="noreferrer" aria-label="Aditya Kale on GitHub"><GitHubIcon /></a>
              <a href="https://www.linkedin.com/in/adityak0012/" target="_blank" rel="noreferrer" aria-label="Aditya Kale on LinkedIn"><LinkedInIcon /></a>
            </div>
          </div>
        </nav>
      </div>

      {/* Big wordmark that rises letter by letter when you reach the bottom */}
      {/* The row is watched (not each letter, which starts hidden inside its mask) */}
      <motion.div
        className="footer-mark"
        aria-hidden
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {'VEYRA'.split('').map((ch, i) => (
          <span key={i} className="footer-mark-mask">
            <motion.span
              variants={{ hidden: { y: '100%' }, show: { y: '18%', transition: { duration: 1.1, ease } } }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </motion.div>

      <div className="footer-bottom">
        <span>© 2026 Veyra. A concept product; not for sale.</span>
        <span>Designed and built by <a href="https://www.linkedin.com/in/adityak0012/" target="_blank" rel="noreferrer">Aditya Kale</a></span>
        <a href="#top" className="to-top">
          Back to top <ArrowUp size={15} aria-hidden />
        </a>
      </div>
    </footer>
  )
}

export default function App() {
  const [finish, setFinish] = useState('sand')
  const [pending, setPending] = useState(null) // product switch in progress
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const location = useLocation()
  const navigate = useNavigate()
  const product = productByPath(location.pathname)
  const active = FINISHES.find((f) => f.id === finish)

  useSmoothScroll(reduced)

  // The whole page's light follows the chosen finish
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--bg', active.bg)
    root.setProperty('--glow', active.glow)
    active.aura.forEach((c, i) => root.setProperty(`--a${i + 1}`, c))
  }, [active])

  const go = useCallback((to) => {
    if (pending || to === location.pathname) {
      if (to === location.pathname) scroller.lenis ? scroller.lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setPending({ to, name: productByPath(to).name })
  }, [pending, location.pathname])

  // Once the curtain covers the screen: change page, jump to the top, then lift the curtain
  const onCovered = useCallback(() => {
    if (!pending) return
    navigate(pending.to)
    drag.spin = 0
    drag.velocity = 0
    if (scroller.lenis) scroller.lenis.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    setTimeout(() => setPending(null), 180)
  }, [pending, navigate])

  return (
    <MotionConfig reducedMotion="user">
      <TransitionContext.Provider value={go}>
        <Loader />
        <Curtain pending={pending} onCovered={onCovered} />
        <Aura />
        <div className="glow" aria-hidden />
        <Scene product={product} color={active.hex} accent={active.aura[0]} reduced={reduced} />
        <div className="grain" aria-hidden />
        <motion.div className="progress" style={{ scaleX: progress }} aria-hidden />
        <Nav product={product} />
        <ProductPage key={product.id} product={product} finish={finish} setFinish={setFinish} />
        <Footer />
      </TransitionContext.Provider>
    </MotionConfig>
  )
}
