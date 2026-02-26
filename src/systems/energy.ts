import { Animal } from '../entities/animal'
import { CONFIG } from '../config'

const BASE_SPEED: Record<string, number> = {
  herbivore: CONFIG.HERBIVORE_SPEED,
  carnivore: CONFIG.CARNIVORE_SPEED,
}

/** Drain metabolic energy each tick. Mark dead if starved. */
export function drainEnergy(animal: Animal, mult = 1): void {
  const base = BASE_SPEED[animal.type] ?? 1
  // Trade-off vitesse/énergie : vitesse élevée coûte plus cher
  const speedPenalty = Math.max(0, animal.genome.speed - base) * 0.2
  const drain = animal.genome.energyDrain * (1 + speedPenalty) * mult
  animal.energy -= drain
  animal.age++
  if (animal.mutationGlow > 0)
    animal.mutationGlow = Math.max(0, animal.mutationGlow * 0.988)

  if (animal.energy <= 0) {
    animal.dead = true
  }
}
