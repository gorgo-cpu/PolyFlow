# POLYFLOWS — Complete Repository Breakdown

> **Purpose of this document**: Provide total context about the POLYFLOWS interactive sphere project in a single file. Any AI coding agent reading this document should immediately understand the architecture, the purpose of every file, and how all systems connect. This is the canonical reference for the entire codebase.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Tree](#repository-tree)
4. [Interaction Model — The Four Phases](#interaction-model--the-four-phases)
5. [Directory Breakdown](#directory-breakdown)
   - [Root Configuration](#root-configuration)
   - [src/core/ — Engine Layer](#srccore--engine-layer)
   - [src/world/ — Scene Objects](#srcworld--scene-objects)
   - [src/shaders/ — GLSL Shader Code](#srcshaders--glsl-shader-code)
   - [src/animation/ — Scroll Orchestration](#srcanimation--scroll-orchestration)
   - [src/utils/ — Utilities](#srcutils--utilities)
   - [resources_from_ThreeJS_Journey/ — Reference Library](#resources_from_threejs_journey--reference-library)
   - [docs/ — Documentation](#docs--documentation)
6. [System Architecture Diagram](#system-architecture-diagram)
7. [Data Flow](#data-flow)
8. [File-by-File Reference](#file-by-file-reference)
9. [Shader Architecture](#shader-architecture)
10. [Scroll Phase Mapping](#scroll-phase-mapping)
11. [Visual Design Language](#visual-design-language)
12. [Implementation Guidance for AI Agents](#implementation-guidance-for-ai-agents)
13. [Future Extensions](#future-extensions)

---

## Project Overview

POLYFLOWS is a **scroll-driven exploratory 3D experience** built with Three.js. A low-polygon sphere acts as a navigable world map. Each triangular face of the sphere is a potential **portal** — a gateway into a new dimension of content.

The user scrolls through the page. The camera approaches the sphere, explores its surface, watches a tile morph into a portal, and then flies through it into a new world.

This is the type of **flagship interactive landing page** used by elite WebGL studios (Lusion, Dennis Snellenberg, etc.) for high-impact brand experiences.

---

## Tech Stack

| Layer           | Technology                  | Purpose                                |
|-----------------|-----------------------------|----------------------------------------|
| **3D Engine**   | Three.js (`^0.160.0`)       | Scene graph, geometry, materials       |
| **Shaders**     | GLSL (vertex + fragment)    | Custom visual effects                  |
| **Animation**   | GSAP (`^3.12.5`)            | Scroll-driven animation, tweens        |
| **Bundler**     | Vite (`^5.0.0`)             | Dev server, GLSL imports, HMR          |
| **Debug**       | lil-gui (optional)          | Runtime parameter tweaking             |

---

## Repository Tree

```
polyflows-interactive-sphere/
│
├── README.md                          # Quick-start guide for humans and AI agents
├── package.json                       # Dependencies: three, gsap, vite
├── vite.config.js                     # Vite config with GLSL import support
├── .gitignore                         # Standard Node/Vite ignores
│
├── public/
│   └── favicon.svg                    # Polygon sphere icon
│
├── src/
│   ├── main.js                        # Entry point — bootstraps Experience
│   ├── style.css                      # Base CSS reset, canvas & scroll layout
│   │
│   ├── core/                          # ═══ ENGINE LAYER ═══
│   │   ├── Experience.js              # Singleton orchestrator, animation loop
│   │   ├── Renderer.js                # WebGL renderer config
│   │   ├── Camera.js                  # Perspective camera management
│   │   ├── Scene.js                   # THREE.Scene wrapper
│   │   └── Sizes.js                   # Viewport tracking + resize events
│   │
│   ├── world/                         # ═══ SCENE OBJECTS ═══
│   │   ├── PolygonSphere.js           # Low-poly sphere with tile extraction
│   │   ├── PortalSystem.js            # Tile → portal conversion & states
│   │   └── Environment.js             # Lighting, background, fog
│   │
│   ├── shaders/                       # ═══ GLSL SHADERS ═══
│   │   ├── sphere/
│   │   │   ├── vertex.glsl            # Vertex displacement
│   │   │   └── fragment.glsl          # Fresnel edge glow
│   │   └── portal/
│   │       ├── vertex.glsl            # Radial expansion
│   │       └── fragment.glsl          # Noise vortex + fresnel
│   │
│   ├── animation/                     # ═══ SCROLL ORCHESTRATION ═══
│   │   └── ScrollController.js        # Maps scroll % → animation phases
│   │
│   └── utils/                         # ═══ UTILITIES ═══
│       ├── Debug.js                   # Conditional lil-gui panel
│       └── Helpers.js                 # EventEmitter, lerp, clamp, mapRange
│
├── resources_from_ThreeJS_Journey/    # ═══ REFERENCE LIBRARY ═══
│   ├── LESSON_INDEX.md                # Master index of all lessons with relevance ratings
│   ├── 06-cameras-final/              # PerspectiveCamera, OrbitControls
│   ├── 19-scroll-based-animation-final/ # 🔴 Scroll-driven camera + GSAP triggers
│   ├── 26-code-structuring-for-bigger-projects-final/ # 🔴 Singleton Experience pattern
│   ├── 27-shaders-final/              # 🔴 ShaderMaterial, uniforms, attributes
│   ├── 28-shader-patterns-final/      # 🟠 Procedural fragment patterns
│   ├── 31-modified-materials-final/   # 🟡 onBeforeCompile shader injection
│   ├── 33-hologram-shader-final/      # 🟠 Fresnel + transparency + additive blending
│   ├── 39-particles-cursor-animation-shader-final/ # 🟡 GPU particles + cursor interaction
│   ├── 45-post-processing-final/      # 🟠 EffectComposer, bloom, custom passes
│   ├── 62-mouse-events-with-r3f-final/ # 🟢 R3F interaction patterns
│   └── 63-post-processing-with-r3f-final/ # 🟢 R3F post-processing + custom effects
│
└── docs/
    ├── architecture.md                # System diagram + module responsibilities
    └── polyflows_concept.md           # Creative vision + interaction phases
```

---

## Interaction Model — The Four Phases

The entire experience is driven by **scroll position**, mapped from 0% to 100%:

```
┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  APPROACH   │ →  │ EXPLORATION  │ →  │  ACTIVATION  │ →  │  TRAVERSAL   │
│  0% – 25%  │    │  25% – 50%   │    │  50% – 75%   │    │  75% – 100%  │
└────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
  Camera           Camera orbits       Tile detaches,       Camera flies
  dollies in       the sphere.         morphs into          through portal
  toward sphere.   Tiles react.        a portal vortex.     to new world.
```

### Phase 1: Approach (0%–25%)
- Camera begins far away, dollies toward the sphere
- Sphere rotates gently with fresnel-lit edges
- **Feeling**: Discovery, anticipation

### Phase 2: Exploration (25%–50%)
- Camera orbits the sphere surface
- Individual tiles begin reacting: subtle glow, hover displacement
- **Feeling**: Curiosity — each face holds a secret

### Phase 3: Activation (50%–75%)
- A tile detaches from the sphere surface
- It expands and morphs into a portal — noise-driven vortex
- Environment lighting shifts dramatically
- **Feeling**: Transformation — the world is opening

### Phase 4: Traversal (75%–100%)
- Camera flies through the portal on a CatmullRom spline path
- Portal shader fills the viewport
- On the other side: a new world
- **Feeling**: Transcendence, arrival

---

## Directory Breakdown

### Root Configuration

#### `package.json`
Standard Node.js project manifest. Dependencies:
- **`three` (^0.160.0)** — 3D rendering engine
- **`gsap` (^3.12.5)** — animation library with ScrollTrigger
- **`vite` (^5.0.0)** — development server and bundler

Scripts: `dev`, `build`, `preview`.

#### `vite.config.js`
Custom Vite configuration that:
- Imports `.glsl` files as raw strings via a custom plugin
- Opens the browser automatically on `dev`
- Outputs to `dist/` with sourcemaps

#### `.gitignore`
Excludes `node_modules/`, `dist/`, OS files, `.env`, `.vscode/`.

---

### `src/core/` — Engine Layer

This directory contains the **Three.js initialization and runtime infrastructure**. It mirrors the modular architecture pattern from **Lesson 26 — Code Structuring for Bigger Projects**.

#### `Experience.js` — Singleton Orchestrator

The central hub. Creates and owns every subsystem.

**Key responsibilities:**
- Instantiates Sizes, Scene, Camera, Renderer
- Instantiates world objects (PolygonSphere, PortalSystem, Environment)
- Instantiates ScrollController
- Runs the animation loop (`tick()` → `update()` → `requestAnimationFrame`)
- Wires resize events from Sizes to Camera and Renderer

**Singleton pattern**: Only one Experience instance can exist. Subsequent `new Experience()` calls return the existing instance.

**Reference**: See `26-code-structuring-for-bigger-projects-final/src/Experience/` for the original pattern.

**API:**
```javascript
const experience = new Experience(canvasElement);
experience.sizes      // → Sizes instance
experience.scene      // → Scene instance
experience.camera     // → Camera instance
experience.renderer   // → Renderer instance
experience.polygonSphere  // → PolygonSphere instance
experience.portalSystem   // → PortalSystem instance
experience.scrollController // → ScrollController instance
```

#### `Renderer.js`

Configures the WebGL renderer with production-quality defaults:
- **Tone mapping**: ACES Filmic (cinematic color response)
- **Color space**: SRGB
- **Antialiasing**: enabled
- **Pixel ratio**: capped at 2.0 (via Sizes)
- **Clear color**: black (`#000000`)

#### `Camera.js`

Manages a `THREE.PerspectiveCamera`:
- **FOV**: 35° (cinematic, less distortion than default 75°)
- **Near/Far**: 0.1 to 100
- **Initial position**: `(0, 0, 6)` — facing the sphere origin
- **`update()`**: Hook for animation-driven position/lookAt changes

**Reference**: See `06-cameras-final/` for PerspectiveCamera and OrbitControls fundamentals.

#### `Scene.js`

Thin wrapper around `THREE.Scene`. Exists to decouple scene references from the Experience singleton. Any subsystem can import Scene independently.

#### `Sizes.js`

Tracks viewport dimensions and emits `resize` events:
- Extends `EventEmitter` (from Helpers.js)
- Monitors `window.innerWidth`, `window.innerHeight`
- Caps `devicePixelRatio` at 2.0 for performance
- Other classes listen via `sizes.on('resize', callback)`

---

### `src/world/` — Scene Objects

Contains the actual 3D objects that make up the POLYFLOWS experience.

#### `PolygonSphere.js` — The Core Geometry

The centrepiece of the experience. A low-poly icosphere where each triangular face is an independently animatable tile.

**Key responsibilities:**
- Generate `IcosahedronGeometry` at the desired detail level
- Convert to non-indexed geometry
- Extract each triangle face into a separate `THREE.Mesh` (tile)
- Group tiles under a `THREE.Group`
- Apply the sphere shader material
- Expose `getTile(index)` so PortalSystem can reference specific tiles
- `update()` — per-frame idle animation (hover, rotation, pulse)

**Geometry approach**:
```javascript
const geo = new THREE.IcosahedronGeometry(1, 1); // ~80 faces
const nonIndexed = geo.toNonIndexed();
// Extract each 3-vertex group → individual tile mesh
```

**Reference**: See `27-shaders-final/` for custom buffer attributes (`aRandom`) and `28-shader-patterns-final/` for procedural UV techniques.

#### `PortalSystem.js` — Tile → Portal Conversion

Manages the transformation of sphere tiles into interactive portals.

**Portal states:**
| State       | Description                                    |
|-------------|------------------------------------------------|
| `IDLE`      | Default state, no special rendering            |
| `HOVER`     | Tile is highlighted, subtle glow               |
| `ACTIVE`    | Tile is morphing into a portal opening         |
| `TRAVERSING`| Camera is flying through this portal           |

**Key responsibilities:**
- `createPortal(tileIndex)` — converts a tile to a portal
- `setPortalState(tileIndex, state)` — drives animation transitions
- Replaces tile material with portal shader
- Updates portal shader uniforms (time, activation progress) each frame
- Coordinates with Camera for fly-through animation

**Reference**: See `33-hologram-shader-final/` for transparent + additive blending shader setup that closely matches portal rendering needs.

#### `Environment.js` — Lighting & Atmosphere

**Lighting setup:**
| Light       | Type          | Color     | Intensity | Purpose               |
|-------------|---------------|-----------|-----------|------------------------|
| Ambient     | AmbientLight  | `#ffffff` | 0.3       | Soft base illumination |
| Key         | Directional   | `#ffffff` | 1.0       | Primary light source   |
| Accent      | PointLight    | `#6C63FF` | 1.5       | Purple glow near sphere|

**Background**: Pure black with fog (start: 5, end: 15) for depth falloff.

**`transitionToPortal(progress)`**: Hook for dynamically shifting lighting during portal activation (e.g., dim ambient, intensify accent).

---

### `src/shaders/` — GLSL Shader Code

All GLSL is isolated from JavaScript runtime logic. Shaders are imported as raw strings via the Vite GLSL plugin (same approach as **Lesson 27**).

#### `sphere/vertex.glsl`

**Purpose**: Subtle surface animation for the sphere tiles.

**Uniforms:**
- `uTime` — elapsed time for animation
- `uDisplacementStrength` — controls displacement amplitude

**Logic**: Displaces vertices along their normals using a sine wave modulated by position, creating an organic breathing effect.

**Varyings passed to fragment:**
- `vNormal`, `vPosition`, `vUv`

#### `sphere/fragment.glsl`

**Purpose**: Renders each tile with a fresnel edge glow.

**Uniforms:**
- `uTime` — for color pulse animation
- `uBaseColor` — tile base color (e.g., dark gray)
- `uGlowColor` — edge glow color (e.g., `#6C63FF`)
- `uGlowIntensity` — controls fresnel strength

**Logic**:
1. Calculate fresnel term from view angle vs. surface normal
2. Mix base color with glow color using fresnel
3. Add a subtle `sin(uTime)` pulse to the glow

**Reference**: See `33-hologram-shader-final/src/shaders/holographic/` for a production-quality fresnel implementation.

#### `portal/vertex.glsl`

**Purpose**: Radial expansion when a tile morphs into a portal.

**Uniforms:**
- `uTime` — elapsed time
- `uActivationProgress` — 0 (closed) to 1 (fully open)

**Logic**: Pushes vertices outward from center based on activation progress, creating the portal opening effect.

#### `portal/fragment.glsl`

**Purpose**: Animated noise-driven vortex with fresnel glow.

**Uniforms:**
- `uTime` — drives vortex animation
- `uActivationProgress` — controls opacity fade
- `uPortalColor` — portal tint color

**Logic**:
1. Convert UVs to polar coordinates (distance from center + angle)
2. Apply noise function for vortex distortion
3. Add fresnel rim glow
4. Modulate alpha by activation progress and radial distance

**Reference**: See `28-shader-patterns-final/src/shaders/test/fragment.glsl` for extensive UV manipulation patterns, and `33-hologram-shader-final/src/shaders/includes/random2D.glsl` for noise utilities.

---

### `src/animation/` — Scroll Orchestration

#### `ScrollController.js` — The Director

The most important file for the overall experience flow. Maps **scroll progress → animation states**.

**Properties:**
- `progress` — `0` to `1` normalized scroll position
- `phase` — `'approach'` | `'exploration'` | `'activation'` | `'traversal'`

**Phase boundaries:**
```
0.00 ─── 0.25 ─── 0.50 ─── 0.75 ─── 1.00
   approach  exploration  activation  traversal
```

**Current implementation**: Native scroll listener calculating progress from `scrollY / scrollHeight`.

**Intended implementation**: Replace with GSAP ScrollTrigger for smoother scrubbing.

**Reference**: See `19-scroll-based-animation-final/src/script.js` for the complete scroll-to-camera pattern with section detection and GSAP triggers.

**`update()`**: Hook called every frame to drive camera, sphere, portal, and environment animations based on current progress and phase.

---

### `src/utils/` — Utilities

#### `Debug.js`

Conditionally creates a **lil-gui** debug panel when `#debug` is in the URL hash.

```javascript
if (this.debug.active) {
  this.debug.gui.add(params, 'speed', 0, 10);
}
```

Useful for real-time tweaking of shader uniforms, light intensities, animation speeds.

#### `Helpers.js`

Exports:

**`EventEmitter`** (default export) — Minimal pub/sub system:
- `on(event, callback)` — subscribe
- `off(event, callback?)` — unsubscribe
- `trigger(event, ...args)` — emit

**Utility functions:**
- `clamp(value, min, max)` — restrict to range
- `lerp(start, end, t)` — linear interpolation
- `mapRange(value, inMin, inMax, outMin, outMax)` — remap value between ranges

---

### `resources_from_ThreeJS_Journey/` — Reference Library

This directory contains **complete lesson projects** from Three.js Journey. Each subfolder is a standalone Vite project that can be run independently. See `LESSON_INDEX.md` for the full breakdown.

#### Priority Map for POLYFLOWS

| Priority | Lesson | Key Takeaway | Use For |
|----------|--------|--------------|---------|
| 🔴 Critical | **19** — Scroll Animation | `scrollY → camera.position.y`, GSAP section triggers, cursor parallax | `ScrollController.js` |
| 🔴 Critical | **26** — Code Structuring | Singleton Experience, modular Camera/Renderer/World | `src/core/` architecture |
| 🔴 Critical | **27** — Shaders | `ShaderMaterial`, custom uniforms/attributes, GLSL imports | All `src/shaders/` work |
| 🟠 High | **28** — Shader Patterns | Procedural UV effects, step/smoothstep patterns | Sphere + portal fragment shaders |
| 🟠 High | **33** — Hologram Shader | Fresnel, transparency, additive blending, `random2D.glsl` | Portal shader rendering |
| 🟠 High | **45** — Post-Processing | `EffectComposer`, `UnrealBloomPass`, custom `ShaderPass` | Polish phase (bloom, effects) |
| 🟡 Medium | **31** — Modified Materials | `onBeforeCompile` shader injection, vertex twisting | Alternative shader approach |
| 🟡 Medium | **39** — Particles Cursor | Canvas displacement texture, raycaster, per-particle attributes | Tile hover + particle effects |
| 🟢 Low | **06** — Cameras | PerspectiveCamera basics, OrbitControls | Camera reference |
| 🟢 Low | **62** — Mouse Events (R3F) | R3F raycasting, pointer events | Future R3F migration |
| 🟢 Low | **63** — Post-Processing (R3F) | R3F `@react-three/postprocessing`, custom effects | Future R3F migration |

#### Key Patterns by Area

**Scroll Animation** (`19-scroll-based-animation-final/`):
- `scrollY / sizes.height * objectsDistance` — scroll-to-camera Y mapping
- `gsap.to(mesh.rotation, { ... })` — section change triggers
- `cameraGroup` cursor parallax with delta-time damping

**Code Architecture** (`26-code-structuring-for-bigger-projects-final/`):
- `Experience` singleton with separated Camera, Renderer, World directories
- EventEmitter for resize handling
- `sources.js` for resource loading configuration

**Shader Setup** (`27-shaders-final/`):
- `import vertexShader from './shaders/test/vertex.glsl'` — Vite GLSL import
- `THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uTime, uFrequency, uColor } })`
- Custom buffer attribute: `geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))`

**Holographic / Portal Effects** (`33-hologram-shader-final/`):
- `transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending`
- Fresnel + scanlines in GLSL
- GLTF model loading with custom shader material
- Contains `random2D.glsl` utility

**Post-Processing** (`45-post-processing-final/`):
- `EffectComposer` → `RenderPass` → `UnrealBloomPass` chain
- Custom `TintShader` and `DisplacementShader` via `ShaderPass`
- Proper resize handling for effect composer

---

### `docs/` — Documentation

#### `architecture.md`
- ASCII system diagram showing all modules and their relationships
- Responsibility list for every module
- Data flow diagram (scroll → phases → subsystem updates → render)
- Reference material index

#### `polyflows_concept.md`
- Creative vision statement
- Four-phase interaction breakdown with emotional targets
- Visual language guide (colors, treatments, atmosphere)
- Technical approach summary
- Creative references and future extensions

---

## System Architecture Diagram

```
                         ┌──────────────────┐
                         │   index.html      │
                         │   (Vite entry)    │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │     main.js       │
                         │  Creates Experience│
                         └────────┬─────────┘
                                  │
              ┌───────────────────▼───────────────────┐
              │            Experience.js               │
              │         (Singleton Orchestrator)        │
              │                                        │
              │     ┌──────────────────────────┐       │
              │     │      CORE SYSTEMS        │       │
              │     │                          │       │
              │     │  Sizes ──emit──▶ resize  │       │
              │     │  Scene  (THREE.Scene)    │       │
              │     │  Camera (PerspectiveCam) │       │
              │     │  Renderer (WebGLRenderer)│       │
              │     └──────────────────────────┘       │
              │                                        │
              │     ┌──────────────────────────┐       │
              │     │      WORLD OBJECTS       │       │
              │     │                          │       │
              │     │  PolygonSphere ─tiles──▶│       │
              │     │  PortalSystem  ◀────────│       │
              │     │  Environment             │       │
              │     └──────────────────────────┘       │
              │                                        │
              │     ┌──────────────────────────┐       │
              │     │     ANIMATION            │       │
              │     │  ScrollController        │       │
              │     │  (scroll % → phases)     │       │
              │     └──────────────────────────┘       │
              │                                        │
              │     tick() → update() → RAF loop       │
              └────────────────────────────────────────┘
                         │              │
              ┌──────────▼──┐   ┌───────▼──────┐
              │   Debug.js   │   │  Helpers.js   │
              │  (lil-gui)   │   │ EventEmitter  │
              │  (#debug URL)│   │ lerp, clamp   │
              └──────────────┘   └──────────────┘
```

### GLSL Shader Pipeline

```
  ┌─────────────────┐     import as string     ┌────────────────────┐
  │ sphere/vertex.glsl│ ────────────────────▶ │ ShaderMaterial in   │
  │ sphere/fragment.  │                        │ PolygonSphere.js    │
  └─────────────────┘                         └────────────────────┘

  ┌─────────────────┐     import as string     ┌────────────────────┐
  │ portal/vertex.glsl│ ────────────────────▶ │ ShaderMaterial in   │
  │ portal/fragment.  │                        │ PortalSystem.js     │
  └─────────────────┘                         └────────────────────┘
```

---

## Data Flow

```
User scrolls the page
  │
  ▼
window.scroll event
  │
  ▼
ScrollController.setupScroll()
  ├─ Calculate: progress = scrollY / scrollHeight  (0 → 1)
  └─ Determine: phase = approach | exploration | activation | traversal
       │
       ▼
  Experience.tick()  ← runs every frame via requestAnimationFrame
       │
       ├─▶ ScrollController.update()
       │     └─ Drive camera, sphere, portal based on progress/phase
       │
       ├─▶ Camera.update()
       │     └─ Apply scroll-driven position and lookAt
       │
       ├─▶ PolygonSphere.update(elapsedTime, deltaTime)
       │     └─ Idle animations, tile hover, glow pulse
       │     └─ Sphere shader uniforms: uTime, uDisplacementStrength
       │
       ├─▶ PortalSystem.update(elapsedTime, deltaTime)
       │     └─ Update portal shader uniforms: uTime, uActivationProgress
       │     └─ Animate based on portal state
       │
       └─▶ Renderer.update()
             └─ renderer.render(scene, camera) → WebGL output
```

---

## Scroll Phase Mapping

| Progress | Phase       | Camera Action       | Sphere Action          | Portal Action         | Environment Action     |
|----------|-------------|---------------------|------------------------|------------------------|------------------------|
| 0 – 0.25| Approach    | Dolly toward sphere | Gentle rotation        | —                     | Default lighting       |
| 0.25–0.50| Exploration| Orbit around sphere | Tiles highlight/hover  | —                     | Accent light intensify |
| 0.50–0.75| Activation | Focus on portal tile| Target tile detaches   | Vortex opens, glow    | Dim ambient, shift fog |
| 0.75–1.00| Traversal  | Fly through portal  | Sphere fades/scales    | Full screen vortex    | Dramatic color shift   |

---

## Visual Design Language

```
Color Palette:
  Primary:    #6C63FF  (electric violet)
  Accent:     #00D2FF  (cyan)
  Background: #000000  (pure black)
  Glow:       #6C63FF → #00D2FF gradient on edges

Geometry:
  Sphere = IcosahedronGeometry at detail 1–2
  Tiles = individual triangle faces
  Portal = expanded tile with radial vortex shader

Atmosphere:
  Fog: black, subtle depth falloff (near: 5, far: 15)
  Tone mapping: ACES Filmic
  Color space: SRGB
```

---

## Implementation Guidance for AI Agents

### Getting Started
```bash
npm install
npm run dev
```

### Key Principles

1. **Consult the reference library first** — before implementing any geometry, shader, or animation pattern, check `resources_from_ThreeJS_Journey/` for existing templates.

2. **Keep shaders isolated** — GLSL lives in `src/shaders/`, imported as strings. Never inline GLSL in JavaScript files.

3. **Respect the singleton** — `Experience.js` is the only entry point. All subsystems are accessed through it.

4. **Event-driven architecture** — `Sizes` emits `resize`. Other inter-system communication should follow the same EventEmitter pattern.

5. **Scroll is king** — `ScrollController.progress` drives everything. All other animations are functions of scroll progress.

### Recommended Implementation Order

1. **Implement the core engine** — get Renderer, Scene, Camera, Sizes producing a black canvas
2. **Build PolygonSphere** — create the icosphere, extract tiles, apply basic material
3. **Apply sphere shaders** — wire up `src/shaders/sphere/` with uniforms
4. **Add Environment** — lighting setup, fog
5. **Wire ScrollController** — connect scroll to camera movement
6. **Build PortalSystem** — tile selection, morph animation, portal shader
7. **Polish** — transitions, timing, performance optimization

### Example Prompt for AI Agents

> "Implement a minimal Three.js runtime inside `/src/core`, then create a low-poly sphere system in `/src/world/PolygonSphere.js`. The sphere should expose methods allowing tiles to detach and morph into portals. Use templates from `resources_from_ThreeJS_Journey` when applicable."

---

## Future Extensions

- **Multiple portal types** with different shader effects per portal
- **Portal content loading** — lazy-load new Three.js scenes within portals
- **Sound design** — Web Audio API integration for immersive audio
- **Mouse/touch interaction** — hover detection on tiles, click to activate
- **Mobile optimization** — reduce geometry detail, disable fog, simplify shaders
- **Post-processing** — bloom, chromatic aberration during portal traversal
- **Particle systems** — debris during tile detachment, stardust in portal
