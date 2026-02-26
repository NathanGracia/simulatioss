# CLAUDE.md — Simulatioss

## Projet
Simulation d'écosystème procédurale. TypeScript vanilla + Vite + Canvas 2D. Aucune lib de rendu.

## Commandes
```bash
npm run dev      # dev server (Vite, localhost:5173)
npm run build    # tsc + vite build → dist/
npx tsc --noEmit # type check seul
```

## Architecture clé

### Boucle principale (`src/main.ts` + `src/world.ts`)
- `requestAnimationFrame` → `world.update()` × speedMultiplier → `renderer.render()`
- `world.update()` : rebuild grilles spatiales → plantes → herbivores → carnivores → cleanup morts
- Le `BiomeMap` est recréé à chaque `world.initialize()` (reset)

### Entités (`src/entities/`)
- `Entity` → `Animal` (abstract) → `Herbivore` / `Carnivore`
- `Animal` porte le cache A* : `cachedPath`, `pathTargetPos`, `pathBiomeVersion`, `pathIndex`
- Les propriétés comme `maxSpeed`, `reprThreshold` sont copiées depuis CONFIG à la construction — les sliders affectent les nouvelles entités mais pas les existantes

### Systèmes (`src/systems/`)
- **spatialGrid** : cellule = CONFIG.CELL_SIZE px, key = `(cx & 0xffff) | (cy << 16)`
- **behavior** : priorité 0=évitement mur+eau, 1=fuite, 2=manger, 3=reproduire, 4=errer
- **pathfinder** : A* sur grille biome (scale=5px/cell). `getSeekTarget()` fait d'abord un ray-march ; si ligne de vue libre, retourne la cible directement (pas de A*)
- **steering** : lerp vélocité t=0.15, clamp maxSpeed. `WALL_MARGIN=80px`, `WATER_REPULSION_RADIUS=4px`

### BiomeMap (`src/biomeMap.ts`)
- Grille `Uint8Array` à scale=5 px/cell
- `BIOME.PRAIRIE=0`, `BIOME.WATER=1`
- `distField: Float32Array` — distance en px à l'eau, calculée par BFS, utilisée par `isNearWater()` en O(1)
- `version` incrémenté à chaque `paint()` → invalide les caches A* des entités
- `isDirty` → le renderer repose le biome layer offscreen

### Renderer (`src/ui/renderer.ts`)
- **biome layer** : canvas offscreen recalculé uniquement quand `biomeMap.isDirty` ou taille changée. Contient : grass (blur), sable (5 draw calls blurrés), eau (blur). Copié en 1 `drawImage` par frame.
- **shimmer** : seul `ctx.filter = blur()` restant dans le hot path (animé via world.tick)
- **shadowBlur** : valeur fixe par type d'entité (setté une fois avant la boucle, pas par entité)
- **particules** : max 400, mises à jour à display rate (pas simulation rate)
- **ripples** : calculées live depuis `world.tick + entity.id * 17`, zéro état

### Settings (`src/ui/settings.ts`)
- `DEFAULTS = {...CONFIG}` snapshot au load
- `loadSavedConfig()` exportée et appelée dans `main.ts` **avant** `new World()` — important pour que les spawns initiaux utilisent les bonnes valeurs
- Clé localStorage : `'simulatioss-config'`
- Paramètres `needsReset: true` → prennent effet au prochain `world.initialize()`

### Painter (`src/ui/painter.ts`)
- Events sur `document` (pas canvas) pour traverser les overlays z-index
- Exclusion UI via `element.closest('#ui-overlay, #settings-panel, #settings-toggle')`
- `biomeMap.version++` à chaque paint → invalide caches A* automatiquement

## Conventions
- Toutes les constantes dans `src/config.ts` — ne jamais hardcoder de magic numbers ailleurs
- World coordinates = CSS pixels (le canvas est scaled avec `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`)
- Vec2 est immutable (toutes les opérations retournent une nouvelle instance)
- Les entités mortes (`dead = true`) sont filtrées en fin de `world.update()`, pas mid-loop

## Pièges connus
- `ctx.filter = 'blur(...)'` est très coûteux — toujours cacher le résultat, ne jamais appeler dans le hot path
- Le BFS du distance field doit utiliser un `visited: Uint8Array` pour éviter une queue infinie
- `loadSavedConfig()` doit être appelé avant `new World()` sinon les spawns initiaux ignorent le localStorage
- `biomeMap.initialize()` recrée la biomeMap (lacs random) — les dessins utilisateur sont perdus au reset
