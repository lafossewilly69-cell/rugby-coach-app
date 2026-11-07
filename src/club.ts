import { useMemo } from 'react';
import { useCloud } from './useCloud';

export type Club = { nom: string; logo: string; banniere: string; devise: string; couleur: string; couleur2: string };

export const CLUB_DEFAUT: Club = { nom: 'Rugby Coach', logo: '', banniere: '', devise: '', couleur: '#0f2f66', couleur2: '#2f80ed' };

export const PALETTE_PRINCIPALE = ['#0f2f66', '#1a5276', '#0b6e4f', '#1e8449', '#6c3483', '#922b21', '#7d1f2e', '#212f3c', '#34495e', '#b9770e'];
export const PALETTE_ACCENT = ['#2f80ed', '#00a3bf', '#27ae60', '#f39c12', '#e67e22', '#e74c3c', '#ec407a', '#8e44ad', '#f1c40f', '#7f8c8d'];

export function useClub(): [Club, (c: Club) => void] {
  const [brut, setBrut] = useCloud<Club>('rugby-club', CLUB_DEFAUT);
  const club = useMemo<Club>(() => ({ ...CLUB_DEFAUT, ...brut }), [brut]);
  return [club, setBrut];
}

const versRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const p = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(p, 16);
  if (isNaN(n)) return [15, 47, 102];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function texteSur(fond: string): string {
  const [r, g, b] = versRgb(fond);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#10201a' : '#ffffff';
}

export function eclaircir(hex: string, k: number): string {
  const [r, g, b] = versRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * k);
  return '#' + [m(r), m(g), m(b)].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function fondBande(c: Club): string {
  if (c.banniere) {
    return 'linear-gradient(90deg,' + c.couleur + 'f2 0%,' + c.couleur + 'b3 55%,' + c.couleur + '55 100%), url("' + c.banniere + '") center/cover';
  }
  return 'linear-gradient(135deg,' + c.couleur + ',' + eclaircir(c.couleur, 0.2) + ')';
}
