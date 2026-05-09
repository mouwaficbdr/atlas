uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Deep ocean base color
    vec3 color = vec3(0.02, 0.04, 0.08);
    
    // Subtle grid pattern
    // We use the normal in world space (or similar) to create a grid
    // Since it's a sphere, we can use polar coordinates or just the normal
    float grid = abs(sin(normal.x * 20.0)) * abs(sin(normal.y * 20.0)) * abs(sin(normal.z * 20.0));
    grid = pow(grid, 10.0); // Make it very sharp lines
    
    color += vec3(0.1, 0.2, 0.4) * grid * 0.5;
    
    // Moving tech pulses
    float pulse = sin(normal.y * 10.0 + uTime * 0.5) * 0.5 + 0.5;
    pulse = pow(max(0.0, pulse), 20.0);
    color += vec3(0.0, 0.3, 0.6) * pulse * 0.2;
    
    // Fresnel for the ocean surface
    float fresnel = pow(max(0.0, 1.0 - dot(normal, viewDir)), 2.0);
    color += vec3(0.1, 0.2, 0.4) * fresnel * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}
