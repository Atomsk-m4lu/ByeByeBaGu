# Third-Party Notices / 第三方来源说明

本项目为独立实现的轻量 Markdown 背诵卡片应用。以下开源项目为本项目的
设计参考来源，特此致谢。各项目许可情况如下：

## 设计与代码片段参考（MIT 许可）

以下项目的许可允许在保留版权与许可声明的前提下复用代码；
本项目参考/复用了其中少量解析与调度逻辑片段。

### 1. obsidian-spaced-repetition

- 来源：https://github.com/st3v3nmw/obsidian-spaced-repetition
- 许可证：MIT License，Copyright (c) 2020 Stephen Mwangi
- 借鉴内容：代码围栏（fenced code block）跳过解析的处理思路；
  行内卡片语法 `Question :: Answer` 与挖空 `==高亮==` 语法
  （本项目 `inline` 切分策略与填空卡渲染的来源）。

### 2. markdown2anki

- 来源：https://github.com/L-M-Sherlock/markdown2anki
- 许可证：MIT License，Copyright (c) 2024 L-M-Sherlock
- 借鉴内容：按 Markdown 标题层级归一化切分卡片的思路。

### 3. ts-fsrs

- 来源：https://github.com/open-spaced-repetition/ts-fsrs
- 许可证：MIT License，Copyright (c) 2023 open-spaced-repetition
- 借鉴内容：FSRS 调度算法的公式与默认参数（21 权重、遗忘曲线、
  线性阻尼 + 均值回归的难度更新）。本项目按源码语义以原生 JS
  重新实现，并做了简化（未实现 short-term stability 与 fuzz，
  学习/重学阶段统一为 10 分钟步长）。

## 设计思想参考（未复用任何代码）

### 3. Obsidian_to_Anki

- 来源：https://github.com/ObsidianToAnki/Obsidian_to_Anki
- 许可证：GPL-3.0 —— **未复制其任何代码**，仅借鉴
  "切分规则可配置、重复导入按身份去重"的设计思想。

### 4. anki-quizify

- 来源：https://github.com/e-chehil/anki-quizify
- 许可证：AGPL-3.0 —— **未复制其任何代码**，仅借鉴
  "导入前预览 + 异常诊断 + 可撤销"的导入流程设计。

## 调度算法

本项目的复习调度为 SM-2 算法（Piotr Wozniak, 1987）的自实现变体，
该算法本身属公有领域思想，未复制任何实现代码。
