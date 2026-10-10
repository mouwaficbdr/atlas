const pct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 });
const tinyPct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumSignificantDigits: 2 });

/**
 * Part d'un total en pourcentage : deux décimales, ou deux chiffres
 * significatifs sous 0,01 % (« 0,0012 % » plutôt que « 0 % » pour un
 * micro-État).
 */
export const formatShare = (share: number) => (share >= 0.0001 ? pct : tinyPct).format(share);
