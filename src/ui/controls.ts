export interface SimControls {
  paused: boolean
  speedMultiplier: number
  resetRequested: boolean
}

export function setupControls(controls: SimControls): void {
  const btnPause = document.getElementById('btn-pause') as HTMLButtonElement
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement
  const speedVal = document.getElementById('speed-val') as HTMLSpanElement

  btnPause.addEventListener('click', () => {
    controls.paused = !controls.paused
    btnPause.textContent = controls.paused ? '▶ Play' : '⏸ Pause'
  })

  btnReset.addEventListener('click', () => {
    controls.resetRequested = true
    controls.paused = false
    btnPause.textContent = '⏸ Pause'
  })

  speedSlider.addEventListener('input', () => {
    const v = parseInt(speedSlider.value, 10)
    controls.speedMultiplier = v
    speedVal.textContent = `×${v}`
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault()
      controls.paused = !controls.paused
      btnPause.textContent = controls.paused ? '▶ Play' : '⏸ Pause'
    }
    if (e.code === 'KeyR') {
      controls.resetRequested = true
      controls.paused = false
      btnPause.textContent = '⏸ Pause'
    }
  })
}

export function updateCounters(plants: number, herbivores: number, carnivores: number): void {
  const p = document.getElementById('cnt-plant')
  const h = document.getElementById('cnt-herb')
  const c = document.getElementById('cnt-carn')
  if (p) p.textContent = String(plants)
  if (h) h.textContent = String(herbivores)
  if (c) c.textContent = String(carnivores)
}
