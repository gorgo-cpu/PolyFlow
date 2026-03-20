# POLYFLOWS — Concept Document

## Vision

POLYFLOWS is a **scroll-driven exploratory 3D experience** where a low-polygon sphere serves as a navigable world map. Each triangular face of the sphere is a potential gateway — a portal into a new dimension of content.

This is the type of **flagship interactive landing page** used by elite WebGL studios for high-impact brand experiences.

---

## Interaction Model

```
SCROLL ──→ SPHERE EXPLORATION ──→ TILE MORPHING ──→ PORTAL TRAVERSAL ──→ NEW WORLD
```

### Phase 1: Approach (Scroll 0%–25%)

The camera begins far from the sphere. As the user scrolls, the camera slowly dollies in. The sphere rotates gently, its low-poly faces catching light with subtle fresnel edges.

**Feeling**: *Discovery. Anticipation. Something is out there.*

### Phase 2: Exploration (Scroll 25%–50%)

The camera orbits the sphere. Individual tiles begin to react — subtle glow, slight hover displacement. The user perceives the sphere as a map of possibilities.

**Feeling**: *Curiosity. Each face holds a secret.*

### Phase 3: Activation (Scroll 50%–75%)

A specific tile detaches from the sphere surface. It expands, morphs, and reveals a portal — a vortex of noise-driven distortion and radial glow. The environment lighting shifts dramatically.

**Feeling**: *Transformation. The world is opening.*

### Phase 4: Traversal (Scroll 75%–100%)

The camera flies through the portal. A CatmullRom spline path guides the camera through distorted space. The portal shader fills the viewport. On the other side: a new world.

**Feeling**: *Transcendence. Arrival.*

---

## Visual Language

| Element          | Treatment                                    |
|------------------|----------------------------------------------|
| Sphere           | Low-poly icosahedron, dark base with glow edges |
| Tiles            | Individual triangular faces, selectable       |
| Portal opening   | Radial expansion, vortex noise, fresnel rim   |
| Background       | Deep black with subtle fog                    |
| Lighting         | Cool accent (purple/cyan), warm key light     |
| Color palette    | `#6C63FF` (primary), `#00D2FF` (accent), `#000000` (background) |

---

## Technical Approach

### Geometry
- `THREE.IcosahedronGeometry` at detail level 1–2
- Convert to non-indexed geometry for individual face access
- Each face becomes a separate mesh (tile) in a `THREE.Group`

### Shaders
- **Sphere shader**: Vertex displacement + fresnel fragment
- **Portal shader**: Noise-driven vortex + activation-based alpha
- All GLSL isolated in `src/shaders/`

### Animation
- GSAP ScrollTrigger maps scroll → animation phases
- Camera movement via GSAP tweens (dolly, orbit, fly-through)
- Shader uniforms driven by scroll progress

### Performance Targets
- 60fps on modern desktop browsers
- Graceful degradation (reduce detail level on mobile)
- Pixel ratio capped at 2.0

---

## Creative References

This experience draws inspiration from:

- **Awwwards-level WebGL portfolios** (e.g., Dennis Snellenberg, Lusion)
- **Three.js Journey course patterns** (stored in `resources_from_ThreeJS_Journey/`)
- **Cinematic game menus** (portal transitions, atmospheric lighting)
- **Generative art** (noise-driven organic motion)

---

## Future Extensions

- Multiple portal types with different shader effects
- Portal content loading (scenes within portals)
- Sound design integration (Web Audio API)
- Mouse/touch interaction alongside scroll
- Mobile-optimized fallback experience
