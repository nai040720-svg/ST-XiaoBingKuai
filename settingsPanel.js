// ============================================================
// settingsPanel.js - SillyTavern extension settings panel
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
                    <small class="opacity70p">API驱动 · 仅保留悬浮窗</small>
                </div>
            </div>

            <label class="checkbox_label flex1" style="margin-bottom:8px;">
                <input type="checkbox" id="xiaobingkuai_enable">
                <span><b>启用悬浮窗</b></span>
            </label>

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
