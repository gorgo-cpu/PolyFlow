// ─────────────────────────────────────────────
// Holographic Sphere Fragment Shader
// ─────────────────────────────────────────────
// Adapted from Three.js Journey Lesson 33

precision mediump float;

uniform vec3 uColor;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    // Normal (flip for back faces)
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing)
        normal *= -1.0;

    // Stripes — animated horizontal scan lines
    float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 2.0); // Soft lines

    // Ensure the same intense color all over the sphere
    // Start with the pure uColor (red)
    vec3 finalColor = uColor;

    // Add the scanlines as a subtle bright/white highlight
    finalColor = mix(finalColor, vec3(1.0), stripes * 0.4);

    gl_FragColor = vec4(finalColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
