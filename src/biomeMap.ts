import { CONFIG } from './config'

export const BIOME = { PRAIRIE: 0, WATER: 1 } as const

// ── Couleur du sable — modifier ici ──────────────────────────────────────────
const BEACH_COLOR = { r: 194, g: 158, b: 82, a: 215 }
export type BiomeType = typeof BIOME[keyof typeof BIOME]

export class BiomeMap {
  readonly mapW: number
  readonly mapH: number
  readonly scale: number

  private cells: Uint8Array
  private texture: HTMLCanvasElement
  private texCtx: CanvasRenderingContext2D
  private beachTexture: HTMLCanvasElement
  private beachTexCtx: CanvasRenderingContext2D
  private dirty = true
  private distField: Float32Array | null = null

  /** Incrémenté à chaque coup de pinceau — invalide les caches de chemin des entités */
  version = 0

  get isDirty() { return this.dirty }

  isCellWalkable(cx: number, cy: number): boolean {
    if (cx < 0 || cx >= this.mapW || cy < 0 || cy >= this.mapH) return false
    return this.cells[cy * this.mapW + cx] !== BIOME.WATER
  }

  constructor(worldWidth: number, worldHeight: number, scale = 5) {
    this.scale = scale
    this.mapW = Math.ceil(worldWidth / scale)
    this.mapH = Math.ceil(worldHeight / scale)
    this.cells = new Uint8Array(this.mapW * this.mapH)

    this.texture = document.createElement('canvas')
    this.texture.width = this.mapW
    this.texture.height = this.mapH
    this.texCtx = this.texture.getContext('2d')!

    this.beachTexture = document.createElement('canvas')
    this.beachTexture.width = this.mapW
    this.beachTexture.height = this.mapH
    this.beachTexCtx = this.beachTexture.getContext('2d')!

    this.generateLakes(worldWidth, worldHeight)
  }

  // ── Génération procédurale ────────────────────────────────────────────────

  private generateLakes(W: number, H: number): void {
    const margin = Math.min(W, H) * 0.12
    const innerW = W - margin * 2
    const innerH = H - margin * 2
    const minDim = Math.min(W, H)

    // Lacs principaux distribués
    const placed: [number, number][] = []
    for (let i = 0; i < CONFIG.LAKE_COUNT; i++) {
      let cx = 0, cy = 0
      for (let attempt = 0; attempt < 30; attempt++) {
        cx = margin + Math.random() * innerW
        cy = margin + Math.random() * innerH
        const tooClose = placed.some(([px, py]) => Math.hypot(cx - px, cy - py) < W * 0.22)
        if (!tooClose) break
      }
      placed.push([cx, cy])
      const baseR = minDim * CONFIG.LAKE_SIZE * (0.8 + Math.random() * 0.4)
      this.paintLake(cx, cy, baseR)
    }

    // Petits étangs
    for (let i = 0; i < CONFIG.LAKE_PONDS; i++) {
      const cx = margin + Math.random() * innerW
      const cy = margin + Math.random() * innerH
      const baseR = minDim * CONFIG.LAKE_SIZE * (0.25 + Math.random() * 0.15)
      this.paintLake(cx, cy, baseR)
    }

    this.dirty = true
    this.distField = null
  }

  private paintLake(cx: number, cy: number, baseR: number): void {
    // Forme organique : rayon déformé par plusieurs ondes sinusoïdales
    const waves = [
      { freq: 2, amp: 0.22, phase: Math.random() * Math.PI * 2 },
      { freq: 3, amp: 0.14, phase: Math.random() * Math.PI * 2 },
      { freq: 5, amp: 0.08, phase: Math.random() * Math.PI * 2 },
      { freq: 7, amp: 0.04, phase: Math.random() * Math.PI * 2 },
    ]
    // Étirement elliptique aléatoire pour casser la symétrie
    const sx = 0.7 + Math.random() * 0.6
    const sy = 0.7 + Math.random() * 0.6

    const maxR = baseR * 1.6
    const cxC = Math.floor(cx / this.scale)
    const cyC = Math.floor(cy / this.scale)
    const crC = Math.ceil(maxR / this.scale) + 1

    for (let dy = -crC; dy <= crC; dy++) {
      for (let dx = -crC; dx <= crC; dx++) {
        const nx = cxC + dx
        const ny = cyC + dy
        if (nx < 0 || nx >= this.mapW || ny < 0 || ny >= this.mapH) continue

        const wx = (dx * this.scale) / sx
        const wy = (dy * this.scale) / sy
        const dist = Math.sqrt(wx * wx + wy * wy)
        const angle = Math.atan2(wy, wx)

        let r = baseR
        for (const w of waves) r += baseR * w.amp * Math.sin(w.freq * angle + w.phase)

        if (dist < r) this.cells[ny * this.mapW + nx] = BIOME.WATER
      }
    }
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Retourne une force de répulsion normalisée s'éloignant des cellules d'eau
   * dans le rayon donné, ou null si aucune eau à proximité.
   */
  getWaterRepulsion(worldX: number, worldY: number, radius: number): { x: number; y: number } | null {
    const cx = Math.floor(worldX / this.scale)
    const cy = Math.floor(worldY / this.scale)
    const cr = Math.ceil(radius / this.scale)
    let fx = 0
    let fy = 0

    for (let dy = -cr; dy <= cr; dy++) {
      for (let dx = -cr; dx <= cr; dx++) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || nx >= this.mapW || ny < 0 || ny >= this.mapH) continue
        if (this.cells[ny * this.mapW + nx] !== BIOME.WATER) continue

        const cellX = (nx + 0.5) * this.scale
        const cellY = (ny + 0.5) * this.scale
        const ddx = worldX - cellX
        const ddy = worldY - cellY
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist < 0.01 || dist > radius) continue

        const strength = (radius - dist) / radius
        fx += (ddx / dist) * strength
        fy += (ddy / dist) * strength
      }
    }

    if (fx === 0 && fy === 0) return null
    const len = Math.sqrt(fx * fx + fy * fy)
    return { x: fx / len, y: fy / len }
  }

  getBiome(worldX: number, worldY: number): BiomeType {
    const cx = Math.floor(worldX / this.scale)
    const cy = Math.floor(worldY / this.scale)
    if (cx < 0 || cx >= this.mapW || cy < 0 || cy >= this.mapH) return BIOME.PRAIRIE
    return this.cells[cy * this.mapW + cx] as BiomeType
  }

  /** O(1) — utilise un distance field précalculé par BFS */
  isNearWater(worldX: number, worldY: number, radius: number): boolean {
    if (!this.distField) this.buildDistField()
    const cx = Math.floor(worldX / this.scale)
    const cy = Math.floor(worldY / this.scale)
    if (cx < 0 || cx >= this.mapW || cy < 0 || cy >= this.mapH) return false
    return this.distField![cy * this.mapW + cx] <= radius
  }

  private buildDistField(): void {
    const n = this.mapW * this.mapH
    const dist = new Float32Array(n).fill(Infinity)
    const visited = new Uint8Array(n)
    const queue: number[] = []

    // Initialiser depuis toutes les cellules eau
    for (let i = 0; i < n; i++) {
      if (this.cells[i] === BIOME.WATER) {
        dist[i] = 0
        visited[i] = 1
        queue.push(i)
      }
    }

    // BFS — chaque cellule visitée une seule fois, O(n) garanti
    for (let qi = 0; qi < queue.length; qi++) {
      const idx = queue[qi]
      const cx = idx % this.mapW
      const cy = Math.floor(idx / this.mapW)
      const d = dist[idx]

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || nx >= this.mapW || ny < 0 || ny >= this.mapH) continue
          const ni = ny * this.mapW + nx
          if (visited[ni]) continue
          visited[ni] = 1
          dist[ni] = d + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1) * this.scale
          queue.push(ni)
        }
      }
    }
    this.distField = dist
  }

  // ── Peinture ──────────────────────────────────────────────────────────────

  paint(worldX: number, worldY: number, brushRadius: number, biome: BiomeType): void {
    const cx = Math.floor(worldX / this.scale)
    const cy = Math.floor(worldY / this.scale)
    const br = Math.ceil(brushRadius / this.scale)
    const br2 = br * br
    for (let dy = -br; dy <= br; dy++) {
      for (let dx = -br; dx <= br; dx++) {
        if (dx * dx + dy * dy > br2) continue
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || nx >= this.mapW || ny < 0 || ny >= this.mapH) continue
        this.cells[ny * this.mapW + nx] = biome
      }
    }
    this.dirty = true
    this.distField = null
    this.version++
  }

  // ── Texture ───────────────────────────────────────────────────────────────

  getTexture(): HTMLCanvasElement {
    if (this.dirty) { this.bakeTexture(); this.dirty = false }
    return this.texture
  }

  getBeachTexture(): HTMLCanvasElement {
    if (this.dirty) { this.bakeTexture(); this.dirty = false }
    return this.beachTexture
  }

  private bakeTexture(): void {
    const water = this.texCtx.createImageData(this.mapW, this.mapH)
    const beach = this.beachTexCtx.createImageData(this.mapW, this.mapH)
    const wd = water.data
    const bd = beach.data

    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === BIOME.WATER) {
        const off = i * 4
        // Eau — bleu profond
        wd[off] = 10; wd[off + 1] = 72; wd[off + 2] = 190; wd[off + 3] = 210
        // Sable
        bd[off] = BEACH_COLOR.r; bd[off + 1] = BEACH_COLOR.g
        bd[off + 2] = BEACH_COLOR.b; bd[off + 3] = BEACH_COLOR.a
      }
    }
    this.texCtx.putImageData(water, 0, 0)
    this.beachTexCtx.putImageData(beach, 0, 0)
  }
}
