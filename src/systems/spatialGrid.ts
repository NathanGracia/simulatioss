import { Vec2 } from '../math/vec2'
import { Entity } from '../entities/entity'
import { CONFIG } from '../config'

export class SpatialGrid {
  private cells: Map<number, Entity[]> = new Map()
  private cellSize: number

  constructor(cellSize = CONFIG.CELL_SIZE) {
    this.cellSize = cellSize
  }

  private cellKey(cx: number, cy: number): number {
    // Pack two 16-bit coords into a 32-bit int
    return (cx & 0xffff) | ((cy & 0xffff) << 16)
  }

  private toCellCoords(x: number, y: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)]
  }

  insert(entity: Entity): void {
    const [cx, cy] = this.toCellCoords(entity.pos.x, entity.pos.y)
    const key = this.cellKey(cx, cy)
    let cell = this.cells.get(key)
    if (!cell) {
      cell = []
      this.cells.set(key, cell)
    }
    cell.push(entity)
  }

  rebuild(entities: Entity[]): void {
    this.cells.clear()
    for (const e of entities) {
      if (!e.dead) this.insert(e)
    }
  }

  getNeighbors(pos: Vec2, radius: number): Entity[] {
    const [cx, cy] = this.toCellCoords(pos.x, pos.y)
    const cellSpan = Math.ceil(radius / this.cellSize)
    const result: Entity[] = []
    const radiusSq = radius * radius

    for (let dx = -cellSpan; dx <= cellSpan; dx++) {
      for (let dy = -cellSpan; dy <= cellSpan; dy++) {
        const key = this.cellKey(cx + dx, cy + dy)
        const cell = this.cells.get(key)
        if (!cell) continue
        for (const e of cell) {
          if (e.pos.distSq(pos) <= radiusSq) {
            result.push(e)
          }
        }
      }
    }
    return result
  }
}
