import en from './en.js';
import ptPT from './pt-PT.js';

export const LOCALES = [
    { id: 'en', label: 'English' },
    { id: 'pt-PT', label: 'Português (PT)' },
];

const CATALOGS = {
    en,
    'pt-PT': ptPT,
};

const FALLBACK_LOCALE = 'en';
const STORAGE_KEY = 'aero-sim.locale';
const LOCALE_EVENT = 'i18n:locale-changed';

let currentLocale = FALLBACK_LOCALE;
let initialized = false;
const warnedKeys = new Set();
const numberFormatters = new Map();

function hasDocument() {
    return typeof document !== 'undefined';
}

function isDev() {
    return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
}

function normalizeLocale(value) {
    if (typeof value !== 'string' || value.length === 0) return null;

    const lower = value.toLowerCase();
    if (lower === 'en' || lower.startsWith('en-')) return 'en';
    if (lower === 'pt-pt' || lower.startsWith('pt')) return 'pt-PT';
    return null;
}

function readSavedLocale() {
    try {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function writeSavedLocale(locale) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, locale);
        }
    } catch {
        // Persistence is optional (private mode, restricted storage, etc.).
    }
}

function detectBrowserLocale() {
    if (typeof navigator === 'undefined') return FALLBACK_LOCALE;

    const candidates = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

    for (const candidate of candidates) {
        const normalized = normalizeLocale(candidate);
        if (normalized) return normalized;
    }

    return FALLBACK_LOCALE;
}

function interpolate(template, params = {}) {
    return template.replace(/\{(\w+)\}/g, (match, name) => {
        return params[name] === undefined ? match : String(params[name]);
    });
}

export function getLocale() {
    return currentLocale;
}

export function t(key, params = {}) {
    const catalog = CATALOGS[currentLocale] || CATALOGS[FALLBACK_LOCALE];
    let template = catalog[key];

    if (template === undefined) {
        template = CATALOGS[FALLBACK_LOCALE][key];
        if (template === undefined) {
            if (isDev() && !warnedKeys.has(key)) {
                warnedKeys.add(key);
                console.warn(`[i18n] Missing translation key: ${key}`);
            }
            return key;
        }
    }

    return interpolate(template, params || {});
}

export function formatNumber(value, digits = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);

    const cacheKey = `${currentLocale}:${digits}`;
    if (!numberFormatters.has(cacheKey)) {
        numberFormatters.set(cacheKey, new Intl.NumberFormat(currentLocale, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }));
    }

    return numberFormatters.get(cacheKey).format(numeric);
}

function applyDocumentLocale() {
    if (!hasDocument()) return;

    document.documentElement.lang = currentLocale;
    if (document.body) document.body.dataset.locale = currentLocale;
    document.title = t('app.documentTitle');
}

export function applyTranslations(root = hasDocument() ? document : null) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    root.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-title]').forEach((element) => {
        element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });
}

export function initI18n() {
    if (initialized) return currentLocale;

    const saved = normalizeLocale(readSavedLocale());
    currentLocale = saved || detectBrowserLocale();
    initialized = true;

    applyDocumentLocale();
    applyTranslations();

    return currentLocale;
}

export function setLocale(locale) {
    const normalized = normalizeLocale(locale);
    if (!normalized) return false;

    currentLocale = normalized;
    writeSavedLocale(normalized);

    applyDocumentLocale();
    applyTranslations();

    if (hasDocument()) {
        document.dispatchEvent(new CustomEvent(LOCALE_EVENT, {
            detail: { locale: normalized },
        }));
    }

    return true;
}

export function onLocaleChange(callback) {
    if (!hasDocument()) return () => {};

    const handler = (event) => callback(event.detail.locale);
    document.addEventListener(LOCALE_EVENT, handler);

    return () => document.removeEventListener(LOCALE_EVENT, handler);
}

function checkCatalogParity() {
    if (!isDev()) return;

    const enKeys = new Set(Object.keys(en));
    const ptKeys = new Set(Object.keys(ptPT));

    enKeys.forEach((key) => {
        if (!ptKeys.has(key)) console.warn(`[i18n] Missing pt-PT key: ${key}`);
    });
    ptKeys.forEach((key) => {
        if (!enKeys.has(key)) console.warn(`[i18n] Missing en key: ${key}`);
    });
}

checkCatalogParity();
