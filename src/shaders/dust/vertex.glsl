// ─────────────────────────────────────────────
// Depth-Field Dust Vertex Shader
// ─────────────────────────────────────────────
// Lesson 19 particle field, moved to the GPU (lesson 27 ShaderMaterial).
// Points are static in world space; z wraps in a FIELD_DEPTH-long window around the camera,
// so the field is infinite and identical across the z = -220 teleport (220 = 2 * FIELD_DEPTH).

// highp required: camera z reaches ~220, where mediump (fp16 on Apple GPUs) steps by ~0.125
// and would make every point visibly jitter while scrolling
precision highp float;

#define TAU 6.28318530718
#define FIELD_DEPTH 110.0      // Must divide the 220-unit teleport span exactly
#define NEAR_PAD 6.0           // How far behind the camera a point lives before wrapping
#define FADE_NEAR_START 1.5    // Fully transparent closer than this (no lens-hugging blobs)
#define FADE_NEAR_END 6.0
#define FADE_FAR_START 55.0    // Begins dissolving into the darkness
#define FADE_FAR_END 100.0     // Fully gone before the far-end wrap point
#define MIN_POINT_SIZE 1.0     // px; smaller points are drawn at 1px and dimmed instead
#define MAX_POINT_SIZE 10.0    // px, before pixel ratio
#define SPEED_SIZE_BOOST 0.35  // Size gain at full scroll speed
#define SPEED_GLOW_BOOST 0.6   // Brightness gain at full scroll speed

uniform float uTime;         // elapsedTime
uniform float uCameraZ;      // state.currentCameraZ
uniform float uSize;         // DUST_SIZE
uniform float uPixelRatio;   // renderer.getPixelRatio()
uniform float uDrift;        // DUST_DRIFT (0 under reduced motion)
uniform float uSpeed;        // smoothed, normalized scroll speed 0..1

attribute float aScale;
attribute float aSeed;

varying float vAlpha;

void main() {
    // Infinite z: snap the point into the window (cameraZ - FIELD_DEPTH + NEAR_PAD, cameraZ + NEAR_PAD]
    vec3 pos = position;
    float anchor = uCameraZ + NEAR_PAD;
    pos.z = anchor - mod(anchor - position.z, FIELD_DEPTH);

    // Slow per-point drift, phase-offset by seed so the field never moves in unison
    float phase = aSeed * TAU;
    pos.x += sin(uTime * 0.11 + phase) * uDrift;
    pos.y += cos(uTime * 0.09 + phase * 1.7) * uDrift;

    vec4 viewPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float depth = -viewPosition.z;

    // Size attenuation (lesson 19 sizeAttenuation, done by hand) with a speed swell
    float size = uSize * aScale * (1.0 + uSpeed * SPEED_SIZE_BOOST) / max(depth, 0.001);
    gl_PointSize = clamp(size, MIN_POINT_SIZE, MAX_POINT_SIZE) * uPixelRatio;

    // Sub-pixel points render at MIN_POINT_SIZE; fade them by coverage instead of letting them vanish
    float coverage = clamp(size / MIN_POINT_SIZE, 0.0, 1.0);

    // Depth fade replaces blur: points materialize out of the dark and clear the lens
    float nearFade = smoothstep(FADE_NEAR_START, FADE_NEAR_END, depth);
    float farFade = 1.0 - smoothstep(FADE_FAR_START, FADE_FAR_END, depth);
    float glow = 1.0 + uSpeed * SPEED_GLOW_BOOST;
    vAlpha = nearFade * farFade * coverage * glow;
}
