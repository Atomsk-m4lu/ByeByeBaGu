<div align="center">

<img src="icon.svg" width="88" alt="不背八股">

# 不背八股 · ByeByeBaGu

**把你自己的 Markdown 八股/面经，变成像背单词一样的刷卡复习**

*导入 → 间隔重复 → AI 面试官拷打，一个 HTML 文件全搞定*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#特性)
[![Single File](https://img.shields.io/badge/app-single%20file%20HTML-blue)](八股闪背.html)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8)](deploy/一键安装指南.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/nina-noschool/ByeByeBaGu/pulls)

</div>

---

## 为什么做它

背八股最大的痛点：**看了就忘，面试时说不出口**。
不背八股把你的面经笔记切成卡片，用间隔重复算法安排你"什么快忘了就什么时候再见面"，
再让大模型扮演面试官**当场拷打你**——背过，更要用嘴说过。

<div align="center">
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/home.png" width="200"><br><sub>首页 · 目标与数据</sub></td>
    <td align="center"><img src="docs/screenshots/study.png" width="200"><br><sub>沉浸式刷卡</sub></td>
    <td align="center"><img src="docs/screenshots/decks.png" width="200"><br><sub>卡组与 AI 面试</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/calendar.png" width="200"><br><sub>打卡日历</sub></td>
    <td align="center"><img src="docs/screenshots/stats.png" width="200"><br><sub>时长统计与历史</sub></td>
    <td align="center"><img src="docs/screenshots/settings.png" width="200"><br><sub>设置 · 外观与 AI</sub></td>
  </tr>
</table>
</div>

## ✨ 特性

**📥 任意排版导入**
拖入 `.md` 文件，导入向导自动识别切分方式（标题层级 / 问答对 / 列表项 / 行内卡），
导入前可预览、可切换策略，含空答案/超长答案诊断与一键撤销。

**🧠 FSRS 间隔重复调度**
移植自 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 的最新 FSRS 公式，
目标记忆保持率可调（默认 0.9），每张卡实时显示记忆强度。

**🎤 AI 面试官拷打**
接入 DeepSeek（兼容任何 OpenAI 格式接口），扮演大厂面试官逐题提问：
对照参考答案点评你的回答 → 自然地追问 → 打分 → 结束出总评与补强方向。
面经里的预设追问链（Q1·追问1…）会被原样用作追问。

**🃏 科学的刷卡体验**
空格翻面、四键评分（重来/困难/良好/简单）、评分可撤销（Ctrl+Z）、
连错 5 次自动标记顽固卡 🔥、填空卡（`==挖空==` 点击揭示）。

**🎯 弱卡优先与断点续学**
组队时按"最近 10 次评价"计算薄弱分，薄弱卡本轮自动多出现 2~3 次（借鉴
[SocialWork-Flashcards](https://github.com/wangPing2002/SocialWork-Flashcards) 的机制）；
中途退出/刷新不丢进度，首页一键"继续学"。

**📊 数据看得见**
每日目标与打卡日历、日/周/月/年学习时长、按月历史查询、累计统计。

**📱 真·App 体验**
PWA 安装到手机主屏幕/电脑开始菜单，完全离线可用；
移动端沉浸式学习页、左右滑评分、底部 Tab 导航。

**🔒 数据自持**
全部数据存在本机浏览器，不上传任何内容；支持 JSON 备份/恢复。

## 🚀 快速开始

| 方式 | 做法 |
|---|---|
| **在线使用**（推荐） | 打开 [https://nina-noschool.github.io/ByeByeBaGu/](https://nina-noschool.github.io/ByeByeBaGu/) → 添加到主屏幕，详见 [安装指南](deploy/一键安装指南.md) |
| **部署自己的站点** | Fork 本仓库 → 开启 GitHub Pages → 详见 [安装指南](deploy/一键安装指南.md) |
| **本地运行** | 下载 [`八股闪背.html`](八股闪背.html) 双击打开 |

## 📖 导入格式

向导会自动从以下形态中识别最合适的一种，也可手动指定：

| 策略 | 原文形态 | 说明 |
|---|---|---|
| 标题切卡 | `## 问题` + 正文 / `### 问题` + 正文 | 八股笔记最常见，自动识别标题层级 |
| 问答对 | `问：…` / `答：…` 或 `Q:` / `A:` | 兼容 `**问：**`、`【问题】` 等变体 |
| 列表项 | `- 问题：一句话答案` | 一行一卡 |
| 行内卡 | `问题 :: 答案` | 语法来自 obsidian-spaced-repetition |

代码块、行内代码内的 `#`、`---`、`==`、`::` 不会被误切；重复导入自动按内容去重。
`tests/` 目录附了四种排版的[示例文件](samples/)，拖进去即可体验。

## 🤖 AI 面试配置

1. 到 [platform.deepseek.com](https://platform.deepseek.com) 创建 API Key（一场面试成本约几分钱）
2. 应用「设置」→ AI 面试：填入 Key（接口地址与模型已预填 `deepseek-chat`）
3. 首页「AI 面试官拷打」→ 选卡组 → 开考

Key 只保存在本机浏览器 localStorage，不上传、不经过任何第三方服务器。

## 🐦 吉祥物 · ByteBit

一只戴耳机写代码的 Q 版八哥（"八比特"，谐音"八股"），本项目唯一的官方 IP：

<p align="center"><img src="docs/bytebit.svg" width="160" alt="ByteBit"></p>

设计记录与使用规范见 [docs/bytebit.md](docs/bytebit.md)。
它会在开屏、AI 面试"思考中"和目标达成庆祝时出场。

## 🧑‍💻 开发与测试

零依赖、零构建，改 [`八股闪背.html`](八股闪背.html) 即是改全部：

```
node tests/test-parser.js   # markdown 解析与切分策略
node tests/test-fsrs.js     # FSRS 调度不变量
node tests/test-cloze.js    # 填空卡渲染
node tests/test-queue.js    # 弱卡优先队列
```

```
├── 八股闪背.html       # 应用本体（单文件）
├── index.html          # Pages 入口（与上面保持同步）
├── manifest.webmanifest / sw.js / icon.svg
├── deploy/             # 安装指南与部署套件
├── samples/            # 四种排版的示例 md
└── tests/              # 解析器 / FSRS / 填空渲染测试
```

## 🙏 致谢

设计与实现参考了以下开源项目，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：

- [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT）— FSRS 调度公式与参数
- [st3v3nmw/obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition)（MIT）— 行内卡与挖空语法、代码围栏解析
- [L-M-Sherlock/markdown2anki](https://github.com/L-M-Sherlock/markdown2anki)（MIT）— 标题层级归一化切分
- [ObsidianToAnki/Obsidian_to_Anki](https://github.com/ObsidianToAnki/Obsidian_to_Anki) · [e-chehil/anki-quizify](https://github.com/e-chehil/anki-quizify) — 导入向导的设计思想（未复用代码）
- [wangPing2002/SocialWork-Flashcards](https://github.com/wangPing2002/SocialWork-Flashcards) — 会话中断恢复、弱卡优先排队的机制设计（未复用代码）

## 📄 许可证

[MIT](LICENSE) © 2026 nina-noschool

---

<!-- ===== 维护规则（贡献者与本人共用） =====
   本 README 顶部永远描述"当前真实状态"：功能变了就改对应段落，不留过时描述。
   版本历史只写在下方「更新历史」，倒序追加，不另开 CHANGELOG 文件。
   ======================================================== -->

## 🗂 更新历史

### v1.13.0（2026-10-25）
- 会话中断恢复：中途退出/刷新页面后，首页出现「继续学」横幅，从上次中断位置继续
- 弱卡优先队列：按最近 10 次评价计算薄弱分，薄弱卡本轮自动再现 2~3 次且不相邻（借鉴 SocialWork-Flashcards）
- 设置新增「重置复习进度（保留卡组）」，与「清空全部数据」分离
- 新增 `tests/test-queue.js`（12 项）

### v1.12.0 及更早
见 [docs/bytebit.md](docs/bytebit.md)（吉祥物设计记录）与 git 提交历史。
