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
// 从 profile 的共享 node_modules 树解析 react（单实例：jsx-runtime/react-dom 同源）
const profileRequire = createRequire(join('C:/Users/18303/.dsh/profiles/node_modules', 'noop.cjs'))
const reactRoot = dirname(profileRequire.resolve('react'))
const jsxRuntime = join(reactRoot, 'jsx-runtime.js')
const reactModule = profileRequire('react')
const reactDomServer = profileRequire('react-dom/server')

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

// 5b) 盲模型收图占位符 token 提取
assert.deepEqual(mod.extractImageTokenIds('📷 图片 dshimg:att-aaa111bbb222 和 dshimg:att-ccc333ddd444'), ['att-aaa111bbb222', 'att-ccc333ddd444'])
assert.deepEqual(mod.extractImageTokenIds('📷 图片 dshimg:att-aaa111bbb222 重复 dshimg:att-aaa111bbb222'), ['att-aaa111bbb222'])
assert.deepEqual(mod.extractImageTokenIds('没有 token'), [])
assert.deepEqual(mod.extractImageTokenIds(undefined), [])

// 2) select：认领带标记问题，放过纯文字问题
const markerDetail = buildPickMarker('pick-1', [0, 2]) + '\n\n请选择一张图'
const withImage = {
  kind: 'question',
  key: 'q:1',
  sessionId: 's1',
  payload: { type: 'question/requested', sessionId: 's1', questions: [{ id: 'a', question: '选图', detail: markerDetail, options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] }] },
}
const plain = {
  kind: 'question',
  key: 'q:2',
  sessionId: 's2',
  payload: { type: 'question/requested', sessionId: 's2', questions: [{ id: 'b', question: '纯文字', options: [{ label: 'X' }] }] },
}
const approval = { kind: 'approval', key: 'a:1', sessionId: 's1', payload: {} }
assert.equal(mod.selectPickChoice({ interactions: [plain] }), null, '纯文字问题应放行')
assert.equal(mod.selectPickChoice({ interactions: [approval, plain] }), null, '无图问题应放行')
assert.equal(mod.selectPickChoice({ interactions: [plain, withImage] }), withImage, '带图问题应认领')

// 3) parseMarker 与服务端互通
const parsed = mod.parseMarker(markerDetail)
assert.deepEqual({ pickId: parsed.pickId, images: parsed.images, human: parsed.human }, { pickId: 'pick-1', images: [0, 2], human: '\n\n请选择一张图' })

// 4) 渲染图片选择卡（react-dom/server 初次渲染）
const { renderToString } = reactDomServer
const fakeT = (key) => ({ 'nav.cancel': '取消', 'action.skip': '跳过', 'action.next': '下一步', 'submit': '提交', 'option.recommended': '推荐', 'custom.placeholder': '输入答案', 'image.failed': '加载失败', 'image.zoom': '放大查看', 'image.close': '关闭' }[key] ?? key)
const fakeWait = {
  key: 'q:1',
  sessionId: 's1',
  payload: { type: 'question/requested', sessionId: 's1', questions: [{ id: 'a', question: '选一张封面', header: '封面', detail: markerDetail, multiSelect: false, options: [{ label: 'A (Recommended)', description: '第一张' }, { label: 'B' }, { label: 'C' }] }] },
  respond: async (r) => ({ accepted: true }),
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
