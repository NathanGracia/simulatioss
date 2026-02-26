import { World } from './world'
import { Renderer } from './ui/renderer'
import { StatsGraph } from './ui/stats'
import { setupControls, updateCounters, updateSeason, SimControls } from './ui/controls'
import { setupSettingsPanel, loadSavedConfig } from './ui/settings'
import { setupPainter, PainterState } from './ui/painter'
import { setupInspector, TrackState } from './ui/inspector'
import { GeneticHistory, setupGeneticModal } from './ui/geneticGraph'
import { HeatmapSystem } from './ui/heatmap'
import { soundHerbEat, soundCarnEat, soundReproduce, resetSoundBudgets } from './ui/sound'
import { BIOME } from './biomeMap'
import { CONFIG } from './config'

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
const statsCanvas = document.getElementById('stats-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1

// Charger la config sauvegardée AVANT de créer le monde
loadSavedConfig(Object.keys(CONFIG) as (keyof typeof CONFIG)[])

const world = new World(window.innerWidth, window.innerHeight)

const heatmap = new HeatmapSystem()

function resizeCanvas(): void {
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  world.width = W
  world.height = H
  heatmap.resize(W, H)
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const renderer = new Renderer(canvas)
const stats = new StatsGraph(statsCanvas)

const controls: SimControls = {
  paused: false,
  speedMultiplier: 1,
  resetRequested: false,
}
setupControls(controls)
setupSettingsPanel(() => { controls.resetRequested = true })

const painterState: PainterState = {
  cursorX: 0, cursorY: 0,
  cursorVisible: false,
  activeBiome: BIOME.WATER,
  mode: 'inspect',
}
setupPainter(canvas, world.biomeMap, painterState)
const track: TrackState = setupInspector(canvas, world, painterState)

const geneHistory = new GeneticHistory()
const geneModal   = setupGeneticModal(geneHistory)
document.getElementById('btn-genetics')!.addEventListener('click', () => geneModal.toggle())

const btnHeatmap = document.getElementById('btn-heatmap')!
function toggleHeatmap(): void {
  heatmap.enabled = !heatmap.enabled
  btnHeatmap.classList.toggle('active', heatmap.enabled)
}
btnHeatmap.addEventListener('click', toggleHeatmap)
document.addEventListener('keydown', e => {
  if (!e.ctrlKey && !e.metaKey && (e.key === 'h' || e.key === 'H')) toggleHeatmap()
})

let lastTime = 0
const TICK_MS = 1000 / CONFIG.TARGET_FPS
const STATS_INTERVAL = 5

function loop(timestamp: number): void {
  requestAnimationFrame(loop)

  if (controls.resetRequested) {
    world.initialize()
    controls.resetRequested = false
  }

  if (controls.paused) {
    track.update()
    renderer.render(world, painterState, track, heatmap)
    stats.render()
    return
  }

  const elapsed = timestamp - lastTime
  if (elapsed < TICK_MS) return
  lastTime = timestamp

  let herbEats = 0, carnEats = 0, matings = 0
  for (let i = 0; i < controls.speedMultiplier; i++) {
    world.update()
    herbEats += world.herbEatCount
    carnEats += world.carnEatCount
    matings  += world.matingEvents.length
    for (const e of world.herbFeedEvents) heatmap.add(e.x, e.y, 'herb')
    for (const e of world.carnFeedEvents) heatmap.add(e.x, e.y, 'carn')
    for (const e of world.matingEvents)   heatmap.add(e.x, e.y, 'repro')
  }
  heatmap.decay()

  resetSoundBudgets()
  if (herbEats > 0) soundHerbEat(herbEats)
  if (carnEats > 0) soundCarnEat(carnEats)
  if (matings  > 0) soundReproduce(matings)

  track.update()
  renderer.render(world, painterState, track, heatmap)

  if (world.tick % STATS_INTERVAL === 0) {
    const pop = world.getPopulation()
    stats.record(pop)
    stats.render()
    updateCounters(pop.plants, pop.herbivores, pop.carnivores)
    updateSeason(world.season.season, world.season.progress)
    geneHistory.record(world)
    geneModal.render()
  }
}

requestAnimationFrame(loop)
