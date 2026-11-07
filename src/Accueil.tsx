import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import { ReactNode, CSSProperties } from 'react';
import { useClub, texteSur, eclaircir, fondBande } from './club';
import Embleme from './Embleme';

type S = { id: string; date: string; heure: string; duree: number; categorie: string; genre: string; theme: string; exercices: unknown[] };
type Cible = 'form' | 'tactique' | 'terrain' | 'effectif' | 'cycle' | 'reglages';
type Props = { seances: S[]; C: Record<string, string>; onNav: (v: Cible) => void; onOpen: (id: string) => void };

const TITRE = "'Barlow Condensed','Arial Narrow',sans-serif";
const CORPS = "'Barlow',system-ui,sans-serif";
const T = { surface: '#ffffff', texte: '#14211c', doux: '#5b6b64', trait: '#dde4ea' };

const Ico = ({ children, taille = 22 }: { children: ReactNode; taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const I = {
  accueil: (t: number) => <Ico taille={t}><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></Ico>,
  agenda: (t: number) => <Ico taille={t}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Ico>,
  nouvelle: (t: number) => <Ico taille={t}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4" /></Ico>,
  tactique: (t: number) => <Ico taille={t}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14" /><circle cx="12" cy="12" r="2.5" /></Ico>,
  terrain: (t: number) => <Ico taille={t}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" /></Ico>,
  effectif: (t: number) => <Ico taille={t}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3.2 2.5-5 5.5-5s5.5 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.8-.2 4.7 1.4 4.7 4.3" /></Ico>,
  cycle: (t: number) => <Ico taille={t}><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v5h-5" /></Ico>,
  reglages: (t: number) => <Ico taille={t}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Ico>,
  horloge: (t: number) => <Ico taille={t}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ico>,
  liste: (t: number) => <Ico taille={t}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Ico>,
  fleche: (t: number) => <Ico taille={t}><path d="M9 6l6 6-6 6" /></Ico>,
};

const RUBRIQUES: { k: Cible; titre: string; desc: string; icone: (t: number) => ReactNode }[] = [
  { k: 'form', titre: 'Nouvelle séance', desc: 'Créer et planifier une séance', icone: I.nouvelle },
  { k: 'tactique', titre: 'Tactiques', desc: 'Schémas et stratégies', icone: I.tactique },
  { k: 'terrain', titre: 'Séance visuelle', desc: 'Exercices sur le terrain', icone: I.terrain },
  { k: 'effectif', titre: 'Effectif', desc: 'Joueuses et équipes', icone: I.effectif },
  { k: 'cycle', titre: 'Cycles', desc: 'Périodisation et planning', icone: I.cycle },
];

const aujourdhui = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const lireDate = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
};
const plageHoraire = (h: string, duree: number) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(h);
  if (!m) return h;
  const tot = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (duree || 0)) % 1440;
  const p = (n: number) => String(n).padStart(2, '0');
  return h + ' - ' + p(Math.floor(tot / 60)) + ':' + p(tot % 60);
};

const carte: CSSProperties = { background: T.surface, border: '1px solid ' + T.trait, borderRadius: 16, overflow: 'hidden' };
const ligne: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box', padding: '12px 16px', minHeight: 60, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' };

export default function Accueil({ seances, C, onNav, onOpen }: Props) {
  const [club] = useClub();
  const surBande = texteSur(club.couleur);
  const fondTuile = eclaircir(club.couleur, 0.1);
  const surTuile = texteSur(fondTuile);
  const voile = surTuile === '#ffffff' ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.08)';
  const surAccent = texteSur(club.couleur2);

  const tri = [...seances].sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const auj = aujourdhui();
  const prochaine = tri.find(s => s.date >= auj);
  const dP = prochaine ? lireDate(prochaine.date) : null;

  const mots = club.nom.trim().split(/\s+/);
  const premier = mots[0] || '';
  const reste = mots.slice(1).join(' ');
  const teinteReste = surBande === '#ffffff' ? eclaircir(club.couleur2, 0.45) : 'inherit';

  const aller = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onglets: { id: string; label: string; icone: (t: number) => ReactNode; actif: boolean; action: () => void }[] = [
    { id: 'accueil', label: 'Accueil', icone: I.accueil, actif: true, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { id: 'seances', label: 'Séances', icone: I.agenda, actif: false, action: () => aller('planning') },
    { id: 'tactique', label: 'Tactiques', icone: I.tactique, actif: false, action: () => onNav('tactique') },
    { id: 'effectif', label: 'Effectif', icone: I.effectif, actif: false, action: () => onNav('effectif') },
    { id: 'reglages', label: 'Réglages', icone: I.reglages, actif: false, action: () => onNav('reglages') },
  ];

  return (
    <div style={{ fontFamily: CORPS, color: T.texte }}>
      <header style={{ background: fondBande(club), color: surBande, borderRadius: 18, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Embleme club={club} taille={64} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: TITRE, fontWeight: 700, fontSize: 36, lineHeight: 1, overflowWrap: 'anywhere' }}>
            {premier}
            {reste && <span style={{ fontStyle: 'italic', marginLeft: 8, color: teinteReste }}>{reste}</span>}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.88 }}>Planning des séances</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {RUBRIQUES.map(r => (
          <button key={r.k} type="button" onClick={() => onNav(r.k)}
            style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 124, padding: 14, borderRadius: 16, border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: fondTuile, color: surTuile }}>
            <span aria-hidden="true" style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.08 }}>{r.icone(104)}</span>
            <span style={{ width: 46, height: 46, borderRadius: 12, background: voile, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.icone(24)}</span>
            <span style={{ display: 'block', paddingRight: 34 }}>
              <span style={{ display: 'block', fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>{r.titre}</span>
              <span style={{ display: 'block', fontSize: 13, opacity: 0.82, marginTop: 3 }}>{r.desc}</span>
            </span>
            <span aria-hidden="true" style={{ position: 'absolute', right: 12, bottom: 12, width: 28, height: 28, borderRadius: '50%', background: voile, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.fleche(16)}</span>
          </button>
        ))}
      </div>

      <h2 style={{ fontFamily: TITRE, fontWeight: 700, fontSize: 24, margin: '22px 4px 10px' }}>Prochaine séance</h2>
      {prochaine ? (
        <button type="button" onClick={() => onOpen(prochaine.id)} style={{ ...carte, display: 'flex', alignItems: 'stretch', width: '100%', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>
          <span style={{ width: 78, flex: 'none', background: club.couleur, color: surBande, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', lineHeight: 1.1, padding: '10px 0' }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>{dP ? dP.toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}</span>
            <span style={{ fontFamily: TITRE, fontWeight: 700, fontSize: 40 }}>{dP ? dP.getDate() : '–'}</span>
            <span style={{ fontSize: 13, opacity: 0.9 }}>{dP ? dP.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
          </span>
          <span style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: T.doux }}>{I.horloge(16)}{plageHoraire(prochaine.heure, prochaine.duree)}</span>
              <span style={{ background: club.couleur + '1f', color: club.couleur, borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{prochaine.categorie} {prochaine.genre}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: TITRE, fontWeight: 700, fontSize: 26, margin: '6px 0 4px' }}>
              <span style={{ width: 11, height: 11, flex: 'none', borderRadius: 99, background: C[prochaine.theme] || club.couleur2 }} />
              Séance {prochaine.theme.toLowerCase()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: T.doux }}>{I.liste(16)}{prochaine.exercices.length} exercice(s)</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', paddingRight: 12, color: T.doux }}>{I.fleche(20)}</span>
        </button>
      ) : (
        <div style={{ ...carte, padding: 18 }}>
          <p style={{ margin: 0, fontFamily: TITRE, fontWeight: 700, fontSize: 24 }}>Aucune séance prévue</p>
          <p style={{ margin: '4px 0 12px', color: T.doux, fontSize: 15 }}>Planifie ta prochaine séance pour la retrouver ici.</p>
          <button type="button" onClick={() => onNav('form')} style={{ minHeight: 46, padding: '0 18px', border: 'none', borderRadius: 12, background: club.couleur2, color: surAccent, fontFamily: 'inherit', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Nouvelle séance</button>
        </div>
      )}

      <h2 id="planning" style={{ fontFamily: TITRE, fontWeight: 700, fontSize: 24, margin: '22px 4px 10px', scrollMarginTop: 12 }}>Planning</h2>
      {tri.length === 0 ? (
        <div style={{ ...carte, padding: 18, color: T.doux }}>
          <p style={{ margin: 0 }}>Aucune séance planifiée. Appuie sur « Nouvelle séance » pour créer la première.</p>
        </div>
      ) : (
        <div style={carte}>
          {tri.map((s, i) => {
            const d = lireDate(s.date);
            return (
              <button key={s.id} type="button" onClick={() => onOpen(s.id)} style={{ ...ligne, borderTop: i === 0 ? 'none' : '1px solid ' + T.trait, opacity: s.date < auj ? 0.55 : 1 }}>
                <span style={{ width: 52, flex: 'none', textAlign: 'center', lineHeight: 1 }}>
                  <span style={{ display: 'block', fontFamily: TITRE, fontWeight: 700, fontSize: 30 }}>{d ? d.getDate() : '–'}</span>
                  <span style={{ display: 'block', fontSize: 13, color: T.doux, marginTop: 3 }}>{d ? d.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, flex: 'none', borderRadius: 99, background: C[s.theme] || '#888888' }} />
                    {s.theme}
                  </span>
                  <span style={{ display: 'block', fontSize: 14, color: T.doux, marginTop: 2 }}>{plageHoraire(s.heure, s.duree)} · {s.categorie} {s.genre} · {s.exercices.length} exercice(s)</span>
                </span>
                <span style={{ color: T.doux, display: 'flex' }}>{I.fleche(20)}</span>
              </button>
            );
          })}
        </div>
      )}

      {club.devise.trim() && (
        <p style={{ textAlign: 'center', margin: '30px 8px 0' }}>
          <span style={{ fontStyle: 'italic', fontSize: 18, borderBottom: '3px solid ' + club.couleur2, paddingBottom: 4 }}>{club.devise}</span>
        </p>
      )}
      <div style={{ height: 96 }} />

      <nav aria-label="Navigation principale" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: '#ffffff', borderTop: '1px solid ' + T.trait, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ display: 'flex', maxWidth: 800, margin: '0 auto' }}>
          {onglets.map(o => (
            <button key={o.id} type="button" onClick={o.action} aria-current={o.actif ? 'page' : undefined}
              style={{ flex: 1, minHeight: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: o.actif ? 600 : 400, color: o.actif ? club.couleur : T.doux }}>
              {o.icone(24)}
              {o.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
