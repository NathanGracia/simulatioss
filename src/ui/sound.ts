let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (!ctx) {
    try { ctx = new AudioContext() } catch { return null }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Unlock audio on first user gesture
document.addEventListener('pointerdown', getCtx, { once: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

function playTone(
  freq: number, type: OscillatorType,
  vol: number, attack: number, decay: number,
  when = 0,
): void {
  const c = getCtx()
  if (!c) return
  const t = c.currentTime + when

  const osc  = c.createOscillator()
  const gain = c.createGain()

  osc.type      = type
  osc.frequency.setValueAtTime(freq, t)

  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + attack + decay + 0.01)
}

function playNoise(
  cutoff: number, vol: number, duration: number, when = 0,
): void {
  const c = getCtx()
  if (!c) return
  const t = c.currentTime + when

  const bufSize  = Math.ceil(c.sampleRate * duration)
  const buffer   = c.createBuffer(1, bufSize, c.sampleRate)
  const data     = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  const src    = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const gain   = c.createGain()

  src.buffer = buffer
  filter.type            = 'bandpass'
  filter.frequency.value = cutoff
  filter.Q.value         = 1.5

  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start(t)
  src.stop(t + duration + 0.01)
}

// ── Per-frame rate limiter ────────────────────────────────────────────────────

const MAX_PER_TYPE = 3

let herbEatBudget  = MAX_PER_TYPE
let carnEatBudget  = MAX_PER_TYPE
let reproduceBudget = MAX_PER_TYPE

export function resetSoundBudgets(): void {
  herbEatBudget   = MAX_PER_TYPE
  carnEatBudget   = MAX_PER_TYPE
  reproduceBudget = MAX_PER_TYPE
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Herbivore mange une plante — léger clic végétal */
export function soundHerbEat(count: number): void {
  const n = Math.min(count, herbEatBudget)
  herbEatBudget -= n
  for (let i = 0; i < n; i++) {
    const jitter = i * 0.018
    playNoise(600 + Math.random() * 200, 0.04, 0.055, jitter)
  }
}

/** Carnivore tue un herbivore — impact sourd */
export function soundCarnEat(count: number): void {
  const n = Math.min(count, carnEatBudget)
  carnEatBudget -= n
  for (let i = 0; i < n; i++) {
    const jitter = i * 0.025
    playNoise(180 + Math.random() * 80, 0.07, 0.08, jitter)
    playTone(120, 'sine', 0.05, 0.003, 0.1, jitter)
  }
}

/** Reproduction — petit tintement discret */
export function soundReproduce(count: number): void {
  const n = Math.min(count, reproduceBudget)
  reproduceBudget -= n
  for (let i = 0; i < n; i++) {
    const jitter = i * 0.03
    playTone(1400 + Math.random() * 300, 'sine', 0.025, 0.005, 0.18, jitter)
  }
}
