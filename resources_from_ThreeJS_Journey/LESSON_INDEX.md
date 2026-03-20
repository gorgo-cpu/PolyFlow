# Three.js Journey — Lesson Index

> This folder contains **complete lesson projects** extracted from the Three.js Journey course.
> Each subfolder is a standalone Vite project that can be run independently with `npm install && npm run dev`.

---

## Lessons & Relevance to POLYFLOWS

### 06 — Cameras
**Folder**: `06-cameras-final/`
**Teaches**: PerspectiveCamera, OrthographicCamera, OrbitControls, cursor-based camera movement.
**Relevance**: Foundation for `src/core/Camera.js`. Patterns for orbit controls and manual camera positioning.

---

### 19 — Scroll-Based Animation ⭐
**Folder**: `19-scroll-based-animation-final/`
**Teaches**: Scroll-driven camera movement, GSAP section triggers, parallax cursor effect, particle backgrounds, section-based mesh animations.
**Relevance**: **Critical reference** for `src/animation/ScrollController.js`. This is the core pattern POLYFLOWS is built on — mapping `scrollY` to camera position and triggering animations per section.

**Key patterns to extract**:
- `scrollY / sizes.height * objectsDistance` — scroll-to-camera mapping
- GSAP `gsap.to()` triggered on section change
- Cursor parallax via `cameraGroup`
- Particle field as background atmosphere

---

### 26 — Code Structuring for Bigger Projects ⭐
**Folder**: `26-code-structuring-for-bigger-projects-final/`
**Teaches**: Modular architecture with `Experience` singleton, separated Camera, Renderer, World, Utils classes, event-driven resize handling.
**Relevance**: **Direct blueprint** for `src/core/`. Our `Experience.js`, `Camera.js`, `Renderer.js`, `Sizes.js` structure mirrors this lesson exactly.

**Key patterns to extract**:
- Singleton Experience class
- EventEmitter for inter-module communication
- Separated World directory for scene objects
- Resource loading via `sources.js`

---

### 27 — Shaders ⭐
**Folder**: `27-shaders-final/`
**Teaches**: ShaderMaterial, custom uniforms (`uTime`, `uFrequency`, `uColor`), custom attributes (`aRandom`), vertex displacement (flag wave), passing textures to shaders, varyings between vertex & fragment.
**Relevance**: **Foundation** for all `src/shaders/` work. Shows how to wire up ShaderMaterial with uniforms and time-based animation.

**Key patterns to extract**:
- GLSL import via Vite (`import vertexShader from './shaders/test/vertex.glsl'`)
- `THREE.ShaderMaterial` with uniforms object
- Custom buffer attributes (`aRandom`)
- Updating `material.uniforms.uTime.value = elapsedTime` in animation loop

---

### 28 — Shader Patterns ⭐
**Folder**: `28-shader-patterns-final/`
**Teaches**: Procedural patterns in fragment shaders — UV manipulation, gradients, stripes, circles, noise-based patterns, combining pattern techniques.
**Relevance**: **Directly useful** for sphere tile shading and portal vortex effects. The fragment shader contains dozens of pattern recipes.

**Key patterns to extract**:
- UV-based procedural effects
- Pattern combination techniques
- Step/smoothstep usage for clean edges

---

### 31 — Modified Materials ⭐
**Folder**: `31-modified-materials-final/`
**Teaches**: Injecting custom GLSL into built-in Three.js materials via `onBeforeCompile`, vertex displacement on standard materials, custom depth materials for correct shadows with displacement.
**Relevance**: Alternative approach to custom shaders — modify existing materials rather than writing from scratch. Useful if sphere tiles need PBR lighting with custom vertex animation.

**Key patterns to extract**:
- `material.onBeforeCompile` shader injection
- `shader.vertexShader.replace('#include <common>', ...)` technique
- Rotation matrix in GLSL for vertex twisting
- Custom `depthMaterial` for shadow consistency

---

### 33 — Hologram Shader ⭐
**Folder**: `33-hologram-shader-final/`
**Teaches**: Complete custom holographic shader with fresnel glow, scan lines, transparency, additive blending, GLTF model loading with custom shader material.
**Relevance**: **Highly relevant** for portal rendering. The holographic effect (fresnel + transparency + additive blending) is very close to what the portal shader needs.

**Key patterns to extract**:
- Fresnel calculation in vertex/fragment shader
- `transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending`
- Animated scanline / stripe effect
- Random2D GLSL include (`shaders/includes/random2D.glsl`)

**Shaders available**:
- `src/shaders/holographic/vertex.glsl`
- `src/shaders/holographic/fragment.glsl`
- `src/shaders/includes/random2D.glsl`

---

### 39 — Particles Cursor Animation Shader
**Folder**: `39-particles-cursor-animation-shader-final/`
**Teaches**: GPU-driven particle systems with cursor interaction, raycaster + 2D canvas for displacement mapping, custom attributes (`aIntensity`, `aAngle`), resolution-aware shader uniforms.
**Relevance**: Advanced particle/interaction technique. Could be adapted for sphere tile hover effects or portal particle debris.

**Key patterns to extract**:
- Canvas-based displacement texture fed to shader
- Raycaster for cursor-to-3D-world mapping
- Custom per-particle attributes
- Resolution-aware rendering (`uResolution` uniform)

---

### 45 — Post-Processing ⭐
**Folder**: `45-post-processing-final/`
**Teaches**: EffectComposer pipeline, built-in passes (DotScreen, Glitch, RGBShift, UnrealBloom, SMAA), custom shader passes (TintShader, DisplacementShader), pass chaining, gamma correction.
**Relevance**: **Essential for polish**. Bloom during portal activation, chromatic aberration during traversal, custom tint shifts.

**Key patterns to extract**:
- `EffectComposer` + `RenderPass` setup
- `UnrealBloomPass` for glow effects
- Custom `ShaderPass` with `tDiffuse` pattern
- Normal map-based displacement post-process
- Combining multiple passes in a pipeline

---

### 62 — Mouse Events with R3F
**Folder**: `62-mouse-events-with-r3f-final/`
**Teaches**: React Three Fiber (R3F) mouse event handling — onClick, onPointerEnter/Leave, cursor changes, event propagation, occluded object handling.
**Relevance**: Lower priority (R3F specific), but useful if project ever migrates to React. Shows raycasting interaction patterns.

---

### 63 — Post-Processing with R3F
**Folder**: `63-post-processing-with-r3f-final/`
**Teaches**: React Three Fiber post-processing via `@react-three/postprocessing`, custom effects (Drunk effect), multisampling, blending modes.
**Relevance**: Lower priority (R3F specific). Contains custom effect architecture pattern that could inspire vanilla Three.js equivalents.

**Notable**: Custom `DrunkEffect.jsx` shows how to write post-processing effects from scratch.

---

## Priority Guide for POLYFLOWS

| Priority | Lesson | Use For |
|----------|--------|---------|
| 🔴 Critical | 19 — Scroll Animation | ScrollController architecture |
| 🔴 Critical | 26 — Code Structuring | Engine layer architecture |
| 🔴 Critical | 27 — Shaders | ShaderMaterial setup, uniforms, attributes |
| 🟠 High | 28 — Shader Patterns | Procedural fragment effects |
| 🟠 High | 33 — Hologram Shader | Portal fresnel + transparency |
| 🟠 High | 45 — Post-Processing | Bloom, effects pipeline |
| 🟡 Medium | 31 — Modified Materials | Material injection technique |
| 🟡 Medium | 39 — Particles Cursor | Interactive particle effects |
| 🟢 Low | 06 — Cameras | Basic camera reference |
| 🟢 Low | 62 — Mouse Events (R3F) | R3F-specific interaction |
| 🟢 Low | 63 — Post-Processing (R3F) | R3F-specific effects |
