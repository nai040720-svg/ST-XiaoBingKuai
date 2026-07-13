// ============================================================
// index.js — 小冰块悬浮窗 原生扩展入口
// 直接 import ST 内部模块，通过 API 操作预设，不碰二次渲染的 DOM
// ============================================================

import { extension_settings, getContext, getApiUrl } from '../../../extensions.js';
import { promptManager, oai_settings } from '../../../openai.js';
import { saveSettings, eventSource, event_types } from '../../../../script.js';
import { isMobile } from '../../../RossAscends-mods.js';

// 预设桥接层
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

// 悬浮窗 UI 模块（静态 import）
import initFloatingWindow from './floatingWindow.js';

// ── 扩展设置 ────────────────────────────────────────────────
const MODULE_NAME = '小冰块悬浮窗';
const ID = 'th-orb-v6-custom';
const LOG_PREFIX = '[小冰块悬浮窗]';

const defaultSettings = {
    enabled: true,
};

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {};
    }
    Object.assign(extension_settings[MODULE_NAME], defaultSettings);
    return extension_settings[MODULE_NAME];
}

// ── 桥接接口：悬浮窗通过这个对象与 ST 通信 ──────────────────
function createBridgeInterface() {
    return {
        preset: {
            isEnabled: bridgeIsEnabled,
            toggle: bridgeToggle,
            setEnabled: bridgeSetEnabled,
            ensureOn: bridgeEnsureOn,
            ensureOff: bridgeEnsureOff,
            isKeyOn: bridgeIsKeyOn,
            toggleByKey: bridgeToggleByKey,
            findByName: bridgeFindByName,
            getAllStates: bridgeGetAll,
        },
        st: {
            promptManager,
            oai_settings,
            saveSettings,
            eventSource,
            event_types,
            isMobile,
        },
        onStateChanged: onPromptStateChanged,
        document,
        window,
    };
}

// ── 悬浮窗加载/卸载 ─────────────────────────────────────────
let fwCleanup = null;
let loaded = false;

function loadFloatingWindow() {
    if (loaded) return;
    loaded = true;
    try {
        const bridge = createBridgeInterface();
        fwCleanup = initFloatingWindow(bridge) || null;
        console.log(LOG_PREFIX, '悬浮窗已加载');
    } catch (err) {
        console.error(LOG_PREFIX, '加载悬浮窗失败:', err);
        loaded = false;
    }
}

function unloadFloatingWindow() {
    if (typeof fwCleanup === 'function') {
        try { fwCleanup(); } catch (_) {}
    }
    fwCleanup = null;
    const el = document.getElementById(ID);
    if (el) el.remove();
    const style = document.getElementById(ID + '-style');
    if (style) style.remove();
    loaded = false;
    console.log(LOG_PREFIX, '悬浮窗已卸载');
}

// ── 扩展设置面板 HTML ───────────────────────────────────────
function settingsHtml() {
    const settings = getSettings();
    return `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>❄️ 小冰块悬浮窗</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container textAlignCenter" style="margin-bottom:10px;">
                    <small class="opacity70p">API驱动 · 兼容BaiBai预设分组 · 不依赖DOM渲染</small>
                </div>
                <label class="checkbox_label flex1" id="xiaobingkuai_enable_wrap">
                    <input type="checkbox" id="xiaobingkuai_enable" ${settings.enabled ? 'checked' : ''}>
                    <span><b>启用悬浮窗</b></span>
                </label>
                <hr>
                <div class="flex-container">
                    <div class="flex1" style="text-align:center;">
                        <small class="opacity70p">版本 1.0.3</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── jQuery 初始化 ───────────────────────────────────────────
jQuery(() => {
    // 注入设置面板
    $('#extensions_settings').append(settingsHtml());

    // 绑定开关
    $('#extensions_settings').on('click', '#xiaobingkuai_enable', function () {
        const settings = getSettings();
        settings.enabled = !!$(this).prop('checked');
        saveSettings();
        if (settings.enabled) {
            loadFloatingWindow();
        } else {
            unloadFloatingWindow();
        }
    });

    // 默认开启则加载，延迟到 ST 完全初始化后
    const settings = getSettings();
    if (settings.enabled) {
        const tryLoad = () => {
            if (typeof promptManager !== 'undefined' && promptManager) {
                loadFloatingWindow();
            } else {
                setTimeout(tryLoad, 1000);
            }
        };
        setTimeout(tryLoad, 1500);
    }
});
