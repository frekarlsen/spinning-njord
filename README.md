# 🚴 Spinning Njord A

Påmeldingssystem for spinning-økter på Njord A-plattformen.

## Tech stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + SQLite
- **Hosting:** Docker på Unraid, tilgjengelig via Cloudflare Tunnel

## Funksjoner

- Påmelding/avmelding med navnefelt
- Venteliste med automatisk opprykk
- Admin-panel (opprett, rediger, avlys økter)
- Teams webhook-varsling
- Dual-mode tema: Profesjonell modus + Njord Modus 🚴
- Mobilvennlig design

## Kom i gang

```bash
git clone https://github.com/frekarlsen/spinning-njord.git
cd spinning-njord
cp .env.example .env
# Rediger .env med din egen API_KEY
docker compose up -d --build
```

Appen kjører på `http://din-ip:3456`

## Oppdatering

```bash
cd /path/to/spinning-njord
git pull
docker compose up -d --build
```

## Backup

```bash
curl -H "x-api-key: DIN_API_NØKKEL" \
     http://localhost:3456/api/backup \
     -o backup-$(date +%Y%m%d).json
```

## Standard admin-innlogging

- Brukernavn: `admin`
- Passord: `njord2025`

> Bytt passord via admin-panelet etter første innlogging.

---

Laget av Fredrik Karlsen
