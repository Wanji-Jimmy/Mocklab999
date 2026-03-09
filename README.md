# Mocklab999

Mocklab999 是一个面向数学入学考试备考的模考平台项目。  
当前核心是 `TMUA` 全真流程模考，配套题库提取与清洗脚本，目标是做成可持续扩展到 `ESAT` 等考试的统一系统。

## 1. 项目定位

这个仓库不是单一前端项目，而是两层能力：

- `模考产品层`：在线做题、计时、交卷、出分、错题复盘、错题本
- `题库生产层`：PDF -> 文本/图像 -> 结构化题目 -> 前端可用数据

你可以把它理解为：  
**一个可运行的模考网站 + 一条能持续上新题库的数据管线。**

## 2. 当前功能（网站）

`tmua-exam/` 内为 Next.js 应用，已实现：

- 完整考试流程（Welcome -> Reading -> Paper 1 -> Paper 2 -> Submit -> Result）
- 倒计时、题号导航、标记题目、自动保存进度
- 交卷后即时评分与题目级对错复盘
- 错题加入 Mistake Book（本地存储）
- 账号页/仪表盘页（基于 localStorage 的轻量数据层）
- KaTeX 数学公式渲染与图片题兼容

> 说明：当前主产品是 TMUA，ESAT 为计划中的并行考试线。

## 3. 仓库结构

```text
.
├── tmua-exam/                      # Web 应用（Next.js）
├── TMUA-20xx-paper-*.pdf           # 原始试卷
├── extract_*.py / convert_*.py     # 提取、转换、清洗脚本
├── tmua_questions*.json            # 题库中间产物/合并产物
└── extracted_images/               # 从 PDF 抽取的图像资源
```

`tmua-exam/` 内重点目录：

- `app/`：页面与路由
- `components/`：考试界面与交互组件
- `data/`：前端读取的题库与 override 数据
- `lib/`：类型、评分、存储等核心逻辑
- `scripts/`：数据与流程校验脚本

## 4. 快速启动

### 环境要求

- Node.js 18+
- npm 9+

### 本地运行

```bash
cd tmua-exam
npm install
npx prisma generate
npm run dev
```

默认开发地址：

- `http://127.0.0.1:3001`

## 5. 数据与内容工作流（简版）

当前典型流程是：

1. 放入原始试卷 PDF
2. 运行提取/转换脚本（文本、题干、选项、答案、图片）
3. 合并为前端可读 JSON
4. 通过 `tmua-exam/scripts` 做完整性校验
5. 导入 `tmua-exam/data/` 供网站使用

这部分是项目的长期壁垒，后续会进一步标准化成可重复流水线。

## 6. 近期路线图

- TMUA/ESAT 双入口与双流程彻底分离
- ESAT 选科组合与分模块模考流程
- 结果页从“对错展示”升级为“弱点诊断 + 下一步训练”
- 错题本重练模式与学习闭环优化

## 7. 开发说明

- 本仓库包含大量题库素材与中间产物，提交前建议检查文件体积
- 构建产物、依赖目录应保持忽略（见 `.gitignore`）
- 若只做网站功能开发，建议在 `tmua-exam/` 内完成并验证

---

如需查看网站子项目的更细节说明，可继续阅读：  
[`tmua-exam/README.md`](./tmua-exam/README.md)
