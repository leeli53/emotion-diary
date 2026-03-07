# 情绪日记（小白 vibecoding 练手）

这是我用 `HTML + CSS + JavaScript` 做的一个非常基础的小项目。  
定位就是：`小白练手`、`先跑起来`、`能用就行`。

<img width="1620" height="900" alt="homepage-preview" src="https://github.com/user-attachments/assets/db0369e6-571a-4d7d-9e5e-18553d8db00d" />

首页长这样：一个轻量、直观、没有复杂操作的情绪记录页。

## Wiki 文档入口

- Wiki 首页：https://github.com/leeli53/emotion-diary/wiki
- 快速开始：https://github.com/leeli53/emotion-diary/wiki/Quick-Start
- 功能说明：https://github.com/leeli53/emotion-diary/wiki/Features
- 数据结构与导入导出：https://github.com/leeli53/emotion-diary/wiki/Data-Model-and-Import-Export
- 常见问题 FAQ：https://github.com/leeli53/emotion-diary/wiki/FAQ

## 先说清楚

- 这是一次个人 `vibecoding` 尝试，不是专业级产品，主要使用工具是Codex，模型是GPT5.3
- 代码已拆分为 `index.html` + `styles.css` + `script.js`，结构直观好理解
- 功能不复杂，重点是把完整流程走通（记录 -> 查看 -> 备份）

## 这个小东西能做什么

- 选一个当天情绪（开心、平静、难过、焦虑、生气、疲惫）并且页面根据选择不同的心情有不同的颜色变化
- 写一段当天感受并保存
- 在时间轴看历史记录
- 在统计页看简单趋势
- 导出/导入 JSON 备份数据

## 技术栈（很朴素）

- HTML
- CSS
- 原生 JavaScript（无框架、无后端）

## 为什么说它很简单

- 没有登录系统
- 没有数据库
- 没有服务端 API
- 没有复杂工程化配置
- 数据只存在浏览器本地 `localStorage`

## 本地运行

1. 克隆仓库

```bash
git clone https://github.com/leeli53/emotion-diary.git
cd emotion-diary
```

2. 运行方式（二选一）

- 直接双击打开 `index.html`
- 或本地起一个静态服务：

```bash
python3 -m http.server 8080
```

3. 打开浏览器

```text
http://localhost:8080
```

## 项目结构

```text
emotion-diary/
├── assets/      # 情绪图片
├── index.html   # 页面结构
├── styles.css   # 页面样式
├── script.js    # 页面交互逻辑
└── README.md
```

## 数据说明

- 默认存储键：`moodDiary_v5`
- 数据保存在当前浏览器本地，不会自动上传
- 建议定期使用“导出数据 (JSON)”做备份

## 开发碎碎念

- 这是我一边查一边做出来的，很多地方都很“新手写法”
- 一开始只想做“能记录今天心情”这一个点，后来才慢慢补了统计和导入导出
- 代码没有追求花哨架构，主要是为了让我自己能看懂、能改动
- 如果你也在学前端，希望这个小项目能给你一点点开始动手的勇气

## 如果你也是小白

这个项目很适合拿来改着玩，比如：

- 多加几种情绪
- 给每条日记加标签
- 调整页面配色和排版
- 继续把 JavaScript 按功能拆成更多模块

## 更新日志

> 详细版本记录文件：`CHANGELOG.md`

### 2026-03-07

#### 第 1 次更新（时区与日期稳定性）
- 修复日期键生成逻辑：从 UTC 改为本地时间计算，避免跨时区导致日期偏移。
- 新增 `monthKey()`，并统一替换统计中按月计算的日期来源。
- 影响范围：连续天数、当月统计、导出文件日期命名。

#### 第 2 次更新（导入校验增强）
- 新增导入数据校验：校验情绪字段、日期键格式（`YYYY-MM-DD`）和对象结构。
- 导入时自动清洗无效记录，并在提示中显示过滤数量。
- 对缺失/非法 `id` 自动生成并去重，避免导入后列表操作异常。
- 对缺失 `ds` 的记录自动补齐展示时间，保证 UI 可正常渲染。

#### 第 3 次更新（动画逻辑与性能保护）
- 修复空闲动画条件判断错误，恢复“空闲后随机漂浮”的预期行为。
- 用户重新操作时会中断空闲动画并清理计时器，避免状态冲突。
- 新增动效保护开关：在“系统偏好减少动态效果”或非精细指针设备下，自动关闭高频装饰动效。

#### 第 4 次更新（README 增加 Wiki 导航）
- 在 README 前部新增 `Wiki 文档入口` 区块。
- 增加 Wiki 首页、快速开始、功能说明、数据结构与 FAQ 的直达链接。
- 方便访客在仓库首页直接进入项目文档体系。
