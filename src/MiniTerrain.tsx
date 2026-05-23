import React, { useRef, useEffect } from 'react';

const W = 500, H = 320;

function dessinerTerrain(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i%2===0?'#2d8a4e':'#277a45';
    ctx.fillRect(i*(W/10),0,W/10,H);
  }
  const L=25,R=W-25,T=12,B=H-12,mid=W/2,enBut=34;
  ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.setLineDash([]);
  ctx.strokeRect(L,T,R-L,B-T);
  ctx.strokeRect(L,T,enBut,B-T);
  ctx.strokeRect(R-enBut,T,enBut,B-T);
  ctx.setLineDash([5,4]);
  ctx.beginPath();ctx.moveTo(L+enBut+75,T);ctx.lineTo(L+enBut+75,B);ctx.stroke();
  ctx.beginPath();ctx.moveTo(R-enBut-75,T);ctx.lineTo(R-enBut-75,B);ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(mid,T);ctx.lineTo(mid,B);ctx.stroke();
  ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(mid-40,T);ctx.lineTo(mid-40,B);ctx.stroke();
  ctx.beginPath();ctx.moveTo(mid+40,T);ctx.lineTo(mid+40,B);ctx.stroke();
  ctx.setLineDash([]);
}

function dessinerEl(ctx: CanvasRenderingContext2D, el: any, scaleX: number, scaleY: number) {
  const x = el.x * scaleX;
  const y = el.y * scaleY;
  ctx.save();
  ctx.translate(x, y);
  const s = Math.min(scaleX, scaleY);
  ctx.scale(s, s);
  switch(el.type) {
    case 'joueur':
      ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);
      ctx.fillStyle='#1a5276';ctx.fill();
      ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='white';ctx.font='bold 10px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(el.numero||''),0,0);
      break;
    case 'adversaire':
      ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);
      ctx.fillStyle='#e74c3c';ctx.fill();
      ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='white';ctx.font='bold 10px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(el.numero||''),0,0);
      break;
    case 'plot_orange':case 'plot_rouge':case 'plot_jaune':case 'plot_bleu':case 'plot_vert':case 'plot_blanc':{
      const c:Record<string,string>={'plot_orange':'#e67e22','plot_rouge':'#e74c3c','plot_jaune':'#f1c40f','plot_bleu':'#2980b9','plot_vert':'#27ae60','plot_blanc':'#ecf0f1'};
      ctx.fillStyle=c[el.type]||'#e67e22';
      ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,6);ctx.lineTo(-8,6);ctx.closePath();ctx.fill();
      break;}
    case 'piquet':
      ctx.fillStyle='#2c3e50';ctx.fillRect(-3,-15,6,30);break;
    case 'bouclier':
      ctx.fillStyle='#2980b9';
      ctx.beginPath();ctx.roundRect(-9,-14,18,28,3);ctx.fill();
      ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
      break;
    case 'boudin':
      ctx.fillStyle='#8B4513';ctx.fillRect(-7,-16,14,32);
      ctx.beginPath();ctx.ellipse(0,-16,7,4,0,0,Math.PI*2);ctx.fill();
      break;
    case 'ballon':
      ctx.fillStyle='#c8860a';
      ctx.beginPath();ctx.ellipse(0,0,10,7,Math.PI/6,0,Math.PI*2);ctx.fill();
      break;
  }
  ctx.restore();
}

export default function MiniTerrain({ elements, onOuvrir }: { elements: any[], onOuvrir: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    dessinerTerrain(ctx);
    const scaleX = W / 800;
    const scaleY = H / 520;
    elements.forEach(el => dessinerEl(ctx, el, scaleX, scaleY));
  }, [elements]);

  return (
    <div style={{marginBottom:12}}>
      <canvas ref={canvas} width={W} height={H}
        style={{width:'100%',borderRadius:8,display:'block',cursor:'pointer'}}
        onClick={onOuvrir}
      />
      <button onClick={onOuvrir} style={{marginTop:6,backgroundColor:'#27ae60',color:'white',border:'none',padding:'7px 14px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:12}}>
        🏋️ Ouvrir et modifier
      </button>
    </div>
  );
}
