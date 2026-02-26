import { Vec2 } from '../math/vec2'
import { Animal } from './animal'
import { CONFIG } from '../config'
import { Genome, defaultGenome, crossover, mutate, mutationDistance } from '../genetics/genome'

export class Carnivore extends Animal {
  hungerThreshold: number
  reprCostEnergy: number

  constructor(pos: Vec2, energy = CONFIG.CARNIVORE_ENERGY_INIT, genome?: Genome) {
    const g = genome ?? defaultGenome('carnivore')
    super(
      'carnivore',
      pos,
      energy,
      g.speed,
      CONFIG.CARNIVORE_ENERGY_MAX,
      g.visionRadius,
      CONFIG.CARNIVORE_REPR_THRESHOLD,
      g.reprCooldown,
      g,
    )
    this.hungerThreshold = CONFIG.CARNIVORE_HUNGER_THRESHOLD
    this.reprCostEnergy = g.reprCostEnergy
  }

  spawnOffspring(partnerGenome: Genome): Carnivore {
    const offset = Vec2.random().scale(10)
    const crossed = crossover(this.genome, partnerGenome)
    const childGenome = mutate(crossed, 'carnivore')
    const child = new Carnivore(this.pos.add(offset), this.energy * 0.4, childGenome)
    child.mutationGlow = Math.min(1, mutationDistance(childGenome, crossed) * 3)
    return child
  }
}
