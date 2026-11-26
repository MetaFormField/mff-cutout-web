# 部署说明

## Cloudflare Workers 静态资源

- Production branch：`main`
- Build command：`pnpm build`
- Static assets：`dist`
- Worker：`mff-cutout-web`
- Node.js：20 或更新版本

GitHub Actions 在每次推送到 `main` 时构建，并通过 Cloudflare 官方 Wrangler Action 更新正式地址。仓库需要配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 两个 Actions Secret。

## 手动发布

```bash
pnpm build
pnpm deploy
```

模型权重由终端用户浏览器从 BG0 固定的 Hugging Face revision 下载，不需要上传到 Cloudflare，也不会占用 Pages 构建产物。
