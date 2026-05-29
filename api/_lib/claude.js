// api/_lib/claude.js
import Anthropic from '@anthropic-ai/sdk';
import { logClaudeUsage } from './usage.js';

const MODEL = 'claude-haiku-4-5-20251001';

let _client;
function client() {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

async function ask(systemPrompt, userPrompt, maxTokens = 600, opts = {}) {
  const t0 = Date.now();
  const r = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });
  const text = r.content.find(b => b.type === 'text')?.text ?? '';
  logClaudeUsage({
    prospect_id: opts.prospect_id || null,
    model: r.model,
    usage: r.usage,
    route: opts.route || 'claude-ask',
    elapsed_ms: Date.now() - t0
  }).catch(() => {});
  return { text, model: r.model, usage: r.usage };
}

// Conditional follow-up generator (Q3, Q6 if multiple-systems, Q7)
export async function generateFollowUp({ language, anchor_id, anchor_answer, prospect_id }) {
  const lang = language === 'es' ? 'Spanish' : 'English';
  const system = `You are helping an operations consultancy understand a prospect's bottleneck.
Generate ONE short follow-up question (max 12 words) in ${lang}.
Respond with ONLY the question text, no preamble, no quotes.`;
  const user = `Anchor: ${anchor_id}\nProspect's answer: "${anchor_answer}"\nFollow-up question:`;
  const { text } = await ask(system, user, 80, { prospect_id, route: 'discovery-followup' });
  return text.trim().replace(/^["']|["']$/g, '');
}

// Final summary + sector classification
export async function generateProfileSummary({ language, answers, prospect_id }) {
  const lang = language === 'es' ? 'Spanish' : 'English';
  const system = `You are an operations consultant summarizing a discovery profile.
Write a 4-sentence summary in ${lang} for the consultant to read before the call.
Use ONE italic-serif emphasis word (wrap with <em>...</em>) on the prospect's key pain.

Then on a new line return JSON exactly:
{"sector":"<one of: distribucion, retail, manufactura, servicios, logistica, salud, construccion, educacion>","est_hours_saved":<int>,"est_payback_months":<int>,"capability":"<C.01|C.02|C.03|C.04 or combo like 'C.01+C.04'>"}`;
  const user = `Answers:\n${JSON.stringify(answers, null, 2)}`;
  const { text, model } = await ask(system, user, 600, { prospect_id, route: 'profile-summary' });
  const jsonMatch = text.match(/\{[^{}]*"sector"[^{}]*\}\s*$/);
  let meta = { sector: null, est_hours_saved: null, est_payback_months: null, capability: null };
  let summary = text.trim();
  if (jsonMatch) {
    try { meta = JSON.parse(jsonMatch[0]); summary = text.slice(0, jsonMatch.index).trim(); } catch {}
  }
  return { summary, meta, model };
}
