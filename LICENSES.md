# 开源依赖与模型许可证

- `@bg0/browser@0.1.1`：Apache-2.0。负责浏览器能力检测、模型选择与缓存、ONNX 推理、取消、进度和 PNG 合成。
- `@huggingface/transformers`：由 `@bg0/browser` 固定的浏览器推理依赖，Apache-2.0；其 ONNX Runtime Web 相关组件保留各自许可证。
- React、React DOM：MIT。
- `fflate@0.8.2`：MIT，用于在浏览器本地打包单张 PNG。
- Vite：MIT；TypeScript：Apache-2.0；Tailwind CSS：MIT。
- 完整 BiRefNet 512 WebGPU ONNX：`naddy24/birefnet-512-webgpu`，固定 revision `ca02a86c094927479e2be583abe87f8ea73fcfda`，MIT；派生自 `onnx-community/BiRefNet_512x512-ONNX` 和 `ZhengPeng7/BiRefNet_512x512`。
- BiRefNet Lite 512 ONNX：`studioludens/birefnet-lite-512`，固定 revision `4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7`，MIT；派生自 `ZhengPeng7/BiRefNet_lite`。

BG0 的权威第三方声明：<https://github.com/opencoredev/bg0/blob/main/THIRD_PARTY_NOTICES.md>。模型权重保持各自原始许可证和模型卡中列出的归属、限制与引用要求。

模型权重不会随本项目安装，在用户首次使用时由浏览器从 Hugging Face 下载并缓存。图片与派生像素不会随模型请求发送。
