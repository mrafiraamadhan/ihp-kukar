"use strict";
const BASE = window.BASE;

/* ================= util ================= */
const r2=x=>rnd(x,2), r4=x=>rnd(x,4);
function rnd(x,n){ if(x==null||!isFinite(x)) return null;
  const f=Math.pow(10,n), v=x*f, e=Math.abs(v)%1;
  let out = (e>=0.5-1e-9) ? Math.sign(v)*Math.ceil(Math.abs(v)) : Math.sign(v)*Math.round(Math.abs(v));
  if(Math.abs(e-0.5)<1e-9) out = Math.sign(v)*(Math.floor(Math.abs(v))+1);
  return out/f; }
const NBSP=' ';
function fmt(x,d){ if(x==null||!isFinite(x)) return '–';
  return x.toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function fmtRp(x){ return x==null||!isFinite(x) ? '–' : 'Rp'+x.toLocaleString('id-ID',{maximumFractionDigits:0}); }
function sgn(x,d){ if(x==null||!isFinite(x)) return '–'; return (x>0?'+':'')+fmt(x,d); }
function cls(x){ return x==null||!isFinite(x)||Math.abs(x)<0.0005 ? '' : (x>0?'up':'down'); }
const NAMA_BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= periode ================= */
function pid(p){ return p.y+'-'+String(p.m).padStart(2,'0')+'-M'+p.w; }
function plabel(p){ return NAMA_BULAN[p.m-1]+' '+p.y+(p.weekly?' · Minggu '+p.w:''); }
const PER = BASE.periods.map((p,i)=>({y:p.y,m:p.m,w:p.w,label:p.label,weekly:i>=BASE.periods.findIndex(q=>q.w===1),base:true}));
(function(){ // tandai mingguan: bulan yang punya >1 slot
  const cnt={}; PER.forEach(p=>{const k=p.y+'-'+p.m; cnt[k]=(cnt[k]||0)+1;});
  PER.forEach(p=>p.weekly = cnt[p.y+'-'+p.m]>1);
  let last=PER[PER.length-1], y=last.y, m=last.m;
  for(let n=0;n<24;n++){ m++; if(m>12){m=1;y++;}
    for(let w=1;w<=4;w++) PER.push({y,m,w,label:NAMA_BULAN[m-1].slice(0,3)+'-'+y+' M'+w, weekly:true, base:false}); }
})();
const NPER=PER.length, NBASE=BASE.periods.length;
const lastSlot={}; PER.forEach((p,i)=>{ lastSlot[p.y+'-'+p.m]=i; });
const BIDX=PER.map(p=>{ const m=p.m===1?12:p.m-1, y=p.m===1?p.y-1:p.y; const k=lastSlot[y+'-'+m]; return k===undefined?-1:k; });
const DIDX=PER.map(p=>{ const k=lastSlot[(p.y-1)+'-12']; return k===undefined?-1:k; });
const YIDX=PER.map(p=>{ const k=lastSlot[(p.y-1)+'-'+p.m]; return k===undefined?-1:k; });
const KOM=BASE.commodities, NK0T=BASE.nk0Total, ANC=BASE.anchorIndex;
/* Rantai NK dan basis YoY memakai aturan yang konsisten: minggu ke-4 bulan sebelumnya,
   dan bulan yang sama tahun sebelumnya. Dua rumus keliru di Excel lama sudah dibetulkan;
   KOREKSI di bawah mencatat angka mana yang bergeser karenanya. */
const KOREKSI=[{"p": "2025-02-M2", "m": "YoY", "lama": 3.1042, "baru": 3.3692}, {"p": "2025-02-M3", "m": "YoY", "lama": 3.3088, "baru": 4.3019}, {"p": "2025-02-M4", "m": "YoY", "lama": 3.3239, "baru": 4.4351}, {"p": "2025-03-M1", "m": "YoY", "lama": 2.2997, "baru": 4.7275}, {"p": "2025-03-M2", "m": "YoY", "lama": 3.1343, "baru": 5.5819}, {"p": "2025-03-M3", "m": "YoY", "lama": 2.7634, "baru": 5.2022}, {"p": "2025-03-M4", "m": "YoY", "lama": 3.2826, "baru": 5.7338}, {"p": "2025-04-M1", "m": "YoY", "lama": 4.8336, "baru": 6.316}, {"p": "2025-04-M2", "m": "YoY", "lama": 3.5694, "baru": 5.0339}, {"p": "2025-04-M3", "m": "YoY", "lama": 3.5601, "baru": 5.0245}, {"p": "2025-04-M4", "m": "YoY", "lama": 3.4858, "baru": 4.9491}, {"p": "2026-06-M2", "m": "IHK", "lama": 113.77, "baru": 113.82}, {"p": "2026-06-M2", "m": "MTM", "lama": -0.5855, "baru": -0.5418}, {"p": "2026-06-M2", "m": "YtD", "lama": 2.7733, "baru": 2.8184}, {"p": "2026-06-M2", "m": "YoY", "lama": 3.8521, "baru": 3.8978}, {"p": "2026-06-M2", "m": "andil", "lama": -0.59, "baru": -0.54}, {"p": "2026-06-M3", "m": "IHK", "lama": 113.69, "baru": 114.25}, {"p": "2026-06-M3", "m": "MTM", "lama": -0.6554, "baru": -0.166}, {"p": "2026-06-M3", "m": "YtD", "lama": 2.701, "baru": 3.2069}, {"p": "2026-06-M3", "m": "YoY", "lama": 3.7791, "baru": 4.2903}, {"p": "2026-06-M3", "m": "andil", "lama": -0.66, "baru": -0.17}, {"p": "2026-07-M2", "m": "IHK", "lama": 114.09, "baru": 113.76}, {"p": "2026-07-M2", "m": "MTM", "lama": 0.1492, "baru": -0.1404}, {"p": "2026-07-M3", "m": "IHK", "lama": 114.63, "baru": 113.17}, {"p": "2026-07-M3", "m": "MTM", "lama": 0.6232, "baru": -0.6584}];

/* ================= state ================= */
const KUAL=BASE.kualitas||[], PENC=BASE.pencacah||[], LAPSEED=BASE.lapangan||{};
const KUALBY={}; KUAL.forEach((k,i)=>{ (KUALBY[k.kode]=KUALBY[k.kode]||[]).push(Object.assign({},k,{idx:i})); });
const NSLOT=PENC.length*3;
function gmean(a){ const v=(a||[]).filter(x=>typeof x==='number'&&isFinite(x)&&x>0);
  return v.length? Math.exp(v.reduce((s,x)=>s+Math.log(x),0)/v.length) : null; }
function hargaDariLapangan(blok,kode){
  const us=(KUALBY[kode]||[]).map(k=>gmean(blok[k.kode+'#'+k.ki])).filter(x=>x!=null);
  return us.length? gmean(us) : null; }
let OVRLAP={};              // pid -> {kode#ki: [15 harga]}  (dari Supabase)
function lapPeriode(id){ return OVRLAP[id] || LAPSEED[id] || null; }
function blokLalu(i){ return i>0 ? lapPeriode(pid(PER[i-1])) : null; }
function slotNama(x){ return (PENC[Math.floor(x/3)]||('Pencacah '+(Math.floor(x/3)+1)))+' · Toko '+(x%3+1); }
function nIsi(a){ return (a||[]).filter(v=>typeof v==='number'&&isFinite(v)&&v>0).length; }
function nLalu(x){ return (x==null||!isFinite(x)) ? '–' : x.toLocaleString('id-ID',{maximumFractionDigits:0}); }
let OVR={};                 // pid -> {kode: harga}
let META={};                // pid -> {oleh, waktu}
let draft={}, draftPid=null, pencAktif=-1;
let R=null;                 // hasil hitung
let sb=null, sesi=null;

function hargaMatrix(){
  const M={};
  for(const c of KOM){
    const a=BASE.prices[c.kode].slice();
    while(a.length<NPER) a.push(null);
    M[c.kode]=a;
  }
  for(const [id,vals] of Object.entries(OVR)){
    const i=PER.findIndex(p=>pid(p)===id); if(i<0) continue;
    for(const c of KOM){ const v=vals[c.kode]; if(typeof v==='number'&&isFinite(v)&&v>0) M[c.kode][i]=v; }
  }
  const semua=Object.assign({},LAPSEED,OVRLAP);
  for(const [id,blok] of Object.entries(semua)){
    const i=PER.findIndex(p=>pid(p)===id); if(i<0) continue;
    for(const c of KOM){ const v=hargaDariLapangan(blok,c.kode); if(v!=null) M[c.kode][i]=v; }
  }
  return M;
}

/* ================= mesin hitung ================= */
function hitung(){
  const NBX = BIDX, YBX = YIDX;
  const H=hargaMatrix();
  const RH={}, NK={};
  for(const c of KOM){
    const p=H[c.kode], rh=new Array(NPER).fill(null), nk=new Array(NPER).fill(null);
    for(let i=0;i<NPER;i++){ const b=BIDX[i];
      if(b>=0 && p[i]!=null && p[b]!=null && p[b]!==0) rh[i]=r4(p[i]/p[b]*100); }
    nk[ANC]=c.nk0;
    for(let i=ANC+1;i<NPER;i++){ const b=BIDX[i], nb=NBX[i];
      if(b>=0 && nb>=0 && rh[i]!=null && nk[nb]!=null) nk[i]=r2(rh[i]*nk[nb]/100); }
    for(let i=ANC-1;i>=0;i--){ const j=BIDX.indexOf(i);
      if(j>=0 && nk[j]!=null && rh[j]) nk[i]=nk[j]/rh[j]*100; }
    RH[c.kode]=rh; NK[c.kode]=nk;
  }
  const NKT=new Array(NPER).fill(null), lengkap=new Array(NPER).fill(false);
  for(let i=0;i<NPER;i++){ let s=0,ok=true;
    for(const c of KOM){ if(NK[c.kode][i]==null){ok=false;break;} s+=NK[c.kode][i]; }
    if(ok){ NKT[i]=s; lengkap[i]=true; } }
  const IHK={}, MTM={}, YTD={}, YOY={}, WN={}, AND={};
  const mk=()=>new Array(NPER).fill(null);
  const rows=KOM.map(c=>c.kode).concat(['UMUM']);
  for(const k of rows){ IHK[k]=mk(); MTM[k]=mk(); YTD[k]=mk(); YOY[k]=mk(); WN[k]=mk(); AND[k]=mk(); }
  for(let i=0;i<NPER;i++){
    for(const c of KOM){ if(NK[c.kode][i]!=null) IHK[c.kode][i]=r2(NK[c.kode][i]/c.nk0*100); }
    if(NKT[i]!=null) IHK.UMUM[i]=r2(NKT[i]/NK0T*100);
    const b=BIDX[i], d=DIDX[i], y=YBX[i];
    for(const k of rows){
      const v=IHK[k][i];
      if(v==null) continue;
      const yk = y;
      if(b>=0&&IHK[k][b]) MTM[k][i]=(v/IHK[k][b]-1)*100;
      if(d>=0&&IHK[k][d]) YTD[k][i]=(v/IHK[k][d]-1)*100;
      if(yk>=0&&IHK[k][yk]) YOY[k][i]=(v/IHK[k][yk]-1)*100;
    }
    if(b>=0&&NKT[b]){
      for(const c of KOM){ if(NK[c.kode][b]!=null) WN[c.kode][i]=NK[c.kode][b]/NKT[b]*100; }
      WN.UMUM[i]=100;
    }
    for(const k of rows){ if(WN[k][i]!=null&&MTM[k][i]!=null) AND[k][i]=r2(WN[k][i]*MTM[k][i]/100); }
  }
  return {H,RH,NK,NKT,IHK,MTM,YTD,YOY,WN,AND,lengkap};
}
function terisi(i){
  const id=pid(PER[i]);
  if(i<NBASE) return true;
  const b=lapPeriode(id);
  if(b) return KOM.every(c=>hargaDariLapangan(b,c.kode)!=null);
  const v=OVR[id]; if(!v) return false;
  return KOM.every(c=>typeof v[c.kode]==='number'&&isFinite(v[c.kode]));
}
function idxBerikut(){ for(let i=Math.max(0,NBASE-4);i<NPER;i++) if(!terisi(i)) return i; return NPER-1; }
function idxTerakhir(){ let k=0; for(let i=0;i<NPER;i++) if(terisi(i)) k=i; return k; }

/* ================= parse harga ================= */
function parseHarga(s){
  s=String(s).trim().replace(/\s|Rp/gi,''); if(!s) return null;
  const ld=s.lastIndexOf('.'), lc=s.lastIndexOf(',');
  if(ld>=0&&lc>=0) s = lc>ld ? s.replace(/\./g,'').replace(',','.') : s.replace(/,/g,'');
  else if(lc>=0){ const q=s.split(','); s = (q.length===2&&q[1].length>0&&q[1].length<3) ? q.join('.') : s.replace(/,/g,''); }
  else if(ld>=0){ const q=s.split('.'); if(q.length>2) s=q.join(''); else if(q[1]&&q[1].length===3) s=q.join(''); }
  const v=Number(s); return isFinite(v)?v:NaN;
}

/* ================= validasi ================= */
function periksa(i,draft){
  const out=[], H=R.H;
  const kom={}; KOM.forEach(c=>kom[c.kode]=c.nama);
  for(const k of KUAL){
    const key=k.kode+'#'+k.ki, arr=draft[key]||[];
    const isi=arr.filter(x=>typeof x==='number'&&isFinite(x)&&x>0);
    const nm=k.nama, knm=(kom[k.kode]||'').split('/')[0];
    const lalu0=blokLalu(i), pv0=lalu0? (lalu0[key]||[]) : [];
    const nl=nIsi(pv0);
    if(!isi.length){
      out.push({key,knm,nm,lv:'err',empty:true,
        t: nl? ('Belum diisi — minggu lalu ada '+nl+' toko') : 'Belum ada harga sama sekali'});
      continue; }
    if(nl>0 && isi.length!==nl){
      const hil=[], bar=[];
      for(let x=0;x<NSLOT;x++){
        const a=arr[x], b=pv0[x];
        const adaA=typeof a==='number'&&isFinite(a)&&a>0, adaB=typeof b==='number'&&isFinite(b)&&b>0;
        if(adaB&&!adaA) hil.push(slotNama(x)+' ('+fmtRp(b)+')');
        if(adaA&&!adaB) bar.push(slotNama(x));
      }
      const ket=[hil.length?('kosong minggu ini: '+hil.slice(0,2).join(', ')+(hil.length>2?' +'+(hil.length-2)+' lagi':'')):'',
                 bar.length?('baru terisi: '+bar.slice(0,2).join(', ')+(bar.length>2?' +'+(bar.length-2)+' lagi':'')):'']
                .filter(Boolean).join('; ');
      const g0=gmean(arr), gl0=gmean(pv0), dd=(g0&&gl0)?(g0/gl0-1)*100:null;
      if(dd!=null && Math.abs(dd)>=10)
        out.push({key,knm,nm,lv:'err',
          t:'Jumlah toko berubah '+nl+' → '+isi.length+' dan harga bergeser '+sgn(dd,0)+'% — geomean tidak sebanding. '+ket});
      else
        out.push({key,knm,nm,lv:'wrn',
          t:'Jumlah toko terisi beda dari minggu lalu ('+nl+' → '+isi.length+') — samakan jumlah responden. '+ket});
    }
    else if(isi.length<3 && nl===0) out.push({key,knm,nm,lv:'wrn',t:'Baru '+isi.length+' toko terisi dari '+NSLOT});
    const lo=Math.min(...isi), hi=Math.max(...isi), rasio=hi/lo;
    if(rasio>=3) out.push({key,knm,nm,lv:'err',t:'Harga terendah '+fmtRp(lo)+' dan tertinggi '+fmtRp(hi)+' beda '+rasio.toFixed(1)+'x — periksa satuan atau kualitas yang dipantau'});
    else if(rasio>=1.6) out.push({key,knm,nm,lv:'wrn',t:'Sebaran antar toko lebar, '+rasio.toFixed(1)+'x ('+fmtRp(lo)+'–'+fmtRp(hi)+')'});
    const g=gmean(arr);
    const lalu=blokLalu(i);
    const gl2=lalu? gmean(lalu[key]) : null;
    if(lalu){
      const pv=lalu[key]||[]; let worst=null;
      arr.forEach((v,x)=>{ const q=pv[x];
        if(typeof v!=='number'||!isFinite(v)||v<=0) return;
        if(typeof q!=='number'||!isFinite(q)||q<=0) return;
        const d=v/q-1;
        if(Math.abs(d)>=0.35 && (!worst||Math.abs(d)>Math.abs(worst.d))) worst={x,q,v,d};
      });
      if(worst) out.push({key,knm,nm,lv:'err',
        t:(PENC[Math.floor(worst.x/3)]||('Pencacah '+(Math.floor(worst.x/3)+1)))+' · Toko '+(worst.x%3+1)
          +': '+fmtRp(worst.q)+' → '+fmtRp(worst.v)+' ('+sgn(worst.d*100,0)+'%) — konfirmasi ke petugas'});
    }
    if(gl2 && g){ const d=(g/gl2-1)*100;
      if(Math.abs(d)>=40 && !out.some(o=>o.key===key&&o.lv==='err')) out.push({key,knm,nm,lv:'err',t:'Geomean '+sgn(d,0)+'% dari minggu lalu ('+fmtRp(gl2)+') — periksa jumlah digit'});
      else if(Math.abs(d)>=20 && !out.some(o=>o.key===key)) out.push({key,knm,nm,lv:'wrn',t:'Geomean '+sgn(d,1)+'% dari minggu lalu'});
    }
  }
  return out;
}

/* ================= render: hasil ================= */
function isiSelect(el,filter){
  const cur=el.value; el.innerHTML='';
  PER.forEach((p,i)=>{ if(filter&&!filter(i)) return;
    const o=document.createElement('option'); o.value=i; o.textContent=plabel(p)+(terisi(i)?'':'  · belum diisi'); el.appendChild(o); });
  if(cur&&el.querySelector('option[value="'+cur+'"]')) el.value=cur;
}
function renderHasil(){
  const i=+document.getElementById('perHasil').value;
  const p=PER[i], ok=R.lengkap[i];
  document.getElementById('hasilNote').textContent = ok
    ? (p.weekly&&p.w===4 ? 'Angka resmi bulan '+NAMA_BULAN[p.m-1]+' '+p.y : (p.weekly?'Angka pantauan mingguan':'Angka resmi bulanan'))
    : 'Belum bisa dihitung — data periode ini atau pembandingnya belum lengkap.';
  const F=[['IHK Umum',fmt(R.IHK.UMUM[i],2),'2022 = 100',''],
           ['Inflasi m-to-m',sgn(R.MTM.UMUM[i],2)+'%','terhadap akhir bulan lalu',cls(R.MTM.UMUM[i])],
           ['Inflasi YtD',sgn(R.YTD.UMUM[i],2)+'%','terhadap Desember '+(p.y-1),cls(R.YTD.UMUM[i])],
           ['Inflasi YoY',sgn(R.YOY.UMUM[i],2)+'%','terhadap '+NAMA_BULAN[p.m-1]+' '+(p.y-1),cls(R.YOY.UMUM[i])]];
  document.getElementById('figs').innerHTML = F.map(f=>
    '<div class="fig"><div class="k">'+f[0]+'</div><div class="v num '+f[3]+'">'+f[1]+'</div><div class="n">'+f[2]+'</div></div>').join('');
  document.getElementById('hasilSub').textContent='20 komoditas terpantau';
  const rows=KOM.map(c=>{
    const k=c.kode;
    return '<tr><td class="l"><span class="nm">'+esc(c.nama)+'</span><span class="kode mono">'+k+'</span></td>'
      +'<td class="num">'+fmtRp(R.H[k][i])+'</td>'
      +'<td class="num">'+fmt(R.IHK[k][i],2)+'</td>'
      +'<td class="num '+cls(R.MTM[k][i])+'">'+sgn(R.MTM[k][i],2)+'</td>'
      +'<td class="num '+cls(R.YTD[k][i])+'">'+sgn(R.YTD[k][i],2)+'</td>'
      +'<td class="num '+cls(R.YOY[k][i])+'">'+sgn(R.YOY[k][i],2)+'</td>'
      +'<td class="num">'+fmt(R.WN[k][i],2)+'</td>'
      +'<td class="num '+cls(R.AND[k][i])+'">'+sgn(R.AND[k][i],2)+'</td></tr>';
  }).join('');
  document.getElementById('tblHasil').innerHTML =
    '<thead><tr><th class="l">Komoditas</th><th>Harga</th><th>IHK</th><th>m-to-m %</th><th>YtD %</th><th>YoY %</th><th>Bobot</th><th>Andil</th></tr></thead>'
    +'<tbody><tr class="tot"><td class="l">UMUM</td><td class="num">–</td><td class="num">'+fmt(R.IHK.UMUM[i],2)+'</td>'
    +'<td class="num '+cls(R.MTM.UMUM[i])+'">'+sgn(R.MTM.UMUM[i],2)+'</td><td class="num '+cls(R.YTD.UMUM[i])+'">'+sgn(R.YTD.UMUM[i],2)+'</td>'
    +'<td class="num '+cls(R.YOY.UMUM[i])+'">'+sgn(R.YOY.UMUM[i],2)+'</td><td class="num">100,00</td>'
    +'<td class="num '+cls(R.AND.UMUM[i])+'">'+sgn(R.AND.UMUM[i],2)+'</td></tr>'+rows+'</tbody>';
}

/* ================= render: entri ================= */
function setPeriodeEntri(i){
  const id=pid(PER[i]);
  if(draftPid!==id){
    draftPid=id; draft={};
    const b=lapPeriode(id);
    KUAL.forEach(k=>{ const key=k.kode+'#'+k.ki;
      draft[key]= b&&b[key] ? b[key].slice(0,NSLOT).concat(Array(Math.max(0,NSLOT-(b[key]||[]).length)).fill(null)) : Array(NSLOT).fill(null); });
  }
  renderEntri();
}
function renderEntri(){
  const i=+document.getElementById('perEntri').value;
  const kolom = pencAktif<0 ? Array.from({length:NSLOT},(_,x)=>x)
                            : [0,1,2].map(t=>pencAktif*3+t);
  let head='<thead><tr><th class="l" style="min-width:190px">Kualitas / merk</th><th class="l">Satuan</th>';
  kolom.forEach(x=>{ const pi=Math.floor(x/3), t=x%3+1;
    head += '<th>'+(pencAktif<0 ? 'P'+(pi+1)+'·T'+t : 'Toko '+t)+'</th>'; });
  head += '<th class="l" style="min-width:150px">Sebaran antar toko</th><th>Toko terisi</th><th>Minggu lalu</th><th>Geomean</th><th class="l" style="min-width:190px">Catatan</th></tr></thead>';
  const bl=blokLalu(i);
  let body='';
  KOM.forEach((c,ci)=>{
    const list=KUALBY[c.kode]||[];
    body += '<tr class="grp"><td class="l" colspan="'+(kolom.length+7)+'"><span class="gwrap">'
          + '<span>'+esc(c.nama.split('/')[0])+'</span>'
          + '<span class="kd">'+c.kode+'</span><span class="hk" id="hk-'+c.kode+'">–</span></span></td></tr>';
    list.forEach(k=>{
      const key=k.kode+'#'+k.ki;
      body += '<tr data-k="'+key+'"><td class="l"><span class="kual">'+esc(k.nama)+'</span></td>'
            + '<td class="l sat">'+esc(k.satuan||'')+'</td>';
      const pv = bl ? (bl[key]||[]) : [];
      kolom.forEach(x=>{ const v=draft[key]?draft[key][x]:null;
        body += '<td><input class="inp mini" inputmode="decimal" id="in-'+key.replace('#','_')+'-'+x
             + '" value="'+(v!=null&&isFinite(v)?v.toLocaleString('id-ID',{maximumFractionDigits:2,useGrouping:false}):'')
             + '" aria-label="'+esc(k.nama)+' toko '+(x%3+1)+' pencacah '+(Math.floor(x/3)+1)+'">'
             + '<span class="lw" id="lw-'+key.replace('#','_')+'-'+x+'">'+nLalu(pv[x])+'</span></td>'; });
      body += '<td id="sp-'+key.replace('#','_')+'" class="l"></td>'
            + '<td class="num" id="jm-'+key.replace('#','_')+'">–</td>'
            + '<td class="num lalu" id="gl-'+key.replace('#','_')+'">–</td>'
            + '<td class="num" id="gm-'+key.replace('#','_')+'">–</td>'
            + '<td class="l" id="fl-'+key.replace('#','_')+'"></td></tr>';
    });
  });
  document.getElementById('tblEntri').innerHTML=head+'<tbody>'+body+'</tbody>';
  KUAL.forEach(k=>{ const key=k.kode+'#'+k.ki;
    kolom.forEach(x=>{ const el=document.getElementById('in-'+key.replace('#','_')+'-'+x);
      if(!el) return;
      el.addEventListener('input',()=>{ const raw=el.value.trim();
        if(!draft[key]) draft[key]=Array(NSLOT).fill(null);
        draft[key][x]= raw? parseHarga(raw) : null;
        updateEntri(); });
    });
  });
  updateEntri();
}
function updateEntri(){
  const i=+document.getElementById('perEntri').value;
  const bl=blokLalu(i);
  const iss=periksa(i,draft), byK={};
  iss.forEach(o=>{ if(!byK[o.key]) byK[o.key]=o; });
  let lengkap=0;
  KUAL.forEach(k=>{
    const key=k.kode+'#'+k.ki, id=key.replace('#','_');
    const arr=draft[key]||[], isi=arr.filter(x=>typeof x==='number'&&isFinite(x)&&x>0);
    const g=gmean(arr), o=byK[key], kosong=!!(o&&o.empty);
    if(isi.length) lengkap++;
    const gEl=document.getElementById('gm-'+id); if(gEl) gEl.textContent = g? fmtRp(g) : '–';
    const pv = bl ? (bl[key]||[]) : [];
    const gl = bl ? gmean(pv) : null;
    const nlw = nIsi(pv);
    const jEl=document.getElementById('jm-'+id);
    if(jEl){
      const beda = nlw>0 && isi.length!==nlw;
      jEl.className='num jml'+(beda ? (isi.length<nlw?' hilang':' beda') : '');
      jEl.innerHTML = nlw>0
        ? '<b>'+isi.length+'</b><span class="sep">/</span>'+nlw
        : '<b>'+isi.length+'</b>';
      jEl.title = nlw>0 ? (isi.length+' toko terisi minggu ini, '+nlw+' minggu lalu') : (isi.length+' toko terisi');
    }
    const glEl=document.getElementById('gl-'+id);
    if(glEl){ const dd=(g&&gl)?(g/gl-1)*100:null;
      glEl.innerHTML = gl ? fmtRp(gl)+(dd!=null?'<br><span style="font-size:10.5px" class="'+cls(dd)+'">'+sgn(dd,1)+'%</span>':'') : '–'; }
    const sEl=document.getElementById('sp-'+id); if(sEl) sEl.innerHTML = strip(isi.length?arr:[], g);
    const fEl=document.getElementById('fl-'+id);
    if(fEl) fEl.innerHTML = (o&&!kosong)
      ? '<span class="flag '+(o.lv==='err'?'err':o.lv==='wrn'?'wrn':'inf')+'">'+esc(o.t)+'</span>'
      : (isi.length? '<span class="flag ok">wajar</span>' : '');
    arr.forEach((v,x)=>{ const el=document.getElementById('in-'+id+'-'+x); if(!el) return;
      const buruk = v!=null && (!isFinite(v)||v<=0);
      el.classList.toggle('bad', buruk || !!(o&&o.lv==='err'&&!kosong&&v!=null));
      el.classList.toggle('warn', !!(o&&o.lv==='wrn'&&v!=null)); });
    [...new Set([...arr.keys()].concat([...pv.keys()]))].forEach(x=>{
      const lel=document.getElementById('lw-'+id+'-'+x); if(!lel) return;
      const q=pv[x], v=arr[x];
      const adaQ=typeof q==='number'&&isFinite(q)&&q>0, adaV=typeof v==='number'&&isFinite(v)&&v>0;
      let klas='lw', txt=nLalu(q);
      if(adaQ&&adaV){
        const d=v/q-1;
        if(Math.abs(d)>=0.02) txt = nLalu(q)+' <span class="d">'+sgn(d*100,0)+'%</span>';
        if(Math.abs(d)>=0.35) klas+=' kuat '+(d>0?'up':'down');
        else if(Math.abs(d)>=0.2) klas+=' '+(d>0?'up':'down');
      } else if(adaQ&&!adaV){ klas+=' hilang'; txt=nLalu(q)+' <span class="d">kosong</span>'; }
      else if(!adaQ&&adaV&&nlw>0){ klas+=' baru'; txt='baru'; }
      lel.className=klas; lel.innerHTML=txt;
      const iel=document.getElementById('in-'+id+'-'+x);
      if(iel) iel.classList.toggle('kosong', adaQ&&!adaV); });
  });
  KOM.forEach(c=>{ const el=document.getElementById('hk-'+c.kode); if(!el) return;
    const v=hargaDariLapangan(draft,c.kode);
    const b=BIDX[i], lalu=b>=0?R.H[c.kode][i-1>=0?i-1:b]:null;
    const d=(v&&lalu)?((v/lalu-1)*100):null;
    el.innerHTML = v? fmtRp(v)+(d!=null?' <span class="'+cls(d)+'" style="font-weight:600">'+sgn(d,1)+'%</span>':'') : '<span style="color:var(--ink3);font-weight:400">belum lengkap</span>'; });
  document.getElementById('progbar').style.width=(lengkap/KUAL.length*100)+'%';
  document.getElementById('progtxt').textContent=lengkap+'/'+KUAL.length;
  const kosong=iss.filter(o=>o.empty), errs=iss.filter(o=>o.lv==='err'&&!o.empty), wrns=iss.filter(o=>o.lv==='wrn');
  const ch=document.getElementById('ischip'); ch.className='chip'+(errs.length?' warn':'');
  document.getElementById('istxt').textContent = errs.length? errs.length+' perlu dicek' : (wrns.length? wrns.length+' peringatan':'bersih');
  const list=iss.filter(o=>!o.empty).slice(0,60);
  const head = kosong.length? '<div class="issue">'+kosong.length+' baris kualitas belum diisi</div>' : '';
  document.getElementById('issues').innerHTML = (head+list.map(o=>'<div class="issue '+(o.lv==='err'?'err':o.lv==='wrn'?'wrn':'')+'"><b>'+esc(o.knm)+' · '+esc(o.nm)+'</b> — '+esc(o.t)+'</div>').join(''))
    || '<p class="note">Semua baris masuk akal terhadap sesama toko dan terhadap minggu lalu.</p>';
  const semua=KOM.every(c=>hargaDariLapangan(draft,c.kode)!=null);
  const kv=document.getElementById('kvlive');
  if(semua && !errs.length){
    const sim=simulasi(i,draft);
    const top=KOM.map(c=>({nm:c.nama,a:sim.and[c.kode]})).filter(x=>x.a!=null).sort((a,b)=>Math.abs(b.a)-Math.abs(a.a))[0];
    kv.innerHTML='<div class="kv"><span class="k">IHK Umum</span><span class="v">'+fmt(sim.ihk,2)+'</span></div>'
      +'<div class="kv"><span class="k">Inflasi m-to-m</span><span class="v '+cls(sim.mtm)+'">'+sgn(sim.mtm,2)+'%</span></div>'
      +'<div class="kv"><span class="k">Andil terbesar</span><span class="v '+cls(top?top.a:null)+'">'+(top?esc(top.nm.split('/')[0].slice(0,14))+' '+sgn(top.a,2):'–')+'</span></div>';
  } else kv.innerHTML='<p class="note">Pratinjau IHK muncul setelah seluruh 20 komoditas punya minimal satu harga.</p>';
  const bisa = semua && !errs.length;
  const btn=document.getElementById('btnSimpan'); btn.disabled=!bisa||!sesi;
  document.getElementById('savenote').textContent = !sesi ? 'Masuk dulu di tab Pengaturan untuk bisa menyimpan.'
    : (!semua ? 'Masih ada komoditas tanpa harga sama sekali.'
    : (errs.length ? 'Bereskan '+errs.length+' catatan merah dulu.'
    : (wrns.length? wrns.length+' peringatan kuning — simpan bila angkanya memang benar.' : 'Siap disimpan.')));
  chartSidik(draft);
}
function strip(arr,g){
  const isi=arr.map((v,x)=>({v,x})).filter(o=>typeof o.v==='number'&&isFinite(o.v)&&o.v>0);
  if(isi.length<2 || !g) return '<span class="sat">'+(isi.length?'1 toko':'–')+'</span>';
  const W=140,H=18,P=7;
  const lo=Math.min(...isi.map(o=>o.v)), hi=Math.max(...isi.map(o=>o.v));
  const X=v=> hi===lo ? W/2 : P+(W-2*P)*(v-lo)/(hi-lo);
  let d='<line x1="'+P+'" y1="9" x2="'+(W-P)+'" y2="9" stroke="var(--line2)" stroke-width="1"/>';
  d+='<line x1="'+X(g).toFixed(1)+'" y1="2" x2="'+X(g).toFixed(1)+'" y2="16" stroke="var(--ink3)" stroke-width="1.5"/>';
  isi.forEach(o=>{ const dev=(o.v/g-1);
    const warna = dev>0.12?'var(--up-mark)' : dev<-0.12?'var(--down-mark)' : 'var(--ink3)';
    d+='<circle cx="'+X(o.v).toFixed(1)+'" cy="9" r="3.2" fill="'+warna+'" fill-opacity=".85" stroke="var(--surface)" stroke-width="1"><title>Pencacah '+(Math.floor(o.x/3)+1)+' · Toko '+(o.x%3+1)+' — '+fmtRp(o.v)+' ('+sgn(dev*100,0)+'%)</title></circle>'; });
  return '<svg class="strip" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Sebaran harga antar toko">'+d+'</svg>';
}
function chartSidik(draft){
  const host=document.getElementById('chSidik'); if(!host) return;
  const dev=PENC.map(()=>[]);
  KUAL.forEach(k=>{
    const arr=draft[k.kode+'#'+k.ki]||[]; const g=gmean(arr);
    if(!g) return;
    PENC.forEach((_,pi)=>{ const gp=gmean(arr.slice(pi*3,pi*3+3)); if(gp) dev[pi].push(Math.log(gp/g)); });
  });
  const nilai=dev.map(a=> a.length? (Math.exp(a.reduce((s,x)=>s+x,0)/a.length)-1)*100 : null);
  const ada=nilai.filter(v=>v!=null);
  if(!ada.length){ host.innerHTML='<p class="note">Belum ada data untuk dibandingkan.</p>'; return; }
  const mx=Math.max(3,...ada.map(Math.abs))*1.25;
  const W=300,rowH=26,T=4,H=T*2+PENC.length*rowH,L=104,Rr=44;
  const X=v=>L+(W-L-Rr)/2*(1+v/mx), zero=X(0);
  let g='<line x1="'+zero.toFixed(1)+'" y1="'+T+'" x2="'+zero.toFixed(1)+'" y2="'+(H-T)+'" stroke="var(--line2)" stroke-width="1"/>';
  PENC.forEach((nm,pi)=>{
    const y=T+pi*rowH+5, h=rowH-13, v=nilai[pi];
    g+='<text x="'+(L-9)+'" y="'+(y+h-2)+'" text-anchor="end" font-size="11" fill="var(--ink2)" font-family="Public Sans,sans-serif">'+esc(nm.split(' ')[0])+'</text>';
    if(v==null){ g+='<text x="'+(zero+8)+'" y="'+(y+h-2)+'" font-size="11" fill="var(--ink3)" font-family="Public Sans,sans-serif">tidak ada data</text>'; return; }
    const xa=Math.min(zero,X(v)), w=Math.max(2,Math.abs(X(v)-zero));
    const dalam = w>=38;
    const tx = dalam ? (v>=0 ? xa+w-6 : xa+6) : (v>=0 ? xa+w+6 : xa-6);
    const anc = dalam ? (v>=0?'end':'start') : (v>=0?'start':'end');
    g+='<rect x="'+xa.toFixed(1)+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+h+'" rx="3" fill="'+(v>=0?'var(--up-mark)':'var(--down-mark)')+'"/>'
     + '<text x="'+tx.toFixed(1)+'" y="'+(y+h-2)+'" text-anchor="'+anc+'" font-size="11" font-weight="600" fill="'+(dalam?'#fff':'var(--ink)')+'" font-family="Public Sans,sans-serif">'+sgn(v,1)+'%</text>';
  });
  host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Simpangan tiap pencacah">'+g+'</svg>';
}
function simulasi(i,draft){
  const b=BIDX[i]; const out={and:{}};
  if(b<0||R.NKT[b]==null) return {ihk:null,mtm:null,and:{}};
  let s=0;
  for(const c of KOM){
    const k=c.kode, pb=R.H[k][b], nkb=R.NK[k][b];
    const hv=hargaDariLapangan(draft,k);
    if(!pb||nkb==null||hv==null) return {ihk:null,mtm:null,and:{}};
    const rh=r4(hv/pb*100), nk=r2(rh*nkb/100); s+=nk;
    const ihk=r2(nk/c.nk0*100), ihkb=r2(nkb/c.nk0*100);
    const mtm=ihkb?(ihk/ihkb-1)*100:null, wn=nkb/R.NKT[b]*100;
    out.and[k]= mtm==null?null:r2(wn*mtm/100);
  }
  const ihk=r2(s/NK0T*100), ihkb=r2(R.NKT[b]/NK0T*100);
  return {ihk, mtm: ihkb?(ihk/ihkb-1)*100:null, and:out.and};
}


/* ================= bahan publikasi ================= */
let KALTIM={};                 // pid bulan -> {baris:[{nama,ihk,yoy,mtm}]}
const KALTIM_BARIS=['Kota Balikpapan','Kota Samarinda','Kab. Penajam Paser Utara','Kab. Berau','Provinsi KALTIM'];
const BAHAN={};                // teks siap salin, diisi tiap render
function pubMulai(){ return PER.findIndex(p=>p.y===2026&&p.m===7&&p.w===4); }
function bulanPub(){
  const m0=pubMulai(), out=[];
  for(let i=0;i<NPER;i++){
    const p=PER[i];
    if(lastSlot[p.y+'-'+p.m]!==i) continue;
    if(m0>=0&&i<m0) continue;
    if(R.IHK.UMUM[i]==null) continue;
    out.push(i);
  }
  return out;
}
function pidBulan(i){ const p=PER[i]; return p.y+'-'+String(p.m).padStart(2,'0'); }
function namaBulan(i){ return NAMA_BULAN[PER[i].m-1]+' '+PER[i].y; }
function pct(x,d){ return fmt(x,d===undefined?2:d); }
function judulKom(n){ return String(n).toLowerCase()
  .replace(/(^|[\s\/\-])([a-z])/g,(m,a,b)=>a+b.toUpperCase()); }

async function salin(teks, tombol){
  let ok=false;
  try{ await navigator.clipboard.writeText(teks); ok=true; }catch(e){}
  if(!ok){ try{
      const ta=document.createElement('textarea'); ta.value=teks;
      ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-1000px';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,teks.length);
      ok=document.execCommand('copy'); ta.remove();
  }catch(e){} }
  if(tombol){ const t0=tombol.dataset.t0||tombol.textContent; tombol.dataset.t0=t0;
    tombol.textContent = ok?'Tersalin':'Gagal'; tombol.classList.toggle('ok',ok);
    setTimeout(()=>{ tombol.textContent=t0; tombol.classList.remove('ok'); },1500); }
  if(!ok) toast('Tidak bisa menyalin otomatis — blok teksnya lalu tekan Ctrl+C');
  return ok;
}
function tsv(rows){ return rows.map(r=>r.map(v=>v==null?'':String(v)).join('\t')).join('\n'); }

function hitungPub(i){
  const b=BIDX[i], nm={}; KOM.forEach(c=>nm[c.kode]=c.nama);
  const baris=KOM.map(c=>({kode:c.kode, nama:c.nama,
    ihk:R.IHK[c.kode][i], mtm:R.MTM[c.kode][i], ytd:R.YTD[c.kode][i],
    yoy:R.YOY[c.kode][i], and:R.AND[c.kode][i], mtmLalu:b>=0?R.MTM[c.kode][b]:null}));
  const ada=x=>x!=null&&isFinite(x);
  const inf=baris.filter(r=>ada(r.and)&&r.and>0).sort((a,b2)=>b2.and-a.and);
  const def=baris.filter(r=>ada(r.and)&&r.and<0).sort((a,b2)=>a.and-b2.and);
  const gerak=baris.filter(r=>ada(r.mtm)).slice().sort((a,b2)=>Math.abs(b2.mtm)-Math.abs(a.mtm));
  const kal=baris.filter(r=>ada(r.ytd)).slice().sort((a,b2)=>b2.ytd-a.ytd);
  const yy=baris.filter(r=>ada(r.yoy)).slice().sort((a,b2)=>b2.yoy-a.yoy);
  return {i,b,baris,inf,def,gerak,kal,yy,
    ihk:R.IHK.UMUM[i], ihkLalu:b>=0?R.IHK.UMUM[b]:null,
    mtm:R.MTM.UMUM[i], ytd:R.YTD.UMUM[i], yoy:R.YOY.UMUM[i]};
}

function narasiPub(D){
  const i=D.i, bl=NAMA_BULAN[PER[i].m-1], th=PER[i].y;
  const arah=v=> v==null?'—' : (v>=0?'inflasi':'deflasi');
  const daftar=(a,n)=>a.slice(0,n).map(r=>judulKom(r.nama.split('/')[0])).join(', ');
  const P=[];
  P.push({j:'Pembuka 4.2 — nilai IHP',
    t:'Hasil pemantauan harga yang dilakukan pada bulan '+bl+' berdasarkan 20 Komoditas yang diambil tercatat '
      +'nilai Indeks Harga Pasar (IHP) sebesar '+pct(D.ihk)+' persen yang sebelumnya sebesar '+pct(D.ihkLalu)+' persen.'});
  const g=D.gerak.slice(0,2).map(r=>judulKom(r.nama.split('/')[0])+' sebesar '+pct(r.mtm)+' persen'
      +(r.mtmLalu!=null?(' dari '+pct(r.mtmLalu)+' persen'):'')).join(', ');
  const t1=D.inf[0], d1=D.def[0];
  const utama = D.mtm>=0 ? (t1?('komoditas yang memberikan andil terbesar adalah '+judulKom(t1.nama.split('/')[0])+' sebesar '+pct(t1.and)+' persen.'):'')
                         : (t1?('komoditas yang memberikan andil terbesar adalah '+judulKom(t1.nama.split('/')[0])+' sebesar '+pct(t1.and)+' persen.'):'');
  P.push({j:'Perubahan harga & andil',
    t:'Berdasarkan perubahan harga yang terjadi pada masing-masing komoditas, komoditas yang paling signifikan '
      +'mengalami perubahan harga untuk bulan ke bulan adalah '+g+'. Jika ditinjau berdasarkan besarnya andil '
      +'kelompok pengeluaran terhadap pembentukan total '+arah(D.mtm)+' sebesar '+pct(D.mtm)+' persen pada bulan '
      +bl+', '+utama});
  const k1=D.kal[0];
  P.push({j:'Inflasi kalender',
    t:'Angka inflasi kalender, Kabupaten Kutai Kartanegara bulan '+bl+' mengalami '+arah(D.ytd)+' sebesar '
      +pct(D.ytd)+' persen. Jika dilihat dari komoditas, inflasi kalender terbesar berada pada komoditas '
      +(k1?judulKom(k1.nama):'—')+' sebesar '+pct(k1?k1.ytd:null)+' persen.'});
  const y1=D.yy[0];
  P.push({j:'Inflasi year on year',
    t:'Serta angka inflasi Tahun ke Tahun untuk Kabupaten Kutai Kartanegara pada bulan '+bl+' sebesar '
      +pct(D.yoy)+' persen, jika dilihat dari komoditasnya, inflasi tahun ke tahun tertinggi berada pada komoditas '
      +(y1?judulKom(y1.nama):'—')+' sebesar '+pct(y1?y1.yoy:null)+' persen.'});
  P.push({j:'Penyumbang inflasi & deflasi (4.4)',
    t:'Secara keseluruhan, terdapat andil/sumbangan terbesar dari 20 komoditi yang menyebabkan '
      +(D.mtm>=0?'kenaikan':'penurunan')+' IHP terjadi pada bulan '+bl+' tahun '+th+' di Kabupaten Kutai Kartanegara. '
      +'Adapun penyumbang inflasi terbesar yaitu '+daftar(D.inf,5)+'. Selanjutnya penyumbang deflasi terbesar yaitu '
      +daftar(D.def,4)+'. Masing-masing nilai andil dapat dilihat pada Tabel 4.3 dan 4.4.'});
  const K=KALTIM[pidBulan(i)];
  if(K && K.baris && K.baris.some(r=>r.ihk!=null)){
    const rows=K.baris.slice(0,4).filter(r=>r.yoy!=null).sort((a,b2)=>b2.yoy-a.yoy);
    if(rows.length){
      const tt=rows[0], tr=rows[rows.length-1];
      P.push({j:'Pembuka 4.1 — Kaltim',
        t:'Pada '+bl+' '+th+', dari 4 Kabupaten/Kota cakupan IHK di Provinsi Kalimantan Timur secara y-on-y '
          +'mengalami inflasi. Inflasi y-on-y tertinggi terjadi di '+tt.nama+' sebesar '+pct(tt.yoy)
          +' persen dengan IHK sebesar '+pct(tt.ihk)+', sedangkan inflasi terendah terjadi di '+tr.nama
          +' sebesar '+pct(tr.yoy)+' persen dengan IHK sebesar '+pct(tr.ihk)+'.'});
    }
  }
  return P;
}

function renderPub(){
  const sel=document.getElementById('pubBulan'); if(!sel) return;
  const i=+sel.value; if(!(i>=0)||R.IHK.UMUM[i]==null){
    document.getElementById('pubFigs').innerHTML='<div class="fig"><div class="k">Belum ada data</div><div class="n">Pilih bulan yang datanya sudah lengkap.</div></div>';
    return; }
  const D=hitungPub(i);
  document.getElementById('pubNote').textContent='Bahan untuk publikasi '+namaBulan(i);

  /* angka utama */
  document.getElementById('pubFigs').innerHTML=
     '<div class="fig"><div class="k">IHP '+namaBulan(i)+'</div><div class="v">'+fmt(D.ihk,2)+'</div>'
    +'<div class="n">bulan lalu '+fmt(D.ihkLalu,2)+'</div></div>'
    +'<div class="fig"><div class="k">Inflasi m-to-m</div><div class="v '+cls(D.mtm)+'">'+pct(D.mtm)+'%</div>'
    +'<div class="n">'+(D.mtm>=0?'inflasi':'deflasi')+'</div></div>'
    +'<div class="fig"><div class="k">Inflasi kalender</div><div class="v '+cls(D.ytd)+'">'+pct(D.ytd)+'%</div>'
    +'<div class="n">terhadap Desember '+(PER[i].y-1)+'</div></div>'
    +'<div class="fig"><div class="k">Year on year</div><div class="v '+cls(D.yoy)+'">'+pct(D.yoy)+'%</div>'
    +'<div class="n">terhadap '+NAMA_BULAN[PER[i].m-1]+' '+(PER[i].y-1)+'</div></div>';

  /* narasi */
  const P=narasiPub(D);
  BAHAN.narasi=P.map(x=>x.t).join('\n\n');
  document.getElementById('pubNarasi').innerHTML = P.map((x,n)=>
    '<div class="par"><button class="cp" data-par="'+n+'">Salin</button>'
    +'<div class="eyebrow" style="margin-bottom:5px">'+esc(x.j)+'</div>'
    +'<div class="isi">'+esc(x.t)+'</div></div>').join('')
    + '<button class="btn small" id="btnNarasiSemua" type="button">Salin seluruh narasi</button>';

  /* tabel 4.2 */
  const h42=['20 Komoditas Terpilih','IHP Bulan '+NAMA_BULAN[PER[i].m-1],'Inflasi MtM','Inflasi KALEN','Inflasi YoY','Andil'];
  const r42=[['UMUM',D.ihk,D.mtm,D.ytd,D.yoy,R.AND.UMUM[i]]].concat(
    D.baris.map(r=>[r.nama,r.ihk,r.mtm,r.ytd,r.yoy,r.and]));
  document.getElementById('pubT42').innerHTML =
    '<thead><tr>'+h42.map((x,n)=>'<th class="'+(n?'':'l')+'">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'
    + r42.map((r,n)=>'<tr'+(n===0?' class="tot"':'')+'><td class="l">'+esc(r[0])+'</td>'
        + r.slice(1).map((v,k)=>'<td class="num '+(k===0?'':cls(v))+'">'+fmt(v,2)+'</td>').join('')+'</tr>').join('')
    + '</tbody>';
  BAHAN.t42=tsv([h42].concat(r42.map(r=>[r[0]].concat(r.slice(1).map(v=>fmt(v,2))))));

  /* tabel 4.3 & 4.4 */
  const mk=(el,list,judul,key)=>{
    const rows=list.map((r,n)=>[n+1,judulKom(r.nama),fmt(r.and,2)]);
    document.getElementById(el).innerHTML =
      '<thead><tr><th style="width:34px">No</th><th>'+judul+'</th><th style="width:74px">Andil</th></tr></thead><tbody>'
      + (rows.length? rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+esc(r[1])+'</td><td>'+r[2]+'</td></tr>').join('')
                    : '<tr><td colspan="3" style="text-align:left;color:var(--ink3)">Tidak ada</td></tr>')
      + '</tbody>';
    BAHAN[key]=tsv([['No',judul,'Andil']].concat(rows));
  };
  mk('pubT43',D.inf.slice(0,5),'Komoditas Inflasi','t43');
  mk('pubT44',D.def.slice(0,4),'Komoditas Deflasi','t44');

  /* gambar 4.1 */
  const me=bulanPubSemua(i,13);
  chartGaris('pubCh41', me.map(k=>({lab:NAMA_BULAN[PER[k].m-1].slice(0,3)+'-'+String(PER[k].y).slice(2), v:R.MTM.UMUM[k]})));
  BAHAN.g41=tsv([['Bulan','Inflasi m-to-m (%)']].concat(
    me.map(k=>[NAMA_BULAN[PER[k].m-1]+' '+PER[k].y, fmt(R.MTM.UMUM[k],2)])));

  /* kaltim */
  renderKaltim(i,D);

  /* infografis */
  const t3=D.inf.slice(0,3), d3=D.def.slice(0,3);
  const info=[['IHP '+namaBulan(i),fmt(D.ihk,2)],['M-to-M',pct(D.mtm)+'%'],['Kalender',pct(D.ytd)+'%'],
    ['Year-on-Year',pct(D.yoy)+'%'],
    ['Andil inflasi teratas',(t3[0]?judulKom(t3[0].nama.split('/')[0])+' '+fmt(t3[0].and,2):'–')],
    ['Andil deflasi terdalam',(d3[0]?judulKom(d3[0].nama.split('/')[0])+' '+fmt(d3[0].and,2):'–')]];
  document.getElementById('pubInfo').innerHTML=info.map(x=>
    '<div><div class="k">'+esc(x[0])+'</div><div class="v">'+esc(x[1])+'</div></div>').join('');
  BAHAN.info=tsv(info.concat([[]],[['Andil dominan (infografis)','']],
    t3.concat(d3).map(r=>[judulKom(r.nama.split('/')[0]),fmt(r.and,2)])));

  BAHAN.semua=['BAHAN PUBLIKASI IHP '+namaBulan(i).toUpperCase(),'','== NARASI ==',BAHAN.narasi,
    '','== TABEL 4.1 IHK & INFLASI KALTIM ==',BAHAN.t41||'(belum diisi)',
    '','== TABEL 4.2 ==',BAHAN.t42,
    '','== TABEL 4.3 ANDIL INFLASI ==',BAHAN.t43,
    '','== TABEL 4.4 ANDIL DEFLASI ==',BAHAN.t44,
    '','== GAMBAR 4.1 ==',BAHAN.g41,
    '','== GAMBAR 4.2 ==',BAHAN.g42||'(belum diisi)',
    '','== ANGKA INFOGRAFIS ==',BAHAN.info].join('\n');
}
function bulanPubSemua(i,n){
  const all=[]; for(let k=0;k<NPER;k++){ const p=PER[k];
    if(lastSlot[p.y+'-'+p.m]===k && R.IHK.UMUM[k]!=null && k<=i) all.push(k); }
  return all.slice(-n);
}
function chartGaris(id,data){
  const host=document.getElementById(id); if(!host) return;
  const v=data.filter(d=>d.v!=null&&isFinite(d.v));
  if(v.length<2){ host.innerHTML='<p class="note">Belum cukup data.</p>'; return; }
  const W=720,H=230,L=46,Rr=14,T=18,B=44;
  const vals=v.map(d=>d.v), lo=Math.min(...vals,0), hi=Math.max(...vals,0);
  const pad=(hi-lo)*0.18||0.5, y0=lo-pad, y1=hi+pad;
  const X=n=>L+(W-L-Rr)*(v.length===1?0.5:n/(v.length-1));
  const Y=x=>T+(H-T-B)*(1-(x-y0)/(y1-y0));
  let g='';
  for(let k=0;k<=4;k++){ const yy=T+(H-T-B)*k/4, val=y1-(y1-y0)*k/4;
    g+='<line x1="'+L+'" y1="'+yy.toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+yy.toFixed(1)+'" stroke="var(--line)" stroke-width="1"/>'
     + '<text x="'+(L-8)+'" y="'+(yy+3.5).toFixed(1)+'" text-anchor="end" font-size="10" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+fmt(val,2)+'</text>'; }
  g+='<line x1="'+L+'" y1="'+Y(0).toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--line2)" stroke-width="1.5"/>';
  g+='<polyline fill="none" stroke="var(--accent-mark)" stroke-width="2.2" stroke-linejoin="round" points="'
    + v.map((d,n)=>X(n).toFixed(1)+','+Y(d.v).toFixed(1)).join(' ')+'"/>';
  v.forEach((d,n)=>{
    g+='<circle cx="'+X(n).toFixed(1)+'" cy="'+Y(d.v).toFixed(1)+'" r="3.4" fill="var(--surface)" stroke="var(--accent-mark)" stroke-width="2"/>'
     + '<text x="'+X(n).toFixed(1)+'" y="'+(Y(d.v)-9).toFixed(1)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink)" font-family="Public Sans,sans-serif">'+fmt(d.v,2)+'</text>'
     + '<text x="'+X(n).toFixed(1)+'" y="'+(H-B+18)+'" text-anchor="middle" font-size="10" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+esc(d.lab)+'</text>'; });
  host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Inflasi bulanan">'+g+'</svg>';
}
function renderKaltim(i,D){
  const id=pidBulan(i);
  let K=KALTIM[id];
  if(!K){ K=KALTIM[id]={baris:KALTIM_BARIS.map(n=>({nama:n,ihk:null,yoy:null,mtm:null}))}; }
  const el=document.getElementById('pubT41');
  el.innerHTML='<thead><tr><th>Kabupaten / Kota</th><th style="width:92px">IHK</th>'
    +'<th style="width:92px">Inflasi y-on-y</th><th style="width:92px">Inflasi m-to-m</th></tr></thead><tbody>'
    + K.baris.map((r,n)=>'<tr'+(n===4?' class="prov"':'')+'><td>'+esc(r.nama)+'</td>'
      + ['ihk','yoy','mtm'].map(f=>'<td><input id="kt-'+n+'-'+f+'" inputmode="decimal" value="'
          +(r[f]!=null?fmt(r[f],2):'')+'" aria-label="'+esc(r.nama)+' '+f+'"></td>').join('')
      + '</tr>').join('')
    + '<tr class="prov"><td>Kab. Kutai Kartanegara</td><td>'+fmt(D.ihk,2)+'</td><td>'+fmt(D.yoy,2)
      +'</td><td>'+fmt(D.mtm,2)+'</td></tr></tbody>';
  K.baris.forEach((r,n)=>['ihk','yoy','mtm'].forEach(f=>{
    const inp=document.getElementById('kt-'+n+'-'+f); if(!inp) return;
    inp.addEventListener('input',()=>{ const t=inp.value.trim();
      const x = t? parseHarga(t) : null;
      r[f] = (typeof x==='number'&&isFinite(x)) ? x : null;
      jadwalSimpanKaltim(id); susunKaltim(i,D); });
  }));
  susunKaltim(i,D);
}
function susunKaltim(i,D){
  const K=KALTIM[pidBulan(i)]||{baris:[]};
  const rows=K.baris.map(r=>[r.nama, r.ihk!=null?fmt(r.ihk,2):'', r.yoy!=null?fmt(r.yoy,2):'', r.mtm!=null?fmt(r.mtm,2):'']);
  rows.push(['Kab. Kutai Kartanegara',fmt(D.ihk,2),fmt(D.yoy,2),fmt(D.mtm,2)]);
  BAHAN.t41=tsv([['Kabupaten/ Kota','IHK','Inflasi y-on-y (%)','Inflasi m-to-m (%)']].concat(rows));
  const isi=K.baris.filter(r=>r.mtm!=null);
  document.getElementById('pubT41note').textContent = isi.length
    ? (isi.length+' dari '+K.baris.length+' baris terisi · tersimpan otomatis')
    : 'Belum diisi — salin dari Berita Resmi Statistik BPS Kaltim bulan ini.';
  const bar=K.baris.filter(r=>r.mtm!=null).map(r=>({lab:singkat(r.nama), v:r.mtm}))
            .concat([{lab:'KUKAR', v:D.mtm, kita:true}]);
  chartBatang('pubCh42', bar);
  BAHAN.g42=tsv([['Wilayah','Inflasi m-to-m (%)']].concat(bar.map(x=>[x.lab,fmt(x.v,2)])));
  if(BAHAN.t42) renderPubBahanSemua(i);
}
function renderPubBahanSemua(i){
  BAHAN.semua=['BAHAN PUBLIKASI IHP '+namaBulan(i).toUpperCase(),'','== NARASI ==',BAHAN.narasi||'',
    '','== TABEL 4.1 IHK & INFLASI KALTIM ==',BAHAN.t41||'(belum diisi)',
    '','== TABEL 4.2 ==',BAHAN.t42||'',
    '','== TABEL 4.3 ANDIL INFLASI ==',BAHAN.t43||'',
    '','== TABEL 4.4 ANDIL DEFLASI ==',BAHAN.t44||'',
    '','== GAMBAR 4.1 ==',BAHAN.g41||'',
    '','== GAMBAR 4.2 ==',BAHAN.g42||'(belum diisi)',
    '','== ANGKA INFOGRAFIS ==',BAHAN.info||''].join('\n');
}
function singkat(n){
  const m={'Kota Balikpapan':'BPPN','Kota Samarinda':'SMR','Kab. Penajam Paser Utara':'PPU',
           'Kab. Berau':'BERAU','Provinsi KALTIM':'KALTIM'};
  return m[n]||n;
}
function chartBatang(id,data){
  const host=document.getElementById(id); if(!host) return;
  const v=data.filter(d=>d.v!=null&&isFinite(d.v));
  if(!v.length){ host.innerHTML='<p class="note">Isi Tabel 4.1 dulu untuk melihat perbandingan.</p>'; return; }
  const W=680,H=210,T=26,B=40,L=16,Rr=16;
  const vals=v.map(d=>d.v), lo=Math.min(...vals,0), hi=Math.max(...vals,0);
  const pad=(hi-lo)*0.22||0.2, y0=lo-pad, y1=hi+pad;
  const Y=x=>T+(H-T-B)*(1-(x-y0)/(y1-y0));
  const bw=(W-L-Rr)/v.length, bar=Math.min(64,bw*0.56);
  let g='<line x1="'+L+'" y1="'+Y(0).toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--line2)" stroke-width="1.5"/>';
  v.forEach((d,n)=>{
    const cx=L+bw*(n+0.5), y=Y(d.v), y0p=Y(0);
    const top=Math.min(y,y0p), h=Math.max(2,Math.abs(y-y0p));
    const warna = d.kita ? 'var(--accent-mark)' : (d.v>=0?'var(--up-mark)':'var(--down-mark)');
    g+='<rect x="'+(cx-bar/2).toFixed(1)+'" y="'+top.toFixed(1)+'" width="'+bar.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+warna+'"/>'
     + '<text x="'+cx.toFixed(1)+'" y="'+(d.v>=0?top-7:top+h+14).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)" font-family="Public Sans,sans-serif">'+fmt(d.v,2)+'</text>'
     + '<text x="'+cx.toFixed(1)+'" y="'+(H-B+20)+'" text-anchor="middle" font-size="10.5" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+esc(d.lab)+'</text>'; });
  host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Perbandingan inflasi se-Kaltim">'+g+'</svg>';
}
function isiSelectPub(){
  const ty=document.getElementById('pubTahun'), tb=document.getElementById('pubBulan');
  if(!ty||!tb) return;
  const idx=bulanPub();
  if(!idx.length){ ty.innerHTML=''; tb.innerHTML='<option value="-1">Belum ada bulan lengkap</option>'; return; }
  const tahun=[...new Set(idx.map(i=>PER[i].y))];
  const tLama=ty.value;
  ty.innerHTML=tahun.map(y=>'<option value="'+y+'">'+y+'</option>').join('');
  ty.value = tahun.includes(+tLama)? tLama : String(tahun[tahun.length-1]);
  const bLama=tb.value;
  const pilih=idx.filter(i=>PER[i].y===+ty.value);
  tb.innerHTML=pilih.map(i=>'<option value="'+i+'">'+NAMA_BULAN[PER[i].m-1]+'</option>').join('');
  if(bLama&&tb.querySelector('option[value="'+bLama+'"]')) tb.value=bLama;
  else tb.value=String(pilih[pilih.length-1]);
}
function setupPub(){
  const ty=document.getElementById('pubTahun'), tb=document.getElementById('pubBulan');
  if(!ty) return;
  ty.addEventListener('change',()=>{ isiSelectPub(); renderPub(); });
  tb.addEventListener('change',renderPub);
  document.getElementById('p-pub').addEventListener('click',e=>{
    const b=e.target.closest('[data-salin]');
    if(b){ salin(BAHAN[b.dataset.salin]||'', b); return; }
    const q=e.target.closest('[data-par]');
    if(q){ const n=+q.dataset.par, P=narasiPub(hitungPub(+document.getElementById('pubBulan').value));
      salin(P[n]?P[n].t:'', q); return; }
    if(e.target.id==='btnNarasiSemua'){ salin(BAHAN.narasi||'', e.target); }
  });
  document.getElementById('btnPubSemua').addEventListener('click',e=>salin(BAHAN.semua||'', e.target));
}
let _tKaltim=null;
function jadwalSimpanKaltim(id){
  clearTimeout(_tKaltim);
  _tKaltim=setTimeout(()=>simpanKaltim(id),900);
}
async function simpanKaltim(id){
  const K=KALTIM[id]; if(!K) return;
  const el=document.getElementById('pubT41note');
  if(!sb || !sesi){ if(el) el.textContent='Masuk dulu di tab Pengaturan supaya angka Kaltim tersimpan.'; return; }
  const { error } = await sb.from('publikasi_kaltim').upsert({
    bulan:id, kaltim:K.baris, diubah_oleh:sesi.user.email, diubah_pada:new Date().toISOString()
  },{ onConflict:'bulan' });
  if(error){ console.error(error); if(el) el.textContent='Gagal menyimpan angka Kaltim: '+error.message; }
  else if(el) el.textContent='Tersimpan '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}

/* ================= grafik ================= */
function monthEnds(n){ const out=[];
  for(let i=0;i<NPER;i++){ const p=PER[i]; if(lastSlot[p.y+'-'+p.m]===i && R.lengkap[i]) out.push(i); }
  return out.slice(-n); }
function tip(host){ let t=host.querySelector('.tip');
  if(!t){ t=document.createElement('div'); t.className='tip'; host.appendChild(t); } return t; }
function chartIhk(){
  const host=document.getElementById('chIhk'), idx=monthEnds(36);
  if(idx.length<2){ host.innerHTML='<p class="note">Belum cukup data.</p>'; return; }
  const W=760,Hh=250,L=46,Rr=14,T=14,B=30, vals=idx.map(i=>R.IHK.UMUM[i]);
  let lo=Math.min(...vals), hi=Math.max(...vals); const pad=(hi-lo||1)*0.18; lo-=pad; hi+=pad;
  const X=k=>L+(W-L-Rr)*(k/(idx.length-1)), Y=v=>T+(Hh-T-B)*(1-(v-lo)/(hi-lo));
  const ticks=[0,1,2,3,4].map(t=>lo+(hi-lo)*t/4);
  let g='',lbl='';
  ticks.forEach(t=>{ const y=Y(t).toFixed(1);
    g+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-Rr)+'" y2="'+y+'" stroke="var(--line)" stroke-width="1"/>';
    lbl+='<text x="'+(L-8)+'" y="'+(+y+4)+'" text-anchor="end" font-size="11" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+fmt(t,1)+'</text>'; });
  const pts=idx.map((i,k)=>X(k).toFixed(1)+','+Y(R.IHK.UMUM[i]).toFixed(1));
  const area='M'+pts[0]+'L'+pts.join('L')+'L'+X(idx.length-1).toFixed(1)+','+(Hh-B)+'L'+L+','+(Hh-B)+'Z';
  let xl=''; idx.forEach((i,k)=>{ if(k%6!==0&&k!==idx.length-1) return; const p=PER[i];
    xl+='<text x="'+X(k).toFixed(1)+'" y="'+(Hh-B+18)+'" text-anchor="middle" font-size="10.5" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+NAMA_BULAN[p.m-1].slice(0,3)+' '+String(p.y).slice(2)+'</text>'; });
  const last=idx.length-1;
  host.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Tren IHK Umum akhir bulan">'
    +'<defs><linearGradient id="gIhk" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0%" stop-color="var(--accent-mark)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--accent-mark)" stop-opacity="0"/></linearGradient></defs>'
    +g+'<path d="'+area+'" fill="url(#gIhk)"/>'
    +'<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--accent-mark)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    +'<circle cx="'+X(last).toFixed(1)+'" cy="'+Y(R.IHK.UMUM[idx[last]]).toFixed(1)+'" r="4" fill="var(--accent-mark)" stroke="var(--surface)" stroke-width="2"/>'
    +'<text x="'+(X(last)-6).toFixed(1)+'" y="'+(Y(R.IHK.UMUM[idx[last]])-14).toFixed(1)+'" text-anchor="end" font-size="12" font-weight="700" fill="var(--ink)" font-family="Public Sans,sans-serif">'+fmt(R.IHK.UMUM[idx[last]],2)+'</text>'
    +lbl+xl+'<line id="cr" x1="0" y1="'+T+'" x2="0" y2="'+(Hh-B)+'" stroke="var(--line2)" stroke-width="1" opacity="0"/>'
    +'<rect x="'+L+'" y="'+T+'" width="'+(W-L-Rr)+'" height="'+(Hh-T-B)+'" fill="transparent" id="ov"/></svg>';
  const t=tip(host), svg=host.querySelector('svg'), ov=host.querySelector('#ov'), cr=host.querySelector('#cr');
  ov.addEventListener('pointermove',e=>{ const bb=svg.getBoundingClientRect(), sx=(e.clientX-bb.left)/bb.width*W;
    let k=Math.round((sx-L)/((W-L-Rr)/(idx.length-1))); k=Math.max(0,Math.min(idx.length-1,k));
    const i=idx[k], p=PER[i]; cr.setAttribute('x1',X(k)); cr.setAttribute('x2',X(k)); cr.setAttribute('opacity','1');
    t.className='tip show'; t.innerHTML='<b>'+NAMA_BULAN[p.m-1]+' '+p.y+'</b>IHK '+fmt(R.IHK.UMUM[i],2)+' &middot; m-to-m '+sgn(R.MTM.UMUM[i],2)+'%';
    t.style.left=Math.max(0,Math.min(bb.width-t.offsetWidth, X(k)/W*bb.width-t.offsetWidth/2))+'px'; t.style.top='4px'; });
  ov.addEventListener('pointerleave',()=>{ t.className='tip'; cr.setAttribute('opacity','0'); });
}
function chartMtm(){
  const host=document.getElementById('chMtm'), idx=monthEnds(18);
  if(!idx.length){ host.innerHTML='<p class="note">Belum cukup data.</p>'; return; }
  const W=760,Hh=210,L=40,Rr=14,T=12,B=28;
  const vals=idx.map(i=>R.MTM.UMUM[i]||0), mx=Math.max(0.2,...vals.map(Math.abs))*1.25;
  const bw=(W-L-Rr)/idx.length, bar=Math.min(26,bw-6);
  const Y=v=>T+(Hh-T-B)*(1-(v+mx)/(2*mx)), zero=Y(0);
  let b='',xl='';
  idx.forEach((i,k)=>{ const v=R.MTM.UMUM[i]||0, x=L+bw*k+(bw-bar)/2;
    const y=Math.min(zero,Y(v)), h=Math.max(2,Math.abs(Y(v)-zero));
    b+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bar.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+(v>=0?'var(--up-mark)':'var(--down-mark)')+'" data-k="'+k+'"/>';
    if(k%3===0||k===idx.length-1){ const p=PER[i];
      xl+='<text x="'+(x+bar/2).toFixed(1)+'" y="'+(Hh-B+17)+'" text-anchor="middle" font-size="10.5" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+NAMA_BULAN[p.m-1].slice(0,3)+' '+String(p.y).slice(2)+'</text>'; } });
  host.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Inflasi bulanan">'
    +'<line x1="'+L+'" y1="'+zero.toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+zero.toFixed(1)+'" stroke="var(--line2)" stroke-width="1"/>'
    +'<text x="'+(L-8)+'" y="'+(zero+4).toFixed(1)+'" text-anchor="end" font-size="11" fill="var(--ink3)" font-family="Public Sans,sans-serif">0</text>'
    +'<text x="'+(L-8)+'" y="'+(T+10)+'" text-anchor="end" font-size="11" fill="var(--ink3)" font-family="Public Sans,sans-serif">'+fmt(mx,1)+'</text>'
    +'<text x="'+(L-8)+'" y="'+(Hh-B-2)+'" text-anchor="end" font-size="11" fill="var(--ink3)" font-family="Public Sans,sans-serif">−'+fmt(mx,1)+'</text>'
    +b+xl+'</svg>';
  const t=tip(host), svg=host.querySelector('svg');
  host.querySelectorAll('rect[data-k]').forEach(el=>{
    el.addEventListener('pointerenter',e=>{ const k=+el.dataset.k, i=idx[k], p=PER[i], bb=svg.getBoundingClientRect();
      t.className='tip show'; t.innerHTML='<b>'+NAMA_BULAN[p.m-1]+' '+p.y+'</b>'+sgn(R.MTM.UMUM[i],2)+'% &middot; andil '+sgn(R.AND.UMUM[i],2);
      const x=(+el.getAttribute('x')+ +el.getAttribute('width')/2)/W*bb.width;
      t.style.left=Math.max(0,Math.min(bb.width-t.offsetWidth,x-t.offsetWidth/2))+'px'; t.style.top='0px'; });
    el.addEventListener('pointerleave',()=>t.className='tip');
  });
}
function chartAndil(){
  const host=document.getElementById('chAndil'), i=+document.getElementById('perHasil').value;
  const p=PER[i];
  document.getElementById('andilNote').textContent=plabel(p)+' · sumbangan ke inflasi umum (poin persen)';
  const d=KOM.map(c=>({nm:c.nama.split('/')[0],a:R.AND[c.kode][i]})).filter(x=>x.a!=null&&Math.abs(x.a)>0.0001)
    .sort((a,b)=>Math.abs(b.a)-Math.abs(a.a)).slice(0,12);
  if(!d.length){ host.innerHTML='<p class="note">Tidak ada andil yang tercatat pada periode ini.</p>'; return; }
  const W=760, rowH=26, T=8, Hh=T*2+d.length*rowH, L=182, Rr=52;
  const mx=Math.max(...d.map(x=>Math.abs(x.a)))*1.15||1;
  const X=v=>L+(W-L-Rr)/2*(1+v/mx), zero=X(0);
  let s='<line x1="'+zero.toFixed(1)+'" y1="'+T+'" x2="'+zero.toFixed(1)+'" y2="'+(Hh-T)+'" stroke="var(--line2)" stroke-width="1"/>';
  d.forEach((x,k)=>{ const y=T+k*rowH+4, h=rowH-10, xa=Math.min(zero,X(x.a)), w=Math.max(2,Math.abs(X(x.a)-zero));
    s+='<rect x="'+xa.toFixed(1)+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+h+'" rx="3" fill="'+(x.a>=0?'var(--up-mark)':'var(--down-mark)')+'"/>'
      +'<text x="'+(L-10)+'" y="'+(y+h-3)+'" text-anchor="end" font-size="11.5" fill="var(--ink2)" font-family="Public Sans,sans-serif">'+esc(x.nm.slice(0,22))+'</text>'
      +'<text x="'+(x.a>=0?(xa+w+7):(xa-7)).toFixed(1)+'" y="'+(y+h-3)+'" text-anchor="'+(x.a>=0?'start':'end')+'" font-size="11.5" font-weight="600" fill="var(--ink)" font-family="Public Sans,sans-serif">'+sgn(x.a,2)+'</text>'; });
  host.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Andil komoditas">'+s+'</svg>';
}

/* ================= data & ekspor ================= */
function renderWarisan(){
  const el=document.getElementById('tblWarisan'); if(!el) return;
  const NM={IHK:'IHK',MTM:'m-to-m',YtD:'YtD',YoY:'YoY',andil:'andil'};
  const SEBAB={
    '2025':'Basis YoY dulu menunjuk 3 bulan meleset, akibat rumus diseret melewati peralihan kolom bulanan ke mingguan Mei 2024.',
    '2026-06':'Rantai NK dulu bersandar ke minggu sebelumnya di bulan yang sama, padahal RH-nya ke minggu ke-4 bulan lalu.',
    '2026-07':'Sama seperti Juni. Harga Juli sendiri memakai data versi 2 yang benar, jadi angkanya tidak bisa dipaksa kembali ke versi 1.'
  };
  const kunci=p=> p.slice(0,4)==='2025' ? '2025' : p.slice(0,7);
  let last='', lastK='';
  const baris=KOREKSI.map(r=>{
    const show=r.p!==last; last=r.p;
    const k=kunci(r.p), showS = k!==lastK; lastK=k;
    const lab=(()=>{ const i=PER.findIndex(q=>pid(q)===r.p); return i>=0?PER[i].label:r.p; })();
    const d=r.baru-r.lama, dg=(r.m==='IHK')?2:(Math.abs(d)<0.1?4:2);
    return '<tr><td class="l">'+(show?esc(lab):'')+'</td><td class="l">'+(NM[r.m]||r.m)+'</td>'
      +'<td class="num">'+fmt(r.lama,dg)+'</td><td class="num">'+fmt(r.baru,dg)+'</td>'
      +'<td class="num '+cls(d)+'">'+sgn(d,dg)+'</td>'
      +'<td class="l"><span class="note">'+(showS?esc(SEBAB[k]||''):'')+'</span></td></tr>';
  }).join('');
  el.innerHTML='<thead><tr><th class="l">Periode</th><th class="l">Angka</th><th>Versi 1</th><th>Setelah dibetulkan</th><th>Selisih</th><th class="l" style="min-width:260px">Sebab</th></tr></thead><tbody>'
    + baris + '</tbody>';
}
function renderData(){
  const from=+document.getElementById('dataFrom').value;
  const idx=[]; for(let i=from;i<NPER;i++) if(R.H[KOM[0].kode][i]!=null||terisi(i)) idx.push(i);
  const head='<thead><tr><th class="l">Komoditas</th>'+idx.map(i=>'<th>'+PER[i].label+'</th>').join('')+'</tr></thead>';
  const body='<tbody>'+KOM.map(c=>'<tr><td class="l"><span class="nm">'+esc(c.nama)+'</span></td>'
    +idx.map(i=>'<td class="num">'+fmtRp(R.H[c.kode][i])+'</td>').join('')+'</tr>').join('')+'</tbody>';
  document.getElementById('tblData').innerHTML=head+body;
}
function tabel(metric,label){
  const idx=[]; for(let i=0;i<NPER;i++) if(R.IHK.UMUM[i]!=null||R.H[KOM[0].kode][i]!=null) idx.push(i);
  const rows=[['Kode','Komoditas'].concat(idx.map(i=>PER[i].label))];
  if(metric!=='H') rows.push(['0','UMUM'].concat(idx.map(i=>R[metric].UMUM[i])));
  KOM.forEach(c=>rows.push([c.kode,c.nama].concat(idx.map(i=>R[metric][c.kode][i]))));
  return rows;
}
function tabelLapangan(){
  const kom={}; KOM.forEach(c=>kom[c.kode]=c.nama);
  const head=['Periode','Kode','Komoditas','Kualitas / merk','Satuan'];
  PENC.forEach(n=>{ for(let t=1;t<=3;t++) head.push(n+' · Toko '+t); });
  head.push('Geomean kualitas','Harga komoditas (geomean)');
  const rows=[head];
  const semua=Object.assign({},LAPSEED,OVRLAP);
  PER.forEach(p=>{ const b=semua[pid(p)]; if(!b) return;
    KUAL.forEach(k=>{ const key=k.kode+'#'+k.ki, arr=b[key]||[];
      const r=[p.label,k.kode,(kom[k.kode]||''),k.nama,(k.satuan||'')];
      for(let x=0;x<NSLOT;x++){ const v=arr[x]; r.push((typeof v==='number'&&isFinite(v))?v:''); }
      const g=gmean(arr); r.push(g!=null?Math.round(g*10000)/10000:'');
      const h=(k.ki===0)?hargaDariLapangan(b,k.kode):null;
      r.push(h!=null?Math.round(h*10000)/10000:'');
      rows.push(r); }); });
  return rows.length>1?rows:[head,['(belum ada entri lapangan)']];
}
function csvOf(rows){ return rows.map(r=>r.map(v=>{
  if(v==null) return ''; const s=typeof v==='number'?String(v).replace('.',','):String(v);
  return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(';')).join('\r\n'); }
async function unduh(name,data){
  try{
    const blob = data instanceof Blob ? data : new Blob([data],
      {type: /\.csv$/i.test(name)? 'text/csv;charset=utf-8' : 'application/octet-stream'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
    toast('Berkas diunduh');
  }catch(e){ console.error(e); toast('Gagal menyiapkan berkas'); }
}
function setupEkspor(){
  document.getElementById('expnote').textContent = window.XLSX ? '' : 'Format Excel sedang tidak tersedia — pakai CSV.';
  document.getElementById('btnXlsx').addEventListener('click',()=>{
    if(!window.XLSX){ toast('Pakai CSV untuk saat ini'); return; }
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tabelLapangan()), 'Entri Lapangan');
    [['H','Harga'],['IHK','IHK'],['MTM','m-to-m'],['YTD','YtD'],['YOY','YoY'],['AND','Andil']].forEach(([m,nm])=>
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tabel(m,nm)), nm));
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    unduh('IHP-Kukar-'+new Date().toISOString().slice(0,10)+'.xlsx', buf);
  });
  document.getElementById('btnCsv').addEventListener('click',()=>{
    const parts=['# ENTRI LAPANGAN\r\n'+csvOf(tabelLapangan())].concat(
      [['H','HARGA'],['IHK','IHK'],['MTM','M-TO-M'],['YTD','YTD'],['YOY','YOY'],['AND','ANDIL']]
        .map(([m,nm])=>'# '+nm+'\r\n'+csvOf(tabel(m,nm)))).join('\r\n\r\n');
    unduh('IHP-Kukar-'+new Date().toISOString().slice(0,10)+'.csv','﻿'+parts);
  });
}

/* ================= tab & boot ================= */
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
function pilihTab(id){
  ['hasil','entri','tren','pub','data'].forEach(n=>{
    const b=document.getElementById('tab-'+n), p=document.getElementById('p-'+n);
    const on=n===id; b.setAttribute('aria-selected',on?'true':'false'); p.hidden=!on; });
  if(id==='tren'){ chartIhk(); chartMtm(); chartAndil(); }
  if(id==='pub') renderPub();
  if(id==='data'){ renderData(); renderWarisan(); }
}
function renderBanner(){
  const i=idxBerikut(), p=PER[i], el=document.getElementById('nextbanner');
  el.innerHTML='<div class="banner"><span>Periode berikutnya yang belum diisi: <b>'+plabel(p)+'</b></span>'
    +'<button class="btn small" id="goEntri" type="button">Isi sekarang</button></div>';
  document.getElementById('goEntri').addEventListener('click',()=>{
    document.getElementById('perEntri').value=i; setPeriodeEntri(i); pilihTab('entri'); });
}
function refresh(keep){
  R=hitung();
  const hs=document.getElementById('perHasil'), en=document.getElementById('perEntri'), df=document.getElementById('dataFrom');
  const hv=hs.value, ev=en.value, dv=df.value;
  isiSelect(hs, i=>R.lengkap[i]||terisi(i));
  isiSelect(en, i=>i>=NBASE-4);
  df.innerHTML=''; PER.forEach((p,i)=>{ if(p.weekly&&p.w!==1) return; const o=document.createElement('option'); o.value=i; o.textContent=plabel(p); df.appendChild(o); });
  if(hv&&hs.querySelector('option[value="'+hv+'"]')) hs.value=hv; else hs.value=String(idxTerakhir());
  if(ev&&en.querySelector('option[value="'+ev+'"]')) en.value=ev; else en.value=String(idxBerikut());
  if(dv&&df.querySelector('option[value="'+dv+'"]')) df.value=dv; else { const opts=[...df.options]; df.value=opts.length?opts[Math.max(0,opts.length-8)].value:'0'; }
  renderHasil(); renderBanner();
  if(!document.getElementById('p-entri').hidden) renderEntri();
  if(!document.getElementById('p-tren').hidden){ chartIhk(); chartMtm(); chartAndil(); }
  isiSelectPub();
  if(!document.getElementById('p-pub').hidden) renderPub();
  if(!document.getElementById('p-data').hidden){ renderData(); renderWarisan(); }
}
let sudahMulai=false;
function start(){
  if(sudahMulai) return; sudahMulai=true;
  R=hitung();
  document.getElementById('perHasil').addEventListener('change',()=>{ renderHasil(); if(!document.getElementById('p-tren').hidden) chartAndil(); });
  document.getElementById('perEntri').addEventListener('change',e=>setPeriodeEntri(+e.target.value));
  ['hasil','entri','tren','pub','data'].forEach(n=>document.getElementById('tab-'+n).addEventListener('click',()=>{
    if(n==='entri'&&draftPid===null) setPeriodeEntri(+document.getElementById('perEntri').value); pilihTab(n); }));
  document.getElementById('btnSalin').addEventListener('click',()=>{
    const i=+document.getElementById('perEntri').value;
    const b = i>0 ? lapPeriode(pid(PER[i-1])) : null;
    if(!b){ toast('Minggu sebelumnya belum punya entri lapangan'); return; }
    KUAL.forEach(k=>{ const key=k.kode+'#'+k.ki, src=b[key]||[];
      draft[key]=Array.from({length:NSLOT},(_,x)=>{ const v=src[x];
        return (typeof v==='number'&&isFinite(v)&&v>0)? v : null; }); });
    renderEntri(); toast('Harga '+plabel(PER[i-1])+' disalin — ubah yang berubah'); });
  document.getElementById('btnKosong').addEventListener('click',()=>{
    if(!confirm('Kosongkan seluruh 52 baris kualitas untuk periode ini?')) return;
    KUAL.forEach(k=>{ draft[k.kode+'#'+k.ki]=Array(NSLOT).fill(null); });
    renderEntri(); toast('Formulir dikosongkan'); });
  const sp=document.getElementById('selPenc');
  sp.innerHTML='<option value="-1">Semua pencacah · 15 kolom</option>'
    + PENC.map((n,i)=>'<option value="'+i+'">'+esc(n)+' · 3 toko</option>').join('');
  sp.addEventListener('change',e=>{ pencAktif=+e.target.value; renderEntri(); });
  document.getElementById('btnSimpan').addEventListener('click',simpan);
  document.getElementById('themebtn').addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-theme');
    const dark = cur ? cur==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark?'light':'dark');
    document.getElementById('themebtn').textContent = dark?'Mode gelap':'Mode terang';
    if(!document.getElementById('p-tren').hidden){ chartIhk(); chartMtm(); chartAndil(); } });
  setupEkspor();
  setupPub();
  setupMasuk();
  refresh();
  pilihTab('hasil');
  connect();
}
async function simpan(){
  if(!sb || !sesi){ toast('Masuk dulu di tab Pengaturan untuk menyimpan'); return; }
  const i=+document.getElementById('perEntri').value, p=PER[i], id=pid(p);
  const data={}, harga={};
  KUAL.forEach(k=>{ const key=k.kode+'#'+k.ki;
    const arr=Array.from({length:NSLOT},(_,x)=>{ const v=(draft[key]||[])[x];
      return (typeof v==='number'&&isFinite(v)&&v>0)? v : null; });
    if(arr.some(v=>v!=null)) data[key]=arr; });
  KOM.forEach(c=>{ const v=hargaDariLapangan(draft,c.kode); if(v!=null) harga[c.kode]=v; });
  const btn=document.getElementById('btnSimpan'); btn.disabled=true; btn.textContent='Menyimpan…';
  const { error } = await sb.from('entri_lapangan').upsert({
    periode:id, tahun:p.y, bulan:p.m, minggu:p.w, label:p.label, data, harga,
    baris:Object.keys(data).length, diubah_oleh: sesi.user.email,
    diubah_pada: new Date().toISOString()
  },{ onConflict:'periode' });
  if(error){ console.error(error); toast('Gagal menyimpan: '+error.message); }
  else { toast(plabel(p)+' tersimpan — '+Object.keys(data).length+' baris kualitas'); await muatData(); }
  btn.textContent='Simpan periode'; updateEntri();
}
async function connect(){
  const cfg = window.IHP_CONFIG || {};
  if(!cfg.url || !window.supabase || String(cfg.url).indexOf('ISI-')===0){
    statusChip('warn','Mode baca saja — Supabase belum diatur'); updateEntri(); return;
  }
  sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  const { data:{ session } } = await sb.auth.getSession();
  sesi = session || null; renderMasuk();
  sb.auth.onAuthStateChange((_e,s)=>{ sesi=s||null; renderMasuk(); muatData(); updateEntri(); });
  await muatData();
  sb.channel('ihp_realtime')
    .on('postgres_changes',{ event:'*', schema:'public', table:'entri_lapangan' }, muatData)
    .on('postgres_changes',{ event:'*', schema:'public', table:'entri_harga'    }, muatData)
    .on('postgres_changes',{ event:'*', schema:'public', table:'publikasi_kaltim' }, muatData)
    .subscribe();
  updateEntri();
}
function statusChip(kind,txt){
  const chip=document.getElementById('dbchip');
  chip.className = 'chip'+(kind==='on'?' on':kind==='warn'?' warn':'');
  document.getElementById('dbtxt').textContent = txt;
}
async function muatData(){
  if(!sb) return;
  const a = await sb.from('entri_lapangan').select('periode,data');
  if(a.error){ console.error(a.error); statusChip('warn','Gagal memuat entri lapangan'); }
  else { OVRLAP={}; (a.data||[]).forEach(r=>{ if(r && r.data) OVRLAP[r.periode]=r.data; }); }
  const b = await sb.from('entri_harga').select('periode,harga');
  if(!b.error){ OVR={}; (b.data||[]).forEach(r=>{ if(r && r.harga) OVR[r.periode]=r.harga; }); }
  const c = await sb.from('publikasi_kaltim').select('bulan,kaltim');
  if(!c.error){ (c.data||[]).forEach(r=>{ if(r && Array.isArray(r.kaltim)) KALTIM[r.bulan]={baris:r.kaltim}; });
    if(!document.getElementById('p-pub').hidden) renderPub(); }
  const n=Object.keys(OVRLAP).length;
  statusChip('on', (sesi? sesi.user.email : 'mode baca') + (n? ' · '+n+' periode lapangan' : ''));
  refresh();
}
function renderMasuk(){
  const f=document.getElementById('formMasuk'), k=document.getElementById('barKeluar');
  if(!f||!k) return;
  f.hidden = !!sesi; k.hidden = !sesi;
  if(sesi) document.getElementById('emailAktif').textContent = sesi.user.email;
}
function setupMasuk(){
  const f=document.getElementById('formMasuk'); if(!f) return;
  f.addEventListener('submit', async e=>{
    e.preventDefault();
    const pesan=document.getElementById('pesanMasuk'); pesan.textContent='';
    if(!sb){ pesan.textContent='Supabase belum diatur di assets/config.js'; return; }
    const btn=document.getElementById('btnMasuk'); btn.disabled=true; btn.textContent='Masuk…';
    const { error } = await sb.auth.signInWithPassword({
      email: document.getElementById('inEmail').value.trim(),
      password: document.getElementById('inSandi').value });
    btn.disabled=false; btn.textContent='Masuk';
    if(error) pesan.textContent = 'Gagal masuk: '+error.message;
    else { document.getElementById('inSandi').value=''; toast('Berhasil masuk'); }
  });
  document.getElementById('btnKeluar').addEventListener('click', async ()=>{
    if(sb) await sb.auth.signOut(); toast('Sudah keluar');
  });
}
document.addEventListener('DOMContentLoaded', start);
if(document.readyState!=='loading') start();
