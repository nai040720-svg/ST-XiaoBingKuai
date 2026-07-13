// ============================================================
// index.js — 小冰块悬浮窗 原生扩展入口
// 直接 import ST 内部模块，通过 API 操作预设，不碰二次渲染的 DOM
// ============================================================

import { extension_settings, ModuleWorkerWrapper } from '../../../extensions.js';
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

// ── jQuery settings 绑定 ────────────────────────────────────
jQuery(() => {
    const settings = getSettings();

    $('#extensions_settings').on('click', '#xiaobingkuai_enable', function () {
        settings.enabled = !!$(this).prop('checked');
        saveSettings();
        if (settings.enabled) {
            loadFloatingWindow();
        } else {
            unloadFloatingWindow();
        }
    });

    // 如果默认开启，直接加载
    if (settings.enabled) {
        loadFloatingWindow();
    }
});

// ── 悬浮窗加载/卸载 ─────────────────────────────────────────
let fwRoot = null;
let fwCleanup = null;

function loadFloatingWindow() {
    if (fwRoot) return; // 已经加载

    // 动态加载悬浮窗代码
    import('./floatingWindow.js')
        .then(module => {
            const initFn = module.default || module.init || module;
            if (typeof initFn !== 'function') {
                console.error(LOG_PREFIX, 'floatingWindow.js 未导出初始化函数');
                return;
            }

            // 构建桥接接口，注入给悬浮窗
            const bridge = createBridgeInterface();

            // 执行悬浮窗初始化
            fwCleanup = initFn(bridge) || null;
            console.log(LOG_PREFIX, '悬浮窗已加载');
        })
        .catch(err => {
            console.error(LOG_PREFIX, '加载悬浮窗失败:', err);
        });
}

function unloadFloatingWindow() {
    if (typeof fwCleanup === 'function') {
        try { fwCleanup(); } catch (_) {}
    }
    fwCleanup = null;
    const el = document.getElementById(ID);
    if (el) el.remove();
    fwRoot = null;
    console.log(LOG_PREFIX, '悬浮窗已卸载');
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
