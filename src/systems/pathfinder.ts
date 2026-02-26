import { Vec2 } from '../math/vec2'
import { BiomeMap, BIOME } from '../biomeMap'
import { Animal } from '../entities/animal'

const WAYPOINT_RADIUS    = 14   // px — distance pour passer au waypoint suivant
const WAYPOINT_RADIUS_SQ = WAYPOINT_RADIUS * WAYPOINT_RADIUS
const LOS_STEP           = 3    // px — pas du ray-march pour la ligne de vue
const MAX_ITERATIONS     = 6000 // limite de sécurité pour A*

// ── MinHeap ──────────────────────────────────────────────────────────────────

class MinHeap {
  private data: { idx: number; f: number }[] = []

  get size() { return this.data.length }

  push(idx: number, f: number) {
    this.data.push({ idx, f })
    this.up(this.data.length - 1)
  }

  pop(): number {
    const top = this.data[0].idx
    const last = this.data.pop()!
    if (this.data.length) { this.data[0] = last; this.down(0) }
    return top
  }

  private up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.data[p].f <= this.data[i].f) break
      ;[this.data[p], this.data[i]] = [this.data[i], this.data[p]]
      i = p
    }
  }

  private down(i: number) {
    const n = this.data.length
    for (;;) {
      let s = i
      const l = 2 * i + 1, r = l + 1
      if (l < n && this.data[l].f < this.data[s].f) s = l
      if (r < n && this.data[r].f < this.data[s].f) s = r
      if (s === i) break
      ;[this.data[s], this.data[i]] = [this.data[i], this.data[s]]
      i = s
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function hasLineOfSight(a: Vec2, b: Vec2, biomeMap: BiomeMap): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < LOS_STEP) return true
  const steps = Math.ceil(dist / LOS_STEP)
  const ix = dx / steps
  const iy = dy / steps
  for (let i = 1; i < steps; i++) {
    if (biomeMap.getBiome(a.x + ix * i, a.y + iy * i) === BIOME.WATER) return false
  }
  return true
}

// ── A* ────────────────────────────────────────────────────────────────────────

export function findPath(start: Vec2, goal: Vec2, biomeMap: BiomeMap): Vec2[] {
  const { mapW, mapH, scale } = biomeMap

  const sx = Math.floor(start.x / scale)
  const sy = Math.floor(start.y / scale)
  const gx = Math.floor(goal.x  / scale)
  const gy = Math.floor(goal.y  / scale)

  if (sx === gx && sy === gy) return []
  if (!biomeMap.isCellWalkable(sx, sy) || !biomeMap.isCellWalkable(gx, gy)) {
    return [goal]
  }

  const n = mapW * mapH
  const gScore  = new Float32Array(n).fill(Infinity)
  const parent  = new Int32Array(n).fill(-1)
  const closed  = new Uint8Array(n)

  const startIdx = sy * mapW + sx
  const goalIdx  = gy * mapW + gx

  gScore[startIdx] = 0
  const h = (cx: number, cy: number) => {
    const dx = cx - gx, dy = cy - gy
    return Math.sqrt(dx * dx + dy * dy) * scale
  }

  const heap = new MinHeap()
  heap.push(startIdx, h(sx, sy))

  // 8 directions : [dx, dy, cost]
  const DIRS = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2],
  ] as const

  let iters = 0
  while (heap.size > 0 && iters++ < MAX_ITERATIONS) {
    const idx = heap.pop()
    if (idx === goalIdx) break
    if (closed[idx]) continue
    closed[idx] = 1

    const cx = idx % mapW
    const cy = Math.floor(idx / mapW)

    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || nx >= mapW || ny < 0 || ny >= mapH) continue
      const ni = ny * mapW + nx
      if (closed[ni] || !biomeMap.isCellWalkable(nx, ny)) continue
      const ng = gScore[idx] + cost * scale
      if (ng < gScore[ni]) {
        gScore[ni] = ng
        parent[ni] = idx
        heap.push(ni, ng + h(nx, ny))
      }
    }
  }

  // Reconstruction
  if (parent[goalIdx] === -1) return [goal]

  const cells: number[] = []
  let cur = goalIdx
  while (cur !== startIdx && cur !== -1) {
    cells.push(cur)
    cur = parent[cur]
  }
  cells.reverse()

  // Convertir en world coords
  const raw = cells.map(i => new Vec2(
    (i % mapW + 0.5) * scale,
    (Math.floor(i / mapW) + 0.5) * scale,
  ))
  raw[raw.length - 1] = goal  // point final exact

  // Simplification greedy ligne de vue (string-pulling)
  return simplify(start, raw, biomeMap)
}

function simplify(start: Vec2, path: Vec2[], biomeMap: BiomeMap): Vec2[] {
  if (path.length <= 1) return path
  const out: Vec2[] = []
  let from = start
  let i = 0
  while (i < path.length) {
    let far = i
    for (let j = Math.min(path.length - 1, i + 20); j > i; j--) {
      if (hasLineOfSight(from, path[j], biomeMap)) { far = j; break }
    }
    out.push(path[far])
    from = path[far]
    i = far + 1
  }
  return out
}

// ── Interface publique pour behavior.ts ──────────────────────────────────────

/**
 * Retourne le prochain point vers lequel se diriger pour atteindre rawTarget,
 * en évitant l'eau. Gère le cache de chemin sur l'entité.
 */
export function getSeekTarget(
  animal: Animal,
  rawTarget: Vec2,
  biomeMap: BiomeMap,
): Vec2 {
  // Ligne de vue libre → pas besoin de pathfinding
  if (hasLineOfSight(animal.pos, rawTarget, biomeMap)) {
    animal.cachedPath = []
    animal.pathIndex  = 0
    return rawTarget
  }

  // Vérifier si le cache est encore valide
  const targetMoved = !animal.pathTargetPos ||
    animal.pathTargetPos.distSq(rawTarget) > 40 * 40

  if (
    animal.pathBiomeVersion !== biomeMap.version ||
    animal.cachedPath.length === 0 ||
    targetMoved
  ) {
    animal.cachedPath      = findPath(animal.pos, rawTarget, biomeMap)
    animal.pathTargetPos   = rawTarget.clone()
    animal.pathBiomeVersion = biomeMap.version
    animal.pathIndex       = 0
  }

  // Avancer le long du chemin
  while (
    animal.pathIndex < animal.cachedPath.length - 1 &&
    animal.pos.distSq(animal.cachedPath[animal.pathIndex]) < WAYPOINT_RADIUS_SQ
  ) {
    animal.pathIndex++
  }

  return animal.cachedPath[animal.pathIndex] ?? rawTarget
}
