// ============================================================
// ST-XiaoBingKuai floating preset panel
// 排版与交互参照预设内置悬浮窗（th-orb-v6-custom）
// ============================================================

import {
    getAllPromptStates,
    onPromptStateChanged,
    togglePrompt,
} from './presetBridge.js';
import { promptManager } from '../../../openai.js';

const ROOT_ID = 'xbk-floating-panel';
const STYLE_ID = 'xbk-floating-panel-style';
const SETTINGS_ID = 'xbk-extension-settings';
const STORAGE = {
    enabled: 'xbkFloatingPanel.enabled',
    position: 'xbkFloatingPanel.position',
};

const CLASS = {
    disabled: 'xbk-disabled',
    open: 'open',
    openUp: 'open-up',
};

let root;
let orb;
let menu;
let shell;
let settingsMountAttempts = 0;
let promptStateMap = new Map();
let activeCat = 0;
let dragState = null;

// ── 启动 ──────────────────────────────────────────────────────
function boot() {
    try {
        console.log('[小冰块扩展] boot() 开始执行');
        removeExistingUi();
        injectStyle();
        createPanel();
        mountSettingsPanel();
        applyFloatingEnabled(isFloatingEnabled());
        bindPromptUpdates();
        console.log('[小冰块扩展] boot() 完成，悬浮按钮已注入页面');
    } catch (err) {
        console.error('[小冰块扩展] boot() 失败:', err);
        if (window.toastr?.error) {
            window.toastr.error('小冰块扩展加载失败: ' + (err && err.message || err), '请查看控制台(F12)');
        }
    }
}

// ── 创建面板 ──────────────────────────────────────────────────
function createPanel() {
    root = document.createElement('div');
    root.id = ROOT_ID;

    const pos = loadJson(STORAGE.position, null);
    const isMobile = window.innerWidth <= 768;
    let x = isMobile ? window.innerWidth - 60 : 40;
    let y = isMobile ? window.innerHeight - 120 : 160;
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        x = clamp(pos.x, 4, Math.max(4, window.innerWidth - 52));
        y = clamp(pos.y, 4, Math.max(4, window.innerHeight - 52));
    }
    root.style.left = `${x}px`;
    root.style.top = `${y}px`;

    root.innerHTML = `
        <div class="orb" id="${ROOT_ID}-orb">
            <svg class="orb-icon" viewBox="0 0 48 48" width="28" height="28">
                <text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>
            </svg>
        </div>
        <div class="menu" id="${ROOT_ID}-menu">
            <div class="menu-shell bg-dark" id="${ROOT_ID}-shell">
                <div class="menu-head" id="${ROOT_ID}-head">
                    <svg viewBox="0 0 48 48" width="16" height="16">
                        <text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>
                    </svg>
                    <div class="menu-title-wrap">
                        <div class="menu-title">小冰块V3.32双适配版</div>
                    </div>
                    <button class="menu-close" id="${ROOT_ID}-close">✕</button>
                </div>
                <div class="category-tabs" id="${ROOT_ID}-tabs">
                    <div class="category-tab cat-0 active" data-cat="0">通用</div>
                    <div class="category-tab cat-1" data-cat="1">Claude</div>
                    <div class="category-tab cat-2" data-cat="2">Gemini</div>
                </div>
                <div class="menu-list" id="${ROOT_ID}-list"></div>
                <div class="menu-foot">
                    <span>小冰块V3.32</span>
                    <span class="fox-link">[ ɪᴄᴇ//ᴄᴜʙᴇ ]</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(root);
    console.log('[小冰块扩展] 面板已插入 DOM, root.id=' + root.id);

    orb = root.querySelector(`#${ROOT_ID}-orb`);
    menu = root.querySelector(`#${ROOT_ID}-menu`);
    shell = root.querySelector(`#${ROOT_ID}-shell`);

    bindPanelEvents();
    enableDragging();
    refreshPanel();
}

// ── 设置面板 ──────────────────────────────────────────────────
function mountSettingsPanel() {
    const host = document.querySelector('#extensions_settings')
        || document.querySelector('#extensions_settings2')
        || document.querySelector('#extensions-settings')
        || document.querySelector('.extensions_settings');

    if (!host) {
        if (settingsMountAttempts < 20) {
            settingsMountAttempts += 1;
            console.warn('[小冰块扩展] 未找到 #extensions_settings，重试 ' + settingsMountAttempts + '/20');
            setTimeout(mountSettingsPanel, 250);
        } else {
            console.error('[小冰块扩展] 20次重试后仍未找到 #extensions_settings，设置面板无法挂载');
        }
        return;
    }
    console.log('[小冰块扩展] 设置面板挂载点: ' + (host.id || host.className));

    const panel = document.createElement('div');
    panel.id = SETTINGS_ID;
    panel.className = 'xbk-settings-block';
    panel.innerHTML = `
        <div class="xbk-settings-card">
            <div class="xbk-settings-head">
                <div>
                    <div class="xbk-settings-title">❄️ 小冰块V3.32双适配版</div>
                    <div class="xbk-settings-subtitle">独立扩展插件 / Preset Switchboard</div>
                </div>
                <span class="xbk-settings-pill">独立悬浮窗</span>
            </div>
            <label class="checkbox_label xbk-settings-row" for="xbk-enable-floating">
                <input id="xbk-enable-floating" type="checkbox" />
                <span>开启悬浮窗</span>
            </label>
            <div class="xbk-settings-hint">只控制本插件自己的悬浮按钮，与酒馆助手悬浮窗无绑定。</div>
        </div>
    `;
    host.appendChild(panel);

    const checkbox = panel.querySelector('#xbk-enable-floating');
    checkbox.checked = isFloatingEnabled();
    checkbox.addEventListener('change', () => {
        setFloatingEnabled(checkbox.checked);
        console.log('[小冰块扩展] 用户切换悬浮窗: ' + (checkbox.checked ? '开启' : '关闭') + ', root存在=' + !!root);
        if (checkbox.checked && root) {
            const rect = root.getBoundingClientRect();
            console.log('[小冰块扩展] 悬浮按钮位置: left=' + Math.round(rect.left) + ' top=' + Math.round(rect.top));
            if (window.toastr?.info) {
                window.toastr.info('悬浮窗已开启，❄按钮在屏幕' + Math.round(rect.left) + ',' + Math.round(rect.top) + '处', '小冰块扩展');
            }
        }
    });
}

// ── 清理 ──────────────────────────────────────────────────────
function removeExistingUi() {
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(SETTINGS_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    root = null;
    orb = null;
    menu = null;
    shell = null;
}

// ── 事件绑定 ──────────────────────────────────────────────────
function bindPanelEvents() {
    const btnClose = root.querySelector(`#${ROOT_ID}-close`);
    btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
    });

    const tabs = root.querySelector(`#${ROOT_ID}-tabs`);
    tabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (!tab) return;
        activeCat = Number(tab.dataset.cat);
        tabs.querySelectorAll('.category-tab').forEach(t => {
            t.classList.toggle('active', t === tab);
        });
        renderList();
    });

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.menu-item-toggle');
        if (!btn) return;
        const id = btn.dataset.identifier;
        if (!id) return;
        const ok = togglePrompt(id);
        if (!ok) {
            if (window.toastr?.warning) window.toastr.warning('没有找到这个预设条目');
            return;
        }
        btn.classList.toggle('is-on');
        setTimeout(refreshPanel, 80);
    });
}

function bindPromptUpdates() {
    onPromptStateChanged((states) => {
        promptStateMap = new Map(states.map(item => [item.identifier, item.enabled]));
        syncButtonStates();
    });
}

// ── 开关控制 ──────────────────────────────────────────────────
function isFloatingEnabled() {
    return localStorage.getItem(STORAGE.enabled) !== 'false';
}

function setFloatingEnabled(enabled) {
    localStorage.setItem(STORAGE.enabled, String(enabled));
    const checkbox = document.querySelector('#xbk-enable-floating');
    if (checkbox) checkbox.checked = enabled;
    applyFloatingEnabled(enabled);
    if (enabled) openMenu();
}

function applyFloatingEnabled(enabled) {
    if (!root) return;
    root.style.display = enabled ? '' : 'none';
    if (!enabled) closeMenu();
    if (enabled) refreshPanel();
}

// ── 面板开关 ──────────────────────────────────────────────────
function toggleMenu() {
    if (root.classList.contains(CLASS.open)) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    if (!root) return;
    updateMenuDirection();
    root.classList.add(CLASS.open);
    refreshPanel();
    setTimeout(() => {
        root.querySelectorAll('.cat-list details').forEach(d => { d.open = true; });
    }, 80);
}

function closeMenu() {
    if (!root) return;
    root.classList.remove(CLASS.open);
    root.classList.remove(CLASS.openUp);
}

function updateMenuDirection() {
    const orbX = parseInt(root.style.left, 10) || 0;
    const orbY = parseInt(root.style.top, 10) || 0;
    const menuH = 480;
    if (orbX < window.innerWidth / 2) {
        menu.style.left = '0';
        menu.style.right = 'auto';
    } else {
        menu.style.left = 'auto';
        menu.style.right = '0';
    }
    const spaceBelow = window.innerHeight - orbY - 60;
    if (spaceBelow < menuH && orbY > menuH / 2) {
        menu.style.top = 'auto';
        menu.style.bottom = '52px';
        root.classList.add(CLASS.openUp);
        menu.style.transformOrigin = orbX < window.innerWidth / 2 ? 'bottom left' : 'bottom right';
    } else {
        menu.style.top = '52px';
        menu.style.bottom = 'auto';
        root.classList.remove(CLASS.openUp);
        menu.style.transformOrigin = orbX < window.innerWidth / 2 ? 'top left' : 'top right';
    }
}

// ── 拖拽 ──────────────────────────────────────────────────────
function enableDragging() {
    const head = root.querySelector(`#${ROOT_ID}-head`);
    const DRAG_THRESHOLD = 4;
    let dragMask = null;

    function createMask() {
        dragMask?.remove();
        dragMask = document.createElement('div');
        dragMask.id = `${ROOT_ID}-drag-mask`;
        dragMask.style.cssText = 'position:fixed;inset:0;z-index:2147483639;cursor:grabbing;background:transparent;';
        document.body.appendChild(dragMask);
    }
    function removeMask() {
        dragMask?.remove();
        dragMask = null;
    }

    function startDrag(cx, cy) {
        dragState = { moved: false, sx: cx, sy: cy };
        const rect = root.getBoundingClientRect();
        dragState.ox = cx - rect.left;
        dragState.oy = cy - rect.top;
        root.style.transition = 'none';
        createMask();
    }
    function moveDrag(cx, cy) {
        if (!dragState) return;
        if (!dragState.moved && Math.abs(cx - dragState.sx) < DRAG_THRESHOLD && Math.abs(cy - dragState.sy) < DRAG_THRESHOLD) return;
        dragState.moved = true;
        root.style.left = `${Math.max(4, Math.min(cx - dragState.ox, window.innerWidth - 50))}px`;
        root.style.top = `${Math.max(4, Math.min(cy - dragState.oy, window.innerHeight - 50))}px`;
    }
    function endDrag() {
        if (!dragState) return;
        root.style.transition = '';
        removeMask();
        if (dragState.moved) savePos();
        dragState = null;
    }

    function isInteractive(e) {
        return e.target.id === `${ROOT_ID}-close`
            || e.target.classList.contains('menu-item-toggle')
            || e.target.closest('.menu-item-toggle')
            || e.target.closest('.category-tab');
    }

    orb.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    head.addEventListener('mousedown', (e) => {
        if (isInteractive(e)) return;
        startDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', endDrag);

    orb.addEventListener('click', () => {
        if (dragState && dragState.moved) return;
        toggleMenu();
    });

    orb.addEventListener('touchstart', (e) => {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.stopPropagation();
    }, { passive: true });
    orb.addEventListener('touchmove', (e) => {
        if (!dragState) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    orb.addEventListener('touchend', (e) => {
        const wasMoved = dragState?.moved;
        endDrag();
        if (!wasMoved) toggleMenu();
        e.stopPropagation();
        e.preventDefault();
    }, { passive: false });

    head.addEventListener('touchstart', (e) => {
        if (isInteractive(e)) return;
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.stopPropagation();
    }, { passive: true });
    head.addEventListener('touchmove', (e) => {
        if (!dragState) return;
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    head.addEventListener('touchend', (e) => {
        endDrag();
        e.stopPropagation();
    }, { passive: false });
}

function savePos() {
    const x = parseInt(root.style.left, 10) || 0;
    const y = parseInt(root.style.top, 10) || 0;
    localStorage.setItem(STORAGE.position, JSON.stringify({ x, y }));
}

// ── 数据读取与分组 ────────────────────────────────────────────
function refreshPanel() {
    promptStateMap = new Map(getAllPromptStates().map(item => [item.identifier, item.enabled]));
    renderList();
}

function syncButtonStates() {
    root.querySelectorAll('.menu-item-toggle[data-identifier]').forEach(btn => {
        const id = btn.dataset.identifier;
        const on = promptStateMap.has(id) ? promptStateMap.get(id) : false;
        btn.classList.toggle('is-on', on);
    });
}

function renderList() {
    const listEl = root.querySelector(`#${ROOT_ID}-list`);
    if (!listEl) return;

    const groups = buildGroups();
    const cats = [[], [], []];
    for (const group of groups) {
        const cat = group.cat;
        if (cats[cat]) cats[cat].push(group);
    }

    listEl.innerHTML = cats.map((catGroups, i) => {
        const display = i === activeCat ? '' : ' style="display:none;"';
        const detailsHtml = catGroups.map(renderGroup).join('');
        return `<div class="cat-list cat-list-${i}" data-cat="${i}"${display}>${detailsHtml}</div>`;
    }).join('');
}

function renderGroup(group) {
    const buttons = group.items.map(renderToggle).join('');
    return `
        <details open>
            <summary>${escapeHtml(group.title)}</summary>
            <div class="details-content">
                <div class="grid-toggles">${buttons}</div>
            </div>
        </details>
    `;
}

function renderToggle(item) {
    const on = item.enabled ? ' is-on' : '';
    const name = escapeHtml(cleanName(item.name));
    const id = escapeHtml(item.identifier);
    return `
        <div class="menu-item-toggle${on}" data-identifier="${id}" title="${escapeHtml(item.name)}">
            <div class="menu-item-text">${name}</div>
            <div class="toggle-led"></div>
        </div>
    `;
}

function buildGroups() {
    const promptsById = getPromptMap();
    const order = getPromptOrder();
    const source = order.length ? order : Object.keys(promptsById).map(identifier => ({ identifier }));
    const groups = [];
    let current = makeGroup('常用开关', 0, 0);

    for (const entry of source) {
        const prompt = promptsById[entry.identifier];
        if (!prompt && !isBuiltinPrompt(entry.identifier)) continue;

        const name = prompt?.name || getBuiltinPromptName(entry.identifier);
        if (isHardDivider(name)) {
            if (current.items.length) groups.push(current);
            current = makeGroup(name, groups.length, classifyByName(name));
            continue;
        }

        if (startsNewSection(name) && current.items.length) {
            groups.push(current);
            current = makeGroup(name, groups.length, classifyByName(name));
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
            current = makeGroup('更多条目', groups.length, 0);
        }
    }

    if (current.items.length) groups.push(current);
    return groups;
}

function classifyByName(name) {
    const s = String(name || '');
    if (/🔵|💙/.test(s)) return 1;
    if (/🔴|❤️/.test(s)) return 2;
    return 0;
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

// ── 名称处理 ──────────────────────────────────────────────────
function makeGroup(title, index, cat) {
    return {
        title: cleanTitle(title),
        cat,
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
        .replace(/^[⚪️♦️🔵🔴💛💙💚❤️🔞✏️⭐🍊🌧️🍩]+\s*/u, '')
        .replace(/\s+/g, ' ')
        .trim();
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

// ── 工具函数 ──────────────────────────────────────────────────
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

// ── 样式表（参照预设悬浮窗 th-orb-v6-custom） ──────────────────
function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ROOT_ID} {
    position: fixed !important;
    z-index: 2147483647 !important;
    width: 48px; height: 48px;
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
    user-select: none; -webkit-user-select: none; touch-action: none;
    -webkit-transform: translateZ(0); transform: translateZ(0);
}
@keyframes xbk-orbBreathe {
    0%, 100% { text-shadow: 0 0 4px rgba(217,119,87,0.3), 0 0 8px rgba(96,185,200,0.15), 0 0 14px rgba(217,119,87,0.08); }
    50% { text-shadow: 0 0 8px rgba(217,119,87,0.45), 0 0 16px rgba(96,185,200,0.25), 0 0 24px rgba(217,119,87,0.12); }
}
#${ROOT_ID} .orb {
    position: absolute; top: 0; left: 0;
    width: 48px; height: 48px; border-radius: 8px; cursor: pointer; z-index: 2;
    background: transparent; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s ease;
}
#${ROOT_ID} .orb:hover { background: rgba(255,255,255,0.05); }
#${ROOT_ID} .orb-icon {
    transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
    display: block;
    animation: xbk-orbBreathe 2.5s ease-in-out infinite;
}
#${ROOT_ID} .orb:hover .orb-icon { transform: scale(1.15); }
#${ROOT_ID}.open .orb-icon { transform: rotate(90deg) scale(1.1); }

#${ROOT_ID} .menu {
    position: absolute; width: 340px; pointer-events: none;
    transform: scale(0.95) translateY(-4px); opacity: 0;
    transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1), opacity 0.15s ease;
}
@media (max-width: 768px) { #${ROOT_ID} .menu { width: calc(100vw - 24px); max-width: 340px; } }
#${ROOT_ID}.open .menu {
    pointer-events: all; transform: scale(1) translateY(0); opacity: 1;
}
#${ROOT_ID}.open-up .menu { transform: scale(0.95) translateY(4px); }
#${ROOT_ID}.open.open-up .menu { transform: scale(1) translateY(0); }

#${ROOT_ID} .menu-shell {
    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
    overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
    background: rgba(22,22,22,0.95); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px); position: relative;
}

#${ROOT_ID} .menu-head {
    display: flex; align-items: center; gap: 8px; padding: 12px 14px;
    background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.06);
    cursor: grab; flex-shrink: 0;
}
#${ROOT_ID} .menu-head:active { cursor: grabbing; }
#${ROOT_ID} .menu-title-wrap { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
#${ROOT_ID} .menu-title {
    font-size: 13px; font-weight: bold; color: #eeeeee;
    letter-spacing: 0.05em; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
#${ROOT_ID} .menu-close {
    width: 22px; height: 22px; border-radius: 4px; border: none;
    background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    transition: all 0.15s; padding: 0;
}
#${ROOT_ID} .menu-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

#${ROOT_ID} .category-tabs {
    display: flex; gap: 0; padding: 6px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.12); flex-shrink: 0;
}
#${ROOT_ID} .category-tab {
    flex: 1; text-align: center; padding: 5px 0; font-size: 11px; cursor: pointer;
    border-radius: 5px; transition: all 0.18s; color: rgba(255,255,255,0.4);
    font-weight: 500; margin: 0 2px; user-select: none;
}
#${ROOT_ID} .category-tab:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
#${ROOT_ID} .category-tab.cat-1:hover { background: rgba(64,140,255,0.1); color: #6db3ff; }
#${ROOT_ID} .category-tab.cat-2:hover { background: rgba(230,60,60,0.1); color: #ff7070; }
#${ROOT_ID} .category-tab.active { font-weight: 700; }
#${ROOT_ID} .category-tab.cat-0.active { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.95); }
#${ROOT_ID} .category-tab.cat-1.active { background: rgba(40,120,255,0.22); color: #4d9fff; }
#${ROOT_ID} .category-tab.cat-2.active { background: rgba(220,40,40,0.22); color: #ff6b6b; }

#${ROOT_ID} .menu-list {
    padding: 8px 8px 42px 8px; display: flex; flex-direction: column; gap: 4px;
    overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;
    max-height: 65vh;
}
@media (max-width: 768px) { #${ROOT_ID} .menu-list { max-height: 55vh; } }
#${ROOT_ID} .menu-list::-webkit-scrollbar { width: 4px; }
#${ROOT_ID} .menu-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

#${ROOT_ID} details { margin-bottom: 2px; }
#${ROOT_ID} summary {
    font-size: 11.5px; font-weight: bold; color: rgba(255,255,255,0.8);
    padding: 8px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;
    cursor: pointer; list-style: none; user-select: none;
    display: flex; justify-content: space-between; align-items: center;
    text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s;
}
#${ROOT_ID} summary:hover { background: rgba(255,255,255,0.05); }
#${ROOT_ID} summary::after { content: "▼"; font-size: 9px; opacity: 0.5; transition: transform 0.2s; }
#${ROOT_ID} details[open] > summary::after { transform: rotate(180deg); }
#${ROOT_ID} .details-content { padding: 8px 0 4px 0; display: flex; flex-direction: column; gap: 6px; }

.grid-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px; }
@media (max-width: 768px) { .grid-toggles { grid-template-columns: 1fr 1fr; } }

#${ROOT_ID} .menu-item-toggle {
    display: flex; align-items: center; justify-content: space-between;
    height: 28px; padding: 0 8px; border-radius: 6px; box-sizing: border-box;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer; transition: all 0.15s ease; margin: 0;
}
#${ROOT_ID} .menu-item-toggle:hover { background: rgba(255,255,255,0.08); }
#${ROOT_ID} .menu-item-text {
    font-size: 11px; color: rgba(255,255,255,0.7); white-space: nowrap;
    line-height: 1; margin-top: 1px; overflow: hidden; text-overflow: ellipsis;
}
#${ROOT_ID} .toggle-led {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,0.15); transition: all 0.2s ease;
    border: 1px solid rgba(0,0,0,0.5); margin-left: 4px;
}
#${ROOT_ID} .menu-item-toggle.is-on { background: rgba(96,185,200,0.15); border-color: rgba(96,185,200,0.4); }
#${ROOT_ID} .menu-item-toggle.is-on .menu-item-text { color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
#${ROOT_ID} .menu-item-toggle.is-on .toggle-led { background: #60b9c8; box-shadow: 0 0 6px #60b9c8; border-color: transparent; }

#${ROOT_ID} .menu-foot {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px 13px; font-size: 10px; color: rgba(255,255,255,0.5);
    background: rgba(0,0,0,0.88); pointer-events: none; letter-spacing: 0.04em;
}
#${ROOT_ID} .fox-link {
    cursor: pointer; color: rgba(96,185,200,0.6); font-weight: bold; letter-spacing: 0.5px;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-size: 10px;
}
#${ROOT_ID} .fox-link:hover { color: #e8b072; text-shadow: 0 0 8px rgba(232,176,114,0.8); transform: scale(1.08); }

@keyframes xbk-orb-in { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
#${ROOT_ID} { animation: xbk-orb-in 0.2s cubic-bezier(0.34,1.3,0.64,1) both; }

#xbk-extension-settings { margin: 10px 0; }
#xbk-extension-settings .xbk-settings-card {
    border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.18));
    border-radius: 8px; padding: 10px 12px;
    background: rgba(30,32,40,0.45);
}
#xbk-extension-settings .xbk-settings-head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px;
}
#xbk-extension-settings .xbk-settings-title { color: var(--SmartThemeBodyColor, inherit); font-weight: 700; line-height: 1.2; }
#xbk-extension-settings .xbk-settings-subtitle { margin-top: 2px; color: var(--SmartThemeBodyColor, inherit); opacity: 0.62; font-size: 0.82em; }
#xbk-extension-settings .xbk-settings-pill {
    flex: 0 0 auto; border: 1px solid var(--SmartThemeBorderColor, rgba(255,255,255,0.18));
    border-radius: 999px; padding: 3px 8px; color: var(--SmartThemeBodyColor, inherit); opacity: 0.72; font-size: 0.78em;
}
#xbk-extension-settings .xbk-settings-row { display: flex; align-items: center; gap: 8px; width: fit-content; margin: 6px 0; cursor: pointer; }
#xbk-extension-settings .xbk-settings-row input { margin: 0; }
#xbk-extension-settings .xbk-settings-hint { margin-top: 8px; color: var(--SmartThemeBodyColor, inherit); opacity: 0.65; font-size: 0.85em; }
`;
    document.head.appendChild(style);
}

// ── 启动入口 ──────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
