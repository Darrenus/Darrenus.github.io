# Ragent

个人 AI 助手。页面使用 React、TypeScript 和 Vite 构建，Agent 循环、工具调用和 BM25 检索均运行在访问者的浏览器中。

## 本地运行

```sh
npm ci
npm run corpus
npm run dev
```

未配置模型时，页面使用明确标注的离线预设回答。线上公开站点应使用独立代理，DeepSeek Key 只放在代理服务的密钥库中：

```sh
# 本地构建时只写代理地址（这是公开配置，不是 Key）
cp .env.example .env.local
# 编辑 .env.local，填写 VITE_AGENT_PROXY_URL=https://your-proxy.vercel.app
```

代理的 Key 不要写入这个仓库，也不要提交 `.env.local`。将它安全写入 Vercel：

```sh
cd proxy
npx vercel login
npx vercel link
npx vercel env add DEEPSEEK_API_KEY production
npx vercel env add ALLOWED_ORIGINS production   # https://rong.bio
npx vercel deploy --prod
```

`vercel env add` 会在终端交互式接收密钥，不会把 Key 写进源码、Git 历史或浏览器构建产物。部署完成后，把代理 URL 配置到 GitHub 仓库变量 `AGENT_PROXY_URL`，再推送一次触发 Pages 构建。完整的代理部署与限流说明见 [`proxy/README.md`](proxy/README.md)。

仅做本机临时测试时，也可以把 Key 写入被 Git 忽略的 `proxy/.env.local`，然后使用 `vercel dev`；不要把这个文件上传或复制到公开目录。浏览器 `localStorage` 直连方式仍保留，但只适合个人测试，不适合线上站点。

## 目录

```text
content/           统一维护的公开身份、履历、项目、链接和自由文本
src/profile.ts     兼容现有界面的内容适配层
src/ui/            React 界面与 Markdown/图表渲染
src/agent/         Agent 循环、模型适配、工具与离线回答
src/rag/           MiniSearch BM25 运行时检索
corpus/src/        不能从统一内容源自然生成的补充说明文档
public/corpus/     npm run corpus 生成的静态索引
proxy/             保存模型和搜索密钥的 Vercel Edge Functions
```

## 验证

```sh
npm run typecheck
npm test
npm run build
```

## 发布

推送到 `main` 后，GitHub Actions 构建并部署 GitHub Pages。在线模型代理需要单独部署，具体步骤见 `proxy/README.md`。

生产域名是 `rong.bio`，由 `public/CNAME` 和 GitHub Pages 自定义域名共同配置。
`main` 分支更新后，GitHub Actions 会自动构建并部署站点。
