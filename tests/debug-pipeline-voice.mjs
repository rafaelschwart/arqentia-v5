// Debug: replay agent-pipeline on the just-created voice prospect
// to see what generateDemoPayload actually threw.
import { runAgentPipeline } from '../api/_lib/agent-pipeline.js';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PID = process.argv[2];
if (!PID) { console.error('usage: node debug-pipeline-voice.mjs <prospect_id>'); process.exit(1); }

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const sb = async (p) => (await fetch(`${SUPA_URL}/rest/v1/${p}`, { headers: H })).json();

const [prospect] = await sb(`prospects?id=eq.${PID}&select=*`);
const answers    = await sb(`profile_answers?prospect_id=eq.${PID}&select=*`);
const [summary]  = await sb(`profile_summaries?prospect_id=eq.${PID}&select=*`);

console.log('prospect:', { id: prospect.id, sector_id: prospect.sector_id, language: prospect.language, name: prospect.name, company: prospect.company });
console.log('answers count:', answers.length);
console.log('summary present:', !!summary);

try {
  const out = await runAgentPipeline({ prospect, answers, summary, language: prospect.language });
  console.log('PIPELINE OK in', out.wall_ms, 'ms');
  console.log('payload.company:', out.payload?.company);
  console.log('payload.headline:', out.payload?.headline);
  console.log('payload.capability:', out.payload?.capability);
  console.log('payload.kpis count:', out.payload?.kpis?.length);
  console.log('payload.insights count:', out.payload?.insights?.length);
  console.log('payload.activity count:', out.payload?.activity?.length);
} catch (e) {
  console.error('PIPELINE THREW:', e.message);
  console.error(e.stack);
}
