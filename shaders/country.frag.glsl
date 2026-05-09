uniform vec3 uColor;
uniform float uHover;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel / Rim lighting (sharper)
    float fresnel = pow(max(0.0, 1.0 - dot(normal, viewDir)), 3.0);
    
    // Scanlines effect
    float scanline = sin(gl_FragCoord.y * 0.8) * 0.04 + 0.96;
    
    // Diffuse lighting (very soft)
    float diffuse = max(dot(normal, vec3(0.5, 0.7, 1.0)), 0.3);
    
    vec3 color = uColor * diffuse * scanline;
    
    // Internal "tech" glow
    float glow = (sin(uTime * 1.5) * 0.1 + 0.9);
    color += uColor * glow * 0.1;
    
    // Rim highlight
    color += vec3(1.0) * fresnel * 0.5;
    
    // Hover effect: intensive pulse and color shift
    float pulse = (sin(uTime * 6.0) * 0.5 + 0.5) * uHover;
    color += uColor * pulse * 0.8;
    color += vec3(0.4, 0.6, 1.0) * uHover * 0.3; // Tech blue highlights on hover
    
    gl_FragColor = vec4(color, 1.0);
}
