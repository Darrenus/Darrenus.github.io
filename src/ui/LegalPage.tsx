import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./legal.css";

export default function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const title = kind === "privacy" ? "隐私政策" : "使用条款";
  useEffect(() => {
    document.title = `${title} | RONG`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://rong.bio/${kind}`);
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${title}：rong.bio 的网站功能、数据处理与使用说明。`);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${title} | RONG`);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", `https://rong.bio/${kind}`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", `${title}：rong.bio 的网站功能、数据处理与使用说明。`);
  }, [kind, title]);

  return (
    <div className="legal-page">
      <SiteHeader />
      <main id="main-content" className="legal-content">
        <p className="legal-date">更新日期：2026 年 9 月 28 日</p>
        <h1>{title}</h1>
        {kind === "privacy" ? <>
          <p className="legal-intro">本页说明贺融的个人网站 rong.bio 如何处理访问与互动中的信息。</p>
          <section><h2>浏览网站</h2><p>浏览作品、简历和研究内容无需注册账户。网站通过 GitHub Pages 提供静态页面；托管服务可能处理 IP 地址、请求时间及设备信息，用于页面交付、安全与运行维护。站点前端未接入广告追踪或第三方访问统计脚本。</p></section>
          <section><h2>AI 问答与运行记录</h2><p>使用「问 RONG」的在线功能时，你提交的问题、相关对话上下文与工具结果会经 Vercel 上的代理发送给 DeepSeek，以生成回复。联网查询可能将搜索词发送给 Tavily，或向 GitHub 及所访问的网站请求公开资料。</p><p>代理代码会把每轮提问的前 300 个字符、时间、国家或地区、经哈希处理的访客标识、对话轮次和模型名称写入运行日志，用于了解问答使用情况与排查问题。哈希标识不等于完全匿名。日志保存与第三方处理受服务配置及提供商政策影响；这里不承诺固定保存期限。请勿在对话中提交密码、证件、未公开文件等敏感内容。</p></section>
          <section><h2>浏览器存储</h2><p>网站使用浏览器存储保存部分功能偏好、临时缓存和加载恢复标记。若你主动通过开发者功能设置自己的模型密钥，该密钥会保存在当前浏览器；在线对话内容保存在当前页面内存中。你可以在浏览器设置中清除本站数据，但这不会同时删除服务端运行日志。</p></section>
          <section><h2>外部链接与联系</h2><p>社交平台、学校和论文链接会打开第三方网站，适用各自的隐私规则。点击邮箱链接会调用你的邮件应用；发送邮件后，邮箱地址及邮件内容将用于回复你的联系。</p><p>托管服务的相关说明：<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub 隐私声明 ↗</a>、<a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel 隐私声明 ↗</a>。</p></section>
          <section><h2>查询与更正</h2><p>如需询问个人信息的处理情况，或申请访问、更正、删除与你有关的信息，请联系 <a href="mailto:hanserong@163.com">hanserong@163.com</a>，并说明相关时间与使用场景，以便核查能够识别和处理的记录。网站功能变化时，本页也会相应更新。</p></section>
        </> : <>
          <p className="legal-intro">本网站用于展示贺融的项目、学习经历与公开研究，并提供 AI 问答辅助浏览。</p>
          <section><h2>内容与引用</h2><p>你可以浏览并分享本站页面链接。引用研究或项目内容时，请注明作者与来源；论文、代码、图片及第三方材料的使用范围以原始发布处的许可为准。页面上的链接不代表额外授权。</p></section>
          <section><h2>AI 回复与资料准确性</h2><p>AI 回复可能存在错误、遗漏或过时信息，不代表作者的正式声明。涉及论文结论、项目成果与个人经历时，请以所列原文和公开资料为准；发现错误可通过邮箱反馈。</p></section>
          <section><h2>合理使用</h2><p>请勿干扰网站运行、绕过访问限制、滥用问答接口，或提交侵害他人隐私及权利的内容。网站功能与外部链接可能调整，在线服务也可能因维护、额度或第三方故障暂时不可用。</p></section>
          <section><h2>外部服务与联系</h2><p>访问外部平台时，请查看该平台的使用规则。对本站内容、引用或使用方式有疑问，请联系 <a href="mailto:hanserong@163.com">hanserong@163.com</a>。</p></section>
        </>}
      </main>
      <SiteFooter />
    </div>
  );
}
