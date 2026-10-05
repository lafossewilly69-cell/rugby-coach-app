import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useCloud<T>(key: string, init: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const ready = useRef(false);
  useEffect(() => {
    const ref = doc(db, 'rugby-data', key);
    return onSnapshot(ref, snap => {
      if (snap.exists()) setVal(JSON.parse(snap.data().json));
      else if (!ready.current) setDoc(ref, { json: JSON.stringify(val) }).catch(console.error);
      ready.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
    setDoc(doc(db, 'rugby-data', key), { json: JSON.stringify(v) })
      .catch(e => alert('Erreur Firestore : ' + e.message));
  };
  return [val, set];
}
