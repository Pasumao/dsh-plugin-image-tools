/**
 * dsh-plugin-image-tools 自检：对 lib/index.js 导出的纯函数做离线冒烟测试。
 * 运行：node scripts/selfcheck.mjs
 */
import { strict as assert } from 'node:assert'
import {
  sniffMediaType,
  resolveMediaType,
  buildPickMarker,
  parsePickMarker,
  loadOptionImage,
  originOf,
  safeAlt,
  mediaTypeToExt,
  imagePlaceholderText,
  extractImageTokenIds,
  rewriteMessageImages,
  MAX_IMAGE_BYTES,
} from '../lib/index.js'

let passed = 0
async function ok(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

async function main() {
  console.log('[dsh-plugin-image-tools] selfcheck')

  // --- sniffMediaType ---
  await ok('sniff PNG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    assert.equal(sniffMediaType(png), 'image/png')
  })
  await ok('sniff JPEG', () => {
    assert.equal(sniffMediaType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
  })
  await ok('sniff WebP', () => {
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])
    assert.equal(sniffMediaType(webp), 'image/webp')
  })
  await ok('sniff GIF', () => {
    assert.equal(sniffMediaType(Buffer.from('GIF89a')), 'image/gif')
  })
  await ok('sniff unknown -> undefined', () => {
    assert.equal(sniffMediaType(Buffer.from('hello world')), undefined)
  })

  // --- resolveMediaType ---
  await ok('resolve by magic bytes', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.equal(resolveMediaType(undefined, png), 'image/png')
  })
  await ok('resolve honors declared type', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.equal(resolveMediaType('png', png), 'image/png')
    assert.equal(resolveMediaType('image/png', png), 'image/png')
  })
  await ok('resolve rejects mismatch', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.throws(() => resolveMediaType('jpeg', png), /不符/)
  })
  await ok('resolve rejects unsupported', () => {
    assert.throws(() => resolveMediaType('image/bmp', Buffer.from([0x42, 0x4d])), /不支持/)
    assert.throws(() => resolveMediaType(undefined, Buffer.from('nope')), /无法识别/)
  })

  // --- 标记编解码 round-trip（ASCII JSON，客户端 atob 可直接解析） ---
  await ok('marker round-trip', () => {
    const marker = buildPickMarker('abc-123', [0, 2, 5])
    const parsed = parsePickMarker(marker + '\n\n补充说明')
    assert.deepEqual(parsed, { pickId: 'abc-123', images: [0, 2, 5], human: '\n\n补充说明' })
    assert.ok(/^[A-Za-z0-9_-]+$/.test(marker.slice('<!--dsh-pick:v1:'.length, marker.length - '-->'.length)))
  })
  await ok('marker absent -> null', () => {
    assert.equal(parsePickMarker(undefined), null)
    assert.equal(parsePickMarker('普通 detail'), null)
    assert.equal(parsePickMarker('<!--dsh-pick:v1:broken-->'), null)
  })

  // --- originOf（show_images 的绝对 URL 推导） ---
  await ok('origin uses host/port', () => {
    assert.equal(originOf({ webServer: { host: '127.0.0.1', port: 3080 } }), 'http://127.0.0.1:3080')
  })
  await ok('origin falls back for 0.0.0.0', () => {
    assert.equal(originOf({ webServer: { host: '0.0.0.0', port: 5173 } }), 'http://127.0.0.1:5173')
  })
  await ok('origin tolerates missing ctx', () => {
    assert.equal(originOf(undefined), 'http://127.0.0.1')
    assert.equal(originOf({}), 'http://127.0.0.1')
  })

  // --- safeAlt（caption → markdown alt 安全文本） ---
  await ok('safeAlt keeps normal caption', () => {
    assert.equal(safeAlt('深海鲸鱼封面'), '深海鲸鱼封面')
  })
  await ok('safeAlt strips markdown-breaking chars', () => {
    assert.equal(safeAlt('A]B\nC\rD'), 'A B C D')
    assert.equal(safeAlt('   '), '图片')
    assert.equal(safeAlt(undefined), '图片')
  })

  // --- 盲模型收图：媒体类型/占位符/token 提取/消息重写 ---
  await ok('mediaTypeToExt maps', () => {
    assert.equal(mediaTypeToExt('image/png'), '.png')
    assert.equal(mediaTypeToExt('image/jpeg'), '.jpg')
    assert.equal(mediaTypeToExt('image/webp'), '.webp')
    assert.equal(mediaTypeToExt('image/gif'), '.gif')
    assert.equal(mediaTypeToExt('image/bmp'), '')
  })
  await ok('imagePlaceholderText embeds token', () => {
    const text = imagePlaceholderText({ attachmentId: 'abc123def456', mediaType: 'image/png', width: 10, height: 20 })
    assert.ok(text.includes('dshimg:abc123def456'), '占位符应含 token')
    assert.ok(text.includes('图片'), '占位符应说明是图片')
  })
  await ok('extractImageTokenIds finds ids', () => {
    assert.deepEqual(extractImageTokenIds('📷 图片 dshimg:aaa111bbb222 和 dshimg:ccc333ddd444 和 dshimg:aaa111bbb222'), ['aaa111bbb222', 'ccc333ddd444'])
    assert.deepEqual(extractImageTokenIds('没有 token'), [])
    assert.deepEqual(extractImageTokenIds(undefined), [])
  })
  await ok('rewriteMessageImages replaces image block', () => {
    const ref = { attachmentId: 'abc123def456', mediaType: 'image/png', bytes: 4, width: 10, height: 20, name: 'shot.png' }
    const message = { id: 'm1', role: 'user', source: { kind: 'direct' }, content: [
      { type: 'text', text: '看看这张图' },
      { type: 'image', attachment: ref },
    ] }
    const rewritten = rewriteMessageImages(message)
    assert.ok(rewritten !== null, '应返回重写后的消息')
    assert.equal(rewritten.id, 'm1', 'id 保留')
    assert.equal(rewritten.content.length, 2)
    assert.equal(rewritten.content[0].type, 'text')
    assert.equal(rewritten.content[1].type, 'text', 'image 块应变为 text 块')
    assert.ok(rewritten.content[1].text.includes('dshimg:abc123def456'), '占位符应含 token')
    assert.ok(Object.isFrozen(rewritten), '新消息应冻结')
    // 原消息不被修改
    assert.equal(message.content[1].type, 'image')
  })
  await ok('rewriteMessageImages leaves text-only messages alone', () => {
    const message = { id: 'm2', role: 'user', source: { kind: 'direct' }, content: [{ type: 'text', text: 'hi' }] }
    assert.equal(rewriteMessageImages(message), null)
    assert.equal(rewriteMessageImages(null), null)
    assert.equal(rewriteMessageImages({ id: 'x', content: 'not-array' }), null)
  })

  // --- loadOptionImage：data URI / path（url 需要网络，跳过） ---
  await ok('load data URI', async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const data = `data:image/png;base64,${pngBytes.toString('base64')}`
    const loaded = await loadOptionImage({ data }, process.cwd())
    assert.equal(loaded.mediaType, 'image/png')
    assert.deepEqual(loaded.bytes, pngBytes)
  })
  await ok('load data URI respects declared mediaType', async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const data = `data:image/png;base64,${pngBytes.toString('base64')}`
    const loaded = await loadOptionImage({ data, mediaType: 'png' }, process.cwd())
    assert.equal(loaded.mediaType, 'image/png')
  })
  await ok('load rejects declared/media mismatch', async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const data = `data:image/png;base64,${pngBytes.toString('base64')}`
    await assert.rejects(() => loadOptionImage({ data, mediaType: 'webp' }, process.cwd()), /不符/)
  })
  await ok('load rejects bad data URI', async () => {
    await assert.rejects(() => loadOptionImage({ data: 'not-a-uri' }, process.cwd()), /data URI/)
  })
  await ok('load rejects missing sources', async () => {
    await assert.rejects(() => loadOptionImage({}, process.cwd()), /path \/ url \/ data/)
  })
  await ok('load rejects oversized', async () => {
    // 构造一个超过上限的 data URI（只做 base64 展开，不落盘）
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1, 0x89)
    await assert.rejects(
      () => loadOptionImage({ data: `data:image/png;base64,${big.toString('base64')}` }, process.cwd()),
      /大小上限/,
    )
  })

  console.log(`\n[dsh-plugin-image-tools] ${passed} checks passed`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
