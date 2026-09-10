import type { Metadata } from 'next';
import OffMapScreen from '@/components/ui/OffMapScreen';

export const metadata: Metadata = {
  title: 'Hors-carte',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <OffMapScreen
      status="404"
      kicker="Coordonnées sans territoire"
      headline="Hors-carte"
      message="Cette adresse ne mène à aucun relevé de l'atlas. La page a peut-être été déplacée, ou n'a jamais existé."
    />
  );
}
