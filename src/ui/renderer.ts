import { World } from '../world'
import { CONFIG } from '../config'
import { BIOME } from '../biomeMap'
import { SEASON_COLORS } from '../systems/season'
import { PainterState, BRUSH_RADIUS } from './painter'
import { TrackState } from './inspector'
import { HeatmapSystem } from './heatmap'
import { herbivoreHSL, carnivoreHSL } from './entityColor'

const TAU = Math.PI * 2
const RIPPLE_PERIOD = 55   // ticks par cycle d'onde
const RIPPLE_MAX_R  = 26   // rayon max de l'onde en px

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number    // 1 → 0
  decay: number
  color: string
  r: number
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private vignetteCache: CanvasGradient | null = null
  private vignetteW = 0
  private vignetteH = 0
  private particles: Particle[] = []
  private readonly MAX_PARTICLES = 400
  private grassCanvas: HTMLCanvasElement | null = null
  private grassW = 0
  private grassH = 0
  private biomeLayer: HTMLCanvasElement | null = null
  private biomeLayerW = 0
  private biomeLayerH = 0
  private biomeLayerBeachSize = -1

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2D context')
    this.ctx = ctx
  }

  private getBiomeLayer(world: World, W: number, H: number): HTMLCanvasElement {
    const bs = CONFIG.LAKE_BEACH_SIZE
    const needsRebake = world.biomeMap.isDirty
      || W !== this.biomeLayerW
      || H !== this.biomeLayerH
      || bs !== this.biomeLayerBeachSize

    if (!needsRebake && this.biomeLayer) return this.biomeLayer

    const c = this.biomeLayer ?? document.createElement('canvas')
    c.width = W; c.height = H
    const cx = c.getContext('2d')!

    // Grass
    cx.save()
    cx.filter = 'blur(40px)'
    cx.imageSmoothingEnabled = true
    cx.drawImage(this.getGrassCanvas(W, H), -40, -40, W + 80, H + 80)
    cx.filter = 'none'
    cx.restore()

    // Sable — large halo
    const beachTex = world.biomeMap.getBeachTexture()
    cx.save()
    cx.filter = `blur(${bs}px)`
    cx.globalAlpha = 0.75
    cx.drawImage(beachTex, -bs, -bs, W + bs * 2, H + bs * 2)
    cx.drawImage(beachTex, -bs, -bs, W + bs * 2, H + bs * 2)
    cx.drawImage(beachTex, -bs, -bs, W + bs * 2, H + bs * 2)
    cx.filter = 'none'
    cx.restore()

    // Sable serré
    const bs2 = Math.max(8, Math.floor(bs * 0.3))
    cx.save()
    cx.filter = `blur(${bs2}px)`
    cx.globalAlpha = 0.9
    cx.drawImage(beachTex, -bs2, -bs2, W + bs2 * 2, H + bs2 * 2)
    cx.drawImage(beachTex, -bs2, -bs2, W + bs2 * 2, H + bs2 * 2)
    cx.filter = 'none'
    cx.restore()

    // Eau de base
    const waterTex = world.biomeMap.getTexture()
    cx.save()
    cx.filter = 'blur(16px)'
    cx.globalAlpha = 0.6
    cx.drawImage(waterTex, -16, -16, W + 32, H + 32)
    cx.filter = 'none'
    cx.restore()

    this.biomeLayer = c
    this.biomeLayerW = W
    this.biomeLayerH = H
    this.biomeLayerBeachSize = bs
    return c
  }

  private getGrassCanvas(W: number, H: number): HTMLCanvasElement {
    if (this.grassCanvas && W === this.grassW && H === this.grassH) return this.grassCanvas
    // Très basse résolution (1/20) — les patches sont larges et organiques une fois blurrés
    const gW = Math.max(4, Math.ceil(W / 20))
    const gH = Math.max(4, Math.ceil(H / 20))
    const c = document.createElement('canvas')
    c.width = gW; c.height = gH
    const cx = c.getContext('2d')!
    const img = cx.createImageData(gW, gH)
    const d = img.data
    for (let i = 0; i < gW * gH; i++) {
      const o = i * 4
      const n = (Math.random() - 0.5) * 22
      d[o]     = Math.max(0, Math.min(255, 58  + (n * 0.4) | 0))
      d[o + 1] = Math.max(0, Math.min(255, 140 + (n * 0.9) | 0))
      d[o + 2] = Math.max(0, Math.min(255, 34  + (n * 0.3) | 0))
      d[o + 3] = 255
    }
    cx.putImageData(img, 0, 0)
    this.grassCanvas = c
    this.grassW = W; this.grassH = H
    return c
  }

  // ── Vignette ────────────────────────────────────────────────────────────────

  private vignette(W: number, H: number): CanvasGradient {
    if (this.vignetteCache && W === this.vignetteW && H === this.vignetteH) {
      return this.vignetteCache
    }
    const g = this.ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.82)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.62)')
    this.vignetteCache = g
    this.vignetteW = W
    this.vignetteH = H
    return g
  }

  // ── Particules ───────────────────────────────────────────────────────────────

  private spawnBurst(x: number, y: number, color: string): void {
    if (this.particles.length > this.MAX_PARTICLES) return
    // Particules colorées
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * TAU
      const speed = 0.5 + Math.random() * 2.0
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        life: 0.8 + Math.random() * 0.2,
        decay: 0.02 + Math.random() * 0.015,
        color,
        r: 1.8 + Math.random() * 2.2,
      })
    }
    // Étincelles blanches
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * TAU
      const speed = 1.2 + Math.random() * 2.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        life: 0.5 + Math.random() * 0.3,
        decay: 0.035 + Math.random() * 0.02,
        color: '#ffffff',
        r: 1 + Math.random() * 1.5,
      })
    }
  }

  private updateParticles(): void {
    for (const p of this.particles) {
      p.x  += p.vx
      p.y  += p.vy
      p.vy += 0.05   // gravité
      p.vx *= 0.97   // friction air
      p.life -= p.decay
    }
    this.particles = this.particles.filter(p => p.life > 0)
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.shadowBlur = 0
    for (const p of this.particles) {
      ctx.globalAlpha = p.life * 0.95
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.3, p.r * p.life), 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ── Ondes de séduction ───────────────────────────────────────────────────────

  private renderRipples(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.shadowBlur = 0
    ctx.lineWidth = 1

    const drawRipple = (x: number, y: number, id: number, stroke: string) => {
      for (let w = 0; w < 2; w++) {
        const phase = ((world.tick + id * 17 + w * Math.floor(RIPPLE_PERIOD / 2)) % RIPPLE_PERIOD) / RIPPLE_PERIOD
        const radius = 5 + phase * RIPPLE_MAX_R
        ctx.globalAlpha = (1 - phase) * 0.5
        ctx.strokeStyle = stroke
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, TAU)
        ctx.stroke()
      }
    }

    for (const herb of world.herbivores) {
      if (herb.energy < CONFIG.HERBIVORE_REPR_THRESHOLD || herb.reprTimer > 0) continue
      drawRipple(herb.pos.x, herb.pos.y, herb.id, '#f9a8d4')
    }
    for (const carn of world.carnivores) {
      if (carn.energy < CONFIG.CARNIVORE_REPR_THRESHOLD || carn.reprTimer > 0) continue
      drawRipple(carn.pos.x, carn.pos.y, carn.id, '#f9a8d4')
    }

    ctx.globalAlpha = 1
  }

  // ── Rendu principal ──────────────────────────────────────────────────────────

  render(world: World, painter: PainterState, track?: TrackState, heatmap?: HeatmapSystem): void {
    const { ctx } = this
    const W = world.width
    const H = world.height

    // Consommer les événements d'accouplement → burst de particules
    for (const ev of world.matingEvents) {
      this.spawnBurst(ev.x, ev.y, ev.color)
    }
    this.updateParticles()

    // Layer biome (grass + sable + eau) — rendu offscreen, 1 seul drawImage par frame
    ctx.drawImage(this.getBiomeLayer(world, W, H), 0, 0)

    // Tint saisonnier — overlay très subtil sur toute la carte
    ctx.globalAlpha = 0.07
    ctx.fillStyle = SEASON_COLORS[world.season.season]
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1

    // Shimmer animé — seul blur restant dans le hot path
    const shimmer = 0.18 + 0.05 * Math.sin(world.tick * 0.04)
    const waterTex = world.biomeMap.getTexture()
    ctx.save()
    ctx.filter = 'blur(5px)'
    ctx.globalAlpha = shimmer
    ctx.drawImage(waterTex, -5, -5, W + 10, H + 10)
    ctx.filter = 'none'
    ctx.restore()

    // Anneau de sélection (entité suivie)
    if (track?.entity && !track.entity.dead) {
      const e = track.entity
      const r = e.type === 'herbivore' ? 16 : 20
      const pulse = 0.55 + 0.45 * Math.sin(world.tick * 0.14)
      ctx.save()
      ctx.setLineDash([5, 3])
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#fff'
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 8
      ctx.globalAlpha = 0.45 + 0.3 * pulse
      ctx.beginPath()
      ctx.arc(e.pos.x, e.pos.y, r + pulse * 3, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // Ondes de séduction (sous les entités)
    this.renderRipples(ctx, world)

    // --- Plants ---
    for (const plant of world.plants) {
      const t = plant.energy / plant.energyMax
      if (t < 0.04) continue
      const x = plant.pos.x
      const y = plant.pos.y
      const r = 1.8 + 3.2 * t

      ctx.globalAlpha = t * t * 0.28
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(x, y, r * (1.4 + 1.6 * t), 0, TAU)
      ctx.fill()

      ctx.globalAlpha = 0.25 + 0.75 * t
      ctx.fillStyle = `hsl(${118 + t * 32}, ${35 + t * 40}%, ${22 + t * 38}%)`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // --- Mutation rings ---
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 10
    for (const herb of world.herbivores) {
      if (herb.mutationGlow <= 0.04) continue
      const t = Math.max(0, herb.energy / herb.maxEnergy)
      const [hue] = herbivoreHSL(herb.genome, t)
      const x = herb.pos.x
      const y = herb.pos.y
      const r = Math.max(3.5, Math.min(9, CONFIG.HERBIVORE_RADIUS + (herb.genome.visionRadius - CONFIG.HERBIVORE_VISION) * 0.012))
      const pulse = 0.5 + 0.5 * Math.sin(world.tick * 0.13 + herb.id * 0.5)
      ctx.shadowColor = `hsl(${hue}, 80%, 65%)`
      ctx.globalAlpha = herb.mutationGlow * 0.8
      ctx.strokeStyle = `hsl(${hue}, 65%, 85%)`
      ctx.beginPath()
      ctx.arc(x, y, r + 3.5 + pulse * 2.5, 0, TAU)
      ctx.stroke()
    }
    for (const carn of world.carnivores) {
      if (carn.mutationGlow <= 0.04) continue
      const t = Math.max(0, carn.energy / carn.maxEnergy)
      const [hue] = carnivoreHSL(carn.genome, t)
      const x = carn.pos.x
      const y = carn.pos.y
      const r = Math.max(5.5, Math.min(12, CONFIG.CARNIVORE_RADIUS + (carn.genome.visionRadius - CONFIG.CARNIVORE_VISION) * 0.012))
      const pulse = 0.5 + 0.5 * Math.sin(world.tick * 0.13 + carn.id * 0.5)
      ctx.shadowColor = `hsl(${hue}, 80%, 65%)`
      ctx.globalAlpha = carn.mutationGlow * 0.8
      ctx.strokeStyle = `hsl(${hue}, 65%, 85%)`
      ctx.beginPath()
      ctx.arc(x, y, r + 3.5 + pulse * 2.5, 0, TAU)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    // --- Herbivores ---
    for (const herb of world.herbivores) {
      const t = Math.max(0, herb.energy / herb.maxEnergy)
      const [hue, sat, l] = herbivoreHSL(herb.genome, t)
      const x = herb.pos.x
      const y = herb.pos.y
      const r = Math.max(3.5, Math.min(9, CONFIG.HERBIVORE_RADIUS + (herb.genome.visionRadius - CONFIG.HERBIVORE_VISION) * 0.012))

      ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
      ctx.shadowBlur = 12
      ctx.globalAlpha = 0.25 + 0.75 * t
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${l}%)`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.globalAlpha = t * 0.5
      ctx.fillStyle = `hsl(${hue}, 60%, 85%)`
      ctx.beginPath()
      ctx.arc(x - r * 0.28, y - r * 0.32, r * 0.38, 0, TAU)
      ctx.fill()

      const spd = herb.vel.length()
      if (spd > 0.05 && t > 0.15) {
        const nx = herb.vel.x / spd
        const ny = herb.vel.y / spd
        ctx.globalAlpha = 0.5 + 0.5 * t
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x + nx * r * 0.58, y + ny * r * 0.58, 1.6, 0, TAU)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    // --- Carnivores ---
    for (const carn of world.carnivores) {
      const t = Math.max(0, carn.energy / carn.maxEnergy)
      const [hue, sat, l] = carnivoreHSL(carn.genome, t)
      const x = carn.pos.x
      const y = carn.pos.y
      const spd = carn.vel.length()
      const angle = spd > 0.08 ? Math.atan2(carn.vel.y, carn.vel.x) : carn.wanderAngle
      const r = Math.max(5.5, Math.min(12, CONFIG.CARNIVORE_RADIUS + (carn.genome.visionRadius - CONFIG.CARNIVORE_VISION) * 0.012))

      ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
      ctx.shadowBlur = 16
      ctx.globalAlpha = 0.3 + 0.7 * t
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${l}%)`

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(r * 1.45, 0)
      ctx.bezierCurveTo(r * 0.55, -r * 0.9, -r * 0.85, -r * 0.68, -r * 0.72, 0)
      ctx.bezierCurveTo(-r * 0.85, r * 0.68, r * 0.55, r * 0.9, r * 1.45, 0)
      ctx.fill()

      if (t > 0.1) {
        ctx.shadowBlur = 0
        ctx.globalAlpha = (t - 0.1) * 0.85
        ctx.fillStyle = '#ff2020'
        ctx.beginPath()
        ctx.arc(r * 0.18, 0, r * 0.38, 0, TAU)
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    // Particules par-dessus tout
    this.renderParticles(ctx)

    // Heatmap d'activité (screen blend — glow de chaleur)
    heatmap?.render(ctx, W, H)

    // Curseur de pinceau
    if (painter.cursorVisible) {
      ctx.shadowBlur = 0
      ctx.lineWidth = 1.5
      ctx.strokeStyle = painter.activeBiome === BIOME.WATER ? '#7dd3fc' : '#86efac'
      ctx.globalAlpha = 0.8
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.arc(painter.cursorX, painter.cursorY, BRUSH_RADIUS, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }
  }
}
