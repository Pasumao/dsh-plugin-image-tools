window.__ModuleLoader__.load({
  id: 'dsh-plugin-pickimages',
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
      '.dshpick-frame{padding:6px calc(var(--dsh-composer-side-clearance) + 16px) 10px;justify-content:center;display:flex}',
      '.dshpick-card{width:100%;max-width:var(--dsh-chat-content-width);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);background:var(--dsw-specific-input-major);max-height:min(70vh,620px);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:20px;flex-direction:column;padding:0 0 10px;display:flex;overflow:hidden}',
      '.dshpick-card,.dshpick-card *{box-sizing:border-box}',
      '.dshpick-header{flex-shrink:0;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 16px 0 24px;display:flex}',
      '.dshpick-headingBlock{min-width:0}',
      '.dshpick-eyebrow{color:var(--dsw-alias-label-tertiary);margin-bottom:5px;font-size:11px;line-height:16px}',
      '.dshpick-title{margin:0;font-size:16px;font-weight:500;line-height:22px}',
      '.dshpick-detail{margin:0 2px 8px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}',
      '.dshpick-iconButton{width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;place-items:center;padding:0;display:grid}',
      '.dshpick-iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshpick-iconButton:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}',
      '.dshpick-body{overscroll-behavior:contain;flex-direction:column;flex:auto;min-height:0;display:flex;overflow-y:auto}',
      '.dshpick-grid{flex-direction:column;gap:1px;margin:8px 0 0;padding:4px 12px;display:flex}',
      '.dshpick-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;padding:10px 12px 4px}',
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
      '.dshpick-customTextarea{width:100%;margin:8px 12px 0;resize:none;color:inherit;background:var(--dsw-alias-interactive-bg-hover);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:10px;outline:none;padding:8px 10px;font-size:14px;line-height:22px;font-family:inherit}',
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
      '.dshpick-lightbox{position:fixed;inset:0;z-index:9999;background:rgba(8,10,18,.86);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:52px 24px 28px;cursor:zoom-out}',
      '.dshpick-lightboxClose{position:absolute;top:16px;right:18px;width:34px;height:34px;border:1px solid var(--dsw-alias-border-l2-darkmode-thin);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;place-items:center;display:grid;font-size:16px;line-height:1;padding:0}',
      '.dshpick-lightboxClose:hover{background:rgba(255,255,255,.18)}',
      '.dshpick-lightboxFigure{margin:0;max-width:min(92vw,1100px);display:flex;flex-direction:column;align-items:center;gap:10px}',
      '.dshpick-lightboxFigure img{max-width:100%;max-height:82vh;object-fit:contain;border-radius:8px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.5)}',
      '.dshpick-lightboxCap{color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:center;overflow-wrap:anywhere}',
      '.dshpick-lightboxCap small{display:block;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:15px;margin-top:2px}',
      '@media (width<=720px){.dshpick-card{border-radius:16px}.dshpick-cards{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}.dshpick-lightbox{padding:44px 12px 20px}}'
    ].join('');
    var tagId = 'dsh-plugin-pickimages/pick.module.css';
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      var tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-plugin-pickimages';
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
      var src = '/dsh-plugin-pickimages/' + pickId + '/' + optionIndex;
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
     * @param {object} props - { zoom: { src, label, description? }|null, onClose, t }。
     */
    function Lightbox(props) {
      var zoom = props.zoom;
      var onClose = props.onClose;
      var t = props.t;
      var closeRef = react.useRef(null);
      react.useEffect(function () {
        if (zoom === null) return;
        var previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        var focusTarget = closeRef.current;
        if (focusTarget !== null && typeof focusTarget.focus === 'function') focusTarget.focus();
        function onKeyDown(event) {
          if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKeyDown);
        return function () {
          document.body.style.overflow = previous;
          document.removeEventListener('keydown', onKeyDown);
        };
      }, [zoom, onClose]);
      if (zoom === null) return null;
      return jsxs('div', {
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
            className: 'dshpick-lightboxFigure',
            onClick: function (event) { event.stopPropagation(); },
            children: [
              jsx('img', { src: zoom.src, alt: zoom.label }),
              jsxs('figcaption', {
                className: 'dshpick-lightboxCap',
                children: [
                  zoom.label,
                  zoom.description !== void 0 && jsx('small', { children: zoom.description })
                ]
              })
            ]
          })
        ]
      });
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
                              src: '/dsh-plugin-pickimages/' + marker.pickId + '/' + optionIndex,
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
      }, 'pickImages: dictionaries');
      ctx.slots.inject('conversation.composer', function () {
        return ctx.slots.register({
          name: 'conversation.composer',
          select: selectPickChoice,
          locale: NS,
          priority: -100
        }, ImageChoiceComposer);
      });
    }

    exports.apply = apply;
    exports.inject = ['slots', 'locale'];
    // 供冒烟测试/复用：标记解析、链条目选择器、载体与组件。
    exports.parseMarker = parseMarker;
    exports.selectPickChoice = selectPickChoice;
    exports.PendingChoice = PendingChoice;
    exports.ImageChoiceComposer = ImageChoiceComposer;
    exports.Lightbox = Lightbox;
    return module.exports;
  }
});
