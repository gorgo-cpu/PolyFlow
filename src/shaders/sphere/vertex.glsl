// ─────────────────────────────────────────────
// Holographic Sphere Vertex Shader
// ─────────────────────────────────────────────
// Adapted from Three.js Journey Lesson 33

precision mediump float;

uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    // Position in world space
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch effect removed for a clean holographic look

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Varyings
    vPosition = modelPosition.xyz;
    // Inverse-transpose of modelMatrix gives correct world-space normals under non-uniform scale
    vNormal = normalize(mat3(transpose(inverse(modelMatrix))) * normal);
}
