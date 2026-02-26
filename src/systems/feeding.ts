import { Herbivore } from '../entities/herbivore'
import { Carnivore } from '../entities/carnivore'
import { Plant } from '../entities/plant'
import { CONFIG } from '../config'

/** Herbivore eats the nearest plant within EAT_DISTANCE. Returns true if ate. */
export function herbivoreFeed(herb: Herbivore, plants: Plant[]): boolean {
  for (const plant of plants) {
    if (plant.dead) continue
    if (herb.pos.dist(plant.pos) <= CONFIG.EAT_DISTANCE) {
      const gained = plant.consume()
      herb.energy = Math.min(herb.maxEnergy, herb.energy + gained)
      return true
    }
  }
  return false
}

/** Carnivore eats the nearest herbivore within EAT_DISTANCE. Returns true if ate. */
export function carnivoreFeed(carn: Carnivore, herbivores: Herbivore[]): boolean {
  for (const herb of herbivores) {
    if (herb.dead) continue
    if (carn.pos.dist(herb.pos) <= CONFIG.EAT_DISTANCE) {
      herb.dead = true
      carn.energy = Math.min(carn.maxEnergy, carn.energy + CONFIG.CARNIVORE_ENERGY_FROM_HERBIVORE)
      return true
    }
  }
  return false
}
