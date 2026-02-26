import { World } from '../world'
import { Animal } from '../entities/animal'
import { PainterState } from './painter'
import { defaultGenome } from '../genetics/genome'
import { herbivoreHSL, carnivoreHSL } from './entityColor'

export interface TrackState {
  entity: Animal | null
  update(): void
}

export function setupInspector(
  canvas: HTMLCanvasElement,
  world: World,
  painterState: PainterState,
): TrackState {
  const tooltip = document.getElementById('entity-tooltip')!
  const track: TrackState = { entity: null, update: () => {} }

  const getCanvasPos = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function findNearest(x: number, y: number): Animal | null {
    let nearest: Animal | null = null
    let bestDist = 28
    for (const a of (world.herbivores as Animal[]).concat(world.carnivores)) {
      const dx = a.pos.x - x
      const dy = a.pos.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < bestDist) {
        bestDist = dist
        nearest = a
      }
    }
    return nearest
  }

  function buildTooltipHTML(entity: Animal, locked: boolean): string {
    const isHerb = entity.type === 'herbivore'
    const typeLabel = isHerb ? 'Herbivore' : 'Carnivore'

    const maxEnergy = entity.maxEnergy
    const energyPct = Math.min(1, Math.max(0, entity.energy / maxEnergy))

    const [hslH, hslS] = isHerb
      ? herbivoreHSL(entity.genome, energyPct)
      : carnivoreHSL(entity.genome, energyPct)
    const typeColor = `hsl(${hslH}, ${Math.min(95, hslS + 15)}%, 72%)`
    const barFilled = Math.round(energyPct * 10)
    const barStr = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled)
    const energyValStr = `${Math.round(entity.energy)}/${maxEnergy}`

    const def = defaultGenome(entity.type as 'herbivore' | 'carnivore')
    const g = entity.genome

    const calcDelta = (val: number, defVal: number, lowerIsBetter = false): { text: string; color: string } => {
      if (defVal === 0) return { text: '—', color: 'rgba(255,255,255,0.3)' }
      const pct = Math.round((val - defVal) / defVal * 100)
      if (Math.abs(pct) < 1) return { text: '—', color: 'rgba(255,255,255,0.3)' }
      const positive = pct > 0
      const good = lowerIsBetter ? !positive : positive
      return {
        text: `${positive ? '▲' : '▼'}${positive ? '+' : ''}${pct}%`,
        color: good ? '#4ade80' : '#f87171',
      }
    }

    const geneRow = (label: string, val: number, defVal: number, decimals: number, lowerIsBetter = false): string => {
      const d = calcDelta(val, defVal, lowerIsBetter)
      return `<div class="et-gene">
        <span class="et-gene-label">${label}</span>
        <span class="et-gene-val">${val.toFixed(decimals)}</span>
        <span class="et-gene-delta" style="color:${d.color}">${d.text}</span>
      </div>`
    }

    let genesHtml = ''
    genesHtml += geneRow('Vitesse', g.speed, def.speed, 2)
    genesHtml += geneRow('Vision', g.visionRadius, def.visionRadius, 0)
    genesHtml += geneRow('Drain', g.energyDrain, def.energyDrain, 2, true)
    if (isHerb) genesHtml += geneRow('Peur', g.fearRadius, def.fearRadius, 0)
    genesHtml += geneRow('Cooldown', g.reprCooldown, def.reprCooldown, 0)
    genesHtml += geneRow('Coût repr.', g.reprCostEnergy, def.reprCostEnergy, 1)

    let mutationHtml = ''
    if (entity.mutationGlow > 0.04) {
      const glowFilled = Math.round(Math.min(1, entity.mutationGlow) * 10)
      const glowBar = '▮'.repeat(glowFilled) + '░'.repeat(10 - glowFilled)
      mutationHtml = `
        <div class="et-separator"></div>
        <div class="et-glow-row">
          <span class="et-glow-label">✦ Mutation</span>
          <span class="et-glow-bar" style="color:#c4b5fd">${glowBar}</span>
        </div>`
    }

    const pinBadge = locked
      ? `<span class="et-pin">📌</span>`
      : ''

    return `
      <div class="et-header">
        <span class="et-type" style="color:${typeColor}">${typeLabel} ${pinBadge}</span>
        <span class="et-id">#${entity.id}</span>
      </div>
      <div class="et-stat-row">
        <span>Énergie</span>
        <span class="et-bar">${barStr}</span>
        <span>${energyValStr}</span>
      </div>
      <div class="et-stat-row">
        <span>Âge</span>
        <span></span>
        <span>${entity.age} t</span>
      </div>
      <div class="et-separator"></div>
      <div class="et-genes-label">Génome</div>
      <div class="et-genes">${genesHtml}</div>
      ${mutationHtml}
    `
  }

  function positionTooltip(x: number, y: number): void {
    const tw = 220 + 16
    const th = 300
    let left = x + 18
    let top  = y - 10
    if (left + tw > window.innerWidth)  left = x - tw - 4
    if (top  + th > window.innerHeight) top  = window.innerHeight - th - 10
    if (top < 0) top = 10
    tooltip.style.left = `${left}px`
    tooltip.style.top  = `${top}px`
  }

  // ── Hover (uniquement si rien n'est verrouillé) ───────────────────────────
  document.addEventListener('mousemove', e => {
    if (painterState.mode !== 'inspect') return
    if (track.entity) return  // verrouillé — le hover ne fait rien
    const { x, y } = getCanvasPos(e.clientX, e.clientY)
    const found = findNearest(x, y)
    if (found) {
      tooltip.innerHTML = buildTooltipHTML(found, false)
      positionTooltip(e.clientX, e.clientY)
      tooltip.classList.add('visible')
    } else {
      tooltip.classList.remove('visible')
    }
  })

  // ── Clic — verrouille / déverrouille ──────────────────────────────────────
  document.addEventListener('click', e => {
    if (painterState.mode !== 'inspect') return
    if ((e.target as HTMLElement).closest('#ui-overlay, #settings-panel, #settings-toggle')) return
    const { x, y } = getCanvasPos(e.clientX, e.clientY)
    const found = findNearest(x, y)
    if (found) {
      track.entity = found
    } else {
      track.entity = null
      tooltip.classList.remove('visible')
    }
  })

  canvas.addEventListener('mouseleave', () => {
    if (!track.entity) tooltip.classList.remove('visible')
  })

  // ── update() — appelé chaque frame depuis main.ts ─────────────────────────
  track.update = () => {
    if (!track.entity) return
    if (track.entity.dead) {
      track.entity = null
      tooltip.classList.remove('visible')
      return
    }
    tooltip.innerHTML = buildTooltipHTML(track.entity, true)
    positionTooltip(track.entity.pos.x, track.entity.pos.y)
    tooltip.classList.add('visible')
  }

  return track
}
