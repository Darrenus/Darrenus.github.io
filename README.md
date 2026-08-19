# RONG Agent

贺融的个人 AI 助手。页面使用 React、TypeScript 和 Vite 构建，Agent 循环、工具调用和 BM25 检索均运行在访问者的浏览器中。

## 本地运行

```sh
npm ci
npm run corpus
npm run dev
```

未配置模型时，页面使用明确标注的离线预设回答。配置在线模型有两种方式：

```sh
# 推荐：连接独立部署的代理
echo 'VITE_AGENT_PROXY_URL=https://your-proxy.vercel.app' > .env.local
```

或在本地浏览器控制台临时设置 DeepSeek Key：

```js
rongAgentKey("sk-...")
```

Key 只存储在当前浏览器的 localStorage，不应写入仓库。

## 目录

```text
src/profile.ts     集中的身份、链接和站点配置
src/ui/            React 界面与 Markdown/图表渲染
src/agent/         Agent 循环、模型适配、工具与离线回答
src/rag/           MiniSearch BM25 运行时检索
corpus/src/        审核后的公开资料源
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
