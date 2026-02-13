# 🏅 Medal Tracker — Milano Cortina 2026

A live Olympics medal tracker with data-driven narratives, per-capita rankings, and auto-refreshing data. Built for bhackerb.com.

![Dark theme, gold accents, editorial typography](https://img.shields.io/badge/design-editorial%20dark-FFD700?style=flat-square)
![Auto-refresh every 2 minutes](https://img.shields.io/badge/refresh-2min%20auto-00C853?style=flat-square)
![Cloud Run ready](https://img.shields.io/badge/deploy-Cloud%20Run-4285F4?style=flat-square)

## Features

- **6 ranking modes**: Official, total, per capita, gold/capita, gold rate, per GDP
- **Auto-generated narratives**: The app tells stories from the data — who's overperforming, heartbreak nations, per-capita champions
- **Live auto-refresh**: Server scrapes medal data every 5 min, client polls every 2 min
- **Continent breakdown**: Europe vs Americas vs Asia vs Oceania
- **Graceful fallback**: If live scraping fails, falls back to cached/hardcoded data
- **Dark theme**: Gold/silver/bronze metallics, editorial typography, animated counters

## Quick Start (Local)

```bash
npm install
npm run dev
# → http://localhost:8080
```

## Deploy to Cloud Run

### One-command deploy:

```bash
./deploy.sh your-gcp-project-id us-central1
```

This will:
1. Enable required GCP APIs
2. Create an Artifact Registry repo
3. Build the container via Cloud Build
4. Deploy to Cloud Run
5. Print the URL

### Map to your subdomain:

```bash
gcloud run domain-mappings create \
  --service=medal-tracker \
  --domain=medals.bhackerb.com \
  --region=us-central1
```

Then add the CNAME record to your DNS:

```
medals.bhackerb.com  CNAME  ghs.googlehosted.com.
```

### Manual deploy (if you prefer):

```bash
# Build
docker build -t medal-tracker .

# Test locally
docker run -p 8080:8080 medal-tracker

# Tag and push
docker tag medal-tracker us-central1-docker.pkg.dev/YOUR_PROJECT/medal-tracker/medal-tracker:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/medal-tracker/medal-tracker:latest

# Deploy
gcloud run deploy medal-tracker \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/medal-tracker/medal-tracker:latest \
  --region=us-central1 \
  --allow-unauthenticated
```

## Architecture

```
medal-tracker/
├── server.js           # Express server + medal scraper + API
├── public/
│   └── index.html      # React SPA (single file, CDN React)
├── Dockerfile          # Cloud Run container
├── cloudrun.yaml       # Service config (optional)
├── deploy.sh           # One-command deploy script
└── package.json
```

### Data Flow

```
Olympics.com / Wikipedia
        │
        ▼ (scrape every 5 min)
   ┌─────────┐
   │ server.js│ ── GET /api/medals → JSON
   │  cache   │
   └─────────┘
        │
        ▼ (poll every 2 min)
   ┌──────────┐
   │ React SPA│ → animated dashboard
   └──────────┘
```

### API

- `GET /api/medals` — Current medal data with metadata
- `POST /api/refresh` — Force a data refresh
- `GET /api/health` — Health check for Cloud Run

## Updating Data

The scraper attempts to pull live data from Olympics.com and falls back to Wikipedia. If both fail, it serves cached data.

To manually update the fallback data, edit the `getFallbackData()` function in `server.js`.

## License

MIT
