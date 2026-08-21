import React, { useRef, useState, useEffect, useCallback } from 'react';

const W = 800, H = 520;

type Fleche = { id: string; x1: number; y1: number; x2: number; y2: number; cibleId?: string; ordre: number; };
type Element = {
  id: string;
  type: 'joueur'|'adversaire'|'plot_orange'|'plot_rouge'|'plot_jaune'|'plot_bleu'|'plot_vert'|'plot_blanc'|'piquet'|'bouclier'|'boudin'|'ballon'|'cone'|'echelle';
  x: number; y: number;
  numero?: number;
  couleur?: string;
  rotation?: number;
};

const PLOTS = [
  {type:'plot_orange', label:'🟠', couleur:'#e67e22', plotCouleur:'#e67e22'},
  {type:'plot_rouge', label:'🔴', couleur:'#e74c3c', plotCouleur:'#e74c3c'},
  {type:'plot_jaune', label:'🟡', couleur:'#f1c40f', plotCouleur:'#f1c40f'},
  {type:'plot_bleu', label:'🔵', couleur:'#2980b9', plotCouleur:'#2980b9'},
  {type:'plot_vert', label:'🟢', couleur:'#27ae60', plotCouleur:'#27ae60'},
  {type:'plot_blanc', label:'⚪', couleur:'#bdc3c7', plotCouleur:'#ecf0f1'},
];
const ACCESSOIRES = [
  ...PLOTS,
  {type:'piquet', label:'⬛ Piquet', couleur:'#2c3e50'},
  {type:'bouclier', label:'🟦 Bouclier', couleur:'#2980b9'},
  {type:'boudin', label:'🟫 Boudin', couleur:'#8B4513'},
  {type:'ballon', label:'🏉 Ballon', couleur:'#c8860a'},
  {type:'echelle', label:'🪜 Échelle', couleur:'#8e44ad'},
];

function dessinerTerrain(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i%2===0?'#2d8a4e':'#277a45';
    ctx.fillRect(i*(W/10),0,W/10,H);
  }
  const L=40,R=W-40,T=20,B=H-20,mid=W/2,enBut=55;
  ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.setLineDash([]);
  ctx.strokeRect(L,T,R-L,B-T);
  ctx.strokeRect(L,T,enBut,B-T);
  ctx.strokeRect(R-enBut,T,enBut,B-T);
  ctx.setLineDash([8,5]);
  ctx.beginPath();ctx.moveTo(L+enBut+120,T);ctx.lineTo(L+enBut+120,B);ctx.stroke();
  ctx.beginPath();ctx.moveTo(R-enBut-120,T);ctx.lineTo(R-enBut-120,B);ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(mid,T);ctx.lineTo(mid,B);ctx.stroke();
  ctx.setLineDash([6,6]);
  ctx.beginPath();ctx.moveTo(mid-65,T);ctx.lineTo(mid-65,B);ctx.stroke();
  ctx.beginPath();ctx.moveTo(mid+65,T);ctx.lineTo(mid+65,B);ctx.stroke();
  ctx.setLineDash([]);
  const lignesX=[L+enBut,L+enBut+120,mid-65,mid,mid+65,R-enBut-120,R-enBut];
  const m5=28,m15=84;
  ctx.lineWidth=1.5; ctx.strokeStyle='white';
  lignesX.forEach(x=>{
    [T+m5,B-m5,T+m15,B-m15].forEach(y=>{
      ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.stroke();
    });
  });
  ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.setLineDash([4,6]);
  ctx.beginPath();ctx.moveTo(L+enBut,T+m15);ctx.lineTo(R-enBut,T+m15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(L+enBut,B-m15);ctx.lineTo(R-enBut,B-m15);ctx.stroke();
  ctx.setLineDash([]);
}

function dessinerElement(ctx: CanvasRenderingContext2D, el: Element) {
  ctx.save();
  ctx.translate(el.x, el.y);
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
    case 'plot_orange':
    case 'plot_rouge':
    case 'plot_jaune':
    case 'plot_bleu':
    case 'plot_vert':
    case 'plot_blanc': {
      const plotColors:Record<string,string[]>={
        'plot_orange':['#e67e22','#d35400'],
        'plot_rouge':['#e74c3c','#c0392b'],
        'plot_jaune':['#f1c40f','#d4ac0d'],
        'plot_bleu':['#2980b9','#1a6da0'],
        'plot_vert':['#27ae60','#1e8449'],
        'plot_blanc':['#ecf0f1','#bdc3c7'],
      };
      const [fill,stroke]=plotColors[el.type]||['#e67e22','#d35400'];
      ctx.fillStyle=fill;
      ctx.beginPath();
      ctx.moveTo(0,-14);ctx.lineTo(11,8);ctx.lineTo(-11,8);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();
      // Base
      ctx.fillStyle=stroke;
      ctx.fillRect(-11,6,22,4);
      break;
    }
    case 'cone':
      ctx.fillStyle='#e74c3c';
      ctx.beginPath();
      ctx.moveTo(0,-14);ctx.lineTo(10,8);ctx.lineTo(-10,8);
      ctx.closePath();ctx.fill();
      ctx.fillStyle='white';ctx.font='bold 7px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('C',0,2);
      break;
    case 'piquet':
      ctx.fillStyle='#2c3e50';
      ctx.fillRect(-4,-20,8,40);
      ctx.strokeStyle='#95a5a6';ctx.lineWidth=1;ctx.strokeRect(-4,-20,8,40);
      break;
    case 'bouclier':
      ctx.fillStyle='#2980b9';
      ctx.beginPath();
      ctx.roundRect(-12,-18,24,36,4);
      ctx.fill();
      ctx.strokeStyle='#1a6da0';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='white';ctx.font='bold 8px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('B',0,0);
      break;
    case 'boudin':
      // Cylindre vertical
      ctx.fillStyle='#8B4513';
      ctx.fillRect(-10,-22,20,44);
      ctx.strokeStyle='#5D2E0C';ctx.lineWidth=1.5;ctx.strokeRect(-10,-22,20,44);
      // Ellipse haut
      ctx.fillStyle='#a0522d';
      ctx.beginPath();ctx.ellipse(0,-22,10,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      // Ellipse bas
      ctx.fillStyle='#7a3b10';
      ctx.beginPath();ctx.ellipse(0,22,10,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      // Reflet
      ctx.fillStyle='rgba(255,255,255,0.15)';
      ctx.fillRect(-8,-20,6,40);
      break;
    case 'echelle':{
      ctx.save();
      ctx.rotate(((el.rotation||0)*Math.PI)/180);
      ctx.strokeStyle='#111';ctx.lineWidth=2;
      const w=8,h=30,barres=4;
      ctx.beginPath();ctx.moveTo(-w,-h/2);ctx.lineTo(-w,h/2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w,-h/2);ctx.lineTo(w,h/2);ctx.stroke();
      for(let i=0;i<=barres;i++){
        const y2=-h/2+i*(h/barres);
        ctx.beginPath();ctx.moveTo(-w,y2);ctx.lineTo(w,y2);ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'ballon':
      ctx.fillStyle='#c8860a';
      ctx.beginPath();ctx.ellipse(0,0,12,8,Math.PI/6,0,Math.PI*2);
      ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);
      ctx.strokeStyle='white';ctx.lineWidth=0.8;ctx.stroke();
      break;
  }
  ctx.restore();
}

export default function Terrain({ onRetour }: { onRetour: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [outil, setOutil] = useState<string>('deplacer');
  const [fleches, setFleches] = useState<Fleche[]>([]);
  const flechesRef = useRef<Fleche[]>([]);
  useEffect(()=>{flechesRef.current=fleches;},[fleches]);
  const [prochainOrdre, setProchainOrdre] = useState(1);
  const [anime, setAnime] = useState(false);
  const debutFlecheRef = useRef<{x:number,y:number,cibleId?:string}|null>(null);
  const [modalJoueur, setModalJoueur] = useState<{equipe:'joueur'|'adversaire'}|null>(null);
  const [numInput, setNumInput] = useState('');
  const [nomSeance, setNomSeance] = useState('');
  const [sauvegardeOuv, setSauvegardeOuv] = useState(false);
  const [schemas, setSchemas] = useState<{id:string,nom:string,elements:Element[],fleches:Fleche[]}[]>(()=>{
    const s=localStorage.getItem('rugby-terrains');return s?JSON.parse(s):[];
  });
  const [vue, setVue] = useState<'terrain'|'liste'>('terrain');

  const dragRef = useRef<string|null>(null);
  const offsetRef = useRef({x:0,y:0});
  const elementsRef = useRef(elements);
  const outilRef = useRef(outil);
  useEffect(()=>{elementsRef.current=elements},[elements]);
  useEffect(()=>{outilRef.current=outil},[outil]);

  const draw = useCallback((els: Element[]) => {
    const c=canvas.current;if(!c)return;
    const ctx=c.getContext('2d');if(!ctx)return;
    dessinerTerrain(ctx);
    flechesRef.current.forEach(f=>{
      ctx.strokeStyle='#ffeb3b';ctx.lineWidth=2.5;ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
      const angle=Math.atan2(f.y2-f.y1,f.x2-f.x1);
      ctx.fillStyle='#ffeb3b';
      ctx.beginPath();ctx.moveTo(f.x2,f.y2);
      ctx.lineTo(f.x2-12*Math.cos(angle-0.4),f.y2-12*Math.sin(angle-0.4));
      ctx.lineTo(f.x2-12*Math.cos(angle+0.4),f.y2-12*Math.sin(angle+0.4));
      ctx.closePath();ctx.fill();
      const mx=(f.x1*0.3+f.x2*0.7),my=(f.y1*0.3+f.y2*0.7);
      ctx.beginPath();ctx.arc(mx,my,8,0,Math.PI*2);
      ctx.fillStyle='#b7950b';ctx.fill();
      ctx.fillStyle='white';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(f.ordre),mx,my);
    });
    els.forEach(el=>dessinerElement(ctx,el));
  },[]);

  useEffect(()=>{draw(elements);},[elements,draw]);

  const getPos=(cx:number,cy:number)=>{
    const r=canvas.current!.getBoundingClientRect();
    return {x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(H/r.height)};
  };

  const trouverElement=(x:number,y:number)=>
    elementsRef.current.slice().reverse().find(el=>Math.hypot(el.x-x,el.y-y)<20)||null;

  const handleStart=(x:number,y:number)=>{
    const o=outilRef.current;
    if(o==='fleche'||o==='fleche_ballon'){
      const filtre=o==='fleche_ballon'?(t:string)=>t==='ballon':(t:string)=>t!=='ballon';
      const el=elementsRef.current.slice().reverse().find(e=>filtre(e.type)&&Math.hypot(e.x-x,e.y-y)<20)||null;
      if(el){
        const fj=flechesRef.current.filter(f=>f.cibleId===el.id).sort((a,b)=>b.ordre-a.ordre);
        const last=fj[0];
        debutFlecheRef.current={x:last?last.x2:el.x,y:last?last.y2:el.y,cibleId:el.id};
      } else {
        const pointe=flechesRef.current.find(f=>Math.hypot(x-f.x2,y-f.y2)<18);
        if(pointe) debutFlecheRef.current={x:pointe.x2,y:pointe.y2,cibleId:pointe.cibleId};
        else debutFlecheRef.current={x,y};
      }
      return;
    }
    if(o==='deplacer'){
      const el=trouverElement(x,y);
      if(el){dragRef.current=el.id;offsetRef.current={x:x-el.x,y:y-el.y};}
    } else if(o==='supprimer'){
      const el=trouverElement(x,y);
      if(el){setElements(els=>els.filter(e=>e.id!==el.id));return;}
      const f=flechesRef.current.find(ff=>{
        const len=Math.hypot(ff.x2-ff.x1,ff.y2-ff.y1);
        if(len<1)return false;
        const d=Math.abs((ff.y2-ff.y1)*x-(ff.x2-ff.x1)*y+ff.x2*ff.y1-ff.y2*ff.x1)/len;
        return d<15&&Math.hypot(x-ff.x1,y-ff.y1)+Math.hypot(x-ff.x2,y-ff.y2)<len+25;
      });
      if(f){setFleches(fs=>{const u=fs.filter(ff=>ff.id!==f.id);flechesRef.current=u;draw(elementsRef.current);return u;});}
    } else if(ACCESSOIRES.map(a=>a.type).includes(o)||PLOTS.map(p=>p.type).includes(o)){
      const nouv:Element={id:Date.now().toString(),type:o as Element['type'],x,y};
      setElements(els=>{const u=[...els,nouv];elementsRef.current=u;draw(u);return u;});
    }
  };

  const handleMove=(x:number,y:number)=>{
    if(dragRef.current){
      setElements(els=>{
        const u=els.map(el=>el.id===dragRef.current?{...el,x:x-offsetRef.current.x,y:y-offsetRef.current.y}:el);
        elementsRef.current=u;draw(u);return u;
      });
    }
  };

  const handleEnd=(x:number,y:number)=>{
    if((outilRef.current==='fleche'||outilRef.current==='fleche_ballon')&&debutFlecheRef.current){
      if(Math.hypot(x-debutFlecheRef.current.x,y-debutFlecheRef.current.y)>15){
        const nf:Fleche={id:Date.now().toString(),x1:debutFlecheRef.current.x,y1:debutFlecheRef.current.y,x2:x,y2:y,cibleId:debutFlecheRef.current.cibleId,ordre:prochainOrdre};
        setFleches(fs=>{const u=[...fs,nf];flechesRef.current=u;draw(elementsRef.current);return u;});
      }
      debutFlecheRef.current=null;
    }
    dragRef.current=null;
  };

  const onTS=(e:React.TouchEvent)=>{e.preventDefault();const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleStart(p.x,p.y);};
  const onTM=(e:React.TouchEvent)=>{e.preventDefault();const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleMove(p.x,p.y);};
  const onTE=(e:React.TouchEvent)=>{e.preventDefault();const t=e.changedTouches[0];const p=getPos(t.clientX,t.clientY);handleEnd(p.x,p.y);};
  const onMD=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleStart(p.x,p.y);};
  const onMM=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleMove(p.x,p.y);};
  const onMU=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleEnd(p.x,p.y);};

  const ajouterJoueur=()=>{
    if(!modalJoueur||!numInput.trim())return;
    const num=parseInt(numInput);if(isNaN(num))return;
    const x=modalJoueur.equipe==='adversaire'?550:150;
    const y=100+(elements.filter(e=>e.type===modalJoueur.equipe).length*38)%380;
    setElements(els=>[...els,{id:Date.now().toString(),type:modalJoueur.equipe,x,y,numero:num}]);
    setModalJoueur(null);setNumInput('');
  };

  const animer=()=>{
    if(fleches.length===0||anime)return;
    setAnime(true);
    const flechesSnap=[...flechesRef.current];
    const maxOrdre=Math.max(...flechesSnap.map(f=>f.ordre));
    const elementsInitiaux=elementsRef.current.map(e=>({...e}));
    let ordreActuel=1;
    let cur=elementsInitiaux.map(e=>({...e}));
    setFleches([]);flechesRef.current=[];draw(elementsRef.current);
    const etape=()=>{
      if(ordreActuel>maxOrdre){
        setElements(elementsInitiaux);elementsRef.current=elementsInitiaux;
        setFleches(flechesSnap);flechesRef.current=flechesSnap;
        draw(elementsInitiaux);setAnime(false);return;
      }
      const fEtape=flechesSnap.filter(f=>f.ordre===ordreActuel);
      if(fEtape.length===0){ordreActuel++;etape();return;}
      let step=0;const steps=40;
      const iv=setInterval(()=>{
        step++;const t=step/steps;
        const newEls=cur.map(el=>{
          const f=fEtape.find(f=>f.cibleId===el.id);
          if(f)return {...el,x:f.x1+(f.x2-f.x1)*t,y:f.y1+(f.y2-f.y1)*t};
          return el;
        });
        setElements(newEls);elementsRef.current=newEls;draw(newEls);
        if(step>=steps){clearInterval(iv);cur=newEls;ordreActuel++;etape();}
      },20);
    };
    etape();
  };

  const sauvegarder=()=>{
    if(!nomSeance.trim())return;
    const s={id:Date.now().toString(),nom:nomSeance.trim(),elements:[...elementsRef.current],fleches:[...flechesRef.current]};
    const nouv=[...schemas,s];
    setSchemas(nouv);localStorage.setItem('rugby-terrains',JSON.stringify(nouv));
    setNomSeance('');setSauvegardeOuv(false);
  };

  const btn=(c:string,actif=false)=>({backgroundColor:actif?'#f39c12':c,color:'white',border:actif?'2px solid white':'2px solid transparent',padding:'7px 10px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:11} as React.CSSProperties);

  if(vue==='liste')return(
    <div style={{fontFamily:'sans-serif',maxWidth:820,margin:'0 auto',padding:12,backgroundColor:'#1a1a1a',minHeight:'100vh'}}>
      <div style={{backgroundColor:'#27ae60',color:'white',padding:14,borderRadius:10,marginBottom:12,textAlign:'center'}}>
        <h2 style={{margin:0}}>📋 Mes séances visuelles</h2>
      </div>
      <button style={{...btn('#555'),marginBottom:12}} onClick={()=>setVue('terrain')}>← Retour</button>
      {schemas.length===0&&<div style={{color:'#aaa',textAlign:'center',padding:40}}>Aucune séance sauvegardée</div>}
      {schemas.map(s=>(
        <div key={s.id} style={{backgroundColor:'#3a3a3a',borderRadius:8,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'white',fontWeight:'bold'}}>{s.nom}</span>
          <div style={{display:'flex',gap:6}}>
            <button style={btn('#2ecc71')} onClick={()=>{const els=s.elements.map(e=>({...e}));const fls=(s.fleches||[]).map(f=>({...f}));setElements(els);elementsRef.current=els;setFleches(fls);flechesRef.current=fls;setVue('terrain');}}>📂 Charger</button>
            <button style={btn('#e74c3c')} onClick={()=>{const n=schemas.filter(ss=>ss.id!==s.id);setSchemas(n);localStorage.setItem('rugby-terrains',JSON.stringify(n));}}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );

  return(
    <div style={{fontFamily:'sans-serif',maxWidth:820,margin:'0 auto',padding:12,backgroundColor:'#1a1a1a',minHeight:'100vh'}}>
      <div style={{backgroundColor:'#27ae60',color:'white',padding:14,borderRadius:10,marginBottom:12,textAlign:'center'}}>
        <h2 style={{margin:0}}>🏋️ Éditeur de séance visuelle</h2>
      </div>

      {modalJoueur&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{backgroundColor:'#2a2a2a',borderRadius:12,padding:24,minWidth:280,textAlign:'center'}}>
            <h3 style={{color:'white',margin:'0 0 16px'}}>Numéro du {modalJoueur.equipe==='adversaire'?'joueur adverse':'joueur allié'}</h3>
            <input autoFocus value={numInput} onChange={e=>setNumInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&ajouterJoueur()}
              placeholder="Ex: 9" type="number" min="1" max="99"
              style={{width:'100%',padding:12,borderRadius:8,border:'none',fontSize:20,textAlign:'center',marginBottom:16,boxSizing:'border-box' as const}}/>
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button style={btn(modalJoueur.equipe==='adversaire'?'#e74c3c':'#1a5276')} onClick={ajouterJoueur}>✅ Ajouter</button>
              <button style={btn('#555')} onClick={()=>{setModalJoueur(null);setNumInput('');}}>✖</button>
            </div>
          </div>
        </div>
      )}

      <div style={{backgroundColor:'#2a2a2a',borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <button style={btn('#1a5276',outil==='deplacer')} onClick={()=>setOutil('deplacer')}>✋ Déplacer</button>
          <button style={btn('#e74c3c',outil==='supprimer')} onClick={()=>setOutil('supprimer')}>🗑 Supprimer</button>
          <button style={btn('#f39c12',outil==='fleche')} onClick={()=>{outilRef.current='fleche';setOutil('fleche');}}>🟡 Mouvement joueur</button>
          <button style={btn('#c8860a',outil==='fleche_ballon')} onClick={()=>{outilRef.current='fleche_ballon';setOutil('fleche_ballon');}}>🏉 Mouvement ballon</button>
          <button style={btn('#27ae60')} onClick={()=>{setFleches([]);flechesRef.current=[];draw(elementsRef.current);}}>Effacer flèches</button>
          <button style={btn('#3498db')} onClick={animer} disabled={anime||fleches.length===0}>▶ Animer</button>
          <button style={btn('#795548')} onClick={()=>{setElements([]);setOutil('deplacer');}}>🔄 Réinitialiser</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <span style={{color:'#aaa',fontSize:11,alignSelf:'center'}}>Joueurs :</span>
          <button style={btn('#1a5276')} onClick={()=>setModalJoueur({equipe:'joueur'})}>+ Attaque</button>
          <button style={btn('#c0392b')} onClick={()=>setModalJoueur({equipe:'adversaire'})}>+ Défense</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <span style={{color:'#aaa',fontSize:11,alignSelf:'center'}}>Plots :</span>
          {PLOTS.map(a=>(
            <button key={a.type} style={btn(a.couleur,outil===a.type)} onClick={()=>{outilRef.current=a.type;setOutil(a.type);}}>{a.label}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <span style={{color:'#aaa',fontSize:11,alignSelf:'center'}}>Accessoires :</span>
          {ACCESSOIRES.filter(a=>!a.type.startsWith('plot_')).map(a=>(
            <button key={a.type} style={btn(a.couleur,outil===a.type)} onClick={()=>{outilRef.current=a.type;setOutil(a.type);}}>{a.label}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <button style={btn('#8e44ad')} onClick={()=>setSauvegardeOuv(v=>!v)}>💾 Sauvegarder</button>
          <button style={btn('#16a085')} onClick={()=>setVue('liste')}>📋 Mes séances ({schemas.length})</button>
          <button style={btn('#555')} onClick={onRetour}>← Retour</button>
        </div>
        {sauvegardeOuv&&(
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
            <input value={nomSeance} onChange={e=>setNomSeance(e.target.value)}
              placeholder="Nom de la séance (ex: Exercice défense 22m)"
              style={{flex:1,padding:8,borderRadius:8,border:'none',fontSize:13}}/>
            <button style={btn('#2ecc71')} onClick={sauvegarder}>✅ OK</button>
            <button style={btn('#555')} onClick={()=>setSauvegardeOuv(false)}>✖</button>
          </div>
        )}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
          <span style={{color:'#aaa',fontSize:11}}>Ordre :</span>
          <button style={{...btn('#555'),padding:'4px 10px',fontSize:14}} onClick={()=>setProchainOrdre(n=>Math.max(1,n-1))}>-</button>
          <span style={{color:'white',fontWeight:'bold',fontSize:14,padding:'0 8px'}}>{prochainOrdre}</span>
          <button style={{...btn('#f39c12'),padding:'4px 10px',fontSize:14}} onClick={()=>setProchainOrdre(n=>n+1)}>+</button>
        </div>
        <div style={{fontSize:11,color:'#aaa',marginBottom:6}}>
          Outil actif : <strong style={{color:'white'}}>{outil}</strong>
          {ACCESSOIRES.find(a=>a.type===outil)&&<span style={{color:'#aaa'}}> — Tape sur le terrain pour poser</span>}
        </div>
        <canvas ref={canvas} width={W} height={H}
          style={{width:'100%',borderRadius:8,cursor:outil==='deplacer'?'grab':'copy',touchAction:'none',display:'block'}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        />
      </div>
    </div>
  );
}
