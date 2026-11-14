import { LOCALES, getLocale, onLocaleChange, setLocale } from '../i18n/index.js';

export function initLanguageSelector() {
    const select = document.getElementById('language-select');
    if (!select) return;

    select.innerHTML = '';
    LOCALES.forEach((locale) => {
        const option = document.createElement('option');
        option.value = locale.id;
        option.textContent = locale.label;
        select.appendChild(option);
    });

    select.value = getLocale();
    select.addEventListener('change', () => {
        if (!setLocale(select.value)) {
            select.value = getLocale();
        }
    });

    onLocaleChange((locale) => {
        select.value = locale;
    });
}
