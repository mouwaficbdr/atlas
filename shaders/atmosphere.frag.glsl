// Diffusion de Rayleigh simplifiée, intégrée le long du rayon de vue à
// travers une coquille d'atmosphère : liseré bleu côté jour, rougeoiement au
// terminateur (le bleu est éteint sur les longs trajets rasants), voile sur
// le disque près du bord, rien côté nuit. Pas d'aplat bleu uniforme.
uniform vec3 uSunDirection;

varying vec3 vWorldPos;

const float PLANET_RADIUS = 1.0;
const float ATMOSPHERE_RADIUS = 1.045; // exagérée (~2x) pour rester lisible à l'écran
const int STEPS = 10;
// Coefficients relatifs de Rayleigh (∝ 1/λ⁴), rouge/vert/bleu.
const vec3 BETA = vec3(0.18, 0.42, 1.0);
const float DENSITY_FALLOFF = 4.0;
const float EXTINCTION = 0.3;

vec2 raySphere(vec3 origin, vec3 dir, float radius) {
  float b = dot(origin, dir);
  float c = dot(origin, origin) - radius * radius;
  float h = b * b - c;
  if (h < 0.0) return vec2(1e5, -1e5);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

void main() {
  vec3 dir = normalize(vWorldPos - cameraPosition);
  vec2 atmosphere = raySphere(cameraPosition, dir, ATMOSPHERE_RADIUS);
  if (atmosphere.x > atmosphere.y) discard;

  float tStart = max(atmosphere.x, 0.0);
  float tEnd = atmosphere.y;
  vec2 planet = raySphere(cameraPosition, dir, PLANET_RADIUS);
  if (planet.x < planet.y && planet.x > 0.0) tEnd = min(tEnd, planet.x);

  float stepLength = (tEnd - tStart) / float(STEPS);
  float thickness = ATMOSPHERE_RADIUS - PLANET_RADIUS;
  vec3 inScatter = vec3(0.0);
  float viewDepth = 0.0;

  for (int i = 0; i < STEPS; i++) {
    vec3 p = cameraPosition + dir * (tStart + stepLength * (float(i) + 0.5));
    float altitude = (length(p) - PLANET_RADIUS) / thickness;
    float density = exp(-altitude * DENSITY_FALLOFF) * stepLength / thickness;
    viewDepth += density;

    // Profondeur optique vers le soleil : courte en plein jour, très longue
    // au ras du terminateur (lumière rasante, d'où le rouge).
    float sunCos = dot(normalize(p), uSunDirection);
    float sunDepth = exp(-altitude * DENSITY_FALLOFF) * 1.2 / max(sunCos + 0.12, 0.015);
    vec3 transmittance = exp(-BETA * (sunDepth + viewDepth) * EXTINCTION);
    float lit = smoothstep(-0.2, 0.04, sunCos);

    inScatter += density * transmittance * lit;
  }

  float cosTheta = dot(dir, uSunDirection);
  float phase = 0.75 * (1.0 + cosTheta * cosTheta);
  vec3 color = inScatter * BETA * phase * 0.65;

  gl_FragColor = vec4(color, 1.0);
}
