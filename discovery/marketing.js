// discovery/marketing.js
//
// Drives the EN/ES toggle on the marketing homepage (index.html). Uses the
// translation map in discovery/i18n-marketing.js as a text-node lookup —
// every visible English string on the page is matched against the map and
// swapped to its Spanish equivalent in place.
//
// No `data-i18n` markup required: the runtime walks every text node in the
// document body and looks the trimmed value up in the map. Trade-off vs.
// per-element markers: it's robust to HTML changes (no need to remember to
// tag new strings) but it does walk the whole DOM on every language switch.
//
// Storage: localStorage `arq_lang` — shared with the discovery, profile,
// and admin surfaces so user language preference is honored across the
// whole product.
//
// Escape hatches:
//   - Put `data-no-i18n` on any element whose descendants should be skipped
//     (used internally to skip `<script>`, `<style>`, `<noscript>`, code
//     blocks, etc.).
//   - Put `data-i18n="key"` on an element for an explicit key lookup
//     (legacy path; kept so the hero markup still works).
//   - Put `data-i18n-attr="attrName:key"` to translate an attribute
//     (placeholder, aria-label, etc.).

import { MARKETING_I18N, tm } from './i18n-marketing.js';

const STORAGE_KEY = 'arq_lang';

// Build a trimmed EN → ES lookup so HTML formatting whitespace doesn't break
// matches. Trimmed because text nodes often have surrounding indentation.
const EN_TO_ES = (() => {
  const out = Object.create(null);
  for (const [enKey, entry] of Object.entries(MARKETING_I18N)) {
    if (!entry || typeof entry !== 'object') continue;
    if (!entry.es) continue;
    const k = String(enKey).trim();
    if (!k) continue;
    out[k] = String(entry.es).trim();
  }
  return out;
})();

// Cache the original (English) text content of every text node we've touched
// so we can restore on toggle back to English without rebuilding the page.
const ORIGINAL_BY_NODE = new WeakMap();

// Skip the obvious non-content tags.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'CODE', 'PRE']);

function isTranslatableTextNode(node) {
  if (!node.nodeValue) return false;
  if (!node.nodeValue.trim()) return false;
  const p = node.parentElement;
  if (!p) return false;
  if (SKIP_TAGS.has(p.tagName)) return false;
  if (p.closest('[data-no-i18n]')) return false;
  return true;
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isTranslatableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const out = [];
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}

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

// ─── CORE: walk text nodes + translate ──────────────────────────────────────
function applyLang(lang) {
  // 1) Text-node walk over the whole page
  const nodes = collectTextNodes(document.body);
  for (const node of nodes) {
    // Cache the original English text once
    if (!ORIGINAL_BY_NODE.has(node)) {
      ORIGINAL_BY_NODE.set(node, node.nodeValue);
    }
    const original = ORIGINAL_BY_NODE.get(node);
    if (lang === 'en') {
      // Restore original
      if (node.nodeValue !== original) node.nodeValue = original;
      continue;
    }
    // Translate to ES — match trimmed English against the lookup, preserve
    // surrounding whitespace so layout doesn't break.
    const leading  = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    const trimmed  = original.trim();
    const es = EN_TO_ES[trimmed];
    if (es) {
      const next = leading + es + trailing;
      if (node.nodeValue !== next) node.nodeValue = next;
    }
  }

  // 2) Explicit data-i18n="key" markers (legacy + keyed elements like the
  //    hero, where the EN text is split across <span><em><span>).
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
}

// ─── TOGGLE UI ──────────────────────────────────────────────────────────────
function renderToggle(currentLang) {
  document.querySelectorAll('[data-arq-lang-mount]').forEach(mount => {
    mount.innerHTML = `
      <div class="arq-langtoggle" role="group" aria-label="Language">
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
  applyLang(lang);
  renderToggle(lang);
  document.dispatchEvent(new CustomEvent('arq:lang', { detail: { lang } }));
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
const initial = detectInitialLang();
setLang(initial);

// If new DOM lands later (carousel slides, modals built lazily) re-apply.
// Marketing site mostly has static SSR'd content; this is a safety net.
const reapplyOnceDom = (() => {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const lang = document.documentElement.getAttribute('data-arq-lang') || 'en';
      applyLang(lang);
    });
  };
})();
new MutationObserver(muts => {
  for (const m of muts) if (m.addedNodes && m.addedNodes.length) { reapplyOnceDom(); break; }
}).observe(document.body, { childList: true, subtree: true });
