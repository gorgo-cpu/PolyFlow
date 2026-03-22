# POLYFLOWS — Codebase Analysis
**Generated:** 2026-03-22
**Analyzed by:** Claude Code with Polyflow Configuration

---

## Executive Summary

POLYFLOWS is a scroll-driven 3D corridor experience built in vanilla Three.js with GSAP, Lenis, and an EffectComposer post-processing stack. The core experience (`src/main.jsx`) is functional and visually sophisticated — a 235-unit-deep fly-through corridor with 8 instanced geometry blueprints, CSS3D content cards, a holographic sphere, and a paradox loop teleport mechanic. However, the codebase is structurally split: a clean Lesson 26-style modular architecture exists in `src/core/` but is completely disconnected from `main.jsx`, which is a 1022-line monolith doing everything. There is one active production crash on mobile (null pointer on `controls.target`), and three per-frame CPU particle loops totalling 5500 matrix calculations that need to be watched carefully. The instancing, spatial occlusion guards, and mobile tier detection are done correctly and should be preserved.

---

## 🔴 CRITICAL ISSUES

### 1. Mobile crash — `controls.target` called without null guard
**File:** `src/main.jsx:961`
```js
controls.target.set(0, 0, currentCameraZ - 20); // controls is null on mobile
```
On mobile, `controls` is explicitly set to `null` (line 85-95). This line has no `if (controls)` guard, unlike the `controls.update()` call on line 1014. Every tick on a mobile device will throw `TypeError: Cannot read properties of null (reading 'target')`, crashing the entire animation loop. The experience is completely broken on mobile.

### 2. Architecture dead-end — `src/core/` is completely disconnected from `main.jsx`
**Files:** `src/core/Experience.js`, `src/core/Camera.js`, `src/core/Renderer.js`, `src/core/Scene.js`, `src/core/Sizes.js`, `src/animation/ScrollController.js`, `src/world/PolygonSphere.jsx`, `src/world/PortalSystem.jsx`, `src/world/Environment.jsx`

`main.jsx` never imports any of these files. It creates its own scene, camera, renderer, clock, and animation loop from scratch. The entire `src/core/` directory is dead code — unexecuted, untested, disconnected. `src/world/*.jsx` files are stubs with TODOs. The project has two parallel systems: the designed architecture and the actual running monolith. This is a strategic decision that needs resolution.

---

## 🟠 HIGH PRIORITY

### 3. Per-frame CPU particle math — 5500 calculations per tick (desktop)
**File:** `src/main.jsx:718–928`

Three per-frame CPU loops run inside `tick()` on desktop:
- **Tesseract** (`tessCount = 2000`): 4D rotation matrices + Lorenz attractor calculation per particle
- **Breathing Tesseract** (`breathCount = 1500`): 4D projection + cubic morphing per particle
- **Fire Swarm** (`fireCount = 2000`): swirl + turbulence + height looping per particle

Each loop also calls `lerp()`, `lookAt()`, `updateMatrix()`, `setMatrixAt()`, `setColorAt()` per particle. The proximity guard (`Math.abs(currentCameraZ - mesh.position.z) < 150`) correctly culls inactive meshes — this is the right instinct. But when multiple meshes are within 150 units simultaneously, you're running all loops concurrently. The spatial occlusion window may be too wide (150 units) given corridor depth is only 26 units between elements.

Mobile tier reduces to 1000 total particles (300+300+400), which is significantly better.

Reference: Lesson 41 (GPGPU) and Lesson 46 (Performance Tips) both show GPU-side computation as the solution for this scale.

### 4. `querySelectorAll('.line-inner')` called every frame in tick loop
**File:** `src/main.jsx:1000, 1007`
```js
const inners = card.dom.querySelectorAll('.line-inner'); // called every frame per card
```
`querySelectorAll` creates a new NodeList on every call. With 4 CSS3D cards, this is 4 DOM queries per frame at 60fps = 240 queries/second. Cache these at setup time in the `cardElements` loop.

### 5. Portal vertex shader passes model-space position — fresnel is incorrect
**File:** `src/shaders/portal/vertex.glsl:19`, `src/shaders/portal/fragment.glsl:43`

Portal vertex shader:
```glsl
vPosition = position; // model-space
```
Portal fragment shader:
```glsl
vec3 viewDir = normalize(cameraPosition - vPosition); // cameraPosition is world-space
```
`cameraPosition` is Three.js world-space. `vPosition` from the vertex shader is object-space. The subtraction mixes coordinate spaces, producing incorrect fresnel results for any portal not at the origin. Compare to the sphere shaders which correctly transform to world space:
```glsl
vec4 modelPosition = modelMatrix * vec4(position, 1.0);
vPosition = modelPosition.xyz; // Correct world-space
```

### 6. Portal fragment shader missing color space and tone mapping includes
**File:** `src/shaders/portal/fragment.glsl`

Sphere fragment shader has (lines 30-31):
```glsl
#include <tonemapping_fragment>
#include <colorspace_fragment>
```
Portal fragment shader has neither. When the EffectComposer's `OutputPass` applies color correction, the portal mesh will appear differently than the rest of the scene (over-bright or wrong gamma). All custom ShaderMaterials using Three.js's `OutputPass` need these includes.

### 7. Invalid GSAP ease syntax — two-parameter `back.out`
**File:** `src/main.jsx:108`
```js
ease: "back.out(1.2, 0.4)" // back.out only accepts 1 parameter (overshoot)
```
GSAP's `back.out` takes a single overshoot value. Two parameters is not a valid signature. GSAP will likely parse this incorrectly or silently ignore the second value, producing unexpected easing behavior on the camera snap-back.

### 8. ScrollController imports gsap but never uses it
**File:** `src/animation/ScrollController.js:1`
```js
import { gsap } from 'gsap'; // never used — ScrollTrigger setup is commented out
```
The ScrollTrigger setup is commented out (line 42-44). The import is dead. Minor in isolation but signals the controller was abandoned mid-implementation.

### 9. File extension mismatch in Experience.js imports
**File:** `src/core/Experience.js:6-8`
```js
import { PolygonSphere } from '../world/PolygonSphere.js';   // file is .jsx
import { PortalSystem } from '../world/PortalSystem.js';     // file is .jsx
import { Environment } from '../world/Environment.js';       // file is .jsx
```
The actual world files use `.jsx` extension. Experience.js imports them as `.js`. If/when the `src/core/` architecture gets wired up, these imports will fail in Vite unless the config explicitly resolves `.jsx` without extension.

---

## 🟡 MEDIUM PRIORITY

### 10. `console.log` left in production tick path
**File:** `src/main.jsx:170`
```js
console.log("📱 Mobile Tier: Reducing render overhead");
```
This runs once on mobile load. Not a performance issue but should be removed before deploy.

### 11. `window.portalMaterials` exposes renderer internals globally
**File:** `src/main.jsx:277`
```js
window.portalMaterials = { wireframeMaterial, shaderMaterial: material, bloomPass };
```
Exposing live renderer objects on `window` is a debug convenience that was never removed. Any script on the page (including injected ads or third-party code) can mutate `bloomPass.strength` or `shaderMaterial.uniforms` directly. Remove this and replace with a proper debug module.

### 12. Hardcoded `document.body.style.height = '1000vh'` scroll space
**File:** `src/main.jsx:344`
The scroll height is calculated as `14 - (progress * 235)` for camera Z mapping (line 329). The 235 multiplier is the total corridor depth. The `1000vh` body height is the scroll container. These two constants are coupled: if the corridor depth changes, both values need updating manually. No single source of truth.

### 13. `setTimeout` for loading state management
**File:** `src/main.jsx:231-234`
```js
loadingManager.onLoad = () => {
  setTimeout(() => resolveModelLoad(), 500); // fragile timing
};
```
If the signature animation (2.5s) takes longer than expected or the asset loads very fast, the 500ms delay may not align. The signature path length animation was set up at line 205 with `duration: 2.5`. Better to tie this to the GSAP animation's `onComplete` callback.

### 14. No precision declarations on any shaders
**Files:** All 4 GLSL files
None of the shaders declare precision:
```glsl
// Missing from all shaders:
precision mediump float;
```
Per the shader standards, every shader must declare precision at the top. Without it, iOS Safari uses implementation-defined defaults which may cause visual differences across devices.

### 15. Dead `random2D` function in sphere vertex shader
**File:** `src/shaders/sphere/vertex.glsl:12-14`
```glsl
float random2D(vec2 value) {
    return fract(sin(dot(value.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
```
Declared but never called. Was used for the glitch effect (removed per comment on line 20). Dead GLSL code still compiles and takes up shader program space. Remove it.

### 16. Dead variables in torus knot blueprint
**File:** `src/main.jsx:481-483`
```js
const R = 15; // declared, never used — R_scaled replaces it
const r = 4.8; // declared, never used — r_scaled replaces it
```
Both are unused. `R_scaled = 3.5` and `r_scaled = 1.5` are used inside the loop instead. The outer variables are orphaned from a previous iteration.

### 17. Conditional in sphere fragment shader — violates shader standards
**File:** `src/shaders/sphere/fragment.glsl:15-16`
```glsl
if (!gl_FrontFacing)
    normal *= -1.0;
```
Per shader standards: "NO conditionals in fragment shaders — use step/mix/smoothstep." Replace with:
```glsl
normal *= gl_FrontFacing ? 1.0 : -1.0;
// or:
float facing = gl_FrontFacing ? 1.0 : -1.0;
normal *= facing;
```
Note: `gl_FrontFacing` is a special GLSL built-in that can't be entirely replaced with arithmetic, but the branch can be eliminated using `sign()` and a multiplication: `normal *= sign(gl_FrontFacing ? 1.0 : -1.0)` isn't much better. The real solution is to avoid double-sided rendering at the material level if possible.

### 18. No geometry/material disposal for blueprints, CSS3D objects
**File:** `src/main.jsx:392-656`
All blueprint meshes, geometries, and materials are created and added to the scene but never disposed. With 8 blueprints, each with their own geometry + material + InstancedMesh, this creates a memory leak on page transitions (Barba.js navigates away). The CSS3DObjects are similarly leaked. Reference `PolygonSphere.destroy()` for the correct pattern.

### 19. `main.jsx` is 1022 lines — 5× the 200-line component limit
**File:** `src/main.jsx`
The file mixes: renderer setup, asset loading, post-processing, scroll logic, particle animations, CSS3D objects, Barba transitions, and the tick loop. This is the core fragmentation issue. Each concern is a separate module in the planned architecture — the migration path exists, it just hasn't been executed.

### 20. `src/mobile.css` exists but is empty
**File:** `src/mobile.css`
The file is tracked (shows as untracked in git status) but contains no content. Either delete it or consolidate the mobile `@media` block from `style.css` into it.

### 21. esbuild/vite moderate vulnerability (dev dependency)
```
esbuild <=0.24.2 — allows websites to send requests to the dev server and read responses
```
Dev dependency only, does not affect production. Fix: `npm audit fix --force` upgrades to Vite 8+, which is a breaking change. Evaluate timing.

---

## 🟢 LOW PRIORITY

### 22. Missing CPU-side comments on `cameraPosition` uniform in portal shader
**File:** `src/shaders/portal/fragment.glsl:43`
Per shader standards, every uniform needs a CPU-side comment. `cameraPosition` is auto-injected by Three.js — it should be documented:
```glsl
// cameraPosition — auto-injected by Three.js (world-space camera position)
```

### 23. Comment says "red" — color is white
**File:** `src/main.jsx:180, 23` (sphere fragment shader comment)
`materialParameters.color = '#ffffff'` but `src/shaders/sphere/fragment.glsl` comment says "Start with the pure uColor (red)". Stale comment from a previous iteration.

### 24. Portal fragment shader references non-existent file
**File:** `src/shaders/portal/fragment.glsl:5`
```glsl
// Reference: resources_from_ThreeJS_Journey/shader_templates/noise_functions.glsl
```
This path doesn't exist in the repo. The `resources_from_ThreeJS_Journey/` directory has lesson folders but no `shader_templates/` subdirectory. The comment is aspirational rather than factual.

### 25. Dead glitch effect comment in sphere vertex shader
**File:** `src/shaders/sphere/vertex.glsl:20`
```glsl
// Glitch effect removed for a clean holographic look
```
The code it refers to is gone. The comment is orphaned. Remove it.

### 26. `Experience.js` — `getDelta()` after `getElapsedTime()` bug (dead code, but wrong)
**File:** `src/core/Experience.js:68-69`
```js
const elapsedTime = this.clock.getElapsedTime();
const deltaTime = this.clock.getDelta(); // getDelta() after getElapsedTime() returns ~0
```
`THREE.Clock.getDelta()` measures time since the last `getDelta()` call. Calling `getElapsedTime()` first doesn't reset the delta timer, but calling them in the same frame means `deltaTime` will always be near-zero. Should use a single `getDelta()` and accumulate for `elapsedTime`, or use separate clocks. Not currently running, but will break when the architecture is wired up.

---

## ✅ WHAT'S WORKING WELL

**Spatial occlusion on particle loops** — The 150-unit proximity guard (`Math.abs(currentCameraZ - mesh.position.z) < 150`) on tessCount/breathCount/fireMesh prevents expensive math when particles are outside the corridor. Good instinct. Keep this pattern.

**Instanced meshes throughout** — All blueprints use `InstancedMesh`. `InstancedMesh` for 200, 1500, 2000 particle counts is the right call. `DynamicDrawUsage` set on animated mesh instanceMatrix (lines 524, 569) — correct GPU buffer hint.

**Pixel ratio clamped correctly in two places** — `Sizes.js:22` and `main.jsx:121` both use `Math.min(window.devicePixelRatio, 2)`. The mobile resize handler (line 62) correctly uses `window.innerWidth <= 768 ? 1 : ...`.

**Mobile tier detection and reduction** — Particle counts reduced by 6-7× on mobile (300/300/400 vs 2000/1500/2000). Bloom resolution halved. Film grain reduced. `canvas.style.pointerEvents = 'none'` prevents touch event capture. This is thorough.

**Lenis + ScrollTrigger integration pattern** — Lines 32-36 follow the canonical pattern:
```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

**Paradox loop teleport mechanic** — The scroll-to-camera Z mapping (line 329: `14 - (progress * 235)`) and teleport-back logic (lines 935-957) cleanly reset both Lenis scroll position and camera state. The `lenis.scrollTo(newScrollY, { immediate: true })` override is the correct API call.

**EffectComposer render target with conditional MSAA** — Line 133: `samples: renderer.getPixelRatio() === 1 ? 2 : 0` correctly enables MSAA only on standard DPI (where it's cheaper), disabled on retina. Smart.

**Clean modular architecture in src/core/** — The Lesson 26 pattern is correctly implemented: EventEmitter in Sizes, singleton guard in Experience, separated world modules, destroy() hooks. The design is right. The execution gap (not wired to main.jsx) is the only issue.

**PortalState enum** — `src/world/PortalSystem.jsx:21-26`. Clean state machine pattern. Keep when implementing.

**Environment.transitionToPortal()** — `src/world/Environment.jsx:51-67`. Clean lerp-driven lighting transition. The `_baseAccentColor`/`_targetAccentColor` pattern (lazy initialization) avoids per-frame allocations.

**Debug via URL hash** — `#debug` activation in `Debug.js` is the correct pattern from Lesson 26.

**scroll restoration disabled on load** — Lines 23-26: `history.scrollRestoration = 'manual'` + `window.scrollTo(0, 0)` prevents browser scroll position restoration from corrupting the corridor start position.

---

## DETAILED FINDINGS BY DOMAIN

### Security Audit

| Finding | Severity | Location |
|---------|----------|----------|
| No hardcoded API keys or credentials | ✅ Clean | — |
| No eval() or Function() constructors | ✅ Clean | — |
| No innerHTML with user content | ✅ Clean | — |
| `window.portalMaterials` exposes live renderer objects | ⚠️ Medium | main.jsx:277 |
| esbuild ≤0.24.2 dev server CORS vulnerability | ⚠️ Moderate | node_modules/esbuild |
| No CSP headers configured | ℹ️ Note | — |

No critical security issues. The `window.portalMaterials` exposure is a code quality concern more than a security vulnerability in this context (no user-supplied content is involved).

---

### Performance Analysis

**Draw calls:** EffectComposer renders the full scene pass + 5 post-processing passes per frame. With 8 blueprint meshes + main sphere + duplicate sphere + CSS3D renderer, draw call count should be moderate. No `renderer.info.render.calls` instrumentation is visible in the code — recommended to add during debug sessions.

**Triangle budget:** No high-poly assets. Icosphere is GLTF-loaded (unknown detail level). Blueprint geometries are BoxGeometry(0.8, 0.8, 0.8) instances — very low poly. TetrahedronGeometry(0.25) for particles — 4 triangles each. Healthy.

**Per-frame allocations detected:**
- `blueprints.forEach` + `cssObjects.forEach` in tick — array iteration, no allocations ✅
- `tessTarget.set()`, `breathTarget.set()`, `fireTarget.set()` — pre-allocated ✅
- `tessColor.setHex()`, `breathColor.setHex()`, `fireColor.setHex()` — pre-allocated ✅
- `tessDummy`, `breathDummy`, `fireDummy` Object3D — pre-allocated ✅
- `card.dom.querySelectorAll('.line-inner')` — new NodeList every frame ❌

**Memory leaks:**
- Blueprint geometries/materials not disposed on navigation ❌
- CSS3DObjects not disposed on navigation ❌
- GLTF EdgeGeometry instances not tracked for disposal ❌

**Mobile performance tier:** Implemented and effective. The `isMobile = window.innerWidth <= 768` check is a coarse detector (doesn't account for landscape tablets) but sufficient for the use case.

---

### Code Quality

**Dead imports:**
- `src/animation/ScrollController.js:1` — `gsap` imported, never used

**Dead code / unused variables:**
- `src/shaders/sphere/vertex.glsl:12-14` — `random2D` function never called
- `src/main.jsx:481-483` — `R`, `r` variables never used
- `src/world/PortalSystem.jsx` — entire file is scaffolding (TODO stubs only)
- `src/world/PolygonSphere.jsx` — `init()` body is TODO stubs, `tiles` array always empty
- `src/core/Experience.js`, `Camera.js`, `Renderer.js`, `Scene.js`, `Sizes.js` — none imported by main.jsx

**console.logs:**
- `src/main.jsx:170` — `console.log("📱 Mobile Tier...")` — remove before deploy
- `src/main.jsx:285` — `console.error('❌ Failed to load...')` — acceptable (error handler)

**TODO/FIXME/HACK comments:**
- `src/world/PolygonSphere.jsx:38-43` — `TODO: Implement sphere generation`
- `src/world/PolygonSphere.jsx:62` — `TODO: Animate tiles`
- `src/world/PortalSystem.jsx:45-46` — `TODO: Replace tile material` / `TODO: Begin morph animation`
- `src/world/PortalSystem.jsx:71-72` — `TODO: Update portal shader uniforms` / `TODO: Animate based on portal.state`
- `src/core/Camera.js:40-42` — `TODO: Camera animation logic goes here`
- `src/animation/ScrollController.js:42-44` — `TODO: Replace with GSAP ScrollTrigger`
- `src/animation/ScrollController.js:60` — `TODO: Drive camera, sphere, and portal animations`

All TODOs are in the dead `src/core/` architecture — they describe the planned implementation that hasn't been migrated from `main.jsx`.

**Files over 200 lines:**
- `src/main.jsx` — 1022 lines ❌ (5× over limit)
- All other files are well under limit ✅

**Naming conventions:**
- `src/core/` classes — PascalCase ✅
- `src/world/*.jsx` — PascalCase ✅
- main.jsx variables — camelCase ✅
- GLSL uniforms — `u` prefix ✅
- GLSL varyings — `v` prefix ✅

**Structure vs Lesson 26 standards:**
- Design matches Lesson 26 pattern (Experience singleton, EventEmitter in Sizes, separated World modules) ✅
- Execution: main.jsx bypasses the entire structure ❌

---

### Shader Review

**Sphere Vertex (`src/shaders/sphere/vertex.glsl`)**
| Issue | Standard | Status |
|-------|----------|--------|
| No `precision mediump float` declaration | Required | ❌ Missing |
| `random2D` function declared, never used | Clean code | ❌ Dead code |
| World-space position passed correctly | Correctness | ✅ Correct |
| `uTime` uniform has no CPU-side comment | Documentation | ⚠️ Missing |

**Sphere Fragment (`src/shaders/sphere/fragment.glsl`)**
| Issue | Standard | Status |
|-------|----------|--------|
| No `precision mediump float` declaration | Required | ❌ Missing |
| `if (!gl_FrontFacing)` conditional | Use step/mix | ❌ Violation |
| `uColor` uniform — no CPU-side comment | Documentation | ⚠️ Missing |
| Includes `tonemapping_fragment` + `colorspace_fragment` | Consistency | ✅ Correct |

**Portal Vertex (`src/shaders/portal/vertex.glsl`)**
| Issue | Standard | Status |
|-------|----------|--------|
| No `precision mediump float` declaration | Required | ❌ Missing |
| `vPosition = position` passes model-space, not world-space | Correctness | ❌ Bug |
| No `#define` constants for magic numbers (`0.5`) | Standards | ⚠️ Missing |

**Portal Fragment (`src/shaders/portal/fragment.glsl`)**
| Issue | Standard | Status |
|-------|----------|--------|
| No `precision mediump float` declaration | Required | ❌ Missing |
| Missing `#include <tonemapping_fragment>` | Consistency | ❌ Missing |
| Missing `#include <colorspace_fragment>` | Consistency | ❌ Missing |
| `cameraPosition` used without CPU-side comment | Documentation | ⚠️ Missing |
| Fresnel exponent = 2.0 — visually weak | Quality | ⚠️ Low |
| Magic numbers `127.1`, `311.7`, `43758.5453123` without `#define` | Standards | ⚠️ Missing |
| Fresnel calculation uses mixed coordinate spaces | Correctness | ❌ Bug |

---

### Scroll & Animation

**Lenis:** Correctly configured. gsap.ticker integration is canonical. `lagSmoothing(0)` prevents frame lag accumulation. No issues.

**ScrollTrigger:** Registered and refreshed. `barba.hooks.after(() => ScrollTrigger.refresh())` correctly refreshes after navigation. However, ScrollTrigger is imported but **not used for any actual scroll animations** — it's present but idle. All scroll-driven animation runs through the native scroll event listener (line 323) and the tick loop LERP (line 932). This is a deliberate simplification but means you're missing the declarative power of ScrollTrigger.

**Scroll implementation:** The `window.addEventListener('scroll', ...)` raw scroll listener (line 323) fires on every scroll event (throttled by browser). This correctly updates `targetCameraZ`. The LERP on line 932 (`0.08` factor) provides smooth momentum interpolation — at 60fps this settles in ~20 frames. Feels responsive.

**Camera animation:** Entirely driven by Z-axis translation. No rotation. The FOV warp (50° → 120°) on sphere approach is a strong effect. The `controls.target` updates lock the look-at direction. The `pointerup` snap-back via GSAP is clean.

**Corridor phases:** The 4-phase system in `ScrollController.js` (approach/exploration/activation/traversal) is designed but **not connected to any actual camera or scene behavior**. The tick loop implements the whole scroll experience without the phase system.

**CSS3D text animation:** Card reveals triggered by camera proximity (30-unit window). `gsap.to(inners, { y: '0%', stagger: 0.1 })` on reveal. The `card.revealed` flag prevents re-triggering. Logic is correct but `querySelectorAll` should be cached (see issue #4).

**GSAP ease syntax issue:** `"back.out(1.2, 0.4)"` on the snap-back tween (line 108) — invalid syntax (see issue #7).

**Mobile scroll:** `canvas.style.pointerEvents = 'none'` on mobile — correct. Prevents canvas from consuming touch events that Lenis needs for scroll. Native browser scroll is unblocked.

---

### Spatial Design & UX

**What lands:**
The paradox loop corridor is a genuinely interesting spatial mechanic. Flying through the sphere and teleporting back to the beginning creates a meditative, infinite-depth illusion. The geometry blueprints on alternating sides create bilateral symmetry that feels architectural. The FOV warp + bloom spike on sphere proximity is cinematically strong — the moment of "entering" the sphere reads clearly.

The content card pacing (every 60 units: -10, -60, -120, -180) gives 60 units of empty corridor between each story beat — enough breathing room, but the first card at z=-10 appears almost immediately after the sphere. The user barely has time to understand the space before text arrives.

**What feels off:**
The three dynamic particle systems (tesseract, breathing tesseract, fire swarm) are all positioned on alternating sides of the corridor at 0.4× lateral offset. They're essentially in the center of the tunnel — the camera flies *through* them. This is intentional ("camera collision overlap" — line 531) but it means three separate moments of "camera flies through particle cloud" with nearly identical visual language. The differentiation between the three is subtle at speed.

The fire swarm uses color `0xffaa00` but the particle color is overridden to `0xFFF5E4` (line 915) on each frame update — the orange fire color is never visible. This appears to be a bug (color is set once in initialization to orange, then overwritten to cream-white every frame).

The bilateral symmetry (i%2 for left/right alternation) is predictable. A slight vertical offset or depth stagger between objects on the same side would create more spatial tension.

**Camera choreography:** The camera only moves on Z. No Y or X drift, no rotation. The OrbitControls on desktop add lateral freedom but it fights the LERP back to center. The experience would benefit from subtle Y-axis oscillation on scroll to create a sense of flight rather than a train ride.

**Emotional arc:** Void → Architecture → Bridge → Summons. The section naming is strong and purposeful. The visual language (monochrome, geometric, cold) matches the copy. The accent light color (`#6C63FF` purple) adds warmth without breaking the palette.

---

## ACTION PLAN

### This Session (Do Now)
1. **Fix mobile crash** — add `if (controls)` guard on `main.jsx:961` before `controls.target.set(...)`
2. **Remove console.log** — `main.jsx:170`, production mobile log
3. **Fix portal shader coordinate space** — `portal/vertex.glsl:19` pass world-space position like the sphere vertex shader does

### This Week
1. **Add precision declarations to all 4 shaders** — `precision mediump float;` at top of each
2. **Cache querySelectorAll results** — store `.line-inner` NodeLists at setup time, not in tick loop
3. **Add colorspace/tonemapping includes to portal fragment shader**
4. **Fix GSAP ease syntax** — `"back.out(1.2)"` not `"back.out(1.2, 0.4)"`
5. **Remove dead code** — `random2D` from sphere vertex, `R`/`r` variables from torus knot

### This Month
1. **Decide architecture direction** — either wire `main.jsx` into the `src/core/` system (migration) or delete `src/core/` entirely and document `main.jsx` as the canonical implementation
2. **Reduce particle loop occlusion window** — try 80 units instead of 150 to prevent multiple concurrent loops
3. **Replace `document.body.style.height = '1000vh'` with dynamic calculation** — tie to content length
4. **Add disposal hooks** for blueprints and CSS3D objects (Barba transition cleanup)
5. **Fix fire swarm color** — `0xffaa00` is overwritten to `0xFFF5E4` every frame; either commit to one color or use the orange

### Backlog
- Migrate `main.jsx` into modular `src/core/` architecture (large refactor — own session)
- Remove `window.portalMaterials` global, replace with debug module
- Add camera Y-axis drift on scroll for a "flight" rather than "train" feel
- Add spatial variation to blueprint placement (slight Y offset, non-uniform depth)
- Evaluate GPU-side particle computation (Lesson 41 GPGPU) when particle counts need to scale
- Implement `ScrollController` phases to drive actual camera/scene behavior
- Add loading fallback UI for GLTF load failure
- Evaluate Vite upgrade to resolve esbuild vulnerability

---

## TECHNICAL DEBT INVENTORY

| File | Issue | Effort | Impact |
|------|-------|--------|--------|
| `src/main.jsx:961` | `controls.target` — mobile null crash | S | 🔴 Critical |
| `src/main.jsx` (all) | 1022-line monolith — needs modularization | L | 🟠 High |
| `src/shaders/portal/vertex.glsl:19` | Model-space position → broken fresnel | S | 🟠 High |
| `src/shaders/portal/fragment.glsl` | Missing tonemapping + colorspace includes | S | 🟠 High |
| `src/main.jsx:1000,1007` | `querySelectorAll` in tick — cached NodeList | S | 🟠 High |
| `src/main.jsx:108` | Invalid GSAP ease syntax | S | 🟠 High |
| All 4 GLSL files | Missing `precision mediump float` | S | 🟡 Medium |
| `src/shaders/sphere/vertex.glsl:12` | Dead `random2D` function | S | 🟡 Medium |
| `src/main.jsx:170` | `console.log` in production | S | 🟡 Medium |
| `src/main.jsx:277` | `window.portalMaterials` global | S | 🟡 Medium |
| `src/main.jsx:344` | Hardcoded `1000vh` scroll height | M | 🟡 Medium |
| `src/main.jsx:915` | Fire swarm color overwritten to wrong color | S | 🟡 Medium |
| `src/main.jsx:392-657` | No disposal for 8 blueprint meshes | M | 🟡 Medium |
| `src/core/Experience.js:68-69` | getDelta() after getElapsedTime() bug | S | 🟢 Low |
| `src/animation/ScrollController.js:1` | Dead `gsap` import | S | 🟢 Low |
| `src/main.jsx:481-483` | Dead `R`, `r` variables | S | 🟢 Low |
| `src/shaders/sphere/fragment.glsl:15` | Conditional branch — use `sign()` | S | 🟢 Low |
| `src/mobile.css` | Empty file — delete or populate | S | 🟢 Low |
| `node_modules/vite` | esbuild moderate CVE | M | 🟡 Medium |
