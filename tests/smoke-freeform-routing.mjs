// One-off smoke test for the freeform_editor priority routing.
// Run: node tests/smoke-freeform-routing.mjs
// Verifies that mentioning "free editor" / "main agent" overrides other
// specialists (e.g. the graph_expert keyword "graph" no longer wins).

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../api/_lib/dashboard-agents.js', import.meta.url), 'utf8');

// Extract the regex array — keeps the test independent of the module loader so
// we don't need the real Supabase/Anthropic env vars just to run a unit check.
const arrMatch = src.match(/const FREEFORM_TRIGGER_PATTERNS\s*=\s*\[([\s\S]*?)\];/);
if (!arrMatch) { console.error('FREEFORM_TRIGGER_PATTERNS not found'); process.exit(1); }

// eslint-disable-next-line no-new-func
const patterns = new Function(`return [${arrMatch[1]}]`)();

function isFreeform(prompt) {
  const lower = (prompt || '').toLowerCase();
  return patterns.some(re => re.test(lower));
}

const cases = [
  // Should route to freeform_editor (true)
  { prompt: 'use the free editor to redo the graph',                expect: true  },
  { prompt: 'free editor: rewrite the headline and chart',          expect: true  },
  { prompt: 'free form editor for this one',                        expect: true  },
  { prompt: 'freeform editor please',                               expect: true  },
  { prompt: 'main agent: do something creative',                    expect: true  },
  { prompt: 'use claude to figure this out',                        expect: true  },
  { prompt: 'use the main agent for this whole edit',               expect: true  },
  { prompt: 'usa el agente principal para esto',                    expect: true  },
  { prompt: 'agente principal: cambia los KPIs y el grafico',       expect: true  },
  { prompt: 'editor libre',                                         expect: true  },
  { prompt: 'surprise me with the layout',                          expect: true  },
  { prompt: 'whatever you want',                                    expect: true  },
  { prompt: 'free-form across the whole dashboard',                 expect: true  },

  // Should NOT trigger freeform (false) — normal specialist routing applies
  { prompt: 'rewrite the headline',                                 expect: false },
  { prompt: 'change the chart to a pie',                            expect: false },
  { prompt: 'add a histogram of inventory',                         expect: false },
  { prompt: 'regenerate the KPIs and risks',                        expect: false },
  { prompt: 'remove the activity section',                          expect: false },
  { prompt: 'redo the graph completely',                            expect: false },  // "graph" but no freeform trigger
  { prompt: 'modernize this',                                       expect: false }
];

let pass = 0, fail = 0;
for (const c of cases) {
  const got = isFreeform(c.prompt);
  const ok  = got === c.expect;
  if (ok) { pass++; }
  else    { fail++; }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${got ? 'freeform' : 'normal  '}  ${JSON.stringify(c.prompt)}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
