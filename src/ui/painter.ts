import { BiomeMap, BiomeType, BIOME } from '../biomeMap'

export const BRUSH_RADIUS = 28

export type PainterMode = 'paint' | 'inspect' | 'spawn-plant' | 'spawn-herb' | 'spawn-carn'

export interface PainterState {
  cursorX: number
  cursorY: number
  cursorVisible: boolean
  activeBiome: BiomeType
  mode: PainterMode
}

export interface SpawnCallbacks {
  spawnPlant(x: number, y: number): void
  spawnHerb(x: number, y: number): void
  spawnCarn(x: number, y: number): void
}

/** Distance min entre deux spawns pendant un drag */
const SPAWN_DRAG_DIST = 40

/** Sélecteurs des éléments UI à exclure du painting */
const UI_SELECTOR = '#ui-overlay, #settings-panel, #settings-toggle'

export function setupPainter(
  canvas: HTMLCanvasElement,
  biomeMap: BiomeMap,
  state: PainterState,
  spawner: SpawnCallbacks,
): void {
  let painting = false
  let lastSpawnX = -Infinity
  let lastSpawnY = -Infinity

  const btnRiver      = document.getElementById('btn-biome-river')!
  const btnPrairie    = document.getElementById('btn-biome-prairie')!
  const btnInspect    = document.getElementById('btn-inspect')!
  const btnSpawnPlant = document.getElementById('btn-spawn-plant')!
  const btnSpawnHerb  = document.getElementById('btn-spawn-herb')!
  const btnSpawnCarn  = document.getElementById('btn-spawn-carn')!

  const isSpawnMode = () => state.mode.startsWith('spawn')

  const setCursor = () => {
    canvas.style.cursor = state.mode === 'inspect' ? 'crosshair' : 'none'
  }

  const updateButtonStates = () => {
    const m = state.mode
    btnInspect.classList.toggle('active', m === 'inspect')
    btnRiver.classList.toggle('active', m === 'paint' && state.activeBiome === BIOME.WATER)
    btnPrairie.classList.toggle('active', m === 'paint' && state.activeBiome === BIOME.PRAIRIE)
    btnSpawnPlant.classList.toggle('active', m === 'spawn-plant')
    btnSpawnHerb.classList.toggle('active', m === 'spawn-herb')
    btnSpawnCarn.classList.toggle('active', m === 'spawn-carn')
  }

  const setMode = (mode: PainterMode) => {
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

  const doSpawn = (x: number, y: number) => {
    const dx = x - lastSpawnX
    const dy = y - lastSpawnY
    if (!painting || Math.sqrt(dx * dx + dy * dy) < SPAWN_DRAG_DIST) return
    lastSpawnX = x
    lastSpawnY = y
    if (state.mode === 'spawn-plant') spawner.spawnPlant(x, y)
    else if (state.mode === 'spawn-herb') spawner.spawnHerb(x, y)
    else if (state.mode === 'spawn-carn') spawner.spawnCarn(x, y)
  }

  // ── Souris — sur document pour traverser les overlays ─────────────────────
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return
    if (isUITarget(e)) return
    if (!isInCanvas(e.clientX, e.clientY)) return
    const { x, y } = getPos(e.clientX, e.clientY)

    if (state.mode === 'paint') {
      painting = true
      biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
    } else if (isSpawnMode()) {
      painting = true
      lastSpawnX = x
      lastSpawnY = y
      if (state.mode === 'spawn-plant') spawner.spawnPlant(x, y)
      else if (state.mode === 'spawn-herb') spawner.spawnHerb(x, y)
      else if (state.mode === 'spawn-carn') spawner.spawnCarn(x, y)
    }
  })

  document.addEventListener('mousemove', e => {
    const inCanvas = isInCanvas(e.clientX, e.clientY)
    const { x, y } = getPos(e.clientX, e.clientY)
    state.cursorX = x
    state.cursorY = y
    state.cursorVisible = inCanvas && (state.mode === 'paint' || isSpawnMode())
    if (!inCanvas) return
    if (painting && state.mode === 'paint') biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
    else if (painting && isSpawnMode()) doSpawn(x, y)
  })

  document.addEventListener('mouseup', () => { painting = false })

  // ── Touch ─────────────────────────────────────────────────────────────────
  canvas.addEventListener('touchstart', e => {
    e.preventDefault()
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    painting = true
    if (state.mode === 'paint') {
      biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
    } else if (isSpawnMode()) {
      lastSpawnX = x; lastSpawnY = y
      if (state.mode === 'spawn-plant') spawner.spawnPlant(x, y)
      else if (state.mode === 'spawn-herb') spawner.spawnHerb(x, y)
      else if (state.mode === 'spawn-carn') spawner.spawnCarn(x, y)
    }
  }, { passive: false })

  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    if (!painting) return
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    state.cursorX = x
    state.cursorY = y
    if (state.mode === 'paint') biomeMap.paint(x, y, BRUSH_RADIUS, state.activeBiome)
    else if (isSpawnMode()) doSpawn(x, y)
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

  // ── Boutons de spawn ──────────────────────────────────────────────────────
  btnSpawnPlant.addEventListener('click', () => setMode(state.mode === 'spawn-plant' ? 'inspect' : 'spawn-plant'))
  btnSpawnHerb.addEventListener('click',  () => setMode(state.mode === 'spawn-herb'  ? 'inspect' : 'spawn-herb'))
  btnSpawnCarn.addEventListener('click',  () => setMode(state.mode === 'spawn-carn'  ? 'inspect' : 'spawn-carn'))

  // ── Raccourcis clavier ────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) return
    if (e.key === 'i' || e.key === 'I') setMode(state.mode === 'inspect' ? 'paint' : 'inspect')
  })

  setMode(state.mode)
}
