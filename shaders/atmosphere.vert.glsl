// Atmosphere vertex shader
// vNormal (espace vue) sert au rim Fresnel face caméra ; vWorldNormal
// (espace monde) sert au mélange jour/nuit avec uSunDirection.

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
