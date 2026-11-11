export const RAYON_POINTE = 32;

type F = { id: string; x1: number; y1: number; x2: number; y2: number; estBallon?: boolean };

export function pointesLibres(ctx: CanvasRenderingContext2D, fs: F[], outil: string, estBalle: (f: any) => boolean) {
  if (outil !== 'fleche' && outil !== 'fleche_ballon') return;
  const voulue = outil === 'fleche_ballon';
  ctx.save();
  fs.forEach(f => {
    if (estBalle(f) !== voulue) return;
    const suite = fs.some(g => g.id !== f.id && !!g.estBallon === !!f.estBallon && Math.hypot(g.x1 - f.x2, g.y1 - f.y2) < 2);
    if (suite) return;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(f.x2, f.y2, 19, 0, Math.PI * 2);
    ctx.fillStyle = voulue ? 'rgba(255,152,0,0.22)' : 'rgba(255,235,59,0.28)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = voulue ? '#ff9800' : '#ffeb3b';
    ctx.stroke();
  });
  ctx.restore();
}
