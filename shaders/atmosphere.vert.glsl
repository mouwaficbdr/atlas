// Atmosphere vertex shader
// Passes the view-space normal to the fragment shader for rim lighting calculation

varying vec3 vNormal;

void main() {
  // Transform normal to view space for rim lighting
  vNormal = normalize(normalMatrix * normal);

  // Standard position transform
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
