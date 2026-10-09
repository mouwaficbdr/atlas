uniform vec3 uSunDirection;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Halo rendu par les faces arrière (BackSide) : leur normale s'éloigne de
  // la caméra, donc depth = 0 au bord extérieur du halo et ~0.42 au ras du
  // limbe terrestre (sphère atmosphère de rayon 1.1). Le halo est donc
  // maximal contre la Terre et s'éteint vers l'espace. L'ancienne formule
  // (1 - dot) valait 1 partout sur ces faces : un anneau bleu plat.
  float depth = max(0.0, -dot(normal, viewDir));
  float glow = pow(clamp(depth / 0.42, 0.0, 1.0), 2.4);

  // Bleu de ciel côté jour, à peine perceptible côté nuit.
  float sunFacing = dot(normalize(vWorldNormal), uSunDirection);
  float day = smoothstep(-0.35, 0.25, sunFacing);
  vec3 haze = mix(vec3(0.04, 0.07, 0.14), vec3(0.32, 0.6, 1.0), day);

  gl_FragColor = vec4(haze, glow * mix(0.35, 0.9, day));
}
