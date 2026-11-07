import { Club } from './club';

export default function Embleme({ club, taille = 64 }: { club: Club; taille?: number }) {
  const initiales = club.nom.trim().split(/\s+/).slice(0, 2).map(m => m.charAt(0).toUpperCase()).join('') || 'RC';
  return (
    <div style={{ width: taille, height: taille, flex: 'none', borderRadius: Math.round(taille * 0.22), background: club.logo ? '#ffffff' : 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'inherit', fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif", fontWeight: 700, fontSize: Math.round(taille * 0.42) }}>
      {club.logo ? <img src={club.logo} alt={'Logo ' + club.nom} style={{ width: '88%', height: '88%', objectFit: 'contain' }} /> : initiales}
    </div>
  );
}
