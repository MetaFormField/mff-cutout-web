# 部署说明

## Cloudflare Pages

- Production branch：`main`
- Build command：`pnpm build`
- Build output directory：`dist`
- Node.js：20 或更新版本

Cloudflare Pages 与 GitHub 仓库连接后，每次推送到 `main` 都会自动构建并更新正式地址。预览分支可以按 Cloudflare Pages 默认规则生成独立预览地址。

## 手动发布

```bash
pnpm build
pnpm dlx wrangler@4 pages deploy dist --project-name mff-cutout-web
```

模型权重由终端用户浏览器从 BG0 固定的 Hugging Face revision 下载，不需要上传到 Cloudflare，也不会占用 Pages 构建产物。
