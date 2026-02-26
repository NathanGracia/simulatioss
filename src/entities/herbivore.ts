import { Vec2 } from '../math/vec2'
import { Animal } from './animal'
import { CONFIG } from '../config'
import { Genome, defaultGenome, crossover, mutate, mutationDistance } from '../genetics/genome'

export class Herbivore extends Animal {
  hungerThreshold: number
  reprCostEnergy: number
  fearRadius: number

  constructor(pos: Vec2, energy = CONFIG.HERBIVORE_ENERGY_INIT, genome?: Genome) {
    const g = genome ?? defaultGenome('herbivore')
    super(
      'herbivore',
      pos,
      energy,
      g.speed,
      CONFIG.HERBIVORE_ENERGY_MAX,
      g.visionRadius,
      CONFIG.HERBIVORE_REPR_THRESHOLD,
      g.reprCooldown,
      g,
    )
    this.fearRadius = g.fearRadius
    this.reprCostEnergy = g.reprCostEnergy
    this.hungerThreshold = CONFIG.HERBIVORE_HUNGER_THRESHOLD
  }

  spawnOffspring(partnerGenome: Genome): Herbivore {
    const offset = Vec2.random().scale(10)
    const crossed = crossover(this.genome, partnerGenome)
    const childGenome = mutate(crossed, 'herbivore')
    const child = new Herbivore(this.pos.add(offset), this.energy * 0.4, childGenome)
    child.mutationGlow = Math.min(1, mutationDistance(childGenome, crossed) * 3)
    return child
  }
}
