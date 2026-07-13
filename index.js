// ============================================================
// index.js — 小冰块悬浮窗 原生扩展入口
// 直接 import ST 内部模块，通过 API 操作预设，不碰二次渲染的 DOM
// ============================================================

import { extension_settings } from '../../../extensions.js';
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

// 悬浮窗 UI 模块（静态 import，避免动态 import() 路径问题）
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
        // 预设条目操作（纯API，不碰DOM）
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
        // ST 内部对象引用
        st: {
            promptManager,
            oai_settings,
            saveSettings,
            eventSource,
            event_types,
            isMobile,
        },
        // 事件订阅
        onStateChanged: onPromptStateChanged,
        // DOM 文档（悬浮窗UI仍需要DOM来渲染自身）
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
    loaded = false;
    console.log(LOG_PREFIX, '悬浮窗已卸载');
}

// ── 扩展设置面板 ────────────────────────────────────────────
function settingsHtml() {
    const settings = getSettings();
    return `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>小冰块悬浮窗</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label">
                    <input type="checkbox" id="xiaobingkuai_enable" ${settings.enabled ? 'checked' : ''}>
                    <span>启用悬浮窗</span>
                </label>
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
        // 等待预设管理器就绪
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
