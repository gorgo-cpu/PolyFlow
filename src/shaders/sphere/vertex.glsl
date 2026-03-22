// ─────────────────────────────────────────────
// Holographic Sphere Vertex Shader
// ─────────────────────────────────────────────
// Adapted from Three.js Journey Lesson 33

precision mediump float;

uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

// Random 2D hash function
float random2D(vec2 value) {
    return fract(sin(dot(value.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Position in world space
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch effect removed for a clean holographic look

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Model normal in world space
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Varyings
    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
}
