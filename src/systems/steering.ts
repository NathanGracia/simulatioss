import { Vec2 } from '../math/vec2'
import { Animal } from '../entities/animal'
import { CONFIG } from '../config'

/**
 * Force boids combinée : séparation + alignement + cohésion.
 * À appliquer uniquement sur les congénères (même type, même troupeau).
 */
export function flockForce(animal: Animal, neighbors: Animal[]): Vec2 {
  const SEP_R  = CONFIG.FLOCK_SEPARATION_RADIUS
  const SEP_W  = CONFIG.FLOCK_SEPARATION_WEIGHT
  const ALIGN_W = CONFIG.FLOCK_ALIGNMENT_WEIGHT
  const COH_W  = CONFIG.FLOCK_COHESION_WEIGHT

  let sepX = 0, sepY = 0, sepN = 0
  let alignX = 0, alignY = 0
  let cohX = 0, cohY = 0, cohN = 0

  for (const n of neighbors) {
    if (n === animal) continue
    const dx = animal.pos.x - n.pos.x
    const dy = animal.pos.y - n.pos.y
    const dSq = dx * dx + dy * dy

    // Séparation — pondérée par l'inverse de la distance (plus fort quand très proche)
    if (dSq < SEP_R * SEP_R && dSq > 0) {
      const d = Math.sqrt(dSq)
      sepX += dx / (d * d)
      sepY += dy / (d * d)
      sepN++
    }

    // Alignement + cohésion sur tout le voisinage
    alignX += n.vel.x
    alignY += n.vel.y
    cohX += n.pos.x
    cohY += n.pos.y
    cohN++
  }

  let fx = 0, fy = 0

  if (sepN > 0) {
    const len = Math.sqrt(sepX * sepX + sepY * sepY)
    if (len > 0) {
      fx += (sepX / len) * animal.maxSpeed * SEP_W
      fy += (sepY / len) * animal.maxSpeed * SEP_W
    }
  }

  if (cohN > 0) {
    // Alignement — s'aligner sur la vélocité moyenne
    fx += (alignX / cohN - animal.vel.x) * ALIGN_W
    fy += (alignY / cohN - animal.vel.y) * ALIGN_W

    // Cohésion — se diriger vers le centroïde
    const toCx = cohX / cohN - animal.pos.x
    const toCy = cohY / cohN - animal.pos.y
    const toCLen = Math.sqrt(toCx * toCx + toCy * toCy)
    if (toCLen > 0) {
      fx += (toCx / toCLen) * animal.maxSpeed * COH_W
      fy += (toCy / toCLen) * animal.maxSpeed * COH_W
    }
  }

  return new Vec2(fx, fy)
}

const WANDER_ANGLE_DELTA = 0.4

export function seek(animal: Animal, target: Vec2): Vec2 {
  const desired = target.sub(animal.pos).normalize().scale(animal.maxSpeed)
  return desired
}

export function flee(animal: Animal, threat: Vec2): Vec2 {
  const desired = animal.pos.sub(threat).normalize().scale(animal.maxSpeed)
  return desired
}

export function wander(animal: Animal): Vec2 {
  // Gradually drift the wander angle
  animal.wanderAngle += (Math.random() - 0.5) * WANDER_ANGLE_DELTA * 2
  return Vec2.fromAngle(animal.wanderAngle, animal.maxSpeed)
}

/** Apply steering: lerp velocity toward desired, clamp to maxSpeed */
export function applyVelocity(animal: Animal, desired: Vec2): void {
  animal.vel = animal.vel.lerp(desired, 0.15).clampLength(animal.maxSpeed)
}

/**
 * Retourne une force normalée qui pousse l'animal loin des bords,
 * ou null si l'animal est loin de tout bord.
 * Force proportionnelle à la proximité (0 au bord de la marge, 1 au bord du monde).
 */
export function wallAvoid(pos: Vec2, width: number, height: number): Vec2 | null {
  const m = CONFIG.WALL_MARGIN
  let fx = 0
  let fy = 0
  if (pos.x < m)          fx += 1 - pos.x / m
  if (pos.x > width - m)  fx -= 1 - (width - pos.x) / m
  if (pos.y < m)          fy += 1 - pos.y / m
  if (pos.y > height - m) fy -= 1 - (height - pos.y) / m
  if (fx === 0 && fy === 0) return null
  return new Vec2(fx, fy).normalize()
}
