// ─────────────────────────────────────────────
// Depth-Field Dust Fragment Shader
// ─────────────────────────────────────────────
// Soft round sprite (lesson 19/27 point pattern). Branch-free.
// Shares no uniforms with the vertex stage: precisions differ (highp vs mediump),
// and uniforms declared in both stages with different precision fail to link.

precision mediump float;

#define SPRITE_SOFTNESS 1.6   // Higher = tighter core, softer falloff

uniform vec3 uColor;      // DUST_COLOR
uniform float uOpacity;   // DUST_OPACITY

varying float vAlpha;     // depth fade * sub-pixel dimming * speed glow, from the vertex stage

void main() {
    // Radial falloff inside the point sprite; zero at the edge, no discard needed
    float dist = distance(gl_PointCoord, vec2(0.5));
    float strength = pow(clamp(1.0 - dist * 2.0, 0.0, 1.0), SPRITE_SOFTNESS);

    gl_FragColor = vec4(uColor, strength * vAlpha * uOpacity);

    #include <colorspace_fragment>
}
