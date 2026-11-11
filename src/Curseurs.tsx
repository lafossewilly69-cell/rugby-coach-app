import { CSSProperties } from 'react';
import { useClub } from './club';

export type Reglage = { id: string; label: string; valeur: number };

export default function Curseurs({ reglages, onChange, onReset }: { reglages: Reglage[]; onChange: (id: string, v: number) => void; onReset: () => void }) {
  const [club] = useClub();
  const ligne: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' };
  return (
    <details style={{ margin: '0 0 10px', background: '#ffffff', border: '1px solid #dde4ea', borderRadius: 12, padding: '4px 14px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '10px 0', color: '#14211c', fontSize: 14 }}>Taille des éléments</summary>
      {reglages.map(r => (
        <label key={r.id} style={ligne}>
          <span style={{ width: 96, fontSize: 14, color: '#14211c' }}>{r.label}</span>
          <input type="range" min={0.5} max={2.5} step={0.05} value={r.valeur} onChange={e => onChange(r.id, parseFloat(e.target.value))} style={{ flex: 1, height: 32, accentColor: club.couleur }} />
          <span style={{ width: 52, textAlign: 'right', fontSize: 13, color: '#5b6b64' }}>{Math.round(r.valeur * 100)} %</span>
        </label>
      ))}
      <button type="button" onClick={onReset} style={{ margin: '4px 0 12px', minHeight: 40, padding: '0 14px', borderRadius: 10, border: '1px solid #d9e0dc', background: '#ffffff', color: '#14211c', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Taille d'origine</button>
    </details>
  );
}
