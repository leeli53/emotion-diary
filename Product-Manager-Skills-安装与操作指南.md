# Product-Manager-Skills 安装与操作指南

## 1. 安装结果

- 来源仓库：[deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills)
- 安装时间：2026-03-08
- 安装方式：使用 Codex 内置 `skill-installer` 脚本从 GitHub 安装
- 安装目录：`/Users/lee/.codex/skills`
- 安装结果：`46/46` 个 skills 安装成功

> 重要：安装完成后请重启 Codex，让新 skills 被加载。

## 2. 在 Codex 里如何使用

在对话里直接点名 skill 即可触发：

- 单个 skill：
  - `请使用 $prd-development，帮我写一个“会员续费率提升”PRD。`
- 多个 skill 串联：
  - `请使用 $discovery-process + $problem-statement + $prioritization-advisor，输出从问题定义到优先级结论的完整过程。`

也可以不加 `$`，直接写技能名或明确任务场景，Codex 会按匹配规则触发。

## 3. 推荐起手流程（实战）

### 场景 A：从问题到 PRD

1. `discovery-process`：梳理现状、证据和假设
2. `problem-statement`：产出结构化问题定义
3. `prioritization-advisor`：做机会/需求优先级
4. `prd-development`：生成完整 PRD

### 场景 B：战略到路线图

1. `product-strategy-session`：明确战略方向
2. `opportunity-solution-tree`：构建机会树
3. `roadmap-planning`：形成路线图

### 场景 C：增长与定价

1. `business-health-diagnostic`：诊断业务健康度
2. `finance-based-pricing-advisor`：定价方案推演
3. `saas-revenue-growth-metrics`：收入增长指标框架

## 4. 常用技能速查

- 需求/问题：`problem-statement`、`problem-framing-canvas`
- 用户研究：`discovery-interview-prep`、`customer-journey-map`、`jobs-to-be-done`
- 优先级/决策：`prioritization-advisor`、`feature-investment-advisor`
- 文档产出：`user-story`、`epic-hypothesis`、`press-release`、`prd-development`
- 战略/规划：`product-strategy-session`、`roadmap-planning`
- 商业分析：`tam-sam-som-calculator`、`finance-metrics-quickref`

## 5. 已安装技能清单（46）

1. acquisition-channel-advisor
2. ai-shaped-readiness-advisor
3. altitude-horizon-framework
4. business-health-diagnostic
5. company-research
6. context-engineering-advisor
7. customer-journey-map
8. customer-journey-mapping-workshop
9. director-readiness-advisor
10. discovery-interview-prep
11. discovery-process
12. eol-message
13. epic-breakdown-advisor
14. epic-hypothesis
15. executive-onboarding-playbook
16. feature-investment-advisor
17. finance-based-pricing-advisor
18. finance-metrics-quickref
19. jobs-to-be-done
20. lean-ux-canvas
21. opportunity-solution-tree
22. pestel-analysis
23. pol-probe-advisor
24. pol-probe
25. positioning-statement
26. positioning-workshop
27. prd-development
28. press-release
29. prioritization-advisor
30. problem-framing-canvas
31. problem-statement
32. product-strategy-session
33. proto-persona
34. recommendation-canvas
35. roadmap-planning
36. saas-economics-efficiency-metrics
37. saas-revenue-growth-metrics
38. skill-authoring-workflow
39. storyboard
40. tam-sam-som-calculator
41. user-story-mapping-workshop
42. user-story-mapping
43. user-story-splitting
44. user-story
45. vp-cpo-readiness-advisor
46. workshop-facilitation

## 6. 后续维护（可选）

### 6.1 重新安装某个 skill

```bash
python3 /Users/lee/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo deanpeters/Product-Manager-Skills \
  --path skills/prd-development
```

### 6.2 批量更新全部 46 个 skills（先删除旧目录再装）

```bash
while IFS= read -r n; do
  rm -rf "/Users/lee/.codex/skills/$n"
done < <(curl -sL https://api.github.com/repos/deanpeters/Product-Manager-Skills/contents/skills | jq -r '.[].name')

while IFS= read -r p; do
  python3 /Users/lee/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
    --repo deanpeters/Product-Manager-Skills \
    --path "$p"
done < <(curl -sL https://api.github.com/repos/deanpeters/Product-Manager-Skills/contents/skills | jq -r '.[].path')
```

### 6.3 卸载某个 skill

```bash
rm -rf /Users/lee/.codex/skills/prd-development
```

