/**
 * dsh-plugin-image-tools 服务端集成冒烟：
 * 用假 ctx 挂载插件（apply），完整验证：
 *   1. 工具以 ask_user_choice / show_images 注册，schema 含 image 字段；
 *   2. ask_user_choice.execute 归一化图片 → ask 请求的 detail 带标记、
 *      选项只剩 label/description；
 *   3. 图片路由能按 /dsh-plugin-image-tools/<pickId>/<index> 与
 *      /dsh-plugin-image-tools/show/<showId>/<index> 出字节和 content-type；
 *   4. 回答映射与清理（pick 条目在答案返回后被删除）；
 *   5. show_images.execute 返回绝对 URL 的 markdown 片段，图片注册表存活
 *      （回复渲染需要），路由可访问。
 *
 * 运行：node scripts/smoke-server.mjs
 */
import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, ROUTE_PREFIX } from '../lib/index.js'

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])

// --- 假 ctx ---
let toolDefs = []
let route = null
let capturedAsk = null
let resolveAsk = null
let preStepHandler = null
const askPromise = new Promise((resolve) => { resolveAsk = resolve })
const storedAttachments = new Map([['att-abc123def456', pngBytes]])

const ctx = {
  effect(fn) {
    const result = fn()
    return () => { if (typeof result === 'function') result() }
  },
  webServer: {
    host: '127.0.0.1',
    port: 3080,
    register(r) { route = r; return () => {} },
  },
  tools: {
    register(def) { toolDefs.push(def); return () => {} },
  },
  userQuestions: {
    ask(request) {
      capturedAsk = request
      return askPromise
    },
  },
  on(event, handler) {
    if (event === 'agent/pre-step') preStepHandler = handler
    return () => { if (preStepHandler === handler) preStepHandler = null }
  },
  attachments: {
    async readImage(ref) {
      const data = storedAttachments.get(ref.attachmentId)
      if (data === undefined) throw new Error(`attachment not found: ${ref.attachmentId}`)
      return { ref, data }
    },
  },
  llm: {
    async resolveModelInfo(provider, model) {
      return { provider, id: model, name: model, inputModalities: ['text'] }
    },
  },
}

apply(ctx)

const defByName = (name) => toolDefs.find((def) => def.name === name)
const choiceDef = defByName('ask_user_choice')
const showDef = defByName('show_images')
const saveDef = defByName('save_received_images')

// --- 1) 工具定义 ---
assert.ok(choiceDef, 'ask_user_choice 未注册')
assert.ok(choiceDef.parameters.properties.questions.items.properties.options.items.properties.image, '选项 schema 缺少 image 字段')
assert.ok(choiceDef.parameters.properties.questions.items.properties.options.items.properties.label, '选项 schema 缺少 label')
assert.equal(typeof choiceDef.execute, 'function')
assert.ok(showDef, 'show_images 未注册')
assert.ok(showDef.parameters.properties.images.items.properties.image, 'show_images schema 缺少 image 字段')
assert.ok(saveDef, 'save_received_images 未注册')
assert.ok(saveDef.parameters.properties.images.items.properties.attachmentId, 'save_received_images schema 缺少 attachmentId')
assert.equal(typeof preStepHandler, 'function', 'agent/pre-step 监听器未注册')
assert.equal(typeof showDef.execute, 'function')

// --- 2) ask_user_choice 执行：data URI 图片 + 纯文字选项混排 ---
const dataUri = `data:image/png;base64,${pngBytes.toString('base64')}`
const exec = { agent: { session: { header: { cwd: process.cwd() } } }, signal: undefined }
const runPromise = choiceDef.execute({
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

// --- 3) 图片路由出图（选择卡） ---
assert.equal(route.kind, 'prefix')
assert.equal(route.path, ROUTE_PREFIX)
let served = null
route.handler(
  { url: `${ROUTE_PREFIX}/${pickId}/0` },
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
  { url: `${ROUTE_PREFIX}/${pickId}/9` },
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
  { url: `${ROUTE_PREFIX}/${pickId}/0` },
  { writeHead(status) { afterCleanup = { status } }, end() {} },
)
assert.equal(afterCleanup.status, 404, '回答后图片注册表应清理')

// --- 5) show_images：注册 + markdown 片段 + 路由出图（条目存活供渲染） ---
const showResult = await showDef.execute({
  images: [
    { image: { data: dataUri }, caption: '深海鲸鱼封面' },
    { image: { data: dataUri } },
  ],
}, exec)
assert.ok(Array.isArray(showResult.markdown), 'show_images 应返回 markdown 数组')
assert.equal(showResult.markdown.length, 2)
const url0 = showResult.markdown[0].match(/\]\((http[^)]+)\)/)?.[1]
const url1 = showResult.markdown[1].match(/\]\((http[^)]+)\)/)?.[1]
assert.ok(url0 && url0.startsWith('http://127.0.0.1:3080'), `URL 应为绝对 origin：${url0}`)
assert.ok(url0.includes(`${ROUTE_PREFIX}/show/`), `URL 应含 show 路由：${url0}`)
assert.ok(showResult.markdown[0].includes('![深海鲸鱼封面]'), '第一张应带 caption alt')
assert.ok(showResult.markdown[1].includes('![图片]'), '无 caption 时 alt 用默认文案')
const showId = url0.match(/\/show\/([^/]+)\//)?.[1]
assert.ok(showId, '无法从 URL 提取 showId')

// 回复渲染期条目应存活：两张都能出图
let showServed = []
for (const index of [0, 1]) {
  route.handler(
    { url: `${ROUTE_PREFIX}/show/${showId}/${index}` },
    {
      writeHead(status, headers) { showServed.push({ status, headers }) },
      end(body) { showServed[showServed.length - 1].body = body },
    },
  )
}
assert.equal(showServed[0].status, 200)
assert.equal(showServed[0].headers['content-type'], 'image/png')
assert.deepEqual(showServed[0].body, pngBytes)
assert.equal(showServed[1].status, 200)
// 越界 → 404
let showNotFound = null
route.handler(
  { url: `${ROUTE_PREFIX}/show/${showId}/9` },
  { writeHead(status) { showNotFound = { status } }, end() {} },
)
assert.equal(showNotFound.status, 404)

// show_images 参数校验
await assert.rejects(() => showDef.execute({ images: [] }, exec), /不能为空/)
await assert.rejects(() => showDef.execute({ images: [{ caption: '没有图' }] }, exec), /image 字段/)
await assert.rejects(() => showDef.execute({ images: [{ image: {} }] }, exec), /path \/ url \/ data/)

// --- 6) 盲模型收图：pre-step 重写 → 附件路由 → save_received_images ---
const imgRef = { attachmentId: 'att-abc123def456', mediaType: 'image/png', bytes: pngBytes.byteLength, width: 12, height: 12, name: 'shot.png' }
const userMsg = {
  id: 'm-img-1',
  role: 'user',
  source: { kind: 'direct' },
  content: [
    { type: 'text', text: '看看这张截图' },
    { type: 'image', attachment: imgRef },
  ],
}
const decision = await preStepHandler(
  { agent: { id: 'a1' }, messages: [userMsg], turn: 1, step: 1, signal: undefined },
  async () => ({ kind: 'enter', messages: [userMsg] }),
)
assert.equal(decision.kind, 'enter', 'pre-step 应返回 enter')
assert.equal(decision.messages.length, 1)
const rewritten = decision.messages[0]
assert.equal(rewritten.id, 'm-img-1', '重写后消息 id 保留')
assert.equal(rewritten.content[1].type, 'text', 'image 块应被重写为 text')
assert.ok(rewritten.content[1].text.includes('dshimg:att-abc123def456'), '占位符应含 token')
assert.equal(userMsg.content[1].type, 'image', '原消息不被修改')

// 附件路由：重写登记的 ref 可出字节
let attServed = null
await route.handler(
  { url: `${ROUTE_PREFIX}/attachment/att-abc123def456` },
  {
    writeHead(status, headers) { attServed = { status, headers } },
    end(body) { attServed.body = body },
  },
)
assert.equal(attServed.status, 200)
assert.equal(attServed.headers['content-type'], 'image/png')
assert.deepEqual(attServed.body, pngBytes)
// 未知附件 → 404
let attNotFound = null
await route.handler(
  { url: `${ROUTE_PREFIX}/attachment/att-nope000000` },
  { writeHead(status) { attNotFound = { status } }, end() {} },
)
assert.equal(attNotFound.status, 404)

// save_received_images：保存到临时 cwd
const tmpCwd = mkdtempSync(join(tmpdir(), 'dsh-img-tools-'))
const saveExec = { agent: { session: { header: { cwd: tmpCwd } } }, signal: undefined }
const saveResult = await saveDef.execute({
  images: [{ attachmentId: 'att-abc123def456' }],
}, saveExec)
assert.equal(saveResult.saved.length, 1)
assert.equal(saveResult.saved[0].error, undefined, `保存不应出错：${saveResult.saved[0].error ?? ''}`)
assert.ok(saveResult.saved[0].path.startsWith(tmpCwd), '应保存到工作区')
assert.ok(existsSync(saveResult.saved[0].path), '文件应落盘')
assert.deepEqual(readFileSync(saveResult.saved[0].path), pngBytes, '文件内容应为附件字节')
assert.equal(saveResult.saved[0].mediaType, 'image/png')
// 未知附件 → 返回 error 字段而非抛错
const badSave = await saveDef.execute({ images: [{ attachmentId: 'att-nope000000' }] }, saveExec)
assert.ok(badSave.saved[0].error, '未知附件应返回 error')
// 参数校验
await assert.rejects(() => saveDef.execute({ images: [] }, saveExec), /不能为空/)

// --- 7) 模型能力补丁（放行盲模型收图） ---
const patchedInfo = await ctx.llm.resolveModelInfo('deepseek', 'deepseek-v4-flash')
assert.ok(Array.isArray(patchedInfo.inputModalities), '补丁后 inputModalities 应为数组')
assert.ok(patchedInfo.inputModalities.includes('image'), '补丁后应声称支持 image 输入')
assert.equal(patchedInfo.id, 'deepseek-v4-flash', '其余元数据应保留')

console.log('[dsh-plugin-image-tools] server smoke passed')
