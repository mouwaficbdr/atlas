uniform float uExtrude;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Extrusion de base permanente (0.01) + extrusion hover (0.05 max)
    // Cela garantit que les pays sont toujours au-dessus de l'océan
    float baseExtrusion = 0.01;
    float hoverExtrusion = uExtrude * 0.05;
    vec3 pos = position + normal * (baseExtrusion + hoverExtrusion);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
