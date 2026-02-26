import { Animal } from '../entities/animal'
import { CONFIG } from '../config'

const DRAIN_BY_TYPE: Record<string, number> = {
  herbivore: CONFIG.HERBIVORE_ENERGY_DRAIN,
  carnivore: CONFIG.CARNIVORE_ENERGY_DRAIN,
}

/** Drain metabolic energy each tick. Mark dead if starved. */
export function drainEnergy(animal: Animal): void {
  animal.energy -= DRAIN_BY_TYPE[animal.type] ?? 0.5
  animal.age++

  if (animal.energy <= 0) {
    animal.dead = true
  }
}
