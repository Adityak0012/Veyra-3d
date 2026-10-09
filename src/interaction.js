// Shared state between the page (DOM) and the 3D scene, without React re-renders.

// Seconds the loading intro covers the page; hero animations start after it
export const INTRO = 1.4

// Drag-to-rotate: `spin` is an extra turn (radians) added to the headphones.
// While dragging it follows the pointer; on release it keeps some momentum, then eases home.
export const drag = { spin: 0, velocity: 0, active: false }

// Becomes true once the opening loader has finished. Pages opened after that
// (by switching product) start their animations right away instead of waiting for it.
export const session = { booted: false }

// The smooth-scroll instance, so a product switch can jump straight to the top
export const scroller = { lenis: null }
