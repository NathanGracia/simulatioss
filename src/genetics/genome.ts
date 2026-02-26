import { CONFIG } from '../config'

export interface Genome {
  speed: number
  visionRadius: number
  energyDrain: number
  fearRadius: number   // 0 pour les carnivores
  reprCooldown: number
  reprCostEnergy: number
}

// Bornes min/max par gène (partagées herbivore/carnivore sauf fearRadius)
const GENE_BOUNDS: Record<keyof Genome, [number, number]> = {
  speed:          [0.2, 8],
  visionRadius:   [15, 350],
  energyDrain:    [0.05, 5],
  fearRadius:     [0, 400],
  reprCooldown:   [30, 2000],
  reprCostEnergy: [5, 100],
}

export function defaultGenome(type: 'herbivore' | 'carnivore'): Genome {
  if (type === 'herbivore') {
    return {
      speed:          CONFIG.HERBIVORE_SPEED,
      visionRadius:   CONFIG.HERBIVORE_VISION,
      energyDrain:    CONFIG.HERBIVORE_ENERGY_DRAIN,
      fearRadius:     CONFIG.HERBIVORE_FEAR_RADIUS,
      reprCooldown:   CONFIG.HERBIVORE_REPR_COOLDOWN,
      reprCostEnergy: CONFIG.HERBIVORE_REPR_COST,
    }
  } else {
    return {
      speed:          CONFIG.CARNIVORE_SPEED,
      visionRadius:   CONFIG.CARNIVORE_VISION,
      energyDrain:    CONFIG.CARNIVORE_ENERGY_DRAIN,
      fearRadius:     0,
      reprCooldown:   CONFIG.CARNIVORE_REPR_COOLDOWN,
      reprCostEnergy: CONFIG.CARNIVORE_REPR_COST,
    }
  }
}

/** Crossover 50/50 par gène */
export function crossover(a: Genome, b: Genome): Genome {
  return {
    speed:          Math.random() < 0.5 ? a.speed          : b.speed,
    visionRadius:   Math.random() < 0.5 ? a.visionRadius   : b.visionRadius,
    energyDrain:    Math.random() < 0.5 ? a.energyDrain    : b.energyDrain,
    fearRadius:     Math.random() < 0.5 ? a.fearRadius     : b.fearRadius,
    reprCooldown:   Math.random() < 0.5 ? a.reprCooldown   : b.reprCooldown,
    reprCostEnergy: Math.random() < 0.5 ? a.reprCostEnergy : b.reprCostEnergy,
  }
}

/**
 * Mesure la distance de mutation entre un génome enfant et sa référence pre-mutation.
 * Retourne 0→1 (0 = pas de mutation, 1 = tous les gènes au max de MUTATION_STRENGTH).
 */
export function mutationDistance(child: Genome, reference: Genome): number {
  const genes: (keyof Genome)[] = ['speed', 'visionRadius', 'energyDrain', 'reprCooldown', 'reprCostEnergy']
  let total = 0
  for (const k of genes) {
    const ref = reference[k]
    if (ref === 0) continue
    total += Math.abs(child[k] - ref) / Math.abs(ref)
  }
  const avg = total / genes.length
  return Math.min(1, avg / CONFIG.MUTATION_STRENGTH)
}

/** Mutation gaussienne ±MUTATION_STRENGTH, clampée dans les bornes */
export function mutate(g: Genome, _type: 'herbivore' | 'carnivore'): Genome {
  const rate = CONFIG.MUTATION_RATE
  const strength = CONFIG.MUTATION_STRENGTH

  function mayMutate(val: number, gene: keyof Genome): number {
    if (Math.random() >= rate) return val
    const factor = 1 + (Math.random() * 2 - 1) * strength
    const [lo, hi] = GENE_BOUNDS[gene]
    return Math.max(lo, Math.min(hi, val * factor))
  }

  return {
    speed:          mayMutate(g.speed,          'speed'),
    visionRadius:   mayMutate(g.visionRadius,   'visionRadius'),
    energyDrain:    mayMutate(g.energyDrain,    'energyDrain'),
    fearRadius:     mayMutate(g.fearRadius,     'fearRadius'),
    reprCooldown:   mayMutate(g.reprCooldown,   'reprCooldown'),
    reprCostEnergy: mayMutate(g.reprCostEnergy, 'reprCostEnergy'),
  }
}
