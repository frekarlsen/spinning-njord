# 🚴 Spinning Njord A

Påmeldingssystem for spinning-økter på Njord A-plattformen.

## Tech stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + SQLite
- **Hosting:** Docker på Unraid, tilgjengelig via Cloudflare Tunnel

## Funksjoner

- Påmelding/avmelding med navnefelt
- Confetti-effekt ved påmelding 🎉
- Venteliste med automatisk opprykk
- Admin-panel (opprett, rediger, avlys økter)
- Teams webhook + ntfy.sh push-varsling
- Njord A Cycling Team-tema med animerte syklister
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

## Varsler

Støtter to varslingskanaler (konfigureres i admin-panelet):

- **Teams Webhook** — meldinger til Teams-kanal
- **ntfy.sh** — push-varsler til mobil. Last ned [ntfy-appen](https://ntfy.sh) og abonnér på ditt valgte topic.

## Standard admin-innlogging

- Brukernavn: `instruktør`
- Passord: `Njord2026`

> Bytt passord via admin-panelet etter første innlogging.

---

Laget av Fredrik Karlsen
