type PresetConfig = Record<string, number>
type PresetsMap = Record<string, PresetConfig>

export async function fetchPresets(): Promise<PresetsMap> {
  const res = await fetch('/api/presets')
  if (!res.ok) throw new Error('Failed to fetch presets')
  return res.json() as Promise<PresetsMap>
}

export async function savePreset(name: string, config: PresetConfig): Promise<void> {
  const res = await fetch('/api/presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, config }),
  })
  if (!res.ok) throw new Error('Failed to save preset')
}

export async function deletePreset(name: string): Promise<void> {
  const res = await fetch(`/api/presets/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete preset')
}
