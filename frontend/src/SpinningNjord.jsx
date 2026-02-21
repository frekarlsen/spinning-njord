import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const MAX_SPOTS = 10;
const API_KEY = import.meta.env.VITE_API_KEY || "njord-secret-change-me";
const API_BASE = "/api";

const QUOTES = [
  "No pain, no gain 🔥",
  "Push harder than yesterday 💥",
  "Sweat is just fat crying 😅",
  "Pedal to the metal! 🚴",
  "You don't find the time – you make it ⏱️",
  "One more rep. One more round. 💪",
  "Train insane or remain the same 🏆",
  "Your only competition is yesterday's you 🎯",
];

// ── Dato-hjelpere ────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}
function getMondayOfWeek(weekOffset = 0) {
  const now = new Date(); const day = now.getDay(); const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  mon.setHours(0, 0, 0, 0); return mon;
}
function parseLocalDate(dateStr) { const [y, m, d] = dateStr.split("-").map(Number); return new Date(y, m - 1, d); }
function toLocalDateStr(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}
function fmtFull(d) {
  const date = typeof d === "string" ? parseLocalDate(d) : new Date(d);
  const days = ["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"];
  return `${days[date.getDay()]} ${date.getDate()}.${(date.getMonth()+1).toString().padStart(2,"0")}`;
}
function fmtShort(d) {
  const date = typeof d === "string" ? parseLocalDate(d) : new Date(d);
  return `${date.getDate()}.${(date.getMonth()+1).toString().padStart(2,"0")}`;
}
function fmt24h(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
}
function isSameWeek(dateStr, monday) {
  const d = parseLocalDate(dateStr); const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6); sun.setHours(23,59,59,999);
  return d >= monday && d <= sun;
}
function isPast(dateStr, time) {
  const d = parseLocalDate(dateStr); const [h, m] = time.split(":").map(Number);
  d.setHours(h+1, m, 0, 0); return new Date() > d;
}
function defaultState() {
  return { admins: [{ username: "admin", password: "njord2025" }], sessions: [], teamsWebhook: "", maxSpots: MAX_SPOTS };
}

// ── API hook ─────────────────────────────────────────────────
function useStorage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/data`, { headers: { "x-api-key": API_KEY } })
      .then((r) => r.json())
      .then((json) => {
        if (json && typeof json === "object" && !json.error) setData({ ...defaultState(), ...json });
        else setData(defaultState());
      })
      .catch(() => { setError("Klarte ikke koble til server"); setData(defaultState()); });
  }, []);
  const save = useCallback(async (newData) => {
    setData(newData);
    try {
      await fetch(`${API_BASE}/data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(newData),
      });
    } catch {}
  }, []);
  return [data, save, error];
}

async function notifyTeams(url, msg) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "@type": "MessageCard", summary: "Spinning", themeColor: "3B82F6", title: "🚴 Spinning Njord A", text: msg }),
    });
  } catch {}
}

// ── Canvas bakgrunn – animerte sykkelhjul ────────────────────
function BikeBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const wheels = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouseMove);

    wheels.current = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 20 + Math.random() * 55,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      rot: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.008,
      spokes: 6 + Math.floor(Math.random() * 4),
      alpha: 0.04 + Math.random() * 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      wheels.current.forEach((w) => {
        const dx = w.x - mouse.current.x;
        const dy = w.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repel = 120;
        if (dist < repel && dist > 0) {
          const force = ((repel - dist) / repel) * 0.6;
          w.vx += (dx / dist) * force;
          w.vy += (dy / dist) * force;
        }
        w.vx *= 0.985; w.vy *= 0.985;
        w.x += w.vx; w.y += w.vy; w.rot += w.speed;
        if (w.x < -w.r) w.x = canvas.width + w.r;
        if (w.x > canvas.width + w.r) w.x = -w.r;
        if (w.y < -w.r) w.y = canvas.height + w.r;
        if (w.y > canvas.height + w.r) w.y = -w.r;

        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.rot);
        ctx.strokeStyle = `rgba(99, 179, 237, ${w.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, w.r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, w.r * 0.08, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < w.spokes; i++) {
          const angle = (i / w.spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * w.r * 0.08, Math.sin(angle) * w.r * 0.08);
          ctx.lineTo(Math.cos(angle) * w.r, Math.sin(angle) * w.r);
          ctx.stroke();
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMouseMove); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── Animert SVG-hjul i header ────────────────────────────────
function SpinningWheelIcon() {
  return (
    <div className="relative inline-block mb-2">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "wheelspin 3s linear infinite" }}>
        <circle cx="28" cy="28" r="25" stroke="#3B82F6" strokeWidth="2.5" strokeOpacity="0.8" />
        <circle cx="28" cy="28" r="4" stroke="#60A5FA" strokeWidth="2" strokeOpacity="0.9" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={28 + Math.cos(rad) * 4.5} y1={28 + Math.sin(rad) * 4.5}
              x2={28 + Math.cos(rad) * 24.5} y2={28 + Math.sin(rad) * 24.5}
              stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.7"
            />
          );
        })}
      </svg>
      <style>{`@keyframes wheelspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Roterende quotes ─────────────────────────────────────────
function RotatingQuote() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % QUOTES.length); setVisible(true); }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <p className="text-xs text-blue-400 mt-1 h-4 transition-opacity duration-400" style={{ opacity: visible ? 1 : 0 }}>
      {QUOTES[idx]}
    </p>
  );
}

// ── Konfetti ─────────────────────────────────────────────────
function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const emojis = ["🚴","🏆","💪","🔥","⭐","🎉","💥","🚵"];
    const particles = Array.from({ length: 40 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 10,
      vy: -8 - Math.random() * 8,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: 18 + Math.random() * 20,
      life: 1, decay: 0.015 + Math.random() * 0.01,
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.3;
        p.rot += p.rotSpeed; p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });
      if (alive) animId = requestAnimationFrame(draw);
      else onDone();
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }} />;
}

// ── Power meter ──────────────────────────────────────────────
function PowerMeter({ filled, total }) {
  const pct = total > 0 ? filled / total : 0;
  const color = pct >= 1 ? "#EF4444" : pct >= 0.7 ? "#F59E0B" : "#3B82F6";
  const label = pct >= 1 ? "FULLT" : pct >= 0.7 ? "NÆR FULLT" : "LEDIGE PLASSER";
  return (
    <div className="px-4 pt-2 pb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium tracking-wider" style={{ color, fontSize: "10px" }}>{label}</span>
        <span className="text-xs text-gray-500">{filled}/{total}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex-1 h-1 rounded-sm transition-all duration-300"
            style={{ backgroundColor: i < filled ? color : "#1F2937", opacity: i < filled ? 0.8 : 0.4 }} />
        ))}
      </div>
    </div>
  );
}

// ── UI-primitiver ────────────────────────────────────────────
function Badge({ children, color = "gray" }) {
  const c = { gray: "bg-gray-800 text-gray-400", blue: "bg-blue-900 text-blue-300", red: "bg-red-900 text-red-300", yellow: "bg-yellow-900 text-yellow-300" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c[color]}`}>{children}</span>;
}
function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-400 mb-1.5">{label}</label>}
      <input {...props} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm" />
    </div>
  );
}
function Button({ children, onClick, disabled, variant = "primary", size = "md", className = "" }) {
  const base = "font-medium rounded-xl transition-all duration-150 ";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "w-full py-3 text-sm" };
  const v = {
    primary: disabled ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95",
    danger: disabled ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-500 text-white active:scale-95",
    ghost: disabled ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-gray-800 active:scale-95",
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${v[variant]} ${className}`}>{children}</button>;
}

// ── Session Card ─────────────────────────────────────────────
function SessionCard({ session, userName, onSignup, onLeave, maxSpots, isAdmin, onEdit, onCancel, onRestore, onDelete, onConfetti }) {
  const past = isPast(session.date, session.time);
  const cancelled = session.status === "cancelled";
  const list = session.signups || [];
  const waitlist = session.waitlist || [];
  const full = list.length >= maxSpots;
  const nameLC = userName?.trim().toLowerCase();
  const isSignedUp = nameLC && list.some((n) => n.toLowerCase() === nameLC);
  const isOnWaitlist = nameLC && waitlist.some((n) => n.toLowerCase() === nameLC);
  const waitPos = isOnWaitlist ? waitlist.findIndex((n) => n.toLowerCase() === nameLC) + 1 : 0;
  const [justSignedUp, setJustSignedUp] = useState(false);

  const handleSignup = () => {
    onSignup(session.id);
    setJustSignedUp(true);
    onConfetti();
    setTimeout(() => setJustSignedUp(false), 1200);
  };

  return (
    <div className={`rounded-xl overflow-hidden border transition-all ${cancelled ? "border-red-900 opacity-50" : past ? "border-gray-800 opacity-50" : "border-gray-800 hover:border-blue-900"}`}>
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold text-white">{fmtFull(session.date)}</span>
          <span className="text-gray-400 ml-2 text-sm">kl. {fmt24h(session.time)}</span>
          {session.label && session.label !== "Spinning" && (
            <span className="text-gray-500 ml-2 text-sm">· {session.label}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cancelled ? (
            <Badge color="red">Avlyst</Badge>
          ) : (
            waitlist.length > 0 && <Badge color="yellow">{waitlist.length} venter</Badge>
          )}
          {isAdmin && (
            <div className="flex gap-1 ml-1">
              {!past && !cancelled && (
                <button onClick={() => onEdit(session)} className="text-gray-500 hover:text-blue-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Rediger">✎</button>
              )}
              {cancelled ? (
                <>
                  {!past && <button onClick={() => onRestore(session.id)} className="text-gray-500 hover:text-green-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Gjenopprett">↩</button>}
                  <button onClick={() => onDelete(session.id)} className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Slett permanent">🗑</button>
                </>
              ) : past ? (
                <button onClick={() => onDelete(session.id)} className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Slett">🗑</button>
              ) : (
                <button onClick={() => onCancel(session.id)} className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Avlys">✕</button>
              )}
            </div>
          )}
        </div>
      </div>

      {cancelled && (
        <div className="px-4 py-3 bg-red-950 bg-opacity-30 text-red-400 text-sm">Denne økten er avlyst</div>
      )}

      {!cancelled && (
        <>
          <PowerMeter filled={list.length} total={maxSpots} />

          <div className="bg-gray-900 bg-opacity-40">
            {list.length === 0 && waitlist.length === 0 ? (
              <div className="px-4 py-3 text-gray-600 text-sm italic">Ingen påmeldte ennå – vær den første! 🚴</div>
            ) : (
              <>
                {list.map((person, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between border-t border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-5 text-right">{i + 1}.</span>
                      <span className={person.toLowerCase() === nameLC ? "text-blue-300 font-medium" : "text-gray-200"}>{person}</span>
                      {person.toLowerCase() === nameLC && <span className="text-xs text-blue-500">← deg</span>}
                    </div>
                    {!past && person.toLowerCase() === nameLC && (
                      <button onClick={() => onLeave(session.id, person, "signup")} className="text-gray-600 hover:text-red-400 text-xs transition-colors px-2">Meld av</button>
                    )}
                    {!past && isAdmin && person.toLowerCase() !== nameLC && (
                      <button onClick={() => onLeave(session.id, person, "signup")} className="text-gray-700 hover:text-red-400 text-xs transition-colors px-2" title="Fjern">✕</button>
                    )}
                  </div>
                ))}
                {waitlist.length > 0 && (
                  <>
                    <div className="px-4 py-2 border-t border-gray-800">
                      <span className="text-xs text-yellow-500 font-medium uppercase tracking-wide">Venteliste</span>
                    </div>
                    {waitlist.map((person, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between border-t border-gray-800">
                        <div className="flex items-center gap-3">
                          <span className="text-yellow-600 text-sm w-5 text-right">{i + 1}.</span>
                          <span className={person.toLowerCase() === nameLC ? "text-yellow-300 font-medium" : "text-gray-400"}>{person}</span>
                          {person.toLowerCase() === nameLC && <span className="text-xs text-yellow-600">← deg</span>}
                        </div>
                        {!past && person.toLowerCase() === nameLC && (
                          <button onClick={() => onLeave(session.id, person, "waitlist")} className="text-gray-600 hover:text-red-400 text-xs transition-colors px-2">Trekk deg</button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {!past && (
            <div className="border-t border-gray-800">
              {isSignedUp ? (
                <div className={`py-3 text-center text-sm font-medium transition-all duration-300 ${justSignedUp ? "bg-green-800 text-green-200" : "text-green-400 bg-green-950 bg-opacity-20"}`}>
                  ✓ Du er påmeldt — kjør hardt! 🔥
                </div>
              ) : isOnWaitlist ? (
                <div className="py-3 text-center text-sm text-yellow-400 bg-yellow-950 bg-opacity-20">
                  ⏳ Venteliste – plass {waitPos}
                </div>
              ) : (
                <button onClick={handleSignup} disabled={!nameLC}
                  className={`w-full py-3 text-sm font-medium transition-all duration-150 active:scale-95 ${
                    !nameLC ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : full ? "bg-yellow-700 hover:bg-yellow-600 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}>
                  {full ? "🕐 Sett meg på venteliste" : "🚴 Meld på"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Session Modal ────────────────────────────────────────────
function SessionModal({ session, monday, onSave, onClose }) {
  const getDefaultDate = () => {
    const d = new Date(monday); const today = new Date();
    if (today > monday) { const diff = Math.ceil((today - monday) / 86400000); d.setDate(d.getDate() + Math.min(diff, 6)); }
    return toLocalDateStr(d);
  };
  const [date, setDate] = useState(session?.date || getDefaultDate());
  const [time, setTime] = useState(session?.time || "19:40");
  const [label, setLabel] = useState(session?.label || "Spinning");
  const isEdit = !!session?.id;
  const dayNames = ["Man","Tir","Ons","Tor","Fre","Lør","Søn"];
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{isEdit ? "Rediger økt" : "Ny økt"}</h3>
        <label className="block text-sm text-gray-400 mb-2">Dag</label>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDates.map((wd, i) => {
            const dateStr = toLocalDateStr(wd);
            const isSelected = date === dateStr;
            const dayPast = wd < new Date(new Date().setHours(0,0,0,0));
            return (
              <button key={i} onClick={() => !dayPast && setDate(dateStr)} disabled={dayPast}
                className={`py-2 rounded-lg text-center transition-colors ${dayPast ? "text-gray-700 cursor-not-allowed" : isSelected ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                <div className="text-xs">{dayNames[i]}</div>
                <div className="text-sm font-medium">{wd.getDate()}</div>
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          <Input label="Klokkeslett (24t)" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Input label="Beskrivelse" type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Spinning, Intervall, Rolig..." />
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" onClick={onClose}>Avbryt</Button>
          <Button onClick={() => onSave({ ...session, date, time, label })} disabled={!date || !time}>
            {isEdit ? "Lagre" : "Opprett"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Login Modal ──────────────────────────────────────────────
function LoginModal({ admins, onLogin, onClose }) {
  const [user, setUser] = useState(""); const [pass, setPass] = useState(""); const [error, setError] = useState(false);
  const tryLogin = () => {
    const match = admins.find((a) => a.username.toLowerCase() === user.toLowerCase() && a.password === pass);
    if (match) onLogin(match.username);
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Admin-innlogging</h3>
        <div className="space-y-3">
          <Input placeholder="Brukernavn" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryLogin()} />
          <Input placeholder="Passord" type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryLogin()} />
          {error && <p className="text-red-400 text-sm">Feil brukernavn eller passord</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" onClick={onClose}>Avbryt</Button>
          <Button onClick={tryLogin}>Logg inn</Button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ──────────────────────────────────────────────
function AdminPanel({ data, onSave, onLogout }) {
  const admin = data.admins[0];
  const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [webhook, setWebhook] = useState(data.teamsWebhook || "");
  const [maxSpots, setMaxSpots] = useState(data.maxSpots || MAX_SPOTS);
  const [saved, setSaved] = useState("");
  const flash = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 2000); };

  const changePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    onSave({ ...data, admins: [{ ...admin, password: newPassword }] });
    setNewPassword(""); setConfirmPassword(""); flash("Passord endret");
  };
  const saveSettings = () => {
    onSave({ ...data, teamsWebhook: webhook, maxSpots: parseInt(maxSpots) || MAX_SPOTS });
    flash("Lagret");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">⚙️ Admin</h2>
        <Button variant="ghost" size="sm" onClick={onLogout}>Logg ut</Button>
      </div>
      {saved && <div className="mb-4 bg-green-900 bg-opacity-40 text-green-300 text-sm px-4 py-2 rounded-xl">✓ {saved}</div>}
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-medium">Innlogget som <span className="text-white">{admin.username}</span></p>
          <Input label="Nytt passord" type="password" placeholder="Nytt passord" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Bekreft passord" type="password" placeholder="Gjenta passord" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button onClick={changePassword} disabled={!newPassword || newPassword !== confirmPassword}>Endre passord</Button>
        </div>
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <Input label="Maks plasser per økt" type="number" value={maxSpots} onChange={(e) => setMaxSpots(e.target.value)} />
          <div>
            <Input label="Teams Webhook URL" type="url" placeholder="https://outlook.office.com/webhook/..." value={webhook} onChange={(e) => setWebhook(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Varsler Teams-kanalen ved nye økter, avlysninger og endringer.</p>
          </div>
          <Button onClick={saveSettings}>Lagre innstillinger</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function SpinningNjord() {
  const [data, save, apiError] = useStorage();
  const [weekOffset, setWeekOffset] = useState(0);
  const [userName, setUserName] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const sunday = useMemo(() => { const s = new Date(monday); s.setDate(s.getDate() + 6); return s; }, [monday]);
  const weekNum = getWeekNumber(monday);
  const isAdmin = !!adminUser;

  const weekSessions = useMemo(() => {
    if (!data) return [];
    return data.sessions.filter((s) => isSameWeek(s.date, monday)).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [data, monday]);

  if (!data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <BikeBackground />
      <div className="text-gray-400 z-10">Kobler til server...</div>
    </div>
  );

  const updateSession = (id, fn) => save({ ...data, sessions: data.sessions.map((s) => (s.id === id ? fn(s) : s)) });
  const deleteSession = (id) => save({ ...data, sessions: data.sessions.filter((s) => s.id !== id) });

  const handleSignup = (sessionId) => {
    if (!userName.trim()) return;
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const name = userName.trim(); const lc = name.toLowerCase();
    if (session.signups.some((n) => n.toLowerCase() === lc) || session.waitlist.some((n) => n.toLowerCase() === lc)) return;
    const spots = data.maxSpots || MAX_SPOTS;
    if (session.signups.length < spots) {
      updateSession(sessionId, (s) => ({ ...s, signups: [...s.signups, name] }));
      notifyTeams(data.teamsWebhook, `✅ **${name}** meldte seg på ${fmtFull(session.date)} kl. ${session.time} (${session.signups.length + 1}/${spots})`);
    } else {
      updateSession(sessionId, (s) => ({ ...s, waitlist: [...s.waitlist, name] }));
      notifyTeams(data.teamsWebhook, `⏳ **${name}** på venteliste for ${fmtFull(session.date)} kl. ${session.time}`);
    }
  };

  const handleLeave = (sessionId, person, listType) => {
    updateSession(sessionId, (s) => {
      const u = { ...s };
      if (listType === "signup") {
        u.signups = s.signups.filter((n) => n.toLowerCase() !== person.toLowerCase());
        if (s.waitlist.length > 0) {
          const promoted = s.waitlist[0];
          u.signups = [...u.signups, promoted]; u.waitlist = s.waitlist.slice(1);
          notifyTeams(data.teamsWebhook, `🎉 **${promoted}** rykket opp fra ventelisten til ${fmtFull(s.date)} kl. ${s.time}!`);
        }
      } else { u.waitlist = s.waitlist.filter((n) => n.toLowerCase() !== person.toLowerCase()); }
      return u;
    });
  };

  const handleCancel = (id) => {
    const s = data.sessions.find((x) => x.id === id);
    updateSession(id, (x) => ({ ...x, status: "cancelled" }));
    if (s) notifyTeams(data.teamsWebhook, `❌ ${fmtFull(s.date)} kl. ${s.time} er **avlyst**!`);
  };
  const handleRestore = (id) => updateSession(id, (s) => ({ ...s, status: "active" }));

  const handleSaveSession = (sd) => {
    if (sd.id) {
      const old = data.sessions.find((s) => s.id === sd.id);
      updateSession(sd.id, (s) => ({ ...s, date: sd.date, time: sd.time, label: sd.label }));
      if (old && (old.date !== sd.date || old.time !== sd.time))
        notifyTeams(data.teamsWebhook, `📅 Økt endret fra ${fmtFull(old.date)} kl. ${old.time} til **${fmtFull(sd.date)} kl. ${sd.time}**`);
    } else {
      const ns = { id: uid(), date: sd.date, time: sd.time, label: sd.label || "Spinning", status: "active", signups: [], waitlist: [] };
      save({ ...data, sessions: [...data.sessions, ns] });
      notifyTeams(data.teamsWebhook, `🆕 Ny økt: **${fmtFull(sd.date)} kl. ${sd.time}**`);
    }
    setEditSession(null); setShowNewSession(false);
  };

  const active = weekSessions.filter((s) => s.status !== "cancelled");
  const cancelled = weekSessions.filter((s) => s.status === "cancelled");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ position: "relative" }}>
      <BikeBackground />
      <Confetti active={confettiActive} onDone={() => setConfettiActive(false)} />

      <div className="max-w-lg mx-auto p-4 pb-24" style={{ position: "relative", zIndex: 1 }}>

        {apiError && (
          <div className="mb-4 bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-2 rounded-xl">
            ⚠️ {apiError} – viser lokal tilstand
          </div>
        )}

        <div className="text-center mb-5">
          <SpinningWheelIcon />
          <h1 className="text-2xl font-bold text-white">Spinning Njord A</h1>
          <p className="text-gray-500 text-sm mt-1">Maks {data.maxSpots || MAX_SPOTS} plasser · Automatisk opprykk fra venteliste</p>
          <RotatingQuote />
        </div>

        <div className="flex gap-2 mb-5">
          <input type="text" placeholder="Skriv inn navnet ditt..." value={userName} onChange={(e) => setUserName(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm" />
          <button onClick={() => (isAdmin ? setShowAdmin(!showAdmin) : setShowLogin(true))}
            className={`px-3 rounded-xl border transition-colors text-sm ${isAdmin ? "border-blue-600 text-blue-400 hover:bg-blue-950" : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500"}`}>
            {isAdmin ? "⚙️" : "🔒"}
          </button>
        </div>

        {isAdmin && showAdmin && (
          <div className="mb-5 bg-gray-900 bg-opacity-60 rounded-2xl p-5 border border-gray-800">
            <AdminPanel data={data} onSave={save} onLogout={() => { setAdminUser(null); setShowAdmin(false); }} />
          </div>
        )}

        <div className="flex items-center justify-between mb-5 bg-gray-900 bg-opacity-80 rounded-xl p-3 border border-gray-800">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">←</button>
          <div className="text-center flex flex-col items-center gap-1">
            <div className="font-semibold text-white">Uke {weekNum} · {fmtShort(monday)} – {fmtShort(sunday)}</div>
            <div className="text-xs text-gray-400">{monday.getFullYear()}</div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-0.5">⬤ I dag</button>
            )}
          </div>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">→</button>
        </div>

        {isAdmin && (
          <button onClick={() => setShowNewSession(true)}
            className="w-full mb-4 py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-blue-500 hover:bg-blue-950 hover:bg-opacity-20 transition-all text-sm font-medium">
            + Legg til økt
          </button>
        )}

        <div className="space-y-4">
          {active.length === 0 && cancelled.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-30">🚴</div>
              <p className="text-gray-500">Ingen økter denne uka</p>
              {isAdmin && <p className="text-gray-600 text-sm mt-1">Trykk «+ Legg til økt» for å opprette</p>}
              {!isAdmin && <p className="text-gray-600 text-sm mt-1">Økter legges ut av admin</p>}
            </div>
          ) : (
            <>
              {active.map((s) => (
                <SessionCard key={s.id} session={s} userName={userName}
                  onSignup={handleSignup} onLeave={handleLeave}
                  maxSpots={data.maxSpots || MAX_SPOTS} isAdmin={isAdmin}
                  onEdit={setEditSession} onCancel={handleCancel}
                  onRestore={handleRestore} onDelete={deleteSession}
                  onConfetti={() => setConfettiActive(true)} />
              ))}
              {cancelled.map((s) => (
                <SessionCard key={s.id} session={s} userName={userName}
                  onSignup={handleSignup} onLeave={handleLeave}
                  maxSpots={data.maxSpots || MAX_SPOTS} isAdmin={isAdmin}
                  onEdit={setEditSession} onCancel={handleCancel}
                  onRestore={handleRestore} onDelete={deleteSession}
                  onConfetti={() => setConfettiActive(true)} />
              ))}
            </>
          )}
        </div>

        <div className="text-center text-gray-700 text-xs mt-8 space-y-1"><p>Vel møtt! 💪</p><p>Laget av Fredrik Karlsen</p></div>
      </div>

      {showLogin && (
        <LoginModal admins={data.admins}
          onLogin={(u) => { setAdminUser(u); setShowLogin(false); setShowAdmin(true); }}
          onClose={() => setShowLogin(false)} />
      )}
      {(editSession || showNewSession) && (
        <SessionModal session={editSession || {}} monday={monday} onSave={handleSaveSession}
          onClose={() => { setEditSession(null); setShowNewSession(false); }} />
      )}
    </div>
  );
}
