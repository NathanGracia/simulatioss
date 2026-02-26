import { Vec2 } from './math/vec2'
import { CONFIG } from './config'
import { BiomeMap, BIOME } from './biomeMap'
import { Plant } from './entities/plant'
import { Herbivore } from './entities/herbivore'
import { Carnivore } from './entities/carnivore'
import { Entity } from './entities/entity'
import { SpatialGrid } from './systems/spatialGrid'
import { updateHerbivioreBehavior, updateCarnivoreBehavior, moveAndBound } from './systems/behavior'
import { drainEnergy } from './systems/energy'
import { herbivoreFeed, carnivoreFeed } from './systems/feeding'
import { tryReproduceHerbivore, tryReproduceCarnivore } from './systems/reproduction'
import { SeasonSystem } from './systems/season'

export interface PopulationSnapshot {
  plants: number
  herbivores: number
  carnivores: number
}

export interface MatingEvent {
  x: number
  y: number
  color: string
}

export class World {
  width: number
  height: number
  plants: Plant[] = []
  herbivores: Herbivore[] = []
  carnivores: Carnivore[] = []
  tick: number = 0
  matingEvents: MatingEvent[] = []
  herbEatCount: number = 0
  carnEatCount: number = 0
  readonly season = new SeasonSystem()
  biomeMap: BiomeMap

  private plantGrid = new SpatialGrid(CONFIG.CELL_SIZE)
  private animalGrid = new SpatialGrid(CONFIG.CELL_SIZE)

  constructor(width = CONFIG.WORLD_WIDTH, height = CONFIG.WORLD_HEIGHT) {
    this.width = width
    this.height = height
    this.biomeMap = new BiomeMap(width, height)
    this.initialize()
  }

  private randomPos(): Vec2 {
    const m = CONFIG.WALL_MARGIN
    return new Vec2(
      m + Math.random() * (this.width  - 2 * m),
      m + Math.random() * (this.height - 2 * m),
    )
  }

  private randomPosOnLand(): Vec2 {
    for (let i = 0; i < 30; i++) {
      const pos = this.randomPos()
      if (this.biomeMap.getBiome(pos.x, pos.y) !== BIOME.WATER) return pos
    }
    return this.randomPos()
  }

  initialize(): void {
    this.biomeMap = new BiomeMap(this.width, this.height)
    this.plants = []
    this.herbivores = []
    this.carnivores = []
    this.tick = 0

    for (let i = 0; i < CONFIG.INITIAL_PLANTS; i++) {
      // Chercher une position en prairie proche de la rivière
      let pos = this.randomPos()
      for (let t = 0; t < 50; t++) {
        pos = this.randomPos()
        if (
          this.biomeMap.getBiome(pos.x, pos.y) === BIOME.PRAIRIE &&
          this.biomeMap.isNearWater(pos.x, pos.y, CONFIG.PLANT_WATER_PROXIMITY)
        ) break
      }
      this.plants.push(new Plant(pos))
    }
    for (let i = 0; i < CONFIG.INITIAL_HERBIVORES; i++) {
      this.herbivores.push(new Herbivore(this.randomPosOnLand()))
    }
    for (let i = 0; i < CONFIG.INITIAL_CARNIVORES; i++) {
      this.carnivores.push(new Carnivore(this.randomPosOnLand()))
    }
  }

  update(): void {
    this.tick++
    this.matingEvents.length = 0
    this.herbEatCount = 0
    this.carnEatCount = 0
    this.season.update(this.tick)
    const mods = this.season.getModifiers()

    // Rebuild plant grid en premier (positions stables depuis le tick précédent)
    this.plantGrid.rebuild(this.plants)

    // --- Plants ---
    const newPlants: Plant[] = []
    for (const plant of this.plants) {
      plant.grow()
      // Bonus/malus saisonnier sur la croissance de base
      plant.energy = Math.min(plant.energyMax, plant.energy + CONFIG.PLANT_GROWTH_RATE * (mods.growthMult - 1))

      // Proximité rivière : nourrit, trop loin dessèche
      const nearWater = this.biomeMap.isNearWater(plant.pos.x, plant.pos.y, CONFIG.PLANT_WATER_PROXIMITY)
      if (nearWater) {
        // Bonus de croissance proche de l'eau (modulé par saison)
        plant.energy = Math.min(plant.energyMax, plant.energy + CONFIG.PLANT_GROWTH_RATE * 1.2 * mods.growthMult)
      } else {
        // Trop loin de l'eau : la plante sèche et meurt
        plant.energy -= 1.5
        if (plant.energy <= 0) { plant.dead = true; continue }
      }

      // Étouffement : trop de voisins proches → drain d'énergie
      const crowd = this.plantGrid.getNeighbors(plant.pos, CONFIG.PLANT_CROWD_RADIUS)
      const neighborCount = crowd.filter(n => n !== plant && !n.dead).length
      if (neighborCount > CONFIG.PLANT_CROWD_MAX) {
        plant.energy -= CONFIG.PLANT_CROWD_DRAIN
        if (plant.energy <= 0) { plant.dead = true; continue }
      }

      if (this.plants.length + newPlants.length < CONFIG.PLANT_MAX_COUNT) {
        const spreadPos = plant.trySpread(mods.spreadMult)
        if (spreadPos) {
          const m = CONFIG.WALL_MARGIN
          const clampedPos = new Vec2(
            Math.max(m, Math.min(this.width  - m, spreadPos.x)),
            Math.max(m, Math.min(this.height - m, spreadPos.y)),
          )
          // Germe seulement en prairie proche de la rivière
          if (
            this.biomeMap.getBiome(clampedPos.x, clampedPos.y) === BIOME.PRAIRIE &&
            this.biomeMap.isNearWater(clampedPos.x, clampedPos.y, CONFIG.PLANT_WATER_PROXIMITY)
          ) {
            newPlants.push(new Plant(clampedPos))
          }
        }
      }
    }
    this.plants.push(...newPlants)

    // Dispersion par le vent : graine aléatoire près de l'eau, indépendante de la reproduction
    if (this.plants.length < CONFIG.PLANT_MAX_COUNT && Math.random() < CONFIG.PLANT_WIND_SPAWN_CHANCE * mods.spreadMult) {
      for (let i = 0; i < 20; i++) {
        const pos = this.randomPos()
        if (
          this.biomeMap.getBiome(pos.x, pos.y) === BIOME.PRAIRIE &&
          this.biomeMap.isNearWater(pos.x, pos.y, CONFIG.PLANT_WATER_PROXIMITY)
        ) {
          this.plants.push(new Plant(pos))
          break
        }
      }
    }

    // Rebuild grids complets pour animaux
    const allEntities: Entity[] = [...this.plants, ...this.herbivores, ...this.carnivores]
    this.plantGrid.rebuild(this.plants)
    this.animalGrid.rebuild(allEntities)

    // --- Herbivores ---
    const newHerbivores: Herbivore[] = []
    for (const herb of this.herbivores) {
      if (herb.dead) continue

      drainEnergy(herb, mods.herbDrainMult)
      if (herb.dead) continue

      // Get neighbors
      const neighbors = this.animalGrid.getNeighbors(herb.pos, Math.max(herb.visionRadius, herb.fearRadius))
      updateHerbivioreBehavior(herb, neighbors, this.width, this.height, this.biomeMap)
      moveAndBound(herb, this.width, this.height, this.biomeMap)

      // Eat — seulement si affamé (évite qu'un animal rassasié dévore tout sur son passage)
      if (herb.energy < herb.hungerThreshold) {
        const nearbyPlants = this.plantGrid.getNeighbors(herb.pos, CONFIG.EAT_DISTANCE) as Plant[]
        if (herbivoreFeed(herb, nearbyPlants.filter(p => p.type === 'plant') as Plant[])) this.herbEatCount++
      }

      // Reproduce
      const nearbyHerbs = neighbors.filter(n => n.type === 'herbivore' && !n.dead) as Herbivore[]
      const offspring = tryReproduceHerbivore(herb, nearbyHerbs, this.herbivores.length + newHerbivores.length)
      if (offspring) {
        newHerbivores.push(offspring)
        this.matingEvents.push({ x: herb.pos.x, y: herb.pos.y, color: '#f9a8d4' })
      }
    }
    this.herbivores.push(...newHerbivores)

    // --- Carnivores ---
    const newCarnivores: Carnivore[] = []
    for (const carn of this.carnivores) {
      if (carn.dead) continue

      drainEnergy(carn, mods.carnDrainMult)
      if (carn.dead) continue

      const neighbors = this.animalGrid.getNeighbors(carn.pos, carn.visionRadius)
      updateCarnivoreBehavior(carn, neighbors, this.width, this.height, this.biomeMap)
      moveAndBound(carn, this.width, this.height, this.biomeMap)

      // Eat — seulement si affamé
      if (carn.energy < carn.hungerThreshold) {
        const nearbyHerbs = this.animalGrid.getNeighbors(carn.pos, CONFIG.EAT_DISTANCE)
          .filter(n => n.type === 'herbivore' && !n.dead) as Herbivore[]
        if (carnivoreFeed(carn, nearbyHerbs)) this.carnEatCount++
      }

      // Reproduce
      const nearbyCarnivores = neighbors.filter(n => n.type === 'carnivore' && !n.dead) as Carnivore[]
      const offspring = tryReproduceCarnivore(carn, nearbyCarnivores, this.carnivores.length + newCarnivores.length)
      if (offspring) {
        newCarnivores.push(offspring)
        this.matingEvents.push({ x: carn.pos.x, y: carn.pos.y, color: '#f9a8d4' })
      }
    }
    this.carnivores.push(...newCarnivores)

    // --- Cleanup dead ---
    this.plants = this.plants.filter(p => !p.dead)
    this.herbivores = this.herbivores.filter(h => !h.dead)
    this.carnivores = this.carnivores.filter(c => !c.dead)
  }

  getPopulation(): PopulationSnapshot {
    return {
      plants: this.plants.length,
      herbivores: this.herbivores.length,
      carnivores: this.carnivores.length,
    }
  }
}
