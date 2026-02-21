# 🚴 Spinning Njord A

Påmeldingssystem for spinning på Njord A — med venteliste og Teams-varsling.

## Deploy på Unraid

```bash
cd /mnt/user/appdata
git clone https://github.com/DITTBRUKERNAVN/spinning-njord.git
cd spinning-njord
cp .env.example .env
docker compose up -d --build
```

Appen er tilgjengelig på `http://[unraid-ip]:3456`

## Oppdatering

```bash
cd /mnt/user/appdata/spinning-njord
git pull
docker compose up -d --build
```

## Cloudflare Tunnel

Legg til public hostname i Cloudflare Zero Trust:

- **Subdomain:** spinning (eller kva du vil)
- **Domain:** dittdomene.no
- **Service:** http://spinning-web:80

## API-nøkkel

Rediger `.env` og sett ein sterk nøkkel:

```
API_KEY=din-nøkkel-her
```

> Nøkkelen beskyttar kommunikasjonen mellom frontend og backend.

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
