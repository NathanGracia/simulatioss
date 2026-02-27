const TOKEN = (import.meta.env.VITE_DETERMINOSS_TOKEN as string | undefined) ?? ''

interface SeedResponse {
  seed: string
  age_ms: number
  frame_jpeg?: string
}

export async function showSeedBanner(): Promise<void> {
  if (!TOKEN) return

  let data: SeedResponse
  try {
    const resp = await fetch(`https://determinoss.nathangracia.com/seed?token=${TOKEN}`)
    if (!resp.ok) return
    data = await resp.json() as SeedResponse
  } catch {
    return
  }

  injectStyles()
  renderBanner(data)
}

function renderBanner({ seed, age_ms, frame_jpeg }: SeedResponse): void {
  const ageLabel = age_ms < 2000
    ? `${age_ms} ms`
    : `${Math.round(age_ms / 1000)} s`

  const banner = document.createElement('div')
  banner.id = 'seed-banner'
  banner.innerHTML = `
    <div id="seed-banner-card">
      ${frame_jpeg ? `<img id="seed-banner-img" src="data:image/jpeg;base64,${frame_jpeg}" alt="lava lamp frame" />` : ''}
      <div id="seed-banner-body">
        <a id="seed-banner-title" href="https://determinoss.nathangracia.com/" target="_blank" rel="noopener">🌋 Seed lava-lamp ↗</a>
        <div id="seed-banner-hash">${seed}</div>
        <div id="seed-banner-age">âge : ${ageLabel}</div>
      </div>
      <button id="seed-banner-close" title="Fermer">×</button>
    </div>
  `

  document.body.appendChild(banner)

  // animate in
  requestAnimationFrame(() => {
    banner.classList.add('seed-banner-visible')
  })

  const dismiss = (): void => {
    banner.classList.remove('seed-banner-visible')
    banner.addEventListener('transitionend', () => banner.remove(), { once: true })
  }

  document.getElementById('seed-banner-close')!.addEventListener('click', dismiss)

  // auto-dismiss après 6 s
  setTimeout(dismiss, 6000)
}

function injectStyles(): void {
  if (document.getElementById('seed-banner-styles')) return
  const style = document.createElement('style')
  style.id = 'seed-banner-styles'
  style.textContent = `
    #seed-banner {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%) translateY(-110%);
      z-index: 200;
      transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      opacity: 0;
      pointer-events: none;
    }
    #seed-banner.seed-banner-visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    #seed-banner-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(5,8,18,0.90);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 10px 14px 10px 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
      max-width: min(480px, calc(100vw - 32px));
    }
    #seed-banner-img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    #seed-banner-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    #seed-banner-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255,200,80,0.8);
      text-decoration: none;
      transition: color 0.12s;
    }
    #seed-banner-title:hover { color: rgba(255,220,120,1); }
    #seed-banner-hash {
      font-size: 11px;
      font-family: 'Courier New', monospace;
      color: rgba(255,255,255,0.85);
      letter-spacing: 0.03em;
      word-break: break-all;
      line-height: 1.5;
    }
    #seed-banner-age {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
    }
    #seed-banner-close {
      align-self: flex-start;
      background: none;
      border: none;
      color: rgba(255,255,255,0.35);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0 2px;
      flex-shrink: 0;
      transition: color 0.12s;
    }
    #seed-banner-close:hover { color: rgba(255,255,255,0.85); }
  `
  document.head.appendChild(style)
}
