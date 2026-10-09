varying vec3 vColor;
varying float vBrightness;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  // Cœur ponctuel et halo doux (profil gaussien, pas un disque plat).
  float a = (exp(-d2 * 80.0) + exp(-d2 * 14.0) * 0.3) * vBrightness;
  if (a < 0.008) discard;
  gl_FragColor = vec4(vColor, a);
}
