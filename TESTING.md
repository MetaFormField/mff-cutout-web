# 第一阶段真实验收记录

测试日期：2026-11-23（Asia/Shanghai）  
环境：Windows，Codex 内置 Chromium，16 逻辑线程，浏览器上报约 32 GB 内存提示。

## 浏览器推理结果

浏览器暴露 WebGPU，但本次 WebGPU 路径未通过 BG0 的有效 Mask 检查，随后自动回退到 WASM 并成功完成。首次运行包含 FP16 模型下载、回退后的 FP32 模型下载、初始化、推理与 PNG 导出，总耗时 303.9 秒。模型已加载后，单图约 2.9–3.1 秒。

| 用例 | 原图 / 导出尺寸 | 后端 | 耗时 | PNG Alpha 检查 | 观察 |
| --- | --- | --- | ---: | --- | --- |
| 简单人物 | 960 × 1786 / 960 × 1786 | WASM | 303.9 s（含首次下载与回退） | 0–255；透明 1,270,548；半透明 17,067 | 主体完整，头发与身体边缘有少量浅色边缘 |
| 复杂户外人物 | 960 × 1198 / 960 × 1198 | WASM | 3.0 s | 0–255；透明 485,265；半透明 10,642 | 人物识别正确，发型与衣袖边缘略硬 |
| 商品杯子 | 960 × 740 / 960 × 740 | WASM | 3.0 s | 0–255；透明 695,578；半透明 1,423 | 杯子与杯把保留，背景透明，主体在画面中占比较小仍能识别 |
| 短发与细边缘人物 | 896 × 1212 / 896 × 1212 | WASM | 3.1 s | 0–255；透明 448,111；半透明 9,972 | 短发轮廓基本保留，头顶少量细发被合并或削弱 |

四个下载文件均由实际下载按钮生成，经解码确认 `format=png`、`channels=4`、`hasAlpha=true`。尺寸与原图相同，未重新编码为 JPEG。

## 缓存与异常

- 刷新页面后再次处理商品图，界面显示 `Loading cached model…`，没有重新下载模型，初始化加推理 5.0 秒。
- 非 JPG/PNG 文件在浏览器中显示中文错误：`仅支持 JPG、JPEG、PNG 图片。`
- 单元测试覆盖 15 MB 限制、错误格式、成功解码、取消任务立即结算和 iOS/iPadOS 检测。
- `@bg0/browser@0.1.1` 在 ONNX 推理已经开始后不能真正终止底层计算；MFF CUTOUT 会立即结束当前 UI 任务、忽略迟到结果并防止旧任务覆盖新任务。底层计算可能继续到当前推理结束，这是当前发布版的限制。

## 模型缓存与体积

- WebGPU FP16：约 98.5 MB。
- WASM FP32：约 191.9 MB。
- 本次因 WebGPU 回退到 WASM，两套权重均被请求，模型下载合计约 290.4 MB（不含约 21.6 MB 的 ONNX Runtime WASM 静态资源与其他前端代码）。
- HTTPS/安全上下文优先使用 Cache API；开发环境可回退 IndexedDB。浏览器隐私模式、配额清理或站点数据清除会导致重新下载。

## 隐私与网络检查

项目源码没有 `fetch`、`XMLHttpRequest`、`FormData`、上传接口、分析 SDK 或后端地址。`@bg0/browser` 只从固定 revision 的 Hugging Face 模型地址加载配置与 ONNX 权重；图片以 `File`/`Blob` 进入本地解码、推理、Canvas Alpha 合成和 Blob 下载链路，没有序列化到网络请求。

## 测试图片来源

第一阶段的测试图均放在 `tests/fixtures/`。视觉改版后，生产构建还会打包 CC0 商品图作为首页示例：

- 简单人物：[Portrait of woman.jpg](https://commons.wikimedia.org/wiki/File:Portrait_of_woman.jpg)，CC0。
- 复杂户外人物：[Outdoors-man-portrait (cropped).jpg](https://commons.wikimedia.org/wiki/File:Outdoors-man-portrait_(cropped).jpg)，CC0。
- 商品：[White Ceramic Cup (28217866307).jpg](https://commons.wikimedia.org/wiki/File:White_Ceramic_Cup_(28217866307).jpg)，CC0。
- 细边缘人物：[Self portrait 2.jpg](https://commons.wikimedia.org/wiki/File:Self_portrait_2.jpg)，CC BY-SA 2.0，Rachel Black。

## 兼容性结论

- Chrome / Edge：优先 WebGPU，失败时自动回退 WASM。本机实际回退 WASM 成功。
- Firefox：预期走 WASM；本轮未做物理浏览器验证。
- macOS Safari：取决于 WebGPU/ONNX Runtime 支持，可回退 WASM；本轮未验证。
- iPhone / iPad：MFF CUTOUT 会在浏览器本地把最长边限制为 1280px并明确显示真实导出尺寸；未在物理 iOS 设备验证。npm 发布版 `0.1.1` 尚未包含 GitHub `main` 上专用的单线程 iOS Worker，因此仍存在 Safari 标签页内存风险。

## 第二阶段工作台验收

测试日期：2026-11-24（Asia/Shanghai）。环境为云端 Linux，Chromium 156，桌面视口 1440 × 940，移动端使用 390 × 844 视口和触摸事件。

| 验收项 | 实测结果 |
| --- | --- |
| 上传、状态和异常 | 文件选择、拖拽、粘贴、非法文件提示、替换确认与取消通过。注入测试结果时，下载模型、AI 处理中和完成状态依次显示。 |
| 前后对比 | 鼠标拖动、方向键和移动端触摸拖动通过。原图和结果的显示边界完全重合，支持仅看结果。 |
| 预览背景与 PNG | 透明、白、黑三种预览背景导出文件字节完全一致。解码确认尺寸 960 × 740，包含 Alpha 0 和 255。 |
| 画笔、历史 | 检查显示缩放后的落点、连续笔画、柔边半透明像素、鼠标与触摸画笔、按钮与快捷键撤销、重做、重做分支清除和恢复初始结果。 |
| PNG、ZIP 与错误恢复 | 默认命名、自定义中文文件名和非法字符替换通过。ZIP 仅含一张正确命名的 PNG，解压内容与单独下载的 PNG 字节一致。模拟编码失败后，编辑仍在，再次下载成功。 |
| 移动布局 | 390 px 宽无横向溢出，预览位于工具栏上方。触摸对比、绘制和撤销通过，也完成了 PNG 下载。 |
| 现有测试与构建 | Vitest 共 10 个测试通过，包含第一阶段的 5 个测试。生产构建通过，仍有第一阶段已有的 Transformers 大分包提示。 |
| 真实 AI 推理 | Chromium 实测进入原有 BG0 模型加载路径，Hugging Face 请求被云端代理阻断。中文错误和重试已验证，域名放行申请未获批准，当前云端的真实推理成功路径待复验。 |

工作台验收使用既有商品 JPG 和可确定 Alpha 的测试 PNG。浏览器自动化仅在测试进程中替换推理返回值，其他步骤使用应用自己的上传、Canvas 编辑、历史和下载。生产源码沿用第一阶段的推理服务与依赖版本。移动端测试使用 Chromium 触摸模拟，物理 iOS Safari 待验证。

## 第二阶段视觉改版

云端 Chromium 在桌面 1440 px 和触摸模拟 390 px、320 px 视口验证了首页及编辑工作台无横向溢出，并检查了文件选择、键盘移动对比滑块、手机触控切换擦除画笔和 PNG 下载。使用商品示例图与测试蒙版。

## 本地模型预缓存补充验证

2026-11-24：在 Windows 本地 `phase-two` 分支上新增首屏后缓存检查、提示和自动下载。模型地址沿用 `@bg0/browser@0.1.1` 的固定 revision 和 `transformers-cache` 键；缓存命中时跳过请求。新增 2 项单元测试验证命中跳过和流式缓存写入，合计 12 项测试通过；TypeScript 与 Vite 生产构建通过。本地 Vite 预览返回 HTTP 200。

本机浏览器自动化组件未能启动，因此新增提示的视觉操作、模型真实网络下载和真实 AI 推理尚未做本地端到端复验。第一阶段的四图真实推理结果与第二阶段云端编辑测试记录仍保留在上文。
