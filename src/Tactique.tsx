import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { useCloud } from './useCloud';
import { useClub, texteSur, fondBande } from './club';
import { IC } from './icones';
import Curseurs from './Curseurs';
import { RAYON_POINTE, pointesLibres } from './fleches';
import React, { useRef, useState, useEffect, useCallback } from 'react';

type Joueur = { id: string; x: number; y: number; numero: number; equipe: 'nous' | 'eux' };
type Fleche = { id: string; x1: number; y1: number; x2: number; y2: number; cibleId?: string; estBallon?: boolean; ordre: number };
type Schema = { id: string; nom: string; joueurs: Joueur[]; fleches: Fleche[]; ballon: {x:number,y:number}; tailles?: {joueurs:number;ballon:number}; etapes?: Etape[] };
type Etape = { id: string; nom: string; joueurs: Joueur[]; ballon: {x:number,y:number}; fleches: Fleche[] };

type Snap = { joueurs: Joueur[]; ballon: {x:number,y:number}; fleches: Fleche[] };

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

const aSuite=(f:Fleche,fs:Fleche[])=>fs.some(g=>g.id!==f.id&&!!g.estBallon===!!f.estBallon&&Math.hypot(g.x1-f.x2,g.y1-f.y2)<2);

export default function Tactique({ onRetour }: { onRetour: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [joueurs, setJoueurs] = useState<Joueur[]>(JOUEURS_INIT.map(j=>({...j})));
  const [ballon, setBallon] = useState({x:205,y:260});
  const [fleches, setFleches] = useState<Fleche[]>([]);
  const [outil, setOutil] = useState<'deplacer'|'fleche'|'fleche_ballon'|'supprimer'>('deplacer');
  const [anime, setAnime] = useState(false);
  const [club]=useClub();
  const [tailles,setTailles]=useState({joueurs:1,ballon:1});
  const taillesRef=useRef(tailles);
  taillesRef.current=tailles;
  const [enreg,setEnreg]=useState(false);
  const [videoPrete,setVideoPrete]=useState<File|null>(null);
  const finAnimRef=useRef<(()=>void)|null>(null);
  const [schemas, setSchemas] = useCloud<Schema[]>('rugby-schemas', []);
  const [schemaCourantId,setSchemaCourantId]=useState<string|null>(null);
  const [etapes,setEtapes]=useState<Etape[]>([{id:'e1',nom:'Mise en place',joueurs:[],ballon:{x:205,y:260},fleches:[]}]);
  const [etapeIdx,setEtapeIdx]=useState(0);
  const etapesRef=useRef(etapes);
  const etapeIdxRef=useRef(0);
  const aDesFleches=etapes.some((e,i)=>(i===etapeIdx?fleches:e.fleches).length>0);
  const [vue, setVue] = useState<'terrain'|'liste'>('terrain');
  const [nomNouv, setNomNouv] = useState('');
  const [okMsg, setOkMsg] = useState(false);
  const [prochainOrdreVal, setProchainOrdreVal] = useState(1);
  // Modal ajout joueur
  const [modalJoueur, setModalJoueur] = useState<{equipe:'nous'|'eux'}|null>(null);
  const [numInput, setNumInput] = useState('');
  const [large,setLarge]=useState(typeof window!=='undefined'&&window.innerWidth>=900);
  useEffect(()=>{const f=()=>setLarge(window.innerWidth>=900);window.addEventListener('resize',f);return ()=>window.removeEventListener('resize',f);},[]);
  const [cam,setCam]=useState({z:1,x:0,y:0});
  const camRef=useRef(cam);
  const cadreRef=useRef<HTMLDivElement>(null);
  const gestRef=useRef<{d:number;cx:number;cy:number;z:number;x:number;y:number}|null>(null);
  const [vitesse,setVitesse]=useState(1);
  const vitesseRef=useRef(1);
  vitesseRef.current=vitesse;
  const histRef=useRef<Snap[]>([]);
  const futurRef=useRef<Snap[]>([]);
  const aBougeRef=useRef(false);
  const [nbHist,setNbHist]=useState({h:0,f:0});

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
    fs.forEach(f=>{ctx.globalAlpha=aSuite(f,fs)?0.3:1;
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
    ctx.globalAlpha=1;js.forEach(j=>{
      ctx.beginPath();ctx.arc(j.x,j.y,13*taillesRef.current.joueurs,0,Math.PI*2);
      ctx.fillStyle=j.equipe==='nous'?'#1a5276':'#e74c3c';
      ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='white';ctx.font='bold '+Math.round(10*taillesRef.current.joueurs)+'px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(j.numero),j.x,j.y);
    });
    ctx.save();ctx.translate(bal.x,bal.y);ctx.scale(taillesRef.current.ballon,taillesRef.current.ballon);
    ctx.fillStyle='#c8860a';
    ctx.beginPath();ctx.ellipse(0,0,9,6,Math.PI/6,0,Math.PI*2);
    ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);
    ctx.strokeStyle='white';ctx.lineWidth=0.8;ctx.stroke();
    ctx.restore();pointesLibres(ctx,fs,outilRef.current,(f:Fleche)=>!!f.estBallon);
  },[]);

  useEffect(()=>{outilRef.current=outil;draw(joueurs,fleches,ballon);},[joueurs,fleches,ballon,draw,tailles,outil]);

  const getPos=(cx:number,cy:number)=>{
    const r=canvas.current!.getBoundingClientRect();
    return {x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(H/r.height)};
  };
  const trouverJoueur=(x:number,y:number)=>joueursRef.current.find(j=>Math.hypot(j.x-x,j.y-y)<Math.max(16,13*taillesRef.current.joueurs+4))||null;
  const trouverFleche=(x:number,y:number)=>flechesRef.current.find(f=>{
    const len=Math.hypot(f.x2-f.x1,f.y2-f.y1);
    if(len<1)return false;
    const d=Math.abs((f.y2-f.y1)*x-(f.x2-f.x1)*y+f.x2*f.y1-f.y2*f.x1)/len;
    return d<14&&Math.hypot(x-f.x1,y-f.y1)+Math.hypot(x-f.x2,y-f.y2)<len+25;
  })||null;

  const handleStart=(x:number,y:number)=>{
    const o=outilRef.current;
    const j=trouverJoueur(x,y);
    const ballonProche=Math.hypot(x-ballonRef.current.x,y-ballonRef.current.y)<Math.max(16,9*taillesRef.current.ballon+6);
    if(o==='deplacer'){
      if(j){pousserHist();aBougeRef.current=false;dragRef.current=j.id;offsetRef.current={x:x-j.x,y:y-j.y};}
      else if(ballonProche){pousserHist();aBougeRef.current=false;dragBallonRef.current=true;}
    } else if(o==='fleche'){
      // Chercher pointe de flèche proche
      const pointe=flechesRef.current.filter(f=>!f.estBallon&&!aSuite(f,flechesRef.current)&&Math.hypot(x-f.x2,y-f.y2)<RAYON_POINTE).sort((a,b)=>Math.hypot(x-a.x2,y-a.y2)-Math.hypot(x-b.x2,y-b.y2))[0];
      if(pointe){debutRef.current={x:pointe.x2,y:pointe.y2,cibleId:pointe.cibleId,estBallon:pointe.estBallon};}
      else if(j){const fj=flechesRef.current.filter(f=>!f.estBallon&&f.cibleId===j.id&&!aSuite(f,flechesRef.current)).sort((a,b)=>b.ordre-a.ordre);const last=fj[0];debutRef.current={x:last?last.x2:j.x,y:last?last.y2:j.y,cibleId:j.id};}
      else debutRef.current={x,y};
    } else if(o==='fleche_ballon'){
      const fb=flechesRef.current.filter(f=>f.estBallon&&!aSuite(f,flechesRef.current)).sort((a,b)=>b.ordre-a.ordre);const last=fb[0];
      debutRef.current={x:last?last.x2:ballonRef.current.x,y:last?last.y2:ballonRef.current.y,estBallon:true};
    } else if(o==='supprimer'){
      const f=trouverFleche(x,y);
      if(f){pousserHist();setFleches(fs=>{const u=fs.filter(ff=>ff.id!==f.id);flechesRef.current=u;return u;});}
      else if(j){pousserHist();setJoueurs(js=>{const u=js.filter(jj=>jj.id!==j.id);joueursRef.current=u;return u;});}
    }
  };

  const handleMove=(x:number,y:number)=>{
    if(dragRef.current||dragBallonRef.current)aBougeRef.current=true;
    if(dragRef.current){
      setJoueurs(js=>{const u=js.map(j=>j.id===dragRef.current?{...j,x:x-offsetRef.current.x,y:y-offsetRef.current.y}:j);joueursRef.current=u;draw(u,flechesRef.current,ballonRef.current);return u;});
    } else if(dragBallonRef.current){
      setBallon({x,y});ballonRef.current={x,y};draw(joueursRef.current,flechesRef.current,{x,y});
    }
  };

  const handleEnd=(x:number,y:number)=>{
    const o=outilRef.current;
    if((dragRef.current||dragBallonRef.current)&&!aBougeRef.current){histRef.current=histRef.current.slice(0,-1);setNbHist({h:histRef.current.length,f:futurRef.current.length});}
    if((o==='fleche'||o==='fleche_ballon')&&debutRef.current){
      if(Math.hypot(x-debutRef.current.x,y-debutRef.current.y)>15){
        const nf:Fleche={id:Date.now().toString(),x1:debutRef.current.x,y1:debutRef.current.y,x2:x,y2:y,cibleId:debutRef.current.cibleId,estBallon:debutRef.current.estBallon,ordre:prochainOrdreVal};
        pousserHist();setFleches(fs=>{const u=[...fs,nf];flechesRef.current=u;draw(joueursRef.current,u,ballonRef.current);return u;});
      }
      debutRef.current=null;
    }
    dragRef.current=null;dragBallonRef.current=false;
  };

  const onTS=(e:React.TouchEvent)=>{
    e.preventDefault();
    if(e.touches.length>=2){
      if((dragRef.current||dragBallonRef.current)&&!aBougeRef.current){histRef.current=histRef.current.slice(0,-1);setNbHist({h:histRef.current.length,f:futurRef.current.length});}
      dragRef.current=null;dragBallonRef.current=false;debutRef.current=null;
      const a=e.touches[0],b=e.touches[1];
      const r=cadreRef.current!.getBoundingClientRect();
      gestRef.current={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,cx:(a.clientX+b.clientX)/2-r.left,cy:(a.clientY+b.clientY)/2-r.top,z:camRef.current.z,x:camRef.current.x,y:camRef.current.y};
      return;
    }
    const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleStart(p.x,p.y);
  };
  const onTM=(e:React.TouchEvent)=>{
    e.preventDefault();
    if(gestRef.current){
      if(e.touches.length>=2){
        const g=gestRef.current;
        const a=e.touches[0],b=e.touches[1];
        const r=cadreRef.current!.getBoundingClientRect();
        const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1;
        const cx=(a.clientX+b.clientX)/2-r.left,cy=(a.clientY+b.clientY)/2-r.top;
        const z=Math.min(4,Math.max(1,g.z*d/g.d));
        const k=z/g.z;
        poserCam(borner(z,cx-(g.cx-g.x)*k,cy-(g.cy-g.y)*k));
      }
      return;
    }
    const t=e.touches[0];const p=getPos(t.clientX,t.clientY);handleMove(p.x,p.y);
  };
  const onTE=(e:React.TouchEvent)=>{
    e.preventDefault();
    if(gestRef.current){if(e.touches.length<2)gestRef.current=null;return;}
    const t=e.changedTouches[0];const p=getPos(t.clientX,t.clientY);handleEnd(p.x,p.y);
  };
  const onMD=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleStart(p.x,p.y);};
  const onMM=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleMove(p.x,p.y);};
  const onMU=(e:React.MouseEvent)=>{const p=getPos(e.clientX,e.clientY);handleEnd(p.x,p.y);};

  const partager=async()=>{
    const c=canvas.current;
    if(!c||anime||enreg||!aDesFleches)return;
    const W2=c.width-(c.width%2),H2=c.height-(c.height%2);
    const VE:any=(window as any).VideoEncoder;
    let cfg:any=null;
    if(VE){
      for(const codec of ['avc1.42001f','avc1.42002a','avc1.4d002a','avc1.640028']){
        const essai={codec,width:W2,height:H2,bitrate:3000000,framerate:30};
        try{const s=await VE.isConfigSupported(essai);if(s&&s.supported){cfg=essai;break;}}catch(err){/* suivant */}
      }
    }
    if(!cfg){alert("Ce navigateur ne sait pas créer une vidéo compatible WhatsApp");return;}
    const muxer=new Muxer({target:new ArrayBufferTarget(),video:{codec:'avc',width:W2,height:H2},fastStart:'in-memory',firstTimestampBehavior:'offset'});
    const enc=new VE({output:(chunk:any,meta:any)=>muxer.addVideoChunk(chunk,meta),error:(err:any)=>alert('Erreur vidéo : '+err.message)});
    enc.configure(cfg);
    const off=document.createElement('canvas');off.width=W2;off.height=H2;
    const octx=off.getContext('2d');
    if(!octx)return;
    let actif=true;
    let n=0;
    const t0=performance.now();
    let dernierTs=0;
    const boucle=()=>{
      if(!actif)return;
      octx.drawImage(c,0,0,W2,H2,0,0,W2,H2);
      const ts=Math.round((performance.now()-t0)*1000);
      const dur=n===0?16667:Math.max(1,ts-dernierTs);
      dernierTs=ts;
      const frame=new (window as any).VideoFrame(off,{timestamp:ts,duration:dur});
      enc.encode(frame,{keyFrame:n%30===0});
      frame.close();
      n++;
      requestAnimationFrame(boucle);
    };
    setEnreg(true);
    requestAnimationFrame(boucle);
    finAnimRef.current=()=>{setTimeout(async()=>{
      actif=false;
      try{
        await enc.flush();enc.close();muxer.finalize();
        const buf=(muxer.target as any).buffer;
        setVideoPrete(new File([buf],'tactique.mp4',{type:'video/mp4'}));
      }catch(err:any){alert('Erreur vidéo : '+err.message);}
      setEnreg(false);
    },800);};
    setTimeout(animer,300);
  };
  const envoyer=async()=>{
    const file=videoPrete;
    if(!file)return;
    const nav:any=navigator;
    try{
      if(nav.canShare&&nav.canShare({files:[file]})){await nav.share({files:[file],title:'Tactique'});setVideoPrete(null);return;}
    }catch(e:any){if(e&&e.name==='AbortError')return;}
    const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click();
    setVideoPrete(null);
  };
  const animer=()=>{
    if(anime)return;
    const maj=etapesSynchro();
    if(maj.every(e=>e.fleches.length===0))return;
    setAnime(true);
    const depart=etapeIdxRef.current;
    const ordreAvant=prochainOrdreVal;
    const PAUSE_ETAPE=0; // pause (en ms) entre deux étapes
    const finTout=()=>{
      chargerEtape(maj[depart]);
      setProchainOrdreVal(ordreAvant);
      setEtapeIdx(depart);
      draw(joueursRef.current,flechesRef.current,ballonRef.current);
      setAnime(false);
      if(finAnimRef.current){const fin=finAnimRef.current;finAnimRef.current=null;fin();}
    };
    const jouerEtape=(i:number)=>{
      if(i>=maj.length){finTout();return;}
      const e=maj[i];
      setEtapeIdx(i);
      let curJoueurs=e.joueurs.map(j=>({...j}));
      let curBal={...e.ballon};
      setJoueurs(curJoueurs);joueursRef.current=curJoueurs;
      setBallon(curBal);ballonRef.current=curBal;
      setFleches([]);flechesRef.current=[];
      draw(curJoueurs,[],curBal);
      const flechesSnap=e.fleches;
      const maxOrdre=flechesSnap.length?Math.max(...flechesSnap.map(f=>f.ordre)):0;
      const suivante=()=>{
        if(PAUSE_ETAPE>0)setTimeout(()=>jouerEtape(i+1),PAUSE_ETAPE);
        else jouerEtape(i+1);
      };
      if(maxOrdre===0){setTimeout(()=>jouerEtape(i+1),600);return;}
      let ordreActuel=1;
      const animeOrdre=()=>{
        if(ordreActuel>maxOrdre){suivante();return;}
        const fOrdre=flechesSnap.filter(f=>f.ordre===ordreActuel);
        if(fOrdre.length===0){ordreActuel++;animeOrdre();return;}
        let step=0;const steps=Math.max(6,Math.round(40/vitesseRef.current));
        const iv=setInterval(()=>{
          step++;const t=step/steps;
          const newJ=curJoueurs.map(j=>{
            const f=fOrdre.find(f=>f.cibleId===j.id);
            if(f)return {...j,x:f.x1+(f.x2-f.x1)*t,y:f.y1+(f.y2-f.y1)*t};
            return j;
          });
          const fb=fOrdre.find(f=>f.estBallon);
          const newBal=fb?{x:fb.x1+(fb.x2-fb.x1)*t,y:fb.y1+(fb.y2-fb.y1)*t}:curBal;
          setJoueurs(newJ);joueursRef.current=newJ;
          setBallon(newBal);ballonRef.current=newBal;
          draw(newJ,[],newBal);
          if(step>=steps){clearInterval(iv);curJoueurs=newJ;curBal=newBal;ordreActuel++;animeOrdre();}
        },20);
      };
      animeOrdre();
    };
    jouerEtape(0);
  };

  const ajouterJoueur=()=>{
    if(!modalJoueur||!numInput.trim())return;
    const num=parseInt(numInput);
    if(isNaN(num))return;
    const x=modalJoueur.equipe==='eux'?550:150;
    const y=100+(joueurs.filter(j=>j.equipe===modalJoueur.equipe).length*38)%400;
    pousserHist();
    setJoueurs(js=>[...js,{id:Date.now().toString(),x,y,numero:num,equipe:modalJoueur.equipe}]);
    setModalJoueur(null);setNumInput('');
  };

  const instantane=():Snap=>({joueurs:joueursRef.current.map(j=>({...j})),ballon:{...ballonRef.current},fleches:flechesRef.current.map(f=>({...f}))});
  const pousserHist=()=>{histRef.current=[...histRef.current.slice(-49),instantane()];futurRef.current=[];setNbHist({h:histRef.current.length,f:0});};
  const viderHist=()=>{histRef.current=[];futurRef.current=[];setNbHist({h:0,f:0});};
  const appliquerSnap=(s:Snap)=>{
    setJoueurs(s.joueurs);joueursRef.current=s.joueurs;
    setFleches(s.fleches);flechesRef.current=s.fleches;
    setBallon(s.ballon);ballonRef.current=s.ballon;
  };
  const annuler=()=>{
    if(anime||enreg||histRef.current.length===0)return;
    const h=[...histRef.current];const s=h.pop() as Snap;
    futurRef.current=[...futurRef.current,instantane()];
    histRef.current=h;appliquerSnap(s);
    setNbHist({h:h.length,f:futurRef.current.length});
  };
  const retablir=()=>{
    if(anime||enreg||futurRef.current.length===0)return;
    const f=[...futurRef.current];const s=f.pop() as Snap;
    histRef.current=[...histRef.current,instantane()];
    futurRef.current=f;appliquerSnap(s);
    setNbHist({h:histRef.current.length,f:f.length});
  };
  const choisirOutil=(o:'deplacer'|'fleche'|'fleche_ballon'|'supprimer')=>{outilRef.current=o;setOutil(o);};
  const effacerFleches=()=>{pousserHist();setFleches([]);flechesRef.current=[];};
  const reinitialiser=()=>{
    pousserHist();
    const js=JOUEURS_INIT.map(j=>({...j}));
    setJoueurs(js);joueursRef.current=js;
    setFleches([]);flechesRef.current=[];
    const b={x:205,y:260};setBallon(b);ballonRef.current=b;
  };
  const poserCam=(c:{z:number;x:number;y:number})=>{camRef.current=c;setCam(c);};
  const borner=(z:number,x:number,y:number)=>{
    const r=cadreRef.current?cadreRef.current.getBoundingClientRect():null;
    const cw=r?r.width:W,ch=r?r.height:H;
    const zz=Math.min(4,Math.max(1,z));
    return {z:zz,x:Math.min(0,Math.max(cw*(1-zz),x)),y:Math.min(0,Math.max(ch*(1-zz),y))};
  };
  const zoomer=(f:number)=>{
    const el=cadreRef.current;if(!el)return;
    const b=el.getBoundingClientRect();
    const c0=camRef.current;
    const z=Math.min(4,Math.max(1,c0.z*f));
    const cx=b.width/2,cy=b.height/2;
    poserCam(borner(z,cx-(cx-c0.x)*(z/c0.z),cy-(cy-c0.y)*(z/c0.z)));
  };
  const nouvelleTactique=()=>{
    if(anime||enreg)return;
    if(!window.confirm('Commencer une nouvelle tactique ? Les modifications non enregistrées seront perdues.'))return;
    const liste:Etape[]=[{id:'e1',nom:'Mise en place',joueurs:JOUEURS_INIT.map(j=>({...j})),ballon:{x:205,y:260},fleches:[]}];
    setEtapes(liste);etapesRef.current=liste;
    setEtapeIdx(0);etapeIdxRef.current=0;
    chargerEtape(liste[0]);
    setSchemaCourantId(null);setNomNouv('');viderHist();
    poserCam({z:1,x:0,y:0});
  };

  const etapesSynchro=():Etape[]=>etapesRef.current.map((e,i)=>i===etapeIdxRef.current?{...e,joueurs:joueursRef.current.map(j=>({...j})),ballon:{...ballonRef.current},fleches:flechesRef.current.map(f=>({...f}))}:e);

  const finDe=(fs:Fleche[],test:(f:Fleche)=>boolean)=>{
    const c=fs.filter(test);
    const libres=c.filter(f=>!aSuite(f,fs));
    return (libres.length?libres:c).sort((a,b)=>b.ordre-a.ordre)[0];
  };

  const positionsFin=(e:Etape)=>{
    const js=e.joueurs.map(j=>{
      const f=finDe(e.fleches,g=>!g.estBallon&&g.cibleId===j.id);
      return f?{...j,x:f.x2,y:f.y2}:{...j};
    });
    const fb=finDe(e.fleches,g=>!!g.estBallon);
    return {joueurs:js,ballon:fb?{x:fb.x2,y:fb.y2}:{...e.ballon}};
  };

  const chargerEtape=(e:Etape)=>{
    const js=e.joueurs.map(j=>({...j}));
    const fs=e.fleches.map(f=>({...f}));
    const b={...e.ballon};
    setJoueurs(js);joueursRef.current=js;
    setFleches(fs);flechesRef.current=fs;
    setBallon(b);ballonRef.current=b;
    setProchainOrdreVal(1);
  };

  const allerEtape=(i:number)=>{
    if(i===etapeIdxRef.current||anime||enreg)return;
    const maj=etapesSynchro();
    setEtapes(maj);etapesRef.current=maj;
    setEtapeIdx(i);etapeIdxRef.current=i;
    chargerEtape(maj[i]);viderHist();
  };

  const ajouterEtape=()=>{
    if(anime||enreg)return;
    const maj=etapesSynchro();
    const fin=positionsFin(maj[maj.length-1]);
    const n:Etape={id:Date.now().toString(),nom:'Étape '+(maj.length+1),joueurs:fin.joueurs,ballon:fin.ballon,fleches:[]};
    const liste=[...maj,n];
    setEtapes(liste);etapesRef.current=liste;
    setEtapeIdx(liste.length-1);etapeIdxRef.current=liste.length-1;
    chargerEtape(n);viderHist();
  };

  const supprimerEtape=()=>{
    if(etapesRef.current.length<2||anime||enreg)return;
    if(!window.confirm('Supprimer cette étape ?'))return;
    const maj=etapesSynchro();
    const i=etapeIdxRef.current;
    const liste=maj.filter((_,k)=>k!==i);
    const j=Math.min(i,liste.length-1);
    setEtapes(liste);etapesRef.current=liste;
    setEtapeIdx(j);etapeIdxRef.current=j;
    chargerEtape(liste[j]);viderHist();
  };

  const renommerEtape=()=>{
    const nom=window.prompt('Nom de cette étape',etapesRef.current[etapeIdxRef.current].nom);
    if(!nom||!nom.trim())return;
    const maj=etapesSynchro().map((e,k)=>k===etapeIdxRef.current?{...e,nom:nom.trim()}:e);
    setEtapes(maj);etapesRef.current=maj;
  };

  const sauvegarderSchema=()=>{
    if(!nomNouv.trim()){alert('Donne un nom à la tactique avant de l\'enregistrer');return;}
    const maj=etapesSynchro();
    const s:Schema=JSON.parse(JSON.stringify({id:schemaCourantId||Date.now().toString(),nom:nomNouv.trim(),joueurs:maj[0].joueurs,fleches:maj[0].fleches,ballon:maj[0].ballon,tailles:{...taillesRef.current},etapes:maj}));
    const nouv=schemas.some(x=>x.id===s.id)?schemas.map(x=>x.id===s.id?s:x):[...schemas,s];
    setSchemaCourantId(s.id);
    setSchemas(nouv);
    setOkMsg(true);setTimeout(()=>setOkMsg(false),2000);
  };

  const chargerSchema=(s:Schema)=>{
    setJoueurs(s.joueurs.map(j=>({...j})));
    setFleches(s.fleches.map(f=>({...f})));
    setBallon({...s.ballon});setTailles(s.tailles?{...s.tailles}:{joueurs:1,ballon:1});setSchemaCourantId(s.id);setNomNouv(s.nom);
    {
      const liste:Etape[]=s.etapes&&s.etapes.length?s.etapes:[{id:'e1',nom:'Mise en place',joueurs:s.joueurs,ballon:s.ballon,fleches:s.fleches}];
      setEtapes(liste);etapesRef.current=liste;
      setEtapeIdx(0);etapeIdxRef.current=0;
      chargerEtape(liste[0]);viderHist();
    }
    setVue('terrain');
  };

  const supprimerSchema=(id:string)=>{
    const nouv=schemas.filter(s=>s.id!==id);
    setSchemas(nouv);
  };

  const btn=(c:string,actif=false)=>{
    const base:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,minHeight:44,padding:'0 14px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:14,border:'1px solid #d9e0dc',backgroundColor:'#ffffff',color:'#14211c'};
    if(c==='#25d366')return {...base,backgroundColor:'#25d366',borderColor:'#25d366',color:'#073b1d'};
    if(c==='#e74c3c'||c==='#c0392b')return actif?{...base,backgroundColor:'#b3261e',borderColor:'#b3261e',color:'#ffffff'}:{...base,color:'#b3261e',borderColor:'#e8b4b0'};
    if(c==='#3498db'||c==='#8e44ad'||c==='#2ecc71')return {...base,backgroundColor:club.couleur2,borderColor:club.couleur2,color:texteSur(club.couleur2)};
    if(actif)return {...base,backgroundColor:club.couleur,borderColor:club.couleur,color:texteSur(club.couleur)};
    return base;
  };

  if(vue==='liste')return(
    <div style={{fontFamily:'sans-serif',maxWidth:820,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={{background:fondBande(club),color:texteSur(club.couleur),padding:'16px 18px',borderRadius:16,marginBottom:12,textAlign:'left'}}>
        <h2 style={{margin:0,fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",fontWeight:700,fontSize:28}}>Mes schémas tactiques</h2>
      </div>
      <button style={{...btn('#555'),marginBottom:12}} onClick={()=>setVue('terrain')}>{IC.retour}Retour au terrain</button>
      {schemas.length===0&&<div style={{color:'#5b6b64',textAlign:'center',padding:40}}>Aucun schéma sauvegardé</div>}
      {schemas.map(s=>(
        <div key={s.id} style={{backgroundColor:'#ffffff',border:'1px solid #dde4ea',borderRadius:12,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#14211c',fontWeight:'bold'}}>{s.nom}</span>
          <div style={{display:'flex',gap:6}}>
            <button style={btn('#2ecc71')} onClick={()=>chargerSchema(s)}>{IC.dossier}Charger</button>
            <button style={btn('#e74c3c')} onClick={()=>supprimerSchema(s.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );

  const panneau:React.CSSProperties={backgroundColor:'#ffffff',border:'1px solid #dde4ea',borderRadius:16,padding:10,boxSizing:'border-box'};
  const titrePanneau:React.CSSProperties={fontWeight:700,fontSize:13,color:'#14211c',marginBottom:8};
  const lg=(extra:React.CSSProperties={}):React.CSSProperties=>large?{width:'100%',justifyContent:'flex-start',...extra}:extra;
  const grise=(d:boolean):React.CSSProperties=>d?{opacity:0.45,cursor:'not-allowed'}:{};
  const sep:React.CSSProperties={marginTop:10,paddingTop:10,borderTop:'1px solid #e5eaee'};

  return(
    <div style={{fontFamily:'sans-serif',maxWidth:large?1400:820,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh',boxSizing:'border-box'}}>
      <div style={{background:fondBande(club),color:texteSur(club.couleur),padding:'10px 14px',borderRadius:16,marginBottom:12,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <button style={{...btn('#555'),minHeight:40}} onClick={onRetour}>{IC.retour}Retour</button>
        <h2 style={{margin:0,fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",fontWeight:700,fontSize:large?26:22,flex:large?'0 0 auto':'1 1 100%'}}>Simulateur tactique</h2>
        <input value={nomNouv} onChange={e=>setNomNouv(e.target.value)} placeholder="Ma combinaison"
          style={{flex:'1 1 160px',minWidth:140,padding:'0 12px',minHeight:40,borderRadius:10,border:'1px solid #d9e0dc',fontSize:15,boxSizing:'border-box'}}/>
        <button style={{...btn('#8e44ad'),minHeight:40}} onClick={sauvegarderSchema}>{IC.sauver}Enregistrer</button>
        {okMsg&&<span style={{fontSize:13,fontWeight:700}}>✔ Enregistré</span>}
        <button style={{...btn('#16a085'),minHeight:40}} onClick={()=>setVue('liste')}>{IC.liste}Mes schémas ({schemas.length})</button>
        <button style={{...btn('#555'),minHeight:40}} onClick={nouvelleTactique}>+ Nouvelle</button>
      </div>

      {/* Modal ajout joueur */}
      {modalJoueur&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{backgroundColor:'#ffffff',borderRadius:16,padding:24,minWidth:280,textAlign:'center'}}>
            <h3 style={{color:'#14211c',margin:'0 0 16px'}}>Numéro du joueur {modalJoueur.equipe==='eux'?'adversaire':'allié'}</h3>
            <input autoFocus value={numInput} onChange={e=>setNumInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&ajouterJoueur()}
              placeholder="Ex: 10" type="number" min="1" max="99"
              style={{width:'100%',padding:12,borderRadius:8,border:'1px solid #d9e0dc',fontSize:20,textAlign:'center',marginBottom:16,boxSizing:'border-box' as const}}/>
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button style={btn(modalJoueur.equipe==='eux'?'#e74c3c':'#1a5276')} onClick={ajouterJoueur}>{IC.ok}Ajouter</button>
              <button style={btn('#555')} onClick={()=>{setModalJoueur(null);setNumInput('');}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:'flex',flexDirection:large?'row':'column',gap:12,alignItems:large?'flex-start':'stretch'}}>

        {/* Outils */}
        <div style={{...panneau,order:large?1:2,flex:large?'0 0 200px':'none',width:large?200:'auto'}}>
          <div style={{display:'flex',flexDirection:large?'column':'row',flexWrap:'wrap',gap:6}}>
            <button style={{...btn('#1a5276',outil==='deplacer'),...lg()}} onClick={()=>choisirOutil('deplacer')}>{IC.deplacer}Déplacer</button>
            <button style={{...btn('#f39c12',outil==='fleche'),...lg()}} onClick={()=>choisirOutil('fleche')}>{IC.fleche}Mouvement joueur</button>
            <button style={{...btn('#e67e22',outil==='fleche_ballon'),...lg()}} onClick={()=>choisirOutil('fleche_ballon')}>{IC.ballon}Mouvement ballon</button>
            <button style={{...btn('#e74c3c',outil==='supprimer'),...lg()}} onClick={()=>choisirOutil('supprimer')}>{IC.supprimer}Supprimer</button>
            <button style={{...btn('#1a5276'),...lg()}} onClick={()=>setModalJoueur({equipe:'nous'})}>{IC.plus}Joueur allié</button>
            <button style={{...btn('#c0392b'),...lg()}} onClick={()=>setModalJoueur({equipe:'eux'})}>{IC.plus}Joueur adverse</button>
            <button style={{...btn('#27ae60'),...lg()}} onClick={effacerFleches}>{IC.effacer}Effacer les flèches</button>
            <button style={{...btn('#795548'),...lg()}} onClick={reinitialiser}>{IC.reset}Réinitialiser</button>
          </div>
          <div style={sep}>
            <div style={titrePanneau}>Ordre de la flèche</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button style={{...btn('#555'),minHeight:40,padding:'0 14px'}} onClick={()=>setProchainOrdreVal(n=>Math.max(1,n-1))}>−</button>
              <span style={{color:club.couleur,fontSize:20,fontWeight:'bold',minWidth:28,textAlign:'center'}}>{prochainOrdreVal}</span>
              <button style={{...btn('#f39c12'),minHeight:40,padding:'0 14px'}} onClick={()=>setProchainOrdreVal(n=>n+1)}>+</button>
            </div>
            <div style={{fontSize:12,color:'#5b6b64',marginTop:6}}>Les flèches du même numéro s'animent ensemble</div>
          </div>
          <div style={sep}>
            <div style={titrePanneau}>Taille des éléments</div>
            <Curseurs reglages={[{id:'joueurs',label:'Joueurs',valeur:tailles.joueurs},{id:'ballon',label:'Ballon',valeur:tailles.ballon}]} onChange={(id,v)=>setTailles(t=>({...t,[id]:v}))} onReset={()=>setTailles({joueurs:1,ballon:1})}/>
          </div>
        </div>

        {/* Terrain */}
        <div style={{flex:1,minWidth:0,width:'100%',order:large?2:3}}>
          <div style={{...panneau,padding:8}}>
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
              <button style={{...btn('#555'),minHeight:38,padding:'0 14px'}} onClick={()=>zoomer(1/1.4)}>−</button>
              <span style={{fontSize:13,color:'#5b6b64',minWidth:44,textAlign:'center'}}>{Math.round(cam.z*100)}%</span>
              <button style={{...btn('#555'),minHeight:38,padding:'0 14px'}} onClick={()=>zoomer(1.4)}>+</button>
              <button style={{...btn('#555'),minHeight:38}} onClick={()=>poserCam({z:1,x:0,y:0})}>Ajuster</button>
              <span style={{flex:1}}/>
              <button style={{...btn('#555'),minHeight:38,...grise(nbHist.h===0||anime||enreg)}} onClick={annuler} disabled={nbHist.h===0||anime||enreg}>↶ Annuler</button>
              <button style={{...btn('#555'),minHeight:38,...grise(nbHist.f===0||anime||enreg)}} onClick={retablir} disabled={nbHist.f===0||anime||enreg}>↷ Rétablir</button>
            </div>
            <div ref={cadreRef} style={{overflow:'hidden',borderRadius:12,touchAction:'none',position:'relative'}}>
              <div style={{transform:'translate('+cam.x+'px,'+cam.y+'px) scale('+cam.z+')',transformOrigin:'0 0'}}>
                <canvas ref={canvas} width={W} height={H}
                  style={{width:'100%',borderRadius:12,cursor:outil==='deplacer'?'grab':'crosshair',touchAction:'none',display:'block'}}
                  onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU}
                  onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
                />
              </div>
            </div>
            <div style={{fontSize:12,color:'#5b6b64',marginTop:6}}>
              Outil : <strong style={{color:'#14211c'}}>{outil==='deplacer'?'Déplacer':outil==='fleche'?'Mouvement joueur':outil==='fleche_ballon'?'Mouvement ballon':'Supprimer'}</strong>
              &nbsp;· Pince avec deux doigts pour zoomer et déplacer le terrain
            </div>
          </div>

          <div style={{...panneau,marginTop:12,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <button style={{...btn('#3498db'),minHeight:52,padding:'0 30px',fontSize:17,...grise(anime||!aDesFleches)}} onClick={animer} disabled={anime||!aDesFleches}>{IC.play}Animer</button>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:'1 1 200px'}}>
              <span style={{fontSize:14,color:'#5b6b64'}}>Vitesse :</span>
              <input type="range" min={0.5} max={3} step={0.25} value={vitesse} onChange={e=>setVitesse(parseFloat(e.target.value))} style={{flex:1,minWidth:80}}/>
              <span style={{fontWeight:700,fontSize:14,color:'#14211c',minWidth:36}}>x{vitesse}</span>
            </div>
            {videoPrete
              ? <button style={{...btn('#25d366'),minHeight:48}} onClick={envoyer}>{IC.partager}Envoyer la vidéo</button>
              : <button style={{...btn('#25d366'),minHeight:48,...grise(anime||enreg||!aDesFleches)}} onClick={partager} disabled={anime||enreg||!aDesFleches}>{enreg?'Enregistrement…':<>{IC.partager}Exporter la vidéo</>}</button>}
          </div>
        </div>

        {/* Étapes */}
        <div style={{...panneau,order:large?3:1,flex:large?'0 0 220px':'none',width:large?220:'auto'}}>
          <div style={titrePanneau}>Étapes de la combinaison</div>
          <div style={{display:'flex',flexDirection:large?'column':'row',gap:6,overflowX:large?'visible':'auto',overflowY:large?'auto':'visible',maxHeight:large?'48vh':undefined,paddingBottom:4}}>
            {etapes.map((e,i)=>(
              <button key={e.id} style={{...btn('#555',i===etapeIdx),...lg({minHeight:44}),whiteSpace:'nowrap'}} onClick={()=>allerEtape(i)}>
                <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,borderRadius:12,backgroundColor:'rgba(0,0,0,0.15)',fontSize:13,flexShrink:0}}>{i+1}</span>
                {e.nom}
              </button>
            ))}
          </div>
          <button style={{...btn('#2ecc71'),...lg(),marginTop:8,whiteSpace:'nowrap'}} onClick={ajouterEtape}>+ Ajouter une étape</button>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button style={{...btn('#555'),minHeight:38,fontSize:12,flex:1}} onClick={renommerEtape}>Renommer</button>
            <button style={{...btn('#e74c3c'),minHeight:38,fontSize:12,flex:1}} onClick={supprimerEtape}>Supprimer</button>
          </div>
        </div>

      </div>
    </div>
  );
}
