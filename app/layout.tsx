import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google';
import LenisProvider from '@/components/layout/LenisProvider';
import CustomCursor from '@/components/ui/CustomCursor';
import PersistentLayout from '@/components/layout/PersistentLayout';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-globe.vercel.app'),
  title: {
    default: 'ATLAS° — Explorateur mondial de pays',
    template: '%s | ATLAS°',
  },
  description: 'Explorez le monde en 3D avec ATLAS° : un globe interactif présentant 195 pays avec leurs données géographiques, culturelles et économiques.',
  keywords: ['atlas', 'globe 3D', 'pays', 'géographie', 'cartographie', 'monde', 'exploration', 'données pays'],
  authors: [{ name: 'ATLAS Team' }],
  creator: 'ATLAS Team',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://atlas-globe.vercel.app',
    siteName: 'ATLAS°',
    title: 'ATLAS° — Explorateur mondial de pays',
    description: 'Explorez le monde en 3D avec ATLAS° : un globe interactif présentant 195 pays avec leurs données géographiques, culturelles et économiques.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ATLAS° - Globe 3D interactif',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATLAS° — Explorateur mondial de pays',
    description: 'Explorez le monde en 3D avec ATLAS° : un globe interactif présentant 195 pays.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${bebasNeue.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <LenisProvider>
          <CustomCursor />
          <PersistentLayout>
            {children}
          </PersistentLayout>
        </LenisProvider>
      </body>
    </html>
  );
}
