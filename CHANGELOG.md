# Changelog

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
