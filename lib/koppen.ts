/**
 * Classification climatique de Köppen-Geiger : libellés français et couleurs
 * de la légende de Beck et al. (2023), source de scripts/vendor/koppen.json.
 */

export type KoppenCode =
  | 'Af' | 'Am' | 'Aw' | 'BWh' | 'BWk' | 'BSh' | 'BSk'
  | 'Csa' | 'Csb' | 'Csc' | 'Cwa' | 'Cwb' | 'Cwc' | 'Cfa' | 'Cfb' | 'Cfc'
  | 'Dsa' | 'Dsb' | 'Dsc' | 'Dsd' | 'Dwa' | 'Dwb' | 'Dwc' | 'Dwd'
  | 'Dfa' | 'Dfb' | 'Dfc' | 'Dfd' | 'ET' | 'EF';

export interface ClimateShare {
  code: KoppenCode;
  /** Part du territoire (0 à 1) ; null pour un micro-État sous la résolution de la carte. */
  share: number | null;
}

export const KOPPEN: Record<KoppenCode, { label: string; color: string }> = {
  Af: { label: 'Équatorial', color: '#0000ff' },
  Am: { label: 'Tropical de mousson', color: '#0078ff' },
  Aw: { label: 'Tropical de savane', color: '#46aafa' },
  BWh: { label: 'Désertique chaud', color: '#ff0000' },
  BWk: { label: 'Désertique froid', color: '#ff9696' },
  BSh: { label: 'Semi-aride chaud', color: '#f5a500' },
  BSk: { label: 'Semi-aride froid', color: '#ffdc64' },
  Csa: { label: 'Méditerranéen à été chaud', color: '#ffff00' },
  Csb: { label: 'Méditerranéen à été tempéré', color: '#c8c800' },
  Csc: { label: 'Méditerranéen à été frais', color: '#969600' },
  Cwa: { label: 'Subtropical à hiver sec', color: '#96ff96' },
  Cwb: { label: 'Tempéré d’altitude à hiver sec', color: '#64c864' },
  Cwc: { label: 'Tempéré froid à hiver sec', color: '#329632' },
  Cfa: { label: 'Subtropical humide', color: '#c8ff50' },
  Cfb: { label: 'Océanique', color: '#64ff50' },
  Cfc: { label: 'Océanique subpolaire', color: '#32c800' },
  Dsa: { label: 'Continental à été sec et chaud', color: '#ff00ff' },
  Dsb: { label: 'Continental à été sec et tempéré', color: '#c800c8' },
  Dsc: { label: 'Subarctique à été sec', color: '#963296' },
  Dsd: { label: 'Subarctique à été sec, hiver extrême', color: '#966496' },
  Dwa: { label: 'Continental à hiver sec, été chaud', color: '#aaafff' },
  Dwb: { label: 'Continental à hiver sec, été tempéré', color: '#5a78dc' },
  Dwc: { label: 'Subarctique à hiver sec', color: '#4b50b4' },
  Dwd: { label: 'Subarctique à hiver sec et extrême', color: '#320087' },
  Dfa: { label: 'Continental humide à été chaud', color: '#00ffff' },
  Dfb: { label: 'Continental humide à été tempéré', color: '#37c8ff' },
  Dfc: { label: 'Subarctique', color: '#007d7d' },
  Dfd: { label: 'Subarctique à hiver extrême', color: '#00465f' },
  ET: { label: 'Toundra', color: '#b2b2b2' },
  EF: { label: 'Glace permanente', color: '#666666' },
};
