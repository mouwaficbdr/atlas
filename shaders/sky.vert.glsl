// Voie lactée et nébulosités, calculées par sommet sur une sphère de fond
// assez fine : lueurs basse fréquence, quasi gratuites à rendre (pas de
// bruit par pixel sur un GPU intégré).
uniform vec3 uBandNormal;
uniform vec3 uCore;

varying vec3 vColor;
varying float vAlpha;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(position);

  // Distance au plan galactique : bande étroite + lueur plus large.
  float lat = dot(dir, uBandNormal);
  float band = exp(-lat * lat / 0.016);
  float glow = exp(-lat * lat / 0.08) * 0.35;
  float bulge = exp(-pow(distance(dir, uCore), 2.0) / 0.1);

  float clouds = fbm(dir * 3.5);
  // Bande de poussière sombre qui fend la Voie lactée en son milieu.
  float dust = smoothstep(0.42, 0.72, fbm(dir * 6.5 + 11.3)) * exp(-lat * lat / 0.004);

  float lum = (band * (0.5 + 0.9 * clouds) + glow * clouds) * (1.0 + 1.1 * bulge);
  lum *= 1.0 - 0.8 * dust;

  vec3 cool = vec3(0.6, 0.72, 1.0);
  vec3 warm = vec3(1.0, 0.85, 0.68);
  vColor = mix(cool, warm, clamp(bulge * 1.1 + band * 0.2, 0.0, 0.85));

  // Nébulosités diffuses hors du plan, à peine perceptibles.
  float nebula = smoothstep(0.6, 0.85, fbm(dir * 2.2 + 4.1)) * (1.0 - band);
  vColor = mix(vColor, vec3(0.42, 0.3, 0.72), nebula * 0.7);

  vAlpha = clamp(lum * 0.12 + nebula * 0.03, 0.0, 0.22);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
