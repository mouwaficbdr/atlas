// Atmosphere fragment shader
// Rim lighting effect — color #4FC3F7 (rgb: 0.31, 0.76, 0.97), max opacity 0.35

varying vec3 vNormal;

void main() {
  // Rim lighting: intensity is highest at the silhouette edges (where normal is perpendicular to view direction)
  float intensity = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));

  // Atmosphere color #4FC3F7
  vec3 rimColor = vec3(0.31, 0.76, 0.97);

  // Output with max opacity 0.35
  gl_FragColor = vec4(rimColor, intensity * 0.35);
}
