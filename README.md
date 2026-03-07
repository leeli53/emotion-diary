# 情绪日记

一个纯前端的情绪记录网页应用，用来快速记录当天心情和文字感受，并查看历史与趋势统计。

## 功能

- 6 种情绪选择：开心、平静、难过、焦虑、生气、疲惫
- 记录当天感受并保存为时间轴
- 统计页查看趋势、分布和热力图
- 设置页支持导出/导入 JSON 数据
- 所有数据仅存储在浏览器本地（`localStorage`）

## 技术栈

- HTML
- CSS
- 原生 JavaScript（无框架）

## 快速开始

1. 克隆仓库：

```bash
git clone https://github.com/leeli53/emotion-diary.git
cd emotion-diary
```

2. 直接双击打开 `index.html`，或使用本地静态服务：

```bash
python3 -m http.server 8080
```

3. 浏览器访问：

```text
http://localhost:8080
```

## 项目结构

```text
emotion-diary/
├── assets/      # 情绪插画资源
├── index.html   # 主页面（包含样式与脚本）
└── README.md
```

## 数据与隐私

- 默认存储键：`moodDiary_v5`
- 数据保存在当前浏览器本地，不会自动上传到服务器
- 建议定期使用“导出数据 (JSON)”进行备份
