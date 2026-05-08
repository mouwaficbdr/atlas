import type { Metadata } from 'next';
import LenisProvider from '@/components/layout/LenisProvider';
import CustomCursor from '@/components/ui/CustomCursor';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATLAS°',
  description: 'Explorateur mondial de pays — Globe 3D interactif',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Bebas Neue Regular */}
        <link
          rel="preload"
          href="/fonts/BebasNeue-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* DM Sans Variable */}
        <link
          rel="preload"
          href="/fonts/DMSans-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* JetBrains Mono Variable */}
        <link
          rel="preload"
          href="/fonts/JetBrainsMono-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'Bebas Neue';
            src: url('/fonts/BebasNeue-Regular.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'DM Sans';
            src: url('/fonts/DMSans-Variable.woff2') format('woff2');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'JetBrains Mono';
            src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
      </head>
      <body>
        <LenisProvider>
          <CustomCursor />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
