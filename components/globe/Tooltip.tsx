/**
 * Tooltip — Infobulle affichée au survol d'un pays sur le Globe
 * Composant Html de @react-three/drei rendu en overlay HTML dans la scène 3D
 * Contenu : Drapeau_SVG + nom officiel du pays
 * Exigence : 2.2
 */

import { Html } from "@react-three/drei";

interface TooltipProps {
  /** URL du drapeau SVG du pays */
  flagSvg: string;
  /** Nom officiel du pays */
  countryName: string;
  /** Contrôle la visibilité du tooltip */
  visible: boolean;
}

export default function Tooltip({ flagSvg, countryName, visible }: TooltipProps) {
  // Ne rien rendre si le tooltip n'est pas visible
  if (!visible) return null;

  return (
    <Html
      center={false}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(10, 10, 20, 0.85)",
          color: "#ffffff",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
          fontSize: "14px",
          fontFamily: "DM Sans, sans-serif",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
          transform: "translateY(-8px)",
          userSelect: "none",
        }}
      >
        <img
          src={flagSvg}
          alt={countryName}
          width={40}
          height={27}
          style={{
            objectFit: "cover",
            borderRadius: "3px",
            flexShrink: 0,
          }}
        />
        <span>{countryName}</span>
      </div>
    </Html>
  );
}
