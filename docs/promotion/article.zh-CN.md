# 我做了一个一键改造前端国际化的工具：automatic-i18n

如果你维护过中大型前端项目，应该都经历过这件事：

项目要开始做国际化了，但代码里已经散落了大量硬编码文案。

手动改造通常意味着：

- 把字符串一个个替换成 i18n 调用
- 处理 JSX 文本、模板字符串、变量插值
- 维护 key 和语言包文件
- 反复担心漏改、误改、冲突

这件事很容易拖慢需求节奏，也很难在短时间内稳定推进。

所以我做了 automatic-i18n：

用一条命令，自动扫描并替换源码中的文案，同时生成多语言文件。

项目地址：

- GitHub: https://github.com/zcs19871221/automatic-i18n
- npm: https://www.npmjs.com/package/automatic-i18n

## 它解决了什么问题

automatic-i18n 的目标很直接：

- 降低老项目 i18n 改造的人力成本
- 让替换行为尽量可控、可回滚
- 让团队可以按目录、按阶段渐进迁移

它默认基于 AST 做替换，不是简单正则替换，能更稳地处理常见代码形态。

## 主要能力

- 支持 TypeScript、JavaScript、React
- 支持字符串字面量、JSX 文本、模板字符串
- 默认集成 react-intl 生成代码
- 支持 hook 模式和 global 模式
- 支持英文提取策略：comment-only、balanced、aggressive
- 支持 merge 子命令，辅助处理语言包冲突

## 30 秒体验

1. 安装依赖

npm i -D automatic-i18n typescript prettier fs-extra

2. 执行命令

npx automatic-i18n -t src

3. 查看结果

- 源码中的硬编码文案被替换为 i18n 调用
- 生成 i18n 目录及语言文件

## 一个典型场景

改造前：

- 组件里存在英文/中文硬编码
- JSX 中有直接文本
- 还有模板字符串拼接文案

改造后：

- 文案被替换为 formatMessage 或 FormattedMessage
- 模板字符串中的变量被提取为参数位
- 语言包里出现对应 key 和 defaultMessage

## 为什么不是只做脚本替换

我在实践里踩过几个坑：

- key 或属性值被误替换，导致运行时逻辑异常
- 模板字符串变量位处理不稳，格式化后语义变化
- 多人协作时语言包冲突频繁

automatic-i18n 在这些方面做了更多约束和策略化处理，尤其在英文提取时提供了更细粒度控制。

## 适合谁

- 有存量业务代码，需要逐步国际化
- 想降低改造成本，不想从零搭一套提取链路
- 团队使用 react-intl 或可接受自定义 formatter

## 下一步计划

- 继续完善英文场景下的安全边界
- 提供更直观的改造报告和 dry-run 能力
- 增加更多真实项目样例

如果你正在做国际化改造，欢迎提 issue 或直接交流你的场景，我会优先补齐高频痛点。
