import { Genome } from '../genetics/genome'
import { CONFIG } from '../config'

function c01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }

/**
 * Teinte brute basée sur les RATIOS speed/vision par rapport aux défauts config.
 * ratio=1.0 (génome sans mutation) → rawHue toujours identique, peu importe les sliders.
 * range de normalisation : 0.5→1.5 couvre ±50% de mutation autour du défaut.
 * rawHue(1.0, 1.0) = 240 — constante.
 */
function rawHue(speedRatio: number, visionRatio: number): number {
  const ns = c01((speedRatio  - 0.5) / 1.0)  // 0.5→1.5 → 0→1
  const nv = c01((visionRatio - 0.5) / 1.0)  // 0.5→1.5 → 0→1
  return (ns * 360 + nv * 120) % 360
}

// rawHue(1.0, 1.0) = 240 → offsets constants, indépendants du CONFIG.
const RAW_DEFAULT = 240
const HERB_OFF = (240 - RAW_DEFAULT + 360) % 360  // = 0   → 240° (bleu) au défaut
const CARN_OFF = (0   - RAW_DEFAULT + 360) % 360  // = 120 → 0°   (rouge) au défaut

/**
 * HSL d'un herbivore. Génome par défaut → 240° (bleu), quelle que soit la config.
 */
export function herbivoreHSL(g: Genome, t: number): [number, number, number] {
  const nd          = c01((g.energyDrain - 0.05) / 1.45)
  const speedRatio  = g.speed        / CONFIG.HERBIVORE_SPEED
  const visionRatio = g.visionRadius / CONFIG.HERBIVORE_VISION
  const hue         = (rawHue(speedRatio, visionRatio) + HERB_OFF) % 360
  return [hue, 72 + nd * 18, 35 + t * 20]
}

/**
 * HSL d'un carnivore. Génome par défaut → 0° (rouge), quelle que soit la config.
 */
export function carnivoreHSL(g: Genome, t: number): [number, number, number] {
  const nd          = c01((g.energyDrain - 0.05) / 1.45)
  const speedRatio  = g.speed        / CONFIG.CARNIVORE_SPEED
  const visionRatio = g.visionRadius / CONFIG.CARNIVORE_VISION
  const hue         = (rawHue(speedRatio, visionRatio) + CARN_OFF) % 360
  return [hue, 72 + nd * 18, 35 + t * 20]
}
