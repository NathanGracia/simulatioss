const SCALE = 20      // px per heat cell
const DECAY = 0.991   // per rendered frame (~75 s half-life at 60 fps)

type HeatChannel = 'herb' | 'carn' | 'repro'

export class HeatmapSystem {
  enabled = false

  private cols = 0
  private rows = 0
  private herb  = new Float32Array(0)
  private carn  = new Float32Array(0)
  private repro = new Float32Array(0)
  private offscreen: HTMLCanvasElement | null = null
  private offCtx:    CanvasRenderingContext2D | null = null
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
    this.offCtx    = c.getContext('2d')!
    this.dirty = true
  }

  add(x: number, y: number, channel: HeatChannel, amount = 1): void {
    const cx = (x / SCALE) | 0
    const cy = (y / SCALE) | 0
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return
    const i = cy * this.cols + cx
    if      (channel === 'herb')  this.herb[i]  = Math.min(1, this.herb[i]  + amount * 0.60)
    else if (channel === 'carn')  this.carn[i]  = Math.min(1, this.carn[i]  + amount * 0.90)
    else                          this.repro[i] = Math.min(1, this.repro[i] + amount * 0.70)
    this.dirty = true
  }

  decay(): void {
    for (let i = 0; i < this.herb.length; i++) {
      this.herb[i]  *= DECAY
      this.carn[i]  *= DECAY
      this.repro[i] *= DECAY
    }
    this.dirty = true
  }

  render(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (!this.enabled || !this.offscreen || this.cols === 0) return
    if (this.dirty) this._bake()
    ctx.save()
    ctx.globalAlpha = 0.60
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.offscreen, 0, 0, W, H)
    ctx.restore()
  }

  private _bake(): void {
    const { cols, rows, offCtx: cx } = this
    if (!cx) return
    const img = cx.createImageData(cols, rows)
    const d   = img.data
    for (let i = 0; i < cols * rows; i++) {
      const h  = this.herb[i]
      const cn = this.carn[i]
      const rp = this.repro[i]
      const maxV = Math.max(h, cn, rp)
      if (maxV < 0.01) continue
      const o = i * 4
      // herb=green  carn=red  repro=magenta
      d[o]     = Math.min(255, ((cn + rp * 0.7) * 255) | 0)   // R
      d[o + 1] = Math.min(255, (h * 255) | 0)                  // G
      d[o + 2] = Math.min(255, (rp * 255) | 0)                 // B
      d[o + 3] = Math.min(255, (maxV * 255) | 0)               // A — full intensity
    }
    cx.putImageData(img, 0, 0)
    this.dirty = false
  }
}
