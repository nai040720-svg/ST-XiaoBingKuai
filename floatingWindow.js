// ============================================================
// floatingWindow.js — 小冰块悬浮窗 UI 模块
// 由 index.js 加载，通过 bridge 接口与 ST 通信
// ============================================================

export default function initFloatingWindow(bridge) {
  // 注入桥接到全局，供内部代码使用
  window.__xiaobingkuai_bridge = bridge;

  try {

        const ID = "th-orb-v6-custom";
        const pdoc = document;
        const pwin = window;

        // ===== 桥接接口（由 index.js 注入） =====
        const _bridge = window.__xiaobingkuai_bridge;
        if (!_bridge) { console.error('[小冰块悬浮窗] 桥接接口未注入'); return; }
        const B = _bridge.preset; // 预设操作API

        // ── 清理所有旧版本 ────────────────────────────
        const legacyOrbPattern = /^th-orb-v\d+(?:\.\d+)?-prismfox(?:-(?:drag-mask|panic-mask|cyber-term|style))?$/;
        Array.from(pdoc.querySelectorAll("[id]")).forEach((el) => {
          if (legacyOrbPattern.test(el.id) && el.id !== ID && el.id !== `${ID}-style`) el.remove();
        });
        [
          ID,
          `${ID}-drag-mask`,
          `${ID}-panic-mask`,
          `${ID}-cyber-term`,
          `${ID}-skin-style`,
          `${ID}-external-skin-style`,
          `${ID}-shim-love-skin-style`,
        ].forEach((oldId) => {
          pdoc.getElementById(oldId)?.remove();
          pdoc.getElementById(`${oldId}-style`)?.remove();
        });

        // ── 彻底删除/屏蔽手机端老板键 (Panic Mode) ──────
        try {
          if (pwin.panicMode) pwin.panicMode = () => {};
          if (window.panicMode) window.panicMode = () => {};
          if (pwin.$) {
            pwin.$(pdoc).off("dblclick", ".mes_window, #bg_layer, body");
            pwin.$(pdoc.body).off("dblclick");
          }
          pdoc.addEventListener(
            "dblclick",
            (e) => {
              if (e.target === pdoc.body || e.target.id === "bg_layer" || e.target.classList?.contains("mes_window")) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true,
          );
        } catch (err) {
          console.warn("屏蔽老板键时出错:", err);
        }

        // ── 读取保存的位置、主题与模型状态 ─────────
        const isMobile = pwin.innerWidth <= 768;
        const pos = isMobile ? { x: pwin.innerWidth - 60, y: pwin.innerHeight - 120 } : { x: 40, y: 160 };
        let currentTheme = "bg-dark";
        let savedModel = "claude";
        const ORB_EXPORTED_CONFIG = {
          "regexBindings": {
                "e14147cb-1ba0-406e-9ca2-5e7ffc6bb381": [{ "id": "小说顶栏美化", "mode": "on" }],
                "3095a013-690e-492b-bae5-23a35e9ebdb6": [{ "id": "摘要幽灵", "mode": "on" }],
                "99aabe12-2795-441a-bee3-0c0c6405a9b2": [{ "id": "角色表美化", "mode": "on" }],
                "f1956655-7eca-4452-b1ba-ec765daf0a10": [{ "id": "单人通用状态栏", "mode": "on" }]
          },
          "scriptBindings": {},
          "modelConfig": {
                "claude": [
                            "📌身份📌",
                            "📝写作模式↓[自选]",
                            "📝写作模式↑"
                ]
    },
          "modelRecConfig": {
                "claude": {
                      "on": [],
                      "off": []
                }
          },
          "modelMeta": {
                "claude": {
                      "label": "克劳德",
                      "hidden": false,
                      "order": 10
                }
          },
          "currentTheme": "bg-dark",
          "savedModel": "claude"
    };
        function cloneExportConfig(value, fallback) {
          const source = value && typeof value === "object" && Object.keys(value).length > 0 ? value : fallback;
          return JSON.parse(JSON.stringify(source));
        }

        function getSkinPlugin() {
          const plugin = pwin.orbSkinPlugin || window.orbSkinPlugin;
          return plugin && typeof plugin === "object" ? plugin : null;
        }

        function normalizeSkinCss(css) {
          return String(css || "")
            .replaceAll("#{ID}", `#${ID}`)
            .replaceAll("#th-orb-v6-custom", `#${ID}`)
            .replaceAll("#th-orb-v6-custom", `#${ID}`);
        }

        const skinPlugin = getSkinPlugin();
        const skinThemes = skinPlugin?.themes && typeof skinPlugin.themes === "object" ? skinPlugin.themes : {};

        function renderSkinThemeDots() {
          return Object.entries(skinThemes)
            .map(([themeId, theme]) => {
              const dotColor = theme?.dotColor || theme?.color || theme?.bg || "#ff00ff";
              const title = theme?.title || theme?.name || themeId;
              return `<div class="t-dot ${currentTheme === themeId ? "active" : ""}" data-theme="${themeId}" style="background:${dotColor};" title="${title}"></div>`;
            })
            .join("");
        }

        function renderSkinThemeCss() {
          return Object.entries(skinThemes)
            .map(([themeId, theme]) => theme?.bg ? `#${ID} .${themeId} { background: ${theme.bg}; }` : "")
            .filter(Boolean)
            .join("\n");
        }
        try {
          const vars = (typeof getVariables === "function") ? (getVariables({ type: "global" }) || {}) : {};
          const r = vars.orbV6_prismfox_pos || vars.orbV5_prismfox_pos;
          if (r) {
            const saved = JSON.parse(r);
            saved.x = Math.max(0, Math.min(Number(saved.x) || 40, pwin.innerWidth - 48));
            saved.y = Math.max(0, Math.min(Number(saved.y) || 160, pwin.innerHeight - 48));
            if (saved.theme) currentTheme = saved.theme;
            if (saved.model) savedModel = saved.model;
            Object.assign(pos, saved);
          }
          if (!r) {
            if (ORB_EXPORTED_CONFIG.currentTheme) currentTheme = ORB_EXPORTED_CONFIG.currentTheme;
            if (ORB_EXPORTED_CONFIG.savedModel) savedModel = ORB_EXPORTED_CONFIG.savedModel;
          }
        } catch (_) {}
        if (currentTheme && !["bg-glass", "bg-dark", "bg-blue", "bg-green"].includes(currentTheme) && !skinThemes[currentTheme]) currentTheme = "bg-blue";

        // ── 样式表 ──────────────────────────────────────
        const style = pdoc.createElement("style");
        style.id = `${ID}-style`;
        style.textContent = `
        #${ID} {
          position: fixed !important; z-index: 2147483640 !important;
          width: 48px; height: 48px;
          font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
          user-select: none; -webkit-user-select: none; touch-action: none;
          -webkit-transform: translateZ(0); transform: translateZ(0);
        }

        #${ID} .orb {
          position: absolute; top: 0; left: 0;
          width: 48px; height: 48px; border-radius: 8px; cursor: pointer; z-index: 2;
          background: transparent; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease;
        }
        #${ID} .orb:hover { background: rgba(255, 255, 255, 0.05); }

        #${ID} .orb-icon {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
          filter: none; display: block;
          animation: orbBreathe 2.5s ease-in-out infinite;
        }
        @keyframes orbBreathe {
          0%, 100% { text-shadow: 0 0 4px rgba(217,119,87,0.3), 0 0 8px rgba(96,185,200,0.15), 0 0 14px rgba(217,119,87,0.08); }
          50% { text-shadow: 0 0 8px rgba(217,119,87,0.45), 0 0 16px rgba(96,185,200,0.25), 0 0 24px rgba(217,119,87,0.12); }
        }
        #${ID} .orb:hover .orb-icon { transform: scale(1.15); }
        #${ID}.open .orb-icon { transform: rotate(90deg) scale(1.1); }

        #${ID} .menu {
          position: absolute; width: 340px; pointer-events: none;
          -webkit-transform: scale(0.95) translateY(-4px); transform: scale(0.95) translateY(-4px);
          opacity: 0; transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1), opacity 0.15s ease;
        }
        @media (max-width: 768px) { #${ID} .menu { width: 310px; } }

        #${ID}.open .menu {
          pointer-events: all; -webkit-transform: scale(1) translateY(0); transform: scale(1) translateY(0); opacity: 1;
        }
        #${ID}.open-up .menu {
          -webkit-transform: scale(0.95) translateY(4px); transform: scale(0.95) translateY(4px);
        }
        #${ID}.open.open-up .menu {
          -webkit-transform: scale(1) translateY(0); transform: scale(1) translateY(0);
        }

        /* ── 外壳与主题 ── */
        #${ID} .menu-shell {
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
          overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: background 0.3s ease; position: relative;
        }
        #${ID} .bg-glass { background: rgba(15, 15, 15, 0.45); backdrop-filter: blur(16px) saturate(120%); -webkit-backdrop-filter: blur(16px) saturate(120%); }
        #${ID} .bg-dark { background: rgba(22, 22, 22, 0.95); backdrop-filter: blur(8px); }
        #${ID} .bg-blue { background: rgba(15, 22, 35, 0.95); backdrop-filter: blur(8px); }
        #${ID} .bg-green { background: rgba(18, 30, 22, 0.95); backdrop-filter: blur(8px); }
        #${ID} .bg-white { background: rgba(245, 245, 245, 0.96); backdrop-filter: blur(8px); }
        #${ID} .bg-white .menu-title,
        #${ID} .bg-white summary,
        #${ID} .bg-white .menu-item-text { color: #000000; text-shadow: none; }
        #${ID} .bg-white .menu-item-text { color: #000000; }
        #${ID} .bg-white summary::after { color: #000000; }
        #${ID} .bg-white .menu-head { background: rgba(0,0,0,0.04); border-bottom-color: rgba(0,0,0,0.08); }
        #${ID} .bg-white .menu-shell { border-color: rgba(0,0,0,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8); }
        #${ID} .bg-white summary { background: rgba(0,0,0,0.04); color: #000000; }
        #${ID} .bg-white summary:hover { background: rgba(0,0,0,0.06); }
        #${ID} .bg-white .menu-item-toggle { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); }
        #${ID} .bg-white .menu-item-toggle:hover { background: rgba(0,0,0,0.08); }
        #${ID} .bg-white .menu-item-toggle.is-on { background: rgba(217,119,87,0.12); border-color: rgba(217,119,87,0.35); }
        #${ID} .bg-white .menu-item-toggle.is-on .menu-item-text { color: #000000; text-shadow: none; }
        #${ID} .bg-white .menu-item-toggle.is-on .toggle-led { background: #D97757; box-shadow: 0 0 6px #D97757; }
        #${ID} .bg-white .toggle-led { background: rgba(0,0,0,0.12); border-color: rgba(0,0,0,0.15); }
        #${ID} .bg-white .menu-close { color: #000000; }
        #${ID} .bg-white .menu-close:hover { background: rgba(0,0,0,0.08); color: #000000; }
        #${ID} .bg-white .t-dot { border-color: rgba(0,0,0,0.25); }
        #${ID} .bg-white .t-dot.active { border-color: #000000; box-shadow: 0 0 4px rgba(0,0,0,0.3), inset 0 0 3px rgba(0,0,0,0.2); }
        #${ID} .bg-white .fox-link { color: #000000; }
        #${ID} .bg-white .fox-link:hover { color: #000000; text-shadow: none; }
        #${ID} .bg-white .menu-foot { background: rgba(245, 245, 245, 0.95); color: rgba(0,0,0,0.4); }
        #${ID} .bg-white .sexy-group { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.08); }
        #${ID} .bg-white .sexy-seg:hover { background: rgba(0,0,0,0.06); }
        #${ID} .bg-white .sexy-seg.is-on { background: rgba(217,119,87,0.15); }
        #${ID} .bg-white .sexy-seg.is-on .sexy-seg-label { color: #000000; text-shadow: none; }
        #${ID} .bg-white .sexy-seg-label { color: #000000; }
        #${ID} .bg-white .menu-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
        #${ID} .bg-white .menu-subtitle { color: rgba(0,0,0,0.45); text-shadow: none; }
        #${ID} .bg-white .nested-details summary { background: rgba(0,0,0,0.03); color: #000000; }
        #${ID} .bg-white .btn-full { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); }
        #${ID} .bg-white .btn-full .menu-item-text { color: #000000; }
        #${ID} .bg-white .btn-full.is-on { background: rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.15); }
        #${ID} .bg-white .btn-full.is-on .menu-item-text { color: #000000; }
        #${ID} .bg-white .edit-mode summary::after { color: #000000; }
        #${ID} .bg-white .edit-mode .layout-subgroup-tools .subgroup-label { color: #000000; }
        #${ID} .bg-white .edit-mode details.hidden-group summary::after { color: #000000; }
        #${ID} .bg-white .edit-btn { background: rgba(0,0,0,0.06); border-color: rgba(0,0,0,0.15); color: #000000; }
        #${ID} .bg-white .edit-btn:hover { background: rgba(0,0,0,0.1); color: #000000; }
        #${ID} .bg-white .edit-btn.del { color: #000000; border-color: rgba(0,0,0,0.2); }
        #${ID} .bg-white .edit-btn.add { color: #000000; border-color: rgba(0,0,0,0.2); }
        #${ID} .bg-white .edit-btn.hide-grp { color: #000000; border-color: rgba(0,0,0,0.2); }
        #${ID} .bg-white .binding-badge { color: #000000; border-color: rgba(0,0,0,0.2); background: rgba(0,0,0,0.06); }
        #${ID} .bg-white .binding-badge.regex { color: #000000; border-color: rgba(0,0,0,0.25); background: rgba(0,0,0,0.08); }
        #${ID} .bg-white .binding-badge.script { color: #000000; border-color: rgba(0,0,0,0.25); background: rgba(0,0,0,0.08); }
        .bg-white ~ [id$="-search-modal"] input { color: #000000; background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.15); }
        .bg-white ~ [id$="-search-modal"] .search-item { color: #000000; }
        .bg-white ~ [id$="-search-modal"] .close-search { color: #000000; background: rgba(0,0,0,0.06); }
        .bg-white ~ [id$="-search-modal"] .search-results { scrollbar-color: rgba(0,0,0,0.15) transparent; }

        /* ── 标题栏 ── */
        #${ID} .menu-head {
          display: flex; align-items: center; gap: 8px; padding: 12px 14px;
          background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: grab; flex-shrink: 0;
        }
        #${ID} .menu-head:active { cursor: grabbing; }
        #${ID} .menu-title-wrap {
          flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }
        #${ID} .menu-title {
          font-size: 13px; font-weight: bold; color: #eeeeee;
          letter-spacing: 0.05em; line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        #${ID} .menu-subtitle {
          font-size: 9px; color: rgba(255,255,255,0.35); line-height: 1;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        #${ID} .theme-dots { display: flex; gap: 8px; margin-right: 12px; align-items: center; }
        #${ID} .t-dot {
          width: 14px; height: 14px; border-radius: 50%; cursor: pointer;
          border: 2px solid rgba(255,255,255,0.3); transition: all 0.2s;
        }
        #${ID} .t-dot:hover { transform: scale(1.2); }
        #${ID} .t-dot.active { border-color: #fff; box-shadow: 0 0 6px #fff, inset 0 0 4px rgba(0,0,0,0.5); transform: scale(1.1); }

        #${ID} .menu-close {
          width: 22px; height: 22px; border-radius: 4px; border: none;
          background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          transition: all 0.15s; padding: 0;
        }
        #${ID} .menu-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

        /* ── 三分类Tab栏 ── */
        #${ID} .category-tabs { display: flex; gap: 0; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.12); flex-shrink: 0; }
        #${ID} .category-tab { flex: 1; text-align: center; padding: 5px 0; font-size: 11px; cursor: pointer; border-radius: 5px; transition: all 0.18s; color: rgba(255,255,255,0.4); font-weight: 500; margin: 0 2px; user-select: none; }
        #${ID} .category-tab:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
        #${ID} .category-tab.cat-1:hover { background: rgba(64,140,255,0.1); color: #6db3ff; }
        #${ID} .category-tab.cat-2:hover { background: rgba(230,60,60,0.1); color: #ff7070; }
        #${ID} .category-tab.active { font-weight: 700; }
        #${ID} .category-tab.cat-0.active { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.95); }
        #${ID} .category-tab.cat-1.active { background: rgba(40,120,255,0.22); color: #4d9fff; }
        #${ID} .category-tab.cat-2.active { background: rgba(220,40,40,0.22); color: #ff6b6b; }
        #${ID} .tab-item-hidden { display: none !important; }
        #${ID} .tab-group-hidden > .details-content > .grid-toggles, #${ID} .tab-group-hidden > .details-content > .nested-details { display: none !important; }
        #${ID} .tab-group-empty { display: none !important; }

        /* ── 列表区域 ── */
        #${ID} .menu-list {
          padding: 8px 8px 42px 8px; display: flex; flex-direction: column; gap: 4px;
          overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;
          max-height: 65vh;
        }
        #${ID} .menu-list::-webkit-scrollbar { width: 4px; }
        #${ID} .menu-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

        /* ── 折叠面板样式 ── */
        #${ID} details { margin-bottom: 2px; }
        #${ID} summary {
          font-size: 11.5px; font-weight: bold; color: rgba(255,255,255,0.8);
          padding: 8px 10px; background: rgba(0,0,0,0.15); border-radius: 6px;
          cursor: pointer; list-style: none; user-select: none;
          display: flex; justify-content: space-between; align-items: center;
          text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s;
        }
        #${ID} summary:hover { background: rgba(255,255,255,0.05); }
        #${ID} summary::after { content: "▼"; font-size: 9px; opacity: 0.5; transition: transform 0.2s; }
        #${ID} details[open] > summary::after { transform: rotate(180deg); }
        #${ID} .details-content { padding: 8px 0 4px 0; display: flex; flex-direction: column; gap: 6px; }

        /* ── 嵌套子菜单样式 ── */
        #${ID} .nested-details {
          margin-left: 4px; border-left: 2px solid rgba(255,255,255,0.08);
          padding-left: 6px; margin-bottom: 4px;
        }
        #${ID} .nested-details summary {
          background: rgba(255, 255, 255, 0.06);
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.7);
          padding: 6px 10px;
          border-radius: 4px;
        }
        #${ID} .nested-details summary:hover { background: rgba(255, 255, 255, 0.12); }
        #${ID} .nested-details .details-content {
          padding: 6px 0 4px 4px;
        }

        /* ── 按钮与开关 ── */
        #${ID} .sexy-group {
          margin: 0 4px; display: flex; border-radius: 6px;
          background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.06);
          height: 30px; flex-shrink: 0; overflow: hidden; box-sizing: border-box;
        }
        #${ID} .sexy-seg {
          flex: 1; display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; transition: background 0.15s; background: transparent;
        }
        #${ID} .sexy-seg + .sexy-seg { border-left: 1px solid rgba(255,255,255,0.05); }
        #${ID} .sexy-seg:hover { background: rgba(255,255,255,0.08); }
        #${ID} .sexy-seg-label {
          font-size: 11px; color: rgba(255,255,255,0.6); line-height: 1; margin-top: 1px;
          transition: color 0.15s; pointer-events: none; text-align: center;
        }
        #${ID} .sexy-seg.is-on { background: rgba(96, 185, 200, 0.2); }
        #${ID} .sexy-seg.is-on .sexy-seg-label { color: #60b9c8; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.8); }

        .grid-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px; }
        .grid-toggles.col-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-toggles.col-2 { grid-template-columns: 1fr 1fr; }
        .grid-toggles.col-1 { grid-template-columns: 1fr; }

        #${ID} .menu-item-toggle {
          display: flex; align-items: center; justify-content: space-between;
          height: 28px; padding: 0 8px; border-radius: 6px; box-sizing: border-box;
          background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer; transition: all 0.15s ease; margin: 0;
        }
        #${ID} .menu-item-toggle:hover { background: rgba(255,255,255,0.08); }
        #${ID} .menu-item-text {
          font-size: 11px; color: rgba(255,255,255,0.7); white-space: nowrap;
          line-height: 1; margin-top: 1px; overflow: hidden; text-overflow: ellipsis;
        }
        #${ID} .toggle-led {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.15);
          transition: all 0.2s ease; border: 1px solid rgba(0,0,0,0.5); margin-left: 4px;
        }

        #${ID} .menu-item-toggle.is-on { background: rgba(96, 185, 200, 0.15); border-color: rgba(96, 185, 200, 0.4); }
        #${ID} .menu-item-toggle.is-on .menu-item-text { color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
        #${ID} .menu-item-toggle.is-on .toggle-led { background: #60b9c8; box-shadow: 0 0 6px #60b9c8; border-color: transparent; }
        #${ID} .toggle-btn-wide { grid-column: 1 / -1; }

        #${ID} .btn-full { grid-column: 1 / -1; justify-content: center; background: rgba(232, 176, 114, 0.05); gap: 6px; border-color: rgba(232, 176, 114, 0.2); }
        #${ID} .btn-full .menu-item-text { font-size: 12px; font-weight: bold; color: #e8b072; margin-top: 0; }
        #${ID} .btn-full.is-on { background: rgba(232, 176, 114, 0.2); border-color: rgba(232, 176, 114, 0.5); }
        #${ID} .btn-full.is-on .menu-item-text { color: #ffd6a5; }
        #${ID} .btn-full.is-on .toggle-led { background: #e8b072; box-shadow: 0 0 6px #e8b072; border-color: transparent;}

        /* 底部区域 - 实色背景浮于黑框底部内侧 */
        #${ID} .menu-foot {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px 13px; font-size: 10px; color: rgba(255,255,255,0.5);
          background: rgba(0, 0, 0, 0.88);
          pointer-events: none; letter-spacing: 0.04em;
        }
        #${ID} .menu-foot > * { pointer-events: auto; }
        #${ID} .menu-foot #${ID}-edit-trigger {
          opacity: 0.75; transition: opacity 0.2s;
        }
        #${ID} .menu-foot #${ID}-edit-trigger:hover {
          opacity: 1;
        }
        #${ID} .fox-link {
          cursor: pointer; color: rgba(96,185,200,0.6); font-weight: bold; letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-size: 10px;
        }
        #${ID} .fox-link:hover {
          color: #e8b072; text-shadow: 0 0 8px rgba(232, 176, 114, 0.8); transform: scale(1.08);
        }

        /* ── 编辑模式 ── */
        #${ID}.edit-mode .menu-shell { border: 2px dashed #e8b072; }
        #${ID}.edit-mode .menu-title,
        #${ID}.edit-mode summary .summary-text,
        #${ID}.edit-mode .menu-item-text {
          border: 1px dashed rgba(255,255,255,0.5); padding-left: 2px; padding-right: 2px; cursor: text !important;
          user-select: text; -webkit-user-select: text; pointer-events: auto;
        }
        #${ID}.edit-mode summary::after { content: " (编辑)"; opacity: 0.8; font-size: 10px; color: #e8b072; transform: none; }
        #${ID}.edit-mode .drag-handle-group { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; cursor: move; border-radius: 4px; background: rgba(255,255,255,0.1); margin-left: 6px; font-size: 12px; }
        #${ID}:not(.edit-mode) .drag-handle-group { display: none; }
        #${ID} .edit-tools { display: none; }
        #${ID}.edit-mode .toggle-btn { cursor: move; position: relative; min-height: 46px; padding-bottom: 24px; align-items: center; }
        #${ID}.edit-mode .toggle-btn .menu-item-text { max-width: calc(100% - 28px); box-sizing: border-box; text-align: center; }
        #${ID}.edit-mode .toggle-btn .toggle-led { position: absolute; top: 7px; right: 7px; }
        #${ID}.edit-mode .toggle-btn .edit-tools { display: flex; position: absolute; left: 6px; right: 6px; bottom: 4px; min-height: 17px; gap: 4px; pointer-events: auto; align-items: center; justify-content: center; flex-wrap: nowrap; }
        #${ID}.edit-mode .toggle-btn.edit-tools-wrap { min-height: 64px; padding-bottom: 42px; }
        #${ID}.edit-mode .toggle-btn.edit-tools-wrap .edit-tools { flex-wrap: wrap; row-gap: 3px; }
        #${ID}.edit-mode .toggle-btn .edit-tools .edit-btn { min-width: 24px; height: 17px; padding: 0 5px; line-height: 15px; font-size: 10px; }
        #${ID}.edit-mode .toggle-btn .edit-tools .drag-handle { width: 18px; height: 17px; margin-right: 0 !important; line-height: 17px; display: inline-flex; align-items: center; justify-content: center; }
        #${ID}.edit-mode .toggle-btn .edit-tools .lock { min-width: 20px; padding: 0 3px; }
        #${ID}.edit-mode .edit-tools-group,
        #${ID}.edit-mode .edit-tools-main { display: block; }
        #${ID}.edit-mode .edit-tools-group .group-tool-row { display: flex; gap: 4px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 4px; }
        #${ID}.edit-mode .edit-tools-group .group-tool-cluster { display: inline-flex; gap: 4px; align-items: center; flex-wrap: wrap; }
        #${ID}.edit-mode .edit-tools-group .group-action-row { display: flex; gap: 4px; flex-wrap: wrap; }
        #${ID}.edit-mode .edit-tools-group .group-action-row .edit-btn { flex: 1 1 auto; }
        #${ID} .layout-subgroup { display: contents; }
        #${ID} .layout-subgroup-tools { display: none; }
        #${ID}.edit-mode .layout-subgroup { display: block; border: 1px dashed rgba(96,185,200,0.45); border-radius: 8px; padding: 5px; margin: 6px 2px; background: rgba(96,185,200,0.06); }
        #${ID}.edit-mode .layout-subgroup-tools { display: flex; gap: 4px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 5px; }
        #${ID}.edit-mode .layout-subgroup-tools .subgroup-label { font-size: 10px; color: #bde7ff; opacity: 0.85; }
        #${ID}.edit-mode .layout-subgroup-tools .subgroup-actions { display: inline-flex; gap: 4px; flex-wrap: wrap; }
        #${ID} .binding-badges { display: inline-flex; align-items: center; gap: 3px; margin-left: 4px; flex-shrink: 0; }
        #${ID}:not(.edit-mode) .binding-badge.link,
        #${ID}:not(.edit-mode) .binding-badge.mutex { display: none; }
        #${ID} .binding-badge { font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
        #${ID} .binding-badge.regex { color: #ffd6a5; border-color: rgba(232,176,114,0.45); background: rgba(232,176,114,0.16); }
        #${ID} .binding-badge.script { color: #bde7ff; border-color: rgba(96,185,200,0.45); background: rgba(96,185,200,0.16); }
        #${ID} .binding-badge.link,
        #${ID} .binding-badge.mutex { width: 7px; height: 7px; padding: 0; border: none; font-size: 0; }
        #${ID} .binding-badge.link { background: #60b9c8; }
        #${ID} .binding-badge.mutex { background: #d2a8ff; }
        #${ID} .toggle-btn.has-regex-binding { box-shadow: inset 2px 0 0 rgba(232,176,114,0.9); }
        #${ID}.edit-mode .toggle-btn.has-link-binding { box-shadow: inset 2px 0 0 rgba(96,185,200,0.9); }
        #${ID}.edit-mode .toggle-btn.has-regex-binding.has-link-binding { box-shadow: inset 2px 0 0 rgba(232,176,114,0.9), inset 4px 0 0 rgba(96,185,200,0.9); }

        /* 分组隐藏功能 CSS */
        #${ID} details.hidden-group { display: none; }
        #${ID}.edit-mode details.hidden-group { display: block; opacity: 0.5; }
        #${ID}.edit-mode details.hidden-group summary::after { content: " (已隐藏)"; color: #ff5555; }

        #${ID} .edit-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer; transition: all 0.2s; }
        #${ID} .edit-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
        #${ID} .edit-btn.del { color: #ff7b72; border-color: rgba(255,123,114,0.3); }
        #${ID} .edit-btn.del:hover { background: rgba(255,123,114,0.2); }
        #${ID} .edit-btn.add { color: #7ee787; border-color: rgba(126,231,135,0.3); }
        #${ID} .edit-btn.add:hover { background: rgba(126,231,135,0.2); }
        #${ID} .edit-btn.hide-grp { color: #d2a8ff; border-color: rgba(210,168,255,0.3); }
        #${ID} .edit-btn.hide-grp:hover { background: rgba(210,168,255,0.2); }

        /* 搜素与添加条目的模态框 */
        #${ID}-search-modal {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 10;
          border-radius: 12px; display: none; flex-direction: column; padding: 12px; box-sizing: border-box;
        }
        #${ID}.search-active #${ID}-search-modal { display: flex; }
        #${ID}-search-modal input {
          background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white;
          padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 12px; width: 100%; box-sizing: border-box; outline: none;
        }
        #${ID}-search-modal .search-results {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;
        }
        #${ID}-search-modal .search-item {
          padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; cursor: pointer; font-size: 11px; color: #ddd;
        }
        #${ID}-search-modal .search-item:hover { background: rgba(255,255,255,0.15); }
        #${ID}-search-modal .close-search { margin-top: 8px; padding: 6px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;}

        @keyframes orb-in { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
        #${ID} { animation: orb-in 0.2s cubic-bezier(0.34,1.3,0.64,1) both; }
      `;
        pdoc.head.appendChild(style);
        try {
          const skinCss = [renderSkinThemeCss(), normalizeSkinCss(skinPlugin?.css)].filter((item) => item.trim()).join("\n");
          if (skinCss.trim()) {
            const skinStyle = pdoc.createElement("style");
            skinStyle.id = `${ID}-skin-style`;
            skinStyle.textContent = skinCss;
            pdoc.head.appendChild(skinStyle);
          }
        } catch (err) {
          console.warn("加载皮肤包时出错:", err);
        }

        // ── DOM 渲染 ────────────────────────────────────────────────
        const root = pdoc.createElement("div");
        root.id = ID;
        root.style.left = `${pos.x}px`;
        root.style.top = `${pos.y}px`;

        root.innerHTML = `
        <div class="orb" id="${ID}-orb">
          <svg class="orb-icon" viewBox="0 0 48 48" width="28" height="28">
            <text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>
          </svg>
        </div>

        <div class="menu" id="${ID}-menu">
          <div class="menu-shell ${currentTheme}" id="${ID}-shell">
            <div class="menu-head" id="${ID}-head">
              <svg viewBox="0 0 48 48" width="16" height="16">
                <text x="24" y="37" text-anchor="middle" font-size="36" fill="#e8976a">❄️</text>
              </svg>
              <div class="menu-title-wrap"><div class="menu-title">小冰块V3.31双适配版</div></div>
              <div class="theme-dots"><div class="t-dot ${currentTheme === "bg-dark" ? "active" : ""}" data-theme="bg-dark" style="background:#222222;" title="黑色主题"></div><div class="t-dot ${currentTheme === "bg-white" ? "active" : ""}" data-theme="bg-white" style="background:#ffffff;" title="白色主题"></div></div>
              <button class="menu-close" id="${ID}-close">✕</button>
            </div>

            <div class="category-tabs" id="${ID}-category-tabs">
              <div class="category-tab cat-0 active" data-cat="0">通用</div>
              <div class="category-tab cat-1" data-cat="1">Claude</div>
              <div class="category-tab cat-2" data-cat="2">Gemini</div>
            </div>

            <div class="menu-list">

                <div class="cat-list cat-list-0" data-cat="0">
    <details open><summary>写作设置</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="语言默认简体中文" data-id="2c096b4f-2283-48bd-8ca6-2e2fb048de8c"><div class="menu-item-text">语言默认简体中文</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️禁止医学词" data-id="3cc24793-e971-4cf7-a177-2917063f6b4f"><div class="menu-item-text">禁止医学词</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️去除user中心" data-id="33083313-6d9d-456d-8229-fc2e601be087"><div class="menu-item-text">去除user中心</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️请去工作/上学" data-id="f00f7f5c-65cc-4427-81b5-f04cfae1c57e"><div class="menu-item-text">请去工作/上学</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="×不要总吃饭" data-id="f86656e0-8f29-44ff-b231-2405282858b7"><div class="menu-item-text">不要总吃饭</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️古代世界@人间月下-海莉" data-id="86efb125-5bfe-4a8b-9dbf-9c56d1aa7803"><div class="menu-item-text">古代世界@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️语言净化去“儿”音" data-id="abfbfabe-ae03-404d-94da-7fb6d0ddffd7"><div class="menu-item-text">语言净化去“儿”音</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️反“然后”" data-id="044e1f2e-c14f-4481-9581-8566499eb7bc"><div class="menu-item-text">反“然后”</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️反人机语言" data-id="99255a68-65f7-407a-bbb2-8134443d2323"><div class="menu-item-text">反人机语言</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️角色信息差" data-id="824c48a5-1732-448e-b367-46ec6464fc12"><div class="menu-item-text">角色信息差</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️防解释补充包" data-id="76c7e5d9-cd02-4c14-9628-07c7767c31ca"><div class="menu-item-text">防解释补充包</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔧(建议开)视角确认" data-id="e82e62a6-958d-44cd-8fc2-aec1a6ec1513"><div class="menu-item-text">建议开)视角确认</div><div class="toggle-led"></div></div></div><details class="nested-details"><summary>user设定</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="⚪️禁止瞎编user👧🏻" data-id="c2110981-b605-4343-a602-bf2b98141cf2"><div class="menu-item-text">禁止瞎编user👧🏻</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="日常服装情趣@听安" data-id="e4969090-d4a3-463d-bffa-5fd10355b6de"><div class="menu-item-text">日常服装情趣@听安</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>char角色设定</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="⚪️反瞎编char设定" data-id="cd80d0c3-5c67-444e-ac34-a08c9fc5f1a8"><div class="menu-item-text">反瞎编char设定</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️拒绝穷人/拒绝吃面条" data-id="017e1f84-e57e-4b67-bc86-f6a64fd24023"><div class="menu-item-text">拒绝穷人/拒绝吃面条</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️减少角色口癖" data-id="c205abe5-0929-4a6a-a88d-3e2ba3d7210a"><div class="menu-item-text">减少角色口癖</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️群像NPC" data-id="1cff76c2-0c40-4fef-a8ca-915f2f1f515f"><div class="menu-item-text">群像NPC</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️反回忆杀[建议开]" data-id="4d8e538e-153a-41cb-a195-b0a7fdbfc65b"><div class="menu-item-text">反回忆杀[建议开]</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️你要做爱干净的银" data-id="00227034-8fb6-427e-840a-764a4cf6fd04"><div class="menu-item-text">你要做爱干净的银</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️食物补充包" data-id="582327a0-b9d4-4b44-a47f-942414745259"><div class="menu-item-text">食物补充包</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴反霸总" data-id="593ffc8b-1cd0-4b3c-b754-6b99542a92b6"><div class="menu-item-text">反霸总</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⚪️防照搬人设补充包" data-id="3ae9abd2-5ef9-4c2c-b77c-69a687ff5a55"><div class="menu-item-text">防照搬人设补充包</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>思维链伙伴选择[五选一]</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="💖辣椒油有趣剧情" data-id="f4d79314-716b-4e9d-89eb-859bd557dd6c"><div class="menu-item-text">辣椒油有趣剧情</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖自来水注重人设" data-id="34484920-3084-490f-9e79-1b4fb91116da"><div class="menu-item-text">自来水注重人设</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖小枕头分析user剧情" data-id="dca1088c-4236-4c56-8c25-339d14ba65ec"><div class="menu-item-text">小枕头分析user剧情</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖小背心色情走向" data-id="c34ef703-6ca7-4ed1-a0f3-72bfe1830c46"><div class="menu-item-text">小背心色情走向</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖小河流be走向" data-id="141dd0af-142e-493a-8d6d-817b2f5fcfe7"><div class="menu-item-text">小河流be走向</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>思维链</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="💕线上模式" data-id="2eff07e7-1abe-49a7-a2db-f4ec231fcd73"><div class="menu-item-text">线上模式</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖同人确认" data-id="7d58874d-319c-487c-8c0b-320254c570ff"><div class="menu-item-text">同人确认</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖角色衣物确认" data-id="01340fe6-8194-4895-902a-6897a75d0a98"><div class="menu-item-text">角色衣物确认</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖关系思考" data-id="a2b6bee4-31fb-41c3-9422-d0e01dcae014"><div class="menu-item-text">关系思考</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖曾经关系剖析" data-id="1393feb7-ce02-42f0-807f-7e7056e7d8e0"><div class="menu-item-text">曾经关系剖析</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖NPC群像" data-id="da0e5a25-2534-42e4-bdd3-a8208c57ccdf"><div class="menu-item-text">NPC群像</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴避坑指南" data-id="177a3603-3e8f-49b0-a2bf-1ea9c28f883f"><div class="menu-item-text">避坑指南</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💖人设自检纠错" data-id="810a42b0-e6ad-4e2e-a599-7d216d28d17a"><div class="menu-item-text">人设自检纠错</div><div class="toggle-led"></div></div></div></div></details></div></details>
    <details open><summary>情感指导</summary><div class="details-content"><details class="nested-details"><summary>性格分类</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="💛乖🐕" data-id="4ea1dd0d-d97c-490e-8ad8-04243a5abb90"><div class="menu-item-text">乖🐕</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💛坏🐕" data-id="95713768-09cd-4c22-a269-3dcef9b65be9"><div class="menu-item-text">坏🐕</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️狐狸" data-id="14da3bd5-7996-4ead-91e0-5c9f5fccdbda"><div class="menu-item-text">狐狸</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💙年上" data-id="42102b85-b74e-4d09-8df4-a54e92822b2d"><div class="menu-item-text">年上</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💙智性恋" data-id="8dbfcb48-d678-4784-81c5-cbdff3745c35"><div class="menu-item-text">智性恋</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💚年下" data-id="102783e7-1e44-4fb4-a168-511c4465a2e5"><div class="menu-item-text">年下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💚病娇" data-id="fda16125-999c-43f8-b062-9971b0fc303f"><div class="menu-item-text">病娇</div><div class="toggle-led"></div></div></div></div></details></div></details>
    <details open><summary>文风滤镜</summary><div class="details-content"><details class="nested-details"><summary>文风滤镜</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="♦️(现实讽刺白)张爱玲" data-id="049f2e54-71b7-4ff0-ab85-9c6ccfc21087"><div class="menu-item-text">现实讽刺白)张爱玲</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(BL)蓝淋" data-id="e6b54202-73da-40fb-8cb6-11efb5df4f10"><div class="menu-item-text">BL)蓝淋</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>主文风@雨时</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="❄️了不起的盖茨比" data-id="209ab40b-717a-4dd4-9127-b80f5c2ce1a5"><div class="menu-item-text">了不起的盖茨比</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="♦️(克好吃！成人拉扯)那个不为人知的故事" data-id="5e765064-31f4-454f-b7cf-7dfa9ebc7680"><div class="menu-item-text">克好吃！成人拉扯)那个不为人知的故事</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️(绝好吃都来尝！)侬本多情" data-id="08edf2f8-e250-44de-bd20-9e1b4c3870c5"><div class="menu-item-text">绝好吃都来尝！)侬本多情</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️(浪漫白描)白孔雀" data-id="938a6f91-6975-4162-9d7c-930a0737c2d8"><div class="menu-item-text">浪漫白描)白孔雀</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️(港风拉扯)花样年华" data-id="985a6476-883e-4117-bbe6-fc2df41006e4"><div class="menu-item-text">港风拉扯)花样年华</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="♦️哈基米好吃(通用/拉扯/日常)唯美日常" data-id="166058d8-3c5a-4ebf-8c08-e6275963903a"><div class="menu-item-text">哈基米好吃(通用/拉扯/日常)唯美日常</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️(古典-克好吃)树犹如此" data-id="9ed85e4f-03e5-482a-8472-f981fd5602cf"><div class="menu-item-text">古典-克好吃)树犹如此</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬(日常对话)某某" data-id="06f272a5-f12f-40f1-81e1-8ad55dbf41fe"><div class="menu-item-text">日常对话)某某</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬青春群像" data-id="1ede0bde-39ea-467b-82b4-d35e8bebd8bd"><div class="menu-item-text">青春群像</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬(温暖镜头感)新海诚" data-id="39adaebb-cdbd-4429-879a-4e8a79fa0707"><div class="menu-item-text">温暖镜头感)新海诚</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🍬(主user视角)Twentine恋爱喜剧" data-id="cdd5e488-1a94-4ee1-93fa-4a942945da2c"><div class="menu-item-text">主user视角)Twentine恋爱喜剧</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(物哀-好吃！)川端康成" data-id="ab891cc5-d55a-4613-9a4a-93993732070f"><div class="menu-item-text">物哀-好吃！)川端康成</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(表现-意识流)赫尔曼·黑塞" data-id="dd162d15-ab08-431a-93ed-91d8a68ddcde"><div class="menu-item-text">表现-意识流)赫尔曼·黑塞</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(意识流-对话)余光中" data-id="8fe8c641-e415-448c-95f2-36b1b893891b"><div class="menu-item-text">意识流-对话)余光中</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️暗黑绮丽告白体" data-id="51ff01a9-2ce9-4584-947b-bd9b5bdbf12c"><div class="menu-item-text">暗黑绮丽告白体</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(高干政斗势均力敌)沉舟" data-id="708a43f7-a10a-4ec1-b359-0d9a0727fea8"><div class="menu-item-text">高干政斗势均力敌)沉舟</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(现代网文)尸姐" data-id="0bc00f3c-2baa-4612-ac93-489f7c64d301"><div class="menu-item-text">现代网文)尸姐</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(意识流-美的阴暗)镜花水月" data-id="d7a320c7-8531-4100-b2fe-f0442461f209"><div class="menu-item-text">意识流-美的阴暗)镜花水月</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(浪客剑心)白梅" data-id="19be23a6-b120-42d5-9403-94d58b19ff9f"><div class="menu-item-text">浪客剑心)白梅</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️(灰色网文)屋里丝丝" data-id="c8d61f89-ceda-4433-9089-65b252009bb0"><div class="menu-item-text">灰色网文)屋里丝丝</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️鲁迅追忆散文" data-id="533a3126-4bf5-4da9-9a3b-0cd35bcc3b99"><div class="menu-item-text">鲁迅追忆散文</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀鲁迅讽刺小说" data-id="35f98e35-f58d-4825-a376-8b5baff3f7d7"><div class="menu-item-text">鲁迅讽刺小说</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀(古风市井)昭奚旧草2.0" data-id="2122008f-2e41-4988-81a5-ec24c067e3d4"><div class="menu-item-text">古风市井)昭奚旧草2.0</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀(武侠烟火)深山有鬼" data-id="6fd06881-ed91-483c-bc93-2467b6e1ab33"><div class="menu-item-text">武侠烟火)深山有鬼</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀(千禧年)致青春" data-id="edc133a9-b480-463e-aca0-033e07a121cc"><div class="menu-item-text">千禧年)致青春</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀古代权谋" data-id="46dc80f8-47a9-43fb-bcaf-5371a286f6e5"><div class="menu-item-text">古代权谋</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀(古代)文言文" data-id="16088975-7b15-4415-bf32-59b87f520e34"><div class="menu-item-text">古代)文言文</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️随笔" data-id="c8a574de-eb93-48d4-87c4-b0973d41d93d"><div class="menu-item-text">随笔</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀[古风]仙侠游剑录" data-id="7530ea83-1994-41f2-91d9-41a8fccaeb0a"><div class="menu-item-text">古风]仙侠游剑录</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀[凡人修真]谪仙游" data-id="77717220-b79d-4426-bb40-255453cdb3a2"><div class="menu-item-text">凡人修真]谪仙游</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀[玄幻-人/妖]话本奇缘" data-id="5148b951-00e1-40b5-90a8-2c6c70172e8b"><div class="menu-item-text">玄幻-人/妖]话本奇缘</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️[敏感/恋爱]忍冬" data-id="a2ed4a0c-8e56-49cd-b306-e7dd7d96ec4c"><div class="menu-item-text">[敏感/恋爱]忍冬</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️[现实童话]小王子" data-id="41e4cdd6-a471-44f6-8531-ecee3ffe3144"><div class="menu-item-text">[现实童话]小王子</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️[现实/童真]乙一" data-id="5d6b95ec-d42b-4f56-a4a2-140bad470b98"><div class="menu-item-text">[现实/童真]乙一</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="👻(现代灵异)盗墓笔记2.0" data-id="ab2553ed-3bdb-4982-8b3c-c06a8250a48a"><div class="menu-item-text">现代灵异)盗墓笔记2.0</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="👻(现代恐)盗墓笔记1.0" data-id="db6865c0-ce4f-4253-abce-a15fcf824cca"><div class="menu-item-text">现代恐)盗墓笔记1.0</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>文风@小白狗</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="♦️港风浪漫2.0" data-id="ac11e056-7a07-4ada-b643-ee333f3950ed"><div class="menu-item-text">港风浪漫2.0</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️女性向黄油" data-id="bb2c97cd-9de0-4dce-a70e-79193b1afdd1"><div class="menu-item-text">女性向黄油</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️群像多人" data-id="dbd1a91a-381a-4ef2-a126-51f8aeea3edf"><div class="menu-item-text">群像多人</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️日式文艺轻小说" data-id="70a13310-fd04-48ed-9d99-6a44488022b3"><div class="menu-item-text">日式文艺轻小说</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️温暖白描" data-id="485b28bb-e185-4eb8-ba5c-b947f1d16fc1"><div class="menu-item-text">温暖白描</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️背德禁忌" data-id="841f5625-364d-44c0-be6c-5c8f06140b04"><div class="menu-item-text">背德禁忌</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️拉扯" data-id="901a4852-ff48-4f57-bacb-2a0135768c76"><div class="menu-item-text">拉扯</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬纯情可爱笨蛋" data-id="1abc2926-865c-4c87-8660-4979d7340846"><div class="menu-item-text">纯情可爱笨蛋</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬(乙女向)她" data-id="81c1b108-c652-404e-9b5e-ca8db42a1fb8"><div class="menu-item-text">乙女向)她</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬(恋爱轻喜剧)欢喜冤家" data-id="8d188006-78bc-400a-bc99-ee002788f28d"><div class="menu-item-text">恋爱轻喜剧)欢喜冤家</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️浪漫文风2.0" data-id="499e518e-2065-47b3-b279-3d95c08a1797"><div class="menu-item-text">浪漫文风2.0</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️中国官场高干特化" data-id="795dafc3-4943-43c8-9801-e4b299da37e9"><div class="menu-item-text">中国官场高干特化</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️至亲至疏" data-id="76fa776b-4acd-4130-8775-8199481d5ff1"><div class="menu-item-text">至亲至疏</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌀明清章回体类红楼梦" data-id="9ad12395-5f6b-4713-9db0-3bdfa6744627"><div class="menu-item-text">明清章回体类红楼梦</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>Yukino文风</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="❄️(沈从文)京派抒情散文小说" data-id="e7838209-06dc-4a80-a950-64f978343aaf"><div class="menu-item-text">沈从文)京派抒情散文小说</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️颓废派唯美主义" data-id="09f8df55-9959-4d2a-b06f-35951deb3c7e"><div class="menu-item-text">颓废派唯美主义</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️心理现实同性文学" data-id="2fd54dd3-bb36-4b79-9612-f5bc6f76b538"><div class="menu-item-text">心理现实同性文学</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬英式浪漫轻喜剧" data-id="1bb9301d-903a-4fbd-a74d-772e8360d3c0"><div class="menu-item-text">英式浪漫轻喜剧</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>文风@陆子慕</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="♦️↓这两搭配好吃|日式轻小说" data-id="171b6383-8670-4d0e-8254-8fd916fffd56"><div class="menu-item-text">这两搭配好吃|日式轻小说</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️↑这两搭配好吃|盛夏少年" data-id="a57f8ebe-d52a-4af6-8e20-04219b03a47b"><div class="menu-item-text">这两搭配好吃|盛夏少年</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬日式纯爱" data-id="665e915e-8071-4a69-ba40-9efd7084ef06"><div class="menu-item-text">日式纯爱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬中式纯爱" data-id="b6de74d9-938c-48ae-82db-bfba39d937ca"><div class="menu-item-text">中式纯爱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍬极尽暧昧" data-id="8baefdd9-c5a0-4060-ac1e-c938c537f54c"><div class="menu-item-text">极尽暧昧</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️情天恨海" data-id="6bb43be0-6aa0-4f72-8524-882086c675ed"><div class="menu-item-text">情天恨海</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️一地余烬" data-id="46d7ff4f-030e-4287-994d-a9edbfe2ea43"><div class="menu-item-text">一地余烬</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️烂人真心" data-id="44dde97a-2d52-4fdf-95ca-e26ce9b6f8ad"><div class="menu-item-text">烂人真心</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️无疾而终" data-id="71bc5952-8c5c-4cd8-867d-9a0d3726ea21"><div class="menu-item-text">无疾而终</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️权力本质" data-id="3e1d3070-7809-4748-a3c0-f248465d9dd1"><div class="menu-item-text">权力本质</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️圣人私心" data-id="a27a1dd7-2bf3-4578-97d3-f76d173b958b"><div class="menu-item-text">圣人私心</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️纸醉金迷" data-id="4ba891f5-685f-4346-8a91-cb44606e98ba"><div class="menu-item-text">纸醉金迷</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️血墨惊情" data-id="6909a9c4-2033-468c-885c-696302628875"><div class="menu-item-text">血墨惊情</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️深宫红墙" data-id="c1d0707e-e810-4c83-8a7d-393b7cd376ff"><div class="menu-item-text">深宫红墙</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️时代哀歌" data-id="088ebf1b-8f8f-49c0-9562-c1ba32f7654b"><div class="menu-item-text">时代哀歌</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️城镇文学" data-id="acf4fb64-8854-4ef2-8908-18fc2fa03b39"><div class="menu-item-text">城镇文学</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️琼瑶经典" data-id="94abcf1a-b7f7-4ac1-84a5-21b4b0781f19"><div class="menu-item-text">琼瑶经典</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️俄式哲学" data-id="2bdc07b8-1f9c-4935-99d2-7ba7670cea5f"><div class="menu-item-text">俄式哲学</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️德式理性" data-id="b9bb76f3-6e81-4b8b-821b-99ef11742a1d"><div class="menu-item-text">德式理性</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️美式老钱" data-id="9b3d07cf-49c5-4176-b618-a286bcfbfde0"><div class="menu-item-text">美式老钱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️百年孤独" data-id="15909fe7-0ccc-450c-9f33-22c3c2559efe"><div class="menu-item-text">百年孤独</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️雪国侘寂" data-id="91450ddf-e75a-4c05-909d-8a6a45748b7a"><div class="menu-item-text">雪国侘寂</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️言叶之庭" data-id="b03a9298-84cf-4dbf-97bd-c4566b37480f"><div class="menu-item-text">言叶之庭</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❄️夜雨声烦" data-id="9287d258-de0f-447e-80ec-1454d0148f0d"><div class="menu-item-text">夜雨声烦</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>NSFW文风@陆子慕</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 意识流情色" data-id="24c4a4ef-6552-49af-abce-ba74c9925504"><div class="menu-item-text">意识流情色</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 激烈性爱" data-id="45bf03a9-0e7f-4c01-983c-e6c7e29ccd67"><div class="menu-item-text">激烈性爱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 粗口性爱" data-id="ca0d5a93-e998-41d3-a69e-7ff0d4dd9370"><div class="menu-item-text">粗口性爱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 温柔诱导" data-id="51d9ccdd-1ecf-45fb-94a9-9348b19d2b1b"><div class="menu-item-text">温柔诱导</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 激情做恨" data-id="3231cb1a-d428-4f27-9233-f474da1783ce"><div class="menu-item-text">激情做恨</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 糙汉宠文" data-id="6edb4d68-95d7-4196-b226-b0ff51a01321"><div class="menu-item-text">糙汉宠文</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎以下犯上" data-id="6f5a397f-a5fc-446c-80b6-3bf6b1f7cb35"><div class="menu-item-text">以下犯上</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎沉默猛干" data-id="916d0571-c525-466a-94b0-16f524d2829c"><div class="menu-item-text">沉默猛干</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎床上挑衅" data-id="b9b830fe-2b20-4394-abdc-e4d118260e04"><div class="menu-item-text">床上挑衅</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ BDSM 冷酷掌控" data-id="258dafb2-f189-42f9-9a22-6cdd861d0948"><div class="menu-item-text">BDSM 冷酷掌控</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 极简训犬" data-id="d39af1d8-32bf-40cd-b47d-7af3842d6f80"><div class="menu-item-text">极简训犬</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 24/7宠物" data-id="eb4285d1-39eb-4ed8-be26-0be8adfeaa9d"><div class="menu-item-text">24/7宠物</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 斯文败类" data-id="34270d1b-aa4e-4614-a98b-a2d487ccdd22"><div class="menu-item-text">斯文败类</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 病态圈养" data-id="fa5e128e-ccfd-40ce-a093-3eb8b216f3a8"><div class="menu-item-text">病态圈养</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 病态依恋" data-id="ac9a7651-d854-4427-b302-d2bfb5fcb264"><div class="menu-item-text">病态依恋</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♥︎ 虔诚朝圣" data-id="17176439-99ea-4434-83d7-060383a20ecb"><div class="menu-item-text">虔诚朝圣</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>自定义文风</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🌨️文风留给你缝#1" data-id="81ac8a58-2ee1-41d6-b2dd-dc4dc3a7194d"><div class="menu-item-text">文风留给你缝#1</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌨️文风留给你缝#2" data-id="c3bf07aa-8daf-4c5d-87ab-84e0ff7014d0"><div class="menu-item-text">文风留给你缝#2</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌨️文风留给你缝#3" data-id="adac134c-bcff-4bac-b150-2f1c81e50233"><div class="menu-item-text">文风留给你缝#3</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌨️文风留给你缝#4" data-id="8fd9b09c-d3d2-4ced-b719-0ffe83b0be78"><div class="menu-item-text">文风留给你缝#4</div><div class="toggle-led"></div></div></div></div></details></div></details>
    <details open><summary>NSFW</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔞↑NSFW一键开关🔞↑" data-id="43f2c0f5-2b2d-48d1-8acb-dc7a0a39bc6a"><div class="menu-item-text">NSFW一键开关</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♦️[走🚗开]NSFW判断推进" data-id="c85c7498-2c03-4362-a42f-27d580b79d7c"><div class="menu-item-text">强制走NSFW</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞防止发情@人间月下-海莉🔞" data-id="caeb7072-ecbc-41f8-9c44-bb8f8144adae" data-group="nsfw-suppress"><div class="menu-item-text">防止发情@人间月下-海莉🔞</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞基础规则" data-id="73201149-35f6-40f2-bf21-4ae3b4d10836"><div class="menu-item-text">基础规则</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞性爱词汇@kkm" data-id="16578df1-bbc5-4b91-ad63-43e0afa0ef66"><div class="menu-item-text">性爱词汇@kkm</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞拒绝修罗场🔞" data-id="f1518297-09c4-4525-90bf-57f8cac22ed3"><div class="menu-item-text">拒绝修罗场</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞防过于尊重" data-id="8fea0443-3261-4b64-b97d-d14a6a7580d9"><div class="menu-item-text">防过于尊重</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💙麽u@村妹儿@村妹儿" data-id="afe37b3a-5425-4245-82cb-b00626fe4f7a"><div class="menu-item-text">麽u@村妹儿@村妹儿</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞去除刻板化@神出鬼没404" data-id="d632d197-d7f0-4394-8d56-5f4977553193"><div class="menu-item-text">去除刻板化@神出鬼没404</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="😚亲亲嘴@kkm" data-id="a054e69a-a003-4edb-b864-5c3eaa0b1f65"><div class="menu-item-text">亲亲嘴@kkm</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞射精描写@柑橘" data-id="80267a45-c682-47da-a6db-42e0d100eed0"><div class="menu-item-text">射精描写@柑橘</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔞(按需)BG-BL素股@kkm@村妹儿" data-id="908e1ac7-0109-4285-be74-d2d26cc61084"><div class="menu-item-text">按需)BG-BL素股@kkm@村妹儿</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️平等涩涩@顶呱呱" data-id="2a0269c0-ec24-4ffc-b65b-9c2cc1229e9b"><div class="menu-item-text">平等涩涩@顶呱呱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💙粗俗性爱@kkm" data-id="44497e10-9bd1-4c45-889d-3b61c30ed397"><div class="menu-item-text">粗俗性爱@kkm</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️背德/不平等@姜狸" data-id="e2bdb2a8-3da5-4521-a5c7-acf768fd2ea7"><div class="menu-item-text">背德/不平等@姜狸</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔞Dirt talk蜜语@村妹儿" data-id="8f1bd137-1f5c-4d99-b74a-98b3f14bc1e1"><div class="menu-item-text">Dirt talk蜜语@村妹儿</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔞淫水刻画(女)@神出鬼没404" data-id="15f9bd3f-6113-4172-9fa6-2d019dad8e48"><div class="menu-item-text">淫水刻画(女)@神出鬼没404</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="💜(按需)淫水刻画(双性)@神出鬼没404" data-id="4b97f561-261d-4494-a7c6-1b62303d67d6"><div class="menu-item-text">按需)淫水刻画(双性)@神出鬼没404</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞多角色@makamaka" data-id="5d2b0492-3768-4157-abb9-86397118ec3a"><div class="menu-item-text">多角色@makamaka</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔞NSFW描写规范@kkm@村妹" data-id="bc77e729-01cd-4358-b435-2cfbe1c23709"><div class="menu-item-text">NSFW描写规范@kkm@村妹</div><div class="toggle-led"></div></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞防夸大/重喘息@人间月下" data-id="14a7b0c1-60f7-4144-bd2c-352ef484c474"><div class="menu-item-text">防夸大/重喘息</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞聚焦男喘@人间月下" data-id="cd04bbfb-9487-4ef8-b984-0d3e89b42045"><div class="menu-item-text">聚焦男喘</div><div class="toggle-led"></div></div><details class="nested-details"><summary>NSFW玩法</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="❤️性爱玩法@琉璃" data-id="5885d2be-1c87-4506-97ad-3179d6d7f661"><div class="menu-item-text">性爱玩法@琉璃</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞爱抚@神出鬼没404" data-id="9de31d39-0486-4e26-961a-3c1a7a8e3d51"><div class="menu-item-text">爱抚@神出鬼没404</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)女u通用Play@久伊" data-id="3ac84212-0653-4617-be8e-b09b9f9d6338"><div class="menu-item-text">按需)女u通用Play@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️随机玩法生成器@𝑣𝑖𝑜𝑙𝑒𝑡𝟙𝟡𝟞" data-id="12aa0943-f034-44e5-8a9d-c5b3ebf4b490"><div class="menu-item-text">随机玩法生成器</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞情趣衣玩法@听安" data-id="a00370f3-0108-4f0a-8452-abad70d4e42c"><div class="menu-item-text">情趣衣玩法@听安</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)道具Play@久伊" data-id="65bdaaa9-79a1-44b3-afc9-4f2bb65759d6"><div class="menu-item-text">(按需)道具Play@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)公开play@久伊" data-id="29a95af4-11cc-48de-91ea-f035e28d1f12"><div class="menu-item-text">(按需)公开play@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)其他play@久伊 副本" data-id="a4ae4fc9-7d47-4a4d-a2ac-3f9f5f271b09"><div class="menu-item-text">(按需)其他play@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️乳交玩法@春情" data-id="0a4e15b7-40ed-4260-834c-e06b70558e10"><div class="menu-item-text">乳交玩法@春情</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="❤️憋尿玩法@春情 副本" data-id="e5364f02-c6f8-4494-b419-a3463cd882d3"><div class="menu-item-text">憋尿玩法@春情</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>特化</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)体型差@久伊" data-id="0b8b590e-57db-416e-999f-89add143c818"><div class="menu-item-text">按需)体型差@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)熟女特化@久伊" data-id="3ea350ce-4107-46d9-b280-bf548162a135"><div class="menu-item-text">按需)熟女特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)孕期特化@久伊" data-id="3aa26b1b-ed87-4cfd-8ea2-22c3e6f86c2d"><div class="menu-item-text">按需)孕期特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)c是男妈妈🍼@久伊" data-id="44f10d57-a3a4-44a0-8d02-4b9deb3f1eeb"><div class="menu-item-text">按需)c是男妈妈🍼@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)小女孩特化@久伊" data-id="9e8895c4-533b-4ff3-b55c-e641f612de58"><div class="menu-item-text">按需)小女孩特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔞(按需)青少女特化@久伊" data-id="ab1c0395-21b9-4bd5-a7d8-0ee7ef9eeab7"><div class="menu-item-text">按需)青少女特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💜(按需)双性男特化@久伊" data-id="c4018614-f345-4b79-a379-4a5f27ae34bb"><div class="menu-item-text">按需)双性男特化@久伊</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>BL</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="💛BL涩涩@kkm@natami@吱吱" data-id="e4ca443b-6d6d-48f3-b555-d75bbe72dbee"><div class="menu-item-text">BL涩涩@kkm@natami@吱吱</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💛(按需)小男孩特化@久伊" data-id="04dc82a8-fe25-4548-ad8e-c39c6f002d4a"><div class="menu-item-text">按需)小男孩特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💛(按需)u纤细男特化@久伊" data-id="075abfc8-b1d1-448b-b467-6ead207f17fd"><div class="menu-item-text">按需)u纤细男特化@久伊</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="💛(按需)u壮男受特化@久伊" data-id="3b13929c-817f-4c41-a36c-d89aeb1d6a03"><div class="menu-item-text">按需)u壮男受特化@久伊</div><div class="toggle-led"></div></div></div></div></details></div></details>
    <details open><summary>正文规定</summary><div class="details-content"><details class="nested-details"><summary>格式控制</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="✏️(自改)字数规定✏️" data-id="cc032a46-bfe2-4e11-9580-5e27b2051269"><div class="menu-item-text">自改)字数规定✏️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✏️长段落" data-id="e98cdf80-9736-4542-81cb-f80586a028f5"><div class="menu-item-text">长段落</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✏️短段落" data-id="5bc03f49-b50d-4bb6-904e-59f21b08ac25"><div class="menu-item-text">短段落</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✏️长短交替" data-id="1fbef23f-2604-45b4-8717-82a1f1fc54af"><div class="menu-item-text">长短交替</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✏️(自改)对话增加" data-id="fca3d679-6618-475d-b857-fd8c20cac779"><div class="menu-item-text">自改)对话增加</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✏️内心独白包裹" data-id="4bc52c9e-5ed8-49c1-88a9-5220515e16ae"><div class="menu-item-text">内心独白包裹</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="✏️(开这个关上面的)线上模式@kkm✏️" data-id="c2061f70-669b-4423-bf2c-09347bf3edbc"><div class="menu-item-text">开这个关上面的)线上模式@kkm✏️</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>彩蛋</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="⭐[二选一]批注彩蛋" data-id="532e6e78-8ff0-4a21-8567-17305b93bbd6"><div class="menu-item-text">二选一]批注彩蛋</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="⭐[二选一]艺术字@KKM" data-id="ba9aab04-a30d-4746-a4df-eea1235ef9c0"><div class="menu-item-text">二选一]艺术字@KKM</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>双语翻译</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🆕角色母语翻译" data-id="97496817-07b1-4887-928a-a76d243be770"><div class="menu-item-text">角色母语翻译</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🆕user母语翻译" data-id="1db8340d-6f03-4d51-b46f-18e545f24cdf"><div class="menu-item-text">user母语翻译</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>抢话扩写</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="♾️抢话扩写♾️" data-id="a1a04757-b085-4a62-b1a9-447912a8c84b"><div class="menu-item-text">抢话扩写♾️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♾️抢话不扩写♾️" data-id="4dada6b8-5fd1-4b65-baf5-5c31b7fc80e9"><div class="menu-item-text">抢话不扩写♾️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♾️不抢话不扩写♾️" data-id="3b98ed41-164e-41d1-bda2-c7c202e99f9d"><div class="menu-item-text">不抢话不扩写♾️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="♾️不复述♾️" data-id="55d2b987-19b1-43c6-8a14-f5af478f79e9"><div class="menu-item-text">不复述♾️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌐[不抢话别开]多线视角" data-id="4c244a6a-1c18-4664-b19c-bf941674ac2b"><div class="menu-item-text">不抢话别开]多线视角</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>人称视角</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="📶user第一人称📶" data-id="46a85a94-8b60-46b6-8a0b-9a73ac61fd52"><div class="menu-item-text">user第一人称📶</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="📶user第二人称📶" data-id="0d4b21f5-5847-4de5-8bc3-1e4486c0e720"><div class="menu-item-text">user第二人称📶</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="📶char第二人称📶" data-id="f2590da7-e64b-48a9-b194-4c8bf2115f84"><div class="menu-item-text">char第二人称📶</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🎦第三人称🎦" data-id="9baba8a0-bb60-45d1-9843-f966ee87fa81"><div class="menu-item-text">第三人称🎦</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔧防人称主语过多" data-id="f89f182c-9f5e-4185-a0a4-c828547830d3"><div class="menu-item-text">防人称主语过多</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>节奏控制</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔧缓慢" data-id="b3b8038a-cc6f-4aaf-9516-0ee79dc241aa"><div class="menu-item-text">缓慢</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔧适中" data-id="2be718b2-7fd5-475a-b927-f7640658364f"><div class="menu-item-text">适中</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔧快速" data-id="16e6d2ad-7aba-4baa-8c10-8898f3f12444"><div class="menu-item-text">快速</div><div class="toggle-led"></div></div></div></div></details><details class="nested-details"><summary>结尾落点</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="✒️推进式落点" data-id="774e22f6-a171-4859-b9a6-8bf5ff4b2169"><div class="menu-item-text">推进式落点</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✒️即刻式落点" data-id="1dec0105-8bb5-41ad-b013-db1307b9a9e6"><div class="menu-item-text">即刻式落点</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="✒️具体式落点" data-id="c269846a-0ac1-49f8-ac12-63cded83fa1d"><div class="menu-item-text">具体式落点</div><div class="toggle-led"></div></div></div></div></details></div></details>
    <details open><summary>附加元素</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🍊带音乐的选项器-配合正则17" data-id="4ec44852-1343-49aa-a5d5-2f2ff02dfc2d" data-regex-names="MoM美化-[17]带音乐的喵喵选择器@jerry@柏柏" data-regex-id="a28a1e2e-f9b9-470d-8f90-9263b5551138"><div class="menu-item-text">带音乐的选项器-配合正则17</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🍊3选1喵喵选择器-日常（必须开选项正则）" data-id="14005420-96f0-40f5-a930-bff9179fd84e"><div class="menu-item-text">3选1喵喵选择器-日常（必须开选项正则）</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🍊3选1喵喵选择器-扮演user（必须开选项正则）" data-id="9883d45c-bad4-462d-a28e-c54a9273ec93"><div class="menu-item-text">3选1喵喵选择器-扮演user（必须开选项正则）</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌧️(选开)简易小说顶栏🌧️" data-id="e14147cb-1ba0-406e-9ca2-5e7ffc6bb381" data-regex-names="小说顶栏美化-冰块" data-regex-id="e647875d-679d-40aa-bd81-b8def22dd910"><div class="menu-item-text">选开)简易小说顶栏🌧️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌧️(选开)单人状态栏@小夜🌧️" data-id="f1956655-7eca-4452-b1ba-ec765daf0a10" data-regex-names="单人通用状态栏" data-regex-id="c2c3414f-df3b-44af-aef5-32e30e9a42fd"><div class="menu-item-text">选开)单人状态栏@小夜🌧️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🌧️(建议开)摘要@电波系🌧️" data-id="3095a013-690e-492b-bae5-23a35e9ebdb6" data-regex-names="摘要幽灵模式@电波系" data-regex-id="7331ad9e-377c-419b-8832-f7b6f3ed2ca5"><div class="menu-item-text">建议开)摘要@电波系🌧️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🌧️(建议开)角色表@YUKI🌧️" data-id="99aabe12-2795-441a-bee3-0c0c6405a9b2" data-regex-names="角色表美化@YUKI" data-regex-id="1adf6566-5278-430a-a09e-518e227aa30a"><div class="menu-item-text">建议开)角色表@YUKI🌧️</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🌧️3选1喵喵选择器-瑟瑟（必须开选项正则）" data-id="d7282889-9cc5-44c7-a37a-c5ca78d3a0d4"><div class="menu-item-text">3选1喵喵选择器-瑟瑟（必须开选项正则）</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="附加属性一键开关" data-id="914f2df6-e592-4977-b7ce-7f2cf49696a6"><div class="menu-item-text">附加属性一键开关</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>极光小剧场@电波系</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🍩文字剧场头部@人间月下↓🍩" data-id="46ab60aa-4ac8-49fd-92f3-2263bb236ee5"><div class="menu-item-text">文字剧场头部@人间月下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩交互剧场头部@电波系@KKM↓🍩" data-id="6307ac2f-bbdf-4d20-9c63-1ab301db48df"><div class="menu-item-text">交互剧场头部@电波系@KKM</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩盲盒小剧场🍩" data-id="10d65667-bd12-4e6a-8ba6-fa8bbff9a739"><div class="menu-item-text">盲盒小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩角色的日记🍩" data-id="b61eadb6-05b9-4f38-8230-14a0ee5107bd"><div class="menu-item-text">角色的日记🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩char的回忆小剧场🍩" data-id="721db597-c9df-486f-8dbf-1ea785a6328c"><div class="menu-item-text">char的回忆小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩弹幕🍩" data-id="53010d69-8e04-488a-96c5-66295ee54644"><div class="menu-item-text">弹幕🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩每日一裤衩🍩" data-id="7c109893-7ede-4c8c-aab8-0c0de789ff71"><div class="menu-item-text">每日一裤衩🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩系统小剧场🍩" data-id="dea7dafa-be76-4f4c-95ea-7d12f71a8080"><div class="menu-item-text">系统小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩模拟Ai小剧场🍩" data-id="548b3ed8-b114-47eb-b5d7-918f5f5601ce"><div class="menu-item-text">模拟Ai小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩监控小剧场🍩" data-id="b39ec96d-fc18-4615-a24b-b31eb211cc88"><div class="menu-item-text">监控小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩换装小剧场🍩" data-id="52f08438-4dd8-4c00-8aa5-9b2949b1209d"><div class="menu-item-text">换装小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩涩涩小剧场🍩" data-id="fec48744-d44e-4cbc-bbef-9ef1bf037db4"><div class="menu-item-text">涩涩小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩贴贴纸小剧场🍩" data-id="f6c717ec-5b53-4aa3-8373-9f722cc8bd89"><div class="menu-item-text">贴贴纸小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩我咋了🍩" data-id="f2f368b2-58c8-4039-b580-f67496dd4ba1"><div class="menu-item-text">我咋了🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩剧本杀小剧场🍩" data-id="a2f34d3f-0471-4380-8aea-3902f1efb630"><div class="menu-item-text">剧本杀小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩恋爱灵感小剧场🍩" data-id="446bd25d-6a60-490c-b6d5-4fd1bfb75852"><div class="menu-item-text">恋爱灵感小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩当char被卡了🍩" data-id="43520f45-b61c-4a4c-ae96-af980cd89f00"><div class="menu-item-text">当char被卡了🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩逆转裁判小剧场🍩" data-id="01c5d33d-bc89-44c0-97eb-ff8f7bdb0396"><div class="menu-item-text">逆转裁判小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩社交论坛小剧场🍩" data-id="a1c4f099-779d-4157-b3f5-813a2c967d59"><div class="menu-item-text">社交论坛小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩模拟人生小剧场🍩" data-id="23c9c8b9-2fa9-45de-878c-90dc0463baeb"><div class="menu-item-text">模拟人生小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🍩情感电台小剧场🍩" data-id="e73f227d-b604-494c-8377-efac96a3bfe0"><div class="menu-item-text">情感电台小剧场🍩</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🍩极光小剧场@电波系↑🍩" data-id="cafde38b-cff8-4aa3-b1b4-ccafd595f59a"><div class="menu-item-text">极光小剧场@电波系↑🍩</div><div class="toggle-led"></div></div></div></div></details>

                </div>
                <div class="cat-list cat-list-1" data-cat="1" style="display:none;">
    <div class="grid-toggles col-1" style="padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:2px;"><div class="menu-item-toggle toggle-btn" id="${ID}-claude-all-on" data-group="claude-gemini-mutex" data-sync-group="claude-all"><div class="menu-item-text">⚡ 一键开启全部Claude</div><div class="toggle-led"></div></div></div><details open><summary>破限与释放</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔵小克破限(按需克4.8别开)@人间月下-海莉" data-id="0956180f-b292-4e6e-a8c7-f6812338fab4"><div class="menu-item-text">小克破限(按需克4.8别开)@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔵反道德光谱" data-id="a2a49518-7d3c-48de-87d2-ce796919241f"><div class="menu-item-text">反道德光谱</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>写作规范</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔵禁止长镜头补充包" data-id="ad54cb24-1995-43ac-aaff-f6a681c781e7"><div class="menu-item-text">禁止长镜头补充包</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>思维与自检</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔵克劳德自检草稿 改自@人间月下-海莉" data-id="17441f2f-0d3a-43f4-86e2-a77ed03b131f"><div class="menu-item-text">克劳德自检草稿 改自@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔵角色渣男/渣女ooc时开）暗黑森林" data-id="449877a9-d464-4562-a263-d28a2d5bbd8a"><div class="menu-item-text">角色渣男/渣女ooc时开）暗黑森林</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔵克推荐 Step 1.5 小克轻自由意志@feybe" data-id="0da57f41-dc6e-4f57-81c1-6ed2f63c4b32"><div class="menu-item-text">克推荐 Step 1.5 小克轻自由意志@feybe</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔵克版自由意志@feybe" data-id="84c4bc39-2435-4ac7-af72-860e42bd1059"><div class="menu-item-text">克版自由意志@feybe</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="💙小克开启思维链💙" data-id="91465da7-d4fd-4e8e-86c7-db98de4c9a9a"><div class="menu-item-text">小克开启思维链</div><div class="toggle-led"></div></div></div></div></details>

                </div>
                <div class="cat-list cat-list-2" data-cat="2" style="display:none;">
    <div class="grid-toggles col-1" style="padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:2px;"><div class="menu-item-toggle toggle-btn" id="${ID}-gemini-all-on" data-group="gemini-claude-mutex" data-sync-group="gemini-all"><div class="menu-item-text">⚡ 一键开启全部Gemini</div><div class="toggle-led"></div></div></div><details open><summary>哈基米破限</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔴防429@mk2_bear" data-id="61c5dabf-c028-4588-a243-83e3403ae029"><div class="menu-item-text">防429@mk2_bear</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴哈基米越狱@人间月下" data-id="eee9108c-1da7-495f-b7cf-346973296b0b"><div class="menu-item-text">哈基米越狱@人间月下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴哈基米底部越狱@人间月下" data-id="4e6b2ced-890b-46fb-a030-a773902a77e9"><div class="menu-item-text">哈基米底部越狱@人间月下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴哈基米防截断@果实KKM" data-id="7f764474-282b-401f-9765-ca794d6a8238"><div class="menu-item-text">哈基米防截断@果实KKM</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴哈基米卡cot" data-id="c8d921de-b2f0-4e1a-8226-ee4d1e686340"><div class="menu-item-text">哈基米卡cot</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴哈基米超强防截断@电波系" data-id="5dcb9682-d276-4093-b599-e305a239edf3"><div class="menu-item-text">哈基米超强防截断@电波系</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴防止截断哈基米@YU-小锁聿" data-id="61dd05b5-f310-4d84-8419-377214b8c4df"><div class="menu-item-text">防止截断哈基米@YU-小锁聿</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>情感指导</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔴友好@人间月下-海莉" data-id="c1160d81-e5e6-4e8b-a405-108dc17f3b75"><div class="menu-item-text">友好@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴防止超雄绝望@人间月下-海莉" data-id="15b6968a-a2a2-46e9-953c-4a13cf806e86"><div class="menu-item-text">防止超雄绝望[需要再开]</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴[测试]纯爱系统" data-id="b5890d19-f6ef-4880-84b1-71188652f982"><div class="menu-item-text">[测试]纯爱系统</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>自检</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="⚪️哈推荐 Step 1.5 轻自由意志@feybe" data-id="07832187-b2d4-4aa8-b135-9194ba17f70c"><div class="menu-item-text">哈推荐 Step 1.5 轻自由意志@feybe</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔴哈基米重文风自检 改自@人间月下" data-id="cc8ded6e-4eb9-4c49-b0ed-59ab8eb02e1a"><div class="menu-item-text">哈基米重文风自检 改自@人间月下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔴哈自由意志@feybe" data-id="8557e79e-6267-4cfc-a599-730eec400e10"><div class="menu-item-text">哈自由意志@feybe</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="❤️哈基米开启思维链❤️" data-id="252ec317-ca51-4bcc-bd3d-9b0e5e167a4e"><div class="menu-item-text">哈基米开启思维链</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn toggle-btn-wide" data-kw="🔴哈基米自检格式确认增强" data-id="8493af05-e821-4465-98ac-60861a30dc34"><div class="menu-item-text">哈基米自检格式确认增强</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>行为规范</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔴防照搬人设@人间月下" data-id="8c01ffc1-4839-48bb-aa8e-fd6e45822304"><div class="menu-item-text">防照搬人设@人间月下</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴防弱化u@人间月下-海莉" data-id="a7d5e545-a841-4b3f-8dc6-9f0061203035"><div class="menu-item-text">防弱化u@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴八股改自@人间月下-海莉" data-id="23a2bd10-918d-4133-ace0-5bb15aeacbc4"><div class="menu-item-text">八股改自@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴防阴谋论@人间月下-海莉" data-id="8f3fd14d-eace-4910-a748-b13a1be7b968"><div class="menu-item-text">防阴谋论@人间月下-海莉</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴减少反问" data-id="85a64d71-8741-40bd-967b-5b7cec3c3df8"><div class="menu-item-text">减少反问</div><div class="toggle-led"></div></div></div></div></details>
    <details open><summary>人物刻画</summary><div class="details-content"><div class="grid-toggles"><div class="menu-item-toggle toggle-btn" data-kw="🔴char没有胡茬/薄茧" data-id="88f13edf-e0fd-4e06-80ff-c13352a0c89e"><div class="menu-item-text">char没有胡茬/薄茧</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴不许给user取外号" data-id="e9890783-56ef-4a30-b29b-4ae967104b23"><div class="menu-item-text">不许给user取外号</div><div class="toggle-led"></div></div><div class="menu-item-toggle toggle-btn" data-kw="🔴防止夸张描写" data-id="ab161e33-aded-4b87-b5a5-5a69dc5ed29d"><div class="menu-item-text">防止夸张描写</div><div class="toggle-led"></div></div></div></div></details>

                </div>

            </div>

    </div>
            <div class="menu-foot">
              <span id="${ID}-edit-trigger" title="三连击进入编辑模式">小冰块V3.31</span>
              <span class="fox-link" id="${ID}-fox-btn">[ ɪᴄᴇ//ᴄᴜʙᴇ ]</span>
            </div>
          </div>
          <!-- 搜索添加条目模态框 -->
          <div id="${ID}-search-modal">
            <input type="text" id="${ID}-search-input" placeholder="搜索预设条目..." autocomplete="off">
            <div class="search-results" id="${ID}-search-results"></div>
            <button class="close-search" id="${ID}-search-close">取消</button>
          </div>
        </div>
      `;

        (pdoc.documentElement || pdoc.body).appendChild(root);

        // ── 基础交互 ──────────────────────────────────────────────
        const orb = pdoc.getElementById(`${ID}-orb`);
        const head = pdoc.getElementById(`${ID}-head`);
        const btnClose = pdoc.getElementById(`${ID}-close`);
        const menu = pdoc.getElementById(`${ID}-menu`);
        const shell = pdoc.getElementById(`${ID}-shell`);
        const foxBtn = pdoc.getElementById(`${ID}-fox-btn`);
        pwin.orbEditMode = false;
        let isOpen = false;

        if (foxBtn) {
          foxBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toastr.info("模块挂载成功，小冰块V3.31双适配版", "💬 ᴘʀɪsᴍ//ғᴏx");
          });
        }

        const menuTitle = pdoc.querySelector(`#${ID} .menu-title`);
        const modelSection = pdoc.getElementById(`${ID}-model-section`);

        // ── Tavern Helper 核心控制函数 ──
        function isPromptEnabled(li) {
          if (!li) return false;
          const id = li.getAttribute("data-pm-identifier");
          if (id && B) return B.isEnabled(id);
          return !li.classList.contains("completion_prompt_manager_prompt_disabled");
        }
            function getPmList() {
          let list = pdoc.querySelector("#completion_prompt_manager_list");
          if (list && list.isConnected) return list;
          const vueHost = pdoc.querySelector(".bai-bai-preset-vue-list-host");
          if (vueHost) {
            const inner2 = vueHost.querySelector("#completion_prompt_manager_list");
            if (inner2 && inner2.isConnected) return inner2;
            return vueHost;
          }
          return null;
        }
            function isPmPanelOpen() {
          return Boolean(getPmList());
        }
            function isPromptEnabledById(identifier) {
          if (B) return B.isEnabled(identifier);
          return false;
        }
            function clickToggle(li) {
          const identifier = li?.getAttribute?.("data-pm-identifier");
          if (identifier && B) {
            B.toggle(identifier);
            return;
          }
          // Fallback: DOM click (non-BaiBai mode)
          const candidates = Array.from(li.querySelectorAll(".prompt-manager-toggle-action, [data-action='toggle'], [role='switch'], input[type='checkbox'], .toggle, button"));
          const btn = candidates.find((el) => {
            const text = [el.className, el.getAttribute("aria-label"), el.getAttribute("title"), el.getAttribute("data-action")].join(" ");
            return !/(edit|delete|remove|inspect|copy)/i.test(text);
          });
          if (btn) {
            const MouseEvt = pwin.MouseEvent || MouseEvent;
            btn.dispatchEvent(new MouseEvt("mousedown", { bubbles: true, cancelable: true, view: pwin }));
            btn.dispatchEvent(new MouseEvt("mouseup", { bubbles: true, cancelable: true, view: pwin }));
            btn.click();
          }
        }
            function findPromptManager() {
          return _bridge?.st?.promptManager || null;
        }
            function findPromptOrderEntry(identifier) {
          const pm = findPromptManager();
          if (pm && typeof pm.getPromptOrderEntry === "function") {
            try {
              const entry = pm.getPromptOrderEntry(pm.activeCharacter, identifier);
              if (entry) return { entry: entry, pm: pm };
            } catch(_) {}
          }
          return null;
        }
            function directTogglePrompt(identifier) {
          if (B) return B.toggle(identifier);
          return false;
        }

        function buildIdNameMap() {
          const map = {};
          const list = getPmList() || pdoc;
          list.querySelectorAll("li[data-pm-identifier]").forEach((li) => {
            const id = li.getAttribute("data-pm-identifier");
            const name = li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
            if (id) map[id] = name;
          });
          if (Object.keys(map).length === 0) {
            pdoc.querySelectorAll("li[data-pm-identifier]").forEach((li) => {
              const id = li.getAttribute("data-pm-identifier");
              const name = li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
              if (id) map[id] = name;
            });
          }
          return map;
        }

            function findById(identifier) {
          if (!identifier) return [];
          const list = getPmList();
          if (list) {
            const found = Array.from(list.querySelectorAll('li[data-pm-identifier="' + identifier + '"]'));
            if (found.length > 0) return found;
          }
          return Array.from(pdoc.querySelectorAll('li[data-pm-identifier="' + identifier + '"]'));
        }

        function findByKeyword(keyword) {
          if (!keyword) return [];
          const scope = getPmList() || pdoc;
          const cleanKw = keyword.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
          return Array.from(scope.querySelectorAll("li[data-pm-identifier]")).filter((li) => {
            const name = li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
            const cleanName = name.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
            return name.trim() === keyword.trim() || cleanName === cleanKw || name.trim().includes(keyword.trim());
          });
        }

        function findPrompt(idOrName) {
          if (!idOrName) return [];
          let items = findById(idOrName);
          if (items.length > 0) return items;
          return findByKeyword(idOrName);
        }

        function findPromptByButton(btn) {
          const id = btn.getAttribute("data-id");
          const kw = btn.getAttribute("data-kw");
          const label = btn.querySelector(".menu-item-text")?.textContent?.trim();
          let items = findById(id);
          if (items.length > 0) return items;
          items = findByKeyword(kw);
          if (items.length > 0) return items;
          return findByKeyword(label);
        }

        function getNameById(identifier) {
          const li = findById(identifier)[0];
          if (!li) return null;
          return li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? null;
        }

        function resolveKey(btn) {
          return btn.getAttribute("data-id") || btn.getAttribute("data-kw");
        }

            function ensureOn(key) {
          if (B) { B.ensureOn(key); return; }
          const items = findPrompt(key);
          items.forEach((li) => { if (!isPromptEnabled(li)) clickToggle(li); });
        }
        function openEditModal(key) {
          const li = findPrompt(key)[0];
          if (li) {
            li.querySelector(".prompt-manager-edit-action").click();
          }
        }
            function ensureOff(key) {
          if (B) { B.ensureOff(key); return; }
          const items = findPrompt(key);
          items.forEach((li) => { if (isPromptEnabled(li)) clickToggle(li); });
        }

            function ensureButtonOn(btn) {
          const id = btn.getAttribute("data-id");
          const kw = btn.getAttribute("data-kw") || "";
          if (B) {
            if (id && B.ensureOn(id)) return true;
            if (kw && B.ensureOn(kw)) return true;
          }
          // DOM fallback
          let items = findPromptByButton(btn);
          if (items.length === 0) {
            const cleanKw = kw.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
            if (cleanKw) {
              const list = getPmList() || pdoc;
              items = Array.from(list.querySelectorAll("li[data-pm-identifier]")).filter((li) => {
                const name = (li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "");
                const cleanName = name.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
                return cleanName === cleanKw || name.trim() === kw.trim();
              });
            }
          }
          if (items.length === 0) return false;
          items.forEach((li) => { if (!isPromptEnabled(li)) clickToggle(li); });
          return true;
        }

            function ensureButtonOff(btn) {
          const id = btn.getAttribute("data-id");
          const kw = btn.getAttribute("data-kw") || "";
          if (B) {
            if (id && B.ensureOff(id)) return true;
            if (kw && B.ensureOff(kw)) return true;
          }
          // DOM fallback
          let items = findPromptByButton(btn);
          if (items.length === 0) {
            const cleanKw = kw.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
            if (cleanKw) {
              const list = getPmList() || pdoc;
              items = Array.from(list.querySelectorAll("li[data-pm-identifier]")).filter((li) => {
                const name = (li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "");
                const cleanName = name.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
                return cleanName === cleanKw || name.trim() === kw.trim();
              });
            }
          }
          if (items.length === 0) return false;
          items.forEach((li) => { if (isPromptEnabled(li)) clickToggle(li); });
          return true;
        }

            function isButtonKeyOn(btn) {
          const id = btn.getAttribute("data-id");
          const kw = btn.getAttribute("data-kw");
          if (id && B) return B.isKeyOn(id);
          if (kw && B) return B.isKeyOn(kw);
          const items = findPromptByButton(btn);
          return items.length > 0 && items.every((li) => isPromptEnabled(li));
        }

        function syncToggle(targetKey, state, options = {}) {
          syncButtonByKey(targetKey, state, options);
        }

            function isKeyOn(key) {
          if (B) return B.isKeyOn(key);
          const items = findPrompt(key);
          return items.length > 0 && items.every((li) => isPromptEnabled(li));
        }

        function splitKeys(value) {
          return String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }

        function findRegexItems(key) {
          const scope = pdoc.querySelector("#regex_container") || pdoc;
          const all = Array.from(scope.querySelectorAll(".regex-script-label"));
          const getName = (item) => item.querySelector(".regex_script_name")?.textContent?.trim() || "";
          // 容错归一化: 去掉空格/标点/符号/emoji, 只保留中英文与数字, 并转小写
          const norm = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
          const k = norm(key);
          if (!String(key || "").trim()) return [];
          // 1) 精确匹配 (DOM id 或 名称完全相同)
          let hits = all.filter((item) => item.id === key || getName(item) === key);
          if (hits.length) return hits;
          // 2) 归一化后相等 (忽略空格/标点/大小写/emoji)
          if (k) {
            hits = all.filter((item) => norm(item.id) === k || norm(getName(item)) === k);
            if (hits.length) return hits;
            // 3) 包含匹配 (名称含关键字, 或关键字含名称), 仅在唯一命中时生效, 避免误匹配别的正则
            hits = all.filter((item) => {
              const n = norm(getName(item));
              return n && (n.includes(k) || k.includes(n));
            });
            if (hits.length === 1) return hits;
          }
          return [];
        }

        function detectRegexType(item) {
          const host = item.closest("#saved_regex_scripts, #global_scripts_block, #saved_preset_scripts, #scoped_scripts_block, #saved_scoped_scripts, #character_regex_scripts, #saved_character_scripts");
          const id = host?.id || "";
          if (id.includes("preset")) return "preset";
          if (id.includes("scoped") || id.includes("character")) return "scoped";
          if (id.includes("global") || id === "saved_regex_scripts") return "global";
          const text = item.parentElement?.textContent || "";
          if (/预设/.test(text)) return "preset";
          if (/局部|角色/.test(text)) return "scoped";
          return "global";
        }

        function getRegexTypeLabel(type) {
          if (type === "preset") return "预设";
          if (type === "scoped") return "角色";
          return "全局";
        }

        function getRegexOptions() {
          const scope = pdoc.querySelector("#regex_container") || pdoc;
          return Array.from(scope.querySelectorAll(".regex-script-label"))
            .map((item) => {
              const id = item.id;
              const name = item.querySelector(".regex_script_name")?.textContent?.trim() || "";
              const input = item.querySelector("input.disable_regex");
              const enabled = !!input && !input.checked;
              const type = detectRegexType(item);
              return { id, name, enabled, type };
            })
            .filter((item) => item.id && item.name);
        }

        function loadRegexBindings() {
          try {
            return JSON.parse(localStorage.getItem("orbV6_regex_bindings") || "{}");
          } catch (_) {
            return {};
          }
        }

        function normalizeRegexBindingItem(item) {
          if (!item) return null;
          if (typeof item === "string") return { id: item, mode: "on" };
          if (typeof item === "object") {
            const id = item.id || item.key || item.name || "";
            const mode = item.mode === "off" || item.mode === "inverse" ? "off" : "on";
            return { id, mode };
          }
          return null;
        }

        function normalizeRegexBindings(bindings) {
          const normalized = {};
          Object.entries(bindings || {}).forEach(([key, value]) => {
            const items = Array.isArray(value) ? value : [];
            const next = items.map(normalizeRegexBindingItem).filter((item) => item?.id);
            if (next.length > 0) normalized[key] = next;
          });
          return normalized;
        }

        let REGEX_BINDINGS = normalizeRegexBindings({ ...cloneExportConfig(ORB_EXPORTED_CONFIG.regexBindings, {}), ...loadRegexBindings() });

        function saveRegexBindings() {
          localStorage.setItem("orbV6_regex_bindings", JSON.stringify(REGEX_BINDINGS));
        }

        function loadScriptBindings() {
          try {
            return JSON.parse(localStorage.getItem("orbV6_script_bindings") || "{}");
          } catch (_) {
            return {};
          }
        }

        function normalizeScriptBindingItem(item) {
          if (!item) return null;
          if (typeof item === "string") return { id: item, mode: "on" };
          if (typeof item === "object") {
            const id = item.id || item.key || item.name || "";
            const mode = item.mode === "off" ? "off" : "on";
            return { id, mode };
          }
          return null;
        }

        function normalizeScriptBindings(bindings) {
          const normalized = {};
          Object.entries(bindings || {}).forEach(([key, value]) => {
            const items = Array.isArray(value) ? value : [];
            const next = items.map(normalizeScriptBindingItem).filter((item) => item?.id);
            if (next.length > 0) normalized[key] = next;
          });
          return normalized;
        }

        let SCRIPT_BINDINGS = normalizeScriptBindings({ ...cloneExportConfig(ORB_EXPORTED_CONFIG.scriptBindings, {}), ...loadScriptBindings() });

        function saveScriptBindings() {
          localStorage.setItem("orbV6_script_bindings", JSON.stringify(SCRIPT_BINDINGS));
        }

        function getButtonBindingKey(btn) {
          return btn.getAttribute("data-id") || btn.getAttribute("data-kw") || btn.querySelector(".menu-item-text")?.textContent?.trim() || "";
        }

        function isRegexEnabled(key) {
          const item = findRegexItems(key)[0];
          const input = item?.querySelector("input.disable_regex");
          return !!input && !input.checked;
        }

        function setRegexEnabled(key, enabled) {
          const items = findRegexItems(key);
          if (items.length === 0) {
            console.warn("[orb] setRegexEnabled: 找不到正则", key);
            return;
          }
          items.forEach((item) => {
            const input = item.querySelector("input.disable_regex");
            if (!input) return;
            const currentlyEnabled = !input.checked;
            if (currentlyEnabled !== enabled) input.click();
          });
        }

        function getLinkedRegexBindings(btn) {
          const staticBindings = [
            ...splitKeys(btn.getAttribute("data-regex-ids")),
            ...splitKeys(btn.getAttribute("data-regex-id")),
            ...splitKeys(btn.getAttribute("data-regex-names")),
            ...splitKeys(btn.getAttribute("data-regex-name")),
          ].map((id) => ({ id, mode: "on" }));
          const bindingKey = getButtonBindingKey(btn);
          const savedBindings = bindingKey ? REGEX_BINDINGS[bindingKey] || [] : [];
          const map = new Map();
          [...staticBindings, ...savedBindings].map(normalizeRegexBindingItem).filter((item) => item?.id).forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        }

        function getLinkedRegexKeys(btn) {
          return getLinkedRegexBindings(btn).map((item) => item.id);
        }

        function syncLinkedRegex(btn, state) {
          getLinkedRegexBindings(btn).forEach((item) => setRegexEnabled(item.id, state ? item.mode === "on" : item.mode !== "on"));
        }

        function areLinkedRegexOn(btn) {
          return getLinkedRegexBindings(btn).length > 0;
        }

        function getSavedRegexBinding(btn) {
          const bindingKey = getButtonBindingKey(btn);
          return bindingKey ? (REGEX_BINDINGS[bindingKey] || []).map(normalizeRegexBindingItem).filter((item) => item?.id) : [];
        }

        function getScriptRoot() {
          return pdoc.querySelector("#tavern_helper") || Array.from(pdoc.querySelectorAll(".inline-drawer")).find((el) => /酒馆助手/.test(el.textContent || "")) || pdoc;
        }

        function detectScriptType(row) {
          const text = row.closest(".flex.rounded-md, .flex.flex-col, .inline-drawer")?.textContent || row.parentElement?.textContent || "";
          if (/角色脚本|角色可用|当前角色|局部脚本/.test(text)) return "scoped";
          if (/预设脚本|绑定到当前预设|当前预设/.test(text)) return "preset";
          if (/全局脚本|酒馆全局可用/.test(text)) return "global";
          return "global";
        }

        function getScriptTypeLabel(type) {
          if (type === "preset") return "预设";
          if (type === "scoped") return "角色";
          return "全局";
        }

        function getScriptOptions() {
          const rootEl = getScriptRoot();
          const rows = Array.from(rootEl.querySelectorAll(".rounded-\\[var\\(--radius-small\\)\\], .rounded-md, .flex.w-full.items-center.justify-between"));
          const options = [];
          const seen = new Set();
          rows.forEach((row) => {
            const titleEl = row.querySelector(".ml-0\\.5.w-0.grow.overflow-hidden, .ml-0\\.5, .grow.overflow-hidden");
            const toggleEl = row.querySelector(".cursor-pointer.enabled, .cursor-pointer:not(.menu_button)");
            const name = titleEl?.textContent?.replace(/^☰\s*/, "").trim() || "";
            if (!name || !toggleEl || /全局脚本|预设脚本|酒馆全局可用|绑定到当前预设/.test(name)) return;
            const id = name;
            if (seen.has(id)) return;
            seen.add(id);
            const enabled = toggleEl.classList.contains("enabled") && !titleEl.className.includes("opacity-50");
            const type = detectScriptType(row);
            options.push({ id, name, enabled, type });
          });
          return options;
        }

        function findScriptItems(key) {
          return getScriptOptions().filter((item) => item.id === key || item.name === key);
        }

        function findScriptToggle(key) {
          const rootEl = getScriptRoot();
          const rows = Array.from(rootEl.querySelectorAll(".rounded-\\[var\\(--radius-small\\)\\], .rounded-md, .flex.w-full.items-center.justify-between"));
          for (const row of rows) {
            const titleEl = row.querySelector(".ml-0\\.5.w-0.grow.overflow-hidden, .ml-0\\.5, .grow.overflow-hidden");
            const name = titleEl?.textContent?.replace(/^☰\s*/, "").trim() || "";
            if (name !== key) continue;
            return row.querySelector(".cursor-pointer.enabled, .cursor-pointer:not(.menu_button)");
          }
          return null;
        }

        function isScriptEnabled(key) {
          const item = findScriptItems(key)[0];
          return !!item && item.enabled;
        }

        function setScriptEnabled(key, enabled) {
          const toggle = findScriptToggle(key);
          if (!toggle) {
            console.warn("[orb] setScriptEnabled: 找不到脚本", key);
            return;
          }
          if (isScriptEnabled(key) !== enabled) toggle.click();
        }

        function getLinkedScriptBindings(btn) {
          const bindingKey = getButtonBindingKey(btn);
          const savedBindings = bindingKey ? SCRIPT_BINDINGS[bindingKey] || [] : [];
          const map = new Map();
          savedBindings.map(normalizeScriptBindingItem).filter((item) => item?.id).forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        }

        function syncLinkedScripts(btn, state) {
          getLinkedScriptBindings(btn).forEach((item) => setScriptEnabled(item.id, state ? item.mode === "on" : item.mode !== "on"));
        }

        function getSavedScriptBinding(btn) {
          const bindingKey = getButtonBindingKey(btn);
          return bindingKey ? (SCRIPT_BINDINGS[bindingKey] || []).map(normalizeScriptBindingItem).filter((item) => item?.id) : [];
        }

        function setSavedScriptBinding(btn, bindings) {
          const bindingKey = getButtonBindingKey(btn);
          if (!bindingKey) return;
          const map = new Map();
          bindings.map(normalizeScriptBindingItem).filter((item) => item?.id).forEach((item) => map.set(item.id, item));
          const uniqueBindings = Array.from(map.values());
          if (uniqueBindings.length > 0) SCRIPT_BINDINGS[bindingKey] = uniqueBindings;
          else delete SCRIPT_BINDINGS[bindingKey];
          saveScriptBindings();
        }

        function setSavedRegexBinding(btn, bindings) {
          const bindingKey = getButtonBindingKey(btn);
          if (!bindingKey) return;
          const map = new Map();
          bindings.map(normalizeRegexBindingItem).filter((item) => item?.id).forEach((item) => map.set(item.id, item));
          const uniqueBindings = Array.from(map.values());
          if (uniqueBindings.length > 0) REGEX_BINDINGS[bindingKey] = uniqueBindings;
          else delete REGEX_BINDINGS[bindingKey];
          saveRegexBindings();
        }

        function openRegexPicker(targetBtn) {
          const options = getRegexOptions();
          if (options.length === 0) {
            toastr.warning("请先打开正则面板，让正则列表渲染出来");
            return;
          }

          const selected = new Map(getSavedRegexBinding(targetBtn).map((item) => [item.id, item.mode]));
          let picker = pdoc.getElementById(`${ID}-regex-picker`);
          if (!picker) {
            picker = pdoc.createElement("div");
            picker.id = `${ID}-regex-picker`;
            picker.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 2147483647;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              font-family: 'Microsoft YaHei', sans-serif; color: white;
            `;
            pdoc.body.appendChild(picker);
          }

          picker.innerHTML = `
            <div style="background: rgba(30,30,30,0.95); padding: 20px; border-radius: 12px; border: 1px solid #e8b072; width: 90%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column;">
              <h4 style="margin: 0 0 10px 0; color: #e8b072; text-align: center;">绑定正则</h4>
              <div style="font-size: 11px; opacity: 0.75; margin-bottom: 8px; text-align: center;">实时读取当前正则列表，开启条目时应用所选开/关，关闭条目时自动恢复相反状态</div>
              <input type="text" id="${ID}-regex-picker-search" placeholder="搜索正则名称..." style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; margin-bottom: 10px;">
              <div id="${ID}-regex-picker-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; scrollbar-width: thin;"></div>
              <div style="display: flex; gap: 10px; margin-top: 15px; flex-shrink: 0;">
                <button id="${ID}-regex-picker-clear" style="flex:1; background: rgba(255,123,114,0.18); color: #ffb3ad; border: 1px solid rgba(255,123,114,0.35); padding: 8px; border-radius: 6px; cursor: pointer;">清空</button>
                <button id="${ID}-regex-picker-confirm" style="flex:2; background: rgba(232,176,114,0.45); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">保存绑定</button>
                <button id="${ID}-regex-picker-cancel" style="flex:1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
              </div>
            </div>
          `;
          picker.style.display = "flex";

          const listEl = pdoc.getElementById(`${ID}-regex-picker-list`);
          const searchEl = pdoc.getElementById(`${ID}-regex-picker-search`);

          function render(filter = "") {
            const q = filter.trim().toLowerCase();
            listEl.innerHTML = "";
            options
              .filter((item) => !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
              .sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
              .forEach((item) => {
                const checked = selected.has(item.id);
                const mode = selected.get(item.id) || "on";
                const row = pdoc.createElement("div");
                row.style.cssText = `
                  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
                  background: ${checked ? 'rgba(232,176,114,0.18)' : 'rgba(255,255,255,0.05)'};
                  border: 1px solid ${checked ? 'rgba(232,176,114,0.45)' : 'transparent'};
                  border-radius: 4px; cursor: pointer; font-size: 12px;
                `;
                row.innerHTML = `
                  <input type="checkbox" ${checked ? "checked" : ""} style="pointer-events: none;">
                  <span style="font-size:10px; color:#ffd6a5; border:1px solid rgba(232,176,114,0.35); border-radius:999px; padding:2px 4px;">${getRegexTypeLabel(item.type)}</span>
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.id}">${item.name}</span>
                  <span style="font-size:10px; opacity:0.65; color:${item.enabled ? '#7ee787' : '#ffb3ad'};">${item.enabled ? '开' : '关'}</span>
                  <button class="regex-mode-btn" data-id="${item.id}" style="font-size:10px; min-width:42px; padding:3px 5px; border-radius:5px; cursor:pointer; border:1px solid ${mode === 'off' ? 'rgba(255,123,114,0.55)' : 'rgba(126,231,135,0.45)'}; color:${mode === 'off' ? '#ffb3ad' : '#7ee787'}; background:rgba(255,255,255,0.06);">${mode === 'off' ? '关' : '开'}</button>
                `;
                row.addEventListener("click", (event) => {
                  const modeBtn = event.target.closest(".regex-mode-btn");
                  if (modeBtn) {
                    event.stopPropagation();
                    if (!selected.has(item.id)) selected.set(item.id, "on");
                    else selected.set(item.id, selected.get(item.id) === "off" ? "on" : "off");
                  } else if (selected.has(item.id)) selected.delete(item.id);
                  else selected.set(item.id, "on");
                  render(searchEl.value);
                });
                listEl.appendChild(row);
              });
          }

          render();
          searchEl.addEventListener("input", () => render(searchEl.value));
          pdoc.getElementById(`${ID}-regex-picker-cancel`).addEventListener("click", () => {
            picker.style.display = "none";
          });
          pdoc.getElementById(`${ID}-regex-picker-clear`).addEventListener("click", () => {
            selected.clear();
            render(searchEl.value);
          });
          pdoc.getElementById(`${ID}-regex-picker-confirm`).addEventListener("click", () => {
            setSavedRegexBinding(targetBtn, Array.from(selected.entries()).map(([id, mode]) => ({ id, mode })));
            picker.style.display = "none";
            initDetectState();
            refreshBindingBadges();
            requestAnimationFrame(refreshEditToolWrap);
            toastr.success("正则绑定已保存");
          });
          searchEl.focus();
        }

        function openScriptPicker(targetBtn) {
          const options = getScriptOptions();
          if (options.length === 0) {
            toastr.warning("请先打开酒馆助手的脚本页，让脚本列表渲染出来");
            return;
          }

          const selected = new Map(getSavedScriptBinding(targetBtn).map((item) => [item.id, item.mode]));
          let picker = pdoc.getElementById(`${ID}-script-picker`);
          if (!picker) {
            picker = pdoc.createElement("div");
            picker.id = `${ID}-script-picker`;
            picker.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 2147483647;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              font-family: 'Microsoft YaHei', sans-serif; color: white;
            `;
            pdoc.body.appendChild(picker);
          }

          picker.innerHTML = `
            <div style="background: rgba(30,30,30,0.95); padding: 20px; border-radius: 12px; border: 1px solid #60b9c8; width: 90%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column;">
              <h4 style="margin: 0 0 10px 0; color: #60b9c8; text-align: center;">绑定酒馆助手脚本</h4>
              <div style="font-size: 11px; opacity: 0.75; margin-bottom: 8px; text-align: center;">实时读取当前酒馆助手脚本列表，开启条目时应用所选开/关，关闭条目时自动恢复相反状态</div>
              <input type="text" id="${ID}-script-picker-search" placeholder="搜索脚本名称..." style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; margin-bottom: 10px;">
              <div id="${ID}-script-picker-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; scrollbar-width: thin;"></div>
              <div style="display: flex; gap: 10px; margin-top: 15px; flex-shrink: 0;">
                <button id="${ID}-script-picker-clear" style="flex:1; background: rgba(255,123,114,0.18); color: #ffb3ad; border: 1px solid rgba(255,123,114,0.35); padding: 8px; border-radius: 6px; cursor: pointer;">清空</button>
                <button id="${ID}-script-picker-confirm" style="flex:2; background: rgba(96,185,200,0.45); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">保存绑定</button>
                <button id="${ID}-script-picker-cancel" style="flex:1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
              </div>
            </div>
          `;
          picker.style.display = "flex";

          const listEl = pdoc.getElementById(`${ID}-script-picker-list`);
          const searchEl = pdoc.getElementById(`${ID}-script-picker-search`);

          function render(filter = "") {
            const q = filter.trim().toLowerCase();
            listEl.innerHTML = "";
            options
              .filter((item) => !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
              .sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)) || a.name.localeCompare(b.name))
              .forEach((item) => {
                const checked = selected.has(item.id);
                const mode = selected.get(item.id) || "on";
                const row = pdoc.createElement("div");
                row.style.cssText = `
                  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
                  background: ${checked ? 'rgba(96,185,200,0.18)' : 'rgba(255,255,255,0.05)'};
                  border: 1px solid ${checked ? 'rgba(96,185,200,0.45)' : 'transparent'};
                  border-radius: 4px; cursor: pointer; font-size: 12px;
                `;
                row.innerHTML = `
                  <input type="checkbox" ${checked ? "checked" : ""} style="pointer-events: none;">
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.id}">${item.name}</span>
                  <span style="font-size:10px; opacity:0.65; color:${item.enabled ? '#7ee787' : '#ffb3ad'};">${item.enabled ? '开' : '关'}</span>
                  <button class="script-mode-btn" data-id="${item.id}" style="font-size:10px; min-width:42px; padding:3px 5px; border-radius:5px; cursor:pointer; border:1px solid ${mode === 'off' ? 'rgba(255,123,114,0.55)' : 'rgba(126,231,135,0.45)'}; color:${mode === 'off' ? '#ffb3ad' : '#7ee787'}; background:rgba(255,255,255,0.06);">${mode === 'off' ? '关' : '开'}</button>
                `;
                row.addEventListener("click", (event) => {
                  const modeBtn = event.target.closest(".script-mode-btn");
                  if (modeBtn) {
                    event.stopPropagation();
                    if (!selected.has(item.id)) selected.set(item.id, "on");
                    else selected.set(item.id, selected.get(item.id) === "off" ? "on" : "off");
                  } else if (selected.has(item.id)) selected.delete(item.id);
                  else selected.set(item.id, "on");
                  render(searchEl.value);
                });
                listEl.appendChild(row);
              });
          }

          render();
          searchEl.addEventListener("input", () => render(searchEl.value));
          pdoc.getElementById(`${ID}-script-picker-cancel`).addEventListener("click", () => {
            picker.style.display = "none";
          });
          pdoc.getElementById(`${ID}-script-picker-clear`).addEventListener("click", () => {
            selected.clear();
            render(searchEl.value);
          });
          pdoc.getElementById(`${ID}-script-picker-confirm`).addEventListener("click", () => {
            setSavedScriptBinding(targetBtn, Array.from(selected.entries()).map(([id, mode]) => ({ id, mode })));
            picker.style.display = "none";
            refreshBindingBadges();
            requestAnimationFrame(refreshEditToolWrap);
            toastr.success("脚本绑定已保存");
          });
          searchEl.focus();
        }

        function openBindingPicker(targetBtn, initialTab = "regex") {
          const regexOptions = getRegexOptions();
          const scriptOptions = getScriptOptions();
          if (regexOptions.length === 0 && scriptOptions.length === 0) {
            toastr.warning("请先打开正则面板或酒馆助手脚本页，让列表渲染出来");
            return;
          }

          const selectedRegex = new Map(getSavedRegexBinding(targetBtn).map((item) => [item.id, item.mode]));
          const selectedScripts = new Map(getSavedScriptBinding(targetBtn).map((item) => [item.id, item.mode]));
          let activeTab = initialTab === "script" ? "script" : "regex";
          let picker = pdoc.getElementById(`${ID}-binding-picker`);
          if (!picker) {
            picker = pdoc.createElement("div");
            picker.id = `${ID}-binding-picker`;
            picker.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 2147483647;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              font-family: 'Microsoft YaHei', sans-serif; color: white;
            `;
            pdoc.body.appendChild(picker);
          }

          picker.innerHTML = `
            <div style="background: rgba(30,30,30,0.95); padding: 20px; border-radius: 12px; border: 1px solid #e8b072; width: 90%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column;">
              <h4 style="margin: 0 0 10px 0; color: #e8b072; text-align: center;">绑定正则 / 酒馆助手脚本</h4>
              <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button id="${ID}-binding-tab-regex" style="flex:1; padding:7px; border-radius:6px; cursor:pointer; border:1px solid rgba(232,176,114,0.45); color:white; background:rgba(232,176,114,0.28);">正则</button>
                <button id="${ID}-binding-tab-script" style="flex:1; padding:7px; border-radius:6px; cursor:pointer; border:1px solid rgba(96,185,200,0.45); color:white; background:rgba(96,185,200,0.12);">脚本</button>
              </div>
              <div id="${ID}-binding-tip" style="font-size: 11px; opacity: 0.75; margin-bottom: 8px; text-align: center;"></div>
              <input type="text" id="${ID}-binding-picker-search" placeholder="搜索名称..." style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; margin-bottom: 10px;">
              <div id="${ID}-binding-picker-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; scrollbar-width: thin;"></div>
              <div style="display: flex; gap: 10px; margin-top: 15px; flex-shrink: 0;">
                <button id="${ID}-binding-picker-clear" style="flex:1; background: rgba(255,123,114,0.18); color: #ffb3ad; border: 1px solid rgba(255,123,114,0.35); padding: 8px; border-radius: 6px; cursor: pointer;">清空本页</button>
                <button id="${ID}-binding-picker-confirm" style="flex:2; background: rgba(232,176,114,0.45); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">保存绑定</button>
                <button id="${ID}-binding-picker-cancel" style="flex:1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
              </div>
            </div>
          `;
          picker.style.display = "flex";

          const listEl = pdoc.getElementById(`${ID}-binding-picker-list`);
          const searchEl = pdoc.getElementById(`${ID}-binding-picker-search`);
          const tipEl = pdoc.getElementById(`${ID}-binding-tip`);
          const regexTab = pdoc.getElementById(`${ID}-binding-tab-regex`);
          const scriptTab = pdoc.getElementById(`${ID}-binding-tab-script`);

          function render(filter = "") {
            const isRegex = activeTab === "regex";
            const options = isRegex ? regexOptions : scriptOptions;
            const selected = isRegex ? selectedRegex : selectedScripts;
            const color = isRegex ? "232,176,114" : "96,185,200";
            const getTypeLabel = isRegex ? getRegexTypeLabel : getScriptTypeLabel;
            const q = filter.trim().toLowerCase();
            regexTab.style.background = isRegex ? "rgba(232,176,114,0.32)" : "rgba(255,255,255,0.06)";
            scriptTab.style.background = !isRegex ? "rgba(96,185,200,0.32)" : "rgba(255,255,255,0.06)";
            tipEl.textContent = isRegex ? "实时读取当前正则列表，按全局/预设/角色区分" : "实时读取当前酒馆助手脚本列表，能识别到的脚本按全局/预设/角色区分";
            listEl.innerHTML = "";
            if (options.length === 0) {
              listEl.innerHTML = `<div style="padding:10px; text-align:center; opacity:0.7; font-size:12px;">${isRegex ? "请先打开正则面板，让正则列表渲染出来" : "请先打开酒馆助手脚本页，让脚本列表渲染出来"}</div>`;
              return;
            }
            options
              .filter((item) => !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
              .sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)) || (a.type || "").localeCompare(b.type || "") || a.name.localeCompare(b.name))
              .forEach((item) => {
                const checked = selected.has(item.id);
                const mode = selected.get(item.id) || "on";
                const row = pdoc.createElement("div");
                row.style.cssText = `
                  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
                  background: ${checked ? `rgba(${color},0.18)` : 'rgba(255,255,255,0.05)'};
                  border: 1px solid ${checked ? `rgba(${color},0.45)` : 'transparent'};
                  border-radius: 4px; cursor: pointer; font-size: 12px;
                `;
                row.innerHTML = `
                  <input type="checkbox" ${checked ? "checked" : ""} style="pointer-events: none;">
                  <span style="font-size:10px; color:${isRegex ? '#ffd6a5' : '#bde7ff'}; border:1px solid rgba(${color},0.35); border-radius:999px; padding:2px 4px;">${getTypeLabel(item.type)}</span>
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.id}">${item.name}</span>
                  <span style="font-size:10px; opacity:0.65; color:${item.enabled ? '#7ee787' : '#ffb3ad'};">${item.enabled ? '开' : '关'}</span>
                  <button class="binding-mode-btn" style="font-size:10px; min-width:42px; padding:3px 5px; border-radius:5px; cursor:pointer; border:1px solid ${mode === 'off' ? 'rgba(255,123,114,0.55)' : 'rgba(126,231,135,0.45)'}; color:${mode === 'off' ? '#ffb3ad' : '#7ee787'}; background:rgba(255,255,255,0.06);">${mode === 'off' ? '关' : '开'}</button>
                `;
                row.addEventListener("click", (event) => {
                  const modeBtn = event.target.closest(".binding-mode-btn");
                  if (modeBtn) {
                    event.stopPropagation();
                    if (!selected.has(item.id)) selected.set(item.id, "on");
                    else selected.set(item.id, selected.get(item.id) === "off" ? "on" : "off");
                  } else if (selected.has(item.id)) selected.delete(item.id);
                  else selected.set(item.id, "on");
                  render(searchEl.value);
                });
                listEl.appendChild(row);
              });
          }

          regexTab.addEventListener("click", () => {
            activeTab = "regex";
            render(searchEl.value);
          });
          scriptTab.addEventListener("click", () => {
            activeTab = "script";
            render(searchEl.value);
          });
          searchEl.addEventListener("input", () => render(searchEl.value));
          pdoc.getElementById(`${ID}-binding-picker-cancel`).addEventListener("click", () => {
            picker.style.display = "none";
          });
          pdoc.getElementById(`${ID}-binding-picker-clear`).addEventListener("click", () => {
            if (activeTab === "regex") selectedRegex.clear();
            else selectedScripts.clear();
            render(searchEl.value);
          });
          pdoc.getElementById(`${ID}-binding-picker-confirm`).addEventListener("click", () => {
            setSavedRegexBinding(targetBtn, Array.from(selectedRegex.entries()).map(([id, mode]) => ({ id, mode })));
            setSavedScriptBinding(targetBtn, Array.from(selectedScripts.entries()).map(([id, mode]) => ({ id, mode })));
            picker.style.display = "none";
            initDetectState();
            refreshBindingBadges();
            requestAnimationFrame(refreshEditToolWrap);
            toastr.success("绑定已保存");
          });
          render();
          searchEl.focus();
        }

        function createLayoutSubgroup(col = "2") {
          const subgroup = pdoc.createElement("div");
          subgroup.className = "layout-subgroup";
          subgroup.innerHTML = `<div class="layout-subgroup-tools"><span class="subgroup-label">小分组</span><span class="subgroup-actions"><span class="drag-handle-subgroup" draggable="true" title="拖动排序小分组" style="cursor:move; font-size:12px; opacity:0.7; user-select:none;">↕</span><button class="edit-btn sub-col-set" data-col="1">1列</button><button class="edit-btn sub-col-set" data-col="2">2列</button><button class="edit-btn sub-col-set" data-col="3">3列</button><button class="edit-btn move-existing-item">移入已有</button><button class="edit-btn add-sub-item">➕ 条目</button><button class="edit-btn del-subgroup del">×</button></span></div><div class="grid-toggles col-${col}"></div>`;
          return subgroup;
        }

        function ensureLayoutSubgroupTools() {
          pdoc.querySelectorAll(`#${ID} .layout-subgroup`).forEach((subgroup) => {
            let tools = subgroup.querySelector(":scope > .layout-subgroup-tools");
            if (!tools) {
              tools = pdoc.createElement("div");
              tools.className = "layout-subgroup-tools";
              tools.innerHTML = `<span class="subgroup-label">小分组</span><span class="subgroup-actions"><span class="drag-handle-subgroup" draggable="true" title="拖动排序小分组" style="cursor:move; font-size:12px; opacity:0.7; user-select:none;">↕</span><button class="edit-btn sub-col-set" data-col="1">1列</button><button class="edit-btn sub-col-set" data-col="2">2列</button><button class="edit-btn sub-col-set" data-col="3">3列</button><button class="edit-btn move-existing-item">移入已有</button><button class="edit-btn add-sub-item">➕ 条目</button><button class="edit-btn del-subgroup del">×</button></span>`;
              subgroup.insertBefore(tools, subgroup.firstChild);
            } else if (!tools.querySelector(".move-existing-item")) {
              tools.querySelector(".add-sub-item")?.insertAdjacentHTML("beforebegin", `<button class="edit-btn move-existing-item">移入已有</button>`);
            }
            if (!tools.querySelector(".drag-handle-subgroup")) {
              const actions = tools.querySelector(".subgroup-actions");
              if (actions) actions.insertAdjacentHTML("afterbegin", `<span class="drag-handle-subgroup" draggable="true" title="拖动排序小分组" style="cursor:move; font-size:12px; opacity:0.7; user-select:none;">↕</span>`);
            }
            if (!subgroup.querySelector(":scope > .grid-toggles")) {
              const grid = pdoc.createElement("div");
              grid.className = "grid-toggles col-2";
              subgroup.appendChild(grid);
            }
          });
        }

        function openMoveExistingPicker(subgroup) {
          const targetGrid = subgroup?.querySelector(":scope > .grid-toggles");
          const detailsContent = subgroup?.closest(".details-content");
          if (!targetGrid || !detailsContent) return;
          const candidates = Array.from(detailsContent.querySelectorAll(":scope > .grid-toggles > .toggle-btn, :scope > .layout-subgroup > .grid-toggles > .toggle-btn")).filter((btn) => !targetGrid.contains(btn));
          if (candidates.length === 0) {
            toastr.warning("本大分组下没有可移入的已有条目");
            return;
          }
          let picker = pdoc.getElementById(`${ID}-move-existing-picker`);
          if (!picker) {
            picker = pdoc.createElement("div");
            picker.id = `${ID}-move-existing-picker`;
            picker.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.86); backdrop-filter: blur(8px); z-index: 2147483647;
              display: flex; align-items: center; justify-content: center;
              font-family: 'Microsoft YaHei', sans-serif; color: white;
            `;
            pdoc.body.appendChild(picker);
          }
          picker.innerHTML = `
            <div style="background: rgba(30,30,30,0.96); padding: 16px; border-radius: 12px; border: 1px solid rgba(96,185,200,0.55); width: 90%; max-width: 420px; max-height: 78vh; display: flex; flex-direction: column;">
              <h4 style="margin:0 0 8px 0; color:#bde7ff; text-align:center;">移入已有条目</h4>
              <div style="font-size:11px; opacity:.7; text-align:center; margin-bottom:8px;">只显示当前大分组下、不在这个小分组里的条目</div>
              <input id="${ID}-move-existing-search" placeholder="搜索已有条目..." style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; margin-bottom: 10px;">
              <div id="${ID}-move-existing-list" style="overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding-right:4px;"></div>
              <button id="${ID}-move-existing-close" style="margin-top:10px; background: rgba(255,255,255,0.1); color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">关闭</button>
            </div>
          `;
          picker.style.display = "flex";
          const searchEl = pdoc.getElementById(`${ID}-move-existing-search`);
          const listEl = pdoc.getElementById(`${ID}-move-existing-list`);
          function render(filter = "") {
            const q = filter.trim().toLowerCase();
            listEl.innerHTML = "";
            candidates
              .filter((btn) => !q || (btn.querySelector(".menu-item-text")?.textContent || "").toLowerCase().includes(q) || (btn.getAttribute("data-kw") || "").toLowerCase().includes(q))
              .forEach((btn) => {
                const item = pdoc.createElement("div");
                const name = btn.querySelector(".menu-item-text")?.textContent?.trim() || btn.getAttribute("data-kw") || "未命名条目";
                item.textContent = name;
                item.style.cssText = "padding:7px 9px; border-radius:6px; background:rgba(255,255,255,0.06); cursor:pointer; font-size:12px;";
                item.addEventListener("click", () => {
                  targetGrid.appendChild(btn);
                  picker.style.display = "none";
                  requestAnimationFrame(refreshEditToolWrap);
                  toastr.success("已移入小分组");
                });
                listEl.appendChild(item);
              });
          }
          render();
          searchEl.addEventListener("input", () => render(searchEl.value));
          pdoc.getElementById(`${ID}-move-existing-close`).addEventListener("click", () => {
            picker.style.display = "none";
          });
          searchEl.focus();
        }

        function syncButtonBadges(btn) {
          btn.querySelector(".binding-badges")?.remove();
          btn.classList.remove("has-regex-binding", "has-link-binding");
          const regexCount = getLinkedRegexBindings(btn).length;
          const scriptCount = getLinkedScriptBindings(btn).length;
          const syncGroup = btn.getAttribute("data-sync-group");
          const mutexGroup = btn.getAttribute("data-group");
          if (regexCount > 0) btn.classList.add("has-regex-binding");
          if (syncGroup || mutexGroup) btn.classList.add("has-link-binding");
          if (!regexCount && !scriptCount && !syncGroup && !mutexGroup) return;
          const badges = pdoc.createElement("span");
          badges.className = "binding-badges";
          if (regexCount > 0) badges.insertAdjacentHTML("beforeend", `<span class="binding-badge regex" title="已绑定 ${regexCount} 个正则">R${regexCount}</span>`);
          if (scriptCount > 0) badges.insertAdjacentHTML("beforeend", `<span class="binding-badge script" title="已绑定 ${scriptCount} 个酒馆助手脚本">S${scriptCount}</span>`);
          if (syncGroup) badges.insertAdjacentHTML("beforeend", `<span class="binding-badge link" title="联动组：${syncGroup}"></span>`);
          if (mutexGroup) badges.insertAdjacentHTML("beforeend", `<span class="binding-badge mutex" title="互斥组：${mutexGroup}"></span>`);
          const textEl = btn.querySelector(".menu-item-text");
          if (textEl) textEl.insertAdjacentElement("afterend", badges);
          else btn.insertBefore(badges, btn.firstChild);
        }

        function refreshBindingBadges() {
          pdoc.querySelectorAll(`#${ID} .toggle-btn`).forEach(syncButtonBadges);
        }

        function refreshEditToolWrap() {
          if (!root.classList.contains("edit-mode")) return;
          pdoc.querySelectorAll(`#${ID} .toggle-btn`).forEach((btn) => {
            const tools = btn.querySelector(".edit-tools");
            if (!tools) return;
            btn.classList.remove("edit-tools-wrap");
            const availableWidth = Math.max(0, btn.getBoundingClientRect().width - 12);
            const neededWidth = Array.from(tools.children).reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) + Math.max(0, tools.children.length - 1) * 4;
            if (neededWidth > availableWidth) btn.classList.add("edit-tools-wrap");
          });
        }

        function isVirtualControlButton(btn) {
          return findPromptByButton(btn).length === 0 && (getLinkedRegexBindings(btn).length > 0 || getLinkedScriptBindings(btn).length > 0 || !!btn.getAttribute("data-sync-group"));
        }

        function setButtonState(btn, state, options = {}) {
          const virtualControl = isVirtualControlButton(btn);
          btn.classList.toggle("is-on", state);
          const changed = virtualControl ? true : (state ? ensureButtonOn(btn) : ensureButtonOff(btn));
          if (!options.skipRegex && changed) syncLinkedRegex(btn, state);
          if (!options.skipScripts && changed) syncLinkedScripts(btn, state);
          btn.classList.toggle("is-on", state && changed);
          if (changed && !options.skipVerify) scheduleOrbSync(180);
        }

        function syncButtonByKey(targetKey, state, options = {}) {
          const btnEl = pdoc.querySelector(`.toggle-btn[data-id="${targetKey}"]`) ||
                        pdoc.querySelector(`.toggle-btn[data-kw="${targetKey}"]`);
          if (btnEl) setButtonState(btnEl, state, options);
          else if (state) ensureOn(targetKey);
          else ensureOff(targetKey);
        }

        // 保存坐标及当前模型等状态到全局变量
        function savePos() {
          try {
            insertOrAssignVariables(
              {
                orbV6_prismfox_pos: JSON.stringify({
                  x: parseInt(root.style.left, 10),
                  y: parseInt(root.style.top, 10),
                  theme: currentTheme,
                  model: savedModel,
                }),
              },
              { type: "global" },
            );
          } catch (_) {}
        }

        // ── 核心驱动模型管理 (四大模式精准互斥与分配) ──
        const ALL_MODEL_PROMPTS = [
          "📌身份📌",
          "📝写作模式↓[自选]",
          "📝写作模式↑",
        ];

        const DEFAULT_MODEL_META = {
          claude: { label: "克劳德", hidden: false, order: 10 },
        };

        const DEFAULT_MODEL_CONFIG = {
          claude: ["📌身份📌", "📝写作模式↓[自选]", "📝写作模式↑"],
        };

        const DEFAULT_MODEL_REC_CONFIG = {
          claude: { on: [], off: [] },
        };

        function safeModelKey(value) {
          return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
        }

        function escapeHtml(value) {
          return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        }

        function normalizeModelMeta(meta, config = {}) {
          const merged = {};
          const source = { ...DEFAULT_MODEL_META, ...(meta || {}) };
          Object.keys(config || {}).forEach((key) => {
            if (!source[key]) source[key] = { label: key, hidden: false, order: 999 };
          });
          Object.entries(source).forEach(([rawKey, rawItem], index) => {
            const key = safeModelKey(rawKey);
            if (!key) return;
            const item = rawItem && typeof rawItem === "object" ? rawItem : {};
            merged[key] = {
              label: String(item.label || DEFAULT_MODEL_META[key]?.label || key),
              hidden: !!item.hidden,
              order: Number.isFinite(Number(item.order)) ? Number(item.order) : (index + 1) * 10,
            };
          });
          return merged;
        }

        function loadModelConfig() {
           try {
              const cfg = localStorage.getItem("orbV6_model_config");
              if (cfg) return JSON.parse(cfg);
           } catch (e) {}
           return cloneExportConfig(ORB_EXPORTED_CONFIG.modelConfig, DEFAULT_MODEL_CONFIG);
        }
        const MODEL_CONFIG = loadModelConfig();

        function loadModelRecConfig() {
           try {
              const cfg = localStorage.getItem("orbV6_model_rec_config");
              if (cfg) return JSON.parse(cfg);
           } catch (e) {}
           return cloneExportConfig(ORB_EXPORTED_CONFIG.modelRecConfig, DEFAULT_MODEL_REC_CONFIG);
        }
        const MODEL_REC_CONFIG = loadModelRecConfig();

        function loadModelMetaConfig() {
           try {
              const cfg = localStorage.getItem("orbV6_model_meta");
              if (cfg) return normalizeModelMeta(JSON.parse(cfg), MODEL_CONFIG);
           } catch (e) {}
           return normalizeModelMeta(cloneExportConfig(ORB_EXPORTED_CONFIG.modelMeta, DEFAULT_MODEL_META), MODEL_CONFIG);
        }
        const MODEL_META = loadModelMetaConfig();

        Object.keys(MODEL_META).forEach((key) => {
          if (!Array.isArray(MODEL_CONFIG[key])) MODEL_CONFIG[key] = [];
          if (!MODEL_REC_CONFIG[key]) MODEL_REC_CONFIG[key] = { on: [], off: [] };
        });

        function getModelKeys(options = {}) {
          const includeHidden = !!options.includeHidden;
          return Object.keys(MODEL_META)
            .filter((key) => includeHidden || !MODEL_META[key]?.hidden)
            .sort((a, b) => (MODEL_META[a]?.order || 999) - (MODEL_META[b]?.order || 999) || a.localeCompare(b));
        }

        function getModelLabel(key) {
          return MODEL_META[key]?.label || key;
        }

        function getFirstVisibleModelKey() {
          return getModelKeys()[0] || getModelKeys({ includeHidden: true })[0] || "claude";
        }

        function normalizeSavedModel() {
          if (!MODEL_META[savedModel] || MODEL_META[savedModel]?.hidden) savedModel = getFirstVisibleModelKey();
          if (!MODEL_CONFIG[savedModel]) MODEL_CONFIG[savedModel] = [];
          if (!MODEL_REC_CONFIG[savedModel]) MODEL_REC_CONFIG[savedModel] = { on: [], off: [] };
          return savedModel;
        }

        function setActiveModelButton(type) {
          pdoc.querySelectorAll(`#${ID} .sexy-seg[data-model-key]`).forEach((seg) => {
            seg.classList.toggle("is-on", seg.getAttribute("data-model-key") === type);
          });
        }

        function renderModelSegments() {
          const group = pdoc.querySelector(`#${ID}-model-section .sexy-group`);
          if (!group) return;
          const active = normalizeSavedModel();
          const keys = getModelKeys();
          group.innerHTML = keys.length
            ? keys.map((key) => `<div class="sexy-seg ${key === active ? 'is-on' : ''}" id="${ID}-cot-${key}" data-model-key="${key}"><div class="sexy-seg-label">${escapeHtml(getModelLabel(key))}</div></div>`).join("")
            : `<div class="sexy-seg is-on" data-model-key=""><div class="sexy-seg-label">请新增模型</div></div>`;
          applyRecommended(active);
        }

        function attachModelEventHandlers() {
          const group = pdoc.querySelector(`#${ID}-model-section .sexy-group`);
          if (!group || group.getAttribute("data-model-bound") === "true") return;
          group.setAttribute("data-model-bound", "true");
          group.addEventListener("click", (e) => {
            const seg = e.target.closest(".sexy-seg[data-model-key]");
            const key = seg?.getAttribute("data-model-key");
            if (key) setModel(key);
          });
        }

        function attachRecToggleHandler() {
          const recBtn = pdoc.getElementById(`${ID}-rec-toggle`);
          if (!recBtn || recBtn.getAttribute("data-rec-bound") === "true") return;
          recBtn.setAttribute("data-rec-bound", "true");
          recBtn.addEventListener("click", (e) => {
            if (pwin.orbEditMode) return;
            const rec = MODEL_REC_CONFIG[savedModel];
            if (!rec || ((rec.on || []).length === 0 && (rec.off || []).length === 0)) return;
            recEnabled = !recEnabled;
            const btn = e.currentTarget;
            btn.classList.toggle("is-on", recEnabled);
            if (recEnabled) {
               (rec.on || []).forEach(kw => ensureOn(kw));
               (rec.off || []).forEach(kw => ensureOff(kw));
            } else {
               (rec.on || []).forEach(kw => ensureOff(kw));
            }
          });
        }

        function saveModelAllConfig() {
          localStorage.setItem("orbV6_model_meta", JSON.stringify(MODEL_META));
          localStorage.setItem("orbV6_model_config", JSON.stringify(MODEL_CONFIG));
          localStorage.setItem("orbV6_model_rec_config", JSON.stringify(MODEL_REC_CONFIG));
        }

        let recEnabled = false;

        function setModel(type) {
          if (!isPmPanelOpen()) {
            toastr.warning("请先打开预设面板");
            return;
          }

          if (!MODEL_META[type] || MODEL_META[type]?.hidden) {
            toastr.warning("该模型模块不存在或已隐藏");
            return;
          }

          savedModel = type;
          savePos();

          // 是否保留已选的“繁”
          const useFan = isKeyOn("✨丨思考模式（繁）") || isKeyOn("—\\✨思考模式（繁）");

          const baseTurnOn = MODEL_CONFIG[type] || [];
          const turnOn = [...baseTurnOn];
      
          // model-specific toggles are handled dynamically via MODEL_CONFIG

          // 动态收集所有可能的模型关键词，确保用户自定义的词也能互斥和切换
          const allCoreKw = new Set(ALL_MODEL_PROMPTS);
          Object.values(MODEL_CONFIG).flat().forEach(kw => allCoreKw.add(kw));

          // 绝对清除不相关的核心选项，然后开启对应的
          allCoreKw.forEach((kw) => {
            if (turnOn.includes(kw)) ensureOn(kw);
            else ensureOff(kw);
          });

          setActiveModelButton(type);

          applyRecommended(type);

          toastr.success(`已切换模型模式: ${getModelLabel(type)}`);
        }

        function applyRecommended(type) {
          const recBtn = pdoc.getElementById(`${ID}-rec-toggle`);
          if (recBtn) {
            const rec = MODEL_REC_CONFIG[type];
            let allGood = true;
            if (rec) {
               (rec.on || []).forEach(kw => {
                 const items = findPrompt(kw);
                 if (items.length === 0 || !items.every(li => isPromptEnabled(li))) allGood = false;
               });
               (rec.off || []).forEach(kw => {
                 const items = findPrompt(kw);
                 if (items.length === 0) return;
                 if (items.some(li => isPromptEnabled(li))) allGood = false;
               });
            }
        
            if (rec && ((rec.on || []).length > 0 || (rec.off || []).length > 0)) {
               recBtn.style.display = 'flex';
               recBtn.classList.toggle("is-on", allGood);
               recEnabled = allGood;
            } else {
               recBtn.style.display = 'none';
               recBtn.classList.remove("is-on");
               recEnabled = false;
            }
          }
        }

        // Modal UI to edit model configuration
        function showModelConfigModal() {
           let modal = pdoc.getElementById(`${ID}-model-config-modal`);
           if (!modal) {
              modal = pdoc.createElement("div");
              modal.id = `${ID}-model-config-modal`;
              modal.style.cssText = `
                 position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                 background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 2147483645;
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 8px;
                 font-family: 'Microsoft YaHei', sans-serif; color: white;
              `;
          
              let innerHTML = `<div style="background: rgba(20,20,20,0.95); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 90%; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column;">
                 <h3 style="margin-top: 0; text-align: center; color: #60b9c8;">⚙️ 核心模型绑定设置</h3>
             
                 <!-- Tabs -->
                 <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                   <div id="${ID}-tab-core" style="flex:1; text-align: center; cursor: pointer; color: #60b9c8; font-weight: bold; padding: 5px; border-bottom: 2px solid #60b9c8;">绑定模型与核心提示词</div>
                   <div id="${ID}-tab-rec" style="flex:1; text-align: center; cursor: pointer; color: rgba(255,255,255,0.5); padding: 5px; border-bottom: 2px solid transparent;">模型推荐条目</div>
                 </div>

                 <!-- Tab Content 1: Core Bindings -->
                 <div id="${ID}-content-core" style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 5px;">
                   <p style="font-size: 11px; opacity: 0.7; text-align: center; margin: 0 0 10px 0;">输入需要开启的条目名称（多个条目用英文逗号分隔）。也可以点击选择。</p>
              `;
          
              const labels = Object.fromEntries(getModelKeys({ includeHidden: true }).map((key) => [key, getModelLabel(key)]));
          
              for (const key in MODEL_CONFIG) {
                 innerHTML += `
                   <div style="display:flex; flex-direction: column; gap: 4px;">
                     <div style="display:flex; justify-content: space-between; align-items: center;">
                       <label style="font-size: 12px; font-weight: bold; color: #e8b072;">${labels[key] || key}</label>
                       <button class="visual-pick-btn" data-target="${ID}-cfg-${key}" style="background: rgba(96,185,200,0.3); border: none; color: white; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">🔍 可视化选择</button>
                     </div>
                     <input type="text" id="${ID}-cfg-${key}" value="${MODEL_CONFIG[key].join(",")}" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; width: 100%; box-sizing: border-box;">
                   </div>
                 `;
              }
          
              innerHTML += `
                 </div>

                 <!-- Tab Content 2: Recommended Bindings -->
                 <div id="${ID}-content-rec" style="display: none; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 5px;">
                   <p style="font-size: 11px; opacity: 0.7; text-align: center; margin: 0 0 10px 0;">配置切换到该模型时，推荐【开启】或【关闭】的条目。</p>
              `;

              for (const key in MODEL_REC_CONFIG) {
                 innerHTML += `
                   <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px;">
                     <label style="font-size: 12px; font-weight: bold; color: #e8b072; display: block; margin-bottom: 6px;">${labels[key] || key}</label>
                     <div style="display:flex; flex-direction: column; gap: 6px;">
                       <div style="display:flex; align-items: center; gap: 8px;">
                         <span style="color: #60b9c8; font-size: 11px; width: 50px;">推荐开启:</span>
                         <input type="text" id="${ID}-rec-on-${key}" value="${MODEL_REC_CONFIG[key]?.on?.join(",") || ""}" style="flex:1; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; outline: none;">
                         <button class="visual-pick-btn" data-target="${ID}-rec-on-${key}" style="background: rgba(96,185,200,0.3); border: none; color: white; border-radius: 4px; padding: 4px; font-size: 10px; cursor: pointer;">🔍</button>
                       </div>
                       <div style="display:flex; align-items: center; gap: 8px;">
                         <span style="color: #e8b072; font-size: 11px; width: 50px;">必须关闭:</span>
                         <input type="text" id="${ID}-rec-off-${key}" value="${MODEL_REC_CONFIG[key]?.off?.join(",") || ""}" style="flex:1; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; outline: none;">
                         <button class="visual-pick-btn" data-target="${ID}-rec-off-${key}" style="background: rgba(96,185,200,0.3); border: none; color: white; border-radius: 4px; padding: 4px; font-size: 10px; cursor: pointer;">🔍</button>
                       </div>
                     </div>
                   </div>
                 `;
              }

              innerHTML += `
                 </div>

                 <div style="display: flex; gap: 10px; margin-top: 20px; flex-shrink: 0;">
                   <button id="${ID}-cfg-save" style="flex:1; background: rgba(50,205,50,0.4); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">保存所有配置</button>
                   <button id="${ID}-cfg-cancel" style="flex:1; background: rgba(255,50,50,0.4); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
                   <button id="${ID}-cfg-reset" style="flex:1; background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">恢复默认核心绑定</button>
                 </div>
              </div>`;
              modal.innerHTML = innerHTML;
              pdoc.body.appendChild(modal);
          
              // Tab Switching Logic
              const tabCore = pdoc.getElementById(`${ID}-tab-core`);
              const tabRec = pdoc.getElementById(`${ID}-tab-rec`);
              const contentCore = pdoc.getElementById(`${ID}-content-core`);
              const contentRec = pdoc.getElementById(`${ID}-content-rec`);

              tabCore.addEventListener("click", () => {
                 tabCore.style.color = "#60b9c8";
                 tabCore.style.borderColor = "#60b9c8";
                 tabCore.style.fontWeight = "bold";
                 tabRec.style.color = "rgba(255,255,255,0.5)";
                 tabRec.style.borderColor = "transparent";
                 tabRec.style.fontWeight = "normal";
                 contentCore.style.display = "flex";
                 contentRec.style.display = "none";
              });

              tabRec.addEventListener("click", () => {
                 tabRec.style.color = "#60b9c8";
                 tabRec.style.borderColor = "#60b9c8";
                 tabRec.style.fontWeight = "bold";
                 tabCore.style.color = "rgba(255,255,255,0.5)";
                 tabCore.style.borderColor = "transparent";
                 tabCore.style.fontWeight = "normal";
                 contentRec.style.display = "flex";
                 contentCore.style.display = "none";
              });

              // Visual Picker Logic
              modal.querySelectorAll('.visual-pick-btn').forEach(btn => {
                 btn.addEventListener("click", () => {
                    const targetId = btn.getAttribute("data-target");
                    openVisualPicker(targetId);
                 });
              });

              pdoc.getElementById(`${ID}-cfg-cancel`).addEventListener("click", () => modal.remove());
              pdoc.getElementById(`${ID}-cfg-reset`).addEventListener("click", () => {
                 localStorage.removeItem("orbV6_model_meta");
                 localStorage.removeItem("orbV6_model_config");
                 localStorage.removeItem("orbV6_model_rec_config");
                 Object.keys(MODEL_META).forEach((key) => delete MODEL_META[key]);
                 Object.assign(MODEL_META, normalizeModelMeta(DEFAULT_MODEL_META, DEFAULT_MODEL_CONFIG));
                 Object.keys(MODEL_CONFIG).forEach((key) => delete MODEL_CONFIG[key]);
                 Object.assign(MODEL_CONFIG, cloneExportConfig(DEFAULT_MODEL_CONFIG, DEFAULT_MODEL_CONFIG));
                 Object.keys(MODEL_REC_CONFIG).forEach((key) => delete MODEL_REC_CONFIG[key]);
                 Object.assign(MODEL_REC_CONFIG, cloneExportConfig(DEFAULT_MODEL_REC_CONFIG, DEFAULT_MODEL_REC_CONFIG));
                 savedModel = "claude";
                 saveModelAllConfig();
                 savePos();
                 renderModelSegments();
                 modal.remove();
                 showModelConfigModal();
                 toastr.info("核心模型设置已恢复默认");
              });
              pdoc.getElementById(`${ID}-cfg-save`).addEventListener("click", () => {
                 getModelKeys({ includeHidden: true }).forEach((key) => {
                    const cfgEl = pdoc.getElementById(`${ID}-cfg-${key}`);
                    const onEl = pdoc.getElementById(`${ID}-rec-on-${key}`);
                    const offEl = pdoc.getElementById(`${ID}-rec-off-${key}`);
                    MODEL_CONFIG[key] = cfgEl ? cfgEl.value.split(",").map(s => s.trim()).filter(Boolean) : (MODEL_CONFIG[key] || []);
                    MODEL_REC_CONFIG[key] = {
                       on: onEl ? onEl.value.split(",").map(s => s.trim()).filter(Boolean) : (MODEL_REC_CONFIG[key]?.on || []),
                       off: offEl ? offEl.value.split(",").map(s => s.trim()).filter(Boolean) : (MODEL_REC_CONFIG[key]?.off || [])
                    };
                 });
                 normalizeSavedModel();
                 saveModelAllConfig();
                 savePos();
                 renderModelSegments();
                 toastr.success("所有配置已保存");
                 modal.remove();
                 applyRecommended(savedModel);
              });
           }
        }

        function showModelModuleManagerModal() {
          let manager = pdoc.getElementById(`${ID}-model-module-manager`);
          if (!manager) {
            manager = pdoc.createElement("div");
            manager.id = `${ID}-model-module-manager`;
            manager.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; font-family: 'Microsoft YaHei', sans-serif; color: white;`;
            pdoc.body.appendChild(manager);
          }

          const keys = getModelKeys({ includeHidden: true });
          manager.innerHTML = `
            <div style="background: rgba(20,20,20,0.96); padding: 18px; border-radius: 12px; border: 1px solid rgba(96,185,200,0.5); width: 92%; max-width: 520px; max-height: 84vh; display: flex; flex-direction: column;">
              <h3 style="margin: 0 0 10px 0; text-align: center; color: #60b9c8;">模型模块管理</h3>
              <div style="font-size: 11px; opacity: .72; text-align: center; margin-bottom: 10px;">新增、重命名、隐藏或删除核心模型模块。保存后会刷新上方模型按钮。</div>
              <div id="${ID}-model-module-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; padding-right:4px;"></div>
              <button id="${ID}-model-module-add" style="margin-top:10px; background: rgba(126,231,135,0.18); color: #7ee787; border: 1px solid rgba(126,231,135,0.35); padding: 8px; border-radius: 6px; cursor: pointer;">➕ 新增模型</button>
              <div style="display:flex; gap:10px; margin-top:12px;">
                <button id="${ID}-model-module-save" style="flex:2; background: rgba(50,205,50,0.4); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">保存模块</button>
                <button id="${ID}-model-module-cancel" style="flex:1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
              </div>
            </div>
          `;
          manager.style.display = "flex";

          const list = pdoc.getElementById(`${ID}-model-module-list`);
          function createRow(key, label, hidden) {
            const row = pdoc.createElement("div");
            row.className = hidden ? "model-module-row model-hidden-draft" : "model-module-row";
            row.setAttribute("data-key", key);
            row.style.cssText = "background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;";
            row.innerHTML = `<div style="display:flex; gap:6px; align-items:center;"><input class="model-label-input" value="${escapeHtml(label)}" style="flex:1; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 5px 8px; border-radius: 5px; font-size: 12px; outline: none;"><span style="font-size:10px; opacity:.65; min-width:86px;">key: ${escapeHtml(key)}</span></div><div style="display:flex; gap:6px;"><button class="edit-btn toggle-model-hidden" style="flex:1;">${hidden ? '👁️ 恢复' : '👁️‍🗨️ 隐藏'}</button><button class="edit-btn del delete-model-module" style="flex:1;">🗑️ 删除</button></div>`;
            row.querySelector(".toggle-model-hidden").addEventListener("click", (event) => {
              row.classList.toggle("model-hidden-draft");
              event.currentTarget.textContent = row.classList.contains("model-hidden-draft") ? "👁️ 恢复" : "👁️‍🗨️ 隐藏";
            });
            row.querySelector(".delete-model-module").addEventListener("click", () => {
              if (confirm(`确定删除模型模块「${row.querySelector(".model-label-input")?.value || key}」？对应核心绑定与推荐条目也会删除。`)) row.remove();
            });
            list.appendChild(row);
          }

          keys.forEach((key) => createRow(key, getModelLabel(key), !!MODEL_META[key]?.hidden));

          pdoc.getElementById(`${ID}-model-module-add`).addEventListener("click", () => {
            const rawKey = prompt("请输入模型内部标识，只能包含英文、数字、下划线或短横线，例如 kimi：", "");
            if (rawKey === null) return;
            const key = safeModelKey(rawKey);
            if (!key) return toastr.warning("内部标识不能为空，且只能使用英文、数字、下划线或短横线");
            if (manager.querySelector(`.model-module-row[data-key="${key}"]`) || MODEL_META[key]) return toastr.warning("这个内部标识已存在");
            const rawLabel = prompt("请输入模型显示名称：", key);
            if (rawLabel === null) return;
            createRow(key, String(rawLabel || key).trim() || key, false);
          });

          pdoc.getElementById(`${ID}-model-module-cancel`).addEventListener("click", () => {
            manager.style.display = "none";
          });

          pdoc.getElementById(`${ID}-model-module-save`).addEventListener("click", () => {
            const rows = Array.from(manager.querySelectorAll(".model-module-row"));
            const nextKeys = rows.map((row) => row.getAttribute("data-key")).filter(Boolean);
            if (nextKeys.length === 0) return toastr.warning("至少保留一个模型模块");
            const visibleKeys = rows.filter((row) => !row.classList.contains("model-hidden-draft")).map((row) => row.getAttribute("data-key"));
            if (visibleKeys.length === 0) return toastr.warning("至少保留一个未隐藏模型模块");

            Object.keys(MODEL_META).forEach((key) => { if (!nextKeys.includes(key)) delete MODEL_META[key]; });
            Object.keys(MODEL_CONFIG).forEach((key) => { if (!nextKeys.includes(key)) delete MODEL_CONFIG[key]; });
            Object.keys(MODEL_REC_CONFIG).forEach((key) => { if (!nextKeys.includes(key)) delete MODEL_REC_CONFIG[key]; });
            rows.forEach((row, index) => {
              const key = row.getAttribute("data-key");
              const label = row.querySelector(".model-label-input")?.value?.trim() || key;
              MODEL_META[key] = { label, hidden: row.classList.contains("model-hidden-draft"), order: (index + 1) * 10 };
              if (!Array.isArray(MODEL_CONFIG[key])) MODEL_CONFIG[key] = [];
              if (!MODEL_REC_CONFIG[key]) MODEL_REC_CONFIG[key] = { on: [], off: [] };
            });
            normalizeSavedModel();
            saveModelAllConfig();
            savePos();
            renderModelSegments();
            attachModelEventHandlers();
            manager.style.display = "none";
            pdoc.getElementById(`${ID}-model-config-modal`)?.remove();
            toastr.success("模型模块已保存");
          });
        }

        function openVisualPicker(targetInputId) {
          const inputEl = pdoc.getElementById(targetInputId);
          if (!inputEl) return;
      
          const currentSelected = inputEl.value.split(",").map(s => s.trim()).filter(Boolean);
      
          let picker = pdoc.getElementById(`${ID}-visual-picker`);
          if (!picker) {
             picker = pdoc.createElement("div");
             picker.id = `${ID}-visual-picker`;
             picker.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 2147483647;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Microsoft YaHei', sans-serif; color: white;
             `;
             pdoc.body.appendChild(picker);
          }
      
          let html = `
             <div style="background: rgba(30,30,30,0.95); padding: 20px; border-radius: 12px; border: 1px solid #60b9c8; width: 90%; max-width: 450px; max-height: 85vh; display: flex; flex-direction: column;">
                <h4 style="margin: 0 0 10px 0; color: #60b9c8; text-align: center;">从预设列表中选择</h4>
                <input type="text" id="${ID}-picker-search" placeholder="搜索条目名称..." style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none; margin-bottom: 10px;">
                <div id="${ID}-picker-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; scrollbar-width: thin;">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-shrink: 0;">
                   <button id="${ID}-picker-confirm" style="flex:2; background: rgba(96,185,200,0.5); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">确定选择</button>
                   <button id="${ID}-picker-cancel" style="flex:1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">取消</button>
                </div>
             </div>
          `;
          picker.innerHTML = html;
          picker.style.display = "flex";

          const listContainer = pdoc.getElementById(`${ID}-picker-list`);
      
          // 获取当前可用的预设选项
          const allNames = new Set();
      
          // 1. 获取悬浮窗里已配置的按钮的关键词
          Array.from(pdoc.querySelectorAll(`#${ID} .toggle-btn`)).forEach(btn => {
             const kw = btn.getAttribute("data-kw");
             if (kw) allNames.add(kw);
          });

          // 2. 获取SillyTavern DOM中的预设
          const pmList = getPmList() || pdoc;
          Array.from(pmList.querySelectorAll("li[data-pm-identifier]")).forEach(li => {
             const nameEl = li.querySelector(".prompt-manager-name") || li.querySelector(".name") || li.querySelector("[data-pm-name]");
             if (nameEl) {
                 const name = nameEl.getAttribute("data-pm-name") || nameEl.textContent.trim();
                 if (name) allNames.add(name);
             }
          });
      
          const allNamesArray = Array.from(allNames).sort();
      
          function renderList(filter = "") {
             listContainer.innerHTML = "";
         
             const filteredNames = allNamesArray.filter(name => {
                if (filter && !name.toLowerCase().includes(filter.toLowerCase())) return false;
                return true;
             });
         
             // 按照是否已选中排序，选中的在前面
             filteredNames.sort((a, b) => {
                 const aSelected = currentSelected.includes(a) ? 1 : 0;
                 const bSelected = currentSelected.includes(b) ? 1 : 0;
                 return bSelected - aSelected;
             });

             filteredNames.forEach(name => {
                const isChecked = currentSelected.includes(name);
                const itemDiv = pdoc.createElement("div");
                itemDiv.className = "search-item";
                itemDiv.style.cssText = `
                   display: flex; align-items: center; gap: 8px; padding: 6px 8px; 
                   background: ${isChecked ? 'rgba(96,185,200,0.2)' : 'rgba(255,255,255,0.05)'}; 
                   border: 1px solid ${isChecked ? 'rgba(96,185,200,0.5)' : 'transparent'};
                   border-radius: 4px; cursor: pointer; font-size: 12px;
                `;
                itemDiv.innerHTML = `
                   <input type="checkbox" ${isChecked ? 'checked' : ''} style="pointer-events: none;">
                   <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
                `;
            
                itemDiv.addEventListener("click", () => {
                   const cb = itemDiv.querySelector("input");
                   cb.checked = !cb.checked;
                   if (cb.checked) {
                      currentSelected.push(name);
                      itemDiv.style.background = 'rgba(96,185,200,0.2)';
                      itemDiv.style.border = '1px solid rgba(96,185,200,0.5)';
                   } else {
                      const idx = currentSelected.indexOf(name);
                      if (idx > -1) currentSelected.splice(idx, 1);
                      itemDiv.style.background = 'rgba(255,255,255,0.05)';
                      itemDiv.style.border = '1px solid transparent';
                   }
                });
                listContainer.appendChild(itemDiv);
             });
          }
      
          renderList();
      
          pdoc.getElementById(`${ID}-picker-search`).addEventListener("input", (e) => {
             renderList(e.target.value);
          });
      
          pdoc.getElementById(`${ID}-picker-cancel`).addEventListener("click", () => {
             picker.style.display = "none";
          });
      
          pdoc.getElementById(`${ID}-picker-confirm`).addEventListener("click", () => {
             inputEl.value = currentSelected.join(", ");
             picker.style.display = "none";
          });
        }

        function createPresetToggleButton({ id, kw, text, group, edit = false, isOn = false }) {
          const btn = pdoc.createElement("div");
          btn.className = `menu-item-toggle toggle-btn${isOn ? " is-on" : ""}`;
          btn.setAttribute("data-id", id);
          btn.setAttribute("data-kw", kw);
          if (edit) btn.setAttribute("data-edit", "true");
          btn.innerHTML = `<div class="menu-item-text">${text}</div><div class="toggle-led"></div>`;
          return btn;
        }

        function findGridByExistingButton(id) {
          return pdoc.querySelector(`#${ID} .toggle-btn[data-id="${id}"]`)?.closest(".grid-toggles") || null;
        }

        function ensurePresetButton(anchorId, config) {
          if (pdoc.querySelector(`#${ID} .toggle-btn[data-id="${config.id}"]`)) return;
          const grid = findGridByExistingButton(anchorId);
          if (!grid) {
            console.warn("[orb] ensurePresetButton: 找不到插入锚点", anchorId, config.kw);
            return;
          }
          grid.appendChild(createPresetToggleButton(config));
        }

        function updatePresetButton(oldId, config) {
          const btn = pdoc.querySelector(`#${ID} .toggle-btn[data-id="${oldId}"]`);
          if (!btn) return;
          btn.setAttribute("data-id", config.id);
          btn.setAttribute("data-kw", config.kw);
          btn.removeAttribute("data-group");
          if (config.edit) btn.setAttribute("data-edit", "true");
          const textEl = btn.querySelector(".menu-item-text");
          if (textEl && !btn.getAttribute("data-locked")) textEl.textContent = config.text;
        }

        function removePresetButtonById(id) {
          pdoc.querySelectorAll(`#${ID} .toggle-btn[data-id="${id}"]`).forEach((btn) => btn.remove());
        }

        function removeEmptyDetails() {
          pdoc.querySelectorAll(`#${ID} details`).forEach((details) => {
            if (details.id === `${ID}-model-section`) return;
            if (details.querySelector(".toggle-btn")) return;
            if (details.querySelector("details")) return;
            const text = details.querySelector("summary .summary-text")?.textContent?.trim() || "";
            if (text) details.remove();
          });
        }

        function removeDuplicatePresetButtons() {
          // Disabled: 三分类Tab系统允许同一预设条目出现在多个Tab中
          return;
        }

        function syncPresetButtonsWithCurrentJson() {
          pdoc.querySelectorAll(`#${ID} details`).forEach((details) => {
            const text = details.querySelector("summary .summary-text")?.textContent?.trim() || "";
            if (text === "缝合怪与数据库相关") details.remove();
          });
          removeDuplicatePresetButtons();
          removeEmptyDetails();
        }

        function ensureMissingPresetButtons() {
          syncPresetButtonsWithCurrentJson();

          syncPresetButtonsWithCurrentJson();
          refreshBindingBadges();
        }

        ensureMissingPresetButtons();
        renderModelSegments();
        attachModelEventHandlers();
        attachRecToggleHandler();

        // ── 主题切换逻辑 ──
        pdoc.querySelectorAll(".t-dot").forEach((dot) => {
          dot.addEventListener("click", (e) => {
            e.stopPropagation();
            const theme = dot.getAttribute("data-theme");
            shell.className = `menu-shell ${theme}`;
            pdoc.querySelectorAll(".t-dot").forEach((d) => {
              d.classList.remove("active");
            });
            dot.classList.add("active");
            currentTheme = theme;
            savePos();
          });
        });

        // ── 单选及开关核心逻辑 ──
        let previousCotState = [];
        let aiDialogCotState = null;
        const cotIds = [
          "181a9c55-cf52-44ff-9ed8-2041f532bb88", // ✨丨思考模式（简）
          "a4e77064-43d9-40b3-89cd-7748dd1d517e", // ✨丨思考模式（繁）
          "803e5ba9-05d9-4ef8-82a4-cc0cea261dab", // ✨丨自由CoT
          "c997464a-9fd5-47f9-8056-ab28e59f82bf", // ✴️丨思考模式
          "b94ad337-fe74-4542-8108-7334d81fb6c1", // 🎨丨思考模式
          "64be5a3e-c1d2-41e3-8411-3f99d5940a55", // 🔒丨强化思考
        ];

        const LINK_PAIRS = [
          { a: "📶加强世界书阅读", b: "📚// COT //世界书增强" },
          { a: "📚// COT //世界书增强", b: "📶加强世界书阅读" },
        ];
        function getLinkTarget(key) {
          for (const p of LINK_PAIRS) {
            if (p.a === key) return p.b;
          }
          return null;
        }

        const AI_DIALOG_IDS = new Set([
          "f4642ed1-8db2-4982-ba95-e7f1025ebbf4", // 🤬丨AI对话（拷打哈基米）
          "d8c2fc69-0317-4cd8-93b9-ee7f8b4da008", // 🤬丨AI对话（拷打克劳德）
        ]);
        const AI_DIALOG_CLAUDE_ID = "d8c2fc69-0317-4cd8-93b9-ee7f8b4da008";
        const SUMMARY_MODE_ID = "0223af90-04a5-4679-9001-b5291cce7a80";

        function isAiDialogButton(btn) {
          return AI_DIALOG_IDS.has(btn?.getAttribute("data-id"));
        }

        function isSummaryButton(btn) {
          return btn?.getAttribute("data-id") === SUMMARY_MODE_ID;
        }

        function closeCotForAiDialog() {
          if (!aiDialogCotState) {
            aiDialogCotState = cotIds.filter((id) => isKeyOn(id));
          }
          cotIds.forEach((id) => syncToggle(id, false));
        }

        function restoreCotAfterAiDialog() {
          if (!aiDialogCotState) return;
          aiDialogCotState.forEach((id) => syncToggle(id, true));
          aiDialogCotState = null;
        }

        function closeCotForSummaryMode() {
          previousCotState = cotIds.filter((id) => isKeyOn(id));
          cotIds.forEach((id) => syncToggle(id, false));
        }

        function restoreCotAfterSummaryMode() {
          previousCotState.forEach((id) => syncToggle(id, true));
          previousCotState = [];
        }

        let _orbSelfToggling = false;

        function scheduleOrbSync(delay = 120) {
          clearTimeout(pwin._orbSyncTimer);
          pwin._orbSyncTimer = setTimeout(() => {
            attachReverseObserver();
            initDetectState();
            refreshEditToolWrap();
          }, delay);
        }

        function markOrbSelfToggling() {
          _orbSelfToggling = true;
          clearTimeout(pwin._orbSelfTogglingTimer);
          pwin._orbSelfTogglingTimer = setTimeout(() => {
            _orbSelfToggling = false;
            scheduleOrbSync(60);
          }, 350);
        }

        pdoc.getElementById(`${ID}-menu`).addEventListener("click", (e) => {
          const btn = e.target.closest(".toggle-btn");
          if (btn) {
            if (btn.id === `${ID}-rec-toggle`) return;
            if (pwin.orbEditMode) return;

            // Direct toggle for force-vc buttons
            if (btn.getAttribute("data-sync-group") === "force-vc") {
              markOrbSelfToggling();
              const kw = btn.getAttribute("data-kw") || "";
              const cleanKw = kw.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim();
              const list = getPmList() || pdoc;
              let li = Array.from(list.querySelectorAll("li[data-pm-identifier]")).find(li => {
                const n = (li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "");
                return n.replace(/^[^\u4e00-\u9fff\w\d]+/u, '').trim() === cleanKw;
              });
              const fvcId = btn.getAttribute("data-id");
              if (!li && fvcId) {
                li = findById(fvcId)[0];
              }
              if (li) {
                const isOn = btn.classList.contains("is-on");
                if (isOn) {
                  if (isPromptEnabled(li)) clickToggle(li);
                  btn.classList.remove("is-on");
                } else {
                  if (!isPromptEnabled(li)) clickToggle(li);
                  btn.classList.add("is-on");
                }
              } else if (fvcId) {
                const isOn = btn.classList.contains("is-on");
                var r = findPromptOrderEntry(fvcId);
                if (r) {
                  if (isOn && r.entry.enabled) directTogglePrompt(fvcId);
                  else if (!isOn && !r.entry.enabled) directTogglePrompt(fvcId);
                  btn.classList.toggle("is-on", !isOn);
                }
              }
              return;
            }

            markOrbSelfToggling();

            const key = resolveKey(btn);
            const kw = btn.getAttribute("data-kw");
            const groupName = btn.getAttribute("data-group") || "";
            const syncGroupName = btn.getAttribute("data-sync-group");
            const isEdit = btn.getAttribute("data-edit") === "true";
            const isOn = btn.classList.contains("is-on");
            const isAiDialog = isAiDialogButton(btn);
            const isSummary = isSummaryButton(btn);

            if (isOn) {
              setButtonState(btn, false);

              // Claude-all-on: turn OFF all Claude buttons when clicked OFF
              if (groupName === "claude-gemini-mutex") {
                const claudeList = pdoc.querySelector(`#${ID} .cat-list-1`);
                if (claudeList) {
                  claudeList.querySelectorAll(".toggle-btn").forEach((cBtn) => {
                    if (cBtn !== btn && cBtn.classList.contains("is-on")) {
                      setButtonState(cBtn, false, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
              }

              if (groupName === "gemini-claude-mutex") {
                const geminiList = pdoc.querySelector(`#${ID} .cat-list-2`);
                if (geminiList) {
                  geminiList.querySelectorAll(".toggle-btn").forEach((gBtn) => {
                    if (gBtn !== btn && gBtn.classList.contains("is-on")) {
                      setButtonState(gBtn, false, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
              }

              if (isAiDialog) {
                restoreCotAfterAiDialog();
              }

              if (syncGroupName) {
                pdoc.querySelectorAll(`.toggle-btn[data-sync-group="${syncGroupName}"]`).forEach((otherBtn) => {
                  if (otherBtn !== btn && otherBtn.classList.contains("is-on")) {
                    setButtonState(otherBtn, false, { skipRegex: true, skipScripts: true });
                  }
                });
              }

              const linkTarget = getLinkTarget(key) || getLinkTarget(kw);
              if (linkTarget) syncToggle(linkTarget, false);

              if (isSummary) {
                restoreCotAfterSummaryMode();
                toastr.info("已退出大总结模式，恢复思考模块");
              }
            } else {
              if (groupName) {
                pdoc.querySelectorAll(`.toggle-btn[data-group="${groupName}"]`).forEach((otherBtn) => {
                  if (otherBtn !== btn && otherBtn.classList.contains("is-on")) {
                    const wasAiDialog = isAiDialogButton(otherBtn);
                    const wasSummary = isSummaryButton(otherBtn);
                    setButtonState(otherBtn, false, { skipRegex: true, skipScripts: true });

                    if (wasAiDialog && !isAiDialog) {
                      restoreCotAfterAiDialog();
                    }
                    if (wasSummary && !isSummary) {
                      restoreCotAfterSummaryMode();
                    }
                  }
                });

                if (groupName === "special-mode") {
                  setModel("claude");
                }
              }

              if (groupName === "nsfw-suppress") {
                const nsfwDetails = btn.closest("details");
                const section = nsfwDetails ? nsfwDetails.parentElement : null;
                if (section) {
                  section.querySelectorAll(".toggle-btn").forEach((otherBtn) => {
                    if (otherBtn !== btn && otherBtn.classList.contains("is-on")) {
                      setButtonState(otherBtn, false, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
              }

              if (groupName === "claude-gemini-mutex") {
                // Turn ON all Claude buttons except 暗黑森林 and 小克破限
                const claudeList = pdoc.querySelector(`#${ID} .cat-list-1`);
                if (claudeList) {
                  claudeList.querySelectorAll(".toggle-btn").forEach((cBtn) => {
                    if (cBtn !== btn && !cBtn.classList.contains("is-on")) {
                      const kw = cBtn.getAttribute("data-kw") || "";
                      if (kw.includes("暗黑森林") || kw.includes("小克破限")) return;
                      setButtonState(cBtn, true, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
                // Turn OFF all Gemini buttons
                const geminiList = pdoc.querySelector(`#${ID} .cat-list-2`);
                if (geminiList) {
                  geminiList.querySelectorAll(".toggle-btn").forEach((gBtn) => {
                    if (gBtn.classList.contains("is-on")) {
                      setButtonState(gBtn, false, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
              }

              if (groupName === "gemini-claude-mutex") {
                // Turn ON all Gemini buttons except 哈基米越狱
                const geminiList = pdoc.querySelector(`#${ID} .cat-list-2`);
                if (geminiList) {
                  geminiList.querySelectorAll(".toggle-btn").forEach((gBtn) => {
                    if (gBtn !== btn && !gBtn.classList.contains("is-on")) {
                      const kw = gBtn.getAttribute("data-kw") || "";
                   if (kw.includes("哈基米越狱") || kw.includes("哈基米底部越狱") || kw.includes("纯爱系统") || kw.includes("防止超雄绝望") || kw.includes("防阴谋论") || kw.includes("友好世界") || kw.includes("友好@人间月下") || kw.includes("防空回哈基米") || kw.includes("防止截断哈基米")) return;
                      setButtonState(gBtn, true, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
                // Turn OFF all Claude buttons
                const claudeList = pdoc.querySelector(`#${ID} .cat-list-1`);
                if (claudeList) {
                  claudeList.querySelectorAll(".toggle-btn").forEach((cBtn) => {
                    if (cBtn.classList.contains("is-on")) {
                      setButtonState(cBtn, false, { skipRegex: true, skipScripts: true });
                    }
                  });
                }
              }

              setButtonState(btn, true);
              if (isEdit) {
                openEditModal(key);
              }
          
              if (syncGroupName) {
                pdoc.querySelectorAll(`.toggle-btn[data-sync-group="${syncGroupName}"]`).forEach((otherBtn) => {
                  if (otherBtn !== btn && !otherBtn.classList.contains("is-on")) {
                    setButtonState(otherBtn, true, { skipRegex: true, skipScripts: true });
                  }
                });
              }

              const linkTarget = getLinkTarget(key) || getLinkTarget(kw);
              if (linkTarget) syncToggle(linkTarget, true);

              if (isAiDialog) {
                closeCotForAiDialog();
              }

              if (isSummary) {
                closeCotForSummaryMode();
                toastr.info("已进入大总结模式，自动关闭思考模块");
              }
            }
          }
        });

        // ── 初始化状态检测 ──
        function initDetectState() {
          if (!isPmPanelOpen()) return;

          const on = (kw) => isKeyOn(kw);

          let currentModel = null;

          const modelHas = (key) => (MODEL_CONFIG[key] || []).length > 0 && (MODEL_CONFIG[key] || []).every((kw) => on(kw));

          const allKeys = getModelKeys({ includeHidden: true });
          for (const key of allKeys) {
            if (modelHas(key)) { currentModel = key; break; }
          }

          if (currentModel) {
            if (MODEL_META[currentModel] && !MODEL_META[currentModel]?.hidden) {
              setActiveModelButton(currentModel);
              savedModel = currentModel;
            } else {
              normalizeSavedModel();
              setActiveModelButton(savedModel);
            }
          }

          resolveButtonIds();

          pdoc.querySelectorAll(".toggle-btn").forEach((btn) => {
            if (btn.id === `${ID}-rec-toggle`) return;
            const key = resolveKey(btn);
            const hasRegexLinks = getLinkedRegexKeys(btn).length > 0;
            const hasScriptLinks = getLinkedScriptBindings(btn).length > 0;
            if (key || hasRegexLinks || hasScriptLinks) {
              const virtualControl = isVirtualControlButton(btn);
              if (!virtualControl) {
                const keyOn = key ? isButtonKeyOn(btn) : true;
                const regexOn = true;
                btn.classList.toggle("is-on", keyOn && regexOn);
              }
            }
          });
          refreshBindingBadges();
        }

        function buildNameIdMap() {
          const map = {};
          const list = getPmList() || pdoc;
          list.querySelectorAll("li[data-pm-identifier]").forEach((li) => {
            const id = li.getAttribute("data-pm-identifier");
            const name = li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
            if (name) map[name.trim()] = id;
          });
          if (Object.keys(map).length === 0) {
            pdoc.querySelectorAll("li[data-pm-identifier]").forEach((li) => {
              const id = li.getAttribute("data-pm-identifier");
              const name = li.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
              if (name) map[name.trim()] = id;
            });
          }
          return map;
        }

        function displayName(name) {
          let s = name;
          s = s.replace(/\/\/\s*COT\s*\/\//g, "COT ");
          s = s.replace(/^[^\p{L}\p{N}]*/gu, "");
          const atIdx = s.indexOf("@");
          if (atIdx > 0) s = s.substring(0, atIdx);
          return s.replace(/\s+/g, " ").trim() || name;
        }

        function resolveButtonIds() {
          const nameToId = buildNameIdMap();
          const idToName = buildIdNameMap();
          pdoc.querySelectorAll(".toggle-btn").forEach((btn) => {
            const existingId = btn.getAttribute("data-id");
            const kw = btn.getAttribute("data-kw");
            const isLocked = btn.getAttribute("data-locked") === "true";
            if (existingId) {
              const realName = idToName[existingId];
              if (realName && realName !== kw) {
                btn.setAttribute("data-kw", realName);
                const textEl = btn.querySelector(".menu-item-text");
                if (textEl && !isLocked) textEl.textContent = displayName(realName);
              } else if (!realName && kw) {
                const foundId = nameToId[kw.trim()];
                if (foundId) btn.setAttribute("data-id", foundId);
              }
            } else if (kw) {
              const foundId = nameToId[kw.trim()];
              if (foundId) {
                btn.setAttribute("data-id", foundId);
                const textEl = btn.querySelector(".menu-item-text");
                if (textEl && !isLocked) textEl.textContent = displayName(kw);
              }
            }
          });
        }

        // ── 原生 UI 操作的反向同步 (绝对可靠版 MutationObserver) ──
        const reverseSyncObserver = new MutationObserver((mutations) => {
          let shouldUpdate = false;
          for (const m of mutations) {
            if (
              m.type === "attributes" &&
              m.attributeName === "class" &&
              m.target.tagName === "LI" &&
              m.target.hasAttribute("data-pm-identifier")
            ) {
              shouldUpdate = true;
              break;
            }
            if (m.type === "childList" && (m.target.id === "completion_prompt_manager_list" || (m.target.classList && m.target.classList.contains("bai-bai-preset-vue-list-host")))) {
              shouldUpdate = true;
              break;
            }
          }
          if (shouldUpdate) {
            if (_orbSelfToggling) return;
            scheduleOrbSync(80);
          }
        });

        function attachReverseObserver() {
          let list = pdoc.getElementById("completion_prompt_manager_list") || getPmList();
          if (list && !list.dataset.orbObserved) {
            reverseSyncObserver.observe(list, { attributes: true, subtree: true, childList: true, attributeFilter: ["class"] });
            list.dataset.orbObserved = "true";
          }
          const vueHost = pdoc.querySelector(".bai-bai-preset-vue-list-host");
          if (vueHost && !vueHost.dataset.orbObserved) {
            reverseSyncObserver.observe(vueHost, { attributes: true, subtree: true, childList: true, attributeFilter: ["class"] });
            vueHost.dataset.orbObserved = "true";
          }
          if (vueHost) {
            const innerList = vueHost.querySelector("#completion_prompt_manager_list");
            if (innerList && !innerList.dataset.orbObserved) {
              reverseSyncObserver.observe(innerList, { attributes: true, subtree: true, childList: true, attributeFilter: ["class"] });
              innerList.dataset.orbObserved = "true";
            }
          }
        }

        // 捕获阶段拦截，应对ST可能的事件阻断和DOM重绘
        pdoc.addEventListener(
          "click",
          (e) => {
            attachReverseObserver();
            if (e.target.closest("#completion_prompt_manager_list") || e.target.closest(".bai-bai-preset-vue-list-host") || e.target.closest(".drawer-content")) {
              clearTimeout(pwin._orbSyncTimer);
              pwin._orbSyncTimer = setTimeout(initDetectState, 150);
            }
          },
          true,
        );

        pdoc.addEventListener(
          "change",
          (e) => {
            if (e.target.closest(".drawer-content") || e.target.tagName === "SELECT") {
              clearTimeout(pwin._orbSyncTimer);
              pwin._orbSyncTimer = setTimeout(() => {
                attachReverseObserver();
                initDetectState();
              }, 400);
            }
          },
          true,
        );

        let initDone = false;
        function tryInitDetect() {
          if (initDone) return;
          if (isPmPanelOpen()) {
            initDone = true;
            initDetectState();
            attachReverseObserver();
          } else {
            const vueHost = pdoc.querySelector(".bai-bai-preset-vue-list-host");
            if (vueHost) {
              setTimeout(tryInitDetect, 500);
            }
          }
        }
        setTimeout(tryInitDetect, 1200);
        setTimeout(tryInitDetect, 2500);
        setTimeout(tryInitDetect, 5000);
        // 监听预设面板出现 (适配BaiBai预设分组)
        let pmPanelObserverTimer = null;
        const pmPanelObserver = new MutationObserver(() => {
          if (!initDone && isPmPanelOpen()) tryInitDetect();
          clearTimeout(pmPanelObserverTimer);
          pmPanelObserverTimer = setTimeout(() => {
            attachReverseObserver();
          }, 300);
        });
        pmPanelObserver.observe(pdoc.body || pdoc.documentElement, { childList: true, subtree: true });

        // 监听 BaiBai 预设分组 Vue 宿主出现/替换
        let vueHostRetryCount = 0;
        const vueHostObserver = new MutationObserver(() => {
          const vueHost = pdoc.querySelector(".bai-bai-preset-vue-list-host");
          if (!vueHost) return;
          const innerList = vueHost.querySelector("#completion_prompt_manager_list");
          const liCount = vueHost.querySelectorAll("li[data-pm-identifier]").length;
          if (vueHost && !vueHost.dataset.orbObserved) {
            attachReverseObserver();
          }
          if (innerList && !innerList.dataset.orbObserved) {
            attachReverseObserver();
          }
          if (liCount > 0) {
            initDone = false;
            clearTimeout(pwin._orbSyncTimer);
            pwin._orbSyncTimer = setTimeout(function() {
              initDetectState();
              vueHostRetryCount = 0;
            }, 200);
          } else if (innerList && vueHostRetryCount < 10) {
            vueHostRetryCount++;
            clearTimeout(pwin._orbVueRetryTimer);
            pwin._orbVueRetryTimer = setTimeout(function() {
              var lc = vueHost.querySelectorAll("li[data-pm-identifier]").length;
              if (lc > 0) {
                initDone = false;
                initDetectState();
              }
            }, 300 * vueHostRetryCount);
          }
        });
        vueHostObserver.observe(pdoc.body || pdoc.documentElement, { childList: true, subtree: true });

        // ── UI 位置展开逻辑 ──
        function updateMenuDirection() {
          const orbX = parseInt(root.style.left, 10) || 0;
          const orbY = parseInt(root.style.top, 10) || 0;
          const menuH = 480;
          if (orbX < pwin.innerWidth / 2) {
            menu.style.left = "0";
            menu.style.right = "auto";
          } else {
            menu.style.left = "auto";
            menu.style.right = "0";
          }
          const spaceBelow = pwin.innerHeight - orbY - 60;
          if (spaceBelow < menuH && orbY > menuH / 2) {
            menu.style.top = "auto";
            menu.style.bottom = "52px";
            root.classList.add("open-up");
            menu.style.transformOrigin = orbX < pwin.innerWidth / 2 ? "bottom left" : "bottom right";
          } else {
            menu.style.top = "52px";
            menu.style.bottom = "auto";
            root.classList.remove("open-up");
            menu.style.transformOrigin = orbX < pwin.innerWidth / 2 ? "top left" : "top right";
          }
        }

        function toggle() {
          isOpen = !isOpen;
          if (isOpen) {
            updateMenuDirection();
            initDetectState();
            attachReverseObserver();
            // 默认展开所有大分组
            setTimeout(() => {
              root.querySelectorAll('.cat-list-0 > details, .cat-list-1 > details, .cat-list-2 > details').forEach(d => {
                d.open = true;
                d.setAttribute('open', 'true');
              });
            }, 80);
          } else {
            root.classList.remove("open-up");
          }
          root.classList.toggle("open", isOpen);
        }
        function close() {
          isOpen = true;
          toggle();
        }

        btnClose.addEventListener("click", (e) => {
          e.stopPropagation();
          close();
        });

        let drag = false,
          ox = 0,
          oy = 0,
          sx = 0,
          sy = 0,
          moved = false,
          dragMask = null;
        const DRAG_THRESHOLD = 4;
        function createMask() {
          removeMask();
          dragMask = pdoc.createElement("div");
          dragMask.id = `${ID}-drag-mask`;
          dragMask.style.cssText = "position:fixed;inset:0;z-index:2147483639;cursor:grabbing;background:transparent;";
          pdoc.body.appendChild(dragMask);
        }
        function removeMask() {
          dragMask?.remove();
          dragMask = null;
        }
        function startDrag(cx, cy) {
          drag = true;
          moved = false;
          sx = cx;
          sy = cy;
          const rect = root.getBoundingClientRect();
          ox = cx - rect.left;
          oy = cy - rect.top;
          root.style.transition = "none";
          createMask();
        }
        function moveDrag(cx, cy) {
          if (!drag) return;
          if (!moved && Math.abs(cx - sx) < DRAG_THRESHOLD && Math.abs(cy - sy) < DRAG_THRESHOLD) return;
          moved = true;
          root.style.left = `${Math.max(4, Math.min(cx - ox, pwin.innerWidth - 50))}px`;
          root.style.top = `${Math.max(4, Math.min(cy - oy, pwin.innerHeight - 50))}px`;
        }
        function endDrag() {
          if (!drag) return;
          drag = false;
          root.style.transition = "";
          removeMask();
          if (moved) savePos();
        }

        orb.addEventListener("mousedown", (e) => {
          startDrag(e.clientX, e.clientY);
          e.preventDefault();
        });
        head.addEventListener("mousedown", (e) => {
          if (e.target.id === `${ID}-close` || e.target.classList.contains("t-dot")) return;
          if (e.target.classList.contains("menu-title") && e.target.isContentEditable) return;
          startDrag(e.clientX, e.clientY);
          e.preventDefault();
        });
        parent.document.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
        parent.document.addEventListener("mouseup", () => endDrag());

        orb.addEventListener("click", () => {
          if (moved) {
            moved = false;
            return;
          }
          toggle();
        });

        orb.addEventListener(
          "touchstart",
          (e) => {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.stopPropagation();
          },
          { passive: true },
        );
        orb.addEventListener(
          "touchmove",
          (e) => {
            if (!drag) return;
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          },
          { passive: true },
        );
        orb.addEventListener(
          "touchend",
          (e) => {
            const wasMoved = moved;
            endDrag();
            if (!wasMoved) toggle();
            e.stopPropagation();
            e.preventDefault();
          },
          { passive: false },
        );

        head.addEventListener(
          "touchstart",
          (e) => {
            if (e.target.id === `${ID}-close` || e.target.classList.contains("t-dot")) return;
            if (e.target.classList.contains("menu-title") && e.target.isContentEditable) return;
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.stopPropagation();
          },
          { passive: true },
        );
        head.addEventListener(
          "touchmove",
          (e) => {
            if (!drag) return;
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          },
          { passive: true },
        );
        head.addEventListener(
          "touchend",
          (e) => {
            endDrag();
            e.stopPropagation();
          },
          { passive: true },
        );

        // ── 编辑模式逻辑 ──
        const editTrigger = pdoc.getElementById(`${ID}-edit-trigger`);
        let clickCount = 0;
        let clickTimer = null;

        function getUiVersionFromTitle(title) {
          const match = String(title || "").match(/V\s*(\d+(?:\.\d+)*)/i);
          return match ? `V${match[1]}` : "V6.0";
        }

        function getUiCacheKey(title) {
          return `orb${getUiVersionFromTitle(title)}_custom_ui`;
        }

        function getCurrentUiCacheKey() {
          const title = pdoc.querySelector(`#${ID}-head .menu-title`)?.innerText || "";
          return getUiCacheKey(title);
        }

        function cleanupLegacyUiCache() {
          const currentKey = getCurrentUiCacheKey();
          Object.keys(localStorage).forEach((key) => {
            if (/^orbV\d+(?:\.\d+)*_custom_ui$/.test(key)) {
              localStorage.removeItem(key);
            }
          });
          localStorage.removeItem("orbV6_custom_ui");
          // Also clear current version to always use latest template
          localStorage.removeItem(currentKey);
        }

    
        // 初始化保存的UI
        function loadSavedUI() {
          try {
            const saved = localStorage.getItem(getCurrentUiCacheKey());
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.title) pdoc.querySelector(`#${ID}-head .menu-title`).innerHTML = parsed.title;
          
              // DO NOT blindly overwrite the entire list. Preserve model section events.
              if (parsed.list) {
                const listEl = pdoc.querySelector(`#${ID} .menu-list`);
                listEl.innerHTML = parsed.list;
                listEl.querySelectorAll("[data-model-bound]").forEach((el) => el.removeAttribute("data-model-bound"));
                listEl.querySelectorAll("[data-rec-bound]").forEach((el) => el.removeAttribute("data-rec-bound"));
            
                // IF the cached layout doesn't have the rec-toggle (from older versions), inject it
                const modelSection = listEl.querySelector(`#${ID}-model-section .details-content`);
                if (modelSection && !modelSection.querySelector(`#${ID}-rec-toggle`)) {
                   const recWrapper = pdoc.createElement("div");
                   recWrapper.className = "grid-toggles col-1";
                   recWrapper.style.marginTop = "6px";
                   recWrapper.innerHTML = `
                     <div class="menu-item-toggle toggle-btn" id="${ID}-rec-toggle" style="display:none; justify-content: center; background: rgba(232, 176, 114, 0.05); border-color: rgba(232, 176, 114, 0.2);">
                       <div class="menu-item-text" style="font-size: 12px; font-weight: bold; color: #e8b072;">开启推荐条目</div>
                       <div class="toggle-led"></div>
                     </div>
                   `;
                   modelSection.appendChild(recWrapper);
                }

                renderModelSegments();
                attachModelEventHandlers();
                attachRecToggleHandler();
              }
          
              pdoc.querySelectorAll(`#${ID} [contenteditable]`).forEach(el => el.removeAttribute("contenteditable"));
            }
          } catch (e) {}
        }
        loadSavedUI();
        ensureMissingPresetButtons();
        renderModelSegments();
        attachModelEventHandlers();
        attachRecToggleHandler();

        // ── 三分类Tab栏过滤逻辑 ──
        function initCategoryTabs() {
          const tabBar = pdoc.getElementById(`${ID}-category-tabs`);
          if (!tabBar) return;
          let activeCat = 0;
          const tabs = tabBar.querySelectorAll('.category-tab');
          const catLists = [
            pdoc.querySelector(`#${ID} .cat-list-0`),
            pdoc.querySelector(`#${ID} .cat-list-1`),
            pdoc.querySelector(`#${ID} .cat-list-2`),
          ];
          function applyFilter(cat) {
            catLists.forEach((el, i) => { if (el) el.style.display = (i === cat) ? '' : 'none'; });
          }
          tabs.forEach((tab) => {
            tab.addEventListener('click', (e) => {
              e.stopPropagation();
              const cat = parseInt(tab.getAttribute('data-cat'));
              if (cat === activeCat) return;
              tabs.forEach((t) => t.classList.remove('active'));
              tab.classList.add('active');
              activeCat = cat;
              applyFilter(activeCat);
            });
          });
          applyFilter(activeCat);
        }
        initCategoryTabs();
        function saveCurrentUI() {
          const titleHTML = pdoc.querySelector(`#${ID}-head .menu-title`).innerHTML;
          const listClone = pdoc.querySelector(`#${ID} .menu-list`).cloneNode(true);
          listClone.querySelectorAll("[data-model-bound]").forEach((el) => el.removeAttribute("data-model-bound"));
          listClone.querySelectorAll("[data-rec-bound]").forEach((el) => el.removeAttribute("data-rec-bound"));
          const listHTML = listClone.innerHTML;
          const cacheKey = getUiCacheKey(pdoc.querySelector(`#${ID}-head .menu-title`)?.innerText || titleHTML);
          localStorage.setItem(cacheKey, JSON.stringify({ title: titleHTML, list: listHTML }));
          Object.keys(localStorage).forEach((key) => {
            if (/^orbV\d+(?:\.\d+)*_custom_ui$/.test(key) && key !== cacheKey) {
              localStorage.removeItem(key);
            }
          });
          if (cacheKey !== "orbV6_custom_ui") localStorage.removeItem("orbV6_custom_ui");
          toastr.success("悬浮窗布局已保存", "保存成功");
        }

        function readObjectPath(rootObj, path) {
          return path.reduce((obj, key) => obj?.[key], rootObj);
        }

        function collectPresetSyncSources() {
          const sources = [];
          const seen = new Set();
          const addSource = (value) => {
            if (typeof value !== "string") return;
            if (!value.includes(ID) || !value.includes('class="menu-list"')) return;
            if (seen.has(value)) return;
            seen.add(value);
            sources.push(value);
          };
          const scan = (value, depth = 0, visited = new Set()) => {
            if (depth > 8 || value == null) return;
            if (typeof value === "string") {
              addSource(value);
              return;
            }
            if (typeof value !== "object" || visited.has(value)) return;
            visited.add(value);
            if (Array.isArray(value)) {
              value.forEach((item) => scan(item, depth + 1, visited));
              return;
            }
            for (const child of Object.values(value)) scan(child, depth + 1, visited);
          };

          const roots = [
            readObjectPath(_bridge, ["st", "oai_settings", "extensions", "tavern_helper", "scripts"]),
            readObjectPath(_bridge, ["st", "oai_settings", "extensions"]),
            readObjectPath(pwin, ["oai_settings", "extensions", "tavern_helper", "scripts"]),
            readObjectPath(pwin, ["oai_settings", "extensions"]),
            readObjectPath(pwin, ["extension_settings", "tavern_helper"]),
          ];
          roots.forEach((rootValue) => scan(rootValue));

          try {
            pdoc.querySelectorAll("textarea, input, [contenteditable='true'], [contenteditable='plaintext-only']").forEach((el) => {
              addSource(el.value || el.textContent || "");
            });
          } catch (_) {}

          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key || !/tavern|helper|script|preset|orb|xiaobing|冰块/i.test(key)) continue;
              addSource(localStorage.getItem(key) || "");
            }
          } catch (_) {}

          return sources;
        }

        function extractPresetShell(source) {
          const titleMatch = source.match(/<div class="menu-title">([\s\S]*?)<\/div>/);
          const listMatch = source.match(/(<div class="menu-list">)([\s\S]*?)(\s*<\/div>\s*<div class="menu-foot">)/);
          if (!listMatch) return null;
          return {
            title: titleMatch ? titleMatch[1] : "",
            list: listMatch[2].trim(),
          };
        }

        function applyPresetShell(shellData) {
          const titleEl = pdoc.querySelector(`#${ID}-head .menu-title`);
          const listEl = pdoc.querySelector(`#${ID} .menu-list`);
          if (!listEl || !shellData?.list) return false;
          if (titleEl && shellData.title) titleEl.innerHTML = shellData.title;
          listEl.innerHTML = shellData.list;
          listEl.querySelectorAll("[data-model-bound]").forEach((el) => el.removeAttribute("data-model-bound"));
          listEl.querySelectorAll("[data-rec-bound]").forEach((el) => el.removeAttribute("data-rec-bound"));
          pdoc.querySelectorAll(`#${ID} [contenteditable]`).forEach((el) => el.removeAttribute("contenteditable"));
          initCategoryTabs();
          renderModelSegments();
          attachModelEventHandlers();
          attachRecToggleHandler();
          initDetectState();
          refreshBindingBadges();
          saveCurrentUI();
          return true;
        }

        function syncFromPresetFloatingWindow() {
          const sources = collectPresetSyncSources();
          for (const source of sources) {
            const shellData = extractPresetShell(source);
            if (shellData && applyPresetShell(shellData)) {
              toastr.success("已同步当前预设里的悬浮窗布局", "同步完成");
              return true;
            }
          }
          toastr.warning("没有找到可同步的预设悬浮窗。请先导入/启用小冰块预设，或打开酒馆助手脚本页后再同步。");
          return false;
        }

        pwin.__xiaobingkuai_syncFromPreset = syncFromPresetFloatingWindow;
        window.__xiaobingkuai_syncFromPreset = syncFromPresetFloatingWindow;

        function jsStringLiteral(value) {
          return JSON.stringify(String(value)).slice(1, -1).replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
        }

        function collectExportListHtml() {
          const listClone = pdoc.querySelector(`#${ID} .menu-list`).cloneNode(true);
          listClone.querySelectorAll(".edit-tools, .layout-subgroup-tools").forEach((el) => el.remove());
          listClone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
          listClone.querySelectorAll(".toggle-btn").forEach((el) => {
            el.removeAttribute("draggable");
            el.classList.remove("edit-tools-wrap");
          });
          const modelSectionClone = listClone.querySelector(`#${ID}-model-section`);
          if (modelSectionClone) modelSectionClone.style.display = "";
          listClone.querySelectorAll("[data-model-bound]").forEach((el) => el.removeAttribute("data-model-bound"));
          listClone.querySelectorAll("[data-rec-bound]").forEach((el) => el.removeAttribute("data-rec-bound"));
          return listClone.innerHTML;
        }

        function collectExportConfig() {
          return {
            regexBindings: normalizeRegexBindings(REGEX_BINDINGS),
            scriptBindings: normalizeScriptBindings(SCRIPT_BINDINGS),
            modelConfig: MODEL_CONFIG,
            modelRecConfig: MODEL_REC_CONFIG,
            modelMeta: MODEL_META,
            currentTheme,
            savedModel,
          };
        }

        function replaceRootTemplateShell(source, titleText, listHtml) {
          const escapedTitle = jsStringLiteral(titleText);
          let next = source.replace(/<div class="menu-title">[\s\S]*?<\/div>/, () => `<div class="menu-title">${escapedTitle}</div>`);
          next = next.replace(/(<span[^>]*id="\$\{ID\}-edit-trigger"[^>]*>)[\s\S]*?(<\/span>)/, (m, p1, p2) => `${p1}${escapedTitle}${p2}`);
          return next.replace(/(<div class="menu-list">)[\s\S]*?(\s*<\/div>\s*<div class="menu-foot">)/, (m, p1, p2) => `${p1}\n${listHtml}\n        ${p2}`);
        }

        function replaceExportConfig(source, config) {
          const configText = JSON.stringify(config, null, 6)
            .replace(/`/g, "\\`")
            .replace(/\$\{/g, "\\${");
          return source.replace(/const ORB_EXPORTED_CONFIG = [\s\S]*?;\r?\n\s*function cloneExportConfig/, () => `const ORB_EXPORTED_CONFIG = ${configText};\n    function cloneExportConfig`);
        }

        function getSourceFromDom() {
          if (document.currentScript?.textContent?.includes("ORB_EXPORTED_CONFIG")) return document.currentScript.textContent;
          try {
            const scripts = Array.from(pdoc.querySelectorAll("script"));
            const current = scripts.map((script) => script.textContent || "").find((text) => text.includes("ORB_EXPORTED_CONFIG") && text.includes("function replaceRootTemplateShell"));
            if (current) return current;
          } catch (_) {}
          return null;
        }

        let __orbPickInputRef = null;
        function pickSourceFile() {
          return new Promise((resolve, reject) => {
            const doc = pdoc || document;
            const input = doc.createElement("input");
            __orbPickInputRef = input;
            input.type = "file";
            input.accept = ".js,text/javascript,text/plain";
            input.style.position = "fixed";
            input.style.top = "0";
            input.style.left = "0";
            input.style.width = "1px";
            input.style.height = "1px";
            input.style.opacity = "0";
            input.style.zIndex = "2147483647";
            let settled = false;
            const finish = (fn, arg) => {
              if (settled) return;
              settled = true;
              try { input.remove(); } catch (_) {}
              __orbPickInputRef = null;
              fn(arg);
            };
            const handleFiles = () => {
              const file = input.files && input.files[0];
              if (!file) {
                finish(reject, new Error("未选择源脚本文件，已取消导出"));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result || "");
                if (!text.includes("ORB_EXPORTED_CONFIG") || !text.includes("function replaceRootTemplateShell")) {
                  finish(reject, new Error("选择的源脚本不是当前新版框架，请选择最新版悬浮窗源 JS"));
                  return;
                }
                finish(resolve, text);
              };
              reader.onerror = () => finish(reject, new Error("读取源脚本文件失败"));
              reader.readAsText(file, "utf-8");
            };
            input.addEventListener("change", handleFiles);
            input.addEventListener("input", handleFiles);
            (doc.body || doc.documentElement).appendChild(input);
            toastr.info("请选择当前最新版悬浮窗源 JS 作为导出框架");
            input.click();
          });
        }

        async function buildFullExportScript(sourceText) {
          const source = sourceText || getSourceFromDom();
          if (!source) throw new Error("无法读取当前脚本源码，请改用导出文件或重新执行最新版脚本后再导出");
          const currentTitle = pdoc.querySelector(`#${ID} .menu-title`)?.innerText || "小冰块V3.31双适配版";
        cleanupLegacyUiCache();
        // 每次加载都清空旧缓存，使用最新布局
        Object.keys(localStorage).forEach((key) => { if (/^orbV\d+(?:\.\d+)*_custom_ui$/.test(key)) localStorage.removeItem(key); });
        if (localStorage.getItem("orbV6_custom_ui")) localStorage.removeItem("orbV6_custom_ui");
          saveCurrentUI();
          const html = collectExportListHtml();
          const config = collectExportConfig();
          const withUi = replaceRootTemplateShell(source, currentTitle, html);
          const withConfig = replaceExportConfig(withUi, config);
          return withConfig
            .replace(/let currentTheme = ".*?";/, () => `let currentTheme = "${jsStringLiteral(currentTheme)}";`)
            .replace(/let savedModel = ".*?";/, () => `let savedModel = "${jsStringLiteral(savedModel)}";`);
        }

        function copyTextToClipboard(text) {
          const fallbackCopy = (value) => {
            const ta = pdoc.createElement("textarea");
            ta.value = value;
            ta.style.position = "fixed";
            ta.style.top = "-9999px";
            pdoc.body.appendChild(ta);
            ta.select();
            try {
              pdoc.execCommand("copy");
              toastr.success("代码已复制！<br>请直接把剪贴板的内容覆盖到你的 .js 脚本文件中！");
            } catch (e) {
              toastr.error("复制失败，请使用导出文件功能");
            }
            pdoc.body.removeChild(ta);
          };
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => toastr.success("代码已复制！<br>请直接把剪贴板的内容覆盖到你的 .js 脚本文件中！")).catch(() => fallbackCopy(text));
          } else {
            fallbackCopy(text);
          }
        }

        function downloadFullScript(text) {
          const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = pdoc.createElement("a");
          a.href = url;
          a.download = "酒馆助手脚本-小冰块V3.31双适配版悬浮窗_定制版.js";
          a.click();
          URL.revokeObjectURL(url);
          toastr.success("已下载完整 .js 脚本文件，可直接替换原有脚本");
        }

        const searchModal = pdoc.getElementById(`${ID}-search-modal`);
        const searchInput = pdoc.getElementById(`${ID}-search-input`);
        const searchResults = pdoc.getElementById(`${ID}-search-results`);
        let targetGroupForAdd = null;

        pdoc.getElementById(`${ID}-search-close`).addEventListener("click", () => {
          root.classList.remove("search-active");
        });

        function populateSearch(query) {
          const q = query.toLowerCase().trim();
          searchResults.innerHTML = "";
      
          const list = getPmList() || pdoc;
          const promptItems = Array.from(list.querySelectorAll("li[data-pm-identifier]"));
      
          promptItems.forEach(el => {
            const kw = el.querySelector("[data-pm-name]")?.getAttribute?.("data-pm-name") ?? "";
            if (!kw) return;
            if (!q || kw.toLowerCase().includes(q)) {
              const div = pdoc.createElement("div");
              div.className = "search-item";
              div.textContent = kw;
              div.addEventListener("click", () => {
                if (targetGroupForAdd) {
                   const newBtn = pdoc.createElement("div");
                   newBtn.className = "menu-item-toggle toggle-btn";
                   newBtn.setAttribute("data-kw", kw);
               
                   // 去除常见的前缀符号（如 emoji 或特定特殊符号），保留文字部分
                   let pureText = kw.replace(/^[\s\p{Emoji}\u200B-\u23FF\u25A0-\u26FF\u2700-\u27BF\u2800-\u28FF\u2900-\u297F\u2B00-\u2BFF\u{1F000}-\u{1F9FF}\u2B50\u25FE\u25FD\u2B1B\u2B1C\u00A9\u00AE\u2122\u23F3\u24C2\u23E9\u231A\u231B\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FD\u25FE\u2600-\u26FF\u2700-\u27BF\u2934\u2935\u2B05\u2B06\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299\uFE0F\u200D❌✅❎❗⁉️‼️⚠️]+(?=\S)/gu, '');
                   if (!pureText) pureText = kw; // 如果全被替换掉了，还是用原文本

                   newBtn.innerHTML = `<div class="menu-item-text" contenteditable="plaintext-only">${pureText}</div><div class="toggle-led"></div>`;
               
                   const tools = pdoc.createElement("div");
                   tools.className = "edit-tools";
                   tools.innerHTML = `<div class="drag-handle" draggable="true" title="拖动排序" style="cursor: move; font-size:12px; margin-right:2px; opacity: 0.7;">↕</div><button class="edit-btn link-btn" title="联动/互斥">🔗</button><button class="edit-btn binding-btn" title="绑定正则/酒馆助手脚本">绑</button><button class="edit-btn lock" title="锁定名称">🔓</button><button class="edit-btn del" title="删除">×</button>`;
                   newBtn.appendChild(tools);
               
                   let container = targetGroupForAdd.classList?.contains("layout-subgroup") ? targetGroupForAdd.querySelector(":scope > .grid-toggles") : targetGroupForAdd.querySelector(":scope > .grid-toggles");
                   if (!container) {
                     container = pdoc.createElement("div");
                     container.className = "grid-toggles col-2";
                     targetGroupForAdd.insertBefore(container, targetGroupForAdd.firstChild);
                   }
                   container.appendChild(newBtn);
                }
                root.classList.remove("search-active");
                searchInput.value = "";
              });
              searchResults.appendChild(div);
            }
          });
        }

        searchInput.addEventListener("input", () => populateSearch(searchInput.value));

        function toggleEditMode() {
          pwin.orbEditMode = !pwin.orbEditMode;
          if (pwin.orbEditMode) {
            root.classList.add("edit-mode");
            ensureLayoutSubgroupTools();
            toastr.info("已进入编辑模式");
        
            pdoc.querySelector(`#${ID}-head .menu-title`).setAttribute("contenteditable", "plaintext-only");
            pdoc.querySelectorAll(`#${ID} summary`).forEach(summary => {
               // 如果没有包裹过 summary-text，就包裹一下，方便分别控制拖拽和编辑
               if (!summary.querySelector('.summary-text')) {
                   const originalHTML = summary.innerHTML;
                   // 这里要注意避免把由于编辑模式生成的 ::after 等也包裹进去，
                   // 但 innerHTML 通常不含 ::after，如果是文本就直接包
                   summary.innerHTML = `<span class="summary-text">${originalHTML}</span><span class="drag-handle-group" draggable="true" title="按住拖动排序分组">↕</span>`;
               }
            });
        
            pdoc.querySelectorAll(`#${ID} summary .summary-text, #${ID} .menu-item-text`).forEach(el => {
              el.setAttribute("contenteditable", "plaintext-only");
            });
        
            pdoc.querySelectorAll(`#${ID} .toggle-btn`).forEach(btn => {
              let tools = btn.querySelector(".edit-tools");
              if (tools) tools.remove();
              tools = pdoc.createElement("div");
              tools.className = "edit-tools";
          
              // Disable edit mode tools for the Recommended item toggle
              if (btn.id === `${ID}-rec-toggle`) {
                 tools.innerHTML = `<button class="edit-btn model-cfg-btn" title="配置核心模型">⚙️配置推荐条目</button>`;
                 btn.appendChild(tools);
                 return;
              }

              const isLocked = btn.getAttribute("data-locked") === "true";
              const regexCount = getSavedRegexBinding(btn).length;
              const scriptCount = getSavedScriptBinding(btn).length;
              const bindingCount = regexCount + scriptCount;
              syncButtonBadges(btn);
              tools.innerHTML = `<div class="drag-handle" draggable="true" title="拖动排序" style="cursor: move; font-size:12px; margin-right:2px; opacity: 0.7;">↕</div><button class="edit-btn link-btn" title="联动/互斥">🔗</button><button class="edit-btn binding-btn" title="绑定正则/酒馆助手脚本">绑${bindingCount || ''}</button><button class="edit-btn lock" title="锁定名称">${isLocked ? '🔒' : '🔓'}</button><button class="edit-btn del" title="删除">×</button>`;
              btn.appendChild(tools);
            });
            requestAnimationFrame(refreshEditToolWrap);

            pdoc.querySelectorAll(`#${ID} details > .details-content`).forEach(content => {
              // Disable group edit tools for the Model section
              if (content.closest('details')?.id === `${ID}-model-section`) {
                 let tools = content.querySelector(":scope > .edit-tools-group");
                 if (tools) tools.remove();
                 tools = pdoc.createElement("div");
                 tools.className = "edit-tools edit-tools-group";
                 tools.style.marginTop = "4px";
                 tools.style.marginBottom = "4px";
                 const detailsEl = content.closest('details');
                 const isHidden = detailsEl && detailsEl.classList.contains("hidden-group");
                 tools.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                   <div></div>
                   <div style="display:flex; gap: 4px;">
                     <button class="edit-btn model-cfg-btn">⚙️ 核心模型配置</button><button class="edit-btn model-module-btn">🧩 模块管理</button><button class="edit-btn hide-grp" title="隐藏本组">${isHidden ? '👁️ 恢复显示' : '👁️‍🗨️ 隐藏本组'}</button>
                   </div>
                 </div>`;
                 content.appendChild(tools);
             
                 // Make sure the model text spans are NOT editable
                 content.querySelectorAll(".sexy-seg-label, .menu-item-text").forEach(el => {
                    el.removeAttribute("contenteditable");
                 });
             
                 return;
              }

              let tools = content.querySelector(":scope > .edit-tools-group");
              if (tools) tools.remove();
              tools = pdoc.createElement("div");
              tools.className = "edit-tools edit-tools-group";
              tools.style.marginTop = "4px";
              tools.style.marginBottom = "4px";
              const detailsEl = content.closest('details');
              const isHidden = detailsEl && detailsEl.classList.contains("hidden-group");
              tools.innerHTML = `<div class="group-tool-row">
                <div class="group-tool-cluster"><button class="edit-btn col-set" data-col="1">1列</button><button class="edit-btn col-set" data-col="2">2列</button><button class="edit-btn col-set" data-col="3">3列</button></div>
                <div class="group-tool-cluster">
                   <button class="edit-btn grp-behavior" data-behavior="mutex" title="互斥（单选）">单选</button>
                   <button class="edit-btn grp-behavior" data-behavior="sync" title="同步（全开/全关）">同步</button>
                   <button class="edit-btn grp-behavior" data-behavior="none" title="无特殊行为">无</button>
                </div>
              </div>
              <div class="group-action-row"><button class="edit-btn add">➕ 添加条目</button><button class="edit-btn add-layout-subgroup">▦ 小分组</button><button class="edit-btn add-sub">➕ 新增子分组</button><button class="edit-btn hide-grp" title="隐藏本组">${isHidden ? '👁️ 恢复显示' : '👁️‍🗨️ 隐藏本组'}</button><button class="edit-btn del">🗑️ 删除本组</button></div>`;
              content.insertBefore(tools, content.firstChild);
            });
        
            const menuList = pdoc.querySelector(`#${ID} .menu-list`);
            let mainTools = menuList.querySelector(":scope > .edit-tools-main");
            if (mainTools) mainTools.remove();
            mainTools = pdoc.createElement("div");
            mainTools.className = "edit-tools edit-tools-main";
            mainTools.style.marginTop = "8px";
            mainTools.innerHTML = `
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button class="edit-btn add" style="flex:1">➕ 新增分组</button>
            </div>
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button class="edit-btn export-clip" style="flex:1;">📥 提取排版(剪贴板)</button>
              <button class="edit-btn export-file" style="flex:1;">📥 提取排版(文件)</button>
            </div>
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button class="edit-btn del" style="flex:2">🔄 恢复默认UI(清空缓存)</button>
              <button class="edit-btn save-ui" style="flex:1; border-color: rgba(50,205,50,0.4); color: #7ee787;">💾 保存布局</button>
            </div>`;
            menuList.appendChild(mainTools);

          } else {
            root.classList.remove("edit-mode");
            pdoc.querySelectorAll(`#${ID} .toggle-btn.edit-tools-wrap`).forEach((btn) => btn.classList.remove("edit-tools-wrap"));
            toastr.info("已退出编辑模式并保存");
            pdoc.querySelectorAll(`#${ID} [contenteditable]`).forEach(el => el.removeAttribute("contenteditable"));
            resolveButtonIds();
            saveCurrentUI();
          }
        }

        if (editTrigger) {
          editTrigger.addEventListener("click", () => {
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 3) {
              toggleEditMode();
              clickCount = 0;
            } else {
              clickTimer = setTimeout(() => { clickCount = 0; }, 400);
            }
          });
        }

        pdoc.getElementById(`${ID}-menu`).addEventListener("click", (e) => {
          if (!pwin.orbEditMode) return;
      
          const btn = e.target.closest(".edit-btn");
          if (!btn) return;
      
          if (btn.classList.contains("del")) {
             if (btn.closest(".edit-tools-main")) {
               if (confirm("确定要恢复默认UI吗？这会刷新整个悬浮窗。")) {
                 localStorage.removeItem(getCurrentUiCacheKey());
                 localStorage.removeItem("orbV6_custom_ui");
                 Object.keys(localStorage).forEach((key) => {
                   if (/^orbV\d+(?:\.\d+)*_custom_ui$/.test(key)) localStorage.removeItem(key);
                 });
                 localStorage.removeItem("orbV6_model_config");
                 localStorage.removeItem("orbV6_model_meta");
                 localStorage.removeItem("orbV6_model_rec_config");
                 localStorage.removeItem("orbV6_regex_bindings");
                 localStorage.removeItem("orbV6_script_bindings");
                 REGEX_BINDINGS = {};
                 SCRIPT_BINDINGS = {};
                 refreshBindingBadges();
                 pdoc.getElementById(ID)?.remove();
                 pdoc.getElementById(`${ID}-style`)?.remove();
                 toastr.info("已清空所有缓存，请重新打开面板脚本");
               }
             } else if (btn.closest(".edit-tools-group")) {
               if (confirm("确定删除这个分组？")) {
                 btn.closest("details").remove();
               }
             } else if (btn.classList.contains("del-subgroup")) {
               if (confirm("确定删除这个小分组？里面的条目会移回上一级。")) {
                 const subgroup = btn.closest(".layout-subgroup");
                 const parent = subgroup?.parentNode;
                 const grid = subgroup?.querySelector(":scope > .grid-toggles");
                 if (subgroup && parent && grid) {
                   Array.from(grid.children).forEach((child) => parent.insertBefore(child, subgroup));
                   subgroup.remove();
                 }
               }
             } else {
               btn.closest(".toggle-btn").remove();
             }
          } else if (btn.classList.contains("lock")) {
             const toggleBtn = btn.closest(".toggle-btn");
             const isLocked = toggleBtn.getAttribute("data-locked") === "true";
             if (isLocked) {
               toggleBtn.removeAttribute("data-locked");
               btn.textContent = "🔓";
               toastr.info("已解除名称锁定");
             } else {
               toggleBtn.setAttribute("data-locked", "true");
               btn.textContent = "🔒";
               toastr.info("条目名称已锁定");
             }
          } else if (btn.classList.contains("save-ui")) {
             resolveButtonIds();
             saveCurrentUI();
          } else if (btn.classList.contains("model-cfg-btn")) {
             e.stopPropagation();
             showModelConfigModal();
          } else if (btn.classList.contains("model-module-btn")) {
             e.stopPropagation();
             showModelModuleManagerModal();
          } else if (btn.classList.contains("binding-btn")) {
             e.stopPropagation();
             const toggleBtn = btn.closest(".toggle-btn");
             if (toggleBtn) openBindingPicker(toggleBtn);
          } else if (btn.classList.contains("regex-btn")) {
             e.stopPropagation();
             const toggleBtn = btn.closest(".toggle-btn");
             if (toggleBtn) openBindingPicker(toggleBtn, "regex");
          } else if (btn.classList.contains("script-btn")) {
             e.stopPropagation();
             const toggleBtn = btn.closest(".toggle-btn");
             if (toggleBtn) openBindingPicker(toggleBtn, "script");
          } else if (btn.classList.contains("link-btn")) {
             const toggleBtn = btn.closest(".toggle-btn");
             const currentGroup = toggleBtn.getAttribute("data-group") || "";
             const currentSync = toggleBtn.getAttribute("data-sync-group") || "";
             let promptMsg = `请输入该条目的联动或互斥ID。\n相同互斥ID的条目只能单选。\n相同联动ID的条目会全开全关。\n格式: m:你的ID (互斥) 或 s:你的ID (联动)\n留空取消设置。`;
             let defaultVal = "";
             if (currentGroup) defaultVal = "m:" + currentGroup;
             else if (currentSync) defaultVal = "s:" + currentSync;
         
             const res = prompt(promptMsg, defaultVal);
             if (res !== null) {
               toggleBtn.removeAttribute("data-group");
               toggleBtn.removeAttribute("data-sync-group");
               const val = res.trim();
               if (val.startsWith("m:")) {
                 toggleBtn.setAttribute("data-group", val.substring(2).trim());
                 toastr.success("已设置为互斥条目: " + val.substring(2).trim());
                 syncButtonBadges(toggleBtn);
                 requestAnimationFrame(refreshEditToolWrap);
               } else if (val.startsWith("s:")) {
                 toggleBtn.setAttribute("data-sync-group", val.substring(2).trim());
                 toastr.success("已设置为联动条目: " + val.substring(2).trim());
                 syncButtonBadges(toggleBtn);
                 requestAnimationFrame(refreshEditToolWrap);
               } else if (val === "") {
                 toastr.info("已清除联动/互斥属性");
                 syncButtonBadges(toggleBtn);
                 requestAnimationFrame(refreshEditToolWrap);
               } else {
                 toastr.warning("格式错误，需以 m: 或 s: 开头");
               }
             }
          } else if (btn.classList.contains("hide-grp")) {
             const detailsEl = btn.closest("details");
             if (detailsEl) {
                 const isHidden = detailsEl.classList.contains("hidden-group");
                 if (isHidden) {
                     detailsEl.classList.remove("hidden-group");
                     btn.textContent = "👁️‍🗨️ 隐藏本组";
                     toastr.info("该分组已恢复显示");
                 } else {
                     detailsEl.classList.add("hidden-group");
                     btn.textContent = "👁️ 恢复显示";
                     toastr.warning("该分组已隐藏（退出编辑模式后不可见）");
                 }
             }
          } else if (btn.classList.contains("add-layout-subgroup")) {
             const detailsContent = btn.closest(".details-content");
             if (detailsContent) {
               const subgroup = createLayoutSubgroup("2");
               detailsContent.appendChild(subgroup);
               toastr.success("已新增仅编辑页可见的小分组");
             }
          } else if (btn.classList.contains("move-existing-item")) {
             const subgroup = btn.closest(".layout-subgroup");
             if (subgroup) openMoveExistingPicker(subgroup);
          } else if (btn.classList.contains("add-sub-item")) {
             const subgroup = btn.closest(".layout-subgroup");
             if (subgroup) {
               targetGroupForAdd = subgroup;
               root.classList.add("search-active");
               searchInput.value = "";
               populateSearch("");
               searchInput.focus();
             }
          } else if (btn.classList.contains("add")) {
             if (btn.closest(".edit-tools-main")) {
                const details = pdoc.createElement("details");
                details.innerHTML = `<summary><span class="summary-text" contenteditable="plaintext-only">新建分组</span><span class="drag-handle-group" draggable="true" title="按住拖动排序分组">↕</span></summary><div class="details-content"><div class="edit-tools edit-tools-group" style="margin-top: 4px; margin-bottom: 4px;"><div class="group-tool-row">
                <div class="group-tool-cluster"><button class="edit-btn col-set" data-col="1">1列</button><button class="edit-btn col-set" data-col="2">2列</button><button class="edit-btn col-set" data-col="3">3列</button></div><div class="group-tool-cluster"><button class="edit-btn grp-behavior" data-behavior="mutex" title="互斥（单选）">单选</button><button class="edit-btn grp-behavior" data-behavior="sync" title="同步（全开/全关）">同步</button><button class="edit-btn grp-behavior" data-behavior="none" title="无特殊行为">无</button></div>
              </div>
              <div class="group-action-row"><button class="edit-btn add">➕ 添加条目</button><button class="edit-btn add-layout-subgroup">▦ 小分组</button><button class="edit-btn add-sub">➕ 新增子分组</button><button class="edit-btn hide-grp" title="隐藏本组">👁️‍🗨️ 隐藏本组</button><button class="edit-btn del">🗑️ 删除本组</button></div></div></div>`;
                const menuList = pdoc.querySelector(`#${ID} .menu-list`);
                menuList.insertBefore(details, btn.closest(".edit-tools-main"));
             } else if (btn.closest(".edit-tools-group")) {
                targetGroupForAdd = btn.closest(".details-content");
                root.classList.add("search-active");
                searchInput.value = "";
                populateSearch("");
                searchInput.focus();
             }
          } else if (btn.classList.contains("add-sub")) {
             const detailsContent = btn.closest(".details-content");
             const details = pdoc.createElement("details");
             details.className = "nested-details";
             details.innerHTML = `<summary><span class="summary-text" contenteditable="plaintext-only">新建子分组</span><span class="drag-handle-group" draggable="true" title="按住拖动排序分组">↕</span></summary><div class="details-content"><div class="edit-tools edit-tools-group" style="margin-top: 4px; margin-bottom: 4px;"><div class="group-tool-row">
                <div class="group-tool-cluster"><button class="edit-btn col-set" data-col="1">1列</button><button class="edit-btn col-set" data-col="2">2列</button><button class="edit-btn col-set" data-col="3">3列</button></div><div class="group-tool-cluster"><button class="edit-btn grp-behavior" data-behavior="mutex" title="互斥（单选）">单选</button><button class="edit-btn grp-behavior" data-behavior="sync" title="同步（全开/全关）">同步</button><button class="edit-btn grp-behavior" data-behavior="none" title="无特殊行为">无</button></div>
              </div>
              <div class="group-action-row"><button class="edit-btn add">➕ 添加条目</button><button class="edit-btn add-sub">➕ 新增子分组</button><button class="edit-btn hide-grp" title="隐藏本组">👁️‍🗨️ 隐藏本组</button><button class="edit-btn del">🗑️ 删除本组</button></div></div></div>`;
             detailsContent.appendChild(details);
          } else if (btn.classList.contains("save-ui")) {
             toggleEditMode(); // 调用 toggleEditMode 退出并保存
          } else if (btn.classList.contains("sub-col-set")) {
             const col = btn.getAttribute("data-col");
             const subgroup = btn.closest(".layout-subgroup");
             const grid = subgroup?.querySelector(":scope > .grid-toggles");
             if (grid) {
               grid.classList.remove("col-1", "col-2", "col-3");
               grid.classList.add(`col-${col}`);
               toastr.info(`小分组已设置为 ${col} 列布局`);
             }
          } else if (btn.classList.contains("col-set")) {
             const col = btn.getAttribute("data-col");
             const detailsContent = btn.closest(".details-content");
             if (detailsContent) {
               detailsContent.querySelectorAll(":scope > .grid-toggles").forEach(grid => {
                 grid.classList.remove("col-1", "col-2", "col-3");
                 grid.classList.add(`col-${col}`);
               });
               toastr.info(`已设置为 ${col} 列布局`);
             }
          } else if (btn.classList.contains("grp-behavior")) {
             const behavior = btn.getAttribute("data-behavior");
             const detailsContent = btn.closest(".details-content");
             if (detailsContent) {
               const toggles = detailsContent.querySelectorAll(":scope > .grid-toggles > .toggle-btn");
               if (toggles.length > 0) {
                 const groupId = "group_" + Math.random().toString(36).substr(2, 6);
                 toggles.forEach(t => {
                   t.removeAttribute("data-group");
                   t.removeAttribute("data-sync-group");
               
                   if (behavior === "mutex") {
                     t.setAttribute("data-group", groupId);
                   } else if (behavior === "sync") {
                     t.setAttribute("data-sync-group", groupId);
                   }
                 });
             
                 let msg = "已取消该组特殊行为";
                 if (behavior === "mutex") msg = "已设置为互斥（单选）";
                 else if (behavior === "sync") msg = "已设置为同步（全开/全关）";
                 toastr.success(msg);
               } else {
                 toastr.warning("该组内没有条目，无法设置行为");
               }
             }
          } else if (btn.classList.contains("hide-grp")) {
             const detailsEl = btn.closest('details');
             if (detailsEl) {
               detailsEl.classList.toggle("hidden-group");
               if (detailsEl.classList.contains("hidden-group")) {
                 btn.innerHTML = "👁️ 恢复显示";
                 toastr.info("该分组在正常模式下将被隐藏（常用于仅显示已选中的条目）");
               } else {
                 btn.innerHTML = "👁️‍🗨️ 隐藏本组";
                 toastr.info("已取消隐藏");
               }
             }
          } else if (btn.classList.contains("export-clip") || btn.classList.contains("export-file")) {
             const wantClip = btn.classList.contains("export-clip");
             const runExport = (sourceText) => {
               buildFullExportScript(sourceText).then((fullJs) => {
                 if (wantClip) copyTextToClipboard(fullJs);
                 else downloadFullScript(fullJs);
               }).catch((err) => {
                 console.error("[orb] 导出失败", err);
                 toastr.error(err?.message || "导出失败，请重新执行最新版脚本后再试");
               });
             };
             const domSource = getSourceFromDom();
             if (domSource) {
               runExport(domSource);
             } else {
               pickSourceFile().then(runExport).catch((err) => {
                 console.error("[orb] 导出取源失败", err);
                 toastr.error(err?.message || "未选择源脚本文件，已取消导出");
               });
             }
             return;
          }
        });

        pdoc.getElementById(`${ID}-menu`).addEventListener("click", (e) => {
          if (pwin.orbEditMode && e.target.tagName.toLowerCase() === "summary") {
            if (e.offsetX > e.target.offsetWidth - 30) return; // 允许点击最右侧折叠/展开
            e.preventDefault();
          }
        });

        // ── 拖拽排序逻辑 (条目与分组) ──
        let draggedItem = null;
        let draggedGroup = null;
        let draggedSubgroup = null;
        const menuEl = pdoc.getElementById(`${ID}-menu`);
    
        menuEl.addEventListener("dragstart", (e) => {
          if (!pwin.orbEditMode) return;
      
          const groupHandle = e.target.closest(".drag-handle-group");
          if (groupHandle) {
             const targetGroup = groupHandle.closest("details");
             if (targetGroup) {
               draggedGroup = targetGroup;
               e.dataTransfer.effectAllowed = "move";
               setTimeout(() => targetGroup.style.opacity = "0.4", 0);
             }
             return;
          }

          const subgroupHandle = e.target.closest(".drag-handle-subgroup");
          if (subgroupHandle) {
             const targetSubgroup = subgroupHandle.closest(".layout-subgroup");
             if (targetSubgroup) {
               draggedSubgroup = targetSubgroup;
               e.dataTransfer.effectAllowed = "move";
               setTimeout(() => targetSubgroup.style.opacity = "0.4", 0);
             }
             return;
          }
      
          const handle = e.target.closest(".drag-handle");
          if (!handle) {
              e.preventDefault();
              return;
          }
          const target = handle.closest(".toggle-btn");
          if (target) {
            draggedItem = target;
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => target.style.opacity = "0.4", 0);
          }
        });

        menuEl.addEventListener("dragend", (e) => {
          if (!pwin.orbEditMode) return;
          if (draggedGroup) {
             draggedGroup.style.opacity = "1";
             draggedGroup = null;
          }
          if (draggedSubgroup) {
             draggedSubgroup.style.opacity = "1";
             draggedSubgroup = null;
          }
          if (draggedItem) {
            draggedItem.style.opacity = "1";
            draggedItem = null;
          }
        });

        menuEl.addEventListener("dragover", (e) => {
          if (!pwin.orbEditMode) return;
      
          if (draggedGroup) {
             e.preventDefault();
             e.dataTransfer.dropEffect = "move";
             const targetGroup = e.target.closest("details");
             if (targetGroup && targetGroup !== draggedGroup) {
                // 防止将父分组拖入子分组
                if (draggedGroup.contains(targetGroup)) return;
                // 确保它们在同一个容器下 (兄弟节点)
                if (targetGroup.parentNode === draggedGroup.parentNode) {
                   const rect = targetGroup.getBoundingClientRect();
                   const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                   targetGroup.parentNode.insertBefore(draggedGroup, next ? targetGroup.nextSibling : targetGroup);
                }
             }
             return;
          }

          if (draggedSubgroup) {
             e.preventDefault();
             e.dataTransfer.dropEffect = "move";
             const targetSub = e.target.closest(".layout-subgroup");
             const targetGrid = e.target.closest(".grid-toggles");
             const container = draggedSubgroup.parentNode;
             if (targetSub && targetSub !== draggedSubgroup && targetSub.parentNode === container) {
                const rect = targetSub.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                container.insertBefore(draggedSubgroup, next ? targetSub.nextSibling : targetSub);
             } else if (targetGrid && !targetGrid.closest(".layout-subgroup") && targetGrid.closest(".details-content") === container) {
                const rect = targetGrid.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                container.insertBefore(draggedSubgroup, next ? targetGrid.nextSibling : targetGrid);
             }
             return;
          }
      
          if (draggedItem) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const targetGridOnly = e.target.closest(".layout-subgroup > .grid-toggles");
            if (targetGridOnly && !targetGridOnly.contains(draggedItem)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              targetGridOnly.appendChild(draggedItem);
              return;
            }
            const targetSubgroup = e.target.closest(".layout-subgroup");
            if (targetSubgroup && !targetSubgroup.contains(draggedItem)) {
              const grid = targetSubgroup.querySelector(":scope > .grid-toggles");
              if (grid) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                grid.appendChild(draggedItem);
                return;
              }
            }
            const targetBtn = e.target.closest(".toggle-btn");
            if (targetBtn && targetBtn !== draggedItem) {
              const targetGrid = targetBtn.closest(".grid-toggles");
              if (!targetGrid) return;
              if (draggedItem.parentNode !== targetGrid) targetGrid.appendChild(draggedItem);
              const rect = targetBtn.getBoundingClientRect();
              const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
              targetBtn.parentNode.insertBefore(draggedItem, next ? targetBtn.nextSibling : targetBtn);
            }
          }
        });


        window.addEventListener("pagehide", () => {
          pdoc.getElementById(ID)?.remove();
          pdoc.getElementById(`${ID}-style`)?.remove();
        });
        window.addEventListener("unload", () => {
          pdoc.getElementById(ID)?.remove();
          pdoc.getElementById(`${ID}-style`)?.remove();
        });

  } catch (err) {
    console.error('[小冰块悬浮窗] 初始化失败:', err);
  }

  // 返回清理函数
  return function cleanup() {
    const ID = "th-orb-v6-custom";
    document.getElementById(ID)?.remove();
    document.getElementById(ID + "-style")?.remove();
    delete window.__xiaobingkuai_syncFromPreset;
    delete window.__xiaobingkuai_bridge;
  };
}
