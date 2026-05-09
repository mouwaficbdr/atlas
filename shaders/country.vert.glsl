uniform float uExtrude;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Extrusion légère le long de la normale (0.05 max)
    vec3 pos = position + normal * uExtrude * 0.05;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
