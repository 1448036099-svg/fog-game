# CLAUDE.md

请先完整阅读 @GAME.md，里面有《雾里有什么》的设计文档和「给 AI 的规则」。

要点：
- 技术栈：Phaser 3.90.0（jsDelivr CDN，固定版本），原生 HTML 加 JavaScript，不用打包工具，不用 Phaser 4
- 三关共用同一个 LevelScene，数据集中在 game.js 顶部的 LEVELS 数组
- 一次只改一件事，不要整份重写文件
- 不要自己编线索、关卡或剧情，不确定就问我
- 新素材提醒我记录来源到 notes/LOG.md
