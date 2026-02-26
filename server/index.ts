import express from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRESETS_FILE = join(__dirname, 'presets.json')
const PORT = Number(process.env.PORT) || 3001

function readPresets(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(PRESETS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writePresets(data: Record<string, unknown>): void {
  writeFileSync(PRESETS_FILE, JSON.stringify(data, null, 2))
}

const app = express()
app.use(express.json())

app.get('/api/presets', (_req, res) => {
  res.json(readPresets())
})

app.post('/api/presets', (req, res) => {
  const { name, config } = req.body as { name: string; config: Record<string, number> }
  if (!name || typeof name !== 'string' || !config) {
    res.status(400).json({ error: 'name and config are required' })
    return
  }
  const presets = readPresets()
  presets[name] = config
  writePresets(presets)
  res.json({ ok: true })
})

app.delete('/api/presets/:name', (req, res) => {
  const { name } = req.params
  const presets = readPresets()
  delete presets[name]
  writePresets(presets)
  res.json({ ok: true })
})

if (process.env.NODE_ENV === 'production') {
  const distDir = join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
