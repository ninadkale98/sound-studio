const fs=require('fs');
const SR=44100, DUR=22, N=SR*DUR;
const L=new Float32Array(N), R=new Float32Array(N), RV=new Float32Array(N); // RV = reverb send (mono)
let seed=7; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296*2-1;};
const mtof=m=>440*Math.pow(2,(m-69)/12);
const BEAT=0.5, BAR=2;
// A minor: Am7, Fmaj7, Cmaj7, G6
const CH=[[57,60,64,67],[53,57,60,64],[48,55,59,64],[55,59,62,64]];
const chordAt=t=>CH[Math.floor(t/BAR)%4];
function add(i,v,pan=0,send=0){ if(i<0||i>=N)return; L[i]+=v*(1-pan)*0.5*2*0.5+v*0.5*(1-pan); R[i]+=v*0.5*(1+pan)+0*0; RV[i]+=v*send; }
function addS(i,v,pan,send){ if(i<0||i>=N)return; const g=Math.min(1,1-pan), h=Math.min(1,1+pan); L[i]+=v*g; R[i]+=v*h; RV[i]+=v*send; }

// ---- PAD (saws, time-varying lowpass)
const pad=new Float32Array(N); const ph={};
for(let i=0;i<N;i++){ const t=i/SR; const bi=Math.floor(t/BAR); const into=t-bi*BAR;
  let v=0; const cur=CH[bi%4], prev=CH[(bi+3)%4]; const x=Math.min(1,into/0.35);
  const voices=(c,g)=>{ for(const m of c){ for(const d of [-0.08,0,0.07]){ const k=m+'_'+d; const f=mtof(m-12+d*0.1)*(1+d*0.004); ph[k]=((ph[k]||0)+f/SR)%1; v+=g*(2*ph[k]-1);} } };
  voices(cur,bi===0&&into<0.35?1:x); if(bi>0&&x<1) voices(prev,1-x);
  pad[i]=v/12; }
// lowpass with cutoff automation
let a1=0,a2=0;
for(let i=0;i<N;i++){ const t=i/SR;
  let fc = t<3 ? 500 + 300*(t/3) : t<18.5 ? 1500 + 500*Math.sin(t*0.6) : 1100 - 400*Math.min(1,(t-18.5)/3.5);
  const a=1-Math.exp(-2*Math.PI*fc/SR); a1+=a*(pad[i]-a1); a2+=a*(a1-a2);
  const env = Math.min(1,t/1.2) * (t>21?Math.max(0,(22-t)/1):1);
  const vol = t<3?0.22: t<18.5?0.16:0.2;
  addS(i,a2*vol*env, Math.sin(t*0.9)*0.3, 0.25); }

// ---- helpers
function tone(t0,f,dur,vol,{type='sine',decay=0.3,pan=0,send=0.3,attack=0.003,harm=0}={}){ const s=Math.floor(t0*SR), n=Math.floor(dur*SR); let p=0;
  for(let j=0;j<n;j++){ const tt=j/SR; const e=Math.min(1,tt/attack)*Math.exp(-tt/decay); p+=f/SR;
    let w=Math.sin(2*Math.PI*p); if(harm) w+=harm*Math.sin(4*Math.PI*p)+harm*0.4*Math.sin(6*Math.PI*p);
    addS(s+j,w*e*vol,pan,send);} }
function noise(t0,dur,vol,{hp=0,lp=20000,decay=0.05,attack=0.001,pan=0,send=0.2,sweep=null}={}){ const s=Math.floor(t0*SR), n=Math.floor(dur*SR); let l=0,h=0,prev=0;
  for(let j=0;j<n;j++){ const tt=j/SR; const x=rnd(); let cut=lp; if(sweep) cut=sweep(tt/dur);
    const a=1-Math.exp(-2*Math.PI*cut/SR); l+=a*(x-l); let y=l;
    if(hp){ const b=Math.exp(-2*Math.PI*hp/SR); h=b*(h+y-prev); prev=y; y=h; }
    const e= sweep? Math.min(1,tt/attack)*(1-Math.pow(tt/dur,6)) : Math.min(1,tt/attack)*Math.exp(-tt/decay);
    addS(s+j,y*e*vol,pan,send);} }
function kick(t0,vol){ const s=Math.floor(t0*SR); let p=0; for(let j=0;j<SR*0.45;j++){ const tt=j/SR; const f=45+75*Math.exp(-tt/0.04); p+=f/SR; addS(s+j,Math.sin(2*Math.PI*p)*Math.min(1,tt/0.002)*Math.exp(-tt/0.16)*vol,0,0.02);} }

// ---- groove 3.0 – 18.5
for(let t=3.0;t<18.49;t+=BEAT){ const b=Math.round((t)/BEAT); kick(t, t<6?0.42:0.5);
  if(t>=6 && b%2===1) noise(t,0.25,0.07,{hp:900,lp:5000,decay:0.07,send:0.5,pan:0.1}); // soft clap on 2 & 4
  if(b%2===0){ const r=chordAt(t)[0]-24; tone(t,mtof(r),0.9,0.26,{decay:0.35,harm:0.25,send:0.02}); } }
for(let t=6.0;t<18.49;t+=BEAT) noise(t+BEAT/2,0.06,0.035,{hp:6000,lp:14000,decay:0.02,pan:-0.35,send:0.1});
// pluck arp (8ths)
const pat=[0,2,1,3,2,1,3,2];
for(let k=0,t=3.0;t<18.45;t+=BEAT/2,k++){ const c=chordAt(t); const m=c[pat[k%8]]+12;
  tone(t,mtof(m),0.6,0.075,{decay:0.18,harm:0.3,pan:(k%2?0.4:-0.4),send:0.45}); }

// ---- SFX (tuned to key, sitting under the music)
tone(0.12,mtof(81),0.8,0.09,{decay:0.25,harm:0.2,send:0.6});                       // card pop A5
{ const s=Math.floor(0.85*SR); let p=0; for(let j=0;j<SR*0.5;j++){ const tt=j/SR; const f=mtof(45)*Math.pow(0.5,tt/0.3); p+=f/SR; addS(s+j,Math.sin(2*Math.PI*p)*Math.exp(-tt/0.18)*0.35,0,0.3);} } // strike thud A2→down
noise(0.85,0.3,0.05,{lp:3000,decay:0.08,send:0.3,pan:0.2});                       // strike swish
noise(1.9,1.1,0.10,{attack:0.9,sweep:x=>300+5000*x*x,send:0.4});                    // riser
{ const s=Math.floor(1.9*SR); let p=0; for(let j=0;j<SR*1.1;j++){ const tt=j/SR; const f=mtof(57)*Math.pow(2,tt/1.1); p+=f/SR; addS(s+j,Math.sin(2*Math.PI*p)*(tt/1.1)*0.05,0,0.5);} }
tone(3.0,mtof(33),1.6,0.35,{decay:0.6,harm:0.15,send:0.3});                         // impact sub A1
noise(3.0,0.6,0.07,{lp:1800,decay:0.2,send:0.7});
[76,81].forEach((m,i)=>tone(4.35+i*0.08,mtof(m+12),1.4,0.045,{decay:0.5,harm:0.1,send:0.7,pan:0.2})); // pill bell
noise(5.9,0.8,0.06,{attack:0.35,sweep:x=>400+3500*Math.sin(Math.PI*x),send:0.3,pan:-0.2}); // window whoosh
noise(9.62,0.02,0.05,{hp:2000,lp:9000,decay:0.004,send:0.1});                        // click
tone(9.8,mtof(76),1.2,0.08,{decay:0.35,harm:0.15,send:0.6,pan:0.25});               // toast chime E5
tone(9.92,mtof(81),1.4,0.08,{decay:0.45,harm:0.15,send:0.6,pan:0.25});              // A5
for(let k=0;k<8;k++) noise(11.8+k*0.36,0.02,0.02,{hp:3000,lp:10000,decay:0.006,send:0.1,pan:-0.3}); // category ticks
[69,72,76,79].forEach((m,i)=>tone(15.5+i*0.14,mtof(m+12),0.8,0.035,{decay:0.25,harm:0.2,send:0.6,pan:-0.3+i*0.2})); // cards
noise(18.0,0.6,0.07,{attack:0.4,sweep:x=>300+4000*x,send:0.35});                   // wipe whoosh
kick(18.5,0.55); tone(18.5,mtof(33),3,0.3,{decay:1.0,harm:0.1,send:0.3});
[57,64,69,71,76].forEach((m,i)=>tone(18.5+i*0.03,mtof(m+12),3.5,0.04,{decay:1.3,harm:0.08,send:0.8,pan:-0.3+i*0.15})); // final Am(add9) bell

// ---- reverb (Schroeder)
function reverb(inp,off){ const out=new Float32Array(N); const combs=[1557,1617,1491,1422].map(x=>x+off), g=0.84;
  for(const d of combs){ const buf=new Float32Array(d); let k=0, lp=0; for(let i=0;i<N;i++){ const y=buf[k]; lp=y*0.6+lp*0.4; buf[k]=inp[i]+lp*g; out[i]+=y*0.25; k=(k+1)%d; } }
  for(const d of [556+off,441+off]){ const buf=new Float32Array(d); let k=0; for(let i=0;i<N;i++){ const b=buf[k]; const y=-out[i]*0.5+b; buf[k]=out[i]+b*0.5; out[i]=y; k=(k+1)%d; } }
  return out; }
// pre-filter send (darker)
let pl=0; for(let i=0;i<N;i++){ pl+=0.35*(RV[i]-pl); RV[i]=pl; }
const rl=reverb(RV,0), rr=reverb(RV,23);
let peak=0; const outL=new Float32Array(N), outR=new Float32Array(N);
for(let i=0;i<N;i++){ const t=i/SR; const fade=t>21.3?Math.max(0,(22-t)/0.7):1;
  outL[i]=Math.tanh((L[i]+rl[i]*0.35)*1.1)*fade; outR[i]=Math.tanh((R[i]+rr[i]*0.35)*1.1)*fade; peak=Math.max(peak,Math.abs(outL[i]),Math.abs(outR[i])); }
const g=0.89/peak;
const buf=Buffer.alloc(44+N*4); buf.write('RIFF',0); buf.writeUInt32LE(36+N*4,4); buf.write('WAVEfmt ',8); buf.writeUInt32LE(16,16); buf.writeUInt16LE(1,20); buf.writeUInt16LE(2,22); buf.writeUInt32LE(SR,24); buf.writeUInt32LE(SR*4,28); buf.writeUInt16LE(4,32); buf.writeUInt16LE(16,34); buf.write('data',36); buf.writeUInt32LE(N*4,40);
for(let i=0;i<N;i++){ buf.writeInt16LE(Math.round(Math.max(-1,Math.min(1,outL[i]*g))*32767),44+i*4); buf.writeInt16LE(Math.round(Math.max(-1,Math.min(1,outR[i]*g))*32767),46+i*4); }
fs.writeFileSync('music.wav',buf); console.log('peak',peak.toFixed(3),'gain',g.toFixed(2));
