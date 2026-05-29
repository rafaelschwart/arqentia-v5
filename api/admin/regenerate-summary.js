// api/admin/regenerate-summary.js
// POST { prospect_id, language? }
//
// Runs the Claude profile-summary pipeline against an existing prospect's
// answers and overwrites the cached profile_summaries row. Designed to be
// triggered from the admin when the chrome language is toggled — the
// 2-sentence summary regenerates in the new language so admin reads
// everything consistently.
//
// Pairs with /api/admin/dashboard-generate which already accepts a language
// override and regenerates the personalized demo payload the same way.

import { supabase } from '../_lib/supabase.js';
import { logEvent } from '../_lib/events.js';
import { generateProfileSummary } from '../_lib/claude.js';
import { readJson, sendJson, sendError, methodNotAllowed, withEnv } from '../_lib/http.js';
import { requireAdmin } from '../_lib/admin-auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (requireAdmin(req, res)) return;

  const body = await readJson(req).catch(() => null);
  if (!body?.prospect_id) return sendError(res, 400, 'Missing prospect_id');

  const prospectId = body.prospect_id;
  const overrideLang = (body.language === 'en' || body.language === 'es') ? body.language : null;

  const [
    { data: prospect, error: pErr },
    { data: answers }
  ] = await Promise.all([
    supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle(),
    supabase.from('profile_answers').select('*').eq('prospect_id', prospectId)
  ]);
  if (pErr) return sendError(res, 500, 'Fetch failed', { detail: pErr.message });
  if (!prospect) return sendError(res, 404, 'Prospect not found');

  const lang = overrideLang || prospect.language || 'en';
  const t0 = Date.now();

  let result;
  try {
    result = await generateProfileSummary({
      language: lang,
      answers: answers || [],
      prospect_id: prospectId
    });
  } catch (e) {
    if (e.code === 'ENV_MISSING') throw e;
    console.error('[admin/regenerate-summary] Claude failed:', e?.message);
    await logEvent({ prospect_id: prospectId, type: 'summary_regen_error', payload: { error: String(e?.message || e), source: 'admin' } });
    return sendError(res, 502, 'Summary regeneration failed', { detail: e?.message });
  }

  // Update profile_summaries with the new text + meta. Stamp language on the
  // row so the admin UI can detect language drift on the next view.
  const meta = result.meta || {};
  const { error: upErr } = await supabase.from('profile_summaries').upsert({
    prospect_id:           prospectId,
    summary_text:          result.summary,
    sector_classification: meta.sector ?? null,
    suggested_capability:  meta.capability ?? null,
    est_hours_saved:       meta.est_hours_saved ?? null,
    est_payback_months:    meta.est_payback_months ?? null,
    summary_language:      lang,
    generated_at:          new Date().toISOString(),
    generated_by:          result.model
  });
  if (upErr) {
    // summary_language may not exist as a column in older Supabase schemas —
    // try again without it so the regen still lands.
    if (/summary_language/.test(upErr.message || '')) {
      const { error: upErr2 } = await supabase.from('profile_summaries').upsert({
        prospect_id:           prospectId,
        summary_text:          result.summary,
        sector_classification: meta.sector ?? null,
        suggested_capability:  meta.capability ?? null,
        est_hours_saved:       meta.est_hours_saved ?? null,
        est_payback_months:    meta.est_payback_months ?? null,
        generated_at:          new Date().toISOString(),
        generated_by:          result.model
      });
      if (upErr2) return sendError(res, 500, 'Could not persist summary', { detail: upErr2.message });
    } else {
      return sendError(res, 500, 'Could not persist summary', { detail: upErr.message });
    }
  }

  await logEvent({
    prospect_id: prospectId,
    type: 'summary_regenerated',
    payload: { language: lang, source: 'admin', wall_ms: Date.now() - t0 }
  });

  return sendJson(res, 200, {
    ok: true,
    summary: result.summary,
    meta,
    language: lang,
    wall_ms: Date.now() - t0
  });
}

export default withEnv(handler);
