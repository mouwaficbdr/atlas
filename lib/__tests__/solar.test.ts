import { describe, it, expect } from 'vitest';
import { solarPosition, solarElevation, sunTimes, daylightPhase } from '../solar';

const minutes = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60000;

describe('solarPosition', () => {
  it('donne la déclinaison des solstices et de l’équinoxe', () => {
    expect(solarPosition(new Date('2026-06-21T12:00:00Z')).declination).toBeCloseTo(23.44, 0);
    expect(solarPosition(new Date('2026-12-21T12:00:00Z')).declination).toBeCloseTo(-23.44, 0);
    expect(Math.abs(solarPosition(new Date('2026-03-20T15:00:00Z')).declination)).toBeLessThan(0.3);
  });

  it('place le point subsolaire selon l’équation du temps', () => {
    // Début novembre, le soleil passe au méridien de Greenwich vers 11 h 44 UTC :
    // à midi UTC il est déjà environ 4° à l’ouest.
    expect(solarPosition(new Date('2026-11-03T12:00:00Z')).subsolarLon).toBeCloseTo(-4.1, 0);
    // Six heures plus tard, 90° plus à l’ouest.
    expect(solarPosition(new Date('2026-11-03T18:00:00Z')).subsolarLon).toBeCloseTo(-94.1, 0);
  });
});

describe('solarElevation', () => {
  it('culmine au point subsolaire et passe sous l’horizon aux antipodes', () => {
    const date = new Date('2026-06-21T12:00:00Z');
    const { declination, subsolarLon } = solarPosition(date);
    expect(solarElevation(date, subsolarLon, declination)).toBeCloseTo(90, 0);
    expect(solarElevation(date, subsolarLon + 180, -declination)).toBeCloseTo(-90, 0);
  });
});

describe('sunTimes', () => {
  it('donne le lever et le coucher à Paris au solstice d’été', () => {
    // Références : lever 05 h 47 et coucher 21 h 58 heure de Paris (UTC+2).
    const { sunrise, sunset } = sunTimes(new Date('2026-06-21T12:00:00Z'), 2.35, 48.85);
    expect(minutes(sunrise!, new Date('2026-06-21T03:47:00Z'))).toBeLessThan(4);
    expect(minutes(sunset!, new Date('2026-06-21T19:58:00Z'))).toBeLessThan(4);
  });

  it('reconnaît le jour et la nuit polaires', () => {
    expect(sunTimes(new Date('2026-06-21T12:00:00Z'), 18.96, 69.65).polar).toBe('day');
    expect(sunTimes(new Date('2026-12-21T12:00:00Z'), 18.96, 69.65).polar).toBe('night');
  });
});

describe('daylightPhase', () => {
  it('distingue jour, aube, crépuscule et nuit', () => {
    expect(daylightPhase(30, 'morning')).toBe('jour');
    expect(daylightPhase(-3, 'morning')).toBe('aube');
    expect(daylightPhase(-3, 'evening')).toBe('crépuscule');
    expect(daylightPhase(-20, 'evening')).toBe('nuit');
  });
});
