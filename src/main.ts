import { World } from './world'
import { Renderer } from './ui/renderer'
import { StatsGraph } from './ui/stats'
import { setupControls, updateCounters, SimControls } from './ui/controls'
import { setupSettingsPanel, loadSavedConfig } from './ui/settings'
import { setupPainter, PainterState } from './ui/painter'
import { BIOME } from './biomeMap'
import { CONFIG } from './config'

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
const statsCanvas = document.getElementById('stats-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1

// Charger la config sauvegardée AVANT de créer le monde
loadSavedConfig(Object.keys(CONFIG) as (keyof typeof CONFIG)[])

const world = new World(window.innerWidth, window.innerHeight)

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
}
setupPainter(canvas, world.biomeMap, painterState)

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
    renderer.render(world, painterState)
    stats.render()
    return
  }

  const elapsed = timestamp - lastTime
  if (elapsed < TICK_MS) return
  lastTime = timestamp

  for (let i = 0; i < controls.speedMultiplier; i++) {
    world.update()
  }

  renderer.render(world, painterState)

  if (world.tick % STATS_INTERVAL === 0) {
    const pop = world.getPopulation()
    stats.record(pop)
    stats.render()
    updateCounters(pop.plants, pop.herbivores, pop.carnivores)
  }
}

requestAnimationFrame(loop)
