# MFF CUTOUT

MFF CUTOUT 是免费的浏览器本地 AI 抠图工具。图片解码、AI 推理、透明边缘优化、预览和导出全部在浏览器中完成；项目没有图片上传接口、后端推理服务、数据库或付费 API。

## 技术架构

- React 19.2.0、TypeScript 5.9.3、Vite 7.2.2、Tailwind CSS 3.4.18。
- `@bg0/browser@0.1.1` 负责能力检测、模型下载和缓存、WebGPU / WebAssembly 推理、进度、取消和透明 PNG 合成。
- Canvas API 负责图片解码、Alpha 边缘处理、对比预览和原尺寸 PNG 导出。
- `fflate@0.8.2` 在浏览器本地生成 ZIP；没有服务器压缩请求。
- 静态站点部署在 Cloudflare Workers；GitHub `main` 分支是正式环境的发布源。

## AI 模型来源

BG0 首选完整 BiRefNet 512 WebGPU 模型：[`naddy24/birefnet-512-webgpu`](https://huggingface.co/naddy24/birefnet-512-webgpu)，固定 revision `ca02a86c094927479e2be583abe87f8ea73fcfda`。它由 [`onnx-community/BiRefNet_512x512-ONNX`](https://huggingface.co/onnx-community/BiRefNet_512x512-ONNX) 和 [`ZhengPeng7/BiRefNet_512x512`](https://huggingface.co/ZhengPeng7/BiRefNet_512x512) 派生。

兼容回退模型为 [`studioludens/birefnet-lite-512`](https://huggingface.co/studioludens/birefnet-lite-512)，固定 revision `4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7`，派生自 [`ZhengPeng7/BiRefNet_lite`](https://huggingface.co/ZhengPeng7/BiRefNet_lite)。两套浏览器 ONNX 权重均为 MIT；原始研究与代码见 [`ZhengPeng7/BiRefNet`](https://github.com/ZhengPeng7/BiRefNet)。权重不会打包进本站，首次处理时由浏览器直接下载并缓存。

## 本地运行

```bash
pnpm install --frozen-lockfile
pnpm dev
```

```bash
pnpm test
pnpm build
pnpm preview
```

首次处理会下载固定版本模型。WebGPU 优先使用完整 BiRefNet；不支持或失败时回退 WASM / Lite 路径。模型体积和实际下载内容以 BG0 固定 revision 为准。后续刷新可复用浏览器缓存，浏览器仍需重新初始化 ONNX 会话。建议使用最新版 Chrome / Edge 和 HTTPS。

页面完成首屏显示后会检查 BG0 使用的 Cache API 模型条目。未缓存时会提示并自动下载首选后端的固定权重，展示实际下载字节；若浏览器不支持 Cache API，上传图片时仍由 BG0 按原流程下载。WebGPU 推理失败后仍可能由 BG0 下载 WASM 权重并回退。

## 功能

- 选择、拖拽或粘贴 JPG、JPEG、PNG。上传上限为 15 MB、2000 万像素。
- 拖动分割线查看同位置的原图和抠图结果。透明、白色和黑色背景均用于预览。
- 自定义文件名，下载透明 PNG 或包含这一张 PNG 的 ZIP。预览背景不写入导出文件。

## 隐私与兼容性

图片读取、解码、推理、蒙版合成和打包均在当前浏览器内完成。网络请求用于静态资源、ONNX/WASM 运行时和公开模型权重。

- 极细发丝、半透明玻璃和复杂反光可能有抠图误差。恢复被移除的区域时，画笔会使用原图颜色。
- iPhone / iPad 保留第一阶段的 1280 px 最长边输出限制。`@bg0/browser@0.1.1` 尚未包含专用的单线程 iOS Worker。
- 15 MB、2000 万像素是输入上限。可处理的图片尺寸还取决于设备内存和浏览器的 Canvas 限制。

见 [验收记录](TESTING.md) 和 [开源依赖及模型许可证](LICENSES.md)。

## 发布

正式环境使用 Cloudflare Workers 静态资源，地址为 `https://mffcutout.jaricachi.workers.dev`。构建命令为 `pnpm build`，输出目录为 `dist`；对 `main` 的推送会触发新的正式部署。手动发布命令及故障排查见 [DEPLOYMENT.md](DEPLOYMENT.md)。
