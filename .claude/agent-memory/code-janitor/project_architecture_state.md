---
name: POLYFLOW Architecture Split
description: main.jsx is the live monolith (1047 lines); src/core/ is a dead class-based architecture never imported by main.jsx; portal shaders are orphaned
type: project
---

The POLYFLOW codebase has a structural split: all live functionality is in src/main.jsx (1047 lines, vanilla Three.js monolith). A class-based architecture in src/core/ (Experience.js singleton, Camera.js, Renderer.js, Scene.js, Sizes.js) plus src/world/ (PolygonSphere.jsx, PortalSystem.jsx, Environment.jsx) and src/animation/ScrollController.js was scaffolded but never wired into main.jsx. Portal shaders (src/shaders/portal/) are also orphaned.

**Why:** Rapid prototyping in main.jsx outpaced the planned architecture. The core/ classes are stubs with TODO comments and no actual implementation.

**How to apply:** Any cleanup or refactoring must recognize that main.jsx IS the app. The core/ files are candidates for deletion or for a future structured rewrite, not for incremental integration.
