import { Vec2 } from '../math/vec2'
import { Animal } from './animal'
import { CONFIG } from '../config'

export class Carnivore extends Animal {
  hungerThreshold: number
  reprCostEnergy: number

  constructor(pos: Vec2, energy = CONFIG.CARNIVORE_ENERGY_INIT) {
    super(
      'carnivore',
      pos,
      energy,
      CONFIG.CARNIVORE_SPEED,
      CONFIG.CARNIVORE_ENERGY_MAX,
      CONFIG.CARNIVORE_VISION,
      CONFIG.CARNIVORE_REPR_THRESHOLD,
      CONFIG.CARNIVORE_REPR_COOLDOWN,
    )
    this.hungerThreshold = CONFIG.CARNIVORE_HUNGER_THRESHOLD
    this.reprCostEnergy = CONFIG.CARNIVORE_REPR_COST
  }

  spawnOffspring(): Carnivore {
    const offset = Vec2.random().scale(10)
    return new Carnivore(this.pos.add(offset), this.energy * 0.4)
  }
}
