import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google';
import LenisProvider from '@/components/layout/LenisProvider';
import PersistentLayout from '@/components/layout/PersistentLayout';
import { SITE_URL } from '@/lib/site-config';
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'atlas · Explorer les 193 États du monde',
    template: '%s · atlas',
  },
  description: 'Explorez le monde en 3D avec atlas : un globe interactif des 193 États souverains, avec leurs données géographiques, culturelles et économiques.',
  keywords: ['atlas', 'globe 3D', 'pays', 'géographie', 'cartographie', 'monde', 'exploration', 'données pays'],
  authors: [{ name: 'Mouwafic Badarou' }],
  creator: 'Mouwafic Badarou',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'atlas',
    title: 'atlas · Explorer les 193 États du monde',
    description: 'Explorez le monde en 3D avec atlas : un globe interactif des 193 États souverains, avec leurs données géographiques, culturelles et économiques.',
    // L'image est fournie par app/opengraph-image.tsx (générée, ratio réel).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'atlas · Explorer les 193 États du monde',
    description: 'Explorez le monde en 3D avec atlas : un globe interactif des 193 États souverains.',
    // L'image est fournie par app/twitter-image.tsx.
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
          <PersistentLayout>
            {children}
          </PersistentLayout>
        </LenisProvider>
      </body>
    </html>
  );
}
