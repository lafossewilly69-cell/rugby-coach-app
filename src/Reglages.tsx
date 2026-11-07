import { useEffect, useState, CSSProperties } from 'react';
import { useClub, texteSur, fondBande, Club, CLUB_DEFAUT, PALETTE_PRINCIPALE, PALETTE_ACCENT } from './club';
import Embleme from './Embleme';

const TITRE = "'Barlow Condensed','Arial Narrow',sans-serif";
const CORPS = "'Barlow',system-ui,sans-serif";
const T = { fond: '#f5f5f5', surface: '#ffffff', texte: '#14211c', doux: '#5b6b64', trait: '#d9e0dc' };

const panneau: CSSProperties = { background: T.surface, border: '1px solid ' + T.trait, borderRadius: 16, padding: 16, marginTop: 12 };
const titreSection: CSSProperties = { fontFamily: TITRE, fontWeight: 700, fontSize: 22, margin: '0 0 4px' };
const aide: CSSProperties = { margin: '0 0 12px', color: T.doux, fontSize: 14 };
const champ: CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '0 14px', borderRadius: 12, border: '1px solid ' + T.trait, fontFamily: 'inherit', fontSize: 17, color: T.texte, background: '#fff' };
const bouton: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, padding: '0 18px', borderRadius: 12, border: '1px solid ' + T.trait, background: '#fff', color: T.texte, fontFamily: 'inherit', fontWeight: 600, fontSize: 16, cursor: 'pointer' };

function Teintes({ valeur, liste, onChoix, etiquette }: { valeur: string; liste: string[]; onChoix: (c: string) => void; etiquette: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
      {liste.map(c => (
        <button key={c} type="button" aria-label={etiquette + ' ' + c} aria-pressed={valeur.toLowerCase() === c} onClick={() => onChoix(c)}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: c, cursor: 'pointer', boxShadow: valeur.toLowerCase() === c ? '0 0 0 3px #fff, 0 0 0 5px ' + c : 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />
      ))}
      <input type="color" aria-label={etiquette + ' personnalisée'} value={valeur} onChange={e => onChoix(e.target.value)}
        style={{ width: 48, height: 40, padding: 0, border: '1px solid ' + T.trait, borderRadius: 10, background: '#fff', cursor: 'pointer' }} />
    </div>
  );
}

export default function Reglages({ onRetour }: { onRetour: () => void }) {
  const [club, setClub] = useClub();
  const [brouillon, setBrouillon] = useState<Club>(club);
  const [modifie, setModifie] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => { if (!modifie) setBrouillon(club); }, [club, modifie]);

  const maj = (p: Partial<Club>) => { setModifie(true); setInfo(''); setBrouillon(b => ({ ...b, ...p })); };

  const lireImage = (f: File | undefined, max: number, jpeg: boolean, apres: (url: string) => void) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setInfo("Ce fichier n'est pas une image."); return; }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const img = new Image();
      img.onload = () => {
        let taille = max;
        let url = '';
        for (let i = 0; i < 4; i++) {
          const k = Math.min(1, taille / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k));
          c.height = Math.max(1, Math.round(img.height * k));
          const x = c.getContext('2d');
          if (!x) return;
          if (jpeg) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(img, 0, 0, c.width, c.height);
          url = jpeg ? c.toDataURL('image/jpeg', 0.75) : c.toDataURL('image/png');
          if (url.length < 250000) break;
          taille = Math.round(taille * 0.7);
        }
        apres(url);
      };
      img.onerror = () => setInfo('Image illisible, essaie un autre fichier.');
      img.src = String(lecteur.result);
    };
    lecteur.readAsDataURL(f);
  };

  const enregistrer = () => {
    setClub({ ...brouillon, nom: brouillon.nom.trim() || CLUB_DEFAUT.nom, devise: brouillon.devise.trim() });
    setModifie(false);
    setInfo('Réglages enregistrés. Tous les coachs verront ce logo et ces couleurs.');
  };

  return (
    <div style={{ fontFamily: CORPS, color: T.texte, background: T.fond, minHeight: '100vh', maxWidth: 640, margin: '0 auto', padding: 12, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onRetour} style={bouton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          Retour
        </button>
        <h1 style={{ margin: 0, fontFamily: TITRE, fontWeight: 700, fontSize: 28 }}>Réglages du club</h1>
      </div>

      <section style={panneau}>
        <h2 style={titreSection}>Aperçu</h2>
        <div style={{ background: fondBande(brouillon), color: texteSur(brouillon.couleur), borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Embleme club={brouillon} taille={52} />
          <div style={{ fontFamily: TITRE, fontWeight: 700, fontSize: 26, lineHeight: 1.05, overflowWrap: 'anywhere' }}>{brouillon.nom || CLUB_DEFAUT.nom}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
          <span style={{ background: brouillon.couleur, color: texteSur(brouillon.couleur), borderRadius: 10, padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>Tuile</span>
          <span style={{ background: brouillon.couleur2, color: texteSur(brouillon.couleur2), borderRadius: 10, padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>Bouton d'action</span>
        </div>
      </section>

      <section style={panneau}>
        <h2 style={titreSection}>Nom du club</h2>
        <p style={aide}>Il s'affiche en haut de l'accueil.</p>
        <input aria-label="Nom du club" value={brouillon.nom} maxLength={40} onChange={e => maj({ nom: e.target.value })} style={champ} />
      </section>

      <section style={panneau}>
        <h2 style={titreSection}>Devise</h2>
        <p style={aide}>Une phrase en bas de l'accueil. Laisse vide pour ne rien afficher.</p>
        <input aria-label="Devise du club" value={brouillon.devise} maxLength={60} placeholder="Ex. Le rugby, c'est un état d'esprit" onChange={e => maj({ devise: e.target.value })} style={champ} />
      </section>

      <section style={panneau}>
        <h2 style={titreSection}>Logo</h2>
        <p style={aide}>Choisis une image dans ta galerie. Un logo carré, ou sur fond transparent, rend mieux. Elle est réduite automatiquement.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ background: brouillon.couleur, color: texteSur(brouillon.couleur), padding: 10, borderRadius: 16 }}>
            <Embleme club={brouillon} taille={84} />
          </div>
          <input id="logo-fichier" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { lireImage(e.target.files?.[0], 256, false, url => maj({ logo: url })); e.target.value = ''; }} />
          <label htmlFor="logo-fichier" style={bouton}>Importer un logo</label>
          {brouillon.logo && <button type="button" style={bouton} onClick={() => maj({ logo: '' })}>Retirer le logo</button>}
        </div>
      </section>

      <section style={panneau}>
        <h2 style={titreSection}>Photo du bandeau</h2>
        <p style={aide}>Une photo d'équipe ou de terrain, en format paysage. Elle apparaît derrière le nom du club.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 160, height: 64, borderRadius: 12, background: fondBande(brouillon), border: '1px solid ' + T.trait }} />
          <input id="banniere-fichier" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { lireImage(e.target.files?.[0], 900, true, url => maj({ banniere: url })); e.target.value = ''; }} />
          <label htmlFor="banniere-fichier" style={bouton}>Importer une photo</label>
          {brouillon.banniere && <button type="button" style={bouton} onClick={() => maj({ banniere: '' })}>Retirer la photo</button>}
        </div>
      </section>

      <section style={panneau}>
        <h2 style={titreSection}>Couleurs</h2>
        <p style={{ margin: '8px 0', fontWeight: 600 }}>Couleur principale <span style={{ fontWeight: 400, color: T.doux }}>bandeau et tuiles</span></p>
        <Teintes valeur={brouillon.couleur} liste={PALETTE_PRINCIPALE} onChoix={c => maj({ couleur: c })} etiquette="Couleur principale" />
        <p style={{ margin: '18px 0 8px', fontWeight: 600 }}>Couleur d'accent <span style={{ fontWeight: 400, color: T.doux }}>boutons d'action</span></p>
        <Teintes valeur={brouillon.couleur2} liste={PALETTE_ACCENT} onChoix={c => maj({ couleur2: c })} etiquette="Couleur d'accent" />
      </section>

      <button type="button" onClick={enregistrer} disabled={!modifie}
        style={{ ...bouton, width: '100%', marginTop: 16, minHeight: 54, border: 'none', background: brouillon.couleur2, color: texteSur(brouillon.couleur2), fontSize: 17, opacity: modifie ? 1 : 0.5 }}>
        Enregistrer les réglages
      </button>
      <p role="status" style={{ margin: '12px 4px', color: T.doux, fontSize: 14 }}>{info}</p>
    </div>
  );
}
