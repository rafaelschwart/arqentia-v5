// tests/voice-e2e-smoke.mjs
// Smoke test for /api/discovery/voice/end-call against the running dev server.
// Synthesizes a realistic Spanish-language discovery transcript, posts it,
// then verifies profile_summaries + demo_payloads + notifications all landed.

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const TRANSCRIPT = [
  { role: 'agent', text: 'Hola, gracias por tomar la llamada. Antes de empezar — ¿me compartes tu nombre, el mejor email de trabajo y tu número de WhatsApp con código de país?' },
  { role: 'user',  text: 'Soy Carolina Mendoza. Mi email es carolina.mendoza+voicetest@distribuidoraandina.co y mi WhatsApp es +57 310 555 4422.' },
  { role: 'agent', text: 'Gracias, Carolina. Ahora cuéntame: ¿en qué industria opera tu empresa y cuántos empleados son?' },
  { role: 'user',  text: 'Somos una distribuidora de productos de consumo en Colombia. Tenemos 38 personas en total entre comercial, bodega y administración.' },
  { role: 'agent', text: 'Perfecto. Describime tu negocio en una frase.' },
  { role: 'user',  text: 'Distribuimos abarrotes y productos de aseo a tiendas de barrio y minimarkets en cuatro ciudades del país.' },
  { role: 'agent', text: '¿Cuál es hoy tu mayor dolor operativo?' },
  { role: 'user',  text: 'La conciliación entre los pedidos por WhatsApp, el inventario en el ERP y los pagos en el banco. Tengo dos personas dedicadas a eso y siempre hay errores.' },
  { role: 'agent', text: '¿Cuántas horas a la semana le dedican entre las dos?' },
  { role: 'user',  text: 'Fácil entre las dos suman unas 30 horas semanales solo cuadrando esos tres mundos.' },
  { role: 'agent', text: '¿Qué herramientas usan hoy?' },
  { role: 'user',  text: 'Tenemos SAP Business One para inventario y facturación, WhatsApp Business para pedidos, y Excel para los cruces. CRM no tenemos.' },
  { role: 'agent', text: '¿Dónde vive la información hoy — todo en un sistema, dispersa, papel?' },
  { role: 'user',  text: 'Sistemas desconectados. SAP por un lado, WhatsApp por otro, Excel en medio. Nada habla entre sí.' },
  { role: 'agent', text: 'Si arreglamos algo en los próximos 90 días, ¿qué sería?' },
  { role: 'user',  text: 'Quiero que la conciliación sea automática y tener un dashboard con KPIs de cartera y rotación al día, sin tener que pedírselos a nadie.' },
  { role: 'agent', text: '¿Qué métrica concreta quieres mover y de cuánto a cuánto?' },
  { role: 'user',  text: 'El cierre semanal de cartera hoy nos toma 3 días. Lo quiero en menos de 4 horas.' },
  { role: 'agent', text: '¿Cuál es tu rol y quién toma la decisión final?' },
  { role: 'user',  text: 'Soy el COO. La decisión la tomamos entre el CEO y yo, somos los dos socios.' },
  { role: 'agent', text: 'Por último, ¿me compartes un teléfono con WhatsApp para coordinar?' },
  { role: 'user',  text: 'Sí, +57 310 555 4422, WhatsApp está bien.' }
];

async function main() {
  console.log('[1/4] POST /api/discovery/start (lang=es)');
  const startRes = await fetch(`${BASE}/api/discovery/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'es', utm_source: 'voice-smoke' })
  });
  if (!startRes.ok) {
    console.error('start failed:', startRes.status, await startRes.text());
    process.exit(1);
  }
  const cookie = startRes.headers.get('set-cookie')?.split(';')[0];
  const startBody = await startRes.json();
  console.log('  → prospect_id:', startBody.prospect_id);
  console.log('  → magic_token:', startBody.magic_token);
  if (!cookie) { console.error('no cookie returned'); process.exit(1); }

  console.log(`[2/4] POST /api/discovery/voice/end-call (${TRANSCRIPT.length} turns)`);
  const t0 = Date.now();
  const endRes = await fetch(`${BASE}/api/discovery/voice/end-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ transcript: TRANSCRIPT, duration_sec: 187 })
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  const endText = await endRes.text();
  console.log(`  → ${endRes.status} in ${elapsed}s`);
  console.log(`  → body: ${endText}`);
  if (!endRes.ok) process.exit(1);
  const endBody = JSON.parse(endText);

  console.log('[3/4] Polling Supabase for landed rows');
  const pid = startBody.prospect_id;
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

  async function sb(path) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers });
    return r.json();
  }

  const [summaryRows, demoRows, notifRows, eventRows, answerRows, prospectRows] = await Promise.all([
    sb(`profile_summaries?prospect_id=eq.${pid}&select=*`),
    sb(`demo_payloads?prospect_id=eq.${pid}&select=*`),
    sb(`notifications?prospect_id=eq.${pid}&select=*`),
    sb(`events?prospect_id=eq.${pid}&select=type,created_at&order=created_at.asc`),
    sb(`profile_answers?prospect_id=eq.${pid}&select=question_id,value_text,value_json&order=question_id.asc`),
    sb(`prospects?id=eq.${pid}&select=*`)
  ]);

  console.log('  prospects.status     :', prospectRows[0]?.status);
  console.log('  prospects.sector_id  :', prospectRows[0]?.sector_id);
  console.log('  prospects.name       :', prospectRows[0]?.name);
  console.log('  prospects.email      :', prospectRows[0]?.email);
  console.log('  prospects.phone      :', prospectRows[0]?.phone);
  console.log('  profile_answers rows :', answerRows.length, '(qids:', answerRows.map(r => r.question_id).join(','), ')');
  console.log('  profile_summaries    :', summaryRows.length ? 'YES' : 'MISSING');
  if (summaryRows[0]) {
    console.log('    sector_classification:', summaryRows[0].sector_classification);
    console.log('    suggested_capability:', summaryRows[0].suggested_capability);
    console.log('    est_hours_saved     :', summaryRows[0].est_hours_saved);
    console.log('    summary_text        :', String(summaryRows[0].summary_text).slice(0, 220), '…');
  }
  console.log('  demo_payloads        :', demoRows.length ? 'YES' : 'MISSING');
  if (demoRows[0]) {
    const p = demoRows[0].payload;
    console.log('    company             :', p?.company);
    console.log('    headline            :', p?.headline);
    console.log('    capability          :', p?.capability?.code, '-', p?.capability?.label);
    console.log('    pricing             :', p?.pricing?.tier, '|', p?.pricing?.headline);
    console.log('    counts              :', `${p?.kpis?.length || 0} kpis · ${p?.chart?.data?.length || 0} chart pts · ${p?.insights?.length || 0} insights · ${p?.activity?.length || 0} activity`);
  }
  console.log('  notifications        :', notifRows.length ? `YES (status=${notifRows[0].status}, sent_at=${notifRows[0].sent_at})` : 'MISSING');
  console.log('  events trail         :', eventRows.map(e => e.type).join(' → '));

  console.log('[4/4] Verdict');
  const ok =
    summaryRows.length &&
    demoRows.length &&
    notifRows.length &&
    notifRows[0].status === 'sent' &&
    eventRows.some(e => e.type === 'rafael_notified') &&
    eventRows.some(e => e.type === 'demo_generated');
  if (ok) {
    console.log('  ✅ VOICE FLOW E2E PASS');
    console.log('  Dashboard:', `${BASE}${endBody.dashboard_url}`);
  } else {
    console.log('  ❌ VOICE FLOW E2E FAIL — see details above');
    process.exit(1);
  }
}

main().catch(e => { console.error('CRASH:', e); process.exit(1); });
