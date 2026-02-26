import { World } from '../world'
import { CONFIG } from '../config'
import { Genome } from '../genetics/genome'
import { Herbivore } from '../entities/herbivore'
import { Carnivore } from '../entities/carnivore'

// ── Collecte des données ──────────────────────────────────────────────────────

interface GeneSnapshot {
  hSpeed: number; hVision: number; hDrain: number
  hFear: number;  hCooldown: number; hCost: number
  cSpeed: number; cVision: number; cDrain: number
  cCooldown: number; cCost: number
}

function avg(animals: Array<Herbivore | Carnivore>, key: keyof Genome): number {
  if (!animals.length) return 0
  let sum = 0
  for (const a of animals) sum += a.genome[key]
  return sum / animals.length
}

export class GeneticHistory {
  readonly history: GeneSnapshot[] = []
  private readonly maxLen = CONFIG.STATS_HISTORY_LENGTH

  record(world: World): void {
    const h = world.herbivores
    const c = world.carnivores
    this.history.push({
      hSpeed:    avg(h, 'speed'),          hVision:   avg(h, 'visionRadius'),
      hDrain:    avg(h, 'energyDrain'),    hFear:     avg(h, 'fearRadius'),
      hCooldown: avg(h, 'reprCooldown'),   hCost:     avg(h, 'reprCostEnergy'),
      cSpeed:    avg(c, 'speed'),          cVision:   avg(c, 'visionRadius'),
      cDrain:    avg(c, 'energyDrain'),
      cCooldown: avg(c, 'reprCooldown'),   cCost:     avg(c, 'reprCostEnergy'),
    })
    if (this.history.length > this.maxLen) this.history.shift()
  }
}

// ── Définition des graphes ────────────────────────────────────────────────────

interface GraphDef {
  title: string
  hKey: keyof GeneSnapshot
  cKey: (keyof GeneSnapshot) | null
}

const GRAPH_DEFS: GraphDef[] = [
  { title: 'Vitesse',          hKey: 'hSpeed',    cKey: 'cSpeed'    },
  { title: 'Vision',           hKey: 'hVision',   cKey: 'cVision'   },
  { title: 'Drain énergie',    hKey: 'hDrain',    cKey: 'cDrain'    },
  { title: 'Cooldown reprod.', hKey: 'hCooldown', cKey: 'cCooldown' },
  { title: 'Coût reprod.',     hKey: 'hCost',     cKey: 'cCost'     },
  { title: 'Rayon de peur',    hKey: 'hFear',     cKey: null        },
]

const GW = 186  // largeur logique canvas
const GH = 108  // hauteur logique canvas

// ── Rendu d'un graphe ─────────────────────────────────────────────────────────

function drawGraph(
  ctx: CanvasRenderingContext2D,
  history: GeneSnapshot[],
  def: GraphDef,
): void {
  ctx.clearRect(0, 0, GW, GH)

  if (history.length < 2) {
    ctx.font = '9px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText('En attente…', 10, GH / 2 + 4)
    return
  }

  const pad = { t: 22, b: 6, l: 6, r: 6 }
  const gW = GW - pad.l - pad.r
  const gH = GH - pad.t - pad.b
  const maxLen = CONFIG.STATS_HISTORY_LENGTH

  // Calcul min/max global pour l'échelle Y
  let lo = Infinity, hi = -Infinity
  for (const s of history) {
    const hv = s[def.hKey] as number
    if (hv > 0) { lo = Math.min(lo, hv); hi = Math.max(hi, hv) }
    if (def.cKey) {
      const cv = s[def.cKey] as number
      if (cv > 0) { lo = Math.min(lo, cv); hi = Math.max(hi, cv) }
    }
  }
  if (!isFinite(lo)) return
  const range = hi - lo || hi * 0.1 || 1
  lo -= range * 0.12
  hi += range * 0.12

  const xOf = (i: number) => pad.l + (i / (maxLen - 1)) * gW
  const yOf = (v: number) => pad.t + gH - ((v - lo) / (hi - lo)) * gH

  // Grille horizontale légère
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let i = 1; i <= 3; i++) {
    const y = pad.t + (gH / 4) * i
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gW, y); ctx.stroke()
  }

  const drawSeries = (key: keyof GeneSnapshot, stroke: string, fill: string) => {
    const pts = history.map((s, i) => ({ x: xOf(i), y: yOf(s[key] as number) }))

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.lineTo(pts[pts.length - 1].x, pad.t + gH)
    ctx.lineTo(pts[0].x, pad.t + gH)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Point courant
    const last = pts[pts.length - 1]
    ctx.fillStyle = stroke
    ctx.beginPath()
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  drawSeries(def.hKey, '#60a5fa', 'rgba(96,165,250,0.10)')
  if (def.cKey) drawSeries(def.cKey, '#fb923c', 'rgba(251,146,60,0.10)')

  // Titre
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText(def.title, pad.l, 14)

  // Valeurs courantes (top-right)
  const last = history[history.length - 1]
  const hv = (last[def.hKey] as number).toFixed(1)
  const valStr = def.cKey
    ? `${hv} / ${(last[def.cKey] as number).toFixed(1)}`
    : hv
  ctx.font = '8px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  const tw = ctx.measureText(valStr).width
  ctx.fillText(valStr, GW - pad.r - tw, 14)

  // Min/max Y labels
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = '7px system-ui, sans-serif'
  ctx.fillText(hi.toFixed(1), pad.l + 2, pad.t + 7)
  ctx.fillText(lo.toFixed(1), pad.l + 2, pad.t + gH)
}

// ── Setup modal ───────────────────────────────────────────────────────────────

export function setupGeneticModal(history: GeneticHistory): { render(): void; toggle(): void } {
  const dpr     = window.devicePixelRatio || 1
  const overlay = document.getElementById('genetic-modal')!
  const grid    = overlay.querySelector('.gm-grid') as HTMLElement
  const closeBtn = document.getElementById('gm-close')!

  const ctxs: CanvasRenderingContext2D[] = []

  for (const def of GRAPH_DEFS) {
    const wrap = document.createElement('div')
    wrap.className = 'gm-graph-wrap'
    wrap.setAttribute('data-title', def.title)

    const c = document.createElement('canvas')
    c.width  = GW * dpr
    c.height = GH * dpr
    c.style.width  = GW + 'px'
    c.style.height = GH + 'px'

    const cx = c.getContext('2d')!
    cx.scale(dpr, dpr)

    wrap.appendChild(c)
    grid.appendChild(wrap)
    ctxs.push(cx)
  }

  function render(): void {
    if (!overlay.classList.contains('visible')) return
    for (let i = 0; i < GRAPH_DEFS.length; i++) {
      drawGraph(ctxs[i], history.history, GRAPH_DEFS[i])
    }
  }

  function toggle(): void {
    const wasOpen = overlay.classList.toggle('visible')
    if (wasOpen) render()
  }

  closeBtn.addEventListener('click', () => overlay.classList.remove('visible'))
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('visible') })
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey && (e.key === 'g' || e.key === 'G')) toggle()
  })

  return { render, toggle }
}
