import { t } from '../i18n/index.js';

function extractLine(traceback) {
    if (!traceback) return null;
    const matches = [...String(traceback).matchAll(/File "<exec>", line (\d+)/g)];
    return matches.length ? Number(matches[matches.length - 1][1]) : null;
}

function lastLine(traceback) {
    if (!traceback) return '';
    const lines = String(traceback).trim().split(/\r?\n/).filter(Boolean);
    return lines[lines.length - 1] || '';
}

export function describePythonError(traceback) {
    const text = String(traceback || '');
    const line = extractLine(text);
    const summary = lastLine(text);
    let hint = t('python.error.generic');

    if (/IndentationError|TabError/.test(text)) {
        hint = t('python.error.indentation');
    } else if (/SyntaxError/.test(text)) {
        hint = t('python.error.syntax');
    } else if (/NameError/.test(text)) {
        hint = t('python.error.name');
    } else if (/ModuleNotFoundError|ImportError/.test(text)) {
        hint = t('python.error.module');
    } else if (/timed out|timeout/i.test(text)) {
        hint = t('python.error.timeout');
    } else if (/crashed/i.test(text)) {
        hint = t('python.error.crash');
    } else {
        const tello = text.match(/TelloError:\s*(.+)/);
        if (tello) {
            hint = t('python.error.tello', { message: tello[1].trim() });
        }
    }

    return { line, summary, hint };
}
