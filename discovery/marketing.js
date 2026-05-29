// discovery/marketing.js
//
// Drives the EN/ES toggle on the marketing homepage (index.html). Shares the
// localStorage key `arq_lang` with the discovery/profile/admin surfaces so the
// user's language preference is honored across the whole product.
//
// On load:
//   1. Read the preferred language (localStorage > navigator > 'en')
//   2. Apply translations to every element with `data-i18n="key"` or
//      `data-i18n-attr="attrName:key"` (the latter targets attributes like
//      placeholder, aria-label, alt)
//   3. Render the EN/ES toggle into [data-arq-lang-mount] (a placeholder
//      element on the page) and bind clicks
//
// Adding a new translatable string:
//   1. Mark up the element with `data-i18n="some.key"`
//   2. Add the key + EN/ES strings to discovery/i18n-marketing.js

import { MARKETING_I18N, tm } from './i18n-marketing.js';

const STORAGE_KEY = 'arq_lang';

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {}
  // Browser hints — be permissive
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

function setLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('data-arq-lang', lang);
  applyTranslations(lang);
  renderToggle(lang);
  // Re-dispatch in case other modules want to react.
  document.dispatchEvent(new CustomEvent('arq:lang', { detail: { lang } }));
}

function applyTranslations(lang) {
  // Element text content: data-i18n="key"
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    if (!MARKETING_I18N[key]) return;
    el.textContent = tm(key, lang);
  });
  // Attribute translation: data-i18n-attr="attrName:key" (can be comma-separated)
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr') || '';
    spec.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => (s || '').trim());
      if (!attr || !key || !MARKETING_I18N[key]) return;
      el.setAttribute(attr, tm(key, lang));
    });
  });
}

function renderToggle(currentLang) {
  document.querySelectorAll('[data-arq-lang-mount]').forEach(mount => {
    mount.innerHTML = `
      <div class="arq-langtoggle" role="group" aria-label="Language">
        <button type="button" data-arq-lang="en" aria-pressed="${currentLang === 'en'}" class="arq-langtoggle__btn${currentLang === 'en' ? ' is-active' : ''}">EN</button>
        <span aria-hidden="true" class="arq-langtoggle__sep">/</span>
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

// ─── BOOT ────────────────────────────────────────────────────────────────────
const initial = detectInitialLang();
setLang(initial);
