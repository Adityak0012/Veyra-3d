# Veyra One: 3D Product Landing Page

An interactive, scroll-driven 3D landing page for **Veyra One**, a concept pair of wireless noise-cancelling headphones. The headphones are modelled entirely in code with Three.js. They turn, come apart and change finish as you scroll. The page also has a listening demo that lets you *hear* noise cancelling, made with the Web Audio API.

> Veyra is a fictional brand created for this project. The product, specs and prices are illustrative.

**Live demo:** _add your Vercel link here_

![Hero section](docs/hero.jpg)

---

## Highlights

- **Procedural 3D model.** The headphones are built from code (lathe, extrude and torus geometry), with no model files to download. Oval ear cups, a stitched leather headband, a brushed-steel yoke, a power button, a status light and a USB-C port.
- **Scroll-driven camera choreography.** Each section has its own pose, and the model blends smoothly between them as you scroll.
- **Exploded view.** The ear cups come apart to show the driver and foam, with labels that track each part in 3D.
- **"Hear the difference" demo.** A busy street and music are generated live in the browser. Switching noise cancelling on filters the street out, with a real-time waveform and a dB meter.
- **Finish picker that relights the page.** Sand, Graphite, Sage and Ember each recolour the model, the background, the moving colour light and the particles.
- **Drag to turn.** Spin the headphones with your mouse or finger. They keep some momentum, then glide back.
- **Cinematic hero.** A loading intro, a spin-in entrance, a word-by-word headline, floating glass info cards with live meters, and sound-wave rings.
- **Realistic rendering.** Soft shadows, studio light panels, physically based materials (clearcoat, sheen, anisotropy) and procedural bump textures.
- **Fast on weaker laptops.** Resolution adjusts automatically to keep the frame rate smooth on integrated graphics.
- **Accessible.** Keyboard focus styles, ARIA roles for switches and swatches, and a calmer version for people who turn on "reduce motion".

| Exploded view | Listening demo |
|---|---|
| ![Exploded view](docs/inside.jpg) | ![Listening demo](docs/listen.jpg) |

| Finishes | Mobile |
|---|---|
| ![Finishes](docs/finishes.jpg) | <img src="docs/mobile.jpg" alt="Mobile layout" width="260" /> |

---

## Tech stack

| Area | Tools |
|---|---|
| Framework | React 19, Vite |
| 3D | Three.js, React Three Fiber, drei |
| Animation | Motion (Framer Motion), Lenis smooth scrolling |
| Audio | Web Audio API (no audio files) |
| Styling | Plain CSS with design tokens (CSS variables) |
| Type and icons | Archivo variable font (self-hosted), lucide-react |
| Hosting | Vercel |

---

## Getting started

You need [Node.js](https://nodejs.org) 20.19 or newer (or 22.12+).

```bash
git clone https://github.com/Adityak0012/veyra-3d.git
cd veyra-3d
npm install
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Checks the code with oxlint |

---

## Project structure

```
veyra-3d/
├── public/
│   ├── favicon.svg
│   └── og.jpg                 # image shown when the link is shared
├── docs/                      # screenshots for this README
├── src/
│   ├── components/
│   │   ├── Headphones.jsx     # the 3D model, materials and textures
│   │   ├── Scene.jsx          # canvas, lighting, scroll poses, sound rings, labels
│   │   └── Listen.jsx         # "Hear the difference" player UI
│   ├── App.jsx                # page sections, hero, finishes, FAQ, reserve form
│   ├── audio.js               # Web Audio engine: street noise, music, noise cancelling
│   ├── interaction.js         # shared state (drag-to-turn, intro timing)
│   ├── data.js                # copy, finishes, specs and FAQ
│   ├── index.css              # design tokens and all styles
│   └── main.jsx
└── index.html
```

---

## How it works

**Scroll poses.** Every `<section data-stage>` has a matching entry in the `DESKTOP` and `MOBILE` arrays in `Scene.jsx` (position, rotation, scale and how far apart the parts are). Each frame, the scene finds the two sections nearest the middle of the screen and blends between their poses. To change how the model moves, edit those arrays.

**Labels on the 3D model.** Empty anchor points are placed on the model. Each frame their positions are projected to the screen, and the HTML labels are moved to match.

**Finishes.** Each finish in `data.js` sets the shell colour plus the page's background (`bg`), the glow behind the product (`glow`) and three `aura` colours. CSS transitions make the whole page shift light smoothly.

**Noise-cancelling demo.** `audio.js` builds a small audio graph:

- Brown noise for traffic rumble, filtered noise for wind, random car horns and a slow traffic swell.
- A chord pad with gentle plucked notes for the music.
- With noise cancelling on, only the street is filtered and turned down by about 36 dB. An analyser feeds the waveform and the meter.

---

## Deploying

1. Push the project to GitHub.
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import the repository and press **Deploy**. Vercel detects Vite automatically.
3. Put your live URL into the `og:image` tag in `index.html` (e.g. `https://veyra-3d.vercel.app/og.jpg`) so link previews show the image.

Every push to `main` redeploys automatically.

---

## Ideas for next steps

- Swap in a real `.glb` model (`npx gltfjsx model.glb` turns it into a React component).
- Connect the reserve form to a backend such as Formspree or Supabase.
- Add a cart and checkout flow, or a light "studio white" theme.

---

## Author

**Aditya Kale**

- GitHub: [@Adityak0012](https://github.com/Adityak0012)
- LinkedIn: [adityak0012](https://www.linkedin.com/in/adityak0012/)

If you like this project, a star on GitHub is appreciated.
