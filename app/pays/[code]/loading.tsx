/**
 * ATLAS° — Loading UI pour la route /pays/[code]
 *
 * Next.js 14 App Router : ce fichier s'affiche automatiquement
 * pendant le chargement SSR de la page pays (Suspense boundary).
 */

export default function CountryLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-surface, #05050A)',
        zIndex: 5000,
        color: 'var(--text-muted, rgba(255,255,255,0.3))',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div 
        style={{
          width: '40px',
          height: '1px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: '100%',
            backgroundColor: 'var(--country-accent, #fff)',
            animation: 'loadingLine 1s infinite ease-in-out'
          }}
        />
        <style>
          {`
            @keyframes loadingLine {
              0% { left: -30%; }
              100% { left: 100%; }
            }
          `}
        </style>
      </div>
      <div>Acquisition des données...</div>
    </div>
  );
}
