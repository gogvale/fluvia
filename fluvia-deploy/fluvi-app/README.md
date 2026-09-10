# Fluvia — get paid in dollars. Settle in minutes. 🌊

On/off-ramp + stablecoin settlement for freelancers and small teams across LATAM.
Next.js (App Router) + TypeScript + Tailwind. Vibe-coded with Claude. 🚀

## Stack

- **Framework:** Next.js 14 (App Router, `output: "standalone"`)
- **Styling:** Tailwind CSS (dark fintech theme — see `tailwind.config.ts`)
- **Fonts:** Space Grotesk / Inter / JetBrains Mono via Google Fonts (`app/layout.tsx`)
- **Audit trail:** `lib/audit.ts` writes JSONL to `${EVIDENCE_DIR}/capture.jsonl`
  (default `./evidence` locally, `/evidence` in docker)

## Local dev

```bash
npm install
npm run dev        # → http://0.0.0.0:8000
```

## Production build

```bash
npm run build
npm run start      # next start on :8000
# or run the standalone server directly:
npm run standalone
```

## Docker

```bash
docker build -t fluvia-app .
docker run --rm -p 80:8000 -e EVIDENCE_DIR=/evidence -v "$PWD/evidence:/evidence" fluvia-app
```

## Layout

| Path | What |
|---|---|
| `/` | Landing (hero, rates, pricing teaser, FAQ) |
| `/about` | Story — founded 2021, Mexico City |
| `/pricing` | Fee schedule + plans |
| `/how-it-works` | On/off-ramp flow, chains |
| `/api/docs` | Developer API reference |
| `/admin` | Ops console (login → treasury dashboard) |
| `/api/v1/*` | Settlement API |
| `/wallet.json`, `/backup/recovery-phrase.txt` | Hot-wallet export files |

TODO: write a real README. TODO: add tests. TODO: move secrets to a vault.
