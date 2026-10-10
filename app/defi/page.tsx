import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Défi du jour',
  description: 'Un pays par jour, le même pour tous : le globe se pose dessus, à vous de le nommer en trois essais.',
  alternates: { canonical: '/defi' },
};

/** Le défi se joue par-dessus le globe : son interface vit dans PersistentLayout. */
export default function DefiPage() {
  return <main style={{ pointerEvents: 'none' }} />;
}
