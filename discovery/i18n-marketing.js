// discovery/i18n-marketing.js
//
// Marketing site translation map. Loaded by /discovery/marketing.js which
// walks every element with a `data-i18n="key"` attribute and swaps its text
// content based on the current language (stored in localStorage as `arq_lang`,
// shared with the discovery/profile/admin surfaces via i18n.js).
//
// To translate a new string on index.html:
//   1. Add `data-i18n="some.key"` to the element wrapping the text
//   2. Add the EN + ES pair below under the appropriate section
//
// Mono `// SHOUT_CASE` labels stay English by project convention.
// Company names, capability codes (C.01..), and dollar amounts stay identical.

export const MARKETING_I18N = {
  // === NAV ===
  'nav.how':          { en: 'How it works',  es: 'Cómo funciona' },
  'nav.industries':   { en: 'Industries',    es: 'Industrias' },
  'nav.capabilities': { en: 'Capabilities',  es: 'Capacidades' },
  'nav.pricing':      { en: 'Pricing',       es: 'Precios' },
  'nav.demo':         { en: 'See a demo',    es: 'Ver demo' },
  'nav.contact':      { en: 'Get in touch',  es: 'Contáctanos' },

  // === HERO ===
  'hero.eyebrow':     { en: '// OPERATIONS · SYSTEMS · ENGINEERING',
                        es: '// OPERACIONES · SISTEMAS · INGENIERÍA' },
  'hero.heading.before': { en: 'Build systems that ', es: 'Construye sistemas que ' },
  'hero.heading.em':     { en: 'run',                  es: 'se ejecutan' },
  'hero.heading.after':  { en: ' themselves.',         es: ' solos.' },
  'hero.sub':         { en: 'We build the dashboards, workflows, and AI agents that turn your operations from manual chaos into a system you can trace, measure, and trust.',
                        es: 'Construimos los dashboards, workflows y agentes de IA que transforman tus operaciones del caos manual a un sistema que puedes rastrear, medir y en el que puedes confiar.' },
  'hero.cta.primary': { en: 'Start a discovery call →', es: 'Comenzar discovery →' },
  'hero.cta.secondary': { en: 'See a sample dashboard', es: 'Ver dashboard de muestra' },

  // === DIAGNOSIS / PROBLEM SECTION ===
  'diagnosis.eyebrow':   { en: '// DIAGNOSIS · WHY OPERATIONS BREAK',
                           es: '// DIAGNÓSTICO · POR QUÉ FALLAN LAS OPERACIONES' },
  'diagnosis.heading.before': { en: 'Your operation runs. But you ', es: 'Tu operación funciona. Pero ' },
  'diagnosis.heading.em':     { en: "can't trace",                    es: 'no puedes rastrearla' },
  'diagnosis.heading.after':  { en: ' it.',                            es: '.' },
  'diagnosis.body':   { en: 'Every team we audit has the same shape — spreadsheets, WhatsApp threads, an ERP that nobody trusts, and a folder of one-off reports. The work gets done. The visibility never does.',
                        es: 'Cada equipo que auditamos tiene la misma forma — hojas de cálculo, hilos de WhatsApp, un ERP en el que nadie confía y una carpeta de reportes ad-hoc. El trabajo se hace. La visibilidad nunca.' },

  // === CAPABILITIES ===
  'capabilities.eyebrow': { en: '// CAPABILITIES · FOUR ARTEFACTS',
                            es: '// CAPACIDADES · CUATRO ENTREGABLES' },
  'capabilities.heading.before': { en: 'One architecture. ',     es: 'Una arquitectura. ' },
  'capabilities.heading.em':     { en: 'Four interlocking',       es: 'Cuatro capacidades' },
  'capabilities.heading.after':  { en: ' capabilities.',          es: ' entrelazadas.' },
  'capabilities.sub':  { en: 'Every Arqentia engagement is composed from these four. You buy one or two; the others stay in our toolbox until your operation needs them.',
                         es: 'Cada engagement de Arqentia se compone de estas cuatro. Compras una o dos; las otras quedan en nuestra caja hasta que tu operación las necesite.' },

  'c01.title':  { en: 'Dashboards',        es: 'Dashboards' },
  'c01.sub':    { en: 'KPI + real-time visualisations',
                  es: 'KPIs + visualizaciones en tiempo real' },
  'c01.body':   { en: 'Live operational dashboards that pull from every system you actually use. First-pass yield, OEE, weekly billing, cash position — one screen, no spreadsheets.',
                  es: 'Dashboards operativos en vivo que toman datos de cada sistema que realmente usas. First-pass yield, OEE, facturación semanal, posición de caja — una pantalla, cero hojas de cálculo.' },
  'c01.cta':    { en: 'Read C.01 spec sheet →', es: 'Ver ficha técnica C.01 →' },

  'c02.title':  { en: 'Workflows',         es: 'Workflows' },
  'c02.sub':    { en: 'Multi-step automation',
                  es: 'Automatización multi-paso' },
  'c02.body':   { en: 'The "if X then Y then notify Z" plumbing. Routes between two systems that today only exist as copy-paste, a WhatsApp ping, or someone running a Friday macro.',
                  es: 'La plomería tipo "si X entonces Y entonces notificar a Z". Rutas entre dos sistemas que hoy solo existen como copy-paste, un ping de WhatsApp o alguien corriendo un macro los viernes.' },
  'c02.cta':    { en: 'Read C.02 spec sheet →', es: 'Ver ficha técnica C.02 →' },

  'c03.title':  { en: 'AI Agents',         es: 'Agentes de IA' },
  'c03.sub':    { en: 'Autonomous reconciliation + classification',
                  es: 'Reconciliación + clasificación autónoma' },
  'c03.body':   { en: 'Bots that match invoices to POs, classify expenses, flag exceptions, or write call summaries. Work that requires judgement — not just routing.',
                  es: 'Bots que cuadran facturas con OCs, clasifican gastos, marcan excepciones o redactan resúmenes de llamadas. Trabajo que requiere criterio — no solo enrutamiento.' },
  'c03.cta':    { en: 'Read C.03 spec sheet →', es: 'Ver ficha técnica C.03 →' },

  'c04.title':  { en: 'Integration',       es: 'Integración' },
  'c04.sub':    { en: 'ERP / CRM / sheets / WhatsApp',
                  es: 'ERP / CRM / hojas / WhatsApp' },
  'c04.body':   { en: 'The actual pipes between SAP, HubSpot, Google Sheets, and the WhatsApp/Telegram surfaces your team already lives in. No swivel-chair entry.',
                  es: 'Las tuberías reales entre SAP, HubSpot, Google Sheets y las superficies de WhatsApp/Telegram donde tu equipo ya vive. Cero swivel-chair entry.' },
  'c04.cta':    { en: 'Read C.04 spec sheet →', es: 'Ver ficha técnica C.04 →' },

  // === DEMO SECTION ===
  'demo.eyebrow':       { en: '// DEMO · LIVE OPERATION', es: '// DEMO · OPERACIÓN EN VIVO' },
  'demo.heading.before':{ en: 'Watch a real operation ', es: 'Mira una operación real ' },
  'demo.heading.em':    { en: 'running now.',             es: 'funcionando ahora.' },
  'demo.cta':           { en: 'Open the live demo →',     es: 'Abrir el demo en vivo →' },

  // === METHOD / PROCESS ===
  'method.eyebrow':      { en: '// METHOD · HOW WE BUILD',  es: '// MÉTODO · CÓMO CONSTRUIMOS' },
  'method.heading.before': { en: 'Five steps. ',  es: 'Cinco pasos. ' },
  'method.heading.em':     { en: 'No surprises.', es: 'Sin sorpresas.' },

  // === INDUSTRY ===
  'industry.eyebrow':  { en: '// INDUSTRIES · 8 SECTORS', es: '// INDUSTRIAS · 8 SECTORES' },
  'industry.heading.before': { en: 'Eight industries. ',   es: 'Ocho industrias. ' },
  'industry.heading.em':     { en: 'One system.',           es: 'Un sistema.' },

  // === COMMERCIAL / PRICING ===
  'commercial.eyebrow':       { en: '// COMMERCIAL · PRICING',  es: '// COMERCIAL · PRECIOS' },
  'commercial.heading.before': { en: 'Engineering-firm pricing. ', es: 'Precios de firma de ingeniería. ' },
  'commercial.heading.em':     { en: 'No retainer trap.',          es: 'Sin trampa de retainer.' },
  'commercial.tier1.name':     { en: 'Discovery',             es: 'Discovery' },
  'commercial.tier1.price':    { en: 'Free',                  es: 'Gratis' },
  'commercial.tier1.body':     { en: '30-minute diagnostic call + a one-page operational diagnosis. Yours to keep whether we work together or not.',
                                 es: 'Llamada de diagnóstico de 30 minutos + una página con el diagnóstico operativo. Tuya, trabajemos juntos o no.' },
  'commercial.tier2.name':     { en: 'Build',                 es: 'Build' },
  'commercial.tier2.price':    { en: 'From $8K',              es: 'Desde $8K' },
  'commercial.tier2.body':     { en: '11-week sprint from scoping to production. One of the four capabilities, sometimes two combined.',
                                 es: 'Sprint de 11 semanas desde el scoping hasta producción. Una de las cuatro capacidades, a veces dos combinadas.' },
  'commercial.tier3.name':     { en: 'Maintenance',           es: 'Mantenimiento' },
  'commercial.tier3.price':    { en: 'From $500/mo',          es: 'Desde $500/mes' },
  'commercial.tier3.body':     { en: 'SLA-backed monitoring, bug fixes, monthly improvements. Optional after Build — most clients add it after week 12.',
                                 es: 'Monitoreo con SLA, correcciones, mejoras mensuales. Opcional después del Build — la mayoría lo agrega después de la semana 12.' },

  // === CTA / FOOTER PROMPTS ===
  'cta.start':       { en: 'Start a discovery call', es: 'Comenzar una llamada de discovery' },
  'cta.start.sub':   { en: 'Free 30 minutes. No deck, no pitch.',
                       es: '30 minutos gratis. Sin slide deck, sin pitch.' },
  'cta.book':        { en: 'Book on Calendly →',     es: 'Agendar en Calendly →' },
  'cta.email':       { en: 'Or email hello@arqentia.com',
                       es: 'O escríbenos a hello@arqentia.com' },

  // === FOOTER ===
  'footer.tagline':  { en: 'Built between Florida & Lima.', es: 'Construido entre Florida y Lima.' },
  'footer.copy':     { en: '© 2026 Arqentia. All rights reserved.',
                       es: '© 2026 Arqentia. Todos los derechos reservados.' },
  'footer.privacy':  { en: 'Privacy',       es: 'Privacidad' },
  'footer.terms':    { en: 'Terms',         es: 'Términos' },
  'footer.contact':  { en: 'Contact',       es: 'Contacto' }
};

// Helper: get the translated text for a key. Falls back to EN, then the key itself.
export function tm(key, lang) {
  const entry = MARKETING_I18N[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}
