"use strict";
/* IHP Kukar — aplikasi Indeks Harga Pasar Kabupaten Kutai Kartanegara
   Data riwayat: data/baseline.json  |  Entri baru: Supabase (tabel entri_harga) */
const BASE = window.BASE;
const CFG  = window.IHP_CONFIG || {};
let sb = null, sesi = null;

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

/* ================= state ================= */
let OVR={};                 // pid -> {kode: harga}
let META={};                // pid -> {oleh, waktu}
let draft={}, draftPid=null;
let R=null;                 // hasil hitung
let db=null, downloads=null;

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
  return M;
}

/* ================= mesin hitung ================= */
function hitung(){
  const H=hargaMatrix();
  const RH={}, NK={};
  for(const c of KOM){
    const p=H[c.kode], rh=new Array(NPER).fill(null), nk=new Array(NPER).fill(null);
    for(let i=0;i<NPER;i++){ const b=BIDX[i];
      if(b>=0 && p[i]!=null && p[b]!=null && p[b]!==0) rh[i]=r4(p[i]/p[b]*100); }
    nk[ANC]=c.nk0;
    for(let i=ANC+1;i<NPER;i++){ const b=BIDX[i];
      if(b>=0 && rh[i]!=null && nk[b]!=null) nk[i]=r2(rh[i]*nk[b]/100); }
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
    const b=BIDX[i], d=DIDX[i], y=YIDX[i];
    for(const k of rows){
      const v=IHK[k][i];
      if(v==null) continue;
      if(b>=0&&IHK[k][b]) MTM[k][i]=(v/IHK[k][b]-1)*100;
      if(d>=0&&IHK[k][d]) YTD[k][i]=(v/IHK[k][d]-1)*100;
      if(y>=0&&IHK[k][y]) YOY[k][i]=(v/IHK[k][y]-1)*100;
    }
    if(b>=0&&NKT[b]){
      for(const c of KOM){ if(NK[c.kode][b]!=null) WN[c.kode][i]=NK[c.kode][b]/NKT[b]*100; }
      WN.UMUM[i]=100;
    }
    for(const k of rows){ if(WN[k][i]!=null&&MTM[k][i]!=null) AND[k][i]=r2(WN[k][i]*MTM[k][i]/100); }
  }
  return {H,RH,NK,NKT,IHK,MTM,YTD,YOY,WN,AND,lengkap};
}
function terisi(i){ const id=pid(PER[i]);
  if(i<NBASE) return true;
  const v=OVR[id]; if(!v) return false;
  return KOM.every(c=>typeof v[c.kode]==='number'&&isFinite(v[c.kode])); }
function idxBerikut(){ for(let i=0;i<NPER;i++) if(!terisi(i)) return i; return NPER-1; }
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
function periksa(i,vals){
  const H=R.H, out=[];
  for(const c of KOM){
    const v=vals[c.kode], k=c.kode, nm=c.nama;
    if(v==null||v===''){ out.push({k,nm,lv:'err',empty:true,t:'Harga belum diisi'}); continue; }
    if(!isFinite(v)||v<=0){ out.push({k,nm,lv:'err',t:'Bukan angka yang sah'}); continue; }
    const prev=i>0?H[k][i-1]:null;
    if(prev){
      const rr=v/prev, d=(rr-1)*100;
      if(rr>=3||rr<=1/3) out.push({k,nm,lv:'err',t:'Beda '+sgn(d,0)+'% dari minggu lalu ('+fmtRp(prev)+') — periksa jumlah digit'});
      else if(Math.abs(d)>25) out.push({k,nm,lv:'wrn',t:'Lompat '+sgn(d,1)+'% dari minggu lalu ('+fmtRp(prev)+')'});
    }
    const hist=[]; for(let j=Math.max(0,i-12);j<i;j++) if(H[k][j]!=null) hist.push(H[k][j]);
    if(hist.length>=6){
      const s=hist.slice().sort((a,b)=>a-b), med=s[Math.floor(s.length/2)];
      if(med>0){ const dv=(v/med-1)*100;
        if(Math.abs(dv)>35 && !out.some(o=>o.k===k)) out.push({k,nm,lv:'wrn',t:sgn(dv,0)+'% dari level 12 minggu terakhir (median '+fmtRp(med)+')'}); }
    }
    let sama=0; for(let j=i-1;j>=0&&H[k][j]!=null;j--){ if(Math.abs(H[k][j]-v)<1e-6) sama++; else break; }
    if(sama>=6 && !out.some(o=>o.k===k)) out.push({k,nm,lv:'inf',t:'Harga tidak berubah '+(sama+1)+' minggu — pastikan bukan salinan'});
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
  if(draftPid!==id){ draftPid=id; draft={}; const o=OVR[id]; if(o) for(const c of KOM) if(o[c.kode]!=null) draft[c.kode]=o[c.kode]; }
  renderEntri();
}
function renderEntri(){
  const i=+document.getElementById('perEntri').value, H=R.H;
  const rows=KOM.map((c,n)=>{
    const k=c.kode, prev=i>0?H[k][i-1]:null, v=draft[k];
    const d=(v!=null&&prev)?((v/prev-1)*100):null;
    return '<tr data-k="'+k+'"><td class="l num" style="color:var(--ink3)">'+(n+1)+'</td>'
      +'<td class="l"><span class="nm">'+esc(c.nama)+'</span><span class="kode mono">'+k+'</span></td>'
      +'<td class="num" style="color:var(--ink2)">'+fmtRp(prev)+'</td>'
      +'<td><input class="inp" inputmode="decimal" id="in-'+k+'" value="'+(v!=null&&isFinite(v)?v.toLocaleString('id-ID',{maximumFractionDigits:2,useGrouping:false}):'')+'" aria-label="Harga '+esc(c.nama)+'"><div class="echo" id="ec-'+k+'"></div></td>'
      +'<td class="num '+cls(d)+'" id="dl-'+k+'">'+(d==null?'–':sgn(d,1)+'%')+'</td>'
      +'<td class="l" id="fl-'+k+'"></td></tr>';
  }).join('');
  document.getElementById('tblEntri').innerHTML=
    '<thead><tr><th class="l">#</th><th class="l">Komoditas</th><th>Minggu lalu</th><th class="l">Harga baru</th><th>Δ</th><th class="l">Catatan</th></tr></thead><tbody>'+rows+'</tbody>';
  KOM.forEach(c=>{
    const el=document.getElementById('in-'+c.kode);
    el.addEventListener('input',()=>{ const raw=el.value.trim();
      if(!raw){ delete draft[c.kode]; } else { const v=parseHarga(raw); draft[c.kode]=isFinite(v)?v:NaN; }
      updateEntri(); });
  });
  updateEntri();
}
function updateEntri(){
  const i=+document.getElementById('perEntri').value;
  const iss=periksa(i,draft);
  const byK={}; iss.forEach(o=>{ if(!byK[o.k]) byK[o.k]=o; });
  let n=0;
  KOM.forEach(c=>{
    const v=draft[c.kode], el=document.getElementById('in-'+c.kode), ec=document.getElementById('ec-'+c.kode),
          fl=document.getElementById('fl-'+c.kode), dl=document.getElementById('dl-'+c.kode);
    if(!el) return;
    const o=byK[c.kode], kosong=!!(o&&o.empty);
    el.classList.toggle('bad', !!(o&&o.lv==='err'&&!kosong));
    el.classList.toggle('warn', !!(o&&o.lv==='wrn'));
    ec.textContent = (v!=null&&isFinite(v)) ? '= '+fmtRp(v) : '';
    fl.innerHTML = (o&&!kosong) ? '<span class="flag '+(o.lv==='err'?'err':o.lv==='wrn'?'wrn':'inf')+'">'+esc(o.t)+'</span>'
                     : (v!=null&&isFinite(v) ? '<span class="flag ok">wajar</span>' : '');
    const prv=i>0?R.H[c.kode][i-1]:null, dd=(v!=null&&isFinite(v)&&prv)?((v/prv-1)*100):null;
    if(dl){ dl.textContent = dd==null?'–':sgn(dd,1)+'%'; dl.className='num '+cls(dd); }
    if(v!=null&&isFinite(v)&&v>0) n++;
  });
  document.getElementById('progbar').style.width=(n/KOM.length*100)+'%';
  document.getElementById('progtxt').textContent=n+'/'+KOM.length;
  const kosong=iss.filter(o=>o.empty), errs=iss.filter(o=>o.lv==='err'&&!o.empty), wrns=iss.filter(o=>o.lv==='wrn');
  const ch=document.getElementById('ischip'); ch.className='chip'+(errs.length?' warn':'');
  document.getElementById('istxt').textContent = errs.length? errs.length+' perlu dicek' : (wrns.length? wrns.length+' peringatan':'bersih');
  const list=iss.filter(o=>!o.empty).slice(0,40);
  const head = kosong.length? '<div class="issue">'+kosong.length+' komoditas belum diisi</div>' : '';
  document.getElementById('issues').innerHTML = (head+list.map(o=>'<div class="issue '+(o.lv==='err'?'err':o.lv==='wrn'?'wrn':'')+'"><b>'+esc(o.nm.split('/')[0])+'</b> — '+esc(o.t)+'</div>').join(''))
    || '<p class="note">Semua harga masuk akal terhadap riwayatnya.</p>';
  // pratinjau dampak
  const kv=document.getElementById('kvlive');
  if(n===KOM.length && !iss.some(o=>o.lv==='err')){
    const sim=simulasi(i,draft);
    const top=KOM.map(c=>({nm:c.nama,a:sim.and[c.kode]})).filter(x=>x.a!=null).sort((a,b)=>Math.abs(b.a)-Math.abs(a.a))[0];
    kv.innerHTML=
      '<div class="kv"><span class="k">IHK Umum</span><span class="v">'+fmt(sim.ihk,2)+'</span></div>'
      +'<div class="kv"><span class="k">Inflasi m-to-m</span><span class="v '+cls(sim.mtm)+'">'+sgn(sim.mtm,2)+'%</span></div>'
      +'<div class="kv"><span class="k">Andil terbesar</span><span class="v '+cls(top?top.a:null)+'">'+(top?esc(top.nm.split('/')[0].slice(0,14))+' '+sgn(top.a,2):'–')+'</span></div>';
  } else {
    kv.innerHTML='<p class="note">Lengkapi 20 harga untuk melihat pratinjau IHK dan inflasi sebelum menyimpan.</p>';
  }
  const bisa = n===KOM.length && !iss.some(o=>o.lv==='err');
  const btn=document.getElementById('btnSimpan'); btn.disabled=!bisa||!sesi;
  document.getElementById('savenote').textContent = !sesi ? 'Masuk dulu di tab Pengaturan untuk bisa menyimpan.'
    : (kosong.length ? kosong.length+' harga belum diisi.'
    : (errs.length ? 'Bereskan '+errs.length+' catatan merah dulu.'
    : (wrns.length? wrns.length+' peringatan kuning — simpan bila angkanya memang benar.' : 'Siap disimpan.')));
}
function simulasi(i,vals){
  const b=BIDX[i]; const out={and:{}};
  if(b<0||R.NKT[b]==null) return {ihk:null,mtm:null,and:{}};
  let s=0;
  for(const c of KOM){
    const k=c.kode, pb=R.H[k][b], nkb=R.NK[k][b];
    if(!pb||nkb==null||vals[k]==null){ return {ihk:null,mtm:null,and:{}}; }
    const rh=r4(vals[k]/pb*100), nk=r2(rh*nkb/100); s+=nk;
    const ihk=r2(nk/c.nk0*100), ihkb=r2(nkb/c.nk0*100);
    const mtm=ihkb?(ihk/ihkb-1)*100:null, wn=nkb/R.NKT[b]*100;
    out.and[k]= mtm==null?null:r2(wn*mtm/100);
  }
  const ihk=r2(s/NK0T*100), ihkb=r2(R.NKT[b]/NK0T*100);
  return {ihk, mtm: ihkb?(ihk/ihkb-1)*100:null, and:out.and};
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
function csvOf(rows){ return rows.map(r=>r.map(v=>{
  if(v==null) return ''; const s=typeof v==='number'?String(v).replace('.',','):String(v);
  return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(';')).join('\r\n'); }
function unduh(name,data){
  try{
    const blob = data instanceof Blob ? data : new Blob([data],{type:'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('Berkas diunduh');
  }catch(e){ toast('Gagal menyiapkan berkas'); }
}
function setupEkspor(){
  document.getElementById('expnote').textContent = window.XLSX ? '' : 'Format Excel sedang tidak tersedia — pakai CSV.';
  document.getElementById('btnXlsx').addEventListener('click',()=>{
    if(!window.XLSX){ toast('Pakai CSV untuk saat ini'); return; }
    const wb=XLSX.utils.book_new();
    [['H','Harga'],['IHK','IHK'],['MTM','m-to-m'],['YTD','YtD'],['YOY','YoY'],['AND','Andil']].forEach(([m,nm])=>
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tabel(m,nm)), nm));
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    unduh('IHP-Kukar-'+new Date().toISOString().slice(0,10)+'.xlsx', buf);
  });
  document.getElementById('btnCsv').addEventListener('click',()=>{
    const parts=[['H','HARGA'],['IHK','IHK'],['MTM','M-TO-M'],['YTD','YTD'],['YOY','YOY'],['AND','ANDIL']]
      .map(([m,nm])=>'# '+nm+'\r\n'+csvOf(tabel(m,nm))).join('\r\n\r\n');
    unduh('IHP-Kukar-'+new Date().toISOString().slice(0,10)+'.csv','﻿'+parts);
  });
}

/* ================= tab & boot ================= */
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
function pilihTab(id){
  ['hasil','entri','tren','data','atur'].forEach(n=>{
    const b=document.getElementById('tab-'+n), p=document.getElementById('p-'+n);
    const on=n===id; b.setAttribute('aria-selected',on?'true':'false'); p.hidden=!on; });
  if(id==='tren'){ chartIhk(); chartMtm(); chartAndil(); }
  if(id==='data') renderData();
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
  isiSelect(en, i=>i>=NBASE-12);
  df.innerHTML=''; PER.forEach((p,i)=>{ if(p.weekly&&p.w!==1) return; const o=document.createElement('option'); o.value=i; o.textContent=plabel(p); df.appendChild(o); });
  if(hv&&hs.querySelector('option[value="'+hv+'"]')) hs.value=hv; else hs.value=String(idxTerakhir());
  if(ev&&en.querySelector('option[value="'+ev+'"]')) en.value=ev; else en.value=String(idxBerikut());
  if(dv&&df.querySelector('option[value="'+dv+'"]')) df.value=dv; else { const opts=[...df.options]; df.value=opts.length?opts[Math.max(0,opts.length-8)].value:'0'; }
  renderHasil(); renderBanner();
  if(!document.getElementById('p-entri').hidden) renderEntri();
  if(!document.getElementById('p-tren').hidden){ chartIhk(); chartMtm(); chartAndil(); }
  if(!document.getElementById('p-data').hidden) renderData();
}
function start(){
  R=hitung();
  document.getElementById('perHasil').addEventListener('change',()=>{ renderHasil(); if(!document.getElementById('p-tren').hidden) chartAndil(); });
  document.getElementById('perEntri').addEventListener('change',e=>setPeriodeEntri(+e.target.value));
  ['hasil','entri','tren','data','atur'].forEach(n=>document.getElementById('tab-'+n).addEventListener('click',()=>{
    if(n==='entri'&&draftPid===null) setPeriodeEntri(+document.getElementById('perEntri').value); pilihTab(n); }));
  document.getElementById('btnSalin').addEventListener('click',()=>{
    const i=+document.getElementById('perEntri').value;
    KOM.forEach(c=>{ const v=R.H[c.kode][i-1]; if(v!=null) draft[c.kode]=v; });
    renderEntri(); toast('Harga minggu lalu disalin — ubah yang berubah'); });
  document.getElementById('btnKosong').addEventListener('click',()=>{ draft={}; renderEntri(); });
  document.getElementById('btnSimpan').addEventListener('click',simpan);
  document.getElementById('themebtn').addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-theme');
    const dark = cur ? cur==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark?'light':'dark');
    document.getElementById('themebtn').textContent = dark?'Mode gelap':'Mode terang';
    if(!document.getElementById('p-tren').hidden){ chartIhk(); chartMtm(); chartAndil(); } });
  setupEkspor();
  pasangAuth();
  refresh();
  pilihTab('hasil');
  connect();
}
async function simpan(){
  if(!sb || !sesi){ toast('Masuk dulu untuk menyimpan'); return; }
  const i=+document.getElementById('perEntri').value, p=PER[i], id=pid(p);
  const harga={}; KOM.forEach(c=>harga[c.kode]=draft[c.kode]);
  const btn=document.getElementById('btnSimpan'); btn.disabled=true; btn.textContent='Menyimpan…';
  const { error } = await sb.from('entri_harga').upsert({
    periode:id, tahun:p.y, bulan:p.m, minggu:p.w, label:p.label,
    harga, diubah_oleh: sesi.user.email, diubah_pada: new Date().toISOString()
  },{ onConflict:'periode' });
  if(error){ console.error(error); toast('Gagal menyimpan: '+error.message); }
  else { toast(plabel(p)+' tersimpan'); await muatData(); }
  btn.textContent='Simpan periode'; updateEntri();
}
function statusChip(kelas,teks){
  const chip=document.getElementById('dbchip');
  chip.className='chip'+(kelas?' '+kelas:'');
  document.getElementById('dbtxt').textContent=teks;
}
async function muatData(){
  if(!sb) return;
  const { data, error } = await sb.from('entri_harga').select('periode,harga');
  if(error){ console.error(error); statusChip('warn','Gagal memuat data'); return; }
  OVR={}; (data||[]).forEach(r=>{ if(r && r.harga) OVR[r.periode]=r.harga; });
  statusChip('on', sesi ? 'Tersambung · '+sesi.user.email : 'Tersambung · mode baca');
  refresh();
}
function renderAuth(){
  const masuk=document.getElementById('formMasuk'), keluar=document.getElementById('barKeluar');
  if(!masuk) return;
  masuk.hidden = !!sesi; keluar.hidden = !sesi;
  if(sesi) document.getElementById('emailAktif').textContent = sesi.user.email;
  statusChip('on', sesi ? 'Tersambung · '+sesi.user.email : 'Tersambung · mode baca');
}
async function connect(){
  if(!CFG.url || !CFG.anonKey || CFG.url.indexOf('ISI-')===0){
    statusChip('warn','Supabase belum diatur'); updateEntri();
    document.getElementById('panelMasuk').innerHTML =
      '<p class="note">Isi <b>assets/config.js</b> dengan URL dan anon key proyek Supabase-mu, lalu muat ulang halaman ini. Panduannya ada di README repo.</p>';
    return;
  }
  if(!window.supabase){ statusChip('warn','Pustaka Supabase gagal dimuat'); updateEntri(); return; }
  sb = window.supabase.createClient(CFG.url, CFG.anonKey);
  const { data:{ session } } = await sb.auth.getSession();
  sesi = session; renderAuth();
  sb.auth.onAuthStateChange((_e,s)=>{ sesi=s; renderAuth(); updateEntri(); });
  await muatData();
  try{
    sb.channel('entri_harga_realtime')
      .on('postgres_changes',{ event:'*', schema:'public', table:'entri_harga' }, muatData)
      .subscribe();
  }catch(e){ /* realtime opsional */ }
  updateEntri();
}
function pasangAuth(){
  const f=document.getElementById('formMasuk');
  if(!f) return;
  f.addEventListener('submit', async ev=>{
    ev.preventDefault();
    if(!sb){ toast('Supabase belum diatur'); return; }
    const btn=document.getElementById('btnMasuk'); btn.disabled=true; btn.textContent='Masuk…';
    const { error } = await sb.auth.signInWithPassword({
      email: document.getElementById('inEmail').value.trim(),
      password: document.getElementById('inSandi').value
    });
    btn.disabled=false; btn.textContent='Masuk';
    if(error){ document.getElementById('pesanMasuk').textContent='Email atau kata sandi salah.'; return; }
    document.getElementById('pesanMasuk').textContent='';
    document.getElementById('inSandi').value='';
    toast('Berhasil masuk'); await muatData();
  });
  document.getElementById('btnKeluar').addEventListener('click', async ()=>{
    if(sb) await sb.auth.signOut();
    sesi=null; renderAuth(); updateEntri(); toast('Keluar');
  });
}
let _sudahMulai=false;
function mulai(){ if(_sudahMulai) return; _sudahMulai=true; start(); }
document.addEventListener('DOMContentLoaded', mulai);
if(document.readyState!=='loading') mulai();