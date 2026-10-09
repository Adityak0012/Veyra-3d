// Each finish also sets the page's ambient light (bg), the glow behind the product,
// and three `aura` colours that drift slowly behind the hero
export const FINISHES = [
  { id: 'sand', name: 'Sand', hex: '#d6c6a8', bg: '#19160f', glow: '#7a6440', aura: ['#c08a4a', '#5b6f8a', '#8a5a3c'], note: 'A warm, matte neutral with brushed-steel details.' },
  { id: 'graphite', name: 'Graphite', hex: '#34363c', bg: '#101216', glow: '#46506a', aura: ['#3d63b8', '#7650b0', '#1f8a93'], note: 'Low-gloss and fingerprint-resistant. Disappears on a commute.' },
  { id: 'sage', name: 'Sage', hex: '#8ca189', bg: '#0f1712', glow: '#41604a', aura: ['#3f9468', '#b4c46a', '#2a7a8a'], note: 'A muted green taken from early-morning fog over the Western Ghats.' },
  { id: 'ember', name: 'Ember', hex: '#b9502f', bg: '#1a0f0b', glow: '#7a3420', aura: ['#e0552a', '#f0a640', '#8a2456'], note: 'The launch finish, made in a limited run of 5,000.' },
]

export const STATS = [
  { value: '−42', unit: 'dB', text: 'less outside noise, with cancelling that adapts as you move.' },
  { value: '40', unit: 'h', text: 'of playback on a charge. Ten minutes on USB-C adds five more.' },
  { value: '8', unit: 'mics', text: 'tuned for calls that sound like you’re in a quiet room.' },
]

export const INSIDE = [
  { label: 'Slow-rebound memory foam', text: 'Wrapped in protein leather. Seals around the ear without pressing on glasses.' },
  { label: '40 mm beryllium-coated driver', text: 'A stiff, light cone for tight bass and clear highs at any volume.' },
  { label: 'Machined aluminium yoke', text: 'Cut from a single block, so the whole headphone weighs 254 g.' },
]

export const SPECS = [
  ['Driver', '40 mm dynamic, beryllium-coated'],
  ['Frequency response', '4 Hz – 40 kHz'],
  ['Noise cancelling', 'Adaptive hybrid, 8 microphones'],
  ['Battery', 'Up to 40 h with cancelling on'],
  ['Fast charge', '10 min for 5 h of playback'],
  ['Connectivity', 'Bluetooth 5.4, multipoint, USB-C audio'],
  ['Codecs', 'AAC, SBC, LC3'],
  ['Weight', '254 g'],
]

export const FAQ = [
  ['How long does the battery last?', 'Up to 40 hours with noise cancelling on, and about 50 with it off. Ten minutes on USB-C gives you five hours of playback.'],
  ['Does it work with Android, iPhone and laptops?', 'Yes. It connects over Bluetooth 5.4 to any phone, tablet or computer, and stays paired to two devices at once, so calls follow you from laptop to phone.'],
  ['Can I wear it with glasses?', 'The slow-rebound foam seals around the frames instead of pressing them into your head. Most people with glasses wear it for hours without pressure points.'],
  ['Can I use it with a cable?', 'Yes. Plug it into a computer with USB-C for wired, lossless audio. It charges at the same time.'],
  ['What is covered by the warranty?', 'Two years against manufacturing faults, and the ear cushions can be replaced at home by pulling them off and pressing new ones on.'],
]
