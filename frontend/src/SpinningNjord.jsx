import { useState, useEffect, useCallback, useMemo } from "react";

const MAX_SPOTS = 10;

// API_KEY leses fra miljøvariabel satt under bygg
// VITE_ prefix gjør at Vite inkluderer den i klient-bundle
const API_KEY = import.meta.env.VITE_API_KEY || "njord-secret-change-me";
const API_BASE = "/api";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function getMondayOfWeek(weekOffset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function fmtFull(d) {
  const date = typeof d === "string" ? parseLocalDate(d) : new Date(d);
  const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  return `${days[date.getDay()]} ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

function fmtShort(d) {
  const date = typeof d === "string" ? parseLocalDate(d) : new Date(d);
  return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

function fmt24h(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Parser "YYYY-MM-DD" som lokal tid (ikke UTC) for å unngå dag-skift i norsk tidssone
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Lager "YYYY-MM-DD" fra et lokalt Date-objekt (ikke toISOString som gir UTC)
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameWeek(dateStr, monday) {
  const d = parseLocalDate(dateStr);
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return d >= monday && d <= sun;
}

function isPast(dateStr, time) {
  const d = parseLocalDate(dateStr);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h + 1, m, 0, 0);
  return new Date() > d;
}

function defaultState() {
  return {
    admins: [{ username: "admin", password: "njord2025" }],
    sessions: [],
    teamsWebhook: "",
    maxSpots: MAX_SPOTS,
  };
}

// ── API-basert storage hook ──────────────────────────────────
function useStorage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/data`, {
      headers: { "x-api-key": API_KEY },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json && typeof json === "object" && !json.error) {
          setData({ ...defaultState(), ...json });
        } else {
          setData(defaultState());
        }
      })
      .catch(() => {
        setError("Klarte ikke koble til server");
        setData(defaultState());
      });
  }, []);

  const save = useCallback(async (newData) => {
    setData(newData);
    try {
      await fetch(`${API_BASE}/data`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(newData),
      });
    } catch {
      // Stille feil – data er allerede oppdatert lokalt i state
    }
  }, []);

  return [data, save, error];
}

async function notifyTeams(url, msg) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        summary: "Spinning",
        themeColor: "3B82F6",
        title: "🚴 Spinning Njord A",
        text: msg,
      }),
    });
  } catch {}
}

function Badge({ children, color = "gray" }) {
  const c = {
    gray: "bg-gray-800 text-gray-400",
    blue: "bg-blue-900 text-blue-300",
    red: "bg-red-900 text-red-300",
    yellow: "bg-yellow-900 text-yellow-300",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c[color]}`}>
      {children}
    </span>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-400 mb-1.5">{label}</label>}
      <input
        {...props}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
      />
    </div>
  );
}

function Button({ children, onClick, disabled, variant = "primary", size = "md", className = "" }) {
  const base = "font-medium rounded-xl transition-all duration-150 ";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "w-full py-3 text-sm" };
  const v = {
    primary: disabled
      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95",
    danger: disabled
      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
      : "bg-red-600 hover:bg-red-500 text-white active:scale-95",
    ghost: disabled
      ? "text-gray-700 cursor-not-allowed"
      : "text-gray-400 hover:text-white hover:bg-gray-800 active:scale-95",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${v[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ── Session Card ──────────────────────────────────────────────
function SessionCard({ session, userName, onSignup, onLeave, maxSpots, isAdmin, onEdit, onCancel, onRestore, onDelete }) {
  const past = isPast(session.date, session.time);
  const cancelled = session.status === "cancelled";
  const list = session.signups || [];
  const waitlist = session.waitlist || [];
  const full = list.length >= maxSpots;
  const nameLC = userName?.trim().toLowerCase();
  const isSignedUp = nameLC && list.some((n) => n.toLowerCase() === nameLC);
  const isOnWaitlist = nameLC && waitlist.some((n) => n.toLowerCase() === nameLC);
  const waitPos = isOnWaitlist ? waitlist.findIndex((n) => n.toLowerCase() === nameLC) + 1 : 0;

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all ${
        cancelled ? "border-red-900 opacity-50" : past ? "border-gray-800 opacity-50" : "border-gray-800 hover:border-gray-700"
      }`}
    >
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
            <>
              <Badge color={full ? "red" : list.length > 0 ? "blue" : "gray"}>
                {list.length}/{maxSpots}
              </Badge>
              {waitlist.length > 0 && <Badge color="yellow">{waitlist.length} venter</Badge>}
            </>
          )}
          {isAdmin && !past && (
            <div className="flex gap-1 ml-1">
              {!cancelled && (
                <button
                  onClick={() => onEdit(session)}
                  className="text-gray-500 hover:text-blue-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors"
                  title="Rediger"
                >✎</button>
              )}
              {cancelled ? (
                <>
                  <button onClick={() => onRestore(session.id)} className="text-gray-500 hover:text-green-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Gjenopprett">↩</button>
                  <button onClick={() => onDelete(session.id)} className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-gray-800 transition-colors" title="Slett permanent">🗑</button>
                </>
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
          <div className="bg-gray-900 bg-opacity-40">
            {list.length === 0 && waitlist.length === 0 ? (
              <div className="px-4 py-3 text-gray-600 text-sm italic">Ingen påmeldte ennå</div>
            ) : (
              <>
                {list.map((person, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between border-t border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-5 text-right">{i + 1}.</span>
                      <span className="text-gray-200">{person}</span>
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
                          <span className="text-gray-400">{person}</span>
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
                <div className="py-3 text-center text-sm text-green-400 bg-green-950 bg-opacity-20">✓ Du er påmeldt</div>
              ) : isOnWaitlist ? (
                <div className="py-3 text-center text-sm text-yellow-400 bg-yellow-950 bg-opacity-20">Venteliste – plass {waitPos}</div>
              ) : (
                <button
                  onClick={() => onSignup(session.id)}
                  disabled={!nameLC}
                  className={`w-full py-3 text-sm font-medium transition-colors ${
                    !nameLC ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : full ? "bg-yellow-700 hover:bg-yellow-600 text-white cursor-pointer"
                    : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  }`}
                >
                  {full ? "Sett meg på venteliste" : "Meld på"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Session Modal ─────────────────────────────────────────────
function SessionModal({ session, monday, onSave, onClose }) {
  const getDefaultDate = () => {
    const d = new Date(monday);
    const today = new Date();
    if (today > monday) {
      const diff = Math.ceil((today - monday) / 86400000);
      d.setDate(d.getDate() + Math.min(diff, 6));
    }
    return toLocalDateStr(d);
  };

  const [date, setDate] = useState(session?.date || getDefaultDate());
  const [time, setTime] = useState(session?.time || "19:40");
  const [label, setLabel] = useState(session?.label || "Spinning");
  const isEdit = !!session?.id;

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{isEdit ? "Rediger økt" : "Ny økt"}</h3>
        <label className="block text-sm text-gray-400 mb-2">Dag</label>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDates.map((wd, i) => {
            const dateStr = toLocalDateStr(wd);
            const isSelected = date === dateStr;
            const dayPast = wd < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <button key={i} onClick={() => !dayPast && setDate(dateStr)} disabled={dayPast}
                className={`py-2 rounded-lg text-center transition-colors ${dayPast ? "text-gray-700 cursor-not-allowed" : isSelected ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
              >
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

// ── Login Modal ───────────────────────────────────────────────
function LoginModal({ admins, onLogin, onClose }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

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

// ── Admin Panel ───────────────────────────────────────────────
function AdminPanel({ data, onSave, onLogout }) {
  const admin = data.admins[0];
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [webhook, setWebhook] = useState(data.teamsWebhook || "");
  const [maxSpots, setMaxSpots] = useState(data.maxSpots || MAX_SPOTS);
  const [saved, setSaved] = useState("");

  const flash = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 2000); };

  const changePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    onSave({ ...data, admins: [{ ...admin, password: newPassword }] });
    setNewPassword("");
    setConfirmPassword("");
    flash("Passord endret");
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

// ── Main App ──────────────────────────────────────────────────
export default function SpinningNjord() {
  const [data, save, apiError] = useStorage();
  const [weekOffset, setWeekOffset] = useState(0);
  const [userName, setUserName] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [showNewSession, setShowNewSession] = useState(false);

  const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const sunday = useMemo(() => {
    const s = new Date(monday);
    s.setDate(s.getDate() + 6);
    return s;
  }, [monday]);
  const weekNum = getWeekNumber(monday);
  const isAdmin = !!adminUser;

  const weekSessions = useMemo(() => {
    if (!data) return [];
    return data.sessions
      .filter((s) => isSameWeek(s.date, monday))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [data, monday]);

  if (!data)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Kobler til server...</div>
      </div>
    );

  const updateSession = (id, fn) =>
    save({ ...data, sessions: data.sessions.map((s) => (s.id === id ? fn(s) : s)) });

  const deleteSession = (id) =>
    save({ ...data, sessions: data.sessions.filter((s) => s.id !== id) });

  const handleSignup = (sessionId) => {
    if (!userName.trim()) return;
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const name = userName.trim();
    const lc = name.toLowerCase();
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
          u.signups = [...u.signups, promoted];
          u.waitlist = s.waitlist.slice(1);
          notifyTeams(data.teamsWebhook, `🎉 **${promoted}** rykket opp fra ventelisten til ${fmtFull(s.date)} kl. ${s.time}!`);
        }
      } else {
        u.waitlist = s.waitlist.filter((n) => n.toLowerCase() !== person.toLowerCase());
      }
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
    setEditSession(null);
    setShowNewSession(false);
  };

  const active = weekSessions.filter((s) => s.status !== "cancelled");
  const cancelled = weekSessions.filter((s) => s.status === "cancelled");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-lg mx-auto p-4 pb-24">

        {apiError && (
          <div className="mb-4 bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-2 rounded-xl">
            ⚠️ {apiError} – viser lokal tilstand
          </div>
        )}

        <div className="text-center mb-5">
          <div className="text-4xl mb-1">🚴</div>
          <h1 className="text-2xl font-bold text-white">Spinning Njord A</h1>
          <p className="text-gray-500 text-sm mt-1">Maks {data.maxSpots || MAX_SPOTS} plasser · Automatisk opprykk fra venteliste</p>
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

        <div className="flex items-center justify-between mb-5 bg-gray-900 rounded-xl p-3">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">←</button>
          <div className="text-center flex flex-col items-center gap-1">
            <div className="font-semibold text-white">Uke {weekNum} · {fmtShort(monday)} – {fmtShort(sunday)}</div>
            <div className="text-xs text-gray-400">{monday.getFullYear()}</div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-0.5">
                I dag
              </button>
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
                <SessionCard key={s.id} session={s} userName={userName} onSignup={handleSignup} onLeave={handleLeave}
                  maxSpots={data.maxSpots || MAX_SPOTS} isAdmin={isAdmin} onEdit={setEditSession} onCancel={handleCancel} onRestore={handleRestore} onDelete={deleteSession} />
              ))}
              {cancelled.map((s) => (
                <SessionCard key={s.id} session={s} userName={userName} onSignup={handleSignup} onLeave={handleLeave}
                  maxSpots={data.maxSpots || MAX_SPOTS} isAdmin={isAdmin} onEdit={setEditSession} onCancel={handleCancel} onRestore={handleRestore} onDelete={deleteSession} />
              ))}
            </>
          )}
        </div>

        <div className="text-center text-gray-700 text-xs mt-8">Vel møtt! 💪</div>
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
