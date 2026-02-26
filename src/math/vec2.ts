export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y
  }

  normalize(): Vec2 {
    const len = this.length()
    if (len === 0) return new Vec2(0, 0)
    return new Vec2(this.x / len, this.y / len)
  }

  clampLength(max: number): Vec2 {
    const len = this.length()
    if (len > max) return this.normalize().scale(max)
    return this.clone()
  }

  lerp(v: Vec2, t: number): Vec2 {
    return new Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t)
  }

  dist(v: Vec2): number {
    const dx = this.x - v.x
    const dy = this.y - v.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  distSq(v: Vec2): number {
    const dx = this.x - v.x
    const dy = this.y - v.y
    return dx * dx + dy * dy
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y
  }

  static fromAngle(angle: number, length = 1): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length)
  }

  static random(): Vec2 {
    const angle = Math.random() * Math.PI * 2
    return Vec2.fromAngle(angle)
  }

  static zero(): Vec2 {
    return new Vec2(0, 0)
  }
}
