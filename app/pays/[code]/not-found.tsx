import type { Metadata } from 'next';
import OffMapScreen from '@/components/ui/OffMapScreen';

export const metadata: Metadata = {
  title: 'Pays hors-carte',
  robots: { index: false, follow: false },
};

export default function CountryNotFound() {
  return (
    <OffMapScreen
      status="404"
      kicker="Code pays non répertorié"
      headline="Pays hors-carte"
      message="Aucun État de l'atlas ne correspond à ce code. L'atlas répertorie les 193 États membres de l'ONU."
    />
  );
}
