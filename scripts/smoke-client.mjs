/**
 * dsh-plugin-image-tools 客户端冒烟测试：
 * 用 Node 模拟浏览器模块加载器执行 lib/client.js，再用 profile 里的真实
 * react / react-dom/server 渲染一次图片选择卡，验证：
 *   1. 模块加载、apply/inject 导出正常；
 *   2. selectPickChoice 认领带图片标记的问题、放过纯文字问题；
 *   3. parseMarker 与服务端 buildPickMarker 产出互通；
 *   4. 组件能完整渲染出图片卡片（hooks/JSX 全部跑通）；
 *   5. 内嵌图片增强的纯函数（isShowImageSrc / IMAGE_SHOW_PREFIX）行为正确。
 *
 * 运行：node scripts/smoke-client.mjs
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { buildPickMarker } from '../lib/index.js'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// 优先用插件自带的 devDependencies react（0.6.5 起 dsh-app 根部 react 可能被降级
// 到 16.8、无 jsx-runtime，与 react-dom 19 不同源）；本地没有时退回 profile 共享树。
const localRequire = createRequire(join(ROOT, 'noop.cjs'))
const reactRoot = dirname(localRequire.resolve('react'))
const jsxRuntime = join(reactRoot, 'jsx-runtime.js')
const reactModule = localRequire('react')
const reactDomServer = localRequire('react-dom/server')

// 1) 模拟浏览器模块加载器
let spec = null
globalThis.window = {
  __ModuleLoader__: {
    load: (value) => { spec = value },
  },
}
const code = readFileSync(join(ROOT, 'lib', 'client.js'), 'utf8')
new Function(code)()
assert.ok(spec !== null, 'module loader not invoked')
assert.equal(spec.id, 'dsh-plugin-image-tools')

const shimRequire = (name) => {
  if (name === 'react/jsx-runtime') return require(jsxRuntime)
  if (name === 'react') return reactModule
  throw new Error(`unexpected require: ${name}`)
}
const mod = spec.factory(shimRequire)
assert.equal(typeof mod.apply, 'function')
assert.deepEqual(mod.inject, ['slots', 'locale'])
assert.equal(typeof mod.selectPickChoice, 'function')
assert.equal(typeof mod.ImageChoiceComposer, 'function')
assert.equal(typeof mod.Lightbox, 'function')
assert.equal(typeof mod.isShowImageSrc, 'function')
assert.equal(typeof mod.extractImageTokenIds, 'function')
assert.equal(typeof mod.startInlineEnhancer, 'function')

// 5) 内嵌图片增强纯函数
assert.ok(mod.isShowImageSrc('/dsh-plugin-image-tools/show/abc-123/0'), 'show 路由 src 应被识别')
assert.ok(mod.isShowImageSrc('http://127.0.0.1:3080/dsh-plugin-image-tools/show/abc/1'), '绝对 URL 也应被识别')
assert.ok(!mod.isShowImageSrc('/dsh-plugin-image-tools/abc/0'), '选择卡路由不应被识别为内嵌图')
assert.ok(!mod.isShowImageSrc('https://example.com/a.png'), '外部图片不应被识别')
assert.equal(mod.startInlineEnhancer(), null, '无 DOM 环境下不应启动观察器')
assert.equal(mod.startClickDelegation(), null, '无 DOM 环境下不应挂点击委托')

// 5a) 聊天栏图片放大判定（纯逻辑，fake DOM 对象）
const fakeClosest = (insideFlow, inButton, inPick) => (sel) => {
  if (sel === '[data-chat-flow]') return insideFlow ? {} : null
  if (sel === 'button, a, [role="button"], [role="link"], [role="menuitem"]') return inButton ? {} : null
  if (sel === '.dshpick-lightbox, .dshpick-card, .dshpick-cards, .dshpick-thumb') return inPick ? {} : null
  return null
}
const fakeImg = (opts) => ({
  getAttribute: (k) => (k === 'src' ? (opts.src ?? '') : null),
  currentSrc: opts.currentSrc ?? '',
  closest: fakeClosest(opts.insideFlow ?? false, opts.inButton ?? false, opts.inPick ?? false),
  getBoundingClientRect: () => ({ width: opts.w ?? 320, height: opts.h ?? 240 }),
  naturalWidth: opts.nw ?? 640,
  dataset: opts.dataset ?? {},
})
assert.equal(mod.isPluginImageSrc('/dsh-plugin-image-tools/show/a/0'), true, 'show 路由应判定为插件图')
assert.equal(mod.isPluginImageSrc('http://127.0.0.1:3080/dsh-plugin-image-tools/attachment/att-123'), true, 'attachment 绝对 URL 应判定为插件图')
assert.equal(mod.isPluginImageSrc('/dsh-plugin-image-tools/pick-1/0'), false, '选择卡路由不是内嵌插件图')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: true })), true, '聊天栏内内容图应可放大')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: true, w: 16, h: 16, nw: 16 })), false, '聊天栏内小图标不应放大')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: true, inButton: true })), false, '按钮内图片应放行给原生语义')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: true, inPick: true })), false, '选择卡内图片应由卡片自己的放大处理')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: false, src: 'https://example.com/a.png' })), false, '聊天栏外的图片不放大')
assert.equal(mod.isZoomableChatImage(fakeImg({ insideFlow: true, src: '/dsh-plugin-image-tools/show/x/0' })), true, '插件图无条件放大')
assert.equal(mod.isZoomableChatImage(null), false, 'null 不应放大')

// 5c) 放大层缩放纯函数
assert.equal(mod.clampZoom(0.1), 0.25, '缩放下限 0.25x')
assert.equal(mod.clampZoom(20), 12, '缩放上限 12x')
assert.equal(mod.clampZoom(2), 2, '范围内原样')
assert.ok(mod.wheelZoomFactor(-100) > 1, '向上滚应放大')
assert.ok(mod.wheelZoomFactor(100) < 1, '向下滚应缩小')
// 光标中心缩放：缩放前后光标下的图像点屏幕位置不变
const zt = mod.zoomTranslate(0, 0, 1, 2, 100, 50)
assert.ok(Math.abs((100 * 2 + zt.tx) - 100) < 1e-9, '光标中心缩放后 x 不动')
assert.ok(Math.abs((50 * 2 + zt.ty) - 50) < 1e-9, '光标中心缩放后 y 不动')
// 平移钳制：scale=1 保持 flex 居中（t=0）；超出视口后限位、图像始终覆盖视口
// （左右/上下边缘都能拖到——这是修复"放大后拖不到右边"的关键约束）
const zoomBase = { w0: 200, h0: 100 }
const zoomView = { viewW: 1000, viewH: 800 }
assert.deepEqual(mod.clampPan(50, 50, 1, zoomBase, zoomView), { tx: 0, ty: 0 }, 'scale=1 保持居中')
assert.deepEqual(mod.clampPan(50, 50, 4, zoomBase, zoomView), { tx: 0, ty: 0 }, '4x 仍小于视口 → 居中')
assert.deepEqual(mod.clampPan(-10000, 0, 8, zoomBase, zoomView), { tx: -1000, ty: 0 }, '8x 超出视口 → 限位到左边缘')
assert.deepEqual(mod.clampPan(99999, -99999, 8, zoomBase, zoomView), { tx: 0, ty: -350 }, '8x 超出视口 → 限位到右/上边缘')
// 基准尺寸推导：与 .dshpick-lightboxFigure img 的 CSS 约束一致（max-width min(92vw,1100) / max-height 82vh）
const fit = mod.fitBaseSize(2000, 1000, 1000, 800)
assert.ok(Math.abs(fit.w0 - 920) < 1e-9 && Math.abs(fit.h0 - 460) < 1e-9, '宽图按 92vw 等比缩放')
const fit2 = mod.fitBaseSize(800, 2000, 1000, 800)
assert.ok(Math.abs(fit2.h0 - 656) < 1e-9 && Math.abs(fit2.w0 - 262.4) < 1e-9, '高图按 82vh 等比缩放')
const fit3 = mod.fitBaseSize(500, 300, 1000, 800)
assert.deepEqual(fit3, { w0: 500, h0: 300 }, '小于约束时保持自然尺寸')
const fit4 = mod.fitBaseSize(3000, 3000, 400, 300)
assert.ok(fit4.w0 <= 368 + 1e-9 && fit4.h0 <= 246 + 1e-9, '小视口下同时受宽高约束')

// 5b) 盲模型收图占位符 token 提取
assert.deepEqual(mod.extractImageTokenIds('📷 图片 dshimg:att-aaa111bbb222 和 dshimg:att-ccc333ddd444'), ['att-aaa111bbb222', 'att-ccc333ddd444'])
assert.deepEqual(mod.extractImageTokenIds('📷 图片 dshimg:att-aaa111bbb222 重复 dshimg:att-aaa111bbb222'), ['att-aaa111bbb222'])
assert.deepEqual(mod.extractImageTokenIds('没有 token'), [])
assert.deepEqual(mod.extractImageTokenIds(undefined), [])

// 2) select：认领带标记问题，放过纯文字/plan-review（dsh 0.1.2 协议：
// 入参 { pendingInteraction }，questions 直挂、带 answer()/cancel()）
const markerDetail = buildPickMarker('pick-1', [0, 2]) + '\n\n请选择一张图'
const fakePending = (questions, extra) => ({
  kind: 'question',
  key: 'q:x',
  sessionId: 's1',
  questions,
  answer: async () => {},
  cancel: async () => {},
  ...extra,
})
const withImage = fakePending([{ id: 'a', question: '选图', detail: markerDetail, options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] }], { key: 'q:1' })
const plain = fakePending([{ id: 'b', question: '纯文字', options: [{ label: 'X' }] }], { key: 'q:2', sessionId: 's2' })
const planReview = fakePending(
  [{ id: 'c', question: '确认计划', detail: '计划', intent: { kind: 'plan-review', approve: '执行' }, options: [{ label: '执行' }] }],
  { key: 'q:3', kind: 'plan-review' },
)
assert.equal(mod.selectPickChoice({ pendingInteraction: plain }), null, '纯文字问题应放行')
assert.equal(mod.selectPickChoice({ pendingInteraction: planReview }), null, 'plan-review 应放行')
assert.equal(mod.selectPickChoice({ pendingInteraction: null }), null, '无 pendingInteraction 应放行')
assert.equal(mod.selectPickChoice({ pendingInteraction: withImage }), withImage, '带图问题应认领')

// 3) parseMarker 与服务端互通
const parsed = mod.parseMarker(markerDetail)
assert.deepEqual({ pickId: parsed.pickId, images: parsed.images, human: parsed.human }, { pickId: 'pick-1', images: [0, 2], human: '\n\n请选择一张图' })

// 4) 渲染图片选择卡（react-dom/server 初次渲染）
const { renderToString } = reactDomServer
const fakeT = (key) => ({ 'nav.cancel': '取消', 'action.skip': '跳过', 'action.next': '下一步', 'submit': '提交', 'option.recommended': '推荐', 'custom.placeholder': '输入答案', 'image.failed': '加载失败', 'image.zoom': '放大查看', 'image.close': '关闭' }[key] ?? key)
const fakeWait = {
  kind: 'question',
  key: 'q:1',
  sessionId: 's1',
  questions: [{ id: 'a', question: '选一张封面', header: '封面', detail: markerDetail, multiSelect: false, options: [{ label: 'A (Recommended)', description: '第一张' }, { label: 'B' }, { label: 'C' }] }],
  answer: async () => {},
  cancel: async () => {},
}
const html = renderToString(reactModule.createElement(mod.ImageChoiceComposer, { matched: fakeWait, t: fakeT }))
assert.ok(html.includes('dshpick-card'), '卡片未渲染')
assert.ok(html.includes('选一张封面'), '问题文本缺失')
assert.ok(html.includes('/dsh-plugin-image-tools/pick-1/0'), '图片 URL 缺失')
assert.ok(html.includes('/dsh-plugin-image-tools/pick-1/2'), '第二张图片 URL 缺失')
assert.ok(html.includes('A'), '选项 label 缺失')
assert.ok(!html.includes('<!--dsh-pick:v1:'), '标记注释应被剥离，不能出现在界面上')

// 5) 放大查看：卡片渲染出 zoom 触发按钮（aria-label/title 走 locale），
//    Lightbox 单独渲染时包含大图、说明与关闭按钮
assert.ok(html.includes('放大查看'), 'zoom 触发按钮的 locale 文案缺失')
assert.ok(html.includes('dshpick-zoomHint'), 'zoom 提示图标缺失')
const lightboxHtml = renderToString(reactModule.createElement(mod.Lightbox, {
  zoom: { src: '/dsh-plugin-image-tools/pick-1/0', label: 'A', description: '第一张' },
  onClose: () => {},
  t: fakeT,
}))
assert.ok(lightboxHtml.includes('dshpick-lightbox'), 'lightbox 遮罩未渲染')
assert.ok(lightboxHtml.includes('/dsh-plugin-image-tools/pick-1/0'), 'lightbox 大图 URL 缺失')
assert.ok(lightboxHtml.includes('第一张'), 'lightbox 说明缺失')
assert.ok(lightboxHtml.includes('关闭'), 'lightbox 关闭按钮文案缺失')

console.log('[dsh-plugin-image-tools] client smoke passed')
