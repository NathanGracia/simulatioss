# Simulatioss

Simulation d'écosystème procédurale en temps réel — TypeScript + Canvas 2D.

![Demo](https://img.shields.io/badge/stack-TypeScript%20%2B%20Vite%20%2B%20Canvas2D-blue)

## Aperçu

Trois espèces coexistent dans un monde généré procéduralement :

- **🌿 Plantes** — poussent sur les berges des lacs, se dispersent, s'étouffent si trop denses
- **🐇 Herbivores** — cherchent les plantes, fuient les carnivores, se reproduisent
- **🦊 Carnivores** — chassent les herbivores, évitent l'eau

Les populations oscillent naturellement (cycles Lotka-Volterra). Les créatures naviguent autour des obstacles grâce à un pathfinding A* avec cache par entité.

## Features

- **Biomes procéduraux** — lacs organiques générés à chaque reset (forme déformée par ondes sinusoïdales), transition sable/eau/prairie
- **Peinture en direct** — dessine ou efface des lacs pendant la simulation
- **Pathfinding A*** — les entités contournent l'eau intelligemment (cache + string-pulling)
- **Comportements émergents** — fuite, chasse, reproduction, errance avec priorités strictes
- **Énergie visuelle** — le halo lumineux de chaque entité reflète son niveau d'énergie
- **Signaux de reproduction** — ondes roses pulsantes quand une entité est prête à se reproduire
- **Particules d'accouplement** — burst de particules lors d'une reproduction
- **Panneau de paramètres** — 30+ constantes ajustables en live, sauvegardées en localStorage
- **Graphe de population** — courbes en temps réel (herbivores, carnivores, plantes)

## Stack

| Outil | Usage |
|-------|-------|
| TypeScript 5.x | Langage principal |
| Vite 5.x | Dev server + build |
| Canvas 2D | Rendu (pas de lib externe) |

Aucune dépendance de rendu (pas de Pixi, pas de Three.js).

## Lancer le projet

```bash
npm install
npm run dev        # localhost:5173
npm run build      # → dist/
```

## Architecture

```
src/
├── main.ts              # Entry point, game loop, canvas setup
├── world.ts             # Conteneur simulation + boucle tick
├── config.ts            # Toutes les constantes tunables
├── biomeMap.ts          # Carte des biomes + génération lacs + distance field
├── math/vec2.ts         # Vec2 (opérations vectorielles)
├── entities/
│   ├── entity.ts        # Classe de base
│   ├── plant.ts
│   ├── animal.ts        # Classe intermédiaire + cache A*
│   ├── herbivore.ts
│   └── carnivore.ts
├── systems/
│   ├── spatialGrid.ts   # Grille spatiale O(1) pour lookups voisins
│   ├── steering.ts      # seek / flee / wander / wallAvoid
│   ├── behavior.ts      # Arbre de priorité comportements + évitement eau
│   ├── pathfinder.ts    # A* + MinHeap + string-pulling + cache entité
│   ├── energy.ts        # Drain métabolique
│   ├── feeding.ts       # Consommation plante / herbivore
│   └── reproduction.ts  # Spawn offspring
└── ui/
    ├── renderer.ts      # Rendu Canvas (biome layer caché, particules, ripples)
    ├── stats.ts         # Graphe population
    ├── controls.ts      # Pause / vitesse / reset
    ├── settings.ts      # Panneau paramètres + localStorage
    └── painter.ts       # Peinture biome en live
```

## Déploiement VPS

```bash
npm run build
# Servir dist/ avec nginx ou Caddy (fichiers statiques)
```

## Contrôles

| Action | Raccourci |
|--------|-----------|
| Pause / Play | `Space` |
| Reset | `R` |
| Panneau paramètres | `P` |
| Peindre un lac | Clic-glissé sur la carte |
| Changer pinceau | Boutons 💧 / 🌾 dans les contrôles |
