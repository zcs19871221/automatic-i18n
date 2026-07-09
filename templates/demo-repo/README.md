# automatic-i18n-demo

这是一个最小演示仓库模板，用于展示 automatic-i18n 的核心价值：

- 一条命令改造硬编码文案
- 自动生成语言包
- 同时处理字符串、JSX 文本、模板字符串

## 1. 初始化

npm i -D automatic-i18n typescript prettier fs-extra

## 2. 准备示例文件

参考 src/template.tsx。

## 3. 执行

npx automatic-i18n -t src -sl en-us -tl en-us zh-cn -u

## 4. 你会看到

- src/template.tsx 中文案被替换为 i18n 调用
- 生成 i18n 目录和语言文件

## 录制 GIF 建议

- 时长：20-35 秒
- 帧率：10-12 fps
- 分辨率：1200x700 左右
- 录制内容：Before -> Run command -> After + i18n files

## 推荐仓库结构

- src/template.tsx
- i18n（执行后生成）
- README.md

## 适合用于

- README 演示
- 发文配套示例仓库
- 社区答疑时给出可运行最小复现
