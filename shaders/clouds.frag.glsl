uniform sampler2D uCloudsMap;
uniform vec3 uSunDirection;

varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
    // La densité est dans l'alpha (256 niveaux) : le canal rouge de cette
    // PNG palettisée n'est qu'un tramage 1 bit (0 ou 255), d'où l'ancien
    // rendu en damier.
    float density = texture2D(uCloudsMap, vUv).a;

    // Les nuages s'assombrissent côté nuit, comme le reste du relief, pour ne
    // pas rester d'un blanc irréaliste au-dessus de l'hémisphère plongé dans
    // l'obscurité.
    float sunFacing = dot(normalize(vWorldNormal), uSunDirection);
    float dayStrength = smoothstep(-0.15, 0.15, sunFacing);
    float brightness = mix(0.05, 1.0, dayStrength);

    gl_FragColor = vec4(vec3(brightness), density * 0.6);
}
