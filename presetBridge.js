// ============================================================
// presetBridge.js
// 预设条目操作桥接层 —— 直接通过 ST 内部 API 操作，不碰前端 DOM
// ============================================================

import { promptManager, oai_settings } from '../../../openai.js';
import { saveSettings, eventSource, event_types } from '../../../../script.js';

// ── 获取当前角色ID ──────────────────────────────────────────
function getActiveCharacter() {
    return promptManager?.activeCharacter ?? 100001;
}

// ── 获取条目启用状态（纯数据读取） ──────────────────────────
export function isPromptEnabled(identifier) {
    if (!promptManager || typeof promptManager.getPromptOrderEntry !== 'function') return false;
    const entry = promptManager.getPromptOrderEntry(getActiveCharacter(), identifier);
    return entry ? entry.enabled !== false : false;
}

// ── 切换条目开关（直接改数据，触发保存） ────────────────────
export function togglePrompt(identifier) {
    if (!promptManager || typeof promptManager.getPromptOrderEntry !== 'function') return false;
    const entry = promptManager.getPromptOrderEntry(getActiveCharacter(), identifier);
    if (!entry) return false;
    entry.enabled = !entry.enabled;
    persist();
    return true;
}

// ── 设置条目为指定状态 ──────────────────────────────────────
export function setPromptEnabled(identifier, enabled) {
    if (!promptManager || typeof promptManager.getPromptOrderEntry !== 'function') return false;
    const entry = promptManager.getPromptOrderEntry(getActiveCharacter(), identifier);
    if (!entry) return false;
    if (entry.enabled === enabled || (entry.enabled !== false && enabled) || (entry.enabled === false && !enabled)) {
        // 已经是目标状态，无需操作
        return true;
    }
    entry.enabled = enabled;
    persist();
    return true;
}

// ── 批量获取所有条目状态 ────────────────────────────────────
export function getAllPromptStates() {
    if (!promptManager || typeof promptManager.getPromptOrderForCharacter !== 'function') return [];
    const order = promptManager.getPromptOrderForCharacter(getActiveCharacter());
    if (!Array.isArray(order)) return [];
    return order.map(e => ({
        identifier: e.identifier,
        enabled: e.enabled !== false,
    }));
}

// ── 通过名称模糊查找条目ID ──────────────────────────────────
export function findIdentifierByName(name) {
    if (!promptManager?.serviceSettings?.prompts) return null;
    const prompts = promptManager.serviceSettings.prompts;
    const cleanName = stripPrefix(name);
    for (const p of prompts) {
        if (!p || !p.name) continue;
        if (p.name.trim() === name.trim()) return p.identifier;
        if (stripPrefix(p.name) === cleanName) return p.identifier;
        if (p.name.includes(name)) return p.identifier;
    }
    return null;
}

// ── 通过ID或名称操作开关（统一入口） ────────────────────────
export function toggleByKey(key) {
    // key 可以是 identifier 或名称
    if (isPromptEnabled(key)) {
        return setPromptEnabled(key, false);
    }
    // 尝试作为名称查找
    const id = findIdentifierByName(key);
    if (id) return togglePrompt(id);
    return false;
}

export function ensureOn(key) {
    const id = isPromptExists(key) ? key : findIdentifierByName(key);
    if (!id) return false;
    return setPromptEnabled(id, true);
}

export function ensureOff(key) {
    const id = isPromptExists(key) ? key : findIdentifierByName(key);
    if (!id) return false;
    return setPromptEnabled(id, false);
}

export function isKeyOn(key) {
    if (isPromptExists(key)) return isPromptEnabled(key);
    const id = findIdentifierByName(key);
    if (id) return isPromptEnabled(id);
    return false;
}

// ── 内部工具函数 ────────────────────────────────────────────
function isPromptExists(identifier) {
    if (!promptManager || typeof promptManager.getPromptOrderEntry !== 'function') return false;
    return Boolean(promptManager.getPromptOrderEntry(getActiveCharacter(), identifier));
}

function stripPrefix(s) {
    return String(s || '').replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
}

// ── 持久化保存 + 刷新Token ──────────────────────────────────
function persist() {
    // 保存设置到后端
    if (typeof saveSettings === 'function') {
        saveSettings();
    }
    // 刷新 Token 统计
    if (promptManager && typeof promptManager.calculateContextTokens === 'function') {
        try { promptManager.calculateContextTokens(true); } catch (_) {}
    }
}

// ── 事件订阅：预设状态变化时通知悬浮窗刷新 ──────────────────
const listeners = new Set();

export function onPromptStateChanged(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

function notifyStateChanged() {
    listeners.forEach(cb => {
        try { cb(getAllPromptStates()); } catch (_) {}
    });
}

// 监听 ST 事件，自动通知悬浮窗
const watchedEvents = [
    event_types?.CHATCOMPLETION_MODEL_CHANGED,
    event_types?.OAI_PRESET_CHANGED_AFTER,
    event_types?.CHAT_LOADED,
    event_types?.CHARACTER_EDITED,
].filter(Boolean);

watchedEvents.forEach(type => {
    eventSource.on(type, () => {
        setTimeout(notifyStateChanged, 100);
    });
});
