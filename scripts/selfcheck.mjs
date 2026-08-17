/**
 * dsh-plugin-pickimages 自检：对 lib/index.js 导出的纯函数做离线冒烟测试。
 * 运行：node scripts/selfcheck.mjs
 */
import { strict as assert } from 'node:assert'
import {
  sniffMediaType,
  resolveMediaType,
  buildPickMarker,
  parsePickMarker,
  loadOptionImage,
  MAX_IMAGE_BYTES,
} from '../lib/index.js'

let passed = 0
async function ok(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

async function main() {
  console.log('[dsh-plugin-pickimages] selfcheck')

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

  console.log(`\n[dsh-plugin-pickimages] ${passed} checks passed`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
