import { PopulationSnapshot } from '../world'
import { CONFIG } from '../config'

interface HistoryEntry {
  plants: number
  herbivores: number
  carnivores: number
}

export class StatsGraph {
  private ctx: CanvasRenderingContext2D
  private history: HistoryEntry[] = []
  private maxHistory = CONFIG.STATS_HISTORY_LENGTH
  private logicalW: number
  private logicalH: number

  constructor(canvas: HTMLCanvasElement) {
    this.logicalW = canvas.width   // 220 from HTML attr
    this.logicalH = canvas.height  // 110 from HTML attr

    const dpr = window.devicePixelRatio || 1
    canvas.width = this.logicalW * dpr
    canvas.height = this.logicalH * dpr
    canvas.style.width = this.logicalW + 'px'
    canvas.style.height = this.logicalH + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2D context for stats')
    ctx.scale(dpr, dpr)
    this.ctx = ctx
  }

  record(pop: PopulationSnapshot): void {
    this.history.push({ ...pop })
    if (this.history.length > this.maxHistory) this.history.shift()
  }

  render(): void {
    const { ctx } = this
    const W = this.logicalW
    const H = this.logicalH

    ctx.clearRect(0, 0, W, H)

    if (this.history.length < 2) return

    // Find max for normalization (scaled so all fit)
    let maxVal = 1
    for (const h of this.history) {
      maxVal = Math.max(maxVal, h.plants, h.herbivores * 3, h.carnivores * 8)
    }

    const pad = { t: 6, b: 4, l: 4, r: 4 }
    const gW = W - pad.l - pad.r
    const gH = H - pad.t - pad.b

    const xOf = (i: number) => pad.l + (i / (this.maxHistory - 1)) * gW
    const yOf = (v: number) => pad.t + gH - (v / maxVal) * gH

    const drawArea = (
      key: keyof HistoryEntry,
      scale: number,
      strokeColor: string,
      fillColor: string,
    ) => {
      ctx.beginPath()
      for (let i = 0; i < this.history.length; i++) {
        const x = xOf(i)
        const y = yOf(this.history[i][key] * scale)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      // Close for fill
      const last = this.history.length - 1
      ctx.lineTo(xOf(last), pad.t + gH)
      ctx.lineTo(xOf(0), pad.t + gH)
      ctx.closePath()
      ctx.fillStyle = fillColor
      ctx.fill()

      // Re-draw line on top
      ctx.beginPath()
      for (let i = 0; i < this.history.length; i++) {
        const x = xOf(i)
        const y = yOf(this.history[i][key] * scale)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    drawArea('plants',     1, 'rgba(74,222,128,0.9)',  'rgba(74,222,128,0.08)')
    drawArea('herbivores', 3, 'rgba(96,165,250,0.9)',  'rgba(96,165,250,0.08)')
    drawArea('carnivores', 8, 'rgba(251,146,60,0.9)',  'rgba(251,146,60,0.08)')

    // Tiny legend dots
    const dots = [
      { color: '#4ade80', label: 'plantes' },
      { color: '#60a5fa', label: 'herbivores' },
      { color: '#fb923c', label: 'carnivores' },
    ]
    ctx.font = '9px system-ui, sans-serif'
    let lx = pad.l
    for (const d of dots) {
      ctx.fillStyle = d.color
      ctx.beginPath()
      ctx.arc(lx + 3, pad.t - 1, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(d.label, lx + 8, pad.t + 1.5)
      lx += ctx.measureText(d.label).width + 18
    }
  }
}
