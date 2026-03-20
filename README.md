# POLYFLOWS Interactive Sphere

## Goal

Build a scroll-driven exploratory 3D experience where a polygon sphere acts as a world map.

## Interaction Model

**Scroll → sphere exploration → tile morphing → portal traversal → new world.**

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| 3D Engine    | Three.js                |
| Shaders      | GLSL (vertex + fragment)|
| Animation    | GSAP ScrollTrigger      |
| Bundler      | Vite                    |

## Project Structure

```
src/core/       → Engine layer (renderer, camera, scene, resize, loop)
src/world/      → Scene objects (sphere, portals, environment)
src/shaders/    → Isolated GLSL shader code
src/animation/  → Scroll orchestration
src/utils/      → Debug and helper utilities
```

## Important Folder

### `resources_from_ThreeJS_Journey/`

This folder contains reusable geometry, shader, and animation patterns derived from **Three.js Journey**. It should be treated as a **reference library** when implementing systems inside `/src`.

## Getting Started

```bash
npm install
npm run dev
```

## For AI Coding Agents

When implementing features, consult `resources_from_ThreeJS_Journey/` for reference patterns before generating code from scratch. See `docs/architecture.md` for the full engine design and `docs/polyflows_concept.md` for the creative vision.
