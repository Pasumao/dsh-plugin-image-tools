/**
 * dsh-plugin-pickimages — 图片 / 图文混合选项插件（服务端半边）
 *
 * 提供 ask_user_choice 工具：与原生 ask_user_question 同一答案协议
 * （answers: [{ id, selected[], custom? }]），但每个选项可携带一张图片，
 * 支持三种来源：
 *   - path：本地文件路径（相对会话工作区或绝对路径，含 ComfyUI 出图等）；
 *   - url：http(s) 图片地址（服务端 fetch 拉取后转存）；
 *   - data：base64 data URI（data:image/png;base64,...）。
 *
 * 为什么图片不走 option 字段：
 *   浏览器端消费 question/requested 帧时用 zod schema 严格解析，选项对象上
 *   的未知字段（如 image）会被剥离，图片数据到不了客户端。因此本插件采用：
 *     1) 服务端把图片字节归一化进内存注册表（pickId → 图片数组），并通过
 *        自定义 web 路由 /dsh-plugin-pickimages/<pickId>/<index> 提供字节；
 *     2) 在问题的 detail（标准字符串字段，原样透传）开头写入一个不可见的
 *        HTML 注释标记 <!--dsh-pick:v1:<base64url JSON>-->，携带 pickId 与
 *        带图选项的下标集合；客户端按标记认领问题并渲染图片选择卡。
 *   纯文字问题不带标记 → 客户端 select 放弃 → 原生文字 UI 兜底，优雅降级。
 *
 * 零运行时依赖：不 import 任何 @deepseek-ai/* 包（与 dsh-plugin-novel 同策略，
 * 工具定义走 ctx.tools.register 的原始 definition 形状）。
 *
 * @module dsh-plugin-pickimages
 */
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const name = 'dsh-plugin-pickimages'
/** 需要的主机端服务：tools（注册工具）、userQuestions（问询）、webServer（图片路由）。 */
export const inject = ['tools', 'userQuestions', 'webServer']

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 图片字节服务路由前缀。 */
export const PICK_PREFIX = '/dsh-plugin-pickimages'
/** 单个图片字节上限（超出直接报错，保护内存）。 */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
/** 未答图片注册条目的存活时间（被放弃的提问最终被清理）。 */
export const IMAGE_TTL_MS = 30 * 60 * 1000
/** 拉取远程图片的超时（ms）。 */
export const FETCH_TIMEOUT_MS = 30 * 1000
/** detail 里不可见标记的前缀/后缀。 */
export const MARKER_PREFIX = '<!--dsh-pick:v1:'
export const MARKER_SUFFIX = '-->'

/** 支持的图片媒体类型。 */
const SUPPORTED_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

// ---------------------------------------------------------------------------
// 内存图片注册表（进程生命周期；每次新增/路由命中时顺带做 TTL 清理）
// ---------------------------------------------------------------------------

/** @type {Map<string, { createdAt: number, images: { bytes: Buffer, mediaType: string, name?: string }[] }>} */
const picks = new Map()

function prunePicks(now = Date.now()) {
  for (const [pickId, pick] of picks) {
    if (now - pick.createdAt > IMAGE_TTL_MS) picks.delete(pickId)
  }
}

function getPick(pickId) {
  prunePicks()
  return picks.get(pickId)
}

// ---------------------------------------------------------------------------
// 纯函数：媒体类型探测 / 标记编解码（导出供 selfcheck 测试）
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
 * 加载单个选项的图片字节。
 * @param {object} image - 选项的 image 字段 { path?, url?, data?, mediaType? }。
 * @param {string} cwd - 会话工作区（相对路径的基准）。
 * @returns {Promise<{ bytes: Buffer, mediaType: string, name?: string }>}
 * @throws 字段缺失 / 拉取失败 / 类型不支持时抛错（错误信息面向模型）。
 */
export async function loadOptionImage(image, cwd) {
  if (image === null || typeof image !== 'object') throw new Error('选项的 image 字段必须是对象')
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

  throw new Error('选项的 image 必须提供 path / url / data 三者之一')
}

// ---------------------------------------------------------------------------
// 工具定义
// ---------------------------------------------------------------------------

/** 会话工作区（相对路径的基准）。 */
function sessionCwd(agent) {
  const cwd = agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd()
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
      image: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: {
            type: 'string',
            description: '本地图片路径（相对会话工作区或绝对路径）。'
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

      // 本次 ask 创建的 pickId，无论成功/失败/中止都统一释放（含中途加载报错）。
      const batches = []
      try {
        // 1) 逐题归一化图片，生成带图问题的 pickId 与标记。
        const askQuestions = []
        for (const question of args.questions ?? []) {
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
            picks.set(pickId, { createdAt: now, images: normalized.filter((o) => o.image !== undefined).map((o) => o.image) })
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

// ---------------------------------------------------------------------------
// 插件入口
// ---------------------------------------------------------------------------

export function apply(ctx) {
  // 图片字节服务路由：同源 <img src> 直接加载。
  const disposeRoute = ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: PICK_PREFIX,
    handler: (req, res) => {
      try {
        const method = (req.method ?? 'GET').toUpperCase()
        if (method !== 'GET') {
          res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('method not allowed')
          return
        }
        const url = new URL(req.url ?? '/', 'http://dsh.internal')
        const rest = url.pathname.slice(PICK_PREFIX.length).replace(/^\/+/, '')
        const [pickId, indexRaw] = rest.split('/')
        const pick = pickId !== undefined ? getPick(pickId) : undefined
        const index = Number(indexRaw)
        const image = pick !== undefined && Number.isInteger(index) && index >= 0 ? pick.images[index] : undefined
        if (image === undefined) {
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('not found')
          return
        }
        res.writeHead(200, {
          'content-type': image.mediaType,
          'content-length': image.bytes.byteLength,
          'cache-control': 'private, max-age=300',
          'x-content-type-options': 'nosniff'
        })
        res.end(image.bytes)
      } catch (error) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('internal error')
      }
    }
  }), 'dsh-plugin-pickimages: image route')

  const disposeTool = ctx.effect(() => ctx.tools.register(choiceTool(ctx)), 'dsh-plugin-pickimages: ask_user_choice tool')

  ctx.effect(() => () => {
    disposeRoute()
    disposeTool()
    picks.clear()
  })
}
