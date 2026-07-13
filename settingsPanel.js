// ============================================================
// settingsPanel.js — 小冰块悬浮窗 设置面板（嵌入ST扩展设置侧栏）
// ============================================================

export function createSettingsPanelHtml() {
    return `
    <div class="inline-drawer" id="xiaobingkuai_panel">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>❄️ 小冰块悬浮窗</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="flex-container" style="gap:10px; margin-bottom:10px;">
                <div class="flex1" style="text-align:center; padding:8px; background:rgba(255,255,255,0.05); border-radius:8px;">
                    <small class="opacity70p">API驱动 · 兼容BaiBai预设分组</small>
                </div>
            </div>

            <label class="checkbox_label flex1" style="margin-bottom:8px;">
                <input type="checkbox" id="xiaobingkuai_enable">
                <span><b>启用悬浮窗</b></span>
            </label>

            <hr>

            <div class="flex-container" style="gap:6px;">
                <div class="flex1 menu_button menu_button_full" id="xiaobingkuai_open_panel" style="text-align:center; cursor:pointer;">
                    <small>📋 打开选择面板</small>
                </div>
            </div>

            <hr>

            <div class="flex-container">
                <div class="flex1" style="text-align:center;">
                    <small class="opacity70p">版本 1.1.0</small>
                </div>
            </div>
        </div>
    </div>
    `;
}

// 选择面板浮层 HTML
export function createFloatingPanelHtml() {
    return `
    <div id="xiaobingkuai_floating_panel" style="display:none;">
        <div class="xbk-panel-backdrop"></div>
        <div class="xbk-panel-container">
            <div class="xbk-panel-header">
                <span class="xbk-panel-title">❄️ 小冰块悬浮窗</span>
                <button class="xbk-panel-close" title="关闭">✕</button>
            </div>
            <div class="xbk-panel-tabs">
                <div class="xbk-tab active" data-cat="0">通用</div>
                <div class="xbk-tab" data-cat="1">Claude</div>
                <div class="xbk-tab" data-cat="2">Gemini</div>
            </div>
            <div class="xbk-panel-body">
                <div class="xbk-cat-list xbk-cat-0" data-cat="0"></div>
                <div class="xbk-cat-list xbk-cat-1" data-cat="1" style="display:none;"></div>
                <div class="xbk-cat-list xbk-cat-2" data-cat="2" style="display:none;"></div>
            </div>
            <div class="xbk-panel-footer">
                <span class="xbk-footer-text">小冰块悬浮窗 v1.1.0</span>
            </div>
        </div>
    </div>
    `;
}

// 选择面板样式
export function createFloatingPanelStyle() {
    return `
    <style id="xiaobingkuai_panel_style">
    .xbk-panel-backdrop {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 999998;
        backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        animation: xbk-fade-in 0.2s ease;
    }
    .xbk-panel-container {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 360px; max-width: calc(100vw - 20px);
        max-height: 80vh; z-index: 999999;
        background: rgba(22,22,22,0.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.6);
        display: flex; flex-direction: column; overflow: hidden;
        animation: xbk-panel-in 0.25s cubic-bezier(0.34,1.3,0.64,1);
        font-family: 'Microsoft YaHei','PingFang SC',sans-serif;
    }
    @media (max-width: 768px) {
        .xbk-panel-container { width: calc(100% - 16px); max-height: 85vh; }
    }
    @keyframes xbk-fade-in { from{opacity:0;} to{opacity:1;} }
    @keyframes xbk-panel-in {
        from { opacity:0; transform: translate(-50%,-48%) scale(0.95); }
        to { opacity:1; transform: translate(-50%,-50%) scale(1); }
    }
    .xbk-panel-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px; background: rgba(0,0,0,0.2);
        border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
    }
    .xbk-panel-title {
        font-size: 14px; font-weight: bold; color: #eee; letter-spacing: 0.05em;
    }
    .xbk-panel-close {
        width: 24px; height: 24px; border-radius: 6px; border: none;
        background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
        font-size: 14px; transition: all 0.15s;
    }
    .xbk-panel-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .xbk-panel-tabs {
        display: flex; gap: 2px; padding: 8px 8px 0 8px; flex-shrink: 0;
    }
    .xbk-tab {
        flex: 1; text-align: center; padding: 8px 0; font-size: 12px; font-weight: bold;
        color: rgba(255,255,255,0.4); cursor: pointer; border-radius: 8px 8px 0 0;
        transition: all 0.15s; letter-spacing: 0.05em;
    }
    .xbk-tab:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
    .xbk-tab.active { color: #fff; background: rgba(255,255,255,0.08); }
    .xbk-panel-body {
        flex: 1; overflow-y: auto; padding: 8px;
        scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;
    }
    .xbk-panel-body::-webkit-scrollbar { width: 4px; }
    .xbk-panel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
    .xbk-panel-body::-webkit-scrollbar-track { background: transparent; }
    .xbk-cat-list { display: flex; flex-direction: column; gap: 4px; }
    .xbk-group { margin-bottom: 2px; }
    .xbk-group-summary {
        font-size: 11.5px; font-weight: bold; color: rgba(255,255,255,0.8);
        padding: 8px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;
        cursor: pointer; display: flex; justify-content: space-between; align-items: center;
        letter-spacing: 0.05em; transition: background 0.2s; list-style: none;
    }
    .xbk-group-summary:hover { background: rgba(255,255,255,0.05); }
    .xbk-group-summary::after { content: "▼"; font-size: 9px; opacity: 0.5; transition: transform 0.2s; }
    .xbk-group[open] > .xbk-group-summary::after { transform: rotate(180deg); }
    .xbk-group-content { padding: 6px 0 4px 0; display: flex; flex-direction: column; gap: 6px; }
    .xbk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .xbk-btn {
        display: flex; align-items: center; justify-content: space-between;
        height: 28px; padding: 0 8px; border-radius: 6px; box-sizing: border-box;
        background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
        cursor: pointer; transition: all 0.15s ease;
    }
    .xbk-btn:hover { background: rgba(255,255,255,0.08); }
    .xbk-btn-text {
        font-size: 11px; color: rgba(255,255,255,0.7); white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis; line-height: 1;
    }
    .xbk-btn-led {
        width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        background: rgba(255,255,255,0.15); border: 1px solid rgba(0,0,0,0.5);
        transition: all 0.2s ease; margin-left: 4px;
    }
    .xbk-btn.on { background: rgba(96,185,200,0.15); border-color: rgba(96,185,200,0.4); }
    .xbk-btn.on .xbk-btn-text { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    .xbk-btn.on .xbk-btn-led { background: #60b9c8; box-shadow: 0 0 6px #60b9c8; border-color: transparent; }
    .xbk-btn.wide { grid-column: 1 / -1; }
    .xbk-nested { margin-left: 4px; border-left: 2px solid rgba(255,255,255,0.08); padding-left: 6px; margin-bottom: 4px; }
    .xbk-nested > summary {
        background: rgba(255,255,255,0.06); font-size: 10.5px; color: rgba(255,255,255,0.7);
        padding: 6px 10px; border-radius: 4px; cursor: pointer; list-style: none;
    }
    .xbk-panel-footer {
        padding: 8px 16px 10px; font-size: 10px; color: rgba(255,255,255,0.3);
        background: rgba(0,0,0,0.88); text-align: center; flex-shrink: 0; letter-spacing: 0.04em;
    }
    </style>
    `;
}
