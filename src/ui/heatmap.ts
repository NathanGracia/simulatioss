const SCALE = 20      // px per heat cell — lower = finer detail, higher cost
const DECAY = 0.986   // multiplier per rendered frame (~14 s half-life at 60 fps)

type HeatChannel = 'herb' | 'carn' | 'repro'

export class HeatmapSystem {
  enabled = false

  private cols = 0
  private rows = 0
  private herb  = new Float32Array(0)
  private carn  = new Float32Array(0)
  private repro = new Float32Array(0)
  private offscreen: HTMLCanvasElement | null = null
  private dirty = false

  resize(W: number, H: number): void {
    this.cols = Math.ceil(W / SCALE)
    this.rows = Math.ceil(H / SCALE)
    const n = this.cols * this.rows
    this.herb  = new Float32Array(n)
    this.carn  = new Float32Array(n)
    this.repro = new Float32Array(n)
    const c = document.createElement('canvas')
    c.width  = this.cols
    c.height = this.rows
    this.offscreen = c
    this.dirty = true
  }

  /** Add heat at world position (x, y) for a given channel */
  add(x: number, y: number, channel: HeatChannel, amount = 1): void {
    const cx = (x / SCALE) | 0
    const cy = (y / SCALE) | 0
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return
    const i = cy * this.cols + cx
    if      (channel === 'herb')  this.herb[i]  = Math.min(1, this.herb[i]  + amount * 0.30)
    else if (channel === 'carn')  this.carn[i]  = Math.min(1, this.carn[i]  + amount * 0.50)
    else                          this.repro[i] = Math.min(1, this.repro[i] + amount * 0.35)
    this.dirty = true
  }

  /** Fade heat trails — call once per rendered frame */
  decay(): void {
    for (let i = 0; i < this.herb.length; i++) {
      this.herb[i]  *= DECAY
      this.carn[i]  *= DECAY
      this.repro[i] *= DECAY
    }
    this.dirty = true
  }

  /** Draw heatmap over ctx (screen blend) — no-op when disabled */
  render(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (!this.enabled || !this.offscreen || this.cols === 0) return
    if (this.dirty) this._bake()
    ctx.save()
    ctx.globalAlpha = 0.75
    ctx.globalCompositeOperation = 'screen'
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.offscreen, 0, 0, W, H)
    ctx.restore()
  }

  private _bake(): void {
    const c   = this.offscreen!
    const cx  = c.getContext('2d')!
    const img = cx.createImageData(this.cols, this.rows)
    const d   = img.data
    for (let i = 0; i < this.cols * this.rows; i++) {
      const h  = this.herb[i]
      const cn = this.carn[i]
      const rp = this.repro[i]
      const total = h + cn + rp
      if (total < 0.004) continue
      const o = i * 4
      // herb → green  |  carn → red  |  repro → pink (R+B)
      d[o]     = Math.min(255, ((cn * 1.5 + rp * 0.8) * 255) | 0)
      d[o + 1] = Math.min(255, (h * 1.5 * 255) | 0)
      d[o + 2] = Math.min(255, (rp * 1.5 * 255) | 0)
      d[o + 3] = Math.min(255, (total * 110) | 0)
    }
    cx.putImageData(img, 0, 0)
    this.dirty = false
  }
}
