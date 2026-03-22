// ─────────────────────────────────────────────
// Portal Vertex Shader
// ─────────────────────────────────────────────
// Handles radial expansion of the portal opening.

precision mediump float;

uniform float uTime;
uniform float uActivationProgress; // 0 = closed, 1 = fully open

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // World-space position for correct fresnel in fragment shader
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz;

    // Radial displacement based on activation (in model space before projection)
    vec3 center = vec3(0.0);
    vec3 direction = normalize(position - center);
    vec3 displaced = position + direction * uActivationProgress * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
