// half-life = 1 season = 1200 ticks  →  0.5^(1/1200) ≈ 0.99942
const DECAY  = 0.99942
const SCALE  = 10    // px per cell — finer grid, 10× upscale = bilinear looks smooth
const RADIUS = 3.0   // kernel radius in cells (~30 CSS px per event blob)

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
    const off  = document.createElement('canvas')
    off.width  = this.cols
    off.height = this.rows
    this.offscreen = off
    this.offCtx    = off.getContext('2d')!
    this.dirty = true
  }

  /**
   * Chaque événement peint un blob circulaire avec falloff linéaire.
   * Pas de blur post-traitement : l'arrondi est directement dans les Float32.
   */
  add(x: number, y: number, channel: HeatChannel, amount = 1): void {
    const baseAmt = channel === 'herb'  ? amount * 0.80
                  : channel === 'carn'  ? amount * 1.00
                  :                       amount * 0.90
    const r   = Math.ceil(RADIUS)
    const cx0 = (x / SCALE) | 0
    const cy0 = (y / SCALE) | 0
    const buf = channel === 'herb' ? this.herb
              : channel === 'carn' ? this.carn
              :                      this.repro

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d >= RADIUS) continue
        const nx = cx0 + dx
        const ny = cy0 + dy
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue
        const w = 1 - d / RADIUS        // falloff linéaire
        buf[ny * this.cols + nx] = Math.min(1, buf[ny * this.cols + nx] + baseAmt * w)
      }
    }
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
    ctx.globalAlpha = 0.70
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.offscreen, 0, 0, W, H)
    ctx.restore()
  }

  private _bake(): void {
    const { cols, rows, offCtx } = this
    if (!offCtx) return
    const img = offCtx.createImageData(cols, rows)
    const d   = img.data
    for (let i = 0; i < cols * rows; i++) {
      const h  = this.herb[i]
      const cn = this.carn[i]
      const rp = this.repro[i]
      const maxV = Math.max(h, cn, rp)
      if (maxV < 0.01) continue
      const o = i * 4
      d[o]     = Math.min(255, ((cn + rp * 0.7) * 255) | 0)  // R — carn=rouge, repro=magenta
      d[o + 1] = Math.min(255, (h * 255) | 0)                 // G — herb=vert
      d[o + 2] = Math.min(255, (rp * 255) | 0)                // B — repro=violet
      d[o + 3] = Math.min(255, (maxV * 255) | 0)              // A — pleine intensité
    }
    offCtx.putImageData(img, 0, 0)
    this.dirty = false
  }
}
