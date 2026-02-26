// half-life = 1 season = 1200 ticks  →  0.5^(1/1200) ≈ 0.99942
const DECAY = 0.99942
const SCALE = 20  // px per heat cell

type HeatChannel = 'herb' | 'carn' | 'repro'

export class HeatmapSystem {
  enabled = false

  private cols = 0
  private rows = 0
  private herb  = new Float32Array(0)
  private carn  = new Float32Array(0)
  private repro = new Float32Array(0)

  // rawCanvas  — reçoit le putImageData brut (tiny)
  private rawCanvas: HTMLCanvasElement | null = null
  private rawCtx:    CanvasRenderingContext2D | null = null
  // offscreen  — reçoit le rendu flou pré-baked, drawImage en 1 appel
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

    const raw = document.createElement('canvas')
    raw.width = this.cols; raw.height = this.rows
    this.rawCanvas = raw
    this.rawCtx    = raw.getContext('2d')!

    const off = document.createElement('canvas')
    off.width = this.cols; off.height = this.rows
    this.offscreen = off
    this.offCtx    = off.getContext('2d')!

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
    const { cols, rows, rawCtx, offCtx } = this
    if (!rawCtx || !offCtx) return

    // 1. Écrire les valeurs brutes dans rawCanvas
    const img = rawCtx.createImageData(cols, rows)
    const d   = img.data
    for (let i = 0; i < cols * rows; i++) {
      const h  = this.herb[i]
      const cn = this.carn[i]
      const rp = this.repro[i]
      const maxV = Math.max(h, cn, rp)
      if (maxV < 0.01) continue
      const o = i * 4
      d[o]     = Math.min(255, ((cn + rp * 0.7) * 255) | 0)   // R — carn=rouge, repro=magenta
      d[o + 1] = Math.min(255, (h * 255) | 0)                  // G — herb=vert
      d[o + 2] = Math.min(255, (rp * 255) | 0)                 // B — repro=rose/bleu
      d[o + 3] = Math.min(255, (maxV * 255) | 0)
    }
    rawCtx.putImageData(img, 0, 0)

    // 2. Dessiner rawCanvas → offscreen avec un flou gaussien
    //    blur(2px) sur 96×54 ≈ blur(40px) une fois étiré à l'écran : très smooth
    offCtx.clearRect(0, 0, cols, rows)
    offCtx.save()
    offCtx.filter = 'blur(2px)'
    offCtx.drawImage(this.rawCanvas!, 0, 0)
    offCtx.restore()

    this.dirty = false
  }
}
