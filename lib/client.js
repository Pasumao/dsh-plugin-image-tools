window.__ModuleLoader__.load({
  id: 'dsh-plugin-image-tools',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var react_jsx_runtime = require('react/jsx-runtime');
    var react = require('react');
    var jsx = react_jsx_runtime.jsx;
    var jsxs = react_jsx_runtime.jsxs;
    var Fragment = react_jsx_runtime.Fragment;

    // ------------------------------------------------------------------
    // 样式：一次注入 <style>，类名 dshpick-*，全部走主题 CSS 变量。
    // ------------------------------------------------------------------
    var CSS = [
      '.dshpick-frame{padding:14px calc(var(--dsh-composer-side-clearance, 16px) + 16px) 12px;justify-content:center;display:flex}',
      '.dshpick-card{width:100%;max-width:var(--dsh-chat-content-width, 748px);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);background:var(--dsw-specific-input-major);max-height:min(70vh,620px);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:20px;flex-direction:column;padding:0 0 10px;display:flex;overflow:hidden}',
      '.dshpick-card,.dshpick-card *{box-sizing:border-box}',
      '.dshpick-header{flex-shrink:0;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 16px 0 24px;display:flex}',
      '.dshpick-headingBlock{min-width:0}',
      '.dshpick-eyebrow{color:var(--dsw-alias-label-tertiary);margin-bottom:5px;font-size:11px;line-height:16px}',
      '.dshpick-title{margin:0;font-size:16px;font-weight:500;line-height:22px}',
      '.dshpick-detail{margin:0 2px 8px 24px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}',
      '.dshpick-iconButton{width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;place-items:center;padding:0;display:grid}',
      '.dshpick-iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshpick-iconButton:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}',
      '.dshpick-body{overscroll-behavior:contain;flex-direction:column;flex:auto;min-height:0;display:flex;overflow-y:auto}',
      '.dshpick-grid{flex-direction:column;gap:1px;margin:8px 0 0;padding:4px 24px;display:flex}',
      '.dshpick-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;padding:10px 24px 4px}',
      '.dshpick-cardBtn{position:relative;min-width:0;color:inherit;text-align:left;cursor:pointer;background:var(--dsw-specific-input-major);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:14px;padding:0;overflow:hidden;display:flex;flex-direction:column;transition:border-color .12s ease,background .12s ease}',
      '.dshpick-cardBtn:hover:not(:disabled){border-color:var(--dsw-alias-interactive-bg-active);background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshpick-cardBtn:disabled{cursor:default;opacity:.6}',
      '.dshpick-cardBtn.dshpick-selected{border-color:var(--dsw-alias-interactive-bg-active);background:var(--dsw-alias-interactive-bg-hover);outline:2px solid var(--dsw-alias-interactive-bg-active);outline-offset:0}',
      '.dshpick-thumb{position:relative;width:100%;aspect-ratio:1/1;background:var(--dsw-alias-interactive-bg-hover);border:none;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:zoom-in}',
      '.dshpick-thumb:focus-visible{outline:2px solid var(--dsw-alias-interactive-bg-active);outline-offset:-2px}',
      '.dshpick-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
      '.dshpick-thumb .dshpick-thumbFallback{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px;padding:8px;text-align:center;overflow:hidden}',
      '.dshpick-zoomHint{position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:999px;background:rgba(8,10,18,.55);color:#fff;place-items:center;display:grid;pointer-events:none;opacity:0;transition:opacity .12s ease;z-index:1}',
      '.dshpick-thumb:hover .dshpick-zoomHint,.dshpick-thumb:focus-visible .dshpick-zoomHint{opacity:1}',
      '.dshpick-cardBtn:focus-visible{outline:2px solid var(--dsw-alias-interactive-bg-active);outline-offset:2px}',
      '.dshpick-check{position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:999px;background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary-inverted);place-items:center;display:none;font-size:12px;line-height:1;z-index:1}',
      '.dshpick-cardBtn.dshpick-selected .dshpick-check{display:grid}',
      '.dshpick-cardCopy{padding:8px 10px 10px;min-width:0}',
      '.dshpick-optionLabel{font-size:13px;font-weight:500;line-height:18px;overflow-wrap:anywhere}',
      '.dshpick-badge{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-primary);font-size:10px;line-height:14px;vertical-align:1px}',
      '.dshpick-description{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px;overflow-wrap:anywhere}',
      '.dshpick-option{width:100%;min-height:40px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:10px;align-items:center;gap:10px;padding:8px 12px;display:flex}',
      '.dshpick-option:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshpick-option:disabled{cursor:default}',
      '.dshpick-option.dshpick-optionSelected{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshpick-number{width:24px;height:24px;flex-shrink:0;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:999px;place-items:center;display:grid;font-size:12px;line-height:1}',
      '.dshpick-checkbox{width:18px;height:18px;flex-shrink:0;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;place-items:center;display:grid}',
      '.dshpick-checkboxChecked{background:var(--dsw-alias-interactive-bg-active);border-color:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary-inverted)}',
      '.dshpick-optionCopy{flex:auto;min-width:0}',
      '.dshpick-optionLine{flex-direction:column;display:flex}',
      '.dshpick-customRow{width:100%;min-height:40px;align-items:center;gap:10px;padding:8px 12px;display:flex}',
      '.dshpick-customInput{flex:auto;min-width:0;color:inherit;background:0 0;border:none;outline:none;font-size:14px;line-height:22px}',
      '.dshpick-customInput::placeholder{color:var(--dsw-alias-label-tertiary)}',
      '.dshpick-customTextarea{width:100%;margin:8px 0 0;resize:none;color:inherit;background:var(--dsw-alias-interactive-bg-hover);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:10px;outline:none;padding:8px 10px;font-size:14px;line-height:22px;font-family:inherit}',
      '.dshpick-customTextarea:focus{border-color:var(--dsw-alias-interactive-bg-active)}',
      '.dshpick-footer{flex-shrink:0;justify-content:space-between;align-items:center;gap:12px;padding:8px 16px 0;display:flex}',
      '.dshpick-pager{flex-shrink:0;align-items:center;gap:6px;display:flex}',
      '.dshpick-progress{color:var(--dsw-alias-label-secondary);white-space:nowrap;word-spacing:-2px;padding:0 4px;font-size:14px;font-weight:500;line-height:24px}',
      '.dshpick-feedback{min-height:16px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px;flex:auto;padding:0 8px}',
      '.dshpick-footerActions{flex-shrink:0;align-items:center;gap:12px;display:flex}',
      '.dshpick-btn{appearance:none;cursor:pointer;border-radius:999px;border:1px solid transparent;font-size:13px;line-height:20px;padding:5px 14px;font-family:inherit}',
      '.dshpick-btn:disabled{cursor:default;opacity:.55}',
      '.dshpick-btn-outline{background:0 0;border-color:var(--dsw-alias-border-l2-darkmode-thin);color:var(--dsw-alias-label-primary)}',
      '.dshpick-btn-outline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshpick-btn-primary{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary-inverted)}',
      '.dshpick-btn-primary:hover:not(:disabled){filter:brightness(1.08)}',
      '.dshpick-lightbox{position:fixed;inset:0;z-index:9999;background:rgba(8,10,18,.86);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:52px 24px 28px;cursor:zoom-out;overflow:hidden}',
      '.dshpick-lightboxClose{position:absolute;top:16px;right:18px;width:34px;height:34px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;place-items:center;display:grid;font-size:16px;line-height:1;padding:0;z-index:2}',
      '.dshpick-lightboxClose:hover{background:rgba(255,255,255,.18)}',
      '.dshpick-lightboxFigure{margin:0;max-width:min(92vw,1100px);display:flex;flex-direction:column;align-items:center;gap:10px;transform-origin:0 0;will-change:transform;cursor:zoom-in}',
      '.dshpick-lightboxFigure.dshpick-grabbing{cursor:grabbing;user-select:none}',
      '.dshpick-lightboxFigure img{max-width:100%;max-height:82vh;object-fit:contain;border-radius:8px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.5);cursor:inherit}',
      '.dshpick-zoomBar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:2;display:flex;align-items:center;gap:2px;padding:4px 6px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:999px;background:rgba(8,10,18,.72);box-shadow:0 4px 16px rgba(0,0,0,.35)}',
      '.dshpick-zoomBtn{width:28px;height:28px;border:none;border-radius:999px;background:transparent;color:#fff;cursor:pointer;display:grid;place-items:center;padding:0;font-size:15px;line-height:1}',
      '.dshpick-zoomBtn:hover{background:rgba(255,255,255,.16)}',
      '.dshpick-zoomPct{min-width:46px;text-align:center;color:#fff;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}',
      '.dshpick-lightboxCap{color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:center;overflow-wrap:anywhere}',
      '.dshpick-lightboxCap small{display:block;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:15px;margin-top:2px}',
      '.dshimg-inline{max-width:min(100%,560px);max-height:420px;width:auto;height:auto;border-radius:14px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);background:var(--dsw-alias-interactive-bg-hover);margin:8px 0;display:block;cursor:zoom-in;object-fit:contain}',
      '.dshimg-inline[data-failed]{opacity:.45;cursor:default;filter:grayscale(1)}',
      '.dshimg-zoom{cursor:zoom-in}',
      '@media (width<=720px){.dshpick-card{border-radius:16px}.dshpick-cards{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}.dshpick-lightbox{padding:44px 12px 20px}}'
    ].join('');
    var tagId = 'dsh-plugin-image-tools/pick.module.css';
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      var tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-plugin-image-tools';
      tag.dataset.pluginCss = tagId;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ------------------------------------------------------------------
    // detail 标记解析（与服务端 buildPickMarker 对应；标记 JSON 为 ASCII）
    // ------------------------------------------------------------------
    var MARKER_PREFIX = '<!--dsh-pick:v1:';
    var MARKER_SUFFIX = '-->';

    function decodeBase64Url(value) {
      var b64 = value.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      var binary = atob(b64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    }

    /** 解析 detail 标记；无标记返回 null。 */
    function parseMarker(detail) {
      if (typeof detail !== 'string' || !detail.startsWith(MARKER_PREFIX)) return null;
      var end = detail.indexOf(MARKER_SUFFIX, MARKER_PREFIX.length);
      if (end < 0) return null;
      try {
        var data = JSON.parse(decodeBase64Url(detail.slice(MARKER_PREFIX.length, end)));
        if (data === null || typeof data !== 'object' || typeof data.pickId !== 'string') return null;
        var images = Array.isArray(data.images) ? data.images.filter(function (n) { return Number.isInteger(n) && n >= 0; }) : [];
        return { pickId: data.pickId, images: images, human: detail.slice(end + MARKER_SUFFIX.length) };
      } catch (e) {
        return null;
      }
    }

    /** 去掉 label 末尾的推荐标注，返回展示文本与是否推荐（答案值保持原 label）。 */
    function parseRecommendedLabel(label) {
      var suffix = /\s*(?:\((?:recommended|推荐)\)|（(?:recommended|推荐)）)\s*$/i;
      return suffix.test(label)
        ? { label: label.replace(suffix, ''), recommended: true }
        : { label: label, recommended: false };
    }

    /** 输入法组合中不触发回车提交。 */
    function isComposing(event) {
      return event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
    }

    // ------------------------------------------------------------------
    // 待答载体（与服务端回答协议一致；同 PendingQuestion 的 wire 编码）
    // ------------------------------------------------------------------
    var PendingChoice = class {
      constructor(wait) { this.wait = wait; }
      get key() { return this.wait.key; }
      get questions() { return this.wait.payload.questions; }
      async answer(answer) {
        var receipt = await this.wait.respond({ ok: true, value: { sessionId: this.wait.sessionId, answer: answer } });
        if (!receipt.accepted) throw new Error('question response rejected: ' + receipt.reason);
      }
      async cancel() {
        var receipt = await this.wait.respond({
          ok: false,
          error: { code: 'cancelled', message: 'the user closed this question request', details: {} }
        });
        if (!receipt.accepted) throw new Error('question cancellation rejected: ' + receipt.reason);
      }
    };

    // ------------------------------------------------------------------
    // 选项渲染
    // ------------------------------------------------------------------
    function recommendedBadge(display, t) {
      return display.recommended ? jsx('span', { className: 'dshpick-badge', children: t('option.recommended') }) : null;
    }

    /** 放大查看的放大镜图标（inline SVG，作为 zoomHint 内容）。 */
    var ZOOM_ICON_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

    /**
     * 图片卡片选项。
     * 结构（合法 HTML，无嵌套 button）：
     *   div[role=radio|checkbox]（整卡可点选中，Enter/Space 同效）
     *     └ button.dshpick-thumb（点击放大查看，焦点独立）
     *     └ div.dshpick-cardCopy（label/描述）
     */
    function ImageCardBtn(props) {
      var pickId = props.pickId;
      var option = props.option;
      var optionIndex = props.optionIndex;
      var selected = props.selected;
      var multi = props.multi;
      var disabled = props.disabled;
      var t = props.t;
      var display = parseRecommendedLabel(option.label);
      var failed = react.useState(false);
      var failedState = failed[0];
      var setFailed = failed[1];
      var src = '/dsh-plugin-image-tools/' + pickId + '/' + optionIndex;
      var onSelect = function () {
        if (disabled) return;
        props.onSelect();
      };
      var onKeyDown = function (event) {
        if (disabled || event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          props.onSelect();
        }
      };
      return jsxs('div', {
        className: 'dshpick-cardBtn' + (selected ? ' dshpick-selected' : ''),
        role: multi ? 'checkbox' : 'radio',
        'aria-checked': selected,
        'aria-label': display.label,
        'aria-disabled': disabled,
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: onKeyDown,
        children: [
          jsxs('button', {
            type: 'button',
            className: 'dshpick-thumb',
            'aria-label': failedState ? t('image.failed') : t('image.zoom') + '：' + display.label,
            title: t('image.zoom'),
            disabled: disabled,
            onClick: function (event) {
              event.stopPropagation();
              if (!failedState) props.onZoom();
            },
            children: [
              failedState
                ? jsx('div', { className: 'dshpick-thumbFallback', children: t('image.failed') })
                : jsx('img', {
                    src: src,
                    alt: display.label,
                    loading: 'lazy',
                    onError: function () { setFailed(true); }
                  }),
              jsx('span', { className: 'dshpick-zoomHint', 'aria-hidden': 'true', dangerouslySetInnerHTML: { __html: ZOOM_ICON_SVG } }),
              selected && jsx('span', { className: 'dshpick-check', 'aria-hidden': 'true', children: '\u2713' })
            ]
          }),
          jsxs('div', {
            className: 'dshpick-cardCopy',
            children: [
              jsxs('div', { className: 'dshpick-optionLabel', children: [display.label, recommendedBadge(display, t)] }),
              option.description !== void 0 && jsx('div', { className: 'dshpick-description', children: option.description })
            ]
          })
        ]
      }, optionIndex);
    }

    /** 纯文字选项行（与原生 UI 一致的样式）。 */
    function TextOptionRow(props) {
      var option = props.option;
      var optionIndex = props.optionIndex;
      var selected = props.selected;
      var multi = props.multi;
      var disabled = props.disabled;
      var t = props.t;
      var display = parseRecommendedLabel(option.label);
      return jsxs('button', {
        type: 'button',
        className: 'dshpick-option' + (selected && !multi ? ' dshpick-optionSelected' : ''),
        role: multi ? 'checkbox' : 'radio',
        'aria-checked': selected,
        'aria-label': display.label,
        disabled: disabled,
        onClick: function () { props.onClick(); },
        onKeyDown: props.onKeyDown,
        children: [
          multi
            ? jsx('span', {
                className: 'dshpick-checkbox' + (selected ? ' dshpick-checkboxChecked' : ''),
                'aria-hidden': 'true',
                children: selected ? '\u2713' : null
              })
            : jsx('span', { className: 'dshpick-number', children: optionIndex + 1 }),
          jsxs('span', {
            className: 'dshpick-optionCopy',
            children: [
              jsxs('span', {
                className: 'dshpick-optionLine',
                children: [
                  jsxs('span', { className: 'dshpick-optionLabel', children: [display.label, recommendedBadge(display, t)] }),
                  option.description !== void 0 && jsx('span', { className: 'dshpick-description', children: option.description })
                ]
              })
            ]
          })
        ]
      }, optionIndex);
    }

    // ------------------------------------------------------------------
    // 图片放大查看（Lightbox）：全屏遮罩 + 大图 + 关闭按钮 / Esc / 点遮罩
    // ------------------------------------------------------------------
    /**
     * 图片放大查看层。zoom 为 null 时渲染 null。
     * 打开期间：锁定 body 滚动、焦点移到关闭按钮、Esc 关闭；
     * 关闭时恢复滚动并把焦点还给触发按钮（触发按钮 ref 由父级持有，这里不处理）。
     * 支持滚轮/按钮缩放、双击切换 1x/2.5x、放大后拖拽平移（与命令式
     * openImageZoom 同一套缩放参数与样式）。
     * @param {object} props - { zoom: { src, label, description? }|null, onClose, t }。
     */
    function Lightbox(props) {
      var zoom = props.zoom;
      var onClose = props.onClose;
      var t = props.t;
      var closeRef = react.useRef(null);
      var overlayRef = react.useRef(null);
      var figureRef = react.useRef(null);
      var imgRef = react.useRef(null);
      var stateRef = react.useRef({ scale: 1, tx: 0, ty: 0 });
      var pctState = react.useState('100%');
      var pct = pctState[0];
      var setPct = pctState[1];
      var labels = react.useMemo(zoomLabels, []);
      var apiRef = react.useRef({ zoomBy: function () {}, zoomTo: function () {} });

      function viewSize() {
        return { viewW: window.innerWidth, viewH: window.innerHeight };
      }
      function currentBase() {
        var img = imgRef.current;
        var nw = img === null ? 0 : img.naturalWidth;
        var nh = img === null ? 0 : img.naturalHeight;
        if (!nw || !nh) return null;
        var view = viewSize();
        return fitBaseSize(nw, nh, view.viewW, view.viewH);
      }
      function applyZoom() {
        var state = stateRef.current;
        var figure = figureRef.current;
        if (figure === null) return;
        var base = currentBase();
        if (base === null) {
          figure.style.transform = '';
          return;
        }
        var pan = clampPan(state.tx, state.ty, state.scale, base, viewSize());
        state.tx = pan.tx;
        state.ty = pan.ty;
        figure.style.transform = (state.scale === 1 && state.tx === 0 && state.ty === 0)
          ? ''
          : 'translate(' + state.tx + 'px,' + state.ty + 'px) scale(' + state.scale + ')';
        setPct(Math.round(state.scale * 100) + '%');
      }
      function zoomBy(factor, clientX, clientY) {
        var state = stateRef.current;
        var base = currentBase();
        if (base === null) return;
        var view = viewSize();
        var nextScale = clampZoom(state.scale * factor);
        if (nextScale === state.scale) return;
        var bx = (view.viewW - base.w0) / 2;
        var by = (view.viewH - base.h0) / 2;
        var cx, cy;
        if (clientX === void 0) {
          cx = state.tx + (base.w0 * state.scale) / 2;
          cy = state.ty + (base.h0 * state.scale) / 2;
        } else {
          cx = clientX - bx;
          cy = clientY - by;
        }
        var next = zoomTranslate(state.tx, state.ty, state.scale, nextScale, cx, cy);
        state.tx = next.tx;
        state.ty = next.ty;
        state.scale = nextScale;
        applyZoom();
      }
      function zoomTo(target) {
        zoomBy(target / stateRef.current.scale);
      }
      apiRef.current = { zoomBy: zoomBy, zoomTo: zoomTo };

      react.useEffect(function () {
        if (zoom === null) return;
        var previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        var focusTarget = closeRef.current;
        if (focusTarget !== null && typeof focusTarget.focus === 'function') focusTarget.focus();
        var overlay = overlayRef.current;
        var figure = figureRef.current;
        function onWheel(event) {
          if (event.cancelable) event.preventDefault();
          apiRef.current.zoomBy(wheelZoomFactor(event.deltaY), event.clientX, event.clientY);
        }
        var drag = null;
        function onPointerDown(event) {
          var state = stateRef.current;
          if (state.scale <= 1.01) return;
          drag = { x: event.clientX, y: event.clientY, tx: state.tx, ty: state.ty };
          if (figure !== null) figure.classList.add('dshpick-grabbing');
          if (figure !== null && typeof figure.setPointerCapture === 'function') figure.setPointerCapture(event.pointerId);
          event.preventDefault();
        }
        function onPointerMove(event) {
          var state = stateRef.current;
          if (drag === null || figure === null) return;
          state.tx = drag.tx + (event.clientX - drag.x);
          state.ty = drag.ty + (event.clientY - drag.y);
          applyZoom();
        }
        function onPointerUp() {
          if (drag === null) return;
          drag = null;
          if (figure !== null) figure.classList.remove('dshpick-grabbing');
        }
        function onDoubleClick(event) {
          var state = stateRef.current;
          event.preventDefault();
          if (state.scale > 1.01) apiRef.current.zoomTo(1);
          else apiRef.current.zoomBy(2.5, event.clientX, event.clientY);
        }
        function onKeyDown(event) {
          if (event.key === 'Escape') onClose();
          else if (event.key === '+' || event.key === '=') { event.preventDefault(); apiRef.current.zoomBy(1.25); }
          else if (event.key === '-' || event.key === '_') { event.preventDefault(); apiRef.current.zoomBy(1 / 1.25); }
          else if (event.key === '0') { event.preventDefault(); apiRef.current.zoomTo(1); }
        }
        document.addEventListener('keydown', onKeyDown);
        if (overlay !== null) overlay.addEventListener('wheel', onWheel, { passive: false });
        if (figure !== null) {
          figure.addEventListener('pointerdown', onPointerDown);
          figure.addEventListener('pointermove', onPointerMove);
          figure.addEventListener('pointerup', onPointerUp);
          figure.addEventListener('pointercancel', onPointerUp);
          figure.addEventListener('dblclick', onDoubleClick);
        }
        // 视口变化（含 Ctrl+滚轮引起的浏览器页面缩放）时重新推导基准并重新钳制平移
        window.addEventListener('resize', applyZoom);
        return function () {
          document.body.style.overflow = previous;
          document.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('resize', applyZoom);
          if (overlay !== null) overlay.removeEventListener('wheel', onWheel);
          if (figure !== null) {
            figure.removeEventListener('pointerdown', onPointerDown);
            figure.removeEventListener('pointermove', onPointerMove);
            figure.removeEventListener('pointerup', onPointerUp);
            figure.removeEventListener('pointercancel', onPointerUp);
            figure.removeEventListener('dblclick', onDoubleClick);
          }
        };
      }, [zoom, onClose, setPct]);

      if (zoom === null) return null;
      return jsxs('div', {
        ref: overlayRef,
        className: 'dshpick-lightbox',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': zoom.label,
        onClick: onClose,
        children: [
          jsx('button', {
            type: 'button',
            ref: closeRef,
            className: 'dshpick-lightboxClose',
            'aria-label': t('image.close'),
            title: t('image.close'),
            onClick: function (event) { event.stopPropagation(); onClose(); },
            children: '\u2715'
          }),
          jsxs('figure', {
            ref: figureRef,
            className: 'dshpick-lightboxFigure',
            onClick: function (event) { event.stopPropagation(); },
            children: [
              jsx('img', { ref: imgRef, src: zoom.src, alt: zoom.label }),
              jsxs('figcaption', {
                className: 'dshpick-lightboxCap',
                children: [
                  zoom.label,
                  zoom.description !== void 0 && jsx('small', { children: zoom.description })
                ]
              })
            ]
          }),
          jsxs('div', {
            className: 'dshpick-zoomBar',
            onClick: function (event) { event.stopPropagation(); },
            children: [
              jsx('button', {
                type: 'button',
                className: 'dshpick-zoomBtn',
                'aria-label': labels.out,
                title: labels.out,
                onClick: function () { apiRef.current.zoomBy(1 / 1.25); },
                children: '\u2212'
              }),
              jsx('span', { className: 'dshpick-zoomPct', children: pct }),
              jsx('button', {
                type: 'button',
                className: 'dshpick-zoomBtn',
                'aria-label': labels.in,
                title: labels.in,
                onClick: function () { apiRef.current.zoomBy(1.25); },
                children: '+'
              }),
              jsx('button', {
                type: 'button',
                className: 'dshpick-zoomBtn',
                'aria-label': labels.reset,
                title: labels.reset,
                onClick: function () { apiRef.current.zoomTo(1); },
                children: '\u21BA'
              })
            ]
          })
        ]
      });
    }

    // ------------------------------------------------------------------
    // 聊天栏图片放大增强：聊天栏里显示的图片都支持点击放大——包括插件自己的
    // show/attachment 图片（markdown 里是绝对 URL，注意不能用 src^= 前缀匹配），
    // 以及模型回复 markdown 渲染出的任意 http(s) 图片。核心渲染器原生显示
    // <img>，这里通过 MutationObserver 发现图片做渐进增强（加样式类/悬停提示），
    // 点击统一走 document 级事件委托（isZoomableChatImage 判定），放大复用
    // .dshpick-lightbox 样式（命令式 DOM，不依赖 React）。
    // 纯 DOM 单节点变更：不插入/移除 React 管理的结构，重渲染时安全。
    // ------------------------------------------------------------------
    var IMAGE_SHOW_PREFIX = '/dsh-plugin-image-tools/show/';
    var IMAGE_TOKEN_PREFIX = 'dshimg:';
    var ATTACHMENT_PREFIX = '/dsh-plugin-image-tools/attachment/';
    /** 聊天消息列容器（dsh-client-ui-conversation ChatView 的稳定语义属性）。 */
    var CHAT_FLOW_SELECTOR = '[data-chat-flow]';
    var ZOOM_CLOSE_LABEL = (typeof document !== 'undefined' && (document.documentElement.lang || '').toLowerCase().indexOf('zh') === 0)
      ? '\u5173\u95ed'
      : 'Close';

    /** 是否为插件内嵌图片的 src（纯字符串判定，供冒烟测试）。 */
    function isShowImageSrc(src) {
      return typeof src === 'string' && src.indexOf(IMAGE_SHOW_PREFIX) >= 0;
    }

    /** 是否插件图片服务路由的 src（show 内嵌或 attachment 回显，含绝对 URL）。 */
    function isPluginImageSrc(src) {
      return typeof src === 'string' && (src.indexOf(IMAGE_SHOW_PREFIX) >= 0 || src.indexOf(ATTACHMENT_PREFIX) >= 0);
    }

    /** 从文本里提取 dshimg: 占位符的 attachmentId（纯函数，供冒烟测试）。 */
    function extractImageTokenIds(text) {
      if (typeof text !== 'string') return [];
      var seen = {};
      var ids = [];
      var re = new RegExp(IMAGE_TOKEN_PREFIX + '([A-Za-z0-9_-]{8,})', 'g');
      var m;
      while ((m = re.exec(text)) !== null) {
        if (seen[m[1]] === void 0) {
          seen[m[1]] = true;
          ids.push(m[1]);
        }
      }
      return ids;
    }

    /** 文本节点扫描去重表：node → 上次扫描到的 nodeValue（React 原位更新文本时重新扫描）。 */
    var scannedTexts = typeof WeakMap === 'undefined' ? null : new WeakMap();

    /**
     * 把文本节点里的 dshimg:<id> 占位符替换为图片元素（盲模型收图回显）。
     * 点击放大交给 document 级委托处理，这里只建图并做加载失败降级。
     * 只做文本节点级替换，不触碰 React 管理的元素结构。
     */
    function upgradeBubbleTexts() {
      if (typeof document === 'undefined' || scannedTexts === null || typeof document.createTreeWalker === 'undefined') return;
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode()) !== null) {
        var value = node.nodeValue;
        if (typeof value !== 'string' || value.indexOf(IMAGE_TOKEN_PREFIX) < 0) continue;
        if (scannedTexts.get(node) === value) continue;
        var ids = extractImageTokenIds(value);
        if (ids.length === 0) {
          scannedTexts.set(node, value);
          continue;
        }
        var parent = node.parentNode;
        if (parent === null) continue;
        var re = new RegExp(IMAGE_TOKEN_PREFIX + '([A-Za-z0-9_-]{8,})', 'g');
        var frag = document.createDocumentFragment();
        var cursor = 0;
        var m;
        while ((m = re.exec(value)) !== null) {
          if (m.index > cursor) frag.appendChild(document.createTextNode(value.slice(cursor, m.index)));
          var img = document.createElement('img');
          img.className = 'dshimg-inline dshimg-received';
          img.dataset.dshimg = '1';
          img.src = ATTACHMENT_PREFIX + m[1];
          img.alt = '\u7528\u6237\u53d1\u6765\u7684\u56fe\u7247';
          img.title = '\u7528\u6237\u53d1\u6765\u7684\u56fe\u7247\uff08\u70b9\u51fb\u653e\u5927\uff09';
          img.loading = 'lazy';
          img.addEventListener('error', function () { img.dataset.failed = '1'; });
          frag.appendChild(img);
          cursor = m.index + m[0].length;
        }
        if (cursor < value.length) frag.appendChild(document.createTextNode(value.slice(cursor)));
        parent.replaceChild(frag, node);
      }
    }

    // ------------------------------------------------------------------
    // 放大层内的图片缩放：滚轮/按钮/双击缩放 + 拖拽平移（纯函数，供冒烟测试）。
    // 模型：图像由 flex 居中，transform-origin 0 0，屏幕位置 = 布局左上角 + 平移
    // + 局部坐标 × 缩放；基准 base 在 scale=1 且无 transform 时测量一次。
    // ------------------------------------------------------------------
    /** 缩放范围 [0.25x, 12x]（相对适配视口的基准尺寸）。 */
    function clampZoom(scale) {
      return Math.min(12, Math.max(0.25, scale));
    }

    /** 滚轮缩放因子：deltaY<0 放大；指数平滑，每格约 1.2 倍。 */
    function wheelZoomFactor(deltaY) {
      return Math.exp(-deltaY * 0.0018);
    }

    /**
     * 光标中心缩放：缩放后仍让光标下的图像点保持不动。
     * @param {number} tx - 当前平移 x（相对图像布局左上角）。
     * @param {number} ty - 当前平移 y。
     * @param {number} scale - 当前缩放。
     * @param {number} nextScale - 目标缩放。
     * @param {number} cx - 光标相对图像左上角的 x。
     * @param {number} cy - 光标相对图像左上角的 y。
     * @returns {{tx:number,ty:number}} 新平移。
     */
    function zoomTranslate(tx, ty, scale, nextScale, cx, cy) {
      var px = (cx - tx) / scale;
      var py = (cy - ty) / scale;
      return { tx: cx - px * nextScale, ty: cy - py * nextScale };
    }

    /**
     * 平移钳制（图像由 flex 居中、transform-origin 0 0；基准尺寸由 fitBaseSize
     * 从图片自然尺寸 + 视口推导，不依赖一次性 DOM 实测——实测会在图片未加载或
     * 视口变化后失效，导致平移被钳死、拖不到图片右侧）：
     * 图像小于视口时保持居中（t=0）；放大到超出视口后限制平移，保证图像始终
     * 覆盖视口（左右/上下边缘都能拖到，不会整张拖出屏幕）。
     * @param {number} tx - 当前平移 x。
     * @param {number} ty - 当前平移 y。
     * @param {number} scale - 当前缩放。
     * @param {object} base - 基准尺寸 { w0, h0 }（scale=1 时图像适配视口的尺寸）。
     * @param {object} view - 视口 { viewW, viewH }。
     * @returns {{tx:number,ty:number}} 钳制后的平移。
     */
    function clampPan(tx, ty, scale, base, view) {
      var w = base.w0 * scale;
      var h = base.h0 * scale;
      var bx = (view.viewW - base.w0) / 2;
      var by = (view.viewH - base.h0) / 2;
      var minTx = Math.min(0, view.viewW - bx - w);
      var maxTx = Math.max(0, -bx);
      var minTy = Math.min(0, view.viewH - by - h);
      var maxTy = Math.max(0, -by);
      return {
        tx: Math.min(maxTx, Math.max(minTx, tx)),
        ty: Math.min(maxTy, Math.max(minTy, ty))
      };
    }

    /**
     * 图片适配视口的基准尺寸（与 .dshpick-lightboxFigure img 的 CSS 约束一致：
     * 最大宽 min(92vw, 1100px)、最大高 82vh，等比缩放）。
     * @param {number} naturalW - 图片自然宽。
     * @param {number} naturalH - 图片自然高。
     * @param {number} viewW - 视口宽。
     * @param {number} viewH - 视口高。
     * @returns {{w0:number,h0:number}} scale=1 时的基准尺寸。
     */
    function fitBaseSize(naturalW, naturalH, viewW, viewH) {
      var maxW = Math.min(0.92 * viewW, 1100);
      var maxH = 0.82 * viewH;
      var w = naturalW;
      var h = naturalH;
      if (w > maxW) {
        h = h * maxW / w;
        w = maxW;
      }
      if (h > maxH) {
        w = w * maxH / h;
        h = maxH;
      }
      return { w0: w, h0: h };
    }

    /** 放大层缩放控制按钮文案（按页面语言）。 */
    function zoomLabels() {
      var zh = typeof document !== 'undefined' && (document.documentElement.lang || '').toLowerCase().indexOf('zh') === 0;
      return zh
        ? { in: '放大', out: '缩小', reset: '重置为 100%' }
        : { in: 'Zoom in', out: 'Zoom out', reset: 'Reset to 100%' };
    }

    /**
     * 打开命令式 Lightbox 放大查看（复用选择卡的 .dshpick-lightbox 样式）。
     * 支持：滚轮缩放（普通滚轮即可，光标中心）、−/+/重置按钮、双击切换 1x/2.5x、
     * 放大后拖拽平移、快捷键 +/-/0/Esc。Ctrl+滚轮是浏览器级页面缩放，网页无法
     * 拦截；事件到达页面时这里也会同步缩放图片并尽力 preventDefault。
     */
    function openImageZoom(src, caption) {
      if (typeof document === 'undefined') return;
      var existing = document.querySelector('.dshpick-lightbox[data-dshimg-zoom]');
      if (existing !== null) existing.remove();
      var labels = zoomLabels();
      var overlay = document.createElement('div');
      overlay.className = 'dshpick-lightbox';
      overlay.dataset.dshimgZoom = '1';
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'dshpick-lightboxClose';
      close.textContent = '\u2715';
      close.setAttribute('aria-label', ZOOM_CLOSE_LABEL);
      close.title = ZOOM_CLOSE_LABEL;
      var figure = document.createElement('figure');
      figure.className = 'dshpick-lightboxFigure';
      var img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      figure.appendChild(img);
      if (caption !== '') {
        var figcaption = document.createElement('figcaption');
        figcaption.className = 'dshpick-lightboxCap';
        figcaption.textContent = caption;
        figure.appendChild(figcaption);
      }
      overlay.appendChild(close);
      overlay.appendChild(figure);
      // 缩放控制条：− / 百分比 / + / 重置
      var pctEl = document.createElement('span');
      pctEl.className = 'dshpick-zoomPct';
      pctEl.textContent = '100%';
      function zoomBtn(text, label, onClick) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'dshpick-zoomBtn';
        button.textContent = text;
        button.setAttribute('aria-label', label);
        button.title = label;
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          onClick();
        });
        return button;
      }
      var bar = document.createElement('div');
      bar.className = 'dshpick-zoomBar';
      bar.appendChild(zoomBtn('\u2212', labels.out, function () { zoomBy(1 / 1.25); }));
      bar.appendChild(pctEl);
      bar.appendChild(zoomBtn('+', labels.in, function () { zoomBy(1.25); }));
      bar.appendChild(zoomBtn('\u21BA', labels.reset, function () { zoomTo(1); }));
      bar.addEventListener('click', function (event) { event.stopPropagation(); });
      overlay.appendChild(bar);

      // 缩放状态：基准尺寸每次从图片自然尺寸 + 当前视口实时推导（fitBaseSize），
      // 不做一次性 DOM 实测——实测在图片未加载/视口变化后会失效，导致平移被
      // 钳死、拖不到图片右侧。
      var scale = 1;
      var tx = 0;
      var ty = 0;
      function viewSize() {
        return { viewW: window.innerWidth, viewH: window.innerHeight };
      }
      function currentBase() {
        var nw = img.naturalWidth;
        var nh = img.naturalHeight;
        if (!nw || !nh) return null;
        var view = viewSize();
        return fitBaseSize(nw, nh, view.viewW, view.viewH);
      }
      function applyZoom() {
        var base = currentBase();
        if (base === null) {
          figure.style.transform = '';
          return;
        }
        var pan = clampPan(tx, ty, scale, base, viewSize());
        tx = pan.tx;
        ty = pan.ty;
        figure.style.transform = (scale === 1 && tx === 0 && ty === 0)
          ? ''
          : 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        pctEl.textContent = Math.round(scale * 100) + '%';
      }
      function zoomBy(factor, clientX, clientY) {
        var base = currentBase();
        if (base === null) return;
        var view = viewSize();
        var nextScale = clampZoom(scale * factor);
        if (nextScale === scale) return;
        var bx = (view.viewW - base.w0) / 2;
        var by = (view.viewH - base.h0) / 2;
        var cx, cy;
        if (clientX === void 0) {
          cx = tx + (base.w0 * scale) / 2;
          cy = ty + (base.h0 * scale) / 2;
        } else {
          cx = clientX - bx;
          cy = clientY - by;
        }
        var next = zoomTranslate(tx, ty, scale, nextScale, cx, cy);
        tx = next.tx;
        ty = next.ty;
        scale = nextScale;
        applyZoom();
      }
      function zoomTo(target) {
        zoomBy(target / scale);
      }

      // 滚轮缩放（普通滚轮；Ctrl+滚轮事件到达页面时也缩放图片）
      function onWheel(event) {
        if (event.cancelable) event.preventDefault();
        zoomBy(wheelZoomFactor(event.deltaY), event.clientX, event.clientY);
      }
      // 放大后拖拽平移
      var drag = null;
      function onPointerDown(event) {
        if (scale <= 1.01) return;
        drag = { x: event.clientX, y: event.clientY, tx: tx, ty: ty };
        figure.classList.add('dshpick-grabbing');
        if (typeof figure.setPointerCapture === 'function') figure.setPointerCapture(event.pointerId);
        event.preventDefault();
      }
      function onPointerMove(event) {
        if (drag === null) return;
        tx = drag.tx + (event.clientX - drag.x);
        ty = drag.ty + (event.clientY - drag.y);
        applyZoom();
      }
      function onPointerUp() {
        if (drag === null) return;
        drag = null;
        figure.classList.remove('dshpick-grabbing');
      }
      function onDoubleClick(event) {
        event.preventDefault();
        if (scale > 1.01) zoomTo(1);
        else zoomBy(2.5, event.clientX, event.clientY);
      }

      var previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      var closeZoom = function () {
        overlay.remove();
        document.body.style.overflow = previous;
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', applyZoom);
      };
      var onKey = function (event) {
        if (event.key === 'Escape') closeZoom();
        else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.25); }
        else if (event.key === '-' || event.key === '_') { event.preventDefault(); zoomBy(1 / 1.25); }
        else if (event.key === '0') { event.preventDefault(); zoomTo(1); }
      };
      overlay.addEventListener('click', closeZoom);
      figure.addEventListener('click', function (event) { event.stopPropagation(); });
      close.addEventListener('click', function (event) { event.stopPropagation(); closeZoom(); });
      overlay.addEventListener('wheel', onWheel, { passive: false });
      figure.addEventListener('pointerdown', onPointerDown);
      figure.addEventListener('pointermove', onPointerMove);
      figure.addEventListener('pointerup', onPointerUp);
      figure.addEventListener('pointercancel', onPointerUp);
      figure.addEventListener('dblclick', onDoubleClick);
      document.addEventListener('keydown', onKey);
      // 视口变化（含 Ctrl+滚轮引起的浏览器页面缩放）时重新推导基准并重新钳制平移
      window.addEventListener('resize', applyZoom);
      document.body.appendChild(overlay);
      close.focus();
    }

    /** 是否位于插件自己的放大/选择 UI 内（这些图有各自的查看方式）。 */
    function inZoomExcludedZone(img) {
      if (typeof img.closest !== 'function') return false;
      return img.closest('.dshpick-lightbox, .dshpick-card, .dshpick-cards, .dshpick-thumb') !== null;
    }

    /** 是否位于交互控件内（按钮/链接等已有自己的点击语义，如附件缩略图自带 lightbox）。 */
    function isInteractiveContext(img) {
      if (typeof img.closest !== 'function') return false;
      return img.closest('button, a, [role="button"], [role="link"], [role="menuitem"]') !== null;
    }

    /** 内容图尺寸启发：渲染宽 ≥ 40px 或自然宽 ≥ 160px（跳过图标/头像等小图）。 */
    function isContentSized(img) {
      var rect = typeof img.getBoundingClientRect === 'function' ? img.getBoundingClientRect() : null;
      var rendered = rect !== null && rect.width > 0 ? rect.width : (img.clientWidth || 0);
      return rendered >= 40 || (img.naturalWidth || 0) >= 160;
    }

    /**
     * 判定一张图片是否应触发放大：
     *   插件图片（show/attachment 路由）无条件放大；
     *   其他图片要求位于聊天栏 [data-chat-flow] 内、不在交互控件/放大 UI 里、
     *   且达到内容图尺寸阈值。
     */
    function isZoomableChatImage(img) {
      if (img === null || typeof img !== 'object') return false;
      var src = img.getAttribute('src') || img.currentSrc || '';
      if (isPluginImageSrc(src)) return !inZoomExcludedZone(img);
      if (typeof img.closest !== 'function' || img.closest(CHAT_FLOW_SELECTOR) === null) return false;
      if (inZoomExcludedZone(img) || isInteractiveContext(img)) return false;
      if (img.dataset !== void 0 && img.dataset.failed !== void 0) return false;
      return isContentSized(img);
    }

    /**
     * document 级点击委托：聊天栏内点击内容图片 → 放大查看。
     * React 17+ 事件挂在 root 容器上、先于本委托执行，因此交互控件内的
     * 图片（按钮/链接）保持各自语义（如附件缩略图的原生 lightbox），
     * 这里只兜底纯图片。
     * @returns {Function|null} 停止函数；无 DOM 环境返回 null。
     */
    function startClickDelegation() {
      if (typeof document === 'undefined') return null;
      function onDocumentClick(event) {
        var target = event.target;
        if (target === null || target === undefined || typeof target.tagName !== 'string' || target.tagName.toLowerCase() !== 'img') return;
        if (typeof target.closest === 'function' && target.closest('.dshpick-lightbox') !== null) return;
        if (!isZoomableChatImage(target)) return;
        event.preventDefault();
        event.stopPropagation();
        var src = target.currentSrc || target.getAttribute('src') || '';
        var caption = (target.getAttribute('alt') || '').trim();
        openImageZoom(src, caption);
      }
      document.addEventListener('click', onDocumentClick);
      return function () { document.removeEventListener('click', onDocumentClick); };
    }

    /** 升级单个图片的视觉提示：插件图片套用内嵌样式，聊天内容图加放大光标。 */
    function upgradeInlineImage(img) {
      if (img === null || typeof img !== 'object' || img.dataset === void 0) return;
      if (img.dataset.dshimg === '1') return;
      var src = img.getAttribute('src') || '';
      var caption = (img.getAttribute('alt') || '').trim();
      if (isPluginImageSrc(src)) {
        img.dataset.dshimg = '1';
        img.classList.add('dshimg-inline');
        if (caption !== '') img.title = caption;
        img.addEventListener('error', function () { img.dataset.failed = '1'; });
        return;
      }
      if (!isZoomableChatImage(img)) return;
      img.dataset.dshimg = '1';
      img.classList.add('dshimg-zoom');
      if (caption !== '') img.title = caption;
    }

    /**
     * 启动聊天栏图片放大增强：MutationObserver 扫描（rAF 合帧）加样式提示
     * （聊天栏内所有 img + 插件图片路由），并挂上 document 级点击委托。
     * @returns {Function|null} 停止函数；无 DOM 环境返回 null。
     */
    function startInlineEnhancer() {
      if (typeof document === 'undefined' || typeof MutationObserver === 'undefined' || typeof requestAnimationFrame === 'undefined') return null;
      var pending = false;
      var scan = function () {
        pending = false;
        var images = document.querySelectorAll(
          CHAT_FLOW_SELECTOR + ' img, img[src*="' + IMAGE_SHOW_PREFIX + '"], img[src*="' + ATTACHMENT_PREFIX + '"]'
        );
        for (var i = 0; i < images.length; i++) upgradeInlineImage(images[i]);
        upgradeBubbleTexts();
      };
      var observer = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(scan);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      scan();
      var stopDelegation = startClickDelegation();
      return function () {
        observer.disconnect();
        if (stopDelegation !== null) stopDelegation();
      };
    }

    // ------------------------------------------------------------------
    // 主流程：分页多题、图片/文字混排、多选、自定义答案、跳过、取消
    // ------------------------------------------------------------------
    function ImageChoiceFlow(props) {
      var pending = props.pending;
      var t = props.t;
      var questions = pending.questions;
      var markers = questions.map(function (q) { return parseMarker(q.detail); });
      var indexState = react.useState(0);
      var index = indexState[0];
      var setIndex = indexState[1];
      var draftsState = react.useState(function () {
        return questions.map(function () { return { selected: [], custom: '', skipped: false }; });
      });
      var drafts = draftsState[0];
      var setDrafts = draftsState[1];
      var busyState = react.useState(null);
      var busy = busyState[0];
      var setBusy = busyState[1];
      var errorState = react.useState(null);
      var error = errorState[0];
      var setError = errorState[1];
      var zoomState = react.useState(null);
      var zoom = zoomState[0];
      var setZoom = zoomState[1];
      var closeZoom = react.useCallback(function () { setZoom(null); }, []);

      var question = questions[index];
      var marker = markers[index];
      var draft = drafts[index];
      var hasOptions = (question.options !== void 0 && question.options !== null && question.options.length > 0);
      var hasImages = marker !== null && marker.images.length > 0;

      var cancelFlow = function () {
        setBusy('cancel');
        setError(null);
        pending.cancel().catch(function (cause) {
          setBusy(null);
          setError({ text: cause instanceof Error ? cause.message : String(cause) });
        });
      };
      var updateDraft = function (update) {
        setDrafts(function (current) {
          return current.map(function (item, itemIndex) { return itemIndex === index ? update(item) : item; });
        });
        setError(null);
      };
      var choose = function (label) {
        updateDraft(function (current) {
          if (question.multiSelect === true) {
            var selected = current.selected.indexOf(label) >= 0
              ? current.selected.filter(function (item) { return item !== label; })
              : current.selected.concat([label]);
            return { selected: selected, custom: '', skipped: false };
          }
          return { selected: [label], custom: '', skipped: false };
        });
        if (question.multiSelect !== true && index < questions.length - 1) setIndex(index + 1);
      };
      var answered = function (item) { return item.selected.length > 0 || item.custom.trim() !== ''; };
      var completed = function (item) { return answered(item) || item.skipped; };
      var submitDrafts = function (values) {
        var missing = values.findIndex(function (item) { return !completed(item); });
        if (missing >= 0) {
          setIndex(missing);
          setError({ key: 'error.incomplete' });
          return;
        }
        var answer = {
          answers: questions.map(function (item, itemIndex) {
            var value = values[itemIndex];
            if (value.skipped) return { id: item.id, selected: [] };
            var custom = value.custom.trim();
            return {
              id: item.id,
              selected: custom === '' || item.multiSelect === true ? value.selected : [],
              ...(custom === '' ? {} : { custom: custom })
            };
          })
        };
        setBusy('answer');
        setError(null);
        pending.answer(answer).catch(function (cause) {
          setBusy(null);
          setError({ text: cause instanceof Error ? cause.message : String(cause) });
        });
      };
      var continueFlow = function () {
        if (!answered(draft)) {
          setError({ key: 'error.unanswered' });
          return;
        }
        if (index < questions.length - 1) {
          setIndex(index + 1);
          setError(null);
          return;
        }
        submitDrafts(drafts);
      };
      var draftCustom = function (event) {
        var value = event.target.value;
        updateDraft(function (current) {
          return {
            selected: question.multiSelect === true ? current.selected : [],
            custom: value,
            skipped: false
          };
        });
      };
      var continueFromCustom = function (event) {
        if (event.key !== 'Enter' || event.shiftKey || isComposing(event)) return;
        event.preventDefault();
        continueFlow();
      };
      var skipQuestion = function () {
        var nextDrafts = drafts.map(function (item, itemIndex) {
          return itemIndex === index ? { selected: [], custom: '', skipped: true } : item;
        });
        setDrafts(nextDrafts);
        setError(null);
        if (index < questions.length - 1) {
          setIndex(index + 1);
          return;
        }
        submitDrafts(nextDrafts);
      };
      var onKeyDownOption = function (event) {
        if (event.key !== 'Enter' || !drafts.every(completed)) return;
        event.preventDefault();
        submitDrafts(drafts);
      };

      var detailText = marker !== null ? marker.human : (typeof question.detail === 'string' ? question.detail : '');
      var options = question.options !== void 0 && question.options !== null ? question.options : [];
      var imageIndexSet = marker !== null ? marker.images : [];
      var isImageOption = function (optionIndex) { return imageIndexSet.indexOf(optionIndex) >= 0; };

      return jsx('div', {
        className: 'dshpick-frame',
        'data-question-key': pending.key,
        children: [
          jsxs('section', {
            className: 'dshpick-card',
            'aria-labelledby': 'dshpick-q-' + pending.key + '-' + index,
            children: [
            jsxs('header', {
              className: 'dshpick-header',
              children: [
                jsxs('div', {
                  className: 'dshpick-headingBlock',
                  children: [
                    question.header !== void 0 && jsx('div', { className: 'dshpick-eyebrow', children: question.header }),
                    jsx('h2', { className: 'dshpick-title', id: 'dshpick-q-' + pending.key + '-' + index, children: question.question })
                  ]
                }),
                jsx('button', {
                  type: 'button',
                  className: 'dshpick-iconButton',
                  'aria-label': t('nav.cancel'),
                  title: t('nav.cancel'),
                  disabled: busy !== null,
                  onClick: cancelFlow,
                  children: '\u2715'
                })
              ]
            }),
            jsxs('div', {
              className: 'dshpick-body',
              children: [
                detailText !== '' && jsx('p', { className: 'dshpick-detail', children: detailText }),
                hasImages
                  ? jsxs('div', {
                      className: 'dshpick-cards',
                      role: question.multiSelect === true ? 'group' : 'radiogroup',
                      children: options.map(function (option, optionIndex) {
                        if (!isImageOption(optionIndex)) return null;
                        var selected = draft.selected.indexOf(option.label) >= 0;
                        return jsx(ImageCardBtn, {
                          pickId: marker.pickId,
                          option: option,
                          optionIndex: optionIndex,
                          selected: selected,
                          multi: question.multiSelect === true,
                          disabled: busy !== null,
                          t: t,
                          onSelect: function () { choose(option.label); },
                          onZoom: function () {
                            setZoom({
                              src: '/dsh-plugin-image-tools/' + marker.pickId + '/' + optionIndex,
                              label: option.label,
                              description: option.description
                            });
                          }
                        }, optionIndex);
                      })
                    })
                  : null,
                jsxs('div', {
                  className: 'dshpick-grid',
                  role: question.multiSelect === true ? 'group' : 'radiogroup',
                  children: [
                    options.map(function (option, optionIndex) {
                      if (hasImages && isImageOption(optionIndex)) return null;
                      var selected = draft.selected.indexOf(option.label) >= 0;
                      return jsx(TextOptionRow, {
                        option: option,
                        optionIndex: optionIndex,
                        selected: selected,
                        multi: question.multiSelect === true,
                        disabled: busy !== null,
                        t: t,
                        onClick: function () { choose(option.label); },
                        onKeyDown: onKeyDownOption
                      }, optionIndex);
                    }),
                    hasOptions
                      ? jsxs('div', {
                          className: 'dshpick-customRow',
                          children: [
                            multiInput(draft, question, t, busy, draftCustom, continueFromCustom)
                          ]
                        })
                      : jsx('textarea', {
                          autoFocus: true,
                          className: 'dshpick-customTextarea',
                          value: draft.custom,
                          disabled: busy !== null,
                          rows: 2,
                          placeholder: t('custom.placeholder'),
                          onChange: draftCustom,
                          onKeyDown: continueFromCustom
                        })
                  ]
                })
              ]
            }),
            jsxs('footer', {
              className: 'dshpick-footer',
              children: [
                jsxs('div', {
                  className: 'dshpick-pager',
                  children: [
                    jsx('button', {
                      type: 'button',
                      className: 'dshpick-iconButton',
                      'aria-label': t('nav.prev'),
                      disabled: index === 0 || busy !== null,
                      onClick: function () { setIndex(index - 1); setError(null); },
                      children: '\u2039'
                    }),
                    jsxs('span', { className: 'dshpick-progress', children: [index + 1, ' / ', questions.length] }),
                    jsx('button', {
                      type: 'button',
                      className: 'dshpick-iconButton',
                      'aria-label': t('nav.next'),
                      disabled: index === questions.length - 1 || busy !== null,
                      onClick: function () { setIndex(index + 1); setError(null); },
                      children: '\u203a'
                    })
                  ]
                }),
                jsx('div', {
                  className: 'dshpick-feedback',
                  role: 'status',
                  children: error === null ? null : ('key' in error ? t(error.key) : error.text)
                }),
                jsxs('div', {
                  className: 'dshpick-footerActions',
                  children: [
                    jsx('button', {
                      type: 'button',
                      className: 'dshpick-btn dshpick-btn-outline',
                      disabled: busy !== null,
                      onClick: skipQuestion,
                      children: t('action.skip')
                    }),
                    jsx('button', {
                      type: 'button',
                      className: 'dshpick-btn dshpick-btn-primary',
                      disabled: busy !== null || !answered(draft),
                      onClick: continueFlow,
                      children: busy === 'answer' ? t('submitting') : (index === questions.length - 1 ? t('submit') : t('action.next'))
                    })
                  ]
                })
              ]
            })
            ]
          }, 'dshpick-card'),
          zoom !== null && jsx(Lightbox, { zoom: zoom, onClose: closeZoom, t: t })
        ]
      });
    }

    /** 多选/单选自定义答案行的前置控件（复刻原生 UI 形状）。 */
    function multiInput(draft, question, t, busy, draftCustom, continueFromCustom) {
      return jsxs(Fragment, {
        children: [
          question.multiSelect === true
            ? jsx('span', {
                className: 'dshpick-checkbox' + (draft.custom !== '' ? ' dshpick-checkboxChecked' : ''),
                'aria-hidden': 'true',
                children: draft.custom !== '' ? '\u2713' : null
              })
            : jsx('span', { className: 'dshpick-number', 'aria-hidden': 'true', children: '\u270E' }),
          jsx('input', {
            type: 'text',
            className: 'dshpick-customInput',
            value: draft.custom,
            disabled: busy !== null,
            placeholder: t('custom.placeholder'),
            onChange: draftCustom,
            onKeyDown: continueFromCustom
          })
        ]
      });
    }

    // ------------------------------------------------------------------
    // 组件入口 + 链条目选择器
    // ------------------------------------------------------------------
    function ImageChoiceComposer(props) {
      var pending = react.useMemo(function () { return new PendingChoice(props.matched); }, [props.matched]);
      return jsx(ImageChoiceFlow, { pending: pending, t: props.t }, pending.key);
    }

    /** 认领“至少一题带图片标记”的 question 交互；其余交给原生 UI。 */
    function selectPickChoice(_ref) {
      var interactions = _ref.interactions;
      for (var i = 0; i < interactions.length; i++) {
        var item = interactions[i];
        if (item.kind !== 'question') continue;
        var payload = item.payload;
        var questions = payload !== null && typeof payload === 'object' && Array.isArray(payload.questions) ? payload.questions : [];
        var claimed = false;
        for (var j = 0; j < questions.length; j++) {
          if (parseMarker(questions[j].detail) !== null) { claimed = true; break; }
        }
        if (claimed) return item;
      }
      return null;
    }

    // ------------------------------------------------------------------
    // 文案
    // ------------------------------------------------------------------
    var NS = 'pick';
    var zh = {
      'error.incomplete': '请先完成这道问题。',
      'error.unanswered': '请选择一个选项或填写自定义答案。',
      'nav.prev': '上一题',
      'nav.next': '下一题',
      'nav.cancel': '放弃整组问题',
      'option.recommended': '推荐',
      'custom.placeholder': '输入你的答案',
      'action.skip': '跳过本题',
      'action.next': '下一题',
      'submit': '提交',
      'submitting': '提交中…',
      'image.failed': '图片加载失败',
      'image.zoom': '放大查看',
      'image.close': '关闭'
    };
    var en = {
      'error.incomplete': 'Please complete this question first.',
      'error.unanswered': 'Please select an option or enter a custom answer.',
      'nav.prev': 'Previous question',
      'nav.next': 'Next question',
      'nav.cancel': 'Dismiss all questions',
      'option.recommended': 'Recommended',
      'custom.placeholder': 'Type your answer',
      'action.skip': 'Skip this question',
      'action.next': 'Next',
      'submit': 'Submit',
      'submitting': 'Submitting…',
      'image.failed': 'Image failed to load',
      'image.zoom': 'Zoom in',
      'image.close': 'Close'
    };

    function apply(ctx) {
      ctx.effect(function () {
        return ctx.locale.register(NS, { zh: zh, en: en });
      }, 'dsh-plugin-image-tools: dictionaries');
      ctx.slots.inject('conversation.composer', function () {
        return ctx.slots.register({
          name: 'conversation.composer',
          select: selectPickChoice,
          locale: NS,
          priority: -100
        }, ImageChoiceComposer);
      });
      ctx.effect(function () {
        return startInlineEnhancer();
      }, 'dsh-plugin-image-tools: inline image enhancer');
    }

    exports.apply = apply;
    exports.inject = ['slots', 'locale'];
    // 供冒烟测试/复用：标记解析、链条目选择器、载体与组件。
    exports.parseMarker = parseMarker;
    exports.selectPickChoice = selectPickChoice;
    exports.PendingChoice = PendingChoice;
    exports.ImageChoiceComposer = ImageChoiceComposer;
    exports.Lightbox = Lightbox;
    exports.IMAGE_SHOW_PREFIX = IMAGE_SHOW_PREFIX;
    exports.isShowImageSrc = isShowImageSrc;
    exports.isPluginImageSrc = isPluginImageSrc;
    exports.isZoomableChatImage = isZoomableChatImage;
    exports.extractImageTokenIds = extractImageTokenIds;
    exports.upgradeInlineImage = upgradeInlineImage;
    exports.startInlineEnhancer = startInlineEnhancer;
    exports.startClickDelegation = startClickDelegation;
    exports.clampZoom = clampZoom;
    exports.wheelZoomFactor = wheelZoomFactor;
    exports.zoomTranslate = zoomTranslate;
    exports.clampPan = clampPan;
    exports.fitBaseSize = fitBaseSize;
    return module.exports;
  }
});
