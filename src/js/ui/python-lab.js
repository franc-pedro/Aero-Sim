import { showToast } from '../core/toast.js';
import { getLocale, t } from '../i18n/index.js';
import { getLevel } from '../levels/index.js';
import {
    TELLO_API_GROUPS,
    TELLO_METHODS,
    getApiDescription,
    getApiGroupLabel,
} from '../python/api-reference.js';
import { PYTHON_PRESETS } from '../python/presets.js';

const STORAGE_PREFIX = 'aero-sim.python.code.';
const SAVE_DELAY_MS = 450;

let view = null;
let mountPromise = null;
let cmModules = null;
let pendingCode = '';
let pendingDiagnostic = null;
let currentLevelId = null;
let handlers = { onRun: null, onStop: null, onReset: null };
let saveTimer = null;
let diagnosticClearTimer = null;
let suppressSave = false;
let referenceOpen = false;
let labInitialized = false;
let currentMissionView = null;
let missionHintsOpen = false;

function getCurrentLevelId() {
    const select = document.getElementById('level-select');
    return select?.value || currentLevelId || 'default';
}

function setPresetSelection(value) {
    const select = document.getElementById('python-preset-select');
    if (select && value) select.value = value;
}

function storageKey(levelId) {
    return `${STORAGE_PREFIX}${levelId}`;
}

function readSavedCode(levelId) {
    try {
        return localStorage.getItem(storageKey(levelId));
    } catch {
        return null;
    }
}

function writeSavedCode(levelId, code) {
    try {
        localStorage.setItem(storageKey(levelId), code);
    } catch {
        // Persistence is optional (private mode, restricted storage, etc.).
    }
}

export function getPythonCode() {
    return view ? view.state.doc.toString() : pendingCode;
}

export function setPythonCode(code, { save = true } = {}) {
    pendingCode = String(code ?? '');

    if (view) {
        suppressSave = true;
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: pendingCode,
            },
        });
        suppressSave = false;
        clearPythonDiagnostic();
    }

    if (save && currentLevelId) {
        writeSavedCode(currentLevelId, pendingCode);
    }
}

export function saveCurrentCode() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    if (!view) return;

    const levelId = currentLevelId || getCurrentLevelId();
    if (!levelId) return;
    writeSavedCode(levelId, view.state.doc.toString());
}

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveTimer = null;
        saveCurrentCode();
    }, SAVE_DELAY_MS);
}

export function setPythonLevel(levelId) {
    const nextLevelId = levelId || getCurrentLevelId();
    if (view && currentLevelId) {
        saveCurrentCode();
    }
    currentLevelId = nextLevelId;

    if (!view) return;

    const saved = readSavedCode(currentLevelId);
    if (saved !== null) {
        setPythonCode(saved, { save: false });
        setPresetSelection('custom');
        return;
    }

    const example = getLevel(currentLevelId)?.pythonMission?.example || 'square';
    if (example && PYTHON_PRESETS[example]) {
        setPythonCode(PYTHON_PRESETS[example], { save: false });
        setPresetSelection(example);
    }
}

export function clearPythonDiagnostic() {
    if (diagnosticClearTimer) {
        clearTimeout(diagnosticClearTimer);
        diagnosticClearTimer = null;
    }
    pendingDiagnostic = null;
    if (!view || !cmModules) return;
    view.dispatch(cmModules.setDiagnostics(view.state, []));
}

function scheduleDiagnosticClear() {
    if (diagnosticClearTimer) clearTimeout(diagnosticClearTimer);
    diagnosticClearTimer = setTimeout(() => {
        diagnosticClearTimer = null;
        clearPythonDiagnostic();
    }, 250);
}

export function setPythonDiagnostic(line, message) {
    const lineNumber = Math.max(1, Number(line) || 1);
    const text = String(message || 'Python error');

    if (diagnosticClearTimer) {
        clearTimeout(diagnosticClearTimer);
        diagnosticClearTimer = null;
    }

    if (!view || !cmModules) {
        pendingDiagnostic = { line: lineNumber, message: text };
        return;
    }

    pendingDiagnostic = null;
    const doc = view.state.doc;
    const safeLine = Math.min(doc.lines, lineNumber);
    const lineInfo = doc.line(safeLine);

    view.dispatch(cmModules.setDiagnostics(view.state, [{
        from: lineInfo.from,
        to: lineInfo.to,
        severity: 'error',
        message: text,
    }]));
    view.dispatch({
        effects: cmModules.EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
    });
}

function telloCompletionSource(context) {
    const line = context.state.doc.lineAt(context.pos);
    const beforeCursor = line.text.slice(0, context.pos - line.from);
    const match = beforeCursor.match(/(?:tello|drone)\.(\w*)$/);
    if (!match) return null;

    const from = context.pos - match[1].length;
    return {
        from,
        options: TELLO_METHODS.map((method) => ({
            label: method.name,
            type: 'method',
            detail: method.signature,
            info: getApiDescription(method, getLocale()),
            apply: method.signature.endsWith('()')
                ? `${method.name}()`
                : `${method.name}(`,
        })),
    };
}

function insertAtCursor(text) {
    if (!view) {
        setPythonCode(`${getPythonCode()}${text}`);
        return;
    }

    const { from, to } = view.state.selection.main;
    view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
    });
    view.focus();
}

function renderReference() {
    const content = document.getElementById('python-reference-content');
    if (!content) return;

    content.replaceChildren();
    const locale = getLocale();

    TELLO_API_GROUPS.forEach((group) => {
        const section = document.createElement('section');
        section.className = 'python-ref-group';

        const title = document.createElement('h4');
        title.className = 'python-ref-group-title';
        title.textContent = getApiGroupLabel(group, locale);
        section.appendChild(title);

        group.methods.forEach((method) => {
            const item = document.createElement('article');
            item.className = 'python-ref-method';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.title = t('python.insertExample');
            item.setAttribute('aria-label', `${method.signature} — ${t('python.insertExample')}`);

            const signature = document.createElement('div');
            signature.className = 'python-ref-signature';
            signature.textContent = method.signature;
            item.appendChild(signature);

            const description = document.createElement('p');
            description.className = 'python-ref-description';
            description.textContent = getApiDescription(method, locale);
            item.appendChild(description);

            const example = document.createElement('code');
            example.className = 'python-ref-example';
            example.textContent = method.example.replace(/\\n/g, '\n');
            item.appendChild(example);

            const insert = () => {
                insertAtCursor(method.example.replace(/\\n/g, '\n'));
                closeReference();
            };
            item.addEventListener('click', insert);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    insert();
                }
            });

            section.appendChild(item);
        });

        content.appendChild(section);
    });
}

function openReference() {
    const panel = document.getElementById('python-reference-panel');
    const button = document.getElementById('btn-python-reference');
    if (!panel) return;

    renderReference();
    panel.classList.remove('hidden');
    referenceOpen = true;
    button?.setAttribute('aria-expanded', 'true');
    document.getElementById('btn-close-python-reference')?.focus();
}

function closeReference() {
    const panel = document.getElementById('python-reference-panel');
    const button = document.getElementById('btn-python-reference');
    if (!panel) return;

    panel.classList.add('hidden');
    referenceOpen = false;
    button?.setAttribute('aria-expanded', 'false');
}

export function refreshPythonLab() {
    if (referenceOpen) renderReference();
}

export function setPythonMission(view) {
    const panel = document.getElementById('python-mission');
    if (!panel) return;

    currentMissionView = view || { visible: false };
    if (!view?.visible) {
        panel.classList.add('hidden');
        panel.classList.remove('python-mission-complete', 'python-mission-failed');

        ['python-mission-title', 'python-mission-focus', 'python-mission-objective',
            'python-mission-progress', 'python-mission-status'].forEach((id) => {
            const element = document.getElementById(id);
            if (element) element.textContent = '';
        });

        const focusElement = document.getElementById('python-mission-focus');
        const statusElement = document.getElementById('python-mission-status');
        const hintsElement = document.getElementById('python-mission-hints');
        focusElement?.classList.add('hidden');
        statusElement?.classList.add('hidden');
        hintsElement?.replaceChildren();
        hintsElement?.classList.add('hidden');
        return;
    }

    const titleEl = document.getElementById('python-mission-title');
    const focusEl = document.getElementById('python-mission-focus');
    const objectiveEl = document.getElementById('python-mission-objective');
    const progressEl = document.getElementById('python-mission-progress');
    const statusEl = document.getElementById('python-mission-status');
    const hintsEl = document.getElementById('python-mission-hints');
    const hintsBtn = document.getElementById('btn-python-mission-hints');

    if (titleEl && titleEl.textContent !== view.title) {
        missionHintsOpen = false;
    }

    panel.classList.remove('hidden');
    panel.classList.toggle('python-mission-complete', view.complete);
    panel.classList.toggle('python-mission-failed', view.failed);

    if (titleEl) titleEl.textContent = view.title;
    if (focusEl) {
        focusEl.textContent = view.focusLabel || '';
        focusEl.classList.toggle('hidden', !view.focusLabel);
    }
    if (objectiveEl) objectiveEl.textContent = view.objective;
    if (progressEl) {
        progressEl.textContent = t('python.missionProgress', {
            passed: view.gatesPassed,
            total: view.gatesTotal,
            landed: view.landed ? t('python.missionLanded') : t('python.missionNotLanded'),
        });
    }

    if (statusEl) {
        if (view.complete) {
            statusEl.textContent = t('python.missionCompleteDetail');
            statusEl.classList.remove('hidden');
        } else if (view.failed) {
            statusEl.textContent = t('python.missionFailed');
            statusEl.classList.remove('hidden');
        } else {
            statusEl.textContent = '';
            statusEl.classList.add('hidden');
        }
    }

    if (hintsEl) {
        hintsEl.replaceChildren();
        (view.hints || []).forEach((hint) => {
            const item = document.createElement('li');
            item.textContent = hint;
            hintsEl.appendChild(item);
        });
        hintsEl.classList.toggle('hidden', !missionHintsOpen || !view.hints?.length);
    }

    if (hintsBtn) {
        hintsBtn.classList.toggle('hidden', !view.hints?.length);
        hintsBtn.setAttribute('aria-expanded', String(missionHintsOpen));
    }
}

export function focusPythonEditor() {
    view?.focus();
}

export async function ensurePythonLab() {
    if (view) return view;
    if (mountPromise) return mountPromise;

    mountPromise = (async () => {
        const [
            codeMirror,
            stateModule,
            viewModule,
            pythonModule,
            commandsModule,
            autocompleteModule,
            lintModule,
            oneDarkModule,
        ] = await Promise.all([
            import('codemirror'),
            import('@codemirror/state'),
            import('@codemirror/view'),
            import('@codemirror/lang-python'),
            import('@codemirror/commands'),
            import('@codemirror/autocomplete'),
            import('@codemirror/lint'),
            import('@codemirror/theme-one-dark'),
        ]);

        const container = document.getElementById('python-editor');
        if (!container) throw new Error('Python editor container not found.');

        const { EditorState, Prec } = stateModule;
        const { EditorView, keymap } = viewModule;
        const { python } = pythonModule;
        const { indentWithTab } = commandsModule;
        const { autocompletion } = autocompleteModule;
        const { lintGutter, setDiagnostics } = lintModule;
        const { oneDark } = oneDarkModule;

        cmModules = { EditorView, setDiagnostics };
        const saved = currentLevelId ? readSavedCode(currentLevelId) : null;
        const missionExample = currentLevelId
            ? (getLevel(currentLevelId)?.pythonMission?.example || 'square')
            : null;
        const missionCode = missionExample ? PYTHON_PRESETS[missionExample] : null;
        const defaultCode = missionCode || pendingCode;
        const initialCode = saved !== null ? saved : defaultCode;
        pendingCode = initialCode;
        if (saved !== null) {
            setPresetSelection('custom');
        } else if (missionExample) {
            setPresetSelection(missionExample);
        }

        view = new EditorView({
            parent: container,
            state: EditorState.create({
                doc: initialCode,
                extensions: [
                    codeMirror.basicSetup,
                    python(),
                    oneDark,
                    lintGutter(),
                    autocompletion({
                        override: [telloCompletionSource],
                        activateOnTyping: true,
                    }),
                    Prec.highest(keymap.of([
                        {
                            key: 'Mod-Enter',
                            run: () => {
                                handlers.onRun?.();
                                return true;
                            },
                        },
                        {
                            key: 'Mod-s',
                            run: () => {
                                saveCurrentCode();
                                return true;
                            },
                        },
                    ])),
                    keymap.of([indentWithTab]),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && !suppressSave) {
                            setPresetSelection('custom');
                            scheduleSave();
                            scheduleDiagnosticClear();
                        }
                    }),
                    EditorView.theme({
                        '&': {
                            height: '100%',
                            backgroundColor: '#0b1220',
                        },
                        '.cm-content': {
                            padding: '8px 0',
                        },
                        '.cm-gutters': {
                            backgroundColor: '#0b1220',
                            border: 'none',
                        },
                        '.cm-activeLineGutter': {
                            backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        },
                    }),
                ],
            }),
        });

        if (pendingDiagnostic) {
            const diagnostic = pendingDiagnostic;
            pendingDiagnostic = null;
            setPythonDiagnostic(diagnostic.line, diagnostic.message);
        }

        return view;
    })().catch((error) => {
        mountPromise = null;
        throw error;
    });

    return mountPromise;
}

export function initPythonLab(nextHandlers = {}) {
    handlers = { ...handlers, ...nextHandlers };

    if (labInitialized) {
        ensurePythonLab().catch(() => {});
        return;
    }
    labInitialized = true;

    document.getElementById('btn-python-reference')?.addEventListener('click', openReference);
    document.getElementById('btn-close-python-reference')?.addEventListener('click', closeReference);

    document.getElementById('btn-python-mission-hints')?.addEventListener('click', () => {
        missionHintsOpen = !missionHintsOpen;
        if (currentMissionView) setPythonMission(currentMissionView);
    });

    document.getElementById('btn-python-download')?.addEventListener('click', () => {
        const blob = new Blob([getPythonCode()], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'aero-sim.py';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    });

    const fileInput = document.getElementById('python-file-input');
    document.getElementById('btn-python-upload')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setPythonCode(text);
            setPresetSelection('custom');
            clearPythonDiagnostic();
            focusPythonEditor();
        } catch {
            showToast('toast.pythonFileError', 'warning');
        } finally {
            fileInput.value = '';
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && referenceOpen) closeReference();
    });

    ensurePythonLab()
        .then(() => {
            // The panel may have been hidden while CodeMirror mounted.
            requestAnimationFrame(() => view?.requestMeasure());
        })
        .catch(() => {
            showToast('toast.pythonEditorError', 'warning');
        });
}
