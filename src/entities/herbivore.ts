import { Vec2 } from '../math/vec2'
import { Animal } from './animal'
import { CONFIG } from '../config'

export class Herbivore extends Animal {
  fearRadius: number
  hungerThreshold: number
  reprCostEnergy: number

  constructor(pos: Vec2, energy = CONFIG.HERBIVORE_ENERGY_INIT) {
    super(
      'herbivore',
      pos,
      energy,
      CONFIG.HERBIVORE_SPEED,
      CONFIG.HERBIVORE_ENERGY_MAX,
      CONFIG.HERBIVORE_VISION,
      CONFIG.HERBIVORE_REPR_THRESHOLD,
      CONFIG.HERBIVORE_REPR_COOLDOWN,
    )
    this.fearRadius = CONFIG.HERBIVORE_FEAR_RADIUS
    this.hungerThreshold = CONFIG.HERBIVORE_HUNGER_THRESHOLD
    this.reprCostEnergy = CONFIG.HERBIVORE_REPR_COST
  }

  spawnOffspring(): Herbivore {
    const offset = Vec2.random().scale(10)
    return new Herbivore(this.pos.add(offset), this.energy * 0.4)
  }
}
