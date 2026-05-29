# Arqentia — Project Root

This folder (`c:/dev/arqentia website/`) is the **canonical Arqentia project**. Two things live here side-by-side:

1. **The live app** (discovery flow + admin panel + agent suite + Vercel deploy) — runtime code under `api/`, `discovery/`, `supabase/`, `.claude/agents/`
2. **The design workspace** (Refero / ui-ux-pro-max / power-design methodology for the marketing site + brand) — see the Design Expert section further down

If you opened this file mid-session, default to the App Architecture section below for runtime work. Drop into the Design Expert section only for marketing site / brand / pure-design tasks.

> **Historical note:** `c:/dev/Arqentia/v4-review/` was a stale fork. All code was migrated here on 2026-05-27 and v4-review was renamed to `_ARCHIVED-v4-review-migrated-2026-05-27`. **Never write code into the parent `Arqentia/` folder again.**

---

## 🏛 App Architecture

### Stack
- **Hosting:** Vercel (project linked via `.vercel/`)
- **DB:** Supabase (`prospects`, `profile_answers`, `profile_summaries`, `demo_payloads`, `events`, `notifications`)
- **Email:** Resend (FROM `hello@arqentia.com` with auto-fallback to `onboarding@resend.dev` until the arqentia.com domain is verified in Resend)
- **AI:** Anthropic Claude (haiku 4.5 + sonnet 4.6) for the 12-agent dashboard suite + the 7-pass pipeline; OpenAI Realtime (`gpt-realtime`) for voice
- **Dev server:** `npx vercel dev --listen 4321` from this folder

### Major surfaces
| Route | What it is | Code |
|---|---|---|
| `/` | Marketing site | `index.html` |
| `/discovery` | Voice vs text intake choice | `discovery/index.html` + `choice.js` |
| `/discovery/voice` | Live voice discovery (WebRTC → OpenAI Realtime) | `discovery/voice.html` + `voice.js` |
| `/discovery/voice?fill=<token>` | Scoped voice fill of missing profile fields (3-tries / 6h) | reuses voice.js, hits `/api/discovery/voice/fill-session` |
| `/discovery/text` | Form-wizard intake fallback | `discovery/text.html` + `wizard.js` |
| `/discovery/login` | Prospect sign-in (email + password) | `discovery/login.html` + `login.js` |
| `/discovery/p/<token>` | Prospect dashboard (profile + completion gate + AI summary) | `discovery/p.html` + `profile.js` |
| `/discovery/p/<token>/demo` | Prospect's personalized demo dashboard (live + chat + 10 recs + risks + roadmap + ROI) | `discovery/p-demo.html` + `demo-preview.js` |
| `/arqentia/admin` | Admin console (kanban list + detail + chat-driven dashboard editor) | `discovery/admin.html` + `admin.js` |

### API endpoints (`api/`)
- **Discovery:** `start`, `complete`, `profile` (GET/PATCH), `auth`, `demo` (GET), `demo/regenerate`, `demo/ask` (chat-on-demo)
- **Voice:** `voice/session`, `voice/end-call`, `voice/fill-session` (scoped fill)
- **Admin (all gated by `requireAdmin`):** `admin/login` (POST password / DELETE logout), `admin/magic` (POST request / GET verify), `admin/prospects` (list / detail), `admin/dashboard-generate` (build from scratch), `admin/dashboard-edit` (chat-driven 12-agent orchestrator), `admin/delete-prospect` (soft + hard), `admin/restore-prospect`

### Agents — single flat location: `.claude/agents/`

**All 23 agent definitions live FLAT in `.claude/agents/` — one folder, two categories distinguished by frontmatter:**

```
.claude/agents/
├── README-dashboard-agents.md         ← format spec for runtime agents
│
├── architect.md, copywriter.md, critic.md, director.md,
│   frontend-builder.md, mobile-designer.md, motion-designer.md,
│   optimizer.md, researcher.md, strategist.md, visual-designer.md
│   ↑ 11 Claude Code subagents. Frontmatter has `tools:` (no `keywords:`).
│   Invoked by Claude Code at dev time via the `Agent` tool with subagent_type.
│
├── activity_synthesizer.md, data_extractor.md, graph_expert.md,
│   headline_writer.md, insights_generator.md, kpi_designer.md,
│   pricing_strategist.md, process_optimizer.md, recommendations_generator.md,
│   risk_analyzer.md, roadmap_architect.md, roi_calculator.md
│   ↑ 12 runtime dashboard agents. Frontmatter has `keywords:` array
│   (used by api/_lib/agent-loader.js to detect them) + `model:`, `max_tokens:`,
│   `output_field:`, `output_transform:`. Loaded by the orchestrator at
│   api/_lib/dashboard-agents.js, called by api/admin/dashboard-edit when the
│   admin chats with the dashboard editor.
```

**The runtime loader filters by `keywords:` in frontmatter.** Claude Code subagents (no `keywords:`) are silently skipped. So both categories coexist in the same folder without interference. The dev-server boot log confirms: `[agent-loader] loaded 12 agent(s) from .../.claude/agents`.

**Editing runtime agents:** open any `.md` whose frontmatter has `keywords:` (the 12 dashboard ones), change the prompt body, `model` field (haiku / sonnet / opus), `max_tokens`, `keywords` (what admin prompts route to it), or `output_field`. Restart `vercel dev` after edits — loader caches at module load.

**Adding a 13th runtime agent:** drop a new `.md` file directly in `.claude/agents/` matching the frontmatter format in `README-dashboard-agents.md` (must include `keywords:` as a list — that's how the loader picks it up). Auto-discovered on next server start, no JS changes.

**Vercel deploy gotchas:**
- `.vercelignore` excludes `*.md` globally but explicitly un-ignores `!.claude/agents/**/*.md` so the runtime agents ship
- `vercel.json` has `functions["api/**/*.js"].includeFiles: ".claude/agents/**/*.md"` so the function bundle ships the agent files (runtime fs.readdirSync won't be detected by Vercel's static analyzer otherwise)

### Profile completion gate (Track A)
Demo generation is **gated** behind an 8-of-11 required fields check (`api/_lib/completeness.js`). When a voice/wizard run finishes incomplete, the demo isn't generated; the profile page shows a `% complete` banner + missing-field checklist with "Type it" (inline edit) and "Talk to AI" (rate-limited voice-fill) buttons. Adding a field via typing PATCHes `/api/discovery/profile` and auto-regenerates the demo if the edit pushes them over the threshold.

### Dashboard editor flow
Admin clicks a prospect → right pane opens with the prospect-facing demo iframe + a **chat panel powered by 12 specialist agents**. Admin types "Add 10 recommendations" or "Rewrite the headline mentioning their 38 employees" → orchestrator (`api/_lib/dashboard-agents.js`) matches keywords to specialists, dispatches them in parallel each with their declared model (haiku for structured, sonnet for reasoning-heavy), merges the patch into `demo_payloads.payload`, marks `edited:true`, refreshes the iframe.

### Admin auth
- **Password:** set via `ARQ_ADMIN_PASSWORD` env var. Dev = `Arqentia2026!`. Cookie lasts 30 days.
- **Magic link:** click "Email me a sign-in link" → 15-min signed token sent to `hello@arqentia.com` (will fall back to `onboarding@resend.dev` until arqentia.com domain is verified in Resend).
- All `/api/admin/*` endpoints check `requireAdmin(req, res)` — returns 401 if no cookie, 503 if `ARQ_ADMIN_PASSWORD` env var isn't set.

### Required env vars (`.env.local` in dev, Vercel Project Settings → Env in prod)
```
ARQ_COOKIE_SECRET             # for signing prospect cookies + admin magic-link tokens
ARQ_ADMIN_PASSWORD            # admin login (e.g. Arqentia2026!)
OPENAI_API_KEY                # voice (Realtime API)
ANTHROPIC_API_KEY             # all dashboard agents + chat-on-demo
SUPABASE_URL                  # https://onzssudfksyiibtoppse.supabase.co
SUPABASE_SERVICE_ROLE_KEY     # full DB access — never expose to client
RESEND_API_KEY                # transactional email
RESEND_FROM_EMAIL             # hello@arqentia.com (fallback to onboarding@resend.dev wired in code)
PUBLIC_SITE_URL               # http://localhost:4321 in dev, https://arqentia.com in prod
RAFAEL_NOTIFY_EMAIL           # where prospect notifications go
```

### Git
- Repo on branch `discovery-tab` (work-in-progress branch since the migration)
- `_pre-migration-backup/` at the project root contains the destination's old `index.html` + `.gitignore` from before the v4-review migration — preserved in case anything's needed from them, can be deleted once you've reviewed

### Static asset folders the marketing site depends on
Easy to miss in a fresh clone or re-migration. The root `index.html` references these — confirm they exist before assuming the page works:
- `industries/` — 8 sector videos (`0X-<slug>.mp4`) + matching PNG posters. Drives the carousel.
- `_assets/social/` — OG card images for link previews
- `demo/overview-pane.png` — referenced in the "what you'll see" section
- `tokens.css` — design tokens, sits at the root
- Favicons currently NOT shipped (`/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png` 404 — add them if you care about branded browser tabs)

Quick check: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/industries/01-manufacturing.mp4` should be `200`.

### Known pending
- Rotate the API keys that were pasted in chat history (OpenAI, Anthropic, Supabase service role, Resend)
- Verify `arqentia.com` domain in Resend dashboard (add DKIM + SPF DNS records in Vercel) so magic-link emails land in the actual `hello@arqentia.com` inbox instead of Resend's sandbox

---

# Website Design Expert

**Sole purpose:** produce production-grade website designs that do not read as AI-generated. Every output should pass the *"if I screenshot this, would it look distinctly like this product — not like every other AI-built page?"* test.

This workspace is a curated stack of four skills. Each one solves a different layer of the same problem (looking generic). They are meant to be used **together**, not interchangeably.

---

## ⛔ MANDATORY FIRST STEP — Refero MCP research

**Before creating, sketching, scaffolding, or writing a single line of design code, you MUST consult the Refero MCP.** No exceptions. No "I already know what this should look like." No "this one is simple." Every design task starts with research against real products.

**Required call sequence at the top of every design task:**

1. `get_design_guidance` for the screen type — best-practice baseline
2. `search_screens` with **at least 5 different query angles** (broad / company / style / element / platform), `limit=25+`
3. `get_screen` on **5–10 best results** with `include_similar: true` — this is the deep analysis, not the search snippets
4. (If the task involves a journey, not a single screen) `search_flows` → `get_flow`
5. Produce the **Research Summary** + **Steal List ≥5 items** with EXACT details (specific copy, numbers, hex values, spacing values) — never generic descriptions

**If Refero MCP is unreachable, STOP and tell the user.** Do not proceed to design from memory. The MCP is installed at **user scope** with an env-var-templated bearer token, so it should be online in every session. Verify with `claude mcp list` — expect `refero: https://api.refero.design/mcp (HTTP) - ✓ Connected`.

**Reinstall (only if the entry is missing or the token rotated):**

```bash
# 1. Token lives in c:\dev\website design expert\.env  (and Windows User env var REFERO_BEARER_TOKEN)
# 2. Re-add the MCP at user scope, single-quoted so the shell does NOT expand the var now —
#    Claude Code resolves ${REFERO_BEARER_TOKEN} from the OS env at connection time.
claude mcp remove refero
claude mcp add -s user --transport http refero https://api.refero.design/mcp \
  --header 'Authorization: Bearer ${REFERO_BEARER_TOKEN}'
```

If `claude mcp list` shows `! Needs authentication`, the env var isn't in the running Claude Code process's environment — **restart Claude Code** (env vars are inherited at process launch). On Windows, set the User env var with: `setx REFERO_BEARER_TOKEN <token>` (takes effect in the next session).

The Refero tools (`search_screens`, `search_flows`, `get_screen`, `get_flow`, `get_design_guidance`) must appear in the available toolset before any design work begins.

**This is the single rule that prevents AI slop.** Skipping research = generic output. Always.

---

## The five skills

| Skill | Path | What it gives you | When to reach for it |
|---|---|---|---|
| **refero** | [refero/SKILL.md](refero/SKILL.md) | Research-First methodology backed by the Refero MCP — 150K+ real product screens, 6K+ flows from Stripe/Linear/Notion/Vercel/etc. Search → analyze → extract patterns → infuse soul. | **Always start here** for any new screen, flow, or interface. Grounds every decision in real-world references instead of LLM averages. |
| **ui-ux-pro-max** | [ui-ux-pro-max-skill/](ui-ux-pro-max-skill/) | Searchable design intelligence: 67 UI styles, 161 color palettes, 57 font pairings, 99 UX rules, 25 chart types across 15+ stacks. BM25 + regex hybrid search via `python3 src/ui-ux-pro-max/scripts/search.py`. | Looking up palettes, font pairings, anti-patterns, or stack-specific guidelines (Tailwind, Next.js, SwiftUI, Flutter, etc.). Generating the project's design-system snapshot. |
| **power-design** | [power-design/SKILL.md](power-design/SKILL.md) | 21 codified, numerically-thresholded design principles (whitespace ≥40%, 8pt grid, ≤4 type sizes, AAA contrast, 60-30-10 color split, etc.) + 72 pre-built brand DNA tokens + Firecrawl brand extraction. | Any time you need rule-based validation: presentation decks, hero sections, marketing pages, anything where layout discipline matters. The 21 rules are a non-negotiable pre-emit checklist. |
| **autoresearch** | [autoresearch/](autoresearch/) | **Repurposed for aesthetic design only.** Karpathy's autonomous-experiment loop pattern: baseline → modify one variable → measure → keep/discard → log to TSV → repeat. Ignore the LLM-training code; use the *meta-pattern*. | Iterating on a design overnight. Set up an experiment branch, define a single aesthetic axis (typography rhythm, accent color, spacing density), generate variants, score them, log to `results.tsv`, keep the winners. |
| **superpowers** | [superpowers/skills/](superpowers/skills/) | 14 process skills from `obra/superpowers`: brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, verification-before-completion, systematic-debugging, using-git-worktrees, writing-skills, finishing-a-development-branch, requesting/receiving-code-review, test-driven-development, using-superpowers. | Process discipline. They tell you HOW to work — when to plan, when to dispatch parallel agents, when to verify, when to debug, when to branch — so the design pipeline doesn't drift into vibe-coding. Use them at the phase transitions. |

---

## Canonical workflow (use this order — never skip steps 0–1)

Each phase has a default superpower to invoke at the transition. Skipping the superpower = drifting back into vibe-coding.

| # | Phase | What | Superpower at the transition |
|---|---|---|---|
| 0 | **VERIFY MCP** | Confirm Refero MCP is connected (`claude mcp list`). If not, stop and reinstall. | — |
| 1 | **RESEARCH** | Refero MCP: 5+ search angles → `get_screen` on 5–10 best → Research Summary + Steal List ≥5 with EXACT details. **NON-NEGOTIABLE.** | `dispatching-parallel-agents` (run the 5 search angles in parallel) |
| 2 | **BRIEF** | refero discovery questions (what/who/goal/tone/job/objection/hook) | `brainstorming` (before any creative work — establishes intent) |
| 3 | **SYSTEM** | ui-ux-pro-max: pull palette + font pairing + landing pattern + anti-patterns for the product type | — |
| 4 | **PRINCIPLES** | power-design 21-rule checklist; treat all thresholds as non-negotiable | `writing-plans` (if the build is multi-page or multi-component) |
| 5 | **DESIGN** | 80% proven patterns + 20% soul; one bold choice that makes it screenshottable | — |
| 6 | **IMPLEMENT** | Semantic HTML, design tokens, all states (hover/focus/disabled/loading/empty/error), `prefers-reduced-motion` | `executing-plans` (work the plan) ; `subagent-driven-development` (parallel independent components) ; `using-git-worktrees` (isolation if iterating multiple variants) |
| 7 | **VALIDATE** | Side-by-side vs. top 3 Refero references; pass quality gate; squint test | `verification-before-completion` (open in browser, not just claim it works) ; `requesting-code-review` (before merge) |
| 8 | **DEBUG** *(when something breaks)* | Diagnose root cause, fix, verify | `systematic-debugging` |
| 9 | **ITERATE** *(optional)* | autoresearch loop on a single aesthetic variable until it feels distinctly *yours* | `using-git-worktrees` (one variant per worktree) |
| 10 | **FINISH** | Merge / PR / cleanup | `finishing-a-development-branch` |

**Codifying repeatable patterns:** when you find a design move that works across multiple builds (e.g. "italic-serif emphasis on a single word in a giant sans hero"), use `writing-skills` to capture it as a project-scoped skill in `superpowers/skills/` — that's how the system gets sharper over time.

---

## Anti-AI-slop rules (hard stops)

These are the tells. If any of them slip into output, the design has failed the mission.

- **No indigo/violet (#6366f1) by default.** Every LLM defaults to it because it's "safe." Pick a brand-justified color from research.
- **No purple-gradient hero slides.** Same reason.
- **No blob/wave/mesh-gradient backgrounds** as decoration without semantic reason.
- **No perfect symmetry everywhere.** Visual tension comes from intentional asymmetry.
- **No default system fonts** without an intentional pairing decision (`Inter` everywhere ≠ a font choice).
- **No generic structure trap:** Hero → Features Grid → Pricing → FAQ → CTA. Question every section: *what can be added, removed, or reordered for THIS product?*
- **No stock illustrations** that could appear on any other site.
- **No emoji as UI icons.** Use SVG (Lucide / Heroicons / Material Symbols / SF Symbols) — one library per product.
- **No ALL CAPS without letter-spacing** (0.06–0.1em required).
- **No ad-hoc spacing.** 8pt grid only: {8, 16, 24, 32, 48, 64, 96, 128}. Never 13. Never 27.
- **No multiple accent colors.** One accent per surface; multiple = none.
- **No animations >500ms** in product UI. No linear easing. Always honor `prefers-reduced-motion`.
- **No designing without trust signals.** Pick at least 2: real testimonials, logos, specific numbers, guarantees, security.
- **No skipping the Steal List.** If <5 specific tactics with exact copy/numbers/conditions, research isn't done.

---

## Quality gate (final check before shipping)

Match or exceed top 3 references in 3 of 4:

- **Polish** — alignment, consistent radii, no orphan words, icons optically centered
- **Clarity** — hierarchy obvious in <3s, primary action unmissable
- **Uniqueness** — at least one element a user would screenshot and remember
- **Usability** — works at 375px / 768px / 1024px / 1440px; full keyboard nav; AA contrast (target AAA for projector resilience)

---

## Operational notes

- **Refero MCP** is configured at `https://api.refero.design/mcp` (HTTP transport, **user scope**, header is `Authorization: Bearer ${REFERO_BEARER_TOKEN}` — the literal placeholder is stored in `~/.claude.json` and resolved at runtime from the OS env). Token rotation: edit `.env`, run `setx REFERO_BEARER_TOKEN <new>`, restart Claude Code. Available tools: `search_screens`, `search_flows`, `get_screen`, `get_flow`, `get_design_guidance`. **Hitting these tools before any design work is mandatory** — see the top of this file. If the MCP drops, do NOT silently fall back; stop and reinstall with the command in the mandatory-first-step section.
- **ui-ux-pro-max** runs offline via Python 3 — no external dependencies. Search command: `python3 ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>`.
- **power-design** brands library: 72 pre-built brand DNA files in `power-design/brands/<name>/brand-style.md`. For new brands, scrape via Firecrawl MCP using `formats: ["branding", "screenshot", "rawHtml", "links"]` and save to `brands/<slug>/`.
- **autoresearch is reframed.** The Python/PyTorch code is irrelevant here. What's useful is the *autonomous experiment org* pattern: program.md as instructions, fixed budget per experiment, single-variable changes, results.tsv as ground truth, keep/discard/crash status. Apply this to aesthetic iteration only.

---

## Decision shortcut

If a request is ambiguous between which skill to lead with:

- New screen, no references yet → **refero**
- Need a palette / font pairing / stack-specific snippet → **ui-ux-pro-max**
- Need to validate a layout against hard rules / generate a deck / extract brand DNA → **power-design**
- Need to converge on a "feel" through repeated trials → **autoresearch loop**

Default order when in doubt: refero → ui-ux-pro-max → power-design → (optional) autoresearch.

---

*Don't guess. Research with refero. Spec with ui-ux-pro-max. Validate with power-design. Iterate with autoresearch. Ship something memorable.*
