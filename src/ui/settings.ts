import { CONFIG } from '../config'

const DEFAULTS = { ...CONFIG } as typeof CONFIG

type ConfigKey = keyof typeof CONFIG

interface ParamDef {
  key: ConfigKey
  label: string
  min: number
  max: number
  step: number
  tooltip: string
  needsReset?: boolean
}

interface Section {
  id: string
  title: string
  color: string
  params: ParamDef[]
}

const SECTIONS: Section[] = [
  {
    id: 'biomes',
    title: '💧 Génération des lacs',
    color: '#7dd3fc',
    params: [
      {
        key: 'LAKE_COUNT', label: 'Nombre de lacs', min: 0, max: 8, step: 1, needsReset: true,
        tooltip: 'Nombre de lacs principaux générés au spawn. Les lacs sont distribués pour éviter de se superposer.',
      },
      {
        key: 'LAKE_SIZE', label: 'Taille des lacs', min: 0.03, max: 0.18, step: 0.01, needsReset: true,
        tooltip: 'Taille de base des lacs, exprimée en proportion de la plus petite dimension de l\'écran. Chaque lac a une variation aléatoire de ±20%.',
      },
      {
        key: 'LAKE_PONDS', label: 'Petits étangs', min: 0, max: 6, step: 1, needsReset: true,
        tooltip: 'Nombre d\'étangs supplémentaires de petite taille, placés librement sur la carte.',
      },
      {
        key: 'LAKE_BEACH_SIZE', label: 'Taille plage', min: 10, max: 250, step: 5,
        tooltip: 'Rayon du halo de sable autour des lacs. Purement visuel — n\'affecte pas la simulation ni les plantes.',
      },
    ],
  },
  {
    id: 'plants',
    title: '🌿 Plantes',
    color: '#4ade80',
    params: [
      {
        key: 'PLANT_GROWTH_RATE', label: 'Croissance / tick', min: 0.2, max: 10, step: 0.1,
        tooltip: 'Énergie gagnée par chaque plante à chaque tick. Plus c\'est élevé, plus les plantes poussent vite et deviennent matures rapidement.',
      },
      {
        key: 'PLANT_SPREAD_CHANCE', label: 'Chance dispersion', min: 0.0005, max: 0.02, step: 0.0005,
        tooltip: 'Probabilité par tick qu\'une plante à pleine énergie produise une graine. Valeur faible = colonisation lente et clairsemée.',
      },
      {
        key: 'PLANT_SPREAD_RADIUS_MIN', label: 'Rayon min', min: 0, max: 100, step: 5,
        tooltip: 'Distance minimale à laquelle une nouvelle plante germe. Empêche les plantes de se superposer et force une dispersion plus uniforme.',
      },
      {
        key: 'PLANT_SPREAD_RADIUS', label: 'Rayon max', min: 5, max: 120, step: 5,
        tooltip: 'Distance maximale à laquelle une nouvelle plante peut germer autour de sa plante-mère.',
      },
      {
        key: 'PLANT_MAX_COUNT', label: 'Population max', min: 50, max: 800, step: 10,
        tooltip: 'Plafond absolu du nombre de plantes. Limite la quantité de nourriture disponible pour les herbivores.',
      },
      {
        key: 'PLANT_WATER_PROXIMITY', label: 'Proximité eau', min: 10, max: 150, step: 5,
        tooltip: 'Distance maximale à laquelle une plante peut survivre sans eau à proximité. Plus la valeur est grande, plus les plantes colonisent loin des berges.',
      },
      {
        key: 'PLANT_CROWD_RADIUS', label: 'Rayon étouffement', min: 5, max: 60, step: 5,
        tooltip: 'Rayon dans lequel les plantes se font concurrence. Si trop de voisins dans ce rayon, la plante perd de l\'énergie.',
      },
      {
        key: 'PLANT_CROWD_MAX', label: 'Voisins max', min: 1, max: 10, step: 1,
        tooltip: 'Nombre de plantes voisines tolérées avant étouffement. En dessous de ce seuil, la plante pousse normalement.',
      },
      {
        key: 'PLANT_CROWD_DRAIN', label: 'Drain étouffement', min: 0.5, max: 10, step: 0.5,
        tooltip: 'Énergie perdue par tick quand la plante est étouffée. Si supérieur au taux de croissance, la plante mourra inévitablement.',
      },
      {
        key: 'INITIAL_PLANTS', label: 'Population init.', min: 10, max: 300, step: 5, needsReset: true,
        tooltip: 'Nombre de plantes placées au démarrage. N\'affecte que la prochaine réinitialisation.',
      },
    ],
  },
  {
    id: 'herbivores',
    title: '🐇 Herbivores',
    color: '#60a5fa',
    params: [
      {
        key: 'HERBIVORE_ENERGY_DRAIN', label: 'Drain énergie', min: 0.05, max: 3, step: 0.05,
        tooltip: 'Énergie perdue par tick (métabolisme de base). Plus c\'est élevé, plus un herbivore doit manger souvent pour survivre.',
      },
      {
        key: 'HERBIVORE_ENERGY_FROM_PLANT', label: 'Gain / plante', min: 5, max: 100, step: 5,
        tooltip: 'Énergie récupérée en mangeant une plante. Avec un drain élevé, augmenter ce gain compense la dépense.',
      },
      {
        key: 'HERBIVORE_SPEED', label: 'Vitesse', min: 0.3, max: 5, step: 0.1,
        tooltip: 'Vitesse de déplacement de base. Les herbivores accélèrent automatiquement en fuyant un carnivore.',
      },
      {
        key: 'HERBIVORE_VISION', label: 'Vision', min: 20, max: 250, step: 5,
        tooltip: 'Rayon dans lequel un herbivore peut détecter des plantes et des partenaires. Au-delà, il erre à l\'aveugle.',
      },
      {
        key: 'HERBIVORE_FEAR_RADIUS', label: 'Rayon de peur', min: 20, max: 300, step: 5,
        tooltip: 'Distance à laquelle un carnivore déclenche la fuite. Plus grand que la vision → l\'herbivore est très réactif mais stressé.',
      },
      {
        key: 'HERBIVORE_REPR_THRESHOLD', label: 'Seuil reprod.', min: 20, max: 115, step: 5,
        tooltip: 'Énergie minimale pour se reproduire. Un seuil élevé = reproductions rares mais descendants robustes.',
      },
      {
        key: 'HERBIVORE_REPR_COST', label: 'Coût reprod.', min: 5, max: 70, step: 5,
        tooltip: 'Énergie dépensée lors d\'une reproduction. Si supérieur au seuil, les herbivores ne peuvent se reproduire qu\'une fois avant de devoir remanger.',
      },
      {
        key: 'HERBIVORE_REPR_COOLDOWN', label: 'Cooldown reprod.', min: 30, max: 1200, step: 25,
        tooltip: 'Nombre de ticks entre deux reproductions d\'un même individu. Réduit les explosions démographiques.',
      },
      {
        key: 'HERBIVORE_MAX_COUNT', label: 'Population max', min: 20, max: 500, step: 10,
        tooltip: 'Plafond absolu de la population. Empêche une explosion qui écraserait les carnivores et dévorerait toutes les plantes.',
      },
      {
        key: 'INITIAL_HERBIVORES', label: 'Population init.', min: 2, max: 120, step: 2, needsReset: true,
        tooltip: 'Nombre d\'herbivores placés au démarrage. N\'affecte que la prochaine réinitialisation.',
      },
    ],
  },
  {
    id: 'carnivores',
    title: '🦊 Carnivores',
    color: '#fb923c',
    params: [
      {
        key: 'CARNIVORE_ENERGY_DRAIN', label: 'Drain énergie', min: 0.1, max: 5, step: 0.1,
        tooltip: 'Énergie perdue par tick. Les carnivores ont un métabolisme plus élevé : ils meurent vite s\'ils ne chassent pas.',
      },
      {
        key: 'CARNIVORE_ENERGY_FROM_HERBIVORE', label: 'Gain / herbivore', min: 10, max: 150, step: 5,
        tooltip: 'Énergie récupérée en tuant un herbivore. Un gain élevé permet de survivre longtemps entre deux chasses.',
      },
      {
        key: 'CARNIVORE_SPEED', label: 'Vitesse', min: 0.5, max: 6, step: 0.1,
        tooltip: 'Vitesse de chasse. Doit être suffisamment supérieure à celle des herbivores pour attraper des proies.',
      },
      {
        key: 'CARNIVORE_VISION', label: 'Vision', min: 30, max: 300, step: 5,
        tooltip: 'Rayon de détection des proies. Une grande vision compense une faible densité d\'herbivores.',
      },
      {
        key: 'CARNIVORE_REPR_THRESHOLD', label: 'Seuil reprod.', min: 20, max: 140, step: 5,
        tooltip: 'Énergie minimale pour se reproduire. Les carnivores ne se reproduisent qu\'après une chasse réussie.',
      },
      {
        key: 'CARNIVORE_REPR_COST', label: 'Coût reprod.', min: 5, max: 90, step: 5,
        tooltip: 'Énergie dépensée lors d\'une reproduction. Un coût élevé limite les surpopulations de prédateurs.',
      },
      {
        key: 'CARNIVORE_REPR_COOLDOWN', label: 'Cooldown reprod.', min: 50, max: 2000, step: 50,
        tooltip: 'Nombre de ticks entre deux reproductions. Un cooldown long évite qu\'une bonne période de chasse ne déclenche une surpopulation.',
      },
      {
        key: 'CARNIVORE_MAX_COUNT', label: 'Population max', min: 3, max: 150, step: 5,
        tooltip: 'Plafond absolu des carnivores. Évite l\'extinction totale des herbivores.',
      },
      {
        key: 'INITIAL_CARNIVORES', label: 'Population init.', min: 1, max: 60, step: 1, needsReset: true,
        tooltip: 'Nombre de carnivores au démarrage. N\'affecte que la prochaine réinitialisation.',
      },
    ],
  },
  {
    id: 'genetics',
    title: '🧬 Génétique',
    color: '#c084fc',
    params: [
      {
        key: 'MUTATION_RATE', label: 'Taux de mutation', min: 0, max: 1, step: 0.05,
        tooltip: 'Probabilité qu\'un gène soit muté lors de la reproduction. 0 = population stable et homogène, 1 = tous les gènes mutent à chaque naissance.',
      },
      {
        key: 'MUTATION_STRENGTH', label: 'Force mutation', min: 0, max: 1, step: 0.05,
        tooltip: 'Amplitude maximale d\'une mutation, en proportion de la valeur courante du gène. Ex : 0.35 = ±35% de variation par gène muté.',
      },
    ],
  },
]

function fmt(v: number, step: number): string {
  if (step >= 1)    return String(Math.round(v))
  if (step >= 0.1)  return v.toFixed(1)
  if (step >= 0.01) return v.toFixed(2)
  return v.toFixed(4)
}

// ── Persistance localStorage ──────────────────────────────────────────────────

const STORAGE_KEY = 'simulatioss-config'

function saveConfig(keys: ConfigKey[]): void {
  const data: Record<string, number> = {}
  for (const key of keys) data[key] = CONFIG[key] as number
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadSavedConfig(keys: ConfigKey[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Record<string, number>
    for (const key of keys) {
      if (key in data && typeof data[key] === 'number') {
        (CONFIG as Record<string, number>)[key] = data[key]
      }
    }
  } catch { /* JSON corrompu → on ignore */ }
}

// ── Shared tooltip singleton ──────────────────────────────────────────────────

function createTooltip(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = 'sp-tooltip'
  document.body.appendChild(el)
  return el
}

function showTooltip(tip: HTMLDivElement, text: string, anchor: HTMLElement): void {
  tip.textContent = text
  tip.classList.add('visible')

  const rect = anchor.getBoundingClientRect()
  const panelWidth = 290
  const gap = 12
  const tipWidth = 220

  // Prefer left of panel; fall back to right if no room
  let left = window.innerWidth - panelWidth - gap - tipWidth
  if (left < 8) left = 8

  // Vertical: align with anchor row, clamp to viewport
  let top = rect.top + rect.height / 2 - 20
  const estHeight = 80 // rough tooltip height
  top = Math.max(8, Math.min(top, window.innerHeight - estHeight - 8))

  tip.style.left = left + 'px'
  tip.style.top  = top + 'px'
}

function hideTooltip(tip: HTMLDivElement): void {
  tip.classList.remove('visible')
}

// ── Main export ───────────────────────────────────────────────────────────────

export function setupSettingsPanel(onReset: () => void): void {
  const panel     = document.getElementById('settings-panel')!
  const toggleBtn = document.getElementById('settings-toggle')!
  const tip       = createTooltip()
  let isOpen      = false

  // Charger les valeurs sauvegardées avant de construire les sliders
  const allKeys = SECTIONS.flatMap(s => s.params.map(p => p.key))
  loadSavedConfig(allKeys)

  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen
    panel.classList.toggle('open', isOpen)
    toggleBtn.classList.toggle('active', isOpen)
  })

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      isOpen = !isOpen
      panel.classList.toggle('open', isOpen)
      toggleBtn.classList.toggle('active', isOpen)
    }
  })

  // Header
  const header = document.createElement('div')
  header.className = 'sp-header'
  header.innerHTML = `
    <span class="sp-title">Règles de simulation</span>
    <button class="sp-reset-all" id="sp-reset-defaults">↺ Défauts</button>
  `
  panel.appendChild(header)

  const note = document.createElement('div')
  note.className = 'sp-note'
  note.textContent = '↺ = prend effet au prochain reset (R)'
  panel.appendChild(note)

  const sliderMap = new Map<ConfigKey, { input: HTMLInputElement; display: HTMLSpanElement; step: number }>()

  for (const section of SECTIONS) {
    const sec = document.createElement('div')
    sec.className = 'sp-section'

    const title = document.createElement('div')
    title.className = 'sp-section-title'
    title.style.color = section.color
    title.textContent = section.title
    sec.appendChild(title)

    for (const param of section.params) {
      const row = document.createElement('div')
      row.className = 'sp-row'
      if (param.needsReset) row.classList.add('needs-reset')

      // Label wrap (label + optional ↺ badge + ⓘ icon)
      const labelWrap = document.createElement('div')
      labelWrap.className = 'sp-label-wrap'

      const label = document.createElement('span')
      label.className = 'sp-label'
      label.textContent = param.label
      labelWrap.appendChild(label)

      if (param.needsReset) {
        const badge = document.createElement('span')
        badge.className = 'sp-badge'
        badge.textContent = '↺'
        labelWrap.appendChild(badge)
      }

      // Info icon
      const infoIcon = document.createElement('span')
      infoIcon.className = 'sp-info'
      infoIcon.textContent = 'ⓘ'
      infoIcon.addEventListener('mouseenter', () => showTooltip(tip, param.tooltip, infoIcon))
      infoIcon.addEventListener('mouseleave', () => hideTooltip(tip))
      labelWrap.appendChild(infoIcon)

      // Slider
      const slider = document.createElement('input')
      slider.type = 'range'
      slider.className = 'sp-slider'
      slider.min   = String(param.min)
      slider.max   = String(param.max)
      slider.step  = String(param.step)
      slider.value = String(CONFIG[param.key])
      slider.style.setProperty('--thumb-color', section.color)

      // Value display (click to edit)
      const display = document.createElement('span')
      display.className = 'sp-val'
      display.textContent = fmt(CONFIG[param.key] as number, param.step)

      display.addEventListener('click', () => {
        const input = document.createElement('input')
        input.type      = 'number'
        input.className = 'sp-val-input'
        input.min   = String(param.min)
        input.max   = String(param.max)
        input.step  = String(param.step)
        input.value = String(CONFIG[param.key])
        display.replaceWith(input)
        input.focus()
        input.select()

        const commit = () => {
          const v = Math.min(param.max, Math.max(param.min, parseFloat(input.value) || (CONFIG[param.key] as number)));
          (CONFIG as Record<string, number>)[param.key] = v
          slider.value = String(v)
          display.textContent = fmt(v, param.step)
          input.replaceWith(display)
          saveConfig(allKeys)
        }
        input.addEventListener('blur', commit)
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit() })
      })

      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        (CONFIG as Record<string, number>)[param.key] = v
        display.textContent = fmt(v, param.step)
        if (param.needsReset) row.classList.add('changed')
        saveConfig(allKeys)
      })

      sliderMap.set(param.key, { input: slider, display, step: param.step })

      row.appendChild(labelWrap)
      row.appendChild(slider)
      row.appendChild(display)
      sec.appendChild(row)
    }

    panel.appendChild(sec)
  }

  document.getElementById('sp-reset-defaults')!.addEventListener('click', () => {
    for (const [key, { input, display, step }] of sliderMap) {
      const v = DEFAULTS[key] as number;
      (CONFIG as Record<string, number>)[key] = v
      input.value = String(v)
      display.textContent = fmt(v, step)
    }
    panel.querySelectorAll('.sp-row.changed').forEach(r => r.classList.remove('changed'))
    localStorage.removeItem(STORAGE_KEY)
    onReset()
  })
}
