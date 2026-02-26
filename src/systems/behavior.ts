import { Vec2 } from '../math/vec2'
import { Herbivore } from '../entities/herbivore'
import { Carnivore } from '../entities/carnivore'
import { Plant } from '../entities/plant'
import { Entity } from '../entities/entity'
import { seek, flee, wander, applyVelocity, wallAvoid } from './steering'
import { getSeekTarget } from './pathfinder'
import { BiomeMap, BIOME } from '../biomeMap'

const WATER_REPULSION_RADIUS = 4 // px

/** Combine wall avoidance + water repulsion. Retourne null si aucun obstacle proche. */
function avoidObstacles(
  animal: Herbivore | Carnivore,
  worldWidth: number,
  worldHeight: number,
  biomeMap: BiomeMap,
): Vec2 | null {
  const wf = wallAvoid(animal.pos, worldWidth, worldHeight)
  const wr = biomeMap.getWaterRepulsion(animal.pos.x, animal.pos.y, WATER_REPULSION_RADIUS)

  if (!wf && !wr) return null

  let fx = (wf?.x ?? 0) + (wr?.x ?? 0)
  let fy = (wf?.y ?? 0) + (wr?.y ?? 0)
  const len = Math.sqrt(fx * fx + fy * fy)
  return new Vec2(fx / len, fy / len)
}

/**
 * Herbivore behavior priority:
 * 1. Flee if carnivore within fearRadius
 * 2. Eat if plant nearby and hungry
 * 3. Reproduce (handled externally — just move toward partner)
 * 4. Wander
 */
export function updateHerbivioreBehavior(
  herb: Herbivore,
  neighbors: Entity[],
  worldWidth: number,
  worldHeight: number,
  biomeMap: BiomeMap,
): void {
  // 0. Wall + water avoidance — priorité absolue
  const avoid = avoidObstacles(herb, worldWidth, worldHeight, biomeMap)
  if (avoid) {
    const desired = avoid.scale(herb.maxSpeed * 1.4)
    applyVelocity(herb, desired)
    herb.wanderAngle = Math.atan2(desired.y, desired.x)
    return
  }

  // 1. Fear — flee from nearest carnivore
  let nearestCarn: Entity | null = null
  let nearestCarnDistSq = Infinity
  for (const n of neighbors) {
    if (n.type !== 'carnivore' || n.dead) continue
    const dSq = herb.pos.distSq(n.pos)
    if (dSq < herb.fearRadius * herb.fearRadius && dSq < nearestCarnDistSq) {
      nearestCarnDistSq = dSq
      nearestCarn = n
    }
  }
  if (nearestCarn) {
    // Boost speed when fleeing
    const savedSpeed = herb.maxSpeed
    herb.maxSpeed = Math.max(herb.maxSpeed, 2.0)
    applyVelocity(herb, flee(herb, nearestCarn.pos))
    herb.maxSpeed = savedSpeed
    return
  }

  // 2. Hunger — seek nearest plant
  if (herb.energy < herb.hungerThreshold) {
    let nearestPlant: Entity | null = null
    let nearestPlantDistSq = Infinity
    for (const n of neighbors) {
      if (n.type !== 'plant' || n.dead) continue
      const dSq = herb.pos.distSq(n.pos)
      if (dSq < nearestPlantDistSq) {
        nearestPlantDistSq = dSq
        nearestPlant = n
      }
    }
    if (nearestPlant) {
      applyVelocity(herb, seek(herb, getSeekTarget(herb, nearestPlant.pos, biomeMap)))
      return
    }
  }

  // 3. Reproduce — seek nearby partner (handled externally for spawning; just steer here)
  if (herb.energy >= herb.reprThreshold && herb.reprTimer === 0) {
    for (const n of neighbors) {
      if (n === herb || n.type !== 'herbivore' || n.dead) continue
      const nh = n as Herbivore
      if (nh.energy >= nh.reprThreshold) {
        applyVelocity(herb, seek(herb, n.pos))
        return
      }
    }
  }

  // 4. Wander
  applyVelocity(herb, wander(herb))
}

/**
 * Carnivore behavior priority:
 * 1. Hunt if herbivore nearby and hungry
 * 2. Reproduce
 * 3. Wander
 */
export function updateCarnivoreBehavior(
  carn: Carnivore,
  neighbors: Entity[],
  worldWidth: number,
  worldHeight: number,
  biomeMap: BiomeMap,
): void {
  // 0. Wall + water avoidance
  const avoid = avoidObstacles(carn, worldWidth, worldHeight, biomeMap)
  if (avoid) {
    const desired = avoid.scale(carn.maxSpeed * 1.4)
    applyVelocity(carn, desired)
    carn.wanderAngle = Math.atan2(desired.y, desired.x)
    return
  }

  // 1. Hunt — seek nearest herbivore when hungry
  if (carn.energy < carn.hungerThreshold) {
    let nearestPrey: Entity | null = null
    let nearestPreyDistSq = Infinity
    for (const n of neighbors) {
      if (n.type !== 'herbivore' || n.dead) continue
      const dSq = carn.pos.distSq(n.pos)
      if (dSq < nearestPreyDistSq) {
        nearestPreyDistSq = dSq
        nearestPrey = n
      }
    }
    if (nearestPrey) {
      applyVelocity(carn, seek(carn, getSeekTarget(carn, nearestPrey.pos, biomeMap)))
      return
    }
  }

  // 2. Reproduce
  if (carn.energy >= carn.reprThreshold && carn.reprTimer === 0) {
    for (const n of neighbors) {
      if (n === carn || n.type !== 'carnivore' || n.dead) continue
      const nc = n as Carnivore
      if (nc.energy >= nc.reprThreshold) {
        applyVelocity(carn, seek(carn, n.pos))
        return
      }
    }
  }

  // 3. Wander
  applyVelocity(carn, wander(carn))
}

/** Move entity, clamp position + revert si l'entité finit dans l'eau */
export function moveAndBound(
  entity: { pos: Vec2; vel: Vec2 },
  width: number,
  height: number,
  biomeMap: BiomeMap,
): void {
  const prev = entity.pos
  entity.pos = entity.pos.add(entity.vel)

  // Clamp bords
  entity.pos = new Vec2(
    Math.max(0, Math.min(width,  entity.pos.x)),
    Math.max(0, Math.min(height, entity.pos.y)),
  )

  // Revert si l'entité finit dans l'eau
  if (biomeMap.getBiome(entity.pos.x, entity.pos.y) === BIOME.WATER) {
    entity.pos = prev
    entity.vel = entity.vel.scale(-0.3)
  }
}
