# 统一内容源

`profile.json` 与 `resume.json` 是网站公开事实的唯一人工维护入口。

- 固定身份、联系方式、站点路由和隐私口径放在 `profile.json`。
- `profile.json.site.repository` 是首页 HUD 读取最新提交的个人主页仓库，使用 `owner/name` 格式。
- 教育、经历、项目、专利、获奖和技能放在 `resume.json`。
- `summary`、`bio`、`highlights` 与 `customSections` 保留为自由文本，修改措辞不需要调整组件。
- 所有条目的 `links` 都是可选记录；可以新增 `repository`、`demo`、`official`、`figma`、`video`、`evidence` 或其他自定义 `kind`。
- 尚未公开的链接使用 `url: null` 和 `status: "pending"`，不得猜测地址。
- `id` 和项目 `slug` 是稳定标识。发布后不应随显示名称一起修改。

## 字段映射

| 原维护位置 | 统一内容路径 | 新消费者 |
|---|---|---|
| `src/profile.ts` | `profile.json.site/person/links/github` | `src/profile.ts` 兼容适配层 |
| `corpus/src/about.md`、`education.md`、`experience.md`、`projects.md` | `resume.json.overview/education/experience/projects` | `scripts/build-corpus.ts` |
| `corpus/src/contact.md`、`links.md` | `profile.json.links` 与条目 `links` | `scripts/build-corpus.ts` |
| `corpus/src/achievements.md` | `resume.json.patents/awards` | `scripts/build-corpus.ts` |
| `src/agent/mock.ts` | 统一内容查询与叙述字段 | 离线回答组装器 |
| `src/agent/prompt.ts` | `profile.json` 隐私规则与 `resume.json` 时间线/指标 | 在线模型提示词组装器 |
| `personalization/build_public_resume.py` | 两个 JSON 文件 | DOCX 生成器 |

`corpus/src/` 只保留不属于个人履历事实的补充叙述，例如网站实现说明。构建脚本会把统一内容源和这些补充 Markdown 一起生成公开检索索引。

## English edition

Chinese pages keep their existing URLs; English pages use `/en/` (for example,
`/en/research`). The language control retains the current page, query and fragment.
Page links retain the selected language; PDF, image and external URLs are unchanged.

- Edit `resume.json` and `resume.en.json` together, preserving record IDs and slugs.
  The English text is edited for reading, not generated at runtime.
- Keep `research.json` and `research.en.json` aligned on IDs, dates and source URLs.
- Blog posts have matching slugs and block structure in `blog.json` and `blog.en.json`.
  English figures may have separate assets; retain their real intrinsic dimensions.
- Interface copy lives in `ui.en.json`; `t()` keeps the Chinese source as its key.
- The English PDF is `public/resume-en.pdf`, a public copy of the supplied two-page CV.
  The original attachment is unchanged. Apply the same public-content policy as the
  Chinese PDF: exclude private contact details and internal project names.
- `npm run corpus` builds separate Chinese and English retrieval indexes.
  Run `npm test` and `npm run build` after content changes.

English editions should be reviewed at 320px, 390px, tablet and desktop widths,
including long project titles, globe labels and open dialogs. Do not shrink text
indefinitely to fit: wrap navigation, use content-sized rows and adjust line lengths.
