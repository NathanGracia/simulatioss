import { BiomeMap, BiomeType, BIOME } from '../biomeMap'

export const BRUSH_RADIUS = 28

export interface PainterState {
  cursorX: number
  cursorY: number
  cursorVisible: boolean
  activeBiome: BiomeType
  mode: 'paint' | 'inspect'
}

/** Sélecteurs des éléments UI à exclure du painting (sinon on peint en draguant un slider) */
const UI_SELECTOR = '#ui-overlay, #settings-panel, #settings-toggle'

export function setupPainter(
  canvas: HTMLCanvasElement,
  biomeMap: BiomeMap,
  state: PainterState,
): void {
  let painting = false

  const btnRiver   = document.getElementById('btn-biome-river')!
  const btnPrairie = document.getElementById('btn-biome-prairie')!
  const btnInspect = document.getElementById('btn-inspect')!

  const setCursor = () => {
    canvas.style.cursor = state.mode === 'inspect' ? 'crosshair' : 'none'
  }

  const updateButtonStates = () => {
    if (state.mode === 'inspect') {
      btnInspect.classList.add('active')
      btnRiver.classList.remove('active')
      btnPrairie.classList.remove('active')
    } else {
      btnInspect.classList.remove('active')
      if (state.activeBiome === BIOME.WATER) {
        btnRiver.classList.add('active')
        btnPrairie.classList.remove('active')
      } else {
        btnPrairie.classList.add('active')
        btnRiver.classList.remove('active')
      }
    }
  }

  const setMode = (mode: 'paint' | 'inspect') => {
    state.mode = mode
    setCursor()
    updateButtonStates()
  }

  const getPos = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const isInCanvas = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    return clientX >= rect.left && clientX <= rect.right
        && clientY >= rect.top  && clientY <= rect.bottom
  }

  const isUITarget = (e: MouseEvent) =>
    !!(e.target as HTMLElement).closest(UI_SELECTOR)

  // ── Souris — sur document pour traverser les overlays ─────────────────────
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return
    if (state.mode !== 'paint') return
    if (isUITarget(e)) return
    if (!isInCanvas(e.clientX, e.clientY)) return
    painting = true
    const { x, y } = getPos(e.clientX, e.clientY)
    biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
  })

  document.addEventListener('mousemove', e => {
    const inCanvas = isInCanvas(e.clientX, e.clientY)
    const { x, y } = getPos(e.clientX, e.clientY)
    state.cursorX = x
    state.cursorY = y
    state.cursorVisible = inCanvas && state.mode === 'paint'
    if (painting && inCanvas && state.mode === 'paint') biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
  })

  document.addEventListener('mouseup', () => { painting = false })

  // ── Touch ─────────────────────────────────────────────────────────────────
  canvas.addEventListener('touchstart', e => {
    e.preventDefault()
    if (state.mode !== 'paint') return
    painting = true
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
  }, { passive: false })

  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    if (state.mode !== 'paint') return
    if (!painting) return
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    state.cursorX = x
    state.cursorY = y
    biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
  }, { passive: false })

  canvas.addEventListener('touchend', () => { painting = false })

  // ── Boutons de biome ──────────────────────────────────────────────────────
  btnRiver.addEventListener('click', () => {
    state.activeBiome = BIOME.WATER
    setMode('paint')
  })

  btnPrairie.addEventListener('click', () => {
    state.activeBiome = BIOME.PRAIRIE
    setMode('paint')
  })

  btnInspect.addEventListener('click', () => {
    setMode(state.mode === 'inspect' ? 'paint' : 'inspect')
  })

  // ── Raccourci clavier ─────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) return
    if (e.key === 'i' || e.key === 'I') {
      setMode(state.mode === 'inspect' ? 'paint' : 'inspect')
    }
  })

  // Appliquer l'état initial (boutons + curseur)
  setMode(state.mode)
}
