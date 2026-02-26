import { Genome } from '../genetics/genome'
import { CONFIG } from '../config'

function c01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }

/** Teinte "brute" dérivée du génome, avant offset de type. */
function rawHue(speed: number, vision: number): number {
  const ns = c01((speed  - 0.5) / 1.5)   // 0.5→2.0
  const nv = c01((vision - 25)  / 150)   // 25→175
  return (ns * 360 + nv * 120) % 360
}

// Offsets calculés paresseusement au premier appel (après loadSavedConfig).
// Les constantes de module sont évaluées avant que le localStorage soit lu,
// donc on ne peut pas les calculer ici.
let _herbOff: number | null = null
let _carnOff: number | null = null

/**
 * HSL d'un herbivore.  Génome par défaut (y compris valeurs localStorage) → 240° (bleu).
 * ±50% de vitesse ≈ ±144° de décalage de teinte.
 */
export function herbivoreHSL(g: Genome, t: number): [number, number, number] {
  if (_herbOff === null)
    _herbOff = (240 - rawHue(CONFIG.HERBIVORE_SPEED, CONFIG.HERBIVORE_VISION) + 360) % 360
  const nd  = c01((g.energyDrain - 0.05) / 1.45)
  const hue = (rawHue(g.speed, g.visionRadius) + _herbOff) % 360
  return [hue, 72 + nd * 18, 35 + t * 20]
}

/**
 * HSL d'un carnivore.  Génome par défaut (y compris valeurs localStorage) → 0° (rouge).
 * ±50% de vitesse ≈ ±144° de décalage de teinte.
 */
export function carnivoreHSL(g: Genome, t: number): [number, number, number] {
  if (_carnOff === null)
    _carnOff = (0 - rawHue(CONFIG.CARNIVORE_SPEED, CONFIG.CARNIVORE_VISION) + 360) % 360
  const nd  = c01((g.energyDrain - 0.05) / 1.45)
  const hue = (rawHue(g.speed, g.visionRadius) + _carnOff) % 360
  return [hue, 72 + nd * 18, 35 + t * 20]
}
