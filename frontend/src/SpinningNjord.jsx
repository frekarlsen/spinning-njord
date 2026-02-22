import { useState, useEffect, useCallback, useMemo } from "react";

const MAX_SPOTS = 10;
const API_KEY = import.meta.env.VITE_API_KEY || "njord-secret-change-me";
const API_BASE = "/api";
const CYCLIST_IMG = "data:image/jpeg;base64,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";

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function getWeekNumber(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7));const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/86400000+1)/7)}
function getMondayOfWeek(wo=0){const n=new Date(),d=n.getDay(),m=new Date(n);m.setDate(n.getDate()-(d===0?6:d-1)+wo*7);m.setHours(0,0,0,0);return m}
function fmtFull(d){const dt=new Date(d+"T12:00:00");return["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"][dt.getDay()]+" "+dt.getDate()+"."+(dt.getMonth()+1).toString().padStart(2,"0")}
function isSameWeek(ds,mon){const d=new Date(ds+"T12:00:00"),sun=new Date(mon);sun.setDate(sun.getDate()+6);sun.setHours(23,59,59,999);return d>=mon&&d<=sun}
function isPast(ds,time){const d=new Date(ds+"T12:00:00");const[h,m]=time.split(":").map(Number);d.setHours(h+1,m,0,0);return new Date()>d}
function defaultState(){return{admins:[{username:"instruktør",password:"njord2026"}],sessions:[],teamsWebhook:"",ntfyTopic:"",maxSpots:MAX_SPOTS}}

async function apiGet(){
  try{const r=await fetch(API_BASE+"/data",{headers:{"x-api-key":API_KEY}});if(!r.ok)return null;return await r.json()}catch{return null}
}
async function apiPut(data){
  try{await fetch(API_BASE+"/data",{method:"PUT",headers:{"Content-Type":"application/json","x-api-key":API_KEY},body:JSON.stringify(data)})}catch(e){console.error("Lagring feilet:",e)}
}
function useStorage(){
  const[data,setData]=useState(null);
  useEffect(()=>{(async()=>{
    const d=await apiGet();
    if(!d){setData(defaultState());return;}
    const def=defaultState();
    // Merge: sikrer at admins alltid finnes, og fallback-felter fra defaultState
    const merged={...def,...d,admins:(d.admins&&d.admins.length>0)?d.admins:def.admins};
    setData(merged);
  })()},[]);
  const save=useCallback(async nd=>{setData(nd);await apiPut(nd)},[]);
  return[data,save];
}

async function notifyTeams(url,msg){if(!url)return;try{await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({"@type":"MessageCard",summary:"Spinning",themeColor:"0078D4",title:"🚴 Spinning Njord A",text:msg})})}catch{}}

async function notifyNtfy(topic,title,msg,tags){if(!topic)return;try{await fetch("https://ntfy.sh/"+topic,{method:"POST",headers:{"Title":title,"Tags":tags||"bike"},body:msg})}catch{}}

async function sendNotifications(data,title,msg,tags){
  notifyTeams(data.teamsWebhook,msg);
  notifyNtfy(data.ntfyTopic,title,msg.replace(/\*\*/g,""),tags);
}

const NJORD_QUOTES=["Svetten er bare fettet som gråter 😭","Ingen har angret på en treningsøkt... bortsett fra kanskje denne 🥴","Beina sier nei, men hjertet sier kanskje","Vi sykler ikke fort, men vi sykler!","Det er ikke farten som dreper, det er bakkene 🏔️","Sykkelshortsen lyver aldri 🩳","Husk: siste bakke er alltid den verste","Kardio? Mer som hjarte-dio 💓"];

const T={bg:"linear-gradient(180deg,#FFF7ED 0%,#FEF3C7 50%,#FFF7ED 100%)",card:"border-gray-200 hover:border-orange-300 hover:shadow-md",accent:"bg-orange-500 hover:bg-orange-600",accentWait:"bg-amber-500 hover:bg-amber-600",signedUp:"text-green-600 bg-green-50",waitlisted:"text-amber-600 bg-amber-50",cancelled:"bg-red-50 text-red-400",bGray:"bg-gray-100 text-gray-500",bBlue:"bg-blue-50 text-blue-600",bRed:"bg-red-50 text-red-500",bYellow:"bg-amber-50 text-amber-600",input:"border-gray-200 focus:border-orange-400 focus:ring-orange-100",btnP:"bg-orange-500 hover:bg-orange-600 text-white",btnG:"text-gray-500 hover:text-gray-800 hover:bg-gray-100",adminB:"border-orange-200",pLow:"#3B82F6",pMid:"#F59E0B",pFull:"#EF4444",weekBg:"bg-white border-gray-100",addBtn:"border-orange-300 text-orange-400 hover:text-orange-600 hover:border-orange-400 hover:bg-orange-50"};

function Confetti({active}){
  const[particles,setParticles]=useState([]);
  useEffect(()=>{
    if(!active)return;
    const emojis=["🚴","💪","🔥","⭐","🎉","💥","🏆","❤️","😎","🚀"];
    const p=Array.from({length:25},(_,i)=>({id:i,x:50+(Math.random()-.5)*40,emoji:emojis[Math.floor(Math.random()*emojis.length)],delay:Math.random()*0.4,dx:(Math.random()-.5)*200,size:Math.random()*14+16}));
    setParticles(p);
    const t=setTimeout(()=>setParticles([]),2500);
    return()=>clearTimeout(t);
  },[active]);
  if(!particles.length)return null;
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100,overflow:"hidden"}}>
      {particles.map(p=>(
        <div key={p.id} style={{position:"absolute",left:p.x+"%",top:"40%",fontSize:p.size,animation:"confetti-pop 1.8s ease-out forwards",animationDelay:p.delay+"s","--dx":p.dx+"px"}}>{p.emoji}</div>
      ))}
    </div>
  );
}

function NjordHeader(){
  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:20,background:"linear-gradient(180deg,#87CEEB 0%,#B8E4F0 35%,#7CB342 35%,#66BB6A 48%,#555 48%,#444 52%,#555 52%,#66BB6A 56%,#7CB342 100%)",marginBottom:20,height:200,boxShadow:"0 4px 20px rgba(0,0,0,.1)"}}>
      <div style={{position:"absolute",top:14,right:20,width:45,height:45,background:"#FFD54F",borderRadius:"50%",boxShadow:"0 0 40px #FFD54F88"}}/>
      {[{t:8,w:80,h:26,d:20,dl:0},{t:25,w:55,h:19,d:26,dl:-9},{t:4,w:65,h:22,d:30,dl:-16}].map((c,i)=>(
        <div key={i} style={{position:"absolute",top:c.t,width:c.w,height:c.h,background:"white",borderRadius:50,opacity:.85,animation:`cld ${c.d}s linear infinite`,animationDelay:c.dl+"s"}}/>
      ))}
      {[0,1,2,3,4,5,6].map(i=><div key={i} style={{position:"absolute",top:"49.5%",height:3,width:24,background:"#FFD54F",borderRadius:2,animation:"rdl 1s linear infinite",animationDelay:(-i*.14)+"s"}}/>)}
      {[{l:"5%",s:1},{l:"22%",s:.7},{l:"78%",s:.85},{l:"92%",s:1}].map((t,i)=>(
        <div key={i} style={{position:"absolute",bottom:"56%",left:t.l,transform:"scale("+t.s+")",zIndex:1}}>
          <div style={{width:28,height:28,background:"#43A047",borderRadius:"50%",margin:"0 auto",marginBottom:-4}}/><div style={{width:6,height:18,background:"#5D4037",borderRadius:2,margin:"0 auto"}}/>
        </div>
      ))}
      <div style={{position:"absolute",bottom:22,left:0,right:0,display:"flex",justifyContent:"center",alignItems:"flex-end",gap:0,zIndex:2}}>
        <div className="nb1" style={{marginRight:-12}}><img src={CYCLIST_IMG} alt="" style={{height:100,objectFit:"contain",filter:"brightness(1.05) saturate(1.1)"}}/></div>
        <div className="nb2" style={{zIndex:3,marginBottom:2}}><img src={CYCLIST_IMG} alt="" style={{height:115,objectFit:"contain",filter:"brightness(1) saturate(1.2)",transform:"scaleX(-1)"}}/></div>
        <div className="nb3" style={{marginLeft:-12}}><img src={CYCLIST_IMG} alt="" style={{height:95,objectFit:"contain",filter:"brightness(1.1) hue-rotate(20deg) saturate(1.1)"}}/></div>
      </div>
      <div style={{position:"absolute",top:10,left:16,color:"white",fontWeight:900,fontSize:11,textTransform:"uppercase",letterSpacing:2,opacity:.7,textShadow:"0 1px 3px rgba(0,0,0,.3)"}}>NJORD A CYCLING TEAM</div>
    </div>
  );
}

function Badge({children,color="gray"}){const m={gray:T.bGray,blue:T.bBlue,red:T.bRed,yellow:T.bYellow};return<span className={"text-xs font-semibold px-2.5 py-1 rounded-full "+m[color]}>{children}</span>}
function Input({label,...p}){return<div>{label&&<label className="block text-sm font-medium text-gray-500 mb-1.5">{label}</label>}<input {...p} className={"w-full rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm bg-white border-2 "+T.input}/></div>}
function Button({children,onClick,disabled,variant="primary",size="md"}){const sz=size==="sm"?"px-3 py-1.5 text-sm":"px-4 py-2.5 text-sm";const v=variant==="primary"?(disabled?"bg-gray-100 text-gray-400 cursor-not-allowed":T.btnP+" shadow-sm hover:shadow active:scale-95"):(disabled?"text-gray-300 cursor-not-allowed":T.btnG+" active:scale-95");return<button onClick={onClick} disabled={disabled} className={"font-semibold rounded-xl transition-all duration-150 "+sz+" "+v}>{children}</button>}

function SessionCard({session,userName,onSignup,onLeave,maxSpots,isAdmin,onEdit,onCancel,onRestore,onDelete}){
  const past=isPast(session.date,session.time);const cancelled=session.status==="cancelled";
  const list=session.signups||[];const waitlist=session.waitlist||[];const full=list.length>=maxSpots;
  const lc=userName?.trim().toLowerCase();const isS=lc&&list.some(n=>n.toLowerCase()===lc);const isW=lc&&waitlist.some(n=>n.toLowerCase()===lc);const wPos=isW?waitlist.findIndex(n=>n.toLowerCase()===lc)+1:0;
  const pct=Math.min((list.length/maxSpots)*100,100);
  return(
    <div className={"rounded-2xl overflow-hidden border-2 transition-all bg-white "+(cancelled?"border-red-200":past?"border-gray-200":T.card)+" "+(cancelled||past?"opacity-50":"")}>
      <div className="px-5 py-4 flex items-center justify-between">
        <div><div className="font-bold text-gray-800">{fmtFull(session.date)}</div><div className="text-sm text-gray-400 mt-0.5">kl. {session.time}{session.label&&session.label!=="Spinning"?" · "+session.label:""}</div></div>
        <div className="flex items-center gap-2">
          {cancelled?<Badge color="red">Avlyst</Badge>:<><Badge color={full?"red":list.length>0?"blue":"gray"}>{list.length}/{maxSpots}</Badge>{waitlist.length>0&&<Badge color="yellow">{waitlist.length} venter</Badge>}</>}
          {isAdmin&&<div className="flex gap-0.5 ml-1">
            {!cancelled&&!past&&<button onClick={()=>onEdit(session)} className="text-gray-400 hover:text-blue-500 text-xs p-1.5 rounded-lg hover:bg-blue-50">✎</button>}
            {cancelled&&!past&&<button onClick={()=>onRestore(session.id)} className="text-gray-400 hover:text-green-500 text-xs p-1.5 rounded-lg hover:bg-green-50">↩</button>}
            {!cancelled&&!past&&<button onClick={()=>onCancel(session.id)} className="text-gray-400 hover:text-red-500 text-xs p-1.5 rounded-lg hover:bg-red-50">✕</button>}
            {(past||cancelled)&&<button onClick={()=>onDelete(session.id)} className="text-gray-400 hover:text-red-500 text-xs p-1.5 rounded-lg hover:bg-red-50">🗑</button>}
          </div>}
        </div>
      </div>
      {!cancelled&&list.length>0&&<div className="px-5 pb-2"><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:pct+"%",background:full?T.pFull:pct>70?T.pMid:T.pLow}}/></div></div>}
      {cancelled&&<div className={"px-5 py-3 "+T.cancelled+" text-sm font-medium"}>Denne økten er avlyst</div>}
      {!cancelled&&<>
        <div className="bg-gray-50 bg-opacity-50">
          {list.length===0&&waitlist.length===0?<div className="px-5 py-4 text-gray-400 text-sm italic">Ingen påmeldte ennå</div>:<>
            {list.map((p,i)=><div key={i} className="px-5 py-2.5 flex items-center justify-between border-t border-gray-100"><div className="flex items-center gap-3"><span className="text-xs font-bold text-gray-300 w-5 text-right">{i+1}</span><span className="text-gray-700 font-medium">{p}</span></div>
              {!past&&p.toLowerCase()===lc&&<button onClick={()=>onLeave(session.id,p,"signup")} className="text-gray-400 hover:text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Meld av</button>}
              {!past&&isAdmin&&p.toLowerCase()!==lc&&<button onClick={()=>onLeave(session.id,p,"signup")} className="text-gray-300 hover:text-red-400 text-xs p-1 rounded hover:bg-red-50">✕</button>}
            </div>)}
            {waitlist.length>0&&<><div className="px-5 py-2 border-t border-gray-100"><span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Venteliste</span></div>
              {waitlist.map((p,i)=><div key={i} className="px-5 py-2.5 flex items-center justify-between border-t border-gray-100"><div className="flex items-center gap-3"><span className="text-xs font-bold text-amber-300 w-5 text-right">{i+1}</span><span className="text-gray-500">{p}</span></div>
                {!past&&p.toLowerCase()===lc&&<button onClick={()=>onLeave(session.id,p,"waitlist")} className="text-gray-400 hover:text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Trekk deg</button>}
              </div>)}</>}
          </>}
        </div>
        {!past&&<div className="border-t border-gray-100">
          {isS?<div className={"py-3 text-center text-sm font-semibold "+T.signedUp}>✓ Du er påmeldt</div>
          :isW?<div className={"py-3 text-center text-sm font-semibold "+T.waitlisted}>Venteliste — plass {wPos}</div>
          :<button onClick={()=>onSignup(session.id)} disabled={!lc} className={"w-full py-3.5 text-sm font-bold transition-all "+(!lc?"bg-gray-50 text-gray-300 cursor-not-allowed":full?T.accentWait+" text-white":"bg-green-500 hover:bg-green-600 text-white")}>{full?"Sett meg på venteliste":"Meld på"}</button>}
        </div>}
      </>}
    </div>
  );
}

function SessionModal({session,monday,onSave,onClose}){
  const gdd=()=>{const d=new Date(monday),td=new Date();if(td>monday)d.setDate(d.getDate()+Math.min(Math.ceil((td-monday)/86400000),6));return d.toISOString().split("T")[0]};
  const[date,setDate]=useState(session?.date||gdd());const[time,setTime]=useState(session?.time||"19:40");const[label,setLabel]=useState(session?.label||"Spinning");
  const isE=!!session?.id;const dn=["Man","Tir","Ons","Tor","Fre","Lør","Søn"];
  const wd=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
  return(
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{isE?"Rediger økt":"Ny økt"}</h3>
        <label className="block text-sm font-medium text-gray-500 mb-2">Dag</label>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {wd.map((w,i)=>{const ds=w.toISOString().split("T")[0],sel=date===ds,dp=w<new Date(new Date().setHours(0,0,0,0));
            return<button key={i} onClick={()=>!dp&&setDate(ds)} disabled={dp} className={"py-2 rounded-xl text-center transition-all "+(dp?"text-gray-300 cursor-not-allowed":sel?T.btnP+" shadow-md scale-105":"bg-gray-100 text-gray-600 hover:bg-gray-200")}><div className="text-xs font-medium">{dn[i]}</div><div className="text-sm font-bold">{w.getDate()}</div></button>})}
        </div>
        <div className="space-y-3"><Input label="Klokkeslett" type="time" value={time} onChange={e=>setTime(e.target.value)}/><Input label="Beskrivelse" type="text" value={label} onChange={e=>setLabel(e.target.value)} placeholder="Spinning, Intervall..."/></div>
        <div className="flex gap-2 mt-5"><Button variant="ghost" onClick={onClose}>Avbryt</Button><Button onClick={()=>onSave({...session,date,time,label})} disabled={!date||!time}>{isE?"Lagre":"Opprett"}</Button></div>
      </div>
    </div>
  );
}

function LoginModal({admins,onLogin,onClose}){
  const[u,setU]=useState("");const[p,setP]=useState("");const[err,setErr]=useState(false);
  const go=()=>{const m=admins.find(a=>a.username.toLowerCase()===u.toLowerCase()&&a.password===p);if(m)onLogin(m.username);else{setErr(true);setTimeout(()=>setErr(false),2000)}};
  return(
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔐 Instruktør</h3>
        <div className="space-y-3"><Input placeholder="Brukernavn" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/><Input placeholder="Passord" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>{err&&<p className="text-red-500 text-sm font-medium">Feil brukernavn eller passord</p>}</div>
        <div className="flex gap-2 mt-5"><Button variant="ghost" onClick={onClose}>Avbryt</Button><Button onClick={go}>Logg inn</Button></div>
      </div>
    </div>
  );
}

function AdminPanel({data,onSave,onLogout}){
  const[tab,setTab]=useState("admins");const[na,setNa]=useState({username:"",password:""});const[wh,setWh]=useState(data.teamsWebhook||"");const[nt,setNt]=useState(data.ntfyTopic||"");const[ms,setMs]=useState(data.maxSpots||MAX_SPOTS);const[saved,setSaved]=useState("");
  const flash=m=>{setSaved(m);setTimeout(()=>setSaved(""),2000)};
  return(
    <div>
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-800">⚙️ Instruktør</h2><Button variant="ghost" size="sm" onClick={onLogout}>Logg ut</Button></div>
      {saved&&<div className="mb-4 bg-green-50 text-green-600 text-sm font-medium px-4 py-2.5 rounded-xl border border-green-100">✓ {saved}</div>}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">{[{id:"admins",l:"Instruktører"},{id:"settings",l:"Innstillinger"}].map(x=><button key={x.id} onClick={()=>setTab(x.id)} className={"flex-1 py-2 text-sm rounded-lg font-medium transition-colors "+(tab===x.id?"bg-white text-gray-800 shadow-sm":"text-gray-400 hover:text-gray-600")}>{x.l}</button>)}</div>
      {tab==="admins"&&<div className="space-y-3">
        {data.admins.map((a,i)=><div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"><span className="text-gray-700 font-medium">{a.username}</span><button onClick={()=>{if(data.admins.length<=1)return;const arr=[...data.admins];arr.splice(i,1);onSave({...data,admins:arr});flash("Fjernet")}} disabled={data.admins.length<=1} className={data.admins.length<=1?"text-gray-300":"text-gray-400 hover:text-red-500"}>✕</button></div>)}
        <div className="space-y-2 pt-3 border-t border-gray-100"><Input placeholder="Brukernavn" value={na.username} onChange={e=>setNa(p=>({...p,username:e.target.value}))}/><Input placeholder="Passord" type="password" value={na.password} onChange={e=>setNa(p=>({...p,password:e.target.value}))}/><Button onClick={()=>{if(!na.username||!na.password)return;if(data.admins.some(a=>a.username.toLowerCase()===na.username.toLowerCase()))return;onSave({...data,admins:[...data.admins,{...na}]});setNa({username:"",password:""});flash("Lagt til")}} disabled={!na.username||!na.password}>Legg til</Button></div>
      </div>}
      {tab==="settings"&&<div className="space-y-4">
        <Input label="Maks plasser per økt" type="number" value={ms} onChange={e=>setMs(e.target.value)}/>
        <div><Input label="Teams Webhook URL" type="url" placeholder="https://outlook.office.com/webhook/..." value={wh} onChange={e=>setWh(e.target.value)}/><p className="text-xs text-gray-400 mt-1.5">Varsel til Teams ved endringer.</p></div>
        <div><Input label="ntfy.sh Topic" type="text" placeholder="spinning-njord-a" value={nt} onChange={e=>setNt(e.target.value)}/><p className="text-xs text-gray-400 mt-1.5">Push-varsler via <a href="https://ntfy.sh" target="_blank" rel="noopener" className="text-orange-500 underline">ntfy.sh</a>. Abonnér på topic i appen.</p></div>
        <Button onClick={()=>{onSave({...data,teamsWebhook:wh,ntfyTopic:nt,maxSpots:parseInt(ms)||MAX_SPOTS});flash("Lagret")}}>Lagre</Button>
      </div>}
    </div>
  );
}

export default function SpinningNjord(){
  const[data,save]=useStorage();const[weekOffset,setWeekOffset]=useState(0);const[userName,setUserName]=useState("");
  const[adminUser,setAdminUser]=useState(null);const[showLogin,setShowLogin]=useState(false);const[showAdmin,setShowAdmin]=useState(false);
  const[editSession,setEditSession]=useState(null);const[showNew,setShowNew]=useState(false);
  const[quote]=useState(()=>NJORD_QUOTES[Math.floor(Math.random()*NJORD_QUOTES.length)]);
  const[confettiKey,setConfettiKey]=useState(0);

  const monday=useMemo(()=>getMondayOfWeek(weekOffset),[weekOffset]);const weekNum=getWeekNumber(monday);
  const isAdmin=!!adminUser;

  const weekSessions=useMemo(()=>{if(!data)return[];return data.sessions.filter(s=>isSameWeek(s.date,monday)).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))},[data,monday]);

  if(!data)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 font-medium">Laster...</div></div>;

  const spots=data.maxSpots||MAX_SPOTS;
  const upd=(id,fn)=>save({...data,sessions:data.sessions.map(s=>s.id===id?fn(s):s)});
  const del=id=>save({...data,sessions:data.sessions.filter(s=>s.id!==id)});

  const doSignup=sid=>{if(!userName.trim())return;const ss=data.sessions.find(s=>s.id===sid);if(!ss)return;const nm=userName.trim(),lc=nm.toLowerCase();if(ss.signups.some(n=>n.toLowerCase()===lc)||ss.waitlist.some(n=>n.toLowerCase()===lc))return;if(ss.signups.length<spots){upd(sid,s=>({...s,signups:[...s.signups,nm]}));setConfettiKey(k=>k+1);sendNotifications(data,"Påmeldt! ✅","**"+nm+"** meldte seg på "+fmtFull(ss.date)+" kl. "+ss.time+" ("+(ss.signups.length+1)+"/"+spots+")","white_check_mark")}else{upd(sid,s=>({...s,waitlist:[...s.waitlist,nm]}));sendNotifications(data,"Venteliste ⏳","**"+nm+"** på venteliste for "+fmtFull(ss.date)+" kl. "+ss.time,"hourglass")}};
  const doLeave=(sid,person,lt)=>{upd(sid,s=>{const u={...s};if(lt==="signup"){u.signups=s.signups.filter(n=>n.toLowerCase()!==person.toLowerCase());if(s.waitlist.length>0){const pr=s.waitlist[0];u.signups=[...u.signups,pr];u.waitlist=s.waitlist.slice(1);sendNotifications(data,"Opprykk! 🎉","**"+pr+"** rykket opp fra ventelisten!","tada")}}else u.waitlist=s.waitlist.filter(n=>n.toLowerCase()!==person.toLowerCase());return u})};
  const doCancel=id=>{const s=data.sessions.find(x=>x.id===id);upd(id,x=>({...x,status:"cancelled"}));if(s)sendNotifications(data,"Avlyst ❌",fmtFull(s.date)+" kl. "+s.time+" er **avlyst**!","x")};
  const doRestore=id=>upd(id,s=>({...s,status:"active"}));
  const doSave=sd=>{if(sd.id){upd(sd.id,s=>({...s,date:sd.date,time:sd.time,label:sd.label}));const old=data.sessions.find(s=>s.id===sd.id);if(old&&(old.date!==sd.date||old.time!==sd.time))sendNotifications(data,"Økt endret 📅","Økt endret til **"+fmtFull(sd.date)+" kl. "+sd.time+"**","calendar")}else{save({...data,sessions:[...data.sessions,{id:uid(),date:sd.date,time:sd.time,label:sd.label||"Spinning",status:"active",signups:[],waitlist:[]}]});sendNotifications(data,"Ny økt! 🆕","Ny økt: **"+fmtFull(sd.date)+" kl. "+sd.time+"**","new")}setEditSession(null);setShowNew(false)};

  const active=weekSessions.filter(s=>s.status!=="cancelled"),cancelled=weekSessions.filter(s=>s.status==="cancelled");
  const sun=new Date(monday);sun.setDate(sun.getDate()+6);
  const fmtShort=d=>d.getDate()+"."+(d.getMonth()+1);

  return(
    <>
      <Confetti active={confettiKey}/>
      <style>{"@keyframes whl{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}@keyframes cld{0%{transform:translateX(500px)}100%{transform:translateX(-160px)}}@keyframes rdl{0%{transform:translateX(500px)}100%{transform:translateX(-40px)}}@keyframes nb1{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}}@keyframes nb2{0%,100%{transform:translateY(-2px) rotate(1deg)}50%{transform:translateY(2px) rotate(-1deg)}}@keyframes nb3{0%,100%{transform:translateY(1px)}50%{transform:translateY(-3px) rotate(-1deg)}}.nb1{animation:nb1 .6s ease-in-out infinite}.nb2{animation:nb2 .55s ease-in-out infinite}.nb3{animation:nb3 .65s ease-in-out infinite}@keyframes confetti-pop{0%{opacity:1;transform:translateY(0) translateX(0) scale(1)}100%{opacity:0;transform:translateY(-300px) translateX(var(--dx)) scale(0.3) rotate(720deg)}}"}</style>
      <div className="min-h-screen" style={{background:T.bg}}>
        <div className="max-w-lg mx-auto p-4 pb-24">
          <NjordHeader/>
          <div className="text-center mb-2"><h1 className="text-3xl font-black text-gray-800" style={{fontFamily:"Georgia,serif"}}>Spinning Njord A</h1><p className="text-orange-400 text-xs mt-2 italic">«{quote}»</p></div>

          <div className="flex gap-2 mb-5 mt-4">
            <input type="text" placeholder="Skriv inn navnet ditt" value={userName} onChange={e=>setUserName(e.target.value)} className={"flex-1 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm font-medium shadow-sm bg-white border-2 "+T.input}/>
            <button onClick={()=>isAdmin?setShowAdmin(!showAdmin):setShowLogin(true)} className={"px-3 rounded-xl border-2 transition-all text-sm font-medium shadow-sm "+(isAdmin?"border-orange-400 text-orange-500 bg-orange-50 hover:bg-orange-100":"border-gray-200 text-gray-400 bg-white hover:text-gray-600 hover:border-gray-300")}>{isAdmin?"⚙️":"🔒"}</button>
          </div>

          {isAdmin&&showAdmin&&<div className={"mb-5 bg-white rounded-2xl p-5 shadow-sm border-2 "+T.adminB}><AdminPanel data={data} onSave={save} onLogout={()=>{setAdminUser(null);setShowAdmin(false)}}/></div>}

          <div className={"flex items-center justify-between mb-5 rounded-2xl p-3 shadow-sm border "+T.weekBg}>
            <button onClick={()=>setWeekOffset(o=>o-1)} className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl text-gray-400 hover:text-gray-600">‹</button>
            <div className="text-center">
              <button onClick={()=>setWeekOffset(0)} className="hover:opacity-70 transition-opacity">
                <div className="font-bold text-gray-800 text-lg">Uke {weekNum}</div>
                <div className="text-xs text-gray-400 font-medium">{fmtShort(monday)} – {fmtShort(sun)} {monday.getFullYear()}</div>
              </button>
            </div>
            <button onClick={()=>setWeekOffset(o=>o+1)} className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl text-gray-400 hover:text-gray-600">›</button>
          </div>

          {isAdmin&&<button onClick={()=>setShowNew(true)} className={"w-full mb-5 py-3.5 border-2 border-dashed rounded-2xl transition-all text-sm font-bold "+T.addBtn}>+ Legg til økt</button>}

          <div className="space-y-4">
            {active.length===0&&cancelled.length===0?<div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"><div className="text-5xl mb-3">🚴</div><p className="text-gray-400 font-medium">Ingen økter denne uka</p>{isAdmin?<p className="text-gray-300 text-sm mt-1">Trykk «+ Legg til økt»</p>:<p className="text-gray-300 text-sm mt-1">Økter legges ut av instruktør</p>}</div>
            :<>{active.map(s=><SessionCard key={s.id} session={s} userName={userName} onSignup={doSignup} onLeave={doLeave} maxSpots={spots} isAdmin={isAdmin} onEdit={setEditSession} onCancel={doCancel} onRestore={doRestore} onDelete={del}/>)}{cancelled.map(s=><SessionCard key={s.id} session={s} userName={userName} onSignup={doSignup} onLeave={doLeave} maxSpots={spots} isAdmin={isAdmin} onEdit={setEditSession} onCancel={doCancel} onRestore={doRestore} onDelete={del}/>)}</>}
          </div>
          <div className="text-center text-xs mt-8 space-y-1" style={{color:"#D4A373"}}><p>Vel møtt!</p><p>Laget av Fredrik Karlsen</p></div>
        </div>
        {showLogin&&<LoginModal admins={data.admins} onLogin={u=>{setAdminUser(u);setShowLogin(false);setShowAdmin(true)}} onClose={()=>setShowLogin(false)}/>}
        {(editSession||showNew)&&<SessionModal session={editSession||{}} monday={monday} onSave={doSave} onClose={()=>{setEditSession(null);setShowNew(false)}}/>}
      </div>
    </>
  );
}
