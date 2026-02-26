import { Vec2 } from '../math/vec2'
import { Entity, EntityType } from './entity'
import { Genome } from '../genetics/genome'
// Importé ici pour le typage uniquement (pas de dépendance circulaire)

export abstract class Animal extends Entity {
  maxSpeed: number
  maxEnergy: number
  visionRadius: number
  reprThreshold: number
  reprCooldown: number
  reprTimer: number
  wanderAngle: number
  genome: Genome
  mutationGlow: number = 0
  // Cache de chemin A*
  cachedPath: Vec2[] = []
  pathTargetPos: Vec2 | null = null
  pathBiomeVersion: number = -1
  pathIndex: number = 0

  constructor(
    type: EntityType,
    pos: Vec2,
    energy: number,
    maxSpeed: number,
    maxEnergy: number,
    visionRadius: number,
    reprThreshold: number,
    reprCooldown: number,
    genome: Genome,
  ) {
    super(type, pos, energy)
    this.maxSpeed = maxSpeed
    this.maxEnergy = maxEnergy
    this.visionRadius = visionRadius
    this.reprThreshold = reprThreshold
    this.reprCooldown = reprCooldown
    this.reprTimer = Math.floor(Math.random() * reprCooldown) // stagger
    this.wanderAngle = Math.random() * Math.PI * 2
    this.genome = genome
  }
}
