# 不背八股 · Markdown 背诵卡片

把自己的 Markdown 笔记（八股、面经、任何问答式内容）拖进来，用间隔重复算法像背单词一样刷卡背诵。

**零依赖、零安装的单文件 HTML 应用**：双击即用，数据全部保存在本地浏览器，不上传任何内容。

## 特性

- **任意排版导入**：拖入 `.md` 文件，导入向导自动识别切分方式（标题层级 / 问答对 / 列表项 / 行内卡），导入前可预览、可手动调整，含异常诊断与一键撤销
- **FSRS 间隔重复调度**：移植自 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 的最新 FSRS 公式，目标记忆保持率可调（默认 0.9）
- **刷卡学习**：空格翻面、1-4 评分（重来/困难/良好/简单）、评分可撤销、连错 5 次自动标记顽固卡（🔥）
- **卡片管理**：卡组详情页支持搜索、在线编辑、单卡删除、手动加卡
- **填空卡**：答案里写 `==文字==` 渲染成可点击的挖空遮罩
- **每日目标**：自定义每日复习张数，首页进度条 + 达成庆祝 + 打卡统计
- **PWA**：部署后可"安装"到手机主屏幕/电脑开始菜单，完全离线可用
- **数据自持**：localStorage 本地存储，支持 JSON 导出/导入备份

## 快速开始

**本地使用**：下载 `八股闪背.html`，双击用浏览器打开，拖入 md 文件即可。

**安装为 App（手机/电脑）**：见 [deploy/一键安装指南.md](deploy/一键安装指南.md)，GitHub Pages 五分钟部署。

## 导入格式

向导会自动从以下形态中识别最合适的一种，也可手动指定：

| 策略 | 原文形态 | 说明 |
|---|---|---|
| 标题切卡 | `## 问题` + 正文 / `### 问题` + 正文 | 八股笔记最常见，自动识别标题层级 |
| 问答对 | `问：…` / `答：…` 或 `Q:` / `A:` | 兼容 `**问：**`、`【问题】` 等变体 |
| 列表项 | `- 问题：一句话答案` | 一行一卡 |
| 行内卡 | `问题 :: 答案` | 语法来自 obsidian-spaced-repetition |

代码块、行内代码内的 `#`、`---`、`==`、`::` 不会被误切。重复导入同一文件时按内容去重。

## 目录结构

```
├── 八股闪背.html            # 应用本体（单文件，双击即用）
├── index.html               # 同上副本，GitHub Pages 入口
├── manifest.webmanifest / sw.js / icon.svg   # PWA 文件
├── deploy/                  # 部署说明与套件
├── samples/                 # 四种排版的示例 md，可直接拖入体验导入向导
└── tests/                   # 解析器 / FSRS / 填空渲染测试（node 运行）
```

## 开发与测试

无构建、无依赖，改 `八股闪背.html` 即是改全部。运行测试：

```
node tests\test-parser.js   # markdown 解析与切分策略
node tests\test-fsrs.js     # FSRS 调度不变量
node tests\test-cloze.js    # 填空卡渲染
```

## 致谢

设计与实现参考了以下开源项目，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：

- [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT）— FSRS 调度公式与参数
- [st3v3nmw/obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition)（MIT）— 行内卡与挖空语法、代码围栏解析
- [L-M-Sherlock/markdown2anki](https://github.com/L-M-Sherlock/markdown2anki)（MIT）— 标题层级归一化切分
- [ObsidianToAnki/Obsidian_to_Anki](https://github.com/ObsidianToAnki/Obsidian_to_Anki)、[e-chehil/anki-quizify](https://github.com/e-chehil/anki-quizify) — 导入向导的设计思想（未复用代码）

## 许可证

[MIT](LICENSE)
