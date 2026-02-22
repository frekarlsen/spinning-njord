import { useState, useEffect, useCallback, useMemo } from "react";

// --- TIDSSONE-FIX ---
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  // Dette lager datoen som lokal midnatt i Norge
  return new Date(year, month - 1, day).getTime();
};

const MAX_SPOTS = 10;
const API_KEY = "njord-secret-change-me"; // Endre denne til din nøkkel
const API_BASE = "/api";

export default function SpinningNjord() {
  const [data, setData] = useState({ sessions: [], admins: [] });
  const [userName, setUserName] = useState(localStorage.getItem("njord_user") || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSession, setNewSession] = useState({ date: "", time: "18:00", type: "Intervall", instructor: "" });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data`, { headers: { "x-api-key": API_KEY } });
      const json = await res.json();
      if (json) setData(json);
    } catch (e) { console.error("Henting feilet", e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const save = async (newData) => {
    setData(newData);
    await fetch(`${API_BASE}/data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(newData)
    });
  };

  const handleAddSession = () => {
    if (!newSession.date) return;
    
    const session = {
      id: Date.now(),
      // FIX: Bruker parseLocalDate istedenfor new Date().getTime()
      date: parseLocalDate(newSession.date),
      time: newSession.time,
      type: newSession.type,
      instructor: newSession.instructor,
      users: []
    };

    const newData = { ...data, sessions: [...data.sessions, session] };
    save(newData);
    setShowAddModal(false);
  };

  // Resten av din eksisterende JSX-kode for påmelding osv...
  return (
    <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
      <h1>Njord Spinning</h1>
      <button onClick={() => setShowAddModal(true)}>+ Legg til økt</button>
      
      {/* Enkel liste-visning som eksempel */}
      {data.sessions.map(s => (
        <div key={s.id} style={{border: '1px solid #ccc', margin: '10px 0', padding: '10px'}}>
          {new Date(s.date).toLocaleDateString('no-NO')} kl. {s.time} - {s.type}
        </div>
      ))}

      {showAddModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', padding: '20px'}}>
          <div style={{background: 'white', padding: '20px', color: 'black'}}>
            <h2>Ny økt</h2>
            <input type="date" onChange={e => setNewSession({...newSession, date: e.target.value})} />
            <input type="time" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} />
            <button onClick={handleAddSession}>Lagre</button>
            <button onClick={() => setShowAddModal(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  );
}
