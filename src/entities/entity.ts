import { Vec2 } from '../math/vec2'

let _nextId = 0

export type EntityType = 'plant' | 'herbivore' | 'carnivore'

export abstract class Entity {
  readonly id: number
  readonly type: EntityType
  pos: Vec2
  vel: Vec2
  energy: number
  age: number
  dead: boolean

  constructor(type: EntityType, pos: Vec2, energy: number) {
    this.id = _nextId++
    this.type = type
    this.pos = pos
    this.vel = Vec2.zero()
    this.energy = energy
    this.age = 0
    this.dead = false
  }
}
