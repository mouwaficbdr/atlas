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
  title: 'ATLAS°',
  description: 'Explorateur mondial de pays — Globe 3D interactif',
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
