const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY || "njord-secret-change-me";
const DATA_DIR = process.env.DATA_DIR || "./data";

// ── Opprett data-mappe og database ──────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "spinning.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"] || req.query.apiKey;
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Ugyldig API-nøkkel" });
  }
  next();
}

// ── Routes ───────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/data", requireApiKey, (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM store WHERE key = 'appdata'").get();
    if (!row) return res.json(null);
    res.json(JSON.parse(row.value));
  } catch (err) {
    console.error("GET /api/data feil:", err);
    res.status(500).json({ error: "Databasefeil" });
  }
});

app.put("/api/data", requireApiKey, (req, res) => {
  try {
    const value = JSON.stringify(req.body);
    db.prepare(`
      INSERT INTO store (key, value, updated_at)
      VALUES ('appdata', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(value, Date.now());
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/data feil:", err);
    res.status(500).json({ error: "Databasefeil" });
  }
});

app.get("/api/backup", requireApiKey, (req, res) => {
  try {
    const row = db.prepare("SELECT value, updated_at FROM store WHERE key = 'appdata'").get();
    if (!row) return res.status(404).json({ error: "Ingen data" });
    res.setHeader("Content-Disposition", `attachment; filename="spinning-backup-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(row.value);
  } catch (err) {
    res.status(500).json({ error: "Feil ved backup" });
  }
});

app.listen(PORT, () => {
  console.log(`🚴 Spinning Njord API kjører på port ${PORT}`);
  console.log(`   Data lagres i: ${path.resolve(DATA_DIR)}`);
});
