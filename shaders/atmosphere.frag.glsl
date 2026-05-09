varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Dot product with view direction for rim effect
  // Normal is in view space if using normalMatrix, but here we use vNormal
  float intensity = pow(max(0.0, 0.6 - dot(vNormal, vec3(0, 0, 1.0))), 3.0);
  
  // Atmosphere color: Deep tech blue to light cyan
  vec3 atmosphereColor = mix(vec3(0.05, 0.15, 0.4), vec3(0.4, 0.7, 1.0), intensity);
  
  gl_FragColor = vec4(atmosphereColor, intensity * 0.8);
}
