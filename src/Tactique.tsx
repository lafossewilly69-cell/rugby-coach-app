import React, { useRef, useState, useEffect, useCallback } from 'react';

type Joueur = { id: string; x: number; y: number; numero: number; equipe: 'nous' | 'eux' };
type Fleche = { id: string; x1: number; y1: number; x2: number; y2: number; cibleId?: string; estBallon?: boolean; ordre: number };
type Schema = { id: string; nom: string; joueurs: Joueur[]; fleches: Fleche[]; ballon: {x:number,y:number} };

const W = 800, H = 520;

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
  ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='10px sans-serif';ctx.textAlign='center';
  ctx.fillText('En-but',L+enBut/2,T+12);ctx.fillText('22m',L+enBut+60,T+12);
  ctx.fillText('10m',mid-65,T+12);ctx.fillText('10m',mid+65,T+12);
  ctx.fillText('22m',R-enBut-60,T+12);ctx.fillText('En-but',R-enBut/2,T+12);
}

const JOUEURS_INIT: Joueur[] = [
  {id:'j1',x:90,y:200,numero:1,equipe:'nous'},{id:'j2',x:90,y:260,numero:2,equipe:'nous'},
  {id:'j3',x:90,y:320,numero:3,equipe:'nous'},{id:'j4',x:125,y:175,numero:4,equipe:'nous'},
  {id:'j5',x:125,y:345,numero:5,equipe:'nous'},{id:'j6',x:160,y:210,numero:6,equipe:'nous'},
  {id:'j7',x:160,y:310,numero:7,equipe:'nous'},{id:'j8',x:160,y:260,numero:8,equipe:'nous'},
  {id:'j9',x:205,y:260,numero:9,equipe:'nous'},{id:'j10',x:240,y:225,numero:10,equipe:'nous'},
  {id:'j11',x:285,y:150,numero:11,equipe:'nous'},{id:'j12',x:270,y:235,numero:12,equipe:'nous'},
  {id:'j13',x:270,y:285,numero:13,equipe:'nous'},{id:'j14',x:285,y:370,numero:14,equipe:'nous'},
  {id:'j15',x:325,y:260,numero:15,equipe:'nous'},
];

export default function Tactique({ onRetour }: { onRetour: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [joueurs, setJoueurs] = useState<Joueur[]>(JOUEURS_INIT.map(j=>({...j})));
  const [ballon, setBallon] = useState({x:205,y:260});
  const [fleches, setFleches] = useState<Fleche[]>([]);
  const [outil, setOutil] = useState<'deplacer'|'fleche'|'fleche_ballon'|'supprimer'>('deplacer');
  const [anime, setAnime] = useState(false);
  const [schemas, setSchemas] = useState<Schema[]>(()=>{const s=localStorage.getItem('rugby-schemas');return s?JSON.parse(s):[];});
  const [vue, setVue] = useState<'terrain'|'liste'>('terrain');
  const [nomNouv, setNomNouv] = useState('');
  const [sauvegardeOuv, setSauvegardeOuv] = useState(false);
  const [prochainOrdreVal, setProchainOrdreVal] = useState(1);
  // Modal ajout joueur
  const [modalJoueur, setModalJoueur] = useState<{equipe:'nous'|'eux'}|null>(null);
  const [numInput, setNumInput] = useState('');

  const dragRef = useRef<string|null>(null);
  const dragBallonRef = useRef(false);
  const offsetRef = useRef({x:0,y:0});
  const debutRef = useRef<{x:number,y:number,cibleId?:string,estBallon?:boolean}|null>(null);
  const joueursRef = useRef(joueurs);
  const flechesRef = useRef(fleches);
  const ballonRef = useRef(ballon);
  const outilRef = useRef(outil);

  useEffect(()=>{joueursRef.current=joueurs},[joueurs]);
  useEffect(()=>{flechesRef.current=fleches},[fleches]);
  useEffect(()=>{ballonRef.current=ballon},[ballon]);
  useEffect(()=>{outilRef.current=outil},[outil]);

  const draw = useCallback((js:Joueur[],fs:Fleche[],bal:{x:number,y:number})=>{
    const c=canvas.current;if(!c)return;
    const ctx=c.getContext('2d');if(!ctx)return;
    dessinerTerrain(ctx);
    fs.forEach(f=>{
      ctx.strokeStyle=f.estBallon?'#ff9800':'#ffeb3b';
      ctx.lineWidth=2.5;ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
      const angle=Math.atan2(f.y2-f.y1,f.x2-f.x1);
      ctx.fillStyle=f.estBallon?'#ff9800':'#ffeb3b';
      ctx.beginPath();ctx.moveTo(f.x2,f.y2);
      ctx.lineTo(f.x2-12*Math.cos(angle-0.4),f.y2-12*Math.sin(angle-0.4));
      ctx.lineTo(f.x2-12*Math.cos(angle+0.4),f.y2-12*Math.sin(angle+0.4));
      ctx.closePath();ctx.fill();
      // Numéro d'ordre sur la flèche
      const mx=(f.x1*0.3+f.x2*0.7),my=(f.y1*0.3+f.y2*0.7);
      ctx.fillStyle='white';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.beginPath();ctx.arc(mx,my,8,0,Math.PI*2);
      ctx.fillStyle=f.estBallon?'#e67e22':'#b7950b';ctx.fill();
      ctx.fillStyle='white';ctx.fillText(String(f.ordre),mx,my);
    });
    js.forEach(j=>{
      ctx.beginPath();ctx.arc(j.x,j.y,13,0,Math.PI*2);
      ctx.fillStyle=j.equipe==='nous'?'#1a5276':'#e74c3c';
      ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='white';ctx.font='bold 10px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(j.numero),j.x,j.y);
    });
    ctx.save();ctx.translate(bal.x,bal.y);
    ctx.fillStyle='#c8860a';
    ctx.beginPath();ctx.ellipse(0,0,9,6,Math.PI/6,0,Math.PI*2);
    ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);
    ctx.strokeStyle='white';ctx.lineWidth=0.8;ctx.stroke();
    ctx.restore();
  },[]);

  useEffect(()=>{draw(joueurs,fleches,ballon);},[joueurs,fleches,ballon,draw]);

  const getPos=(cx:number,cy:number)=>{
    const r=canvas.current!.getBoundingClientRect();
    return {x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(H/r.height)};
  };
  const trouverJoueur=(x:number,y:number)=>joueursRef.current.find(j=>Math.hypot(j.x-x,j.y-y)<16)||null;
  const trouverFleche=(x:number,y:number)=>flechesRef.current.find(f=>{
    const len=Math.hypot(f.x2-f.x1,f.y2-f.y1);
    if(len<1)return false;
    const d=Math.abs((f.y2-f.y1)*x-(f.x2-f.x1)*y+f.x2*f.y1-f.y2*f.x1)/len;
    return d<14&&Math.hypot(x-f.x1,y-f.y1)+Math.hypot(x-f.x2,y-f.y2)<len+25;
  })||null;

  const handleStart=(x:number,y:number)=>{
    const o=outilRef.current;
    const j=trouverJoueur(x,y);
    const ballonProche=Math.hypot(x-ballonRef.current.x,y-ballonRef.current.y)<16;
    if(o==='deplacer'){
      if(j){dragRef.current=j.id;offsetRef.current={x:x-j.x,y:y-j.y};}
      else if(ballonProche){dragBallonRef.current=true;}
    } else if(o==='fleche'){
      // Chercher pointe de flèche proche
      const pointe=flechesRef.current.find(f=>Math.hypot(x-f.x2,y-f.y2)<18);
      if(pointe){debutRef.current={x:pointe.x2,y:pointe.y2,cibleId:pointe.cibleId,estBallon:pointe.estBallon};}
      else if(j){const fj=flechesRef.current.filter(f=>f.cibleId===j.id).sort((a,b)=>b.ordre-a.ordre);const last=fj[0];debutRef.current={x:last?last.x2:j.x,y:last?last.y2:j.y,cibleId:j.id};}
      else debutRef.current={x,y};
    } else if(o==='fleche_ballon'){
      const fb=flechesRef.current.filter(f=>f.estBallon).sort((a,b)=>b.ordre-a.ordre);const last=fb[0];
      debutRef.current={x:last?last.x2:ballonRef.current.x,y:last?last.y2:ballonRef.current.y,estBallon:true};
    } else if(o==='supprimer'){
      const f=trouverFleche(x,y);
      if(f)setFleches(fs=>fs.filter(ff=>ff.id!==f.id));
      else if(j)setJoueurs(js=>js.filter(jj=>jj.id!==j.id));
    }
  };

  const handleMove=(x:number,y:number)=>{
    if(dragRef.current){
      setJoueurs(js=>{const u=js.map(j=>j.id===dragRef.current?{...j,x:x-offsetRef.current.x,y:y-offsetRef.current.y}:j);joueursRef.current=u;draw(u,flechesRef.current,ballonRef.current);return u;});
    } else if(dragBallonRef.current){
      setBallon({x,y});ballonRef.current={x,y};draw(joueursRef.current,flechesRef.current,{x,y});
    }
  };

  const handleEnd=(x:number,y:number)=>{
    const o=outilRef.current;
    if((o==='fleche'||o==='fleche_ballon')&&debutRef.current){
      if(Math.hypot(x-debutRef.current.x,y-debutRef.current.y)>15){
        const nf:Fleche={id:Date.now().toString(),x1:debutRef.current.x,y1:debutRef.current.y,x2:x,y2:y,cibleId:debutRef.current.cibleId,estBallon:debutRef.current.estBallon,ordre:prochainOrdreVal};
        setFleches(fs=>{const u=[...fs,nf];flechesRef.current=u;draw(joueursRef.current,u,ballonRef.current);return u;});
      }
      debutRef.current=null;
    }
    dragRef.current=null;dragBallonRef.current=false;
  };

  const onTS=(e:React.TouchEvent)=>{e.preventDefault();const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleStart(p.x,p.y);};
  const onTM=(e:React.TouchEvent)=>{e.preventDefault();const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleMove(p.x,p.y);};
  const onTE=(e:React.TouchEvent)=>{e.preventDefault();const t=e.changedTouches[0];const p=getPos(t.clientX,t.clientY);handleEnd(p.x,p.y);};
  const onMD=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleStart(p.x,p.y);};
  const onMM=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleMove(p.x,p.y);};
  const onMU=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleEnd(p.x,p.y);};

  const animer=()=>{
    if(fleches.length===0||anime)return;
    setAnime(true);
    const flechesSnap=[...flechesRef.current];
    const maxOrdre=Math.max(...flechesSnap.map(f=>f.ordre));
    // Cacher flèches pendant animation
    draw(joueursRef.current,[],ballonRef.current);
    setFleches([]);
    // Sauvegarder positions initiales
    const joueursInitiaux=joueursRef.current.map(j=>({...j}));
    const ballonInitial={...ballonRef.current};
    let ordreActuel=1;
    let curJoueurs=joueursInitiaux.map(j=>({...j}));
    let curBal={...ballonInitial};
    const animeEtape=()=>{
      if(ordreActuel>maxOrdre){
        // Remettre joueurs et ballon à leur position initiale, remettre les flèches
        setJoueurs(joueursInitiaux);joueursRef.current=joueursInitiaux;
        setBallon(ballonInitial);ballonRef.current=ballonInitial;
        setFleches(flechesSnap);flechesRef.current=flechesSnap;
        draw(joueursInitiaux,flechesSnap,ballonInitial);
        // Flèches remises
        setAnime(false);return;
      }
      const fEtape=flechesSnap.filter(f=>f.ordre===ordreActuel);
      if(fEtape.length===0){ordreActuel++;animeEtape();return;}
      let step=0;const steps=40;
      const iv=setInterval(()=>{
        step++;const t=step/steps;
        const newJ=curJoueurs.map(j=>{
          const f=fEtape.find(f=>f.cibleId===j.id);
          if(f)return {...j,x:f.x1+(f.x2-f.x1)*t,y:f.y1+(f.y2-f.y1)*t};
          return j;
        });
        const fb=fEtape.find(f=>f.estBallon);
        const newBal=fb?{x:fb.x1+(fb.x2-fb.x1)*t,y:fb.y1+(fb.y2-fb.y1)*t}:curBal;
        setJoueurs(newJ);joueursRef.current=newJ;
        setBallon(newBal);ballonRef.current=newBal;
        draw(newJ,[],newBal);
        if(step>=steps){clearInterval(iv);curJoueurs=newJ;curBal=newBal;ordreActuel++;setTimeout(animeEtape,200);}
      },20);
    };
    animeEtape();
  };

  const ajouterJoueur=()=>{
    if(!modalJoueur||!numInput.trim())return;
    const num=parseInt(numInput);
    if(isNaN(num))return;
    const x=modalJoueur.equipe==='eux'?550:150;
    const y=100+(joueurs.filter(j=>j.equipe===modalJoueur.equipe).length*38)%400;
    setJoueurs(js=>[...js,{id:Date.now().toString(),x,y,numero:num,equipe:modalJoueur.equipe}]);
    setModalJoueur(null);setNumInput('');
  };

  const sauvegarderSchema=()=>{
    if(!nomNouv.trim())return;
    const s:Schema={id:Date.now().toString(),nom:nomNouv.trim(),joueurs:joueursRef.current.map(j=>({...j})),fleches:[...flechesRef.current],ballon:{...ballonRef.current}};
    const nouv=[...schemas,s];
    setSchemas(nouv);localStorage.setItem('rugby-schemas',JSON.stringify(nouv));
    setNomNouv('');setSauvegardeOuv(false);
  };

  const chargerSchema=(s:Schema)=>{
    setJoueurs(s.joueurs.map(j=>({...j})));
    setFleches(s.fleches.map(f=>({...f})));
    setBallon({...s.ballon});setVue('terrain');
  };

  const supprimerSchema=(id:string)=>{
    const nouv=schemas.filter(s=>s.id!==id);
    setSchemas(nouv);localStorage.setItem('rugby-schemas',JSON.stringify(nouv));
  };

  const btn=(c:string,actif=false)=>({backgroundColor:actif?'#f39c12':c,color:'white',border:actif?'2px solid white':'2px solid transparent',padding:'7px 10px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:11} as React.CSSProperties);

  if(vue==='liste')return(
    <div style={{fontFamily:'sans-serif',maxWidth:820,margin:'0 auto',padding:12,backgroundColor:'#1a1a1a',minHeight:'100vh'}}>
      <div style={{backgroundColor:'#1a5276',color:'white',padding:14,borderRadius:10,marginBottom:12,textAlign:'center'}}>
        <h2 style={{margin:0}}>📋 Mes schémas tactiques</h2>
      </div>
      <button style={{...btn('#555'),marginBottom:12}} onClick={()=>setVue('terrain')}>← Retour au terrain</button>
      {schemas.length===0&&<div style={{color:'#aaa',textAlign:'center',padding:40}}>Aucun schéma sauvegardé</div>}
      {schemas.map(s=>(
        <div key={s.id} style={{backgroundColor:'#3a3a3a',borderRadius:8,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'white',fontWeight:'bold'}}>{s.nom}</span>
          <div style={{display:'flex',gap:6}}>
            <button style={btn('#2ecc71')} onClick={()=>chargerSchema(s)}>📂 Charger</button>
            <button style={btn('#e74c3c')} onClick={()=>supprimerSchema(s.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );

  return(
    <div style={{fontFamily:'sans-serif',maxWidth:820,margin:'0 auto',padding:12,backgroundColor:'#1a1a1a',minHeight:'100vh'}}>
      <div style={{backgroundColor:'#1a5276',color:'white',padding:14,borderRadius:10,marginBottom:12,textAlign:'center'}}>
        <h2 style={{margin:0}}>🏟 Schéma tactique</h2>
      </div>

      {/* Modal ajout joueur */}
      {modalJoueur&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{backgroundColor:'#2a2a2a',borderRadius:12,padding:24,minWidth:280,textAlign:'center'}}>
            <h3 style={{color:'white',margin:'0 0 16px'}}>Numéro du joueur {modalJoueur.equipe==='eux'?'adversaire':'allié'}</h3>
            <input autoFocus value={numInput} onChange={e=>setNumInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&ajouterJoueur()}
              placeholder="Ex: 10" type="number" min="1" max="99"
              style={{width:'100%',padding:12,borderRadius:8,border:'none',fontSize:20,textAlign:'center',marginBottom:16,boxSizing:'border-box' as const}}/>
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button style={btn(modalJoueur.equipe==='eux'?'#e74c3c':'#1a5276')} onClick={ajouterJoueur}>✅ Ajouter</button>
              <button style={btn('#555')} onClick={()=>{setModalJoueur(null);setNumInput('');}}>✖ Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div style={{backgroundColor:'#2a2a2a',borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <button style={btn('#1a5276',outil==='deplacer')} onClick={()=>setOutil('deplacer')}>✋ Déplacer</button>
          <button style={btn('#f39c12',outil==='fleche')} onClick={()=>setOutil('fleche')}>🟡 Mouvement joueur</button>
          <button style={btn('#e67e22',outil==='fleche_ballon')} onClick={()=>setOutil('fleche_ballon')}>🏉 Mouvement ballon</button>
          <button style={btn('#e74c3c',outil==='supprimer')} onClick={()=>setOutil('supprimer')}>🗑 Supprimer</button>
          <button style={btn('#1a5276')} onClick={()=>setModalJoueur({equipe:'nous'})}>+ Joueur allié</button>
          <button style={btn('#c0392b')} onClick={()=>setModalJoueur({equipe:'eux'})}>+ Joueur adverse</button>
          <button style={btn('#27ae60')} onClick={()=>setFleches([])}>Effacer flèches</button>
          <button style={btn('#795548')} onClick={()=>{setJoueurs(JOUEURS_INIT.map(j=>({...j})));setFleches([]);setBallon({x:205,y:260});}}>🔄 Réinitialiser</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
          <span style={{color:'#aaa',fontSize:11}}>Ordre flèche :</span>
          {[1,2,3,4,5,6].map(n=>(
            <button key={n} style={btn(prochainOrdreVal===n?'#f39c12':'#444',prochainOrdreVal===n)} onClick={()=>setProchainOrdreVal(n)}>{n}</button>
          ))}
          <span style={{color:'#666',fontSize:10,marginLeft:4}}>| Les flèches du même numéro s'animent ensemble</span>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <button style={btn('#3498db')} onClick={animer} disabled={anime||fleches.length===0}>▶ Animer</button>
          <button style={btn('#8e44ad')} onClick={()=>setSauvegardeOuv(v=>!v)}>💾 Sauvegarder</button>
          <button style={btn('#16a085')} onClick={()=>setVue('liste')}>📋 Mes schémas ({schemas.length})</button>
          <button style={btn('#555')} onClick={onRetour}>← Retour</button>
        </div>
        {sauvegardeOuv&&(
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
            <input value={nomNouv} onChange={e=>setNomNouv(e.target.value)}
              placeholder="Nom du schéma (ex: Touche offensive 22m)"
              style={{flex:1,padding:8,borderRadius:8,border:'none',fontSize:13}}/>
            <button style={btn('#2ecc71')} onClick={sauvegarderSchema}>✅ OK</button>
            <button style={btn('#555')} onClick={()=>setSauvegardeOuv(false)}>✖</button>
          </div>
        )}
        <div style={{fontSize:11,color:'#aaa',marginBottom:6}}>
          🔵 Alliées &nbsp;|&nbsp; 🔴 Adversaires &nbsp;|&nbsp; 🏉 Ballon &nbsp;|&nbsp;
          Outil : <strong style={{color:'white'}}>{outil==='deplacer'?'Déplacer':outil==='fleche'?'Mouvement joueur':outil==='fleche_ballon'?'Mouvement ballon':'Supprimer'}</strong>
          &nbsp;| Ordre actuel : <strong style={{color:'#f39c12'}}>{prochainOrdreVal}</strong>
        </div>
        <canvas ref={canvas} width={W} height={H}
          style={{width:'100%',borderRadius:8,cursor:outil==='deplacer'?'grab':'crosshair',touchAction:'none',display:'block'}}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        />
      </div>
    </div>
  );
}
