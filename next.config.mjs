// NOTE: script-src/style-src gardent 'unsafe-inline' car l'app s'appuie
// massivement sur des styles inline React et sur le script d'hydratation
// Next.js ; un CSP strict à base de nonce demanderait de faire transiter un
// nonce jusque dans chaque composant et n'a pas semblé justifié ici. Le CSP
// reste néanmoins utile : il verrouille les hôtes autorisés (images, connect)
// et bloque tout embarquement en iframe (clickjacking).
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://flagcdn.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      use: 'raw-loader',
    });
    return config;
  },
  async headers() {
    // Le mode dev de Next.js s'appuie sur de l'évaluation dynamique de code
    // pour le Fast Refresh : un CSP strict casserait le rechargement à chaud.
    // On ne l'applique donc qu'en production.
    if (process.env.NODE_ENV !== 'production') return [];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
