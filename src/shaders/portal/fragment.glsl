// ─────────────────────────────────────────────
// Portal Fragment Shader
// ─────────────────────────────────────────────

precision mediump float;
// Animated radial distortion with noise-driven vortex.
// Reference: resources_from_ThreeJS_Journey/shader_templates/noise_functions.glsl

uniform float uTime;
uniform float uActivationProgress;
uniform vec3 uPortalColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

// ── Simplex-style noise stub (replace with full noise from resources) ──
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    // Radial UV from center
    vec2 centeredUv = vUv - 0.5;
    float dist = length(centeredUv);
    float angle = atan(centeredUv.y, centeredUv.x);

    // Vortex distortion
    float vortex = noise(vec2(angle * 3.0 + uTime, dist * 5.0 - uTime * 0.5));

    // Fresnel edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDir, vNormal), 2.0);

    // Combine
    vec3 color = uPortalColor * (vortex * 0.8 + 0.2);
    color += uPortalColor * fresnel * 0.5;

    // Fade based on activation
    float alpha = uActivationProgress * smoothstep(0.5, 0.0, dist);

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
