import type { CountryData } from './types';
import { frName } from './fr-names';

/** Repères d'une fiche rapportés au pays de l'utilisateur (#29). */

const fr1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const fr0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** « du Bénin », « de la France », « de l’Inde », « des États-Unis », « de Cuba ». */
export function ofName(name: string): string {
  const { text } = frName(name);
  if (text.startsWith('le ')) return `du ${text.slice(3)}`;
  if (text.startsWith('les ')) return `des ${text.slice(4)}`;
  return `de ${text}`;
}

/** Décalage UTC d'un fuseau à cette date, en minutes. */
function utcOffset(date: Date, timeZone: string): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** « 6 h de plus qu’à Porto-Novo », « 5 h 30 de moins qu’à Paris ». */
export function timeFromHome(country: CountryData, home: CountryData, date: Date): string {
  const diff = utcOffset(date, country.primaryTimezone) - utcOffset(date, home.primaryTimezone);
  const there = `qu’à ${home.capitalFr}`;
  if (diff === 0) return `Même heure ${there}`;
  const abs = Math.abs(diff);
  const h = `${Math.floor(abs / 60)} h${abs % 60 ? ` ${String(abs % 60).padStart(2, '0')}` : ''}`;
  return `${h} de ${diff > 0 ? 'plus' : 'moins'} ${there}`;
}

/** « 3,2 fois la superficie du Bénin », « 4 % de la superficie de la France ». */
export function areaFromHome(country: CountryData, home: CountryData): string {
  const r = country.area / home.area;
  const of = `la superficie ${ofName(home.nameFr)}`;
  if (r >= 0.95 && r <= 1.05) return `À peu près ${of}`;
  if (r > 1) return `${(r < 10 ? fr1 : fr0).format(r)} fois ${of}`;
  return `${r < 0.1 ? fr1.format(r * 100) : fr0.format(r * 100)} % de ${of}`;
}
