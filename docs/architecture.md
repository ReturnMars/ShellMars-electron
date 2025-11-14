# ShellMars Electron 架构与进度规划（v0.1）

## 架构设计文档

### 总体定位
- 桌面端跨平台远程运维工具，覆盖 Windows / macOS / Linux。
- Electron 主进程负责系统能力调用与安全控制，渲染进程承载界面交互。
- 核心能力：终端多会话、SFTP 文件管理、批量任务编排、监控与审计、自动更新。

### 技术栈与主要库
- **框架与构建**
  - `electron@latest`、`electron-vite`：统一管理主进程、预加载、渲染层构建。
  - `electron-builder`、`electron-rebuild`、`electron-updater`：打包与自动更新。
- **渲染层**
  - `vite@^5/6`、`vue@^3`、`@vitejs/plugin-vue`。
  - `naive-ui`、`pinia`、`vue-router`、`axios`、`@vueuse/core`。
  - `@xterm/xterm` 及 `@xterm/addon-attach/fit/search/serialize`，`monaco-editor`（文件编辑）、`echarts`/`chart.js`（监控）。
- **主进程 / 服务层**
  - `node-pty`、`ssh2`、`ssh2-sftp-client`：终端会话、SSH、SFTP、端口转发。
  - `cron`、`nodemailer`（可选通知）、`keytar`（凭证安全存储）。
  - `electron-log` / `winston`：日志系统；`zod`/`io-ts`：IPC 数据校验。
  - `better-sqlite3` 或 `nedb`：本地配置与审计持久化。
- **工程保障**
  - `typescript`、`oxlint`、`prettier`、`lint-staged`、`husky`。
  - `vitest`、`@testing-library/vue`、`playwright`。
  - `commitlint`、`standard-version` / `changesets`。

### 系统分层
- **主进程（Node 服务层）**：`SessionManager`、`PTYService`、`FileService`、`TaskOrchestrator`、`ConfigStore`、`AuditLogger`、`UpdateManager`、`PluginHost`。
- **预加载层**：`contextBridge` 白名单 API、事件总线、IPC 管理。
- **渲染层**：终端工作区、文件管理器、任务调度、监控告警、设置中心、通知中心。
- **外部服务接口（可选）**：云端账号 / 配置同步、审计存储、插件市场。

### 关键数据流
- **终端链路**：渲染层输入 → IPC → `PTYService` → `ssh2`/本地 Shell → stdout 回推 → `xterm` 渲染。
- **文件传输**：渲染层任务 → `FileService` 执行（SFTP/SCP） → 进度事件回传。
- **配置管理**：UI 请求 `ConfigStore` 数据 → 变更后主进程广播同步。
- **监控 / 审计**：主进程采集指标与会话录像 → 本地 / 云端存储 → UI 订阅查看。

### 安全策略
- 禁用渲染层 `nodeIntegration`，仅通过 `preload` 暴露受控 API。
- 密钥与凭证使用平台安全存储（Windows DPAPI、macOS Keychain、Linux Secret Service）。
- IPC 层进行 schema 校验、节流与权限控制，终端数据支持速率限制与日志脱敏。
- 支持代理 / 堡垒机、双因子认证、零信任接入策略。

### 可扩展性
- 插件接口：`PluginHost` 暴露受控扩展点，支持第三方运维工具。
- 主题 / 国际化：Naive UI 主题体系 + 多语言资源（默认中文）。
- 自动更新：Squirrel.Windows / DMG / ZIP / AppImage / DEB / RPM，统一通知渲染层。

### DevOps 与测试
- 采用 electron-vite 结构或 Monorepo（Turborepo），CI 执行 lint / test / build。
- 单元测试（Vitest）、组件测试、E2E（Playwright）覆盖关键流程。
- Crash / 日志管线：`electron-log` + 本地归档，支持上报。

---

## 项目进度管理文档

### 里程碑规划
| 阶段 | 周期 | 目标产出 |
| --- | --- | --- |
| M0 预研 | 2 周 | 搭建 electron-vite 基础框架，打通主 / 渲染通信雏形，确定编码规范 |
| M1 最小可用 | 4 周 | 实现 SSH + PTY + xterm 基础链路、会话管理、基础 UI |
| M2 文件与配置 | 4 周 | 完成 SFTP 上传下载、配置存储（含密钥）、终端增强 |
| M3 运维能力 | 5 周 | 批量任务、监控面板、日志审计、通知中心 |
| M4 交付准备 | 4 周 | 自动更新、安装包、性能优化、测试与文档完善 |
| M5 扩展迭代 | 持续 | 插件体系、云端协同、AI 运维助手等增量功能 |

### 迭代节奏
- 双周迭代：计划 → 开发 → 测试 → 回顾，维护迭代看板（需求、进行中、阻塞、完成）。
- 需求优先级：P0（阻塞核心流程）/P1（影响主要功能）/P2（体验优化）/P3（储备）。
- 风险管理：重点关注原生模块兼容、跨平台差异、SSH 性能、安全合规等。

### 角色与分工
- 技术负责人：架构演进、关键技术攻关、代码评审标准。
- 桌面端工程：主进程 / IPC / 原生模块实现。
- 前端工程：Vue 组件、状态管理、交互设计。
- QA：测试方案、自动化脚本、回归测试。
- 运维 / 安全：CI/CD、代码签名、漏洞扫描。
- 产品 / 设计：原型、需求池管理、交互规范（中文文档）。

### 交付物与验收
- 每迭代提供说明文档、演示视频、测试报告、已知问题清单。
- 核心节点需通过性能测试（终端延迟、文件传输速率）与安全测试（权限、注入、审计）。
- 发布 Checklist：版本号、更新日志、签名证书、制品上传、灰度策略。

---

## 依赖库与用途汇总

| 分类 | 依赖名称 | 主要用途 |
| --- | --- | --- |
| 运行时核心 | `electron` | 桌面壳、窗口管理、系统 API 调用 |
|  | `electron-vite` | 主进程 / 预加载 / 渲染层统一构建配置 |
|  | `electron-builder` | 跨平台打包与分发 |
|  | `electron-rebuild` | 重编译原生模块以适配 Electron ABI |
|  | `electron-updater` | 自动更新流程管理 |
| 渲染层 | `vite`、`vue`、`@vitejs/plugin-vue` | 前端构建与框架 |
|  | `naive-ui` | UI 组件库与主题体系 |
|  | `pinia`、`vue-router`、`axios`、`@vueuse/core` | 状态管理、路由、网络请求、组合式工具 |
|  | `@xterm/xterm`、`@xterm/addon-*` | 终端 UI 控件及扩展 |
|  | `monaco-editor` | 文件在线编辑 |
|  | `echarts` / `chart.js` | 监控可视化 |
| 主进程 / 服务层 | `node-pty` | 伪终端创建与标准流管理 |
|  | `ssh2`、`ssh2-sftp-client` | SSH 会话、SFTP 文件操作、端口转发 |
|  | `cron`、`nodemailer` | 定时任务、通知（可选） |
|  | `keytar` | 凭证安全存储 |
|  | `electron-log`、`winston` | 日志与审计记录 |
|  | `zod` / `io-ts` | IPC 数据结构校验 |
|  | `better-sqlite3` / `nedb` | 配置与审计持久化 |
| 工程与质量 | `typescript` | 类型系统 |
|  | `oxlint`、`prettier`、`lint-staged`、`husky` | 代码规约、提交钩子 |
|  | `vitest`、`@testing-library/vue`、`playwright` | 单元 / 组件 / 端到端测试 |
|  | `commitlint`、`standard-version` / `changesets` | 提交与版本管理 |
|  | `dotenv`、`electron-store` | 配置管理与加载 |

> 所有注释、文档、提示信息均保持中文；后续版本可根据功能演进持续更新。


