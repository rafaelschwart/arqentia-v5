// discovery/marketing.js
//
// Drives the EN/ES toggle on the marketing homepage (index.html).
//
// Strategy: ELEMENT-LEVEL translation. We walk every element in the document
// that's a "leaf content" element (its children are only text + inline tags
// like <em>/<strong>/<b>/<a>) and look up its full textContent (normalized
// whitespace) in the translation map. If a Spanish entry exists, we replace
// the element's textContent.
//
// Why element-level instead of text-node-level: a paragraph like
// `<p>Arqentia is an <em>engineering</em> firm.</p>` has 3 text nodes
// (`Arqentia is an `, `engineering`, ` firm.`). No single text node matches
// the full sentence in the map, so a text-node walker translates none of it.
// Matching at the element level gives us full-sentence keys that survive
// any inline markup.
//
// Trade-off: when we translate, we lose the inline `<em>` / `<b>` emphasis —
// the Spanish text comes out as plain text. The English original is cached
// (innerHTML) so toggling back to EN restores the full markup.
//
// Storage: localStorage `arq_lang` (shared with the rest of the product).
//
// Escape hatches:
//   - `data-no-i18n` on any element: skip it AND its subtree.
//   - `data-i18n="key"` on an element: explicit map lookup by key (instead
//     of by textContent). Kept for cases like the hero h1 where we want a
//     keyed lookup.
//   - `data-i18n-attr="attrName:key"`: translate the named attribute.

import { MARKETING_I18N, tm } from './i18n-marketing.js';

const STORAGE_KEY = 'arq_lang';

// Normalized lookup: trim + collapse internal whitespace so HTML formatting
// (newlines / indentation between inline tags) doesn't break matches.
const NORM_EN_TO_ES = (() => {
  const out = Object.create(null);
  for (const [enKey, entry] of Object.entries(MARKETING_I18N)) {
    if (!entry || typeof entry !== 'object' || !entry.es) continue;
    const k = normalize(enKey);
    if (!k) continue;
    out[k] = String(entry.es).trim().replace(/\s+/g, ' ');
  }
  return out;
})();

function normalize(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

// Cache original innerHTML so toggling back to EN restores inline tags.
const ORIGINAL_HTML = new WeakMap();

// Tags to skip entirely (not visible content, or break translation if touched).
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE',
  'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
  'CANVAS', 'SVG', 'PATH', 'POLYLINE', 'CIRCLE', 'RECT', 'LINE', 'POLYGON', 'TEXT',
  'INPUT', 'TEXTAREA', 'SELECT',  // form values are user data
  'DIALOG'  // skip; dialogs have their own internal elements we'll catch individually
]);

// Inline tags whose content is considered part of the parent's text unit
// (matching against textContent, not separately).
const INLINE_TAGS = new Set([
  'SPAN', 'A', 'EM', 'STRONG', 'B', 'I', 'U', 'BR', 'SMALL',
  'MARK', 'SUB', 'SUP', 'WBR', 'DEL', 'INS', 'CITE', 'Q', 'DFN',
  'ABBR', 'TIME', 'BDO', 'BDI', 'RUBY', 'RT', 'RP'
]);

// Candidate parent tags — these are the elements we try to match as a whole.
// Includes block + structural + inline-block-style elements that often carry
// a translatable text unit.
const CANDIDATE_TAGS = new Set([
  'H1','H2','H3','H4','H5','H6',
  'P','LI','DT','DD','TD','TH', 'CAPTION', 'FIGCAPTION', 'BLOCKQUOTE',
  'A','BUTTON','LABEL', 'SUMMARY', 'OPTION',
  'DIV','SPAN','EM','STRONG','B','I','SMALL', 'MARK', 'TIME',
  'SECTION','ARTICLE','HEADER','FOOTER','ASIDE','NAV','MAIN'
]);

function isSkippableSubtree(el) {
  if (!el || el.nodeType !== 1) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest && el.closest('[data-no-i18n]')) return true;
  return false;
}

// True if the element's children are only text nodes + inline tags.
// (Used to decide whether we can safely match its textContent as a unit.)
function isLeafContent(el) {
  for (const child of el.children) {
    if (!INLINE_TAGS.has(child.tagName)) return false;
  }
  // Also reject if the element has zero text
  const text = el.textContent;
  if (!text || !text.trim()) return false;
  return true;
}

// ─── ATTRIBUTES we translate (aria-label, placeholder, title, alt, value) ───
const TRANSLATABLE_ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];

function applyLang(lang) {
  // 1) Element-level translation pass.
  // Walk every candidate element. If it's a leaf-content element AND its
  // textContent matches the map, swap. Skip if any ancestor is data-no-i18n.
  const all = document.body.querySelectorAll([...CANDIDATE_TAGS].join(','));
  for (const el of all) {
    if (isSkippableSubtree(el)) continue;
    if (!isLeafContent(el)) continue;

    // Cache original HTML once
    if (!ORIGINAL_HTML.has(el)) {
      ORIGINAL_HTML.set(el, el.innerHTML);
    }
    const originalHtml = ORIGINAL_HTML.get(el);

    if (lang === 'en') {
      if (el.innerHTML !== originalHtml) el.innerHTML = originalHtml;
      continue;
    }

    // For ES: derive the canonical English textContent from the cached HTML
    // (so re-applying ES after EN doesn't read mutated content).
    const tmp = document.createElement('div');
    tmp.innerHTML = originalHtml;
    const enText = normalize(tmp.textContent);
    if (!enText) continue;
    const es = NORM_EN_TO_ES[enText];
    if (es) {
      el.textContent = es;
    }
  }

  // 2) Explicit data-i18n="key" markers — still honored as an escape hatch.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key || !MARKETING_I18N[key]) return;
    el.textContent = tm(key, lang);
  });

  // 3) Attribute translation: data-i18n-attr="attrName:key"
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr') || '';
    spec.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => (s || '').trim());
      if (!attr || !key || !MARKETING_I18N[key]) return;
      el.setAttribute(attr, tm(key, lang));
    });
  });

  // 4) Auto-translate common translatable attributes when their value is a
  // key in the map. Lightweight and covers aria-labels, placeholders, etc.
  for (const attr of TRANSLATABLE_ATTRS) {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      if (isSkippableSubtree(el)) return;
      const cacheKey = `__arq_orig_${attr}`;
      const original = el[cacheKey] ?? el.getAttribute(attr);
      el[cacheKey] = original;
      if (lang === 'en') {
        if (el.getAttribute(attr) !== original) el.setAttribute(attr, original);
        return;
      }
      const norm = normalize(original);
      const es = NORM_EN_TO_ES[norm];
      if (es) el.setAttribute(attr, es);
    });
  }
}

// ─── TOGGLE UI ──────────────────────────────────────────────────────────────
function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {}
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

function persistLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('data-arq-lang', lang);
}

function renderToggle(currentLang) {
  document.querySelectorAll('[data-arq-lang-mount]').forEach(mount => {
    mount.innerHTML = `
      <div class="arq-langtoggle" role="group" aria-label="Language" data-no-i18n>
        <button type="button" data-arq-lang="en" aria-pressed="${currentLang === 'en'}" class="arq-langtoggle__btn${currentLang === 'en' ? ' is-active' : ''}">EN</button>
        <button type="button" data-arq-lang="es" aria-pressed="${currentLang === 'es'}" class="arq-langtoggle__btn${currentLang === 'es' ? ' is-active' : ''}">ES</button>
      </div>
    `;
    mount.querySelectorAll('[data-arq-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('data-arq-lang');
        if (next === 'en' || next === 'es') setLang(next);
      });
    });
  });
}

function setLang(lang) {
  persistLang(lang);
  // Render the toggle FIRST so it appears immediately even if any later step
  // throws — the user always has a way to switch back.
  renderToggle(lang);
  try {
    applyLang(lang);
  } catch (e) {
    // Don't let a translation bug kill the toggle.
    console.warn('[marketing.js] applyLang failed:', e);
  }
  document.dispatchEvent(new CustomEvent('arq:lang', { detail: { lang } }));
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
// Wrap boot in a defensive guard so even an unexpected module-load error
// surfaces in the console instead of silently leaving the page un-toggleable.
console.info('[marketing.js] loaded v5.4 (' + Object.keys(MARKETING_I18N).length + ' translations)');
try {
  const initial = detectInitialLang();
  const mountCount = document.querySelectorAll('[data-arq-lang-mount]').length;
  console.info('[marketing.js] booting lang=' + initial + ', mount points=' + mountCount);
  if (mountCount === 0) {
    console.warn('[marketing.js] no [data-arq-lang-mount] element found on this page. Toggle will not appear.');
  }
  setLang(initial);
} catch (e) {
  console.error('[marketing.js] boot failed:', e);
}

// Late-mounted DOM (carousel slides built lazily, dialogs that hydrate on
// first open) — re-apply. Debounced via rAF.
let reapplyScheduled = false;
function scheduleReapply() {
  if (reapplyScheduled) return;
  reapplyScheduled = true;
  requestAnimationFrame(() => {
    reapplyScheduled = false;
    const lang = document.documentElement.getAttribute('data-arq-lang') || 'en';
    applyLang(lang);
  });
}
new MutationObserver(muts => {
  for (const m of muts) {
    if (m.addedNodes && m.addedNodes.length) { scheduleReapply(); return; }
  }
}).observe(document.body, { childList: true, subtree: true });
