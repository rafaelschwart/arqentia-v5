# Arqentia — v5

The full Arqentia website + Discovery flow + Admin console. Deployed at
**[arqentia-v5.vercel.app](https://arqentia-v5.vercel.app)**.

This repo contains everything needed to deploy a clean copy: marketing site,
voice + text discovery intake, prospect dashboards, the 14-agent admin editor
suite, and per-call API cost telemetry.

---

## Quick start

```bash
git clone https://github.com/<owner>/arqentia-v5.git
cd arqentia-v5
npm install
cp .env.local.example .env.local        # fill in real secrets
npx vercel dev --listen 4321             # http://localhost:4321
```

## Deploy to production

See **[`DEPLOY-v5.md`](DEPLOY-v5.md)** for the full partner checklist —
Vercel link, Supabase migrations, env vars, and the smoke-test plan.

The current production deploy:
- Vercel project: `arqentia-v5` (Pro plan required — 25 serverless functions)
- Supabase project: `onzssudfksyiibtoppse`
- Node runtime: **22.x** (required — 20 breaks Supabase realtime WebSocket)

---

## What's in this repo

```
api/                  Vercel serverless functions
├── admin/            cookie-gated admin endpoints
├── discovery/        prospect-facing endpoints (start / answer / complete / demo / voice)
└── _lib/             shared (Supabase, Claude SDK, OpenAI Realtime, usage tracking)

discovery/            client surfaces (login, voice, text, profile, admin, demo)

.claude/agents/       runtime agent definitions (14 dashboard specialists +
                      Claude Code design subagents). Loaded at server start
                      by api/_lib/agent-loader.js.

supabase/migrations/  schema — apply in order via Supabase SQL Editor
├── 0001_discovery_schema.sql
├── 0002_demo_payloads.sql
└── 0003_token_usage.sql                # API cost telemetry (v5 addition)

index.html, tokens.css, _assets/, industries/, demo/    marketing site

DEPLOY-v5.md          partner deploy guide
CLAUDE.md             architecture notes (project root context)
vercel.json           rewrites + function config
package.json          Node 22.x, type:module
```

## What's NOT in this repo (intentional)

- `.env.local` — real secrets (gitignored; see `.env.local.example` for the keys)
- `node_modules/` — run `npm install`
- `.vercel/` — re-link locally with `vercel link`
- `.git.local-history.bak/` — preserved local history from the migration
- Internal specs, archived backups, transient logs

---

## Key features in v5

### Discovery flow
- Voice agent (OpenAI Realtime API, `gpt-realtime`) with WebRTC + `gpt-4o-mini-transcribe` STT
- Tightened opening script (~12 s instead of ~30 s)
- Auto-end on sentinel phrase with 10 s cancel countdown
- Text wizard fallback at `/discovery/text`
- Bilingual (EN / ES) end-to-end

### Prospect profile (`/discovery/p/<token>`)
- Mandatory firstrun gate (email + password) with personalized greet + trust strip
- Completion gauge per discovery section with quality scoring
- Inline edit or "Talk to AI" voice-fill for missing fields
- Personalized demo dashboard preview

### Admin console (`/arqentia/admin`)
- Kanban prospect list with status filters + sector tagging
- Three-pane layout: list / detail / chat editor
- Embedded demo iframe with shimmer skeleton
- **14-agent chat editor** — natural-language dashboard edits routed to
  specialists (headline writer, KPI designer, ROI calculator, etc.).
  Free-form prompts mentioning "free editor" or "main agent" route to a
  general-purpose Claude (Sonnet 4.6 / Opus 4.7 dynamic) for cross-cutting
  changes.
- **API cost telemetry** — every Claude + OpenAI Realtime call logs tokens
  + USD cost to Supabase. Admin sees daily totals, top spenders, and
  per-prospect breakdown with full call history.

### Backend
- Anthropic SDK with prompt caching cost tracking
- Supabase service role for full DB access (server-side only)
- Resend for transactional email

---

## License + handoff

Private project — push from this repo to your team's Vercel + Supabase per
`DEPLOY-v5.md`. Rotate the API keys before going live (the dev set has been
flagged for rotation).

Questions: [Hi@rafaelschwart.com](mailto:Hi@rafaelschwart.com).
