/**
 * dsh-plugin-pickimages 服务端集成冒烟：
 * 用假 ctx 挂载插件（apply），完整验证：
 *   1. 工具以 ask_user_choice 注册，schema 含 image 字段；
 *   2. execute 归一化图片 → ask 请求的 detail 带标记、选项只剩 label/description；
 *   3. 图片路由能按 /dsh-plugin-pickimages/<pickId>/<index> 出字节和 content-type；
 *   4. 回答映射与清理（pick 条目在答案返回后被删除）。
 *
 * 运行：node scripts/smoke-server.mjs
 */
import { strict as assert } from 'node:assert'
import { apply, PICK_PREFIX } from '../lib/index.js'

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])

// --- 假 ctx ---
let toolDef = null
let route = null
let capturedAsk = null
let resolveAsk = null
const askPromise = new Promise((resolve) => { resolveAsk = resolve })

const ctx = {
  effect(fn) {
    const result = fn()
    return () => { if (typeof result === 'function') result() }
  },
  webServer: {
    register(r) { route = r; return () => {} },
  },
  tools: {
    register(def) { toolDef = def; return () => {} },
  },
  userQuestions: {
    ask(request) {
      capturedAsk = request
      return askPromise
    },
  },
}

apply(ctx)

// --- 1) 工具定义 ---
assert.equal(toolDef.name, 'ask_user_choice')
assert.ok(toolDef.parameters.properties.questions.items.properties.options.items.properties.image, '选项 schema 缺少 image 字段')
assert.ok(toolDef.parameters.properties.questions.items.properties.options.items.properties.label, '选项 schema 缺少 label')
assert.equal(typeof toolDef.execute, 'function')

// --- 2) 执行：data URI 图片 + 纯文字选项混排 ---
const dataUri = `data:image/png;base64,${pngBytes.toString('base64')}`
const exec = { agent: { session: { header: { cwd: process.cwd() } } }, signal: undefined }
const runPromise = toolDef.execute({
  questions: [
    {
      id: 'q1',
      question: '选一张图',
      header: '选图',
      multi_select: true,
      options: [
        { label: '方案A (推荐)', description: '第一张', image: { data: dataUri } },
        { label: '方案B' },
        { label: '方案C', image: { data: dataUri } },
      ],
    },
    { id: 'q2', question: '纯文字题', options: [{ label: '是' }, { label: '否' }] },
  ],
}, exec)

// 等 execute 把 ask 请求送出去（假 ask 挂起，等待我们手动回答）
await new Promise((r) => setTimeout(r, 0))
assert.ok(capturedAsk !== null, 'execute 未调用 userQuestions.ask')
assert.equal(capturedAsk.questions.length, 2)
assert.equal(capturedAsk.questions[0].id, 'q1')
assert.equal(capturedAsk.questions[0].multiSelect, true)

// detail 带标记，标记 JSON 为 ASCII
const detail = capturedAsk.questions[0].detail
assert.ok(detail.startsWith('<!--dsh-pick:v1:'), 'detail 缺少标记')
const markerBody = detail.slice('<!--dsh-pick:v1:'.length, detail.indexOf('-->'))
assert.ok(/^[A-Za-z0-9_-]+$/.test(markerBody), '标记 JSON 应为 ASCII base64url')
const marker = JSON.parse(Buffer.from(markerBody, 'base64url').toString('utf8'))
assert.deepEqual(marker, { pickId: marker.pickId, images: [0, 2] })
const pickId = marker.pickId

// 选项只含 label/description（标准字段）
assert.deepEqual(Object.keys(capturedAsk.questions[0].options[0]).sort(), ['description', 'label'])
assert.deepEqual(capturedAsk.questions[0].options[1], { label: '方案B' })
assert.equal(capturedAsk.questions[1].detail, undefined, '纯文字题不应带标记')

// --- 3) 图片路由出图 ---
assert.equal(route.kind, 'prefix')
assert.equal(route.path, PICK_PREFIX)
let served = null
route.handler(
  { url: `${PICK_PREFIX}/${pickId}/0` },
  {
    writeHead(status, headers) { served = { status, headers } },
    end(body) { served.body = body },
  },
)
assert.equal(served.status, 200)
assert.equal(served.headers['content-type'], 'image/png')
assert.deepEqual(served.body, pngBytes)
// 越界下标 → 404
let notFound = null
route.handler(
  { url: `${PICK_PREFIX}/${pickId}/9` },
  { writeHead(status, headers) { notFound = { status } }, end() {} },
)
assert.equal(notFound.status, 404)

// --- 4) 回答映射 + 清理 ---
resolveAsk({
  answers: [
    { id: 'q1', selected: ['方案A (推荐)', '方案C'] },
    { id: 'q2', selected: [], custom: '自定义' },
  ],
})
const result = await runPromise
assert.deepEqual(result, {
  answers: [
    { id: 'q1', selected: ['方案A (推荐)', '方案C'] },
    { id: 'q2', selected: [], custom: '自定义' },
  ],
})
// finally 已清理：路由再访问应 404
let afterCleanup = null
route.handler(
  { url: `${PICK_PREFIX}/${pickId}/0` },
  { writeHead(status) { afterCleanup = { status } }, end() {} },
)
assert.equal(afterCleanup.status, 404, '回答后图片注册表应清理')

console.log('[dsh-plugin-pickimages] server smoke passed')
