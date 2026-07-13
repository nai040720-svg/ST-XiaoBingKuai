// ============================================================
// index.js — 小冰块悬浮窗 原生扩展入口
// ============================================================

import { extension_settings } from '../../../extensions.js';
import { promptManager, oai_settings } from '../../../openai.js';
import { saveSettings, eventSource, event_types } from '../../../../script.js';
import { isMobile } from '../../../RossAscends-mods.js';

import {
    isPromptEnabled as bridgeIsEnabled,
    togglePrompt as bridgeToggle,
    setPromptEnabled as bridgeSetEnabled,
    getAllPromptStates as bridgeGetAll,
    ensureOn as bridgeEnsureOn,
    ensureOff as bridgeEnsureOff,
    isKeyOn as bridgeIsKeyOn,
    toggleByKey as bridgeToggleByKey,
    findIdentifierByName as bridgeFindByName,
    onPromptStateChanged,
} from './presetBridge.js';

import initFloatingWindow from './floatingWindow.js';
import { PANEL_CONFIG } from './panelButtons.js';
import { createSettingsPanelHtml, createFloatingPanelHtml, createFloatingPanelStyle } from './settingsPanel.js';

const MODULE_NAME = '小冰块悬浮窗';
const ID = 'th-orb-v6-custom';
const LOG_PREFIX = '[小冰块悬浮窗]';

const defaultSettings = { enabled: true };

function getSettings() {
    if (!extension_settings[MODULE_NAME]) extension_settings[MODULE_NAME] = {};
    Object.assign(extension_settings[MODULE_NAME], defaultSettings);
    return extension_settings[MODULE_NAME];
}

function createBridgeInterface() {
    return {
        preset: {
            isEnabled: bridgeIsEnabled, toggle: bridgeToggle, setEnabled: bridgeSetEnabled,
            ensureOn: bridgeEnsureOn, ensureOff: bridgeEnsureOff, isKeyOn: bridgeIsKeyOn,
            toggleByKey: bridgeToggleByKey, findByName: bridgeFindByName, getAllStates: bridgeGetAll,
        },
        st: { promptManager, oai_settings, saveSettings, eventSource, event_types, isMobile },
        onStateChanged: onPromptStateChanged,
        document, window,
    };
}

// ── 悬浮窗加载/卸载 ─────────────────────────────────────────
let fwCleanup = null;
let loaded = false;

function loadFloatingWindow() {
    if (loaded) return;
    loaded = true;
    try {
        fwCleanup = initFloatingWindow(createBridgeInterface()) || null;
        console.log(LOG_PREFIX, '悬浮窗已加载');
    } catch (err) {
        console.error(LOG_PREFIX, '加载悬浮窗失败:', err);
        loaded = false;
    }
}

function unloadFloatingWindow() {
    if (typeof fwCleanup === 'function') { try { fwCleanup(); } catch (_) {} }
    fwCleanup = null;
    document.getElementById(ID)?.remove();
    document.getElementById(ID + '-style')?.remove();
    loaded = false;
}

// ── 选择面板 ────────────────────────────────────────────────
let panelInjected = false;

function injectPanel() {
    if (panelInjected) return;
    panelInjected = true;

    // 注入样式
    const styleEl = document.createElement('div');
    styleEl.innerHTML = createFloatingPanelStyle();
    document.head.appendChild(styleEl.querySelector('style'));

    // 注入面板DOM
    const panelWrap = document.createElement('div');
    panelWrap.innerHTML = createFloatingPanelHtml();
    document.body.appendChild(panelWrap.querySelector('#xiaobingkuai_floating_panel'));

    // 渲染按钮
    renderAllTabs();

    // 绑定标签切换
    document.querySelectorAll('.xbk-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.xbk-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const cat = tab.getAttribute('data-cat');
            document.querySelectorAll('.xbk-cat-list').forEach(list => {
                list.style.display = list.getAttribute('data-cat') === cat ? '' : 'none';
            });
        });
    });

    // 绑定关闭
    const panel = document.getElementById('xiaobingkuai_floating_panel');
    panel.querySelector('.xbk-panel-close').addEventListener('click', closePanel);
    panel.querySelector('.xbk-panel-backdrop').addEventListener('click', closePanel);
}

function openPanel() {
    injectPanel();
    refreshAllButtonStates();
    document.getElementById('xiaobingkuai_floating_panel').style.display = '';
}

function closePanel() {
    const p = document.getElementById('xiaobingkuai_floating_panel');
    if (p) p.style.display = 'none';
}

// ── 渲染标签页按钮 ──────────────────────────────────────────
function renderAllTabs() {
    for (let i = 0; i <= 2; i++) {
        const container = document.querySelector(`.xbk-cat-list[data-cat="${i}"]`);
        if (!container) continue;
        const config = PANEL_CONFIG['cat' + i];
        if (!config) continue;

        container.innerHTML = config.groups.map(group => renderGroup(group)).join('');
    }

    // 绑定按钮点击
    document.querySelectorAll('.xbk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const kw = btn.getAttribute('data-kw');
            if (id) {
                bridgeToggle(id);
            } else if (kw) {
                bridgeToggleByKey(kw);
            }
            // 刷新状态
            setTimeout(refreshAllButtonStates, 60);
        });
    });
}

function renderGroup(group) {
    let html = `<details class="xbk-group"${group.open ? ' open' : ''}>`;
    html += `<summary class="xbk-group-summary">${group.title}</summary>`;
    html += `<div class="xbk-group-content">`;

    // 顶层按钮
    if (group.buttons && group.buttons.length > 0) {
        html += `<div class="xbk-grid">`;
        group.buttons.forEach(btn => {
            html += renderButton(btn);
        });
        html += `</div>`;
    }

    // 嵌套分组
    if (group.nested && group.nested.length > 0) {
        group.nested.forEach(sub => {
            html += `<details class="xbk-nested">`;
            html += `<summary>${sub.title}</summary>`;
            html += `<div class="xbk-group-content"><div class="xbk-grid">`;
            sub.buttons.forEach(btn => { html += renderButton(btn); });
            html += `</div></div></details>`;
        });
    }

    html += `</div></details>`;
    return html;
}

function renderButton(btn) {
    const wideClass = btn.wide ? ' wide' : '';
    return `<div class="xbk-btn${wideClass}" data-kw="${btn.kw}" data-id="${btn.id}">`
         + `<span class="xbk-btn-text">${btn.text}</span>`
         + `<span class="xbk-btn-led"></span></div>`;
}

// ── 刷新所有按钮状态 ────────────────────────────────────────
function refreshAllButtonStates() {
    document.querySelectorAll('.xbk-btn').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const kw = btn.getAttribute('data-kw');
        let isOn = false;
        if (id) isOn = bridgeIsKeyOn(id);
        else if (kw) isOn = bridgeIsKeyOn(kw);
        btn.classList.toggle('on', isOn);
    });
}

// ── 扩展设置面板 ────────────────────────────────────────────
function settingsHtml() {
    return createSettingsPanelHtml();
}

// ── jQuery 初始化 ───────────────────────────────────────────
jQuery(() => {
    $('#extensions_settings').append(settingsHtml());

    const settings = getSettings();

    // 设置开关初始状态
    $('#xiaobingkuai_enable').prop('checked', settings.enabled);

    // 绑定启用开关
    $('#extensions_settings').on('click', '#xiaobingkuai_enable', function () {
        settings.enabled = !!$(this).prop('checked');
        saveSettings();
        if (settings.enabled) loadFloatingWindow();
        else unloadFloatingWindow();
    });

    // 绑定"打开选择面板"按钮
    $('#extensions_settings').on('click', '#xiaobingkuai_open_panel', function () {
        openPanel();
    });

    // 默认加载悬浮窗
    if (settings.enabled) {
        const tryLoad = () => {
            if (typeof promptManager !== 'undefined' && promptManager) loadFloatingWindow();
            else setTimeout(tryLoad, 1000);
        };
        setTimeout(tryLoad, 1500);
    }

    // 监听预设状态变化，刷新面板按钮
    onPromptStateChanged(() => {
        if (document.getElementById('xiaobingkuai_floating_panel')?.style.display !== 'none') {
            refreshAllButtonStates();
        }
    });
});
