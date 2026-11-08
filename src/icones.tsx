import { ReactNode } from 'react';

const I = ({ children }: { children: ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>{children}</svg>
);

export const IC = {
  deplacer: <I><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" /></I>,
  fleche: <I><circle cx="6" cy="12" r="3" /><path d="M10 12h10M16 8l4 4-4 4" /></I>,
  ballon: <I><ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-35 12 12)" /><path d="M9.5 14.5l5-5" /></I>,
  supprimer: <I><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></I>,
  plus: <I><path d="M12 5v14M5 12h14" /></I>,
  effacer: <I><path d="M7 20h13M5 15l9-9 5 5-9 9H8z" /></I>,
  reset: <I><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v5h5" /></I>,
  play: <I><path d="M8 5l11 7-11 7z" /></I>,
  partager: <I><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></I>,
  sauver: <I><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></I>,
  liste: <I><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></I>,
  retour: <I><path d="M15 6l-6 6 6 6" /></I>,
  fermer: <I><path d="M6 6l12 12M18 6L6 18" /></I>,
  modifier: <I><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></I>,
  ok: <I><path d="M5 12l5 5 9-10" /></I>,
  dossier: <I><path d="M3 7h6l2 2h10v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /></I>,
};
