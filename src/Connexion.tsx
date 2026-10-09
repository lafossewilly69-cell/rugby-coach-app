import { useEffect, useState, ReactNode, CSSProperties } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, User } from 'firebase/auth';
import { auth } from './firebase';

const mail = (p: string) => p.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '') + '@rugby-coach.app';

export default function Connexion({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pret, setPret] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [changer, setChanger] = useState(false);
  const [nouveau, setNouveau] = useState('');

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setPret(true); }), []);

  const entrer = async () => {
    setErreur('');
    try { await signInWithEmailAndPassword(auth, mail(prenom), code); }
    catch { setErreur('Prénom ou code incorrect'); }
  };
  const modifier = async () => {
    if (!user || nouveau.length < 6) { setErreur('6 caractères minimum'); return; }
    try {
      await updatePassword(user, nouveau);
      setInfo('Code modifié'); setErreur(''); setChanger(false); setNouveau('');
    } catch (e: any) {
      setErreur(e.code === 'auth/requires-recent-login' ? 'Quitte puis reconnecte-toi, puis réessaie' : 'Erreur : ' + e.message);
    }
  };

  const champ: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 12, margin: '8px 0', borderRadius: 8, border: '1px solid #555', background: '#2a2a2a', color: 'white', fontSize: 16 };
  const bouton: CSSProperties = { width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#27ae60', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' };

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

  return (<>
    {children}
    <div style={{ position: 'fixed', bottom: 6, right: 6, background: '#000c', color: 'white', fontSize: 11, padding: '4px 8px', borderRadius: 8, zIndex: 9999 }}>
      {(user.email || '').split('@')[0]} ·{' '}
      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setChanger(!changer); setInfo(''); setErreur(''); }}>Changer mon code</span> ·{' '}
      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => signOut(auth)}>Quitter</span>
      {changer && (<div style={{ marginTop: 6 }}>
        <input style={{ ...champ, fontSize: 13, padding: 6 }} type="password" placeholder="Nouveau code (6 car. min)" value={nouveau} onChange={e => setNouveau(e.target.value)} />
        <button style={{ ...bouton, padding: 6, fontSize: 13 }} onClick={modifier}>Valider</button>
      </div>)}
      {erreur && <div style={{ color: '#e74c3c' }}>{erreur}</div>}
      {info && <div style={{ color: '#2ecc71' }}>{info}</div>}
    </div>
  </>);
}
