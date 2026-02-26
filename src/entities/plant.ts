import { Vec2 } from '../math/vec2'
import { Entity } from './entity'
import { CONFIG } from '../config'

export class Plant extends Entity {
  readonly energyMax: number

  constructor(pos: Vec2) {
    super('plant', pos, Math.random() * CONFIG.PLANT_ENERGY_MAX * 0.5)
    this.energyMax = CONFIG.PLANT_ENERGY_MAX
  }

  grow(): void {
    this.energy = Math.min(this.energyMax, this.energy + CONFIG.PLANT_GROWTH_RATE)
    this.age++
  }

  /** Returns a spread position if ready to spread, else null */
  trySpread(chanceMultiplier = 1): Vec2 | null {
    if (this.energy >= this.energyMax && Math.random() < CONFIG.PLANT_SPREAD_CHANCE * chanceMultiplier) {
      const angle = Math.random() * Math.PI * 2
      const dist = CONFIG.PLANT_SPREAD_RADIUS_MIN
        + Math.random() * (CONFIG.PLANT_SPREAD_RADIUS - CONFIG.PLANT_SPREAD_RADIUS_MIN)
      return new Vec2(
        this.pos.x + Math.cos(angle) * dist,
        this.pos.y + Math.sin(angle) * dist,
      )
    }
    return null
  }

  /** Called when consumed. Returns energy given. */
  consume(): number {
    const gained = Math.min(this.energy, CONFIG.HERBIVORE_ENERGY_FROM_PLANT)
    this.energy -= gained
    if (this.energy <= 0) this.dead = true
    return gained
  }
}
