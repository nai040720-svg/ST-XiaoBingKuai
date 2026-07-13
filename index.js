// ============================================================
// ST-XiaoBingKuai floating preset panel
// ============================================================

import {
    getAllPromptStates,
    onPromptStateChanged,
    togglePrompt,
} from './presetBridge.js';
import { promptManager } from '../../../openai.js';

const ROOT_ID = 'xbk-floating-panel';
const STYLE_ID = 'xbk-floating-panel-style';
const STORAGE = {
    open: 'xbkFloatingPanel.open',
    position: 'xbkFloatingPanel.position',
    collapsedGroups: 'xbkFloatingPanel.collapsedGroups',
};

const CLASS = {
    open: 'xbk-open',
    dragging: 'xbk-dragging',
};

let root;
let searchInput;
let listNode;
let statsNode;
let emptyNode;
let activeFilter = 'all';
let promptStateMap = new Map();
let collapsedGroups = loadJson(STORAGE.collapsedGroups, {});
let suppressNextClick = false;

function boot() {
    if (document.getElementById(ROOT_ID)) return;
    injectStyle();
    createPanel();
    bindPromptUpdates();
    refreshPanel();
}

function createPanel() {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
        <div class="xbk-overlay" data-action="close"></div>
        <section class="xbk-shell" aria-label="小冰块预设悬浮窗">
            <button class="xbk-fab" type="button" data-action="toggle" title="小冰块预设面板">
                <span class="xbk-fab-icon">❄</span>
            </button>
            <div class="xbk-card" role="dialog" aria-modal="false" aria-label="小冰块预设面板">
                <header class="xbk-header">
                    <button class="xbk-drag-handle" type="button" title="拖动面板">⋮⋮</button>
                    <div class="xbk-title-block">
                        <div class="xbk-title">小冰块</div>
                        <div class="xbk-subtitle">Preset Switchboard</div>
                    </div>
                    <button class="xbk-icon-btn" type="button" data-action="refresh" title="刷新状态">↻</button>
                    <button class="xbk-icon-btn" type="button" data-action="close" title="收起">×</button>
                </header>
                <div class="xbk-toolbar">
                    <label class="xbk-search-wrap">
                        <span>⌕</span>
                        <input class="xbk-search" type="search" placeholder="搜索条目 / 分组" autocomplete="off" />
                    </label>
                    <div class="xbk-filters" aria-label="筛选">
                        <button class="xbk-filter is-active" type="button" data-filter="all">全部</button>
                        <button class="xbk-filter" type="button" data-filter="on">已开</button>
                        <button class="xbk-filter" type="button" data-filter="off">已关</button>
                    </div>
                </div>
                <div class="xbk-stats"></div>
                <div class="xbk-list" role="list"></div>
                <div class="xbk-empty" hidden>没有匹配的预设条目</div>
            </div>
        </section>
    `;

    document.body.appendChild(root);
    searchInput = root.querySelector('.xbk-search');
    listNode = root.querySelector('.xbk-list');
    statsNode = root.querySelector('.xbk-stats');
    emptyNode = root.querySelector('.xbk-empty');

    if (localStorage.getItem(STORAGE.open) === 'true') {
        root.classList.add(CLASS.open);
    }

    applySavedPosition();
    bindPanelEvents();
    enableDragging();
}

function bindPanelEvents() {
    root.addEventListener('click', (event) => {
        if (suppressNextClick) {
            suppressNextClick = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;
        const action = actionButton.dataset.action;
        if (action === 'toggle') toggleOpen();
        if (action === 'close') setOpen(false);
        if (action === 'refresh') refreshPanel();
    });

    root.addEventListener('click', (event) => {
        const filter = event.target.closest('[data-filter]');
        if (!filter) return;
        activeFilter = filter.dataset.filter || 'all';
        root.querySelectorAll('.xbk-filter').forEach(button => {
            button.classList.toggle('is-active', button === filter);
        });
        render();
    });

    root.addEventListener('click', (event) => {
        const toggle = event.target.closest('.xbk-toggle');
        if (!toggle) return;
        const id = toggle.dataset.identifier;
        if (!id || toggle.dataset.pending === 'true') return;
        toggle.dataset.pending = 'true';
        const ok = togglePrompt(id);
        if (!ok) showToast('没有找到这个预设条目');
        setTimeout(refreshPanel, ok ? 80 : 0);
    });

    root.addEventListener('toggle', (event) => {
        const details = event.target.closest('.xbk-group');
        if (!details) return;
        collapsedGroups[details.dataset.groupKey] = !details.open;
        localStorage.setItem(STORAGE.collapsedGroups, JSON.stringify(collapsedGroups));
    }, true);

    searchInput.addEventListener('input', render);
}

function bindPromptUpdates() {
    onPromptStateChanged((states) => {
        promptStateMap = new Map(states.map(item => [item.identifier, item.enabled]));
        render();
    });
}

function refreshPanel() {
    promptStateMap = new Map(getAllPromptStates().map(item => [item.identifier, item.enabled]));
    render();
}

function render() {
    if (!listNode) return;

    const query = normalize(searchInput.value);
    const groups = buildGroups().map(group => ({
        ...group,
        items: group.items.filter(item => itemMatches(item, group.title, query, activeFilter)),
    })).filter(group => group.items.length > 0);

    const allItems = groups.flatMap(group => group.items);
    const enabledCount = allItems.filter(item => item.enabled).length;
    statsNode.textContent = `${enabledCount}/${allItems.length} 已开启`;
    listNode.innerHTML = groups.map(renderGroup).join('');
    emptyNode.hidden = groups.length > 0;
}

function renderGroup(group) {
    const enabledCount = group.items.filter(item => item.enabled).length;
    const groupKey = escapeHtml(group.key);
    const title = escapeHtml(cleanTitle(group.title));
    const open = collapsedGroups[group.key] ? '' : ' open';
    const buttons = group.items.map(renderToggle).join('');

    return `
        <details class="xbk-group" data-group-key="${groupKey}"${open}>
            <summary>
                <span class="xbk-group-title">${title}</span>
                <span class="xbk-group-count">${enabledCount}/${group.items.length}</span>
            </summary>
            <div class="xbk-grid" role="list">
                ${buttons}
            </div>
        </details>
    `;
}

function renderToggle(item) {
    const enabledClass = item.enabled ? ' is-on' : '';
    const name = escapeHtml(cleanName(item.name));
    const id = escapeHtml(item.identifier);
    const title = escapeHtml(item.name);

    return `
        <button class="xbk-toggle${enabledClass}" type="button" data-identifier="${id}" title="${title}" role="listitem">
            <span class="xbk-led"></span>
            <span class="xbk-toggle-text">${name}</span>
        </button>
    `;
}

function buildGroups() {
    const promptsById = getPromptMap();
    const order = getPromptOrder();
    const source = order.length ? order : Object.keys(promptsById).map(identifier => ({ identifier }));
    const groups = [];
    let current = makeGroup('常用开关', 0);

    for (const entry of source) {
        const prompt = promptsById[entry.identifier];
        if (!prompt && !isBuiltinPrompt(entry.identifier)) continue;

        const name = prompt?.name || getBuiltinPromptName(entry.identifier);
        if (isHardDivider(name)) {
            if (current.items.length) groups.push(current);
            current = makeGroup(name, groups.length);
            continue;
        }

        if (startsNewSection(name) && current.items.length) {
            groups.push(current);
            current = makeGroup(name, groups.length);
        }

        const enabled = promptStateMap.has(entry.identifier)
            ? promptStateMap.get(entry.identifier)
            : entry.enabled !== false;

        current.items.push({
            identifier: entry.identifier,
            name,
            enabled,
        });

        if (endsSection(name) && current.items.length) {
            groups.push(current);
            current = makeGroup('更多条目', groups.length);
        }
    }

    if (current.items.length) groups.push(current);
    return groups;
}

function getPromptMap() {
    const prompts = promptManager?.serviceSettings?.prompts;
    if (!Array.isArray(prompts)) return {};
    return Object.fromEntries(prompts.filter(Boolean).map(prompt => [prompt.identifier, prompt]));
}

function getPromptOrder() {
    if (typeof promptManager?.getPromptOrderForCharacter === 'function') {
        const activeCharacter = promptManager.activeCharacter ?? 100001;
        const order = promptManager.getPromptOrderForCharacter(activeCharacter);
        if (Array.isArray(order)) return order;
    }
    return [];
}

function itemMatches(item, groupTitle, query, filter) {
    if (filter === 'on' && !item.enabled) return false;
    if (filter === 'off' && item.enabled) return false;
    if (!query) return true;
    return normalize(item.name).includes(query)
        || normalize(groupTitle).includes(query)
        || normalize(item.identifier).includes(query);
}

function makeGroup(title, index) {
    return {
        key: `${index}-${normalize(title).slice(0, 36) || 'group'}`,
        title,
        items: [],
    };
}

function startsNewSection(name) {
    return /[↓▼]|\bstart\b/i.test(name)
        || /^#\s*/.test(name)
        || /^[-=—]{2,}/.test(name)
        || /[📌🧊🔧✏️]/u.test(name);
}

function endsSection(name) {
    return /[↑▲]|\bend\b/i.test(name);
}

function isHardDivider(name) {
    return /^[-=—]{2,}.+[-=—]{2,}$/.test(name)
        || /^=+.+上不要动.+=$/.test(name);
}

function cleanTitle(value) {
    return cleanName(value)
        .replace(/[↓↑▼▲]/g, '')
        .replace(/^[-=—]+|[-=—]+$/g, '')
        .trim() || '未命名分组';
}

function cleanName(value) {
    return String(value || '')
        .replace(/^\s*[└├─>]+\s*/u, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function isBuiltinPrompt(identifier) {
    return Boolean(getBuiltinPromptName(identifier));
}

function getBuiltinPromptName(identifier) {
    const names = {
        main: '身份',
        personaDescription: 'User 信息',
        charDescription: '角色描述',
        charPersonality: '角色性格',
        dialogueExamples: 'Chat Examples',
        nsfw: '世界书读取',
        scenario: '场景定义',
        worldInfoBefore: '世界书之前',
        worldInfoAfter: '世界书之后',
        jailbreak: '世界书结束',
        chatHistory: 'Chat History',
    };
    return names[identifier] || '';
}

function toggleOpen() {
    setOpen(!root.classList.contains(CLASS.open));
}

function setOpen(open) {
    root.classList.toggle(CLASS.open, open);
    localStorage.setItem(STORAGE.open, String(open));
    if (open) refreshPanel();
}

function applySavedPosition() {
    const position = loadJson(STORAGE.position, null);
    if (!position || typeof position.left !== 'number' || typeof position.top !== 'number') return;
    root.style.left = `${position.left}px`;
    root.style.top = `${position.top}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
}

function enableDragging() {
    const shell = root.querySelector('.xbk-shell');
    const handle = root.querySelector('.xbk-drag-handle');
    let start = null;

    const begin = (event) => {
        const isFab = event.target.closest('.xbk-fab');
        const isHandle = event.target.closest('.xbk-drag-handle');
        if (!isFab && !isHandle) return;
        if (event.button !== undefined && event.button !== 0) return;

        const rect = root.getBoundingClientRect();
        start = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: rect.left,
            top: rect.top,
            moved: false,
        };
        root.classList.add(CLASS.dragging);
        shell.setPointerCapture?.(event.pointerId);
    };

    const move = (event) => {
        if (!start || event.pointerId !== start.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;

        const rect = root.getBoundingClientRect();
        const left = clamp(start.left + dx, 8, window.innerWidth - rect.width - 8);
        const top = clamp(start.top + dy, 8, window.innerHeight - rect.height - 8);
        root.style.left = `${left}px`;
        root.style.top = `${top}px`;
        root.style.right = 'auto';
        root.style.bottom = 'auto';
    };

    const end = (event) => {
        if (!start || event.pointerId !== start.pointerId) return;
        root.classList.remove(CLASS.dragging);
        const rect = root.getBoundingClientRect();
        localStorage.setItem(STORAGE.position, JSON.stringify({ left: rect.left, top: rect.top }));
        if (start.moved) {
            suppressNextClick = true;
            event.preventDefault();
            event.stopPropagation();
        }
        start = null;
    };

    shell.addEventListener('pointerdown', begin);
    shell.addEventListener('pointermove', move);
    shell.addEventListener('pointerup', end);
    shell.addEventListener('pointercancel', end);
    handle.addEventListener('click', event => event.preventDefault());
}

function showToast(message) {
    if (window.toastr?.warning) {
        window.toastr.warning(message);
        return;
    }
    console.warn(`[小冰块] ${message}`);
}

function loadJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
        return fallback;
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ROOT_ID} {
    --xbk-bg: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(18, 20, 27, 0.84)) 82%, transparent);
    --xbk-card: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(25, 27, 36, 0.88)) 88%, transparent);
    --xbk-line: var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.18));
    --xbk-text: var(--SmartThemeBodyColor, #eef1f5);
    --xbk-muted: color-mix(in srgb, var(--SmartThemeBodyColor, #eef1f5) 64%, transparent);
    --xbk-accent: var(--SmartThemeQuoteColor, #9bd8ff);
    position: fixed;
    left: 28px;
    bottom: 10dvh;
    z-index: 2147483000;
    color: var(--xbk-text);
    font-family: var(--mainFontFamily, "Inter", "Microsoft YaHei", sans-serif);
    pointer-events: none;
}
#${ROOT_ID} * {
    box-sizing: border-box;
}
#${ROOT_ID} .xbk-overlay {
    position: fixed;
    inset: 0;
    opacity: 0;
    pointer-events: none;
}
#${ROOT_ID}.xbk-open .xbk-overlay {
    pointer-events: auto;
}
#${ROOT_ID} .xbk-shell {
    width: 42px;
    height: 42px;
    pointer-events: auto;
    position: relative;
}
#${ROOT_ID}.xbk-open .xbk-shell {
    width: min(380px, calc(100dvw - 24px));
    height: min(560px, calc(100dvh - 24px));
}
#${ROOT_ID} .xbk-fab {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid var(--xbk-line);
    background: var(--xbk-bg);
    color: var(--xbk-text);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.36);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
    user-select: none;
}
#${ROOT_ID} .xbk-fab:hover {
    filter: brightness(1.12);
}
#${ROOT_ID} .xbk-fab:active {
    transform: scale(0.94);
}
#${ROOT_ID}.xbk-open .xbk-fab {
    opacity: 0;
    pointer-events: none;
}
#${ROOT_ID} .xbk-fab-icon {
    font-size: 24px;
    line-height: 1;
}
#${ROOT_ID} .xbk-card {
    position: absolute;
    inset: 0;
    width: min(380px, calc(100dvw - 24px));
    height: min(560px, calc(100dvh - 24px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--xbk-line);
    border-radius: 14px;
    background: var(--xbk-card);
    box-shadow: 0 20px 58px rgba(0, 0, 0, 0.48);
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    opacity: 0;
    transform: scale(0.92);
    transform-origin: left bottom;
    pointer-events: none;
    transition: opacity 160ms ease, transform 160ms ease;
}
#${ROOT_ID}.xbk-open .xbk-card {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
}
#${ROOT_ID}.xbk-dragging .xbk-card,
#${ROOT_ID}.xbk-dragging .xbk-fab {
    transition: none;
    cursor: grabbing;
}
#${ROOT_ID} .xbk-header {
    display: grid;
    grid-template-columns: 26px 1fr 30px 30px;
    gap: 8px;
    align-items: center;
    min-height: 58px;
    padding: 12px 14px 10px;
    border-bottom: 1px dashed var(--xbk-line);
}
#${ROOT_ID} .xbk-drag-handle,
#${ROOT_ID} .xbk-icon-btn {
    width: 30px;
    height: 30px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--xbk-muted);
    cursor: pointer;
    padding: 0;
}
#${ROOT_ID} .xbk-drag-handle {
    width: 26px;
    cursor: grab;
    letter-spacing: -3px;
}
#${ROOT_ID} .xbk-icon-btn:hover,
#${ROOT_ID} .xbk-drag-handle:hover {
    border-color: var(--xbk-line);
    color: var(--xbk-text);
    background: rgba(255, 255, 255, 0.06);
}
#${ROOT_ID} .xbk-title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.15;
}
#${ROOT_ID} .xbk-subtitle {
    margin-top: 2px;
    color: var(--xbk-muted);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
#${ROOT_ID} .xbk-toolbar {
    display: grid;
    gap: 10px;
    padding: 12px 14px 8px;
}
#${ROOT_ID} .xbk-search-wrap {
    display: grid;
    grid-template-columns: 18px 1fr;
    align-items: center;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid var(--xbk-line);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--xbk-muted);
}
#${ROOT_ID} .xbk-search {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--xbk-text);
    font: inherit;
    font-size: 13px;
}
#${ROOT_ID} .xbk-search::placeholder {
    color: var(--xbk-muted);
}
#${ROOT_ID} .xbk-filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}
#${ROOT_ID} .xbk-filter {
    min-height: 28px;
    border: 1px solid var(--xbk-line);
    border-radius: 8px;
    background: transparent;
    color: var(--xbk-muted);
    cursor: pointer;
    font-size: 12px;
}
#${ROOT_ID} .xbk-filter.is-active {
    color: #101319;
    border-color: transparent;
    background: var(--xbk-accent);
    font-weight: 700;
}
#${ROOT_ID} .xbk-stats {
    padding: 0 14px 8px;
    color: var(--xbk-muted);
    font-size: 12px;
}
#${ROOT_ID} .xbk-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 14px 14px;
    scrollbar-width: thin;
    scrollbar-color: var(--xbk-line) transparent;
}
#${ROOT_ID} .xbk-list::-webkit-scrollbar {
    width: 6px;
}
#${ROOT_ID} .xbk-list::-webkit-scrollbar-thumb {
    background: var(--xbk-line);
    border-radius: 999px;
}
#${ROOT_ID} .xbk-group {
    border: 1px solid var(--xbk-line);
    border-radius: 10px;
    margin-bottom: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.035);
}
#${ROOT_ID} .xbk-group[open] {
    background: rgba(255, 255, 255, 0.055);
}
#${ROOT_ID} .xbk-group summary {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    min-height: 36px;
    padding: 8px 10px;
    cursor: pointer;
    user-select: none;
}
#${ROOT_ID} .xbk-group summary::-webkit-details-marker {
    display: none;
}
#${ROOT_ID} .xbk-group-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
}
#${ROOT_ID} .xbk-group-count {
    color: var(--xbk-muted);
    font-size: 11px;
}
#${ROOT_ID} .xbk-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    padding: 0 10px 10px;
}
#${ROOT_ID} .xbk-toggle {
    display: grid;
    grid-template-columns: 10px 1fr;
    align-items: center;
    gap: 7px;
    min-width: 0;
    min-height: 34px;
    padding: 7px 8px;
    border: 1px solid var(--xbk-line);
    border-radius: 9px;
    background: rgba(0, 0, 0, 0.12);
    color: var(--xbk-muted);
    cursor: pointer;
    text-align: left;
}
#${ROOT_ID} .xbk-toggle:hover {
    color: var(--xbk-text);
    background: rgba(255, 255, 255, 0.07);
}
#${ROOT_ID} .xbk-toggle:active {
    transform: scale(0.98);
}
#${ROOT_ID} .xbk-toggle.is-on {
    color: var(--xbk-text);
    border-color: color-mix(in srgb, var(--xbk-accent) 55%, var(--xbk-line));
    background: color-mix(in srgb, var(--xbk-accent) 14%, transparent);
}
#${ROOT_ID} .xbk-led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--xbk-line);
}
#${ROOT_ID} .xbk-toggle.is-on .xbk-led {
    background: var(--xbk-accent);
    box-shadow: 0 0 10px var(--xbk-accent);
}
#${ROOT_ID} .xbk-toggle-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.2;
}
#${ROOT_ID} .xbk-empty {
    padding: 28px 14px;
    text-align: center;
    color: var(--xbk-muted);
    font-size: 13px;
}
@media (max-width: 520px) {
    #${ROOT_ID} {
        left: 16px;
        bottom: 72px;
    }
    #${ROOT_ID}.xbk-open {
        left: 12px !important;
        right: auto;
    }
    #${ROOT_ID} .xbk-grid {
        grid-template-columns: 1fr;
    }
}
`;
    document.head.appendChild(style);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
