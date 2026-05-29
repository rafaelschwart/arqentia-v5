# Arqentia v5 — Partner deploy guide

This package contains the full Arqentia stack at v5: discovery flow, prospect
profile dashboard, admin console, the 14-agent dashboard editor suite, and
the API-cost telemetry layer. Built and audited on 2026-05-28.

---

## What's in the box

```
arqentia-v5/
├── api/                         all backend functions (Vercel serverless)
│   ├── admin/                   admin endpoints (cookie-gated)
│   ├── discovery/               prospect-facing endpoints
│   └── _lib/                    shared (Supabase, Claude, OpenAI, usage tracking)
├── discovery/                   client (login, voice, text, profile, admin, demo)
├── .claude/agents/              14 agent .md files loaded at runtime
├── supabase/migrations/         schema (0001 base, 0002 demo_payloads, 0003 token_usage)
├── _assets/                     marketing site OG cards
├── industries/                  marketing carousel videos
├── demo/                        marketing site demo screenshots
├── index.html                   marketing homepage
├── tokens.css                   global design tokens
├── package.json
├── vercel.json
├── .env.local.example           list of env vars needed
├── DEPLOY-v5.md                 this file
└── CLAUDE.md                    full architecture notes
```

What's NOT in the box (intentional):
- `.env.local` (real secrets — see env list below)
- `node_modules/` (run `npm install`)
- `.vercel/` (you'll re-link)
- `_ARCHIVED-*` / `_pre-migration-backup/` / `_inbox/` (noise)
- `logs/`, `Videos/`, `*.mp4` at root (transient or unused)

---

## ⚠ Vercel function-count note

This project ships **25 serverless functions** (each `.js` file in `api/**`).
**Vercel's Hobby plan caps a deployment at 12 functions** — you'll need to
deploy to a **Pro / team plan** for the full surface.

If you must deploy on Hobby, consolidate routes by merging files under
`api/discovery/*` or `api/admin/*` into action-routed handlers. Not
recommended; the current shape mirrors the frontend route map cleanly.

---

## 1 · Install + link

```bash
unzip arqentia-v5.zip
cd arqentia-v5
npm install
npx vercel link             # Pick your team + create/select an "arqentia" project
```

## 2 · Apply the Supabase migrations

The project uses Supabase at `https://onzssudfksyiibtoppse.supabase.co`. If
you're using the **same** Supabase project, migrations `0001` and `0002` are
already applied — you only need `0003`. If you're cloning to a **new**
Supabase project, run all three in order.

Paste each into Supabase SQL Editor and run:

1. `supabase/migrations/0001_discovery_schema.sql`
2. `supabase/migrations/0002_demo_payloads.sql`
3. `supabase/migrations/0003_token_usage.sql` ← enables the admin cost panel

## 3 · Set production environment variables

Pull from your Vercel project settings, or set via CLI:

```bash
npx vercel env add ARQ_COOKIE_SECRET production         # 48-byte hex — generate fresh
npx vercel env add ARQ_ADMIN_PASSWORD production        # admin login password
npx vercel env add OPENAI_API_KEY production            # for voice (Realtime API)
npx vercel env add ANTHROPIC_API_KEY production         # for all Claude calls
npx vercel env add SUPABASE_URL production              # https://onzssudfksyiibtoppse.supabase.co
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production # full DB access — server only
npx vercel env add RESEND_API_KEY production            # transactional email
npx vercel env add RESEND_FROM_EMAIL production         # hello@arqentia.com (verify the domain in Resend first)
npx vercel env add PUBLIC_SITE_URL production           # https://arqentia.com
npx vercel env add RAFAEL_NOTIFY_EMAIL production       # where new-prospect notifications land
```

See `.env.local.example` for the full list with notes.

**Pending key rotation:** the keys Rafael used in dev have been flagged for
rotation. Generate fresh ones in each provider's dashboard before going live.

## 4 · Deploy

```bash
npx vercel deploy                       # preview deploy first
# verify discovery + admin + voice all load
npx vercel deploy --prod                # promote to production
```

The preview URL will be `arqentia-<hash>.vercel.app`. Production points at
whatever domain you've attached in Vercel project settings (e.g. `arqentia.com`).

## 5 · Verify production

Smoke checklist:
- `GET /` → marketing homepage renders
- `GET /discovery` → voice vs text choice
- `GET /discovery/login` → sign-in with show/hide password
- `GET /arqentia/admin` → 401 (expected; sign in with the admin password)
- After admin sign-in: kanban list loads, prospect detail loads, API cost pill in topbar shows `$0.00`
- Fire one Claude edit from the admin chat → reload costs modal → row appears

---

## What changed in v5 (since v4)

### Discovery flow
- **Voice agent prompt tightened** (`api/_lib/openai.js`): opening script reduced from ~30s to ~12s — single sentence covers greet + mute hint + end-signal contract.
- **Whisper → gpt-4o-mini-transcribe** for input STT — noticeably better at Spanish accents + industry proper nouns ("bodega", "SAP Business One", WhatsApp).
- **EN/ES toggle visible in voice page header** (previously only inside the intro card).
- **Auto-end countdown banner** with 10-second timer + cancel after the AI says the end-signal phrase.

### Profile section
- **Personalized firstrun greet** — uses prospect's first name + company.
- **Trust strip** below the CTA (no spam · ~30 sec · delete anytime).
- **All emoji icons → SVG** (Lucide-style stroked): quality badges, lock icons, mic, pencil. Removes the chat-emoji feel from the dossier.
- **Toast notifications replace `alert()`** for errors.
- **ES grammar fix**: "FALTA EN TU PERFIL" → "FALTAN EN TU PERFIL".
- **"Password set" state** as a styled chip instead of a disabled-looking ghost button.

### Admin section
- **API cost telemetry** (new feature): `token_usage` table + per-call logging across all 7 Claude call sites + OpenAI Realtime. Admin sees daily totals + per-prospect breakdown.
- **Costs button** next to "Prospect view" on every detail header.
- **Topbar spend pill** shows today's $ — clickable, opens overview modal.
- **Specialist chips** show "Recs", "ROI", "KPIs" instead of `recommendations_generator`.
- **Pretty URL** in iframe metadata bar (slug from name, not the magic_token).
- **Kanban row tags capped at 2** (sector + demo status). Drops the redundant "completed" tag.
- **$0 day bar fix** in the cost chart — no longer shows a 2px bar that lies.
- **Topbar spend skeleton** shimmer while loading.
- **Costs modal** with bucket cards, 14-day bar chart, by-provider, by-model, top-spenders, recent-calls.
- **Empty states designed** for list, detail, editor.
- **Sticky-bar fix** inside the demo iframe (previously the global header was sticky and followed scroll).
- **Sector translation** (`manufactura` → `Manufacturing` in EN admin).
- **Focus rings + responsive breakpoints + reduced-motion** across the panel.
- **EN/ES "llms" → "llam."** abbreviation fix.

### Backend
- **`api/_lib/usage.js`** centralizes pricing + logging for Anthropic + OpenAI calls. Costs are computed at insert so future price changes don't rewrite history.
- **Freeform-editor priority routing**: mentioning "free editor" / "main agent" / "use claude" in the admin chat now overrides any other matched specialist.

---

## Known follow-ups (not blocking v5)

1. **Function-count refactor** — bundle related endpoints to fit Hobby plan if you want to mirror v5 to a free environment.
2. **End-signal contract hardening** — voice agent currently uses a fuzzy phrase match. Switch to a structured Realtime function-call (`mark_interview_complete`) for true reliability.
3. **End-call retry UX** — if `/voice/end-call` fails, redirect still fires. Add a one-retry-then-show-banner flow.
4. **Q0 over voice** — voice transcripts of email addresses are the #1 failure mode. Consider collecting only first name on voice and email/phone on the firstrun gate instead.
5. **Mic-denied recovery** — surface a "type your answers instead" CTA pointing at `/discovery/text` on `getUserMedia` rejection.
6. **Costs modal focus trap** — for full WCAG compliance, trap Tab inside the modal and restore focus on close.
7. **Token-usage all-time aggregate** at `api/admin/token-usage.js` currently pulls all rows. Replace with a DB-side `sum()` RPC once you have 6+ months of data.

---

Built and audited 2026-05-28. Questions: Rafael (Hi@rafaelschwart.com).
