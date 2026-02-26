import { CONFIG } from '../config'

export const SEASON_NAMES  = ['Printemps', 'Été', 'Automne', 'Hiver'] as const
export const SEASON_ICONS  = ['🌸', '☀️', '🍂', '❄️']              as const
export const SEASON_COLORS = ['#bbf7d0', '#fef08a', '#fed7aa', '#bae6fd'] as const

export type SeasonIndex = 0 | 1 | 2 | 3

export interface SeasonModifiers {
  growthMult: number    // multiplicateur croissance plantes
  spreadMult: number    // multiplicateur dispersion plantes
  herbDrainMult: number // multiplicateur drain énergie herbivores
  carnDrainMult: number // multiplicateur drain énergie carnivores
}

const MODIFIERS: SeasonModifiers[] = [
  // 🌸 Printemps — renouveau, abondance, froid résiduel
  { growthMult: 1.5,  spreadMult: 1.4, herbDrainMult: 0.9,  carnDrainMult: 0.95 },
  // ☀️ Été       — croissance normale, conditions idéales
  { growthMult: 1.2,  spreadMult: 1.0, herbDrainMult: 1.0,  carnDrainMult: 1.0  },
  // 🍂 Automne   — déclin, ressources qui se raréfient
  { growthMult: 0.55, spreadMult: 0.5, herbDrainMult: 1.15, carnDrainMult: 1.05 },
  // ❄️ Hiver     — quasi-dormance, survie difficile
  { growthMult: 0.12, spreadMult: 0.1, herbDrainMult: 1.5,  carnDrainMult: 1.2  },
]

export class SeasonSystem {
  season: SeasonIndex = 0
  progress: number = 0   // 0..1 dans la saison courante
  cycleProgress: number = 0 // 0..1 dans l'année complète

  update(tick: number): void {
    const dur      = CONFIG.SEASON_DURATION
    const cycleTick = tick % (dur * 4)
    this.season        = Math.floor(cycleTick / dur) as SeasonIndex
    this.progress      = (cycleTick % dur) / dur
    this.cycleProgress = cycleTick / (dur * 4)
  }

  getModifiers(): SeasonModifiers {
    return MODIFIERS[this.season]
  }
}
