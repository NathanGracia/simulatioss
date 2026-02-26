import { Vec2 } from '../math/vec2'
import { Animal } from '../entities/animal'
import { CONFIG } from '../config'

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
