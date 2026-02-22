import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Activity, Trash2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- HJELPEFUNKSJONER FOR TIDSSONE-FIX ---
// Hindrer at datoen tolkes som UTC og hopper en dag tilbake
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  // Oppretter datoen som lokal tid (midnatt norsk tid)
  return new Date(year, month - 1, day).getTime();
};

const toLocalDateStr = (timestamp) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SpinningNjord = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSession, setNewSession] = useState({
    date: '',
    type: 'Intervall',
    duration: '',
    intensity: 'Moderat',
    notes: ''
  });

  const API_URL = '/api/data';
  const API_KEY = 'njord-secret-change-me'; // Bør samsvare med backend

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'x-api-key': API_KEY }
      });
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setSessions(data);
      }
      setLoading(false);
    } catch (err) {
      setError('Kunne ikke hente data');
      setLoading(false);
    }
  };

  const saveData = async (updatedSessions) => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(updatedSessions)
      });
    } catch (err) {
      setError('Kunne ikke lagre data');
    }
  };

  const handleAddSession = () => {
    if (!newSession.date || !newSession.duration) return;

    const sessionToAdd = {
      ...newSession,
      id: Date.now(),
      // FIX: Bruker lokal parsing istedenfor new Date().getTime()
      date: parseLocalDate(newSession.date)
    };

    const updatedSessions = [...sessions, sessionToAdd].sort((a, b) => b.date - a.date);
    setSessions(updatedSessions);
    saveData(updatedSessions);
    
    setNewSession({
      date: '',
      type: 'Intervall',
      duration: '',
      intensity: 'Moderat',
      notes: ''
    });
    setShowAddModal(false);
  };

  const deleteSession = (id) => {
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    saveData(updatedSessions);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Laster Njord-data...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="text-blue-600" /> Spinning Njord
        </h1>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Ny økt
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 border-dashed">
            Ingen økter registrert ennå. Tråkk i gang!
          </Card>
        ) : (
          sessions.map(session => (
            <Card key={session.id} className="overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{new Date(session.date).toLocaleDateString('no-NO')}</h3>
                      <p className="text-slate-600 font-medium">{session.type} • {session.duration} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.intensity === 'Høy' ? 'bg-red-100 text-red-700' :
                        session.intensity === 'Moderat' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {session.intensity}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => deleteSession(session.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {session.notes && <p className="mt-2 text-sm text-slate-500 italic">"{session.notes}"</p>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Legg til ny økt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dato</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded"
                  value={newSession.date}
                  onChange={e => setNewSession({...newSession, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={newSession.type}
                    onChange={e => setNewSession({...newSession, type: e.target.value})}
                  >
                    <option>Intervall</option>
                    <option>Langkjør</option>
                    <option>Restitusjon</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Varighet (min)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded"
                    value={newSession.duration}
                    onChange={e => setNewSession({...newSession, duration: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Intensitet</label>
                <div className="flex gap-2">
                  {['Lav', 'Moderat', 'Høy'].map(level => (
                    <Button 
                      key={level}
                      variant={newSession.intensity === level ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setNewSession({...newSession, intensity: level})}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notater</label>
                <textarea 
                  className="w-full p-2 border rounded"
                  value={newSession.notes}
                  onChange={e => setNewSession({...newSession, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Avbryt</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddSession}>Lagre økt</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SpinningNjord;
