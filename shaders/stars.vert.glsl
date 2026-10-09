attribute float aSize;
attribute float aBrightness;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vBrightness;

void main() {
  vColor = aColor;
  // Seules les étoiles brillantes scintillent nettement, comme à l'œil nu.
  float twinkle = 1.0 + 0.22 * sin(uTime * (0.7 + aPhase * 1.9) + aPhase * 40.0) * smoothstep(0.45, 0.9, aBrightness);
  vBrightness = aBrightness * twinkle;

  // Étoiles à l'infini : taille en pixels constante, sans atténuation.
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
