import Headphones from './components/models/Headphones'
import Buds from './components/models/Buds'
import Arc from './components/models/Arc'
import Halo from './components/models/Halo'
import Spin from './components/models/Spin'

const TAU = Math.PI * 2

// Shared by every product. Each finish also sets the page's ambient light (bg),
// the glow behind the product and three `aura` colours that drift behind the hero.
export const FINISHES = [
  { id: 'sand', name: 'Sand', hex: '#d6c6a8', bg: '#19160f', glow: '#7a6440', aura: ['#c08a4a', '#5b6f8a', '#8a5a3c'], note: 'A warm, matte neutral with brushed-steel details.' },
  { id: 'graphite', name: 'Graphite', hex: '#34363c', bg: '#101216', glow: '#46506a', aura: ['#3d63b8', '#7650b0', '#1f8a93'], note: 'Low-gloss and fingerprint-resistant. Disappears on a commute.' },
  { id: 'sage', name: 'Sage', hex: '#8ca189', bg: '#0f1712', glow: '#41604a', aura: ['#3f9468', '#b4c46a', '#2a7a8a'], note: 'A muted green taken from early-morning fog over the Western Ghats.' },
  { id: 'ember', name: 'Ember', hex: '#b9502f', bg: '#1a0f0b', glow: '#7a3420', aura: ['#e0552a', '#f0a640', '#8a2456'], note: 'The launch finish, made in a limited run of 5,000.' },
]

/*
  One entry per product page. `poses` has one pose per section, in page order:
  hero, sound, listen, inside, finishes, specs, faq, reserve.
  pos: x, y, z · rot: x, y, z · s: scale · e: explode (0 = assembled, 1 = apart)
*/
export const PRODUCTS = [
  {
    id: 'one',
    path: '/',
    short: 'One',
    name: 'Veyra One',
    kind: 'Wireless over-ear headphones',
    price: '₹24,999',
    Model: Headphones,
    mobileScale: 1,
    headline: ['Silence,', 'shaped', 'around', 'you.'],
    heroText: 'Veyra One wireless over-ear headphones. Adaptive noise cancelling, 40-hour battery, 254 g.',
    chips: [
      { type: 'eq', title: 'Noise cancelling', value: '−42 dB, adaptive' },
      { type: 'battery', title: 'Battery', value: '40 hours', fill: 0.86 },
      { type: 'orbit', title: 'Spatial audio', value: 'Head tracking on' },
    ],
    sound: {
      title: 'Everything you want to hear. Nothing you don’t.',
      stats: [
        { value: '−42', unit: 'dB', text: 'less outside noise, with cancelling that adapts as you move.' },
        { value: '40', unit: 'h', text: 'of playback on a charge. Ten minutes on USB-C adds five more.' },
        { value: '8', unit: 'mics', text: 'tuned for calls that sound like you’re in a quiet room.' },
      ],
    },
    listen: {
      mode: 'anc',
      title: 'Hear the difference.',
      body: 'Press play for a busy street with music on top, then switch noise cancelling on. The sound is simulated in your browser, and works best with headphones.',
      toggle: 'Noise cancelling',
    },
    inside: {
      title: 'Take it apart. Every layer earns its place.',
      body: 'Three parts do most of the work. Scroll back up to put it together again.',
      parts: [
        { label: 'Slow-rebound memory foam', text: 'Wrapped in protein leather. Seals around the ear without pressing on glasses.' },
        { label: '40 mm beryllium-coated driver', text: 'A stiff, light cone for tight bass and clear highs at any volume.' },
        { label: 'Machined aluminium yoke', text: 'Cut from a single block, so the whole headphone weighs 254 g.' },
      ],
    },
    callouts: [
      { id: 'foam', text: 'Slow-rebound memory foam', dir: 'up' },
      { id: 'yoke', text: 'Machined aluminium yoke', dir: 'up' },
      { id: 'driver', text: '40 mm beryllium-coated driver', dir: 'down' },
    ],
    specs: [
      ['Driver', '40 mm dynamic, beryllium-coated'],
      ['Frequency response', '4 Hz – 40 kHz'],
      ['Noise cancelling', 'Adaptive hybrid, 8 microphones'],
      ['Battery', 'Up to 40 h with cancelling on'],
      ['Fast charge', '10 min for 5 h of playback'],
      ['Connectivity', 'Bluetooth 5.4, multipoint, USB-C audio'],
      ['Codecs', 'AAC, SBC, LC3'],
      ['Weight', '254 g'],
    ],
    faq: [
      ['How long does the battery last?', 'Up to 40 hours with noise cancelling on, and about 50 with it off. Ten minutes on USB-C gives you five hours of playback.'],
      ['Does it work with Android, iPhone and laptops?', 'Yes. It connects over Bluetooth 5.4 to any phone, tablet or computer, and stays paired to two devices at once, so calls follow you from laptop to phone.'],
      ['Can I wear it with glasses?', 'The slow-rebound foam seals around the frames instead of pressing them into your head. Most people with glasses wear it for hours without pressure points.'],
      ['Can I use it with a cable?', 'Yes. Plug it into a computer with USB-C for wired, lossless audio. It charges at the same time.'],
      ['What is covered by the warranty?', 'Two years against manufacturing faults, and the ear cushions can be replaced at home by pulling them off and pressing new ones on.'],
    ],
    ships: 'Ships November 2026. Nothing is charged until your pair ships.',
    poses: [
      { pos: [0, 0.08, 0], rot: [0.14, -0.42, 0.04], s: 0.82, e: 0 },
      { pos: [1.3, 0, 0], rot: [0.1, 0.9, -0.08], s: 0.86, e: 0 },
      { pos: [1.4, -0.05, 0], rot: [0.28, -0.85, 0.05], s: 0.8, e: 0 },
      { pos: [0.45, -0.05, 0], rot: [0.16, -0.22, 0], s: 0.76, e: 1 },
      { pos: [-1.2, 0, 0], rot: [0.1, TAU - 0.4, 0], s: 0.92, e: 0 },
      { pos: [1.35, 0, -0.4], rot: [0.3, TAU + 0.6, 0.08], s: 0.76, e: 0 },
      { pos: [1.5, -0.1, -0.6], rot: [0.2, TAU + 1.5, 0.1], s: 0.7, e: 0 },
      { pos: [0, 0.72, 0], rot: [0.12, TAU, 0], s: 0.42, e: 0 },
    ],
  },

  {
    id: 'buds',
    path: '/buds',
    short: 'Buds',
    name: 'Veyra Buds',
    kind: 'Wireless earbuds',
    price: '₹12,999',
    Model: Buds,
    mobileScale: 1.15,
    headline: ['Big', 'sound,', 'pocket', 'sized.'],
    heroText: 'Veyra Buds wireless earbuds. Adaptive noise cancelling, 32 hours with the case, 5 g per bud.',
    chips: [
      { type: 'eq', title: 'Noise cancelling', value: '−38 dB, adaptive' },
      { type: 'battery', title: 'With the case', value: '32 hours', fill: 0.8 },
      { type: 'orbit', title: 'Sweat and rain', value: 'IPX5 rated' },
    ],
    sound: {
      title: 'Quiet, wherever you put them in.',
      stats: [
        { value: '−38', unit: 'dB', text: 'less outside noise. Tap and hold a bud to let the world back in.' },
        { value: '32', unit: 'h', text: 'with the case; eight hours from the buds on a single charge.' },
        { value: '5', unit: 'g', text: 'per bud, light enough to stay put on a run.' },
      ],
    },
    listen: {
      mode: 'anc',
      title: 'Hear the difference.',
      body: 'Press play for a busy commute with music on top, then switch noise cancelling on. The sound is simulated in your browser, and works best with headphones.',
      toggle: 'Noise cancelling',
    },
    inside: {
      title: 'Open the case.',
      body: 'The lid lifts and the buds rise out. Scroll back up to put them away.',
      parts: [
        { label: '11 mm custom driver', text: 'A large driver for a bud this size, for full bass at low volume.' },
        { label: 'Memory-foam ear tips', text: 'Three sizes in the box. They expand to seal, which is half of good cancelling.' },
        { label: 'Wireless charging case', text: 'Charges on any Qi pad or over USB-C, and holds three full top-ups.' },
      ],
    },
    callouts: [
      { id: 'tip', text: 'Memory-foam ear tips', dir: 'up' },
      { id: 'driver', text: '11 mm custom driver', dir: 'up' },
      { id: 'case', text: 'Wireless charging case', dir: 'down' },
    ],
    specs: [
      ['Driver', '11 mm dynamic'],
      ['Noise cancelling', 'Adaptive hybrid, 6 microphones'],
      ['Battery', '8 h per charge, 32 h with the case'],
      ['Charging', 'USB-C and Qi wireless'],
      ['Water resistance', 'IPX5'],
      ['Connectivity', 'Bluetooth 5.4, multipoint'],
      ['Codecs', 'AAC, SBC, LC3'],
      ['Weight', '5 g per bud, 46 g case'],
    ],
    faq: [
      ['Will they fall out when I run?', 'The buds weigh 5 g each and sit in the concha of your ear, held by the foam tips. Pick the tip size that seals and they stay in.'],
      ['Can I use just one bud?', 'Yes. Either bud works on its own for calls or music, and the other keeps charging in the case.'],
      ['Do they work with Android and iPhone?', 'Yes, over Bluetooth 5.4, and they stay paired to two devices at once.'],
      ['How do I charge them?', 'Put the buds in the case. Charge the case with USB-C or leave it on any Qi wireless pad.'],
      ['What is covered by the warranty?', 'Two years against manufacturing faults. Lost a single bud? We sell replacements.'],
    ],
    ships: 'Ships December 2026. Nothing is charged until your pair ships.',
    poses: [
      { pos: [0, 0.02, 0], rot: [0.32, -0.5, 0], s: 1.05, e: 0.55 },
      { pos: [1.3, 0, 0], rot: [0.3, 0.75, 0], s: 1.05, e: 0.55 },
      { pos: [1.4, -0.05, 0], rot: [0.5, -0.9, 0], s: 1.0, e: 0.15 },
      { pos: [0.45, 0, 0], rot: [0.28, -0.3, 0], s: 1.05, e: 1 },
      { pos: [-1.2, 0, 0], rot: [0.3, TAU - 0.5, 0], s: 1.15, e: 0.55 },
      { pos: [1.35, 0, -0.3], rot: [0.45, TAU + 0.7, 0], s: 1.0, e: 0 },
      { pos: [1.5, -0.1, -0.5], rot: [0.35, TAU + 1.5, 0], s: 0.95, e: 0 },
      { pos: [0, 0.72, 0], rot: [0.3, TAU, 0], s: 0.6, e: 0.55 },
    ],
  },

  {
    id: 'arc',
    path: '/arc',
    short: 'Arc',
    name: 'Veyra Arc',
    kind: 'Portable speaker',
    price: '₹17,999',
    Model: Arc,
    mobileScale: 0.95,
    headline: ['Fill', 'every', 'room.'],
    heroText: 'Veyra Arc portable speaker. Sound in every direction, deep bass, 20-hour battery, waterproof.',
    chips: [
      { type: 'eq', title: 'Sound', value: '360°, two drivers' },
      { type: 'battery', title: 'Battery', value: '20 hours', fill: 0.7 },
      { type: 'orbit', title: 'Waterproof', value: 'IP67 rated' },
    ],
    sound: {
      title: 'Sound in every direction.',
      stats: [
        { value: '360', unit: '°', text: 'of even sound, so there’s no wrong place to stand.' },
        { value: '20', unit: 'h', text: 'of playback. The light ring shows what’s left at a glance.' },
        { value: '1', unit: 'm', text: 'underwater for 30 minutes without damage (IP67).' },
      ],
    },
    listen: {
      mode: 'bass',
      title: 'Feel the low end.',
      body: 'Press play, then switch bass boost on. The passive radiator adds weight without muddying the vocals. Simulated in your browser; best on headphones or proper speakers.',
      toggle: 'Bass boost',
    },
    inside: {
      title: 'Slide off the knit.',
      body: 'Under the fabric sit two drivers, a passive radiator and a light ring you turn for volume.',
      parts: [
        { label: 'Light ring', text: 'Glows to show battery and volume. Turn the cap to change the level.' },
        { label: 'Two 45 mm drivers', text: 'Full-range, firing outward so the sound spreads around the room.' },
        { label: 'Passive bass radiator', text: 'A 70 mm membrane that moves with the air inside for deep, clean bass.' },
      ],
    },
    callouts: [
      { id: 'ring', text: 'Light ring', dir: 'up' },
      { id: 'drivers', text: 'Two 45 mm drivers', dir: 'up' },
      { id: 'radiator', text: 'Passive bass radiator', dir: 'down' },
    ],
    specs: [
      ['Drivers', '2 × 45 mm full-range'],
      ['Bass', '70 mm passive radiator'],
      ['Sound', '360°, stereo pairing'],
      ['Battery', 'Up to 20 h'],
      ['Charging', 'USB-C, full in 2.5 h'],
      ['Water and dust', 'IP67'],
      ['Connectivity', 'Bluetooth 5.4'],
      ['Weight', '640 g'],
    ],
    faq: [
      ['Can I pair two Arcs?', 'Yes. Pair two for left and right stereo, or play the same music on both in different rooms.'],
      ['Is it really waterproof?', 'It’s rated IP67: dust-tight, and fine 1 m underwater for 30 minutes. Dry the port before charging.'],
      ['Can it charge my phone?', 'Yes. Plug your phone into the USB-C port and Arc shares its battery.'],
      ['How do I change the volume?', 'Turn the top cap. The light ring brightens or dims to show the level.'],
      ['What is covered by the warranty?', 'Two years against manufacturing faults, including the battery.'],
    ],
    ships: 'Ships December 2026. Nothing is charged until your speaker ships.',
    poses: [
      { pos: [0, 0.0, 0], rot: [0.34, -0.4, 0.03], s: 0.88, e: 0 },
      { pos: [1.3, 0, 0], rot: [0.15, 0.8, -0.05], s: 0.9, e: 0 },
      { pos: [1.4, -0.05, 0], rot: [0.3, -0.7, 0.05], s: 0.85, e: 0 },
      { pos: [0.5, -0.05, 0], rot: [0.14, -0.35, 0], s: 0.8, e: 1 },
      { pos: [-1.2, 0, 0], rot: [0.12, TAU - 0.4, 0], s: 0.92, e: 0 },
      { pos: [1.35, 0, -0.4], rot: [0.3, TAU + 0.6, 0.05], s: 0.8, e: 0 },
      { pos: [1.5, -0.1, -0.6], rot: [0.2, TAU + 1.4, 0.08], s: 0.75, e: 0 },
      { pos: [0, 0.74, 0], rot: [0.15, TAU, 0], s: 0.42, e: 0 },
    ],
  },


  {
    id: 'halo',
    path: '/halo',
    short: 'Halo',
    name: 'Veyra Halo',
    kind: 'Smart home speaker',
    price: '₹22,999',
    Model: Halo,
    mobileScale: 1,
    headline: ['Sound', 'for', 'every', 'room.'],
    heroText: 'Veyra Halo smart speaker. 360° sound, a light ring that answers when you speak, and multi-room with every Veyra speaker.',
    chips: [
      { type: 'eq', title: 'Room tuning', value: 'Automatic' },
      { type: 'battery', title: 'Voice pickup', value: '6 far-field mics', fill: 0.9 },
      { type: 'orbit', title: 'Multi-room', value: 'Groups with Arc' },
    ],
    sound: {
      title: 'Tuned to your room.',
      stats: [
        { value: '360', unit: '°', text: 'of sound from three tweeters and a woofer that fires into the table.' },
        { value: '6', unit: 'mics', text: 'hear you from across the room, even with the music up.' },
        { value: '24', unit: 'h', text: 'between automatic room tunings, so it adapts when the furniture moves.' },
      ],
    },
    listen: {
      mode: 'room',
      title: 'Fill the room.',
      body: 'Press play, then switch room fill on. Halo uses the walls around it to make the sound feel bigger than the speaker. Simulated in your browser; best on headphones.',
      toggle: 'Room fill',
    },
    inside: {
      title: 'Open the halo.',
      body: 'The fabric parts to show three tweeters around the middle and a woofer facing down.',
      parts: [
        { label: 'Light ring', text: 'Glows when Halo is listening, and sets volume with a swipe.' },
        { label: 'Three 20 mm tweeters', text: 'Angled 120° apart, so the room gets clear highs from every side.' },
        { label: 'Down-firing 100 mm woofer', text: 'Uses the surface below to spread bass evenly through the room.' },
      ],
    },
    callouts: [
      { id: 'ring', text: 'Light ring', dir: 'up' },
      { id: 'tweeters', text: 'Three 20 mm tweeters', dir: 'up' },
      { id: 'woofer', text: 'Down-firing 100 mm woofer', dir: 'down' },
    ],
    specs: [
      ['Drivers', '3 × 20 mm tweeters, 100 mm woofer'],
      ['Sound', '360°, automatic room tuning'],
      ['Microphones', '6 far-field, with a mute switch'],
      ['Connectivity', 'Wi-Fi 6, Bluetooth 5.4, casting'],
      ['Multi-room', 'Groups with Veyra Arc and other Halos'],
      ['Power', 'Mains, under 1 W on standby'],
      ['Size', '17 cm across, 14 cm tall'],
      ['Weight', '1.9 kg'],
    ],
    faq: [
      ['Does it need Wi-Fi?', 'For multi-room, voice and streaming, yes. Without Wi-Fi it still works as a Bluetooth speaker.'],
      ['Can I turn the microphones off?', 'Yes. Slide the switch on the back and the light ring turns red to show they’re off.'],
      ['Can I pair two for stereo?', 'Yes. Two Halos make a left and right pair, and they group with Arc for multi-room.'],
      ['Will it work with my phone?', 'Yes, on Android and iPhone. Cast from your apps or play over Bluetooth.'],
      ['What is covered by the warranty?', 'Two years against manufacturing faults.'],
    ],
    ships: 'Ships December 2026. Nothing is charged until your speaker ships.',
    poses: [
      { pos: [0, -0.05, 0], rot: [0.4, -0.4, 0], s: 0.95, e: 0 },
      { pos: [1.3, 0, 0], rot: [0.45, 0.7, 0], s: 0.95, e: 0 },
      { pos: [1.4, -0.05, 0], rot: [0.55, -0.8, 0], s: 0.9, e: 0 },
      { pos: [0.5, -0.1, 0], rot: [0.22, -0.35, 0], s: 0.82, e: 1 },
      { pos: [-1.2, 0, 0], rot: [0.4, TAU - 0.5, 0], s: 1.0, e: 0 },
      { pos: [1.35, 0, -0.3], rot: [0.5, TAU + 0.6, 0], s: 0.85, e: 0 },
      { pos: [1.5, -0.1, -0.5], rot: [0.45, TAU + 1.4, 0], s: 0.8, e: 0 },
      { pos: [0, 0.74, 0], rot: [0.45, TAU, 0], s: 0.5, e: 0 },
    ],
  },

  {
    id: 'spin',
    path: '/spin',
    short: 'Spin',
    name: 'Veyra Spin',
    kind: 'Turntable',
    price: '₹34,999',
    Model: Spin,
    mobileScale: 1,
    headline: ['Music', 'you', 'can', 'hold.'],
    heroText: 'Veyra Spin turntable. Belt-driven aluminium platter, carbon-fibre tonearm, built-in preamp and Bluetooth out.',
    chips: [
      { type: 'eq', title: 'Now playing', value: '33⅓ rpm, side A' },
      { type: 'battery', title: 'Speed accuracy', value: '±0.1%', fill: 0.97 },
      { type: 'orbit', title: 'Wireless out', value: 'Bluetooth 5.4' },
    ],
    sound: {
      title: 'Every groove, nothing else.',
      stats: [
        { value: '0.05', unit: '%', text: 'wow and flutter, so held notes stay perfectly steady.' },
        { value: '72', unit: 'dB', text: 'signal-to-noise. Quiet passages stay quiet.' },
        { value: '2', unit: 'speeds', text: '33⅓ and 45 rpm, switched with a turn of the knob.' },
      ],
    },
    listen: {
      mode: 'vinyl',
      title: 'Hear the warmth.',
      body: 'Press play, then switch vinyl warmth on for the rounder highs and soft surface crackle of a record. Simulated in your browser; best on headphones.',
      toggle: 'Vinyl warmth',
    },
    inside: {
      title: 'Lift the platter.',
      body: 'The record and platter rise to show the belt drive, which keeps motor noise away from the stylus.',
      parts: [
        { label: 'Carbon-fibre tonearm', text: 'Stiff and light, so the stylus tracks the groove without resonating.' },
        { label: 'Machined aluminium platter', text: '1.8 kg of balanced mass that keeps speed steady.' },
        { label: 'Isolated belt-drive motor', text: 'Sits apart from the platter so its hum never reaches the record.' },
      ],
    },
    callouts: [
      { id: 'tonearm', text: 'Carbon-fibre tonearm', dir: 'up' },
      { id: 'platter', text: 'Machined aluminium platter', dir: 'up' },
      { id: 'motor', text: 'Isolated belt-drive motor', dir: 'down' },
    ],
    specs: [
      ['Drive', 'Belt drive, DC motor'],
      ['Speeds', '33⅓ and 45 rpm'],
      ['Wow and flutter', '0.05%'],
      ['Tonearm', '8.6" carbon fibre'],
      ['Cartridge', 'Moving magnet, pre-fitted'],
      ['Outputs', 'Phono, line (built-in preamp), Bluetooth 5.4'],
      ['Platter', '1.8 kg machined aluminium'],
      ['Size and weight', '44 × 33 × 12 cm, 6.2 kg'],
    ],
    faq: [
      ['Do I need an amplifier?', 'No. The built-in preamp plugs straight into powered speakers, or send the sound to any Bluetooth speaker or headphones.'],
      ['Does it play 45 rpm singles?', 'Yes. Turn the knob to switch between 33⅓ and 45 rpm. Use the included adapter for large-hole 7-inch singles.'],
      ['Is the cartridge set up already?', 'Yes. It arrives fitted and aligned, with tracking force set. Just add the belt and the counterweight.'],
      ['Can it play through my Veyra speakers?', 'Yes. Pair Veyra Arc or Veyra One over Bluetooth and play a record wirelessly.'],
      ['What is covered by the warranty?', 'Two years against manufacturing faults. The stylus is a wear part and can be replaced at home.'],
    ],
    ships: 'Ships January 2027. Nothing is charged until your turntable ships.',
    poses: [
      { pos: [0, -0.05, 0], rot: [0.58, -0.45, 0], s: 0.82, e: 0 },
      { pos: [1.3, 0, 0], rot: [0.62, 0.65, 0], s: 0.8, e: 0 },
      { pos: [1.4, -0.05, 0], rot: [0.85, -0.75, 0], s: 0.78, e: 0 },
      { pos: [0.45, -0.25, 0], rot: [0.55, -0.25, 0], s: 0.74, e: 1 },
      { pos: [-1.2, 0, 0], rot: [0.55, TAU - 0.5, 0], s: 0.88, e: 0 },
      { pos: [1.35, 0, -0.4], rot: [0.7, TAU + 0.6, 0], s: 0.74, e: 0 },
      { pos: [1.5, -0.1, -0.6], rot: [0.6, TAU + 1.4, 0], s: 0.7, e: 0 },
      { pos: [0, 0.72, 0], rot: [0.6, TAU, 0], s: 0.42, e: 0 },
    ],
  },
]

export const productByPath = (path) => PRODUCTS.find((p) => p.path === path) ?? PRODUCTS[0]
