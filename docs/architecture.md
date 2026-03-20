# POLYFLOWS — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Experience                           │
│                    (Singleton Orchestrator)                  │
│                                                             │
│  ┌─────────┐  ┌────────┐  ┌────────┐  ┌───────┐           │
│  │  Sizes   │  │ Scene  │  │ Camera │  │Renderer│           │
│  └─────────┘  └────────┘  └────────┘  └───────┘           │
│       ↕            ↕           ↕           ↕               │
│  ┌──────────────────────────────────────────────┐          │
│  │              World Layer                      │          │
│  │  ┌──────────────┐  ┌────────────┐            │          │
│  │  │PolygonSphere │→│PortalSystem│            │          │
│  │  └──────────────┘  └────────────┘            │          │
│  │  ┌──────────────┐                            │          │
│  │  │ Environment  │                            │          │
│  │  └──────────────┘                            │          │
│  └──────────────────────────────────────────────┘          │
│       ↕                                                     │
│  ┌──────────────────┐                                      │
│  │ ScrollController │  ← Director of the experience        │
│  └──────────────────┘                                      │
│       ↕                                                     │
│  ┌──────────┐  ┌──────────┐                                │
│  │  Debug   │  │ Helpers  │                                │
│  └──────────┘  └──────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Responsibilities

### `src/core/Experience.js`
- **Role**: Singleton orchestrator
- **Owns**: All subsystems (sizes, scene, camera, renderer, world, animation)
- **Runs**: The animation loop (`tick()`)
- **Wires**: Resize events between Sizes → Camera + Renderer

### `src/core/Sizes.js`
- **Role**: Viewport tracker
- **Emits**: `resize` events when window dimensions change
- **Provides**: `width`, `height`, `pixelRatio`

### `src/core/Scene.js`
- **Role**: Thin wrapper around `THREE.Scene`
- **Purpose**: Decouples scene access from Experience singleton

### `src/core/Camera.js`
- **Role**: Perspective camera manager
- **Handles**: Aspect ratio updates on resize
- **Hook**: `update()` for animation-driven camera movement

### `src/core/Renderer.js`
- **Role**: WebGL renderer configuration
- **Config**: ACES Filmic tone mapping, SRGB color space, antialiasing
- **Handles**: Resize, per-frame render calls

---

### `src/world/PolygonSphere.js`
- **Role**: Core geometry — the low-poly sphere world map
- **Generates**: IcosahedronGeometry → individual triangle tiles
- **Exposes**: `getTile(index)` for portal system interaction
- **Animates**: Idle hover, rotation, glow pulse

### `src/world/PortalSystem.js`
- **Role**: Tile-to-portal conversion and state management
- **States**: IDLE → HOVER → ACTIVE → TRAVERSING
- **Manages**: Portal shader material, activation uniforms
- **Coordinates**: Camera fly-through on traversal

### `src/world/Environment.js`
- **Role**: Lighting and atmosphere
- **Lights**: Ambient, directional (key), point (accent)
- **Controls**: Background color, fog density
- **Hook**: `transitionToPortal(progress)` for cinematic lighting shifts

---

### `src/shaders/sphere/`
- **Vertex**: Time-based displacement along normals
- **Fragment**: Fresnel edge glow with color pulse

### `src/shaders/portal/`
- **Vertex**: Activation-driven radial expansion
- **Fragment**: Noise vortex + fresnel glow with alpha fade

---

### `src/animation/ScrollController.js`
- **Role**: Director — maps scroll progress to experience phases
- **Phases**: Approach (0-25%) → Exploration (25-50%) → Activation (50-75%) → Traversal (75-100%)
- **Drives**: Camera, sphere, portal, and environment transitions

---

### `src/utils/Debug.js`
- **Role**: Conditional lil-gui debug panel
- **Activation**: URL hash `#debug`

### `src/utils/Helpers.js`
- **Exports**: `EventEmitter`, `clamp()`, `lerp()`, `mapRange()`

---

## Data Flow

```
Window scroll event
  → ScrollController.progress (0 → 1)
    → ScrollController.phase (approach | exploration | activation | traversal)
      → Camera position/rotation
      → PolygonSphere tile animations
      → PortalSystem activation states
      → Environment lighting transitions
        → Renderer.update() → frame output
```

---

## Reference Material

The `resources_from_ThreeJS_Journey/` directory contains reusable patterns:

| Directory               | Contents                                          |
|-------------------------|---------------------------------------------------|
| `geometry_patterns/`    | Sphere geometry, face extraction, buffer attributes|
| `shader_templates/`     | Noise, fresnel, vertex displacement GLSL           |
| `scroll_animation_patterns/` | GSAP ScrollTrigger templates                |
| `camera_patterns/`      | Dolly, orbit, fly-through, shake camera techniques |

Always consult these references before implementing new systems.
