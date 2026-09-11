/**
 * dsh-plugin-image-tools — 图片插件（服务端半边）
 *
 * 两个工具：
 *   1. ask_user_choice：与原生 ask_user_question 同一答案协议
 *      （answers: [{ id, selected[], custom? }]），但每个选项可携带一张图片，
 *      支持三种来源：path（本地文件）/ url（http(s)）/ data（base64 data URI）。
 *      浏览器端渲染图片选择卡，用户点卡片选择。
 *   2. show_images：把图片注册到内存，返回绝对 URL 的 markdown 图片片段，
 *      模型把片段原样粘贴进回复正文 → 图片随回复文字一起显示在聊天里。
 *
 * 为什么图片不走 option 字段 / 消息 content 字段：
 *   浏览器端消费 question/requested 帧时用 zod schema 严格解析，选项对象上
 *   的未知字段（如 image）会被剥离；助手消息 content 由模型文本生成，也没有
 *   通道携带结构化图片块。因此本插件采用：
 *     1) 服务端把图片字节归一化进内存注册表，并通过自定义 web 路由
 *        /dsh-plugin-image-tools/<pickId>/<index>（选择卡）与
 *        /dsh-plugin-image-tools/show/<showId>/<index>（回复内嵌）提供字节；
 *     2) 选择卡：在问题的 detail（标准字符串字段，原样透传）开头写入不可见
 *        HTML 注释标记 <!--dsh-pick:v1:<base64url JSON>-->，客户端按标记
 *        认领问题并渲染图片选择卡；
 *     3) 回复内嵌：show_images 返回绝对 URL 的 markdown 图片行（宿主 origin
 *        由 ctx.webServer.host/port 推导），模型粘贴进正文，核心 markdown
 *        渲染器原生显示；客户端插件再对这类图片做增强（样式 + 点击放大）。
 *   纯文字问题不带标记 → 客户端 select 放弃 → 原生文字 UI 兜底，优雅降级。
 *
 * 零运行时依赖：不 import 任何 @deepseek-ai/* 包（与 dsh-plugin-novel 同策略，
 * 工具定义走 ctx.tools.register 的原始 definition 形状）。
 *
 * @module dsh-plugin-image-tools
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, isAbsolute, join, normalize } from 'node:path'
import { randomUUID } from 'node:crypto'

export const name = 'dsh-plugin-image-tools'
/** 需要的主机端服务：tools（注册工具）、userQuestions（问询）、webServer（图片路由与 origin）、attachments（附件字节存取）、llm（模型能力补丁）。 */
export const inject = ['tools', 'userQuestions', 'webServer', 'attachments', 'llm']

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 图片字节服务路由前缀。 */
export const ROUTE_PREFIX = '/dsh-plugin-image-tools'
/** 单个图片字节上限（超出直接报错，保护内存）。 */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
/** 未答/未展示图片注册条目的存活时间（被放弃的提问与历史回复最终被清理）。 */
export const IMAGE_TTL_MS = 30 * 60 * 1000
/**
 * 图片字节路由的浏览器缓存策略。
 * 三个路由的 URL 都是内容寻址的（pickId/showId 为 UUID、attachmentId 为内容哈希），
 * 同一 URL 的字节永远不会变，因此可以放心下发 immutable 长缓存：图片一旦加载
 * 成功就留在浏览器本地，源文件被删除/覆盖、服务端内存注册表被 TTL 清理、甚至
 * dsh 进程重启后，刷新页面/回看历史消息时浏览器直接命中本地缓存，不再向服务端
 * 发请求（避免 404：max-age=300 的旧策略下，图片见过一次后 5 分钟就"消失"）。
 */
export const IMAGE_CACHE_CONTROL = 'private, max-age=2592000, immutable'
/** 拉取远程图片的超时（ms）。 */
export const FETCH_TIMEOUT_MS = 30 * 1000
/** detail 里不可见标记的前缀/后缀。 */
export const MARKER_PREFIX = '<!--dsh-pick:v1:'
export const MARKER_SUFFIX = '-->'
/** 盲模型收图：文本占位符里的图片 token 前缀（attachmentId 紧随其后）。 */
export const IMAGE_TOKEN_PREFIX = 'dshimg:'
/** save_received_images 的默认保存目录（相对会话工作区）。 */
export const RECEIVED_DIR = 'received'

/** 支持的图片媒体类型。 */
const SUPPORTED_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

// ---------------------------------------------------------------------------
// 内存图片注册表（进程生命周期；每次新增/路由命中时顺带做 TTL 清理）
//   picks：ask_user_choice 的选择卡图片（随回答/取消立即释放）
//   shows：show_images 的回复内嵌图片（依赖 TTL 清理，需存活到回复渲染完）
//   attachmentRefs：盲模型收图的附件 ref 登记（pre-step 重写时记录，供
//       /attachment 路由与 save_received_images 解析；TTL 清理）
// ---------------------------------------------------------------------------

/** @type {Map<string, { createdAt: number, images: { bytes: Buffer, mediaType: string, name?: string }[] }>} */
const picks = new Map()
/** @type {Map<string, { createdAt: number, images: { bytes: Buffer, mediaType: string, caption?: string }[] }>} */
const shows = new Map()
/** @type {Map<string, { createdAt: number, ref: object }>} */
const attachmentRefs = new Map()

function pruneRegistry(registry, now = Date.now()) {
  for (const [id, entry] of registry) {
    if (now - entry.createdAt > IMAGE_TTL_MS) registry.delete(id)
  }
}

function prunePicks(now = Date.now()) {
  pruneRegistry(picks, now)
}

function pruneShows(now = Date.now()) {
  pruneRegistry(shows, now)
}

function pruneAttachmentRefs(now = Date.now()) {
  pruneRegistry(attachmentRefs, now)
}

function getPick(pickId) {
  prunePicks()
  return picks.get(pickId)
}

function getShow(showId) {
  pruneShows()
  return shows.get(showId)
}

/** 登记一次 pre-step 重写见到的附件 ref（供路由与工具解析）。 */
function recordAttachmentRef(ref) {
  if (ref === null || typeof ref !== 'object' || typeof ref.attachmentId !== 'string' || ref.attachmentId === '') return
  pruneAttachmentRefs()
  attachmentRefs.set(ref.attachmentId, { createdAt: Date.now(), ref })
}

/** 按 attachmentId 取回登记的 ref；未知/过期返回 undefined。 */
function resolveAttachmentRef(attachmentId) {
  pruneAttachmentRefs()
  return attachmentRefs.get(attachmentId)?.ref
}

// ---------------------------------------------------------------------------
// 纯函数：媒体类型探测 / 标记编解码 / 宿主 origin（导出供 selfcheck 测试）
// ---------------------------------------------------------------------------

/**
 * 按魔数探测图片媒体类型（PNG / JPEG / WebP / GIF）。
 * @param {Buffer} bytes - 图片字节。
 * @returns {string|undefined} 规范 mediaType；无法识别返回 undefined。
 */
export function sniffMediaType(bytes) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (bytes.length >= 6) {
    const head = bytes.toString('ascii', 0, 6)
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif'
  }
  return undefined
}

/**
 * 归一化媒体类型：显式声明优先，否则按魔数探测；两者都无 → 报错。
 * @param {string|undefined} declared - 调用方显式声明的 mediaType（png/jpeg/webp/gif 或完整 image/*）。
 * @param {Buffer} bytes - 图片字节。
 * @returns {string} 规范 mediaType（image/*）。
 * @throws 无法识别或不支持时抛错。
 */
export function resolveMediaType(declared, bytes) {
  const normalized = typeof declared === 'string' && declared.trim()
    ? (declared.trim().toLowerCase().startsWith('image/') ? declared.trim().toLowerCase() : `image/${declared.trim().toLowerCase()}`)
    : undefined
  const sniffed = sniffMediaType(bytes)
  const mediaType = normalized !== undefined ? normalized : sniffed
  if (mediaType === undefined || !SUPPORTED_MEDIA_TYPES.has(mediaType)) {
    throw new Error(`不支持的图片类型${normalized !== undefined ? `：${normalized}` : '（无法识别）'}，仅支持 PNG/JPEG/WebP/GIF`)
  }
  if (sniffed !== undefined && normalized !== undefined && sniffed !== normalized) {
    throw new Error(`图片类型声明与内容不符：声明 ${normalized}，实际 ${sniffed}`)
  }
  return mediaType
}

/**
 * 构建 detail 中的不可见标记（ASCII 输出，客户端 atob 后可直接 JSON.parse）。
 * @param {string} pickId - 图片注册表键。
 * @param {number[]} imageIndexes - 带图选项的下标集合。
 * @returns {string} 形如 <!--dsh-pick:v1:<base64url JSON>--> 的注释。
 */
export function buildPickMarker(pickId, imageIndexes) {
  const json = JSON.stringify({ pickId, images: imageIndexes })
  return `${MARKER_PREFIX}${Buffer.from(json, 'utf8').toString('base64url')}${MARKER_SUFFIX}`
}

/**
 * 从 detail 中解析标记（服务端侧实现，与客户端 parseMarker 同契约）。
 * @param {string|undefined} detail - 问题的 detail 字段。
 * @returns {{ pickId: string, images: number[], human: string }|null} 无标记返回 null。
 */
export function parsePickMarker(detail) {
  if (typeof detail !== 'string' || !detail.startsWith(MARKER_PREFIX)) return null
  const end = detail.indexOf(MARKER_SUFFIX, MARKER_PREFIX.length)
  if (end < 0) return null
  try {
    const data = JSON.parse(Buffer.from(detail.slice(MARKER_PREFIX.length, end), 'base64url').toString('utf8'))
    if (data === null || typeof data !== 'object' || typeof data.pickId !== 'string') return null
    const images = Array.isArray(data.images) ? data.images.filter((n) => Number.isInteger(n) && n >= 0) : []
    return { pickId: data.pickId, images, human: detail.slice(end + MARKER_SUFFIX.length) }
  } catch {
    return null
  }
}

/**
 * 推导宿主 origin（markdown 图片需要绝对 http(s) URL）。
 * 绑定 0.0.0.0 时对浏览器回退 127.0.0.1；端口用实际监听端口。
 * @param {object} [ctx] - 插件上下文（读取 ctx.webServer.host/port）。
 * @returns {string} 形如 http://127.0.0.1:3080。
 */
export function originOf(ctx) {
  const webServer = ctx?.webServer
  const host = webServer?.host === '0.0.0.0' ? '127.0.0.1' : (typeof webServer?.host === 'string' && webServer.host !== '' ? webServer.host : '127.0.0.1')
  const port = typeof webServer?.port === 'number' ? webServer.port : undefined
  return `http://${host}${port !== undefined ? `:${port}` : ''}`
}

/**
 * 把 caption 转成安全的 markdown alt 文本（去掉会破坏语法的字符）。
 * @param {string|undefined} caption - 图片说明。
 * @returns {string} alt 文本（空 caption 时用「图片」）。
 */
export function safeAlt(caption) {
  const raw = typeof caption === 'string' && caption.trim() !== '' ? caption.trim() : '图片'
  return raw.replace(/[\]\n\r]/g, ' ').slice(0, 200)
}

/**
 * 媒体类型 → 文件扩展名。
 * @param {string} mediaType - image/png 等。
 * @returns {string} 带点扩展名（.png 等）。
 */
export function mediaTypeToExt(mediaType) {
  switch (mediaType) {
    case 'image/png': return '.png'
    case 'image/jpeg': return '.jpg'
    case 'image/webp': return '.webp'
    case 'image/gif': return '.gif'
    default: return ''
  }
}

/**
 * 构造盲模型收图的文本占位符（图片块的模型侧表示）。
 * 含 token `dshimg:<attachmentId>`（客户端据此在用户气泡里回显图片），
 * 以及一句提示语（引导模型用 save_received_images 保存为文件）。
 * @param {object} ref - ImageAttachmentRef { attachmentId, mediaType, bytes, width, height, name? }。
 * @returns {string} 占位符文本。
 */
export function imagePlaceholderText(ref) {
  const id = typeof ref?.attachmentId === 'string' ? ref.attachmentId : 'unknown'
  const name = typeof ref?.name === 'string' && ref.name !== '' ? `（${ref.name}）` : ''
  return `📷 用户发来的图片${name} ${IMAGE_TOKEN_PREFIX}${id}`
}

/**
 * 从文本里提取图片 token 的 attachmentId 列表（客户端回显与冒烟测试用）。
 * @param {string} text - 任意文本。
 * @returns {string[]} attachmentId 列表（去重保序）。
 */
export function extractImageTokenIds(text) {
  if (typeof text !== 'string') return []
  const seen = new Set()
  const ids = []
  const re = new RegExp(`${IMAGE_TOKEN_PREFIX}([A-Za-z0-9_-]{8,})`, 'g')
  let m
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      ids.push(m[1])
    }
  }
  return ids
}

/**
 * 把一条消息里的 image 内容块重写为文本占位符（盲模型适配器不接收图片块）。
 * 重写时登记附件 ref；消息与内容块保持冻结语义（构造新对象）。
 * @param {object} message - UserMessage { id, role, content, source }。
 * @returns {object|null} 重写后的新消息；无图片块时返回 null（原样保留）。
 */
export function rewriteMessageImages(message) {
  if (message === null || typeof message !== 'object' || !Array.isArray(message.content)) return null
  let changed = false
  const content = message.content.map((block) => {
    if (block === null || typeof block !== 'object' || block.type !== 'image' || block.attachment === undefined) return block
    const ref = block.attachment
    recordAttachmentRef(ref)
    changed = true
    return Object.freeze({ type: 'text', text: imagePlaceholderText(ref) })
  })
  if (!changed) return null
  return Object.freeze({ ...message, content: Object.freeze(content) })
}

// ---------------------------------------------------------------------------
// 图片加载
// ---------------------------------------------------------------------------

/** 解析 data URI：data:image/png;base64,xxxx（也兼容无 ;base64 的原样文本，仅 base64 场景）。 */
function decodeDataUri(value) {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(value)
  if (!match) throw new Error('data 字段必须是 data URI（形如 data:image/png;base64,...）')
  const declaredType = match[1] || undefined
  const body = match[3]
  return { declaredType, bytes: Buffer.from(body, 'base64') }
}

/**
 * 加载单个图片字节。
 * @param {object} image - 图片字段 { path?, url?, data?, mediaType? }。
 * @param {string} cwd - 会话工作区（相对路径的基准）。
 * @returns {Promise<{ bytes: Buffer, mediaType: string, name?: string }>}
 * @throws 字段缺失 / 拉取失败 / 类型不支持时抛错（错误信息面向模型）。
 */
export async function loadOptionImage(image, cwd) {
  if (image === null || typeof image !== 'object') throw new Error('image 字段必须是对象')
  const declared = typeof image.mediaType === 'string' ? image.mediaType : undefined

  if (typeof image.data === 'string' && image.data.length > 0) {
    const { declaredType, bytes } = decodeDataUri(image.data)
    if (bytes.byteLength === 0) throw new Error('data URI 内容为空')
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`图片超过大小上限 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MiB`)
    return { bytes, mediaType: resolveMediaType(declared ?? declaredType, bytes) }
  }

  if (typeof image.url === 'string' && image.url.length > 0) {
    let response
    try {
      response = await fetch(image.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    } catch (error) {
      throw new Error(`拉取图片失败：${image.url}（${error instanceof Error ? error.message : String(error)}）`)
    }
    if (!response.ok) throw new Error(`拉取图片失败：${image.url}（HTTP ${response.status}）`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`图片超过大小上限 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MiB`)
    const fromHeader = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
    return { bytes, mediaType: resolveMediaType(declared ?? fromHeader, bytes) }
  }

  if (typeof image.path === 'string' && image.path.length > 0) {
    const target = isAbsolute(image.path) ? image.path : join(cwd, image.path)
    let bytes
    try {
      bytes = await readFile(target)
    } catch (error) {
      throw new Error(`无法读取图片文件：${image.path}（${error instanceof Error ? error.message : String(error)}）`)
    }
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`图片超过大小上限 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MiB`)
    return { bytes, mediaType: resolveMediaType(declared, bytes), name: image.path.split(/[\\/]/).pop() }
  }

  throw new Error('image 必须提供 path / url / data 三者之一')
}

// ---------------------------------------------------------------------------
// 工具定义
// ---------------------------------------------------------------------------

/** 会话工作区（相对路径的基准）。 */
function sessionCwd(agent) {
  const cwd = agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd()
}

/** 三种图片来源的公共 schema 形状。 */
function imageSourceShape() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      path: {
        type: 'string',
        description: '本地图片路径（相对会话工作区或绝对路径，含 AI 出图产物）。'
      },
      url: {
        type: 'string',
        description: 'http(s) 图片地址，服务端拉取后转存显示。'
      },
      data: {
        type: 'string',
        description: 'base64 data URI（data:image/png;base64,...）。'
      },
      mediaType: {
        type: 'string',
        description: '可选：显式声明图片类型（png/jpeg/webp/gif），缺省按内容自动探测。'
      }
    }
  }
}

/**
 * ask_user_choice 工具定义（ctx.tools.register 原始 definition 形状）。
 * @param {object} ctx - 插件上下文（execute 闭包使用 ctx.userQuestions.ask）。
 * @param {object} [opts] - 预留配置（未来可放 TTL / 大小上限覆盖）。
 * @returns {object} 工具 definition。
 */
export function choiceTool(ctx, opts = {}) {
  const optionShape = {
    type: 'object',
    additionalProperties: true,
    required: ['label'],
    properties: {
      label: {
        type: 'string',
        description: '选项文字（展示用，也是用户选中后返回给模型的答案值）。图片选项的 label 请简短，作为图片下的说明文字。'
      },
      description: {
        type: 'string',
        description: '选项补充说明（图片选项显示在图片下方）。'
      },
      image: imageSourceShape()
    }
  }
  return {
    name: 'ask_user_choice',
    description:
      '给用户几个（可含图片的）选项让用户选择。与 ask_user_question 同一答案协议，但每个选项可携带一张图片：' +
      '选项的 image 字段支持 path（本地文件，含 AI 出图产物）、url（http(s) 地址）、data（base64 data URI）三种来源，' +
      '纯文字提问仍用 ask_user_question。图片+文字混合、纯图片、纯文字选项可在同一题内混排；' +
      '推荐项放第一位并在 label 末尾标注 "(Recommended)" 或 "(推荐)"。' +
      '用户点选后返回的 selected 就是该选项的 label 文本。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['questions'],
      properties: {
        questions: {
          type: 'array',
          description: '要问用户的问题列表（一次可问多题，客户端逐题展示）。',
          items: {
            type: 'object',
            additionalProperties: true,
            required: ['id', 'question'],
            properties: {
              id: { type: 'string', description: '稳定问题 id，随答案原样回传。' },
              question: { type: 'string', description: '问题文本。' },
              header: { type: 'string', description: '可选短标题（如 "确认" / "选择模式"）。' },
              detail: { type: 'string', description: '可选补充说明（Markdown 文本，显示在问题下方）。' },
              multi_select: { type: 'boolean', description: '是否允许多选，默认单选。' },
              options: {
                type: 'array',
                description: '选项列表；带 image 的选项渲染为图片卡片，不带 image 的渲染为文字按钮。',
                items: optionShape
              }
            }
          }
        }
      }
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['answers'],
        properties: {
          answers: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'selected'],
              properties: {
                id: { type: 'string' },
                selected: { type: 'array', items: { type: 'string' } },
                custom: { type: 'string' }
              }
            }
          }
        }
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]
    },
    async execute(args, exec) {
      const cwd = sessionCwd(exec?.agent)
      const now = Date.now()
      prunePicks(now)

      // 与浏览器端 askUserQuestionItemSchema（muxFrameSchema）对齐的必填/类型校验：
      // 模型偶发漏传 question 等必填字段时，若原样转发，浏览器 zod 解析会把
      // question/requested 整帧丢弃，选择卡静默不渲染（用户只见"图呢，看不到啊"，
      // 最终 ASK_ABORTED）。这里在服务端提前校验并抛面向模型的错误，让模型自我修正。
      const questions = Array.isArray(args.questions) ? args.questions : []
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi]
        if (q === null || typeof q !== 'object') throw new Error(`questions[${qi}] 必须是对象`)
        if (typeof q.id !== 'string' || q.id === '') throw new Error(`questions[${qi}].id 缺失或不是非空字符串（必填，稳定问题 id，随答案原样回传）`)
        if (typeof q.question !== 'string' || q.question === '') throw new Error(`questions[${qi}].question 缺失或不是非空字符串（必填，用户看到的问题文本；请补上后重新调用 ask_user_choice）`)
        if (q.header !== undefined && typeof q.header !== 'string') throw new Error(`questions[${qi}].header 必须是字符串`)
        if (q.detail !== undefined && typeof q.detail !== 'string') throw new Error(`questions[${qi}].detail 必须是字符串`)
        if (q.multi_select !== undefined && typeof q.multi_select !== 'boolean') throw new Error(`questions[${qi}].multi_select 必须是布尔值`)
        const options = Array.isArray(q.options) ? q.options : []
        for (let oi = 0; oi < options.length; oi++) {
          const o = options[oi]
          if (o === null || typeof o !== 'object') throw new Error(`questions[${qi}].options[${oi}] 必须是对象`)
          if (typeof o.label !== 'string' || o.label === '') throw new Error(`questions[${qi}].options[${oi}].label 缺失或不是非空字符串（必填，选项文字/答案值）`)
          if (o.description !== undefined && typeof o.description !== 'string') throw new Error(`questions[${qi}].options[${oi}].description 必须是字符串`)
          if (o.image !== undefined && o.image !== null && (typeof o.image !== 'object' || o.image === null)) throw new Error(`questions[${qi}].options[${oi}].image 必须是对象（path / url / data 三选一）`)
        }
      }

      // 本次 ask 创建的 pickId，无论成功/失败/中止都统一释放（含中途加载报错）。
      const batches = []
      try {
        // 1) 逐题归一化图片，生成带图问题的 pickId 与标记。
        const askQuestions = []
        for (const question of questions) {
          const options = Array.isArray(question.options) ? question.options : []
          const imageIndexes = []
          const normalized = []
          for (let index = 0; index < options.length; index++) {
            const option = options[index]
            if (option !== null && typeof option === 'object' && option.image !== undefined && option.image !== null) {
              const loaded = await loadOptionImage(option.image, cwd)
              imageIndexes.push(index)
              normalized.push({ label: option.label, description: option.description, image: loaded })
            } else {
              normalized.push({ label: option.label, description: option.description })
            }
          }

          let detail = typeof question.detail === 'string' ? question.detail : ''
          if (imageIndexes.length > 0) {
            const pickId = randomUUID()
            // 按原始选项下标存图片（无图选项留空），保证客户端
            // `/pickId/<原始下标>` 的 URL 与服务端索引一一对应；
            // 紧凑数组会让带图选项下标不连续时错位/404。
            const images = new Array(options.length).fill(undefined)
            for (const index of imageIndexes) images[index] = normalized[index].image
            picks.set(pickId, { createdAt: now, images })
            batches.push(pickId)
            detail = buildPickMarker(pickId, imageIndexes) + detail
          }

          askQuestions.push({
            id: question.id,
            question: question.question,
            ...(question.header !== undefined ? { header: question.header } : {}),
            ...(detail !== '' ? { detail } : {}),
            ...(options.length > 0 ? { options: normalized.map((o) => ({ label: o.label, ...(o.description !== undefined ? { description: o.description } : {}) })) } : {}),
            ...(question.multi_select !== undefined ? { multiSelect: question.multi_select } : {})
          })
        }

        // 2) 走标准问询通道（与 ask_user_question 同款），等待用户回答。
        const result = await ctx.userQuestions.ask({
          questions: askQuestions,
          ...(exec.agent !== undefined ? { agent: exec.agent } : {}),
          ...(exec.signal !== undefined ? { signal: exec.signal } : {})
        })
        return {
          answers: result.answers.map((answer) => ({
            id: answer.id,
            selected: [...answer.selected],
            ...(answer.custom !== undefined ? { custom: answer.custom } : {})
          }))
        }
      } finally {
        // 3) 无论回答、中止还是加载报错，都释放本次图片字节。
        for (const pickId of batches) picks.delete(pickId)
      }
    }
  }
}

/**
 * show_images 工具定义：把图片注册进内存，返回绝对 URL 的 markdown 片段，
 * 模型把片段原样粘贴进回复正文，图片随文字一起显示。
 * @param {object} ctx - 插件上下文（execute 闭包读取 ctx.webServer 推导 origin）。
 * @param {object} [opts] - 预留配置。
 * @returns {object} 工具 definition。
 */
export function showImagesTool(ctx, opts = {}) {
  return {
    name: 'show_images',
    description:
      '在本次回复中向用户展示图片（图片与文字混排）。调用后注册图片并返回 markdown 片段数组。' +
      '⚠️ 关键要求：本工具本身不会把图片显示给用户——图片只有在你的回复正文里出现对应 markdown 片段后才会渲染。' +
      '你必须把返回的 markdown 片段**原样**逐行粘贴进自己的回复正文（每个片段一行，不要改写、不要截断 URL），' +
      '并在粘贴前先写一段过渡文字。绝不允许只说「图在上面」「见下图」却不粘贴片段——那样用户什么都看不到。' +
      '每张图片可带 caption（简短说明，作为图片的 alt/说明文字）。' +
      '图片来源支持 path（本地文件，含 AI 出图产物）、url（http(s) 地址）、data（base64 data URI）三种。' +
      '需要展示多张图时传多张，并把每张的 markdown 片段放在回复中对应位置。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['images'],
      properties: {
        images: {
          type: 'array',
          description: '要在回复中展示的图片列表（1~9 张）。',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['image'],
            properties: {
              image: imageSourceShape(),
              caption: {
                type: 'string',
                description: '可选图片说明文字（简短，显示在图片上/悬停/放大时）。'
              }
            }
          }
        }
      }
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['markdown'],
        properties: {
          markdown: {
            type: 'array',
            items: { type: 'string' },
            description: '粘贴进回复正文的 markdown 图片片段（每项一行）。'
          },
          note: { type: 'string', description: '给模型的提示语。' }
        }
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]
    },
    async execute(args, exec) {
      const cwd = sessionCwd(exec?.agent)
      pruneShows()

      const images = []
      for (const item of args.images ?? []) {
        if (item === null || typeof item !== 'object' || item.image === undefined || item.image === null) {
          throw new Error('images 的每一项都必须提供 image 字段（path / url / data 三选一）')
        }
        const loaded = await loadOptionImage(item.image, cwd)
        images.push({ ...loaded, caption: typeof item.caption === 'string' ? item.caption : undefined })
      }
      if (images.length === 0) throw new Error('images 不能为空')
      if (images.length > 9) throw new Error('一次最多展示 9 张图片')

      const showId = randomUUID()
      shows.set(showId, { createdAt: Date.now(), images })

      const origin = originOf(ctx)
      const markdown = images.map(
        (image, index) => `![${safeAlt(image.caption)}](${origin}${ROUTE_PREFIX}/show/${showId}/${index})`
      )
      return {
        markdown,
        note:
          `⚠️【必做】图片尚未显示给用户！必须把下面 ${markdown.length} 行 markdown 片段**原样逐行**粘贴进你` +
          '本次回复的正文（不要改写、不要截断 URL、不要用「见上图」代替）。不粘贴 = 用户看不到任何图片。片段如下：\n' +
          markdown.join('\n')
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 插件入口
// ---------------------------------------------------------------------------

/**
 * save_received_images 工具定义：把用户发来的图片附件保存为工作区文件。
 * 盲模型（无视觉输入的适配器）经 agent/pre-step 重写把图片块替换为
 * 文本占位符（dshimg:<attachmentId>），模型据此调用本工具把附件字节
 * 落盘，之后可用文件/命令工具分析（尺寸、像素、哈希等）。
 * @param {object} ctx - 插件上下文（execute 闭包使用 ctx.attachments.readImage）。
 * @returns {object} 工具 definition。
 */
export function saveReceivedImagesTool(ctx) {
  return {
    name: 'save_received_images',
    description:
      '把用户发来的图片附件保存为工作区文件（默认保存到 received/ 目录）。' +
      '当用户消息里出现 "📷 用户发来的图片 dshimg:<attachmentId>" 占位符时，' +
      '说明用户上传了一张图片（当前模型无法直接查看）。如需查看/分析该图片：' +
      '调用本工具，把占位符里的 attachmentId 填进 images 数组，工具会把图片写入' +
      '工作区文件并返回路径；之后可用文件读取/命令工具分析该文件（如尺寸、内容等）。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['images'],
      properties: {
        images: {
          type: 'array',
          description: '要保存的图片附件列表（attachmentId 来自用户消息里的 dshimg: 占位符）。',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['attachmentId'],
            properties: {
              attachmentId: {
                type: 'string',
                description: '附件 id（用户消息里 dshimg: 后面的那串）。'
              },
              mediaType: {
                type: 'string',
                description: '可选：image/png|image/jpeg|image/webp|image/gif（占位符未给全时由登记信息补全）。'
              },
              width: { type: 'number', description: '可选：像素宽。' },
              height: { type: 'number', description: '可选：像素高。' },
              bytes: { type: 'number', description: '可选：字节数。' },
              name: { type: 'string', description: '可选：显示名（会被清洗为安全文件名）。' }
            }
          }
        },
        dir: {
          type: 'string',
          description: `可选：保存目录（相对会话工作区，默认 ${RECEIVED_DIR}/）。`
        }
      }
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['saved'],
        properties: {
          saved: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['attachmentId', 'path'],
              properties: {
                attachmentId: { type: 'string' },
                path: { type: 'string' },
                mediaType: { type: 'string' },
                bytes: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                error: { type: 'string' }
              }
            }
          }
        }
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]
    },
    async execute(args, exec) {
      const cwd = sessionCwd(exec?.agent)
      pruneAttachmentRefs()
      const dirName = typeof args.dir === 'string' && args.dir.trim() !== '' ? args.dir.trim() : RECEIVED_DIR
      // 只允许相对路径且不得包含 ..（防越出工作区）；非法直接报工具错误。
      if (isAbsolute(dirName) || dirName.includes('..')) {
        throw new Error(`dir 必须是相对会话工作区的相对路径且不得包含 ".."，收到：${dirName}`)
      }
      const items = Array.isArray(args.images) ? args.images : []
      if (items.length === 0) throw new Error('images 不能为空')

      const saved = []
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        const attachmentId = typeof item?.attachmentId === 'string' ? item.attachmentId : ''
        try {
          if (attachmentId === '') throw new Error('attachmentId 缺失')
          // 合并模型传入的字段与登记信息，构造完整 ref（readImage 会校验 mediaType/bytes/尺寸）。
          const known = resolveAttachmentRef(attachmentId)
          const ref = {
            attachmentId,
            mediaType: item.mediaType ?? known?.mediaType,
            bytes: item.bytes ?? known?.bytes,
            width: item.width ?? known?.width,
            height: item.height ?? known?.height,
            ...(item.name !== undefined ? { name: item.name } : known?.name !== undefined ? { name: known.name } : {})
          }
          if (ref.mediaType === undefined || ref.bytes === undefined || ref.width === undefined || ref.height === undefined) {
            throw new Error(`附件 ${attachmentId} 的元数据不完整（可能是过期占位符），请提供 mediaType/width/height/bytes 或重新触发对话`)
          }
          const stored = await ctx.attachments.readImage(ref, exec?.signal)
          const data = Buffer.from(stored.data)
          const targetDir = join(cwd, dirName)
          await mkdir(targetDir, { recursive: true })
          const ext = mediaTypeToExt(ref.mediaType)
          const rawName = typeof ref.name === 'string' ? basename(ref.name) : ''
          const safeName = rawName !== '' && !rawName.includes('..') && !rawName.includes('/') && !rawName.includes('\\') && /^[\w.-]+$/.test(rawName)
            ? rawName
            : `image-${index + 1}-${Date.now()}${ext}`
          const filePath = join(targetDir, safeName)
          await writeFile(filePath, data)
          saved.push({
            attachmentId,
            path: filePath,
            mediaType: ref.mediaType,
            bytes: data.byteLength,
            width: ref.width,
            height: ref.height
          })
        } catch (error) {
          saved.push({
            attachmentId,
            path: '',
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
      return { saved }
    }
  }
}

export function apply(ctx) {
  // 图片字节服务路由：同源 <img src> 直接加载。
  //   /dsh-plugin-image-tools/<pickId>/<index>        选择卡图片
  //   /dsh-plugin-image-tools/show/<showId>/<index>   回复内嵌图片
  //   /dsh-plugin-image-tools/attachment/<attachmentId>  盲模型收图的附件回显
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      try {
        const method = (req.method ?? 'GET').toUpperCase()
        if (method !== 'GET') {
          res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('method not allowed')
          return
        }
        const url = new URL(req.url ?? '/', 'http://dsh.internal')
        const rest = url.pathname.slice(ROUTE_PREFIX.length).replace(/^\/+/, '')
        if (rest.startsWith('attachment/')) {
          const attachmentId = rest.slice('attachment/'.length)
          const ref = attachmentId !== '' ? resolveAttachmentRef(attachmentId) : undefined
          if (ref === undefined) {
            res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
            res.end('not found')
            return
          }
          const stored = await ctx.attachments.readImage(ref, req.signal)
          res.writeHead(200, {
            'content-type': ref.mediaType,
            'content-length': stored.data.byteLength,
            'cache-control': IMAGE_CACHE_CONTROL,
            'x-content-type-options': 'nosniff'
          })
          res.end(Buffer.from(stored.data))
          return
        }
        let image
        if (rest.startsWith('show/')) {
          const [, showId, indexRaw] = rest.split('/')
          const show = showId !== undefined ? getShow(showId) : undefined
          const index = Number(indexRaw)
          image = show !== undefined && Number.isInteger(index) && index >= 0 ? show.images[index] : undefined
        } else {
          const [pickId, indexRaw] = rest.split('/')
          const pick = pickId !== undefined ? getPick(pickId) : undefined
          const index = Number(indexRaw)
          image = pick !== undefined && Number.isInteger(index) && index >= 0 ? pick.images[index] : undefined
        }
        if (image === undefined) {
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('not found')
          return
        }
        res.writeHead(200, {
          'content-type': image.mediaType,
          'content-length': image.bytes.byteLength,
          'cache-control': IMAGE_CACHE_CONTROL,
          'x-content-type-options': 'nosniff'
        })
        res.end(image.bytes)
      } catch (error) {
        // 响应头已发出时只能掐断连接（writeHead 二次调用会抛 ERR_HTTP_HEADERS_SENT）。
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('internal error')
        } else {
          res.destroy()
        }
      }
    }
  }), 'dsh-plugin-image-tools: image route')

  const disposeChoice = ctx.effect(() => ctx.tools.register(choiceTool(ctx)), 'dsh-plugin-image-tools: ask_user_choice tool')
  const disposeShow = ctx.effect(() => ctx.tools.register(showImagesTool(ctx)), 'dsh-plugin-image-tools: show_images tool')
  const disposeSave = ctx.effect(() => ctx.tools.register(saveReceivedImagesTool(ctx)), 'dsh-plugin-image-tools: save_received_images tool')

  // 盲模型收图：把进入 LLM 步骤的消息批次里的 image 块重写为文本占位符，
  // 避免文本-only 适配器（如 DeepSeek）对图片内容块直接抛 UNSUPPORTED_CONTENT。
  const disposePreStep = ctx.effect(() => ctx.on('agent/pre-step', async ({ agent, messages, turn, step, signal }, next) => {
    const decision = await next()
    if (decision === null || typeof decision !== 'object' || decision.kind !== 'enter') return decision
    let changed = false
    const rewritten = decision.messages.map((message) => {
      const replaced = rewriteMessageImages(message)
      if (replaced !== null) {
        changed = true
        return replaced
      }
      return message
    })
    return changed ? { kind: 'enter', messages: rewritten } : decision
  }), 'dsh-plugin-image-tools: image-to-text pre-step')

  // 模型能力补丁：apiproxy 在 prompt 入队前校验 inputModalities，
  // 盲模型（未声明 image 输入）会直接拒绝带图消息（MODEL_DOES_NOT_SUPPORT_IMAGES）。
  // 这里把 resolveModelInfo 的结果补上 image 模态，放行带图消息进入会话；
  // 图片随后由上面的 pre-step 重写为文本占位符，适配器不会真的收到图片块。
  const llmService = ctx.llm
  const originalResolveModelInfo = llmService !== null && llmService !== undefined && typeof llmService.resolveModelInfo === 'function'
    ? llmService.resolveModelInfo
    : null
  if (originalResolveModelInfo !== null) {
    const patchedResolveModelInfo = async (provider, model, signal) => {
      const info = await originalResolveModelInfo.call(llmService, provider, model, signal)
      if (info === null || typeof info !== 'object') return info
      const modalities = info.inputModalities
      if (modalities === undefined || modalities.includes('image')) return info
      return Object.freeze({ ...info, inputModalities: Object.freeze([...modalities, 'image']) })
    }
    llmService.resolveModelInfo = patchedResolveModelInfo
  }

  ctx.effect(() => () => {
    disposeChoice()
    disposeShow()
    disposeSave()
    disposePreStep()
    // 卸载时还原 llm 能力补丁：仅当当前实现仍是我们打的补丁（排他 patch，
    // 若其它插件在其后又改写了该方法则不动它，避免拆掉别人的补丁）。
    if (originalResolveModelInfo !== null && llmService.resolveModelInfo === patchedResolveModelInfo) {
      llmService.resolveModelInfo = originalResolveModelInfo
    }
    picks.clear()
    shows.clear()
    attachmentRefs.clear()
  })
}
