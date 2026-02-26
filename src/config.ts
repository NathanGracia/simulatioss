export const CONFIG = {
  // World
  WORLD_WIDTH: 1200,
  WORLD_HEIGHT: 800,

  // Lacs
  LAKE_COUNT: 3,       // nombre de lacs principaux
  LAKE_SIZE: 0.09,     // taille relative (proportion de min(W,H))
  LAKE_PONDS: 1,       // nombre de petits étangs supplémentaires
  LAKE_BEACH_SIZE: 100, // px — rayon du halo de sable (visuel uniquement)

  // Spatial grid
  CELL_SIZE: 80, // ~vision radius

  // Plants
  INITIAL_PLANTS: 150,
  PLANT_ENERGY_MAX: 100,
  PLANT_GROWTH_RATE: 2,       // energy gained per tick
  PLANT_SPREAD_RADIUS_MIN: 10,
  PLANT_SPREAD_RADIUS: 40,
  PLANT_SPREAD_CHANCE: 0.003, // per tick when full
  PLANT_MAX_COUNT: 400,
  PLANT_WATER_PROXIMITY: 55, // px — distance max à la rivière pour qu'une plante survive
  PLANT_CROWD_RADIUS: 20,     // px — rayon de détection de la surpopulation
  PLANT_CROWD_MAX: 3,         // voisins max avant étouffement
  PLANT_CROWD_DRAIN: 3,       // drain énergie / tick quand étouffée

  // Herbivores
  INITIAL_HERBIVORES: 40,
  HERBIVORE_ENERGY_INIT: 60,
  HERBIVORE_ENERGY_MAX: 120,
  HERBIVORE_ENERGY_DRAIN: 0.5,
  HERBIVORE_ENERGY_FROM_PLANT: 40,
  HERBIVORE_SPEED: 1.2,
  HERBIVORE_SPEED_FLEE: 2.0,
  HERBIVORE_VISION: 80,
  HERBIVORE_FEAR_RADIUS: 120,
  HERBIVORE_HUNGER_THRESHOLD: 70, // eat if energy below this
  HERBIVORE_REPR_THRESHOLD: 80,
  HERBIVORE_REPR_COST: 30,
  HERBIVORE_REPR_COOLDOWN: 300,  // ticks
  HERBIVORE_MAX_COUNT: 200,

  // Carnivores
  INITIAL_CARNIVORES: 10,
  CARNIVORE_ENERGY_INIT: 60,
  CARNIVORE_ENERGY_MAX: 150,
  CARNIVORE_ENERGY_DRAIN: 0.3,
  CARNIVORE_ENERGY_FROM_HERBIVORE: 60,
  CARNIVORE_SPEED: 1.8,
  CARNIVORE_VISION: 120,
  CARNIVORE_HUNGER_THRESHOLD: 80,
  CARNIVORE_REPR_THRESHOLD: 80,
  CARNIVORE_REPR_COST: 35,
  CARNIVORE_REPR_COOLDOWN: 500,
  CARNIVORE_MAX_COUNT: 60,

  // Eating distance
  EAT_DISTANCE: 12,
  REPR_DISTANCE: 20,

  // Rendering
  PLANT_RADIUS: 4,
  HERBIVORE_RADIUS: 6,
  CARNIVORE_RADIUS: 8,

  // Stats graph
  STATS_HISTORY_LENGTH: 200,

  // Simulation
  TARGET_FPS: 60,
}
