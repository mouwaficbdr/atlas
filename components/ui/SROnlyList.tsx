/**
 * SROnlyList : liste HTML accessible des pays.
 * Exigences : 1.6, 12.2, 12.5
 *
 * - Masquée visuellement via `sr-only` (accessible aux lecteurs d'écran)
 * - Visible comme contenu principal si WebGL2 non supporté (visible=true)
 */

import Link from "next/link";
import { CountryData } from "@/lib/types";

interface SROnlyListProps {
  countries: CountryData[];
  visible?: boolean;
}

export default function SROnlyList({
  countries,
  visible = false,
}: SROnlyListProps) {
  const sorted = [...countries].sort((a, b) => {
    const nameA = a.name?.common || '';
    const nameB = b.name?.common || '';
    return nameA.localeCompare(nameB);
  });

  const list = (
    <ul role="list">
      {sorted.map((country) => (
        <li key={country.cca3} role="listitem">
          <Link
            href={`/pays/${country.cca3.toLowerCase()}`}
            role="link"
          >
            {country.name?.common || country.cca3}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (visible) {
    return list;
  }

  return <div className="sr-only">{list}</div>;
}
