// ============================================================
// index.js - native extension entry
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
import { createSettingsPanelHtml } from './settingsPanel.js';

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
        st: { promptManager, oai_settings, saveSettings, eventSource, event_types, isMobile },
        onStateChanged: onPromptStateChanged,
        document,
        window,
    };
}

let fwCleanup = null;
let loaded = false;

function loadFloatingWindow() {
    if (loaded) return;
    loaded = true;

    try {
        fwCleanup = initFloatingWindow(createBridgeInterface()) || null;
        console.log(LOG_PREFIX, 'floating window loaded');
    } catch (err) {
        console.error(LOG_PREFIX, 'failed to load floating window', err);
        loaded = false;
    }
}

function unloadFloatingWindow() {
    if (typeof fwCleanup === 'function') {
        try {
            fwCleanup();
        } catch (_) {}
    }

    fwCleanup = null;
    document.getElementById(ID)?.remove();
    document.getElementById(ID + '-style')?.remove();
    loaded = false;
}

function settingsHtml() {
    return createSettingsPanelHtml();
}

jQuery(() => {
    $('#extensions_settings').append(settingsHtml());

    const settings = getSettings();

    $('#xiaobingkuai_enable').prop('checked', settings.enabled);

    $('#extensions_settings').on('click', '#xiaobingkuai_enable', function () {
        settings.enabled = !!$(this).prop('checked');
        saveSettings();

        if (settings.enabled) loadFloatingWindow();
        else unloadFloatingWindow();
    });

    if (settings.enabled) {
        const tryLoad = () => {
            if (typeof promptManager !== 'undefined' && promptManager) loadFloatingWindow();
            else setTimeout(tryLoad, 1000);
        };

        setTimeout(tryLoad, 1500);
    }
});
