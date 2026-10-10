import { KOPPEN, type ClimateShare } from '@/lib/koppen';

const pct = (share: number) => `${Math.round(share * 100)} %`;

/**
 * Climats de Köppen-Geiger du pays : le plus étendu en titre, la répartition
 * des trois principaux en barre (couleurs de la légende de Beck et al.).
 */
export default function ClimateDisplay({ climate }: { climate: ClimateShare[] }) {
  const [main] = climate;
  if (!main) return null;
  const rest = 1 - climate.reduce((sum, c) => sum + (c.share ?? 0), 0);

  return (
    <div className="climate">
      <p className="climate__main">{KOPPEN[main.code].label}</p>
      {main.share === null ? (
        <p className="climate__note">
          {main.code} · territoire plus petit que la maille de la carte (11 km) : climat de la zone la plus proche.
        </p>
      ) : (
        <>
          <div className="climate__bar" role="img" aria-label={climate.map((c) => `${KOPPEN[c.code].label} ${pct(c.share ?? 0)}`).join(', ')}>
            {climate.map((c) => (
              <span key={c.code} style={{ flexGrow: c.share ?? 0, background: KOPPEN[c.code].color }} />
            ))}
            {rest > 0.005 && <span className="climate__rest" style={{ flexGrow: rest }} />}
          </div>
          <ul className="climate__legend">
            {climate.map((c) => (
              <li key={c.code}>
                <i style={{ background: KOPPEN[c.code].color }} aria-hidden="true" />
                <span>{KOPPEN[c.code].label}</span>
                <span className="climate__code">{c.code}</span>
                <span className="climate__pct">{pct(c.share ?? 0)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="climate__source">Köppen-Geiger 1991-2020 · Beck et al. 2023</p>

      <style dangerouslySetInnerHTML={{ __html: `
        .climate__main {
          margin: 0 0 1.4rem;
          font-family: var(--font-display), sans-serif;
          font-weight: 700;
          font-stretch: 70%;
          text-transform: uppercase;
          font-size: clamp(2.4rem, 4.5vw, 4.5rem);
          line-height: 0.95;
          color: var(--text-primary);
        }
        .climate__bar {
          display: flex;
          height: 6px;
          gap: 2px;
          margin-bottom: 1.1rem;
        }
        .climate__bar > span { min-width: 2px; border-radius: 1px; }
        .climate__rest { background: rgba(255, 255, 255, 0.12); }
        .climate__legend {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary, rgba(255, 255, 255, 0.75));
        }
        .climate__legend li {
          display: grid;
          grid-template-columns: 10px 1fr auto auto;
          align-items: center;
          gap: 0.7rem;
        }
        .climate__legend i { width: 10px; height: 10px; border-radius: 2px; }
        .climate__code, .climate__source, .climate__note {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .climate__pct {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.75rem;
          min-width: 3.5em;
          text-align: right;
        }
        .climate__note { line-height: 1.6; max-width: 34em; }
        .climate__source { margin: 1.2rem 0 0; opacity: 0.7; }
      ` }} />
    </div>
  );
}
