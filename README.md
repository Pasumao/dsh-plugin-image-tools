# dsh-plugin-pickimages

给 DeepSeek Harness Web GUI 增加**图片 / 图文混合选项**能力的插件。

模型在需要用户从选项中做选择时，除了原生 `ask_user_question`（纯文字），现在
还可以用本插件的 `ask_user_choice` 工具：**每个选项都可以带一张图片**，
纯图片、纯文字、图片+文字可以在同一道题内混排。Web 端渲染成图片卡片选择卡，
答案协议与原生完全一致（`answers: [{ id, selected[], custom? }]`）。

## 功能

- 新工具 `ask_user_choice`，与 `ask_user_question` 同协议，选项额外支持 `image` 字段：
  - `path`：本地图片路径（相对会话工作区或绝对路径）——兼容 ComfyUI 出图等磁盘文件；
  - `url`：http(s) 图片地址，服务端拉取后转存显示；
  - `data`：base64 data URI（`data:image/png;base64,...`）；
  - `mediaType`（可选）：显式声明 `png/jpeg/webp/gif`，缺省按内容自动探测。
- 支持：多题分页、单选/多选、图片+文字混排、自定义答案、跳过、推荐标注
  （label 末尾 `(Recommended)` / `(推荐)`）。
- 图片放大查看：点击图片卡片上的放大镜按钮（或图片本身）弹出 Lightbox 大图，
  支持 Esc / 点击遮罩 / 关闭按钮退出；期间锁定页面滚动。
- 纯文字问题不带图片时，客户端自动放行给原生 UI，互不影响。

## 实现要点（为什么是插件而不是改核心）

浏览器端消费 `question/requested` 帧时用 zod schema 严格解析，选项对象上的未知
字段会被剥离，所以图片**不能**塞进 option 字段。本插件改为：

1. 服务端把图片字节归一化进内存注册表，通过自定义 web 路由
   `/dsh-plugin-pickimages/<pickId>/<index>` 直接提供字节（同源 `<img src>` 加载）；
2. 在问题的 `detail`（标准字符串字段，原样透传）开头写入不可见的 HTML 注释标记
   `<!--dsh-pick:v1:<base64url JSON>-->`，携带 pickId 与带图选项下标；
3. 客户端插件在 `conversation.composer` slot 链注册条目（priority 更小，优先于原生），
   识别标记后渲染图片选择卡；无标记的问题交给原生 UI。

详见 `设计说明.md`。

## 目录结构

```
lib/index.js          服务端：工具注册 + 图片注册表 + web 路由（零运行时依赖）
lib/client.js         客户端：composer 链条目 + 图片选择 UI（浏览器模块加载器格式，免构建）
scripts/selfcheck.mjs     纯函数自检（node scripts/selfcheck.mjs）
scripts/smoke-server.mjs  服务端集成冒烟（假 ctx 跑通工具→路由→回答全链路）
scripts/smoke-client.mjs  客户端冒烟（真实 react 渲染一次选择卡）
cordis.patch.yml      bundle 补丁（挂载行）
```

## 安装（web profile）

```powershell
# 1. 把插件 link 进 profile（已写入 package.json 时跳过这步的编辑）
cd C:\Users\18303\.dsh\profiles\web
pnpm install

# 2. 重启 dsh（launcher），然后刷新浏览器页面
```

profile 的 `package.json` 需要包含：

```jsonc
{
  "dependencies": {
    "dsh-plugin-pickimages": "link:D:/dsh/plugins/dsh-plugin-pickImages"
  },
  "dsh": {
    "profile": {
      "bundles": [ /* ... */, "dsh-plugin-pickimages" ]
    }
  }
}
```

`dsh.profile.bundles` 里的包会自动应用其自带 `cordis.patch.yml` 的挂载行
（与 dsh-notify 同机制）。

## 模型用法示例

```jsonc
// 调用 ask_user_choice
{
  "questions": [
    {
      "id": "cover",
      "question": "选一张封面图",
      "header": "封面选择",
      "options": [
        { "label": "深海鲸鱼 (Recommended)", "image": { "path": "novel/assets/covers/whale.png" } },
        { "label": "星空",
          "image": { "url": "https://example.com/stars.png" } },
        { "label": "手绘风",
          "image": { "data": "data:image/png;base64,iVBORw0KGgo..." } },
        { "label": "都不选，我自己说", "description": "选这个可以在下方输入自定义答案" }
      ],
      "multi_select": false
    }
  ]
}
// 返回：{ "answers": [ { "id": "cover", "selected": ["深海鲸鱼 (Recommended)"] } ] }
```

## 安全与限制

- 图片字节仅存于进程内存，随问题回答/取消立即释放；未答的提问 30 分钟后 TTL 清理。
- 单张图片上限 20 MiB；仅支持 PNG / JPEG / WebP / GIF（按魔数校验，声明不符会报错）。
- 图片路由为同源普通 HTTP 路由（与 GUI 同信任级别），未加额外鉴权。

## 许可证

MIT
