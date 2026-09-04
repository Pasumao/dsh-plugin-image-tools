# Changelog

## [0.6.6] - 2026-09-04

- 文档：中英 README 新增「兼容性」节——实测于 dsh 0.1.2-rc.1；选择卡 0.6.5 起适配
  `pendingInteraction` / `PendingQuestion` 新协议；聊天图片放大依赖的 `data-chat-flow`
  容器、`dshimg:` 占位符、lightbox 已逐一核验保留；测试基建自带 react/react-dom@19
  devDependencies，`npm run smoke` 不再依赖宿主安装布局。
# Changelog

## [0.6.5] - 2026-09-04

- 适配 dsh 0.1.2-rc.1：conversation.composer 链条目 select 入参由 `{interactions}` 改为 `{pendingInteraction}`（原生 PendingQuestion 单对象），按 questions/answer/cancel 鸭子类型认领带图片标记的问题批，plan-review 放行；
- 待答载体 PendingChoice 改为包装 PendingQuestion（`.answer({answers})` / `.cancel()` 直调，替代旧 `wait.respond` 协议）；
- DOM 增强部分（data-chat-flow 容器、dshimg 占位符、lightbox）经核验在新版 dsh-client-ui-chat 中锚点全部保留，无需改动。
# Changelog

## [0.6.4] - 2026-08-29

- 文档：「实现要点」整节下移到「模型用法示例」之后（访客先看价值再看原理）；
- 元数据：npm description 补齐第三个工具 save_received_images，keywords 12 → 19；
- 新增英文版 README.en.md 与双语切换行；CHANGELOG.md 纳入 npm files。
## [0.6.3] - 2026-08-25

- 相关插件段新增 dsh-plugin-windows-guard（Windows 环境防坑守则 skill 插件，互相引流）。


## [0.6.2] - 2026-08-21

- 修复：**历史消息里的图片"见过就消失"**——图片路由（选择卡 pick / 回复内嵌
  show / 附件回显 attachment）此前只下发 `Cache-Control: private, max-age=300`
  （5 分钟），且图片字节仅存服务端内存注册表（30 分钟 TTL / 重启即失效）。当
  源文件在文件夹里被删除/覆盖、或注册表条目过期后，浏览器刷新/回看历史消息
  会重新向服务端请求图片 → 404，图片加载不出来。
  现在三个路由统一改为 `Cache-Control: private, max-age=2592000, immutable`
  （30 天）。这些 URL 是内容寻址的（pickId/showId 为 UUID、attachmentId 为内容
  哈希），同一 URL 的字节永不变，下发 immutable 长缓存完全安全：图片一旦在
  浏览器里加载成功，字节就留在浏览器本地缓存，此后源文件消失、TTL 清理、
  进程重启都不影响——浏览器直接命中缓存，不再向服务端发请求。
- 测试：smoke-server 增加三处路由的 `cache-control` 长缓存断言。

## [0.6.1] - 2026-08-19

- README：新增「相关插件」互相引用段（列出同系列已发布插件，npm / GitHub 链接 + 一句话说明），互相引流。
- 修复：**放大后拖拽看不到图片右侧/下侧**——此前放大层的基准尺寸（`base`）在
  打开时用 `getBoundingClientRect` 一次性实测，若在图片加载完成前缩放（或之后
  视口变化，如 Ctrl+滚轮页面缩放），基准就失效，平移被钳死在 0，拖不到图片右半
  部分。现改为**从图片自然尺寸 + 当前视口实时推导基准**（新增纯函数
  `fitBaseSize`，与 `.dshpick-lightboxFigure img` 的 CSS 约束一致），每次缩放/
  平移/视口变化（监听 `resize`）都重新钳制，左右/上下边缘均可拖到；图片加载前
  不做任何缩放变换，无闪位。
- 测试：冒烟测试更新 `clampPan`（新基准形状 `{w0,h0}`）并新增 `fitBaseSize`
  用例（宽图/高图/小于约束/小视口）。

## [0.6.0] - 2026-08-19

- 新功能：**放大层内图片缩放**——聊天栏图片点击放大后，可用**滚轮缩放图片**
  （普通滚轮即可，光标中心缩放）、底部的 −/+/重置 按钮、**双击**在 1x 与 2.5x 间
  切换、放大后**拖拽平移**、快捷键 `+`/`-`/`0`/`Esc`。
  命令式放大层（聊天图片）与 React 选择卡 Lightbox（ask_user_choice 选项图）
  共用同一套缩放参数与样式。
- 说明：`Ctrl+滚轮` 是**浏览器级页面缩放**（Chrome/Edge/Firefox 在浏览器进程处理，
  网页无法用 preventDefault 拦截）；事件到达页面时这里也会同步缩放图片并尽力
  阻止，但页面缩放本身拦不住——放大图片请用普通滚轮或 + 按钮。
- 实现：新增纯函数 `clampZoom` / `wheelZoomFactor` / `zoomTranslate`（光标中心缩放）/
  `clampPan`（平移钳制：小于视口回中、超出视口限位保证图像覆盖视口）；放大层
  遮罩加 `overflow:hidden`、控制条与抓取光标样式。
- 测试：客户端冒烟测试新增缩放纯函数用例（范围钳制、滚轮方向、光标中心不动性、
  平移钳制边界）。

## [0.5.0] - 2026-08-19

- 新功能：**聊天栏所有图片点击放大**——不止插件自己的图片，模型回复 markdown
  渲染出的任意 http(s) 图片（聊天消息列 `[data-chat-flow]` 内的内容图）现在都
  支持点击放大查看（复用 Lightbox 样式，Esc / 点遮罩 / 关闭按钮退出）。
  判定规则：插件图片（show/attachment 路由）无条件放大；其他图片要求位于聊天栏、
  不在按钮/链接等交互控件内（附件缩略图等保留各自原生 lightbox）、且达到内容图
  尺寸阈值（渲染宽 ≥ 40px 或自然宽 ≥ 160px，跳过图标/头像）。
- 修复：`show_images` 回复内嵌图片此前**无法放大**——markdown 里是绝对 URL
  （`http://host:port/dsh-plugin-image-tools/show/...`），而增强器观察器用
  `img[src^="/dsh-plugin-image-tools/show/"]` 前缀匹配，绝对 URL 永远扫不到，
  圆角样式与点击放大都不生效。现改为按内容包含匹配（`img[src*="..."]`），
  并新增 document 级点击委托作为统一放大入口（不再逐图挂监听）。
- 增强：盲模型收图回显、选择卡、插件内嵌图片的放大行为保持不变（委托统一处理，
  选择卡内图片仍由卡片自己的放大逻辑负责）。
- 测试：客户端冒烟测试新增 `isPluginImageSrc` / `isZoomableChatImage` 纯函数用例
  （聊天栏内外、小图标、按钮内、选择卡内、插件图无条件放大等）。

## [0.4.1] - 2026-08-19

- 修复：`ask_user_choice` 对必填/类型字段做服务端校验（与浏览器端
  `muxFrameSchema` 的 `askUserQuestionItemSchema` 对齐）。此前模型偶发漏传
  `question`（或 `id`/`label` 等）字段时，服务端原样转发，浏览器 zod 解析把
  `question/requested` 整帧丢弃，选择卡静默不渲染——用户只见模型文字而看不到
  图片卡，最终只能手动停止（`ASK_ABORTED`）。现在缺失/类型错误会在服务端抛
  面向模型的清晰错误，模型自我修正后重新调用即可。
- 修复：选择卡图片注册表按**原始选项下标**存图（此前是只含带图选项的紧凑数组）。
  当带图选项下标不从 0 开始连续（如图片选项前面有文字选项）时，客户端
  `/pickId/<原始下标>` 的图片 URL 会错位或 404；现在一一对应。
- 测试：冒烟测试扩展覆盖必填校验与下标对应。

## [0.4.0] - 2026-08-17

- 新功能：**盲模型收图**（无视觉输入模型接收用户图片，作为文件处理）：
  - `agent/pre-step` 监听器把消息里的 image 内容块重写为文本占位符
    `📷 用户发来的图片 dshimg:<attachmentId>`——文本-only 适配器不再抛
    `UNSUPPORTED_CONTENT`，回合正常进行；
  - `ctx.llm.resolveModelInfo` 能力补丁（保留原方法，`inputModalities` 补 `image`）——
    放行 apiproxy 的 prompt 入队校验（`MODEL_DOES_NOT_SUPPORT_IMAGES`）；卸载时还原；
  - 新工具 `save_received_images`：按 attachmentId 经 `ctx.attachments.readImage`
    取回附件字节并落盘工作区（默认 `received/`），返回路径与元数据；
  - 新路由 `/dsh-plugin-image-tools/attachment/<attachmentId>`：用户气泡回显图片；
  - 客户端增强器识别 `dshimg:` 占位符，在用户气泡里替换为可放大的图片。
- 效果图换为真实 Web GUI 截图（用户提供），删除程序化合成脚本。
- 冒烟测试扩展：pre-step 重写、附件路由、save_received_images 落盘、llm 补丁。

## [0.3.1] - 2026-08-17

- 修复：选择卡与消息列对齐——CSS 变量加缺省回退（防止主题变量缺失时卡片全宽贴左）、
  标题/说明/图片网格/选项行统一 24px 左缩进、顶部留白加大。
- 修复：回复内嵌图片加载失败时的降级样式。
- 文档：README 效果图按修复后布局重新合成（docs/mockup-*.png），docs 纳入发布内容。

## [0.3.0] - 2026-08-17

- 更名：`dsh-plugin-pickimages` → `dsh-plugin-image-tools`（目录/包名/bundle id/
  路由前缀 `/dsh-plugin-image-tools`/客户端模块 id 全量同步，novel 插件引用一并更新）。
- 新功能：`show_images` 工具——在回复正文中展示图片（图片与文字混排），
  返回绝对 URL 的 markdown 片段，客户端对 `/dsh-plugin-image-tools/show/` 图片做
  渐进增强（圆角样式、悬停说明、点击放大查看、加载失败降级）。
- 图片注册表拆分为 picks（选择卡，回答即释放）与 shows（回复内嵌，TTL 清理）；
  路由支持 `/<pickId>/<index>` 与 `/show/<showId>/<index>` 两种形态。
- 冒烟测试扩展：show_images 全链路（注册→markdown→路由出图→存活）、originOf/safeAlt 纯函数。

## [0.2.0] - 2026-08-17

- 图片选择卡新增放大查看（Lightbox）：点击缩略图或放大镜弹出大图，Esc/点遮罩/关闭按钮退出。
- 图片/文字/图文混排选项、多题分页、多选、自定义答案、推荐标注等交互完善。

## [0.1.0] - 2026-08-17

- 首个版本（`dsh-plugin-pickimages`）：`ask_user_choice` 图片/图文混合选项工具，
  detail 不可见标记 + 内存图片注册表 + 自定义图片路由，纯插件实现不改核心包。
