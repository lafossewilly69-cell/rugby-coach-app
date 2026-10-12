import { useEffect, useState, ReactNode, CSSProperties } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User } from 'firebase/auth';
import { auth } from './firebase';

const mail = (p: string) => p.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '') + '@rugby-coach.app';

const Icone = ({ d }: { d: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IUser = <Icone d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;
const IKey = <Icone d={<><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l3 3" /></>} />;
const ILogout = <Icone d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>} />;

export default function Connexion({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pret, setPret] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [changer, setChanger] = useState(false);
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setPret(true); }), []);

  const entrer = async () => {
    setErreur('');
    try { await signInWithEmailAndPassword(auth, mail(prenom), code); }
    catch { setErreur('Prénom ou code incorrect'); }
  };

  const modifier = async () => {
    if (!user || !user.email) return;
    if (nouveau.length < 6) { setErreur('6 caractères minimum'); return; }
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, ancien));
      await updatePassword(user, nouveau);
      setInfo('Code modifié ✓'); setErreur(''); setChanger(false); setAncien(''); setNouveau('');
    } catch (e: any) {
      setInfo('');
      setErreur(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' ? 'Code actuel incorrect' : 'Erreur : ' + e.message);
    }
  };

  const quitter = () => { setOuvert(false); setChanger(false); setInfo(''); setErreur(''); signOut(auth); };

  const champ: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 12, margin: '8px 0', borderRadius: 8, border: '1px solid #555', background: '#2a2a2a', color: 'white', fontSize: 16 };
  const bouton: CSSProperties = { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#27ae60', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' };
  const ligne: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 46, padding: '0 12px', marginTop: 8, borderRadius: 10, border: 'none', background: '#333', color: 'white', fontSize: 15, cursor: 'pointer', textAlign: 'left' };

  if (!pret) return null;
  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ width: 300, color: 'white' }}>
        <h2 style={{ textAlign: 'center' }}>🏉 Connexion</h2>
        <input style={champ} placeholder="Prénom" value={prenom} autoCapitalize="none" onChange={e => setPrenom(e.target.value)} />
        <input style={champ} type="password" placeholder="Code" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') entrer(); }} />
        {erreur && <p style={{ color: '#e74c3c' }}>{erreur}</p>}
        <button style={bouton} onClick={entrer}>Entrer</button>
      </div>
    </div>
  );

  const nom = (user.email || '').split('@')[0];
  const nomAffiche = nom.charAt(0).toUpperCase() + nom.slice(1);

  return (<>
    {children}
    <button aria-label="Mon compte" onClick={() => { setOuvert(!ouvert); setChanger(false); setInfo(''); setErreur(''); }}
      style={{ position: 'fixed', bottom: 12, right: 12, width: 46, height: 46, borderRadius: '50%', border: '1px solid #666', background: '#000c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 }}>
      {IUser}
    </button>
    {ouvert && (
      <div style={{ position: 'fixed', bottom: 66, right: 12, width: 250, background: '#1f1f1f', color: 'white', border: '1px solid #444', borderRadius: 12, padding: 12, zIndex: 9999, fontFamily: 'sans-serif', boxShadow: '0 4px 16px #0008' }}>
        <div style={{ fontWeight: 'bold', fontSize: 15 }}>{nomAffiche}</div>
        {!changer && (<>
          <button style={ligne} onClick={() => { setChanger(true); setInfo(''); setErreur(''); }}>{IKey}<span>Changer mon code</span></button>
          <button style={{ ...ligne, background: '#7b2d26' }} onClick={quitter}>{ILogout}<span>Quitter</span></button>
        </>)}
        {changer && (<div>
          <input style={champ} type="password" placeholder="Code actuel" value={ancien} onChange={e => setAncien(e.target.value)} />
          <input style={champ} type="password" placeholder="Nouveau code (6 car. min)" value={nouveau} onChange={e => setNouveau(e.target.value)} />
          <button style={bouton} onClick={modifier}>Valider</button>
          <button style={{ ...ligne, justifyContent: 'center' }} onClick={() => { setChanger(false); setErreur(''); }}>Annuler</button>
        </div>)}
        {erreur && <div style={{ color: '#e74c3c', marginTop: 8, fontSize: 13 }}>{erreur}</div>}
        {info && <div style={{ color: '#2ecc71', marginTop: 8, fontSize: 13 }}>{info}</div>}
      </div>
    )}
  </>);
}
