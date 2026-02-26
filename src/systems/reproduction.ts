import { Herbivore } from '../entities/herbivore'
import { Carnivore } from '../entities/carnivore'
import { CONFIG } from '../config'

export function tryReproduceHerbivore(
  herb: Herbivore,
  nearbyHerbivores: Herbivore[],
  totalCount: number,
): Herbivore | null {
  if (totalCount >= CONFIG.HERBIVORE_MAX_COUNT) return null
  if (herb.reprTimer > 0) { herb.reprTimer--; return null }
  if (herb.energy < herb.reprThreshold) return null

  // Find a partner
  for (const other of nearbyHerbivores) {
    if (other === herb || other.dead) continue
    if (other.energy < other.reprThreshold) continue
    if (herb.pos.dist(other.pos) <= CONFIG.REPR_DISTANCE) {
      herb.energy -= herb.reprCostEnergy
      herb.reprTimer = herb.reprCooldown
      return herb.spawnOffspring(other.genome)
    }
  }
  return null
}

export function tryReproduceCarnivore(
  carn: Carnivore,
  nearbyCarnivores: Carnivore[],
  totalCount: number,
): Carnivore | null {
  if (totalCount >= CONFIG.CARNIVORE_MAX_COUNT) return null
  if (carn.reprTimer > 0) { carn.reprTimer--; return null }
  if (carn.energy < carn.reprThreshold) return null

  for (const other of nearbyCarnivores) {
    if (other === carn || other.dead) continue
    if (other.energy < other.reprThreshold) continue
    if (carn.pos.dist(other.pos) <= CONFIG.REPR_DISTANCE) {
      carn.energy -= carn.reprCostEnergy
      carn.reprTimer = carn.reprCooldown
      return carn.spawnOffspring(other.genome)
    }
  }
  return null
}
