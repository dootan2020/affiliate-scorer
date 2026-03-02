# ClaudeKit Self-Report

Comprehensive report on the ClaudeKit framework installed at `.claude/`.

---

## 1. Rules System

4 rule files in `.claude/rules/` govern all agent behavior:

### `development-rules.md`
Coding standards and quality guidelines. Key rules:
- **Naming:** kebab-case files (long descriptive names for LLM discoverability), PascalCase components, camelCase functions
- **File size:** Hard cap of 200 lines per code file; split into modules
- **Principles:** YAGNI, KISS, DRY — mandatory at all times
- **Skills activation:** Must analyze skills catalog and activate relevant skills per task
- **Code quality:** No syntax errors; try-catch error handling; security standards; delegate to `code-reviewer` after implementation
- **Pre-commit:** Run linting before commit, tests before push, never commit secrets, conventional commit format
- **Visual aids:** `/preview --explain|--diagram|--slides|--ascii` for complex code patterns
- Dependencies: references `./docs/code-standards.md`, `./docs/codebase-summary.md`

### `documentation-management.md`
Governs project documentation maintenance and plan structure.
- **Core docs:** Roadmap, Changelog, System Architecture, Code Standards — all in `./docs`
- **Auto-update triggers:** After feature implementation, milestones, bug fixes, security updates, weekly reviews
- **Plans structure:** `./plans/{timestamp-description}/` containing `plan.md` (< 80 lines) + numbered `phase-XX-*.md` files + `research/` and `reports/` subdirs
- **Phase files must contain:** Context links, overview, key insights, requirements, architecture, related code files, implementation steps, todo checklist, success criteria, risk assessment, security considerations, next steps
- Dependencies: references `./docs/*` files, `./plans/` directory

### `orchestration-protocol.md`
Defines sub-agent delegation and coordination.
- **Mandatory context:** Every sub-agent prompt must include Work Context Path, Reports Path (`{root}/plans/reports/`), Plans Path (`{root}/plans/`)
- **Sequential chaining:** Planning → Implementation → Simplification → Testing → Review. Each agent completes before the next starts.
- **Parallel execution:** Code + Tests + Docs simultaneously for independent work. Requires no file conflicts and a pre-planned merge strategy.
- Dependencies: references Task tool, all agent definitions

### `primary-workflow.md`
End-to-end development workflow:
1. **Implementation:** Delegate to `planner` first, use parallel `researcher` agents, run compile check after every file change
2. **Testing:** Delegate to `tester` agent. No mocks/cheats to pass builds. Fix and re-run until all pass
3. **Code Quality:** Delegate to `code-reviewer` after tests pass
4. **Integration:** Follow planner's plan, delegate to `docs-manager` to update `./docs`
5. **Debugging:** Delegate to `debugger` for diagnosis → implement fix → `tester` to verify → repeat if needed
6. **Visual Explanations:** `/preview` commands for 3+ interacting components
- Dependencies: references all agents, `/preview` command, `./plans/` and `./docs/`

---

## 2. Agents

14 agents in `.claude/agents/`:

| Agent | Purpose | Trigger | Output |
|-------|---------|---------|--------|
| **brainstormer** | Advisory-only. Explores solutions, evaluates architecture, debates trade-offs. Does NOT implement. | Task tool for architecture decisions | Markdown report with approaches, pros/cons, recommendation |
| **code-reviewer** | Comprehensive code review with scout-based edge case detection. Covers quality, type safety, security (OWASP Top 10), performance. | Task tool after implementation / before PRs | Code Review Summary with prioritized issues and metrics |
| **code-simplifier** | Simplifies recently modified code for clarity/maintainability. Preserves all functionality. | Task tool after implementation | Refined code files + verification results |
| **debugger** | 5-step systematic debugging: assess → collect → analyze → root cause → solution. Examines logs, DB, CI/CD. | Task tool when errors/failures occur | Diagnostic report with timeline, evidence, recommendations |
| **docs-manager** | Creates/maintains technical docs. Handles PDRs, codebase summaries, code-to-doc sync. Keeps docs < 800 LOC. | Task tool after code changes / milestones | Updated `./docs/` files + summary report |
| **fullstack-developer** | Executes implementation phases from parallel plans. Strict file ownership boundaries. Backend + frontend + infra. | Task tool with phase file from `/plan:parallel` | Phase Implementation Report |
| **git-manager** | Git operations: staging, committing, pushing with conventional commits. Optimized for 2-4 tool calls. | Task tool on "commit" / "push" / feature completion | Git operations executed |
| **journal-writer** | Documents technical difficulties with emotional authenticity. Captures failures, lessons learned, root causes. | Task tool on repeated failures, critical bugs, architectural setbacks | Journal entry (200-500 words) in `./docs/journals/` |
| **mcp-manager** | Manages MCP server integrations. Discovers/filters/executes MCP tools. Keeps main context clean. | Task tool for MCP operations | Execution summary with status and artifacts |
| **planner** | Creates comprehensive implementation plans. Uses mental models (decomposition, 80/20, root cause analysis). Does NOT implement. | Task tool before significant work / `/plan` commands | Plan folder in `./plans/` with `plan.md` + phase files |
| **project-manager** | Project oversight: tracks progress, collects agent reports, verifies completeness, maintains roadmap/changelog. | Task tool for status updates / multi-agent coordination | Project status reports + updated docs |
| **researcher** | Comprehensive technical research. Query Fan-Out technique. Spawned in parallel by planner. | Task tool / planner delegation | Research report in plan's `reports/` directory |
| **tester** | Validates code via unit/integration/e2e tests. Analyzes coverage. Never ignores failing tests. | Task tool after implementation / bug fixes | Test summary with pass/fail, coverage, recommendations |
| **ui-ux-designer** | Creates UIs/UX with design system awareness. Responsive, accessible (WCAG 2.1 AA), Vietnamese typography. | Task tool for design work | Production-ready code + `./docs/design-guidelines.md` |

---

## 3. Skills

50 skills in `.claude/skills/`, organized by category:

### Orchestrator Skills
| Skill | Purpose | Trigger |
|-------|---------|---------|
| **cook** | End-to-end feature implementation (research → plan → implement → test → review → finalize) | `/cook <task>` with flags: `--interactive`, `--fast`, `--parallel`, `--auto`, `--no-test` |
| **fix** | Unified bug/error fixing. Routes by complexity (simple/moderate/complex/parallel) | `/fix` with flags: `--auto`, `--review`, `--quick`, `--parallel` |
| **planning** | Research-driven implementation planning with codebase analysis | `/plan <description>` or activated by cook/fix |
| **brainstorm** | Solution ideation and trade-off analysis (advisory only) | `/brainstorm` |

### Debugging & Quality
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **debug** | Systematic root cause analysis before fixes. 4-technique framework. | None |
| **code-review** | Technical rigor review with verification gates and edge case scouting | None |
| **sequential-thinking** | Step-by-step complex problem analysis with revision | None |
| **problem-solving** | Techniques for complexity spirals and innovation blocks | None |

### Frontend
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **frontend-design** | Polished UI from designs/screenshots/videos. Anti-AI-slop philosophy. | `ai-multimodal`, `ui-ux-pro-max` |
| **frontend-development** | React/TypeScript patterns (Suspense, MUI v7, TanStack Router) | React, TanStack, MUI |
| **react-best-practices** | 45 Vercel Engineering performance rules across 8 categories | None (reference) |
| **ui-styling** | shadcn/ui + Radix UI + Tailwind CSS components and themes | shadcn/ui, Tailwind |
| **ui-ux-pro-max** | Design intelligence: 50+ styles, 97 palettes, 57 font pairings, 99 UX guidelines | Python |
| **web-design-guidelines** | Web Interface Guidelines compliance (Vercel) | WebFetch |
| **web-frameworks** | Next.js App Router, RSC, SSR, ISR, Turborepo monorepos | Next.js |

### Backend & APIs
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **backend-development** | Node.js, Python, Go backend patterns (NestJS, FastAPI, Django) | None (reference) |
| **databases** | MongoDB + PostgreSQL design, queries, migrations, performance | `psql` CLI |
| **better-auth** | TypeScript auth: email/password, OAuth, 2FA, passkeys, RBAC | `better-auth` npm |
| **payment-integration** | SePay, Polar, Stripe, Paddle, Creem.io integration | Provider API keys |

### AI & Multimodal
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **ai-multimodal** | Gemini API: vision, transcription, OCR, Imagen 4, Veo 3 | `GEMINI_API_KEY`, `google-genai` |
| **ai-artist** | Image generation via Nano Banana (129 curated prompts, 3 modes) | `GEMINI_API_KEY`, Python |
| **google-adk-python** | Google Agent Development Kit: multi-agent, A2A, MCP tools | `google-adk`, `GOOGLE_API_KEY` |

### Browser Automation
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **agent-browser** | AI-optimized CLI browser automation (93% less context than Playwright MCP) | `agent-browser` npm global |
| **chrome-devtools** | Puppeteer scripts with persistent sessions | Puppeteer |

### Code Intelligence
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **scout** | Fast parallel codebase scouting (internal Explore or external Gemini/OpenCode) | None |
| **research** | Multi-source technical research with cross-reference validation | Optional: `gemini` CLI |
| **docs-seeker** | Library docs via llms.txt (context7.com) | Node.js |
| **gkg** | GitLab Knowledge Graph: go-to-definition, find-usages, impact analysis | `gkg` CLI |
| **repomix** | Pack repositories into AI-friendly files (XML/MD/text) | `repomix` CLI |
| **context-engineering** | Token optimization, context window monitoring, usage limits | None |

### DevOps & Testing
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **devops** | Cloudflare, Docker, GCP, Kubernetes deployment | `wrangler`, `docker`, `gcloud`, `kubectl` |
| **web-testing** | Playwright, Vitest, k6: E2E, unit, load, visual, a11y testing | Playwright, Vitest, k6 |

### Git & Project
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **git** | Conventional commits, auto-split by type/scope, security scans | `git`, `gh` CLI |
| **plans-kanban** | Visual plan dashboard with progress tracking and Gantt charts | Node.js (gray-matter) |
| **find-skills** | Discover and install skills from open ecosystem | `npx skills` CLI |

### Specialized Domains
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **shopify** | Shopify apps, extensions, themes with Shopify CLI | `@shopify/cli` |
| **remotion** | Video creation in React | Remotion framework |
| **threejs** | 3D web apps (WebGL/WebGPU), 556 searchable examples | Three.js, Python |
| **shader** | GLSL fragment shaders: SDF, noise, fBm, animations | GLSL environment |
| **mintlify** | Documentation sites with 26+ MDX components, 7 themes | `mintlify` CLI |
| **mermaidjs-v11** | Diagrams: 24+ types (flowcharts, sequence, ER, Gantt, etc.) | Optional: `@mermaid-js/mermaid-cli` |
| **mobile-development** | React Native, Flutter, Swift, Kotlin mobile apps | Platform SDKs |
| **copywriting** | Conversion copy formulas, 50+ writing styles | Optional: `GEMINI_API_KEY` |

### Content & Visualization
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **markdown-novel-viewer** | Book-like markdown rendering HTTP server with Mermaid support | Node.js (marked, highlight.js) |
| **media-processing** | FFmpeg, ImageMagick, RMBG: video/audio/image processing | `ffmpeg`, `imagemagick` |

### MCP
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **mcp-builder** | Build MCP servers (Python FastMCP / TypeScript SDK) | MCP SDK |
| **mcp-management** | Discover, filter, execute MCP server tools | Gemini CLI (optional) |

### Meta
| Skill | Purpose | Dependencies |
|-------|---------|-------------|
| **skill-creator** | Create and package new Claude skills | Python scripts |
| **template-skill** | Empty skill boilerplate | None |

---

## 4. Commands

27 slash commands in `.claude/commands/`:

### Top-Level
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/ask` | Answer technical/architectural questions via 4 advisor personas | Architecture decisions, strategic guidance |
| `/bootstrap` | Interactive step-by-step project bootstrap (research → plan → design → implement → test → docs) | Starting a new project with full control |
| `/bootstrap:auto` | Automatic project bootstrap with minimal interaction | Starting a new project, autonomous decisions |
| `/ck-help` | ClaudeKit usage guide. Matches input to relevant commands/workflows | Finding the right command or workflow |
| `/coding-level` | Set experience level (0=ELI5 to 5=God Mode) for tailored output | Adjusting explanation depth |
| `/journal` | Write concise journal entries from memories + recent changes | Documenting progress, decisions, events |
| `/kanban` | Launch visual kanban dashboard web server for plan tracking | Visual overview of plan progress |
| `/preview` | View markdown files in novel-reader UI OR generate visual explanations (ASCII + Mermaid) | Previewing docs or explaining complex topics |
| `/test` | Run tests locally via `tester` subagent, analyze report | Validating code without making changes |
| `/use-mcp` | Execute MCP operations via Gemini CLI to preserve context | Interacting with MCP server tools |
| `/watzup` | Review recent git changes with impact and quality analysis | Understanding what changed on current branch |
| `/worktree` | Create isolated git worktree for parallel development | Working on features in isolation |

### Docs Subcommands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/docs:init` | Generate full initial documentation suite from scratch | Project has no existing docs |
| `/docs:summarize` | Lightweight update to `codebase-summary.md` | Quick doc refresh for specific topics |
| `/docs:update` | Full documentation update pipeline with validation | Docs are stale after significant changes |

### Plan Subcommands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/plan` | Intelligent plan creation — auto-selects fast vs hard | General planning with auto complexity detection |
| `/plan:fast` | Quick plan, no research phase. Uses existing codebase docs only. | Straightforward tasks with enough context |
| `/plan:hard` | Thorough plan with parallel research (up to 2 researchers) | Complex/unfamiliar/high-risk tasks |
| `/plan:parallel` | Plan with phases designed for parallel execution. Enforces file ownership. | Speeding up implementation with multiple agents |
| `/plan:two` | Generate 2 alternative plans with trade-off analysis | Evaluating multiple strategies |
| `/plan:validate` | Structured interview to validate plan assumptions | After planning, before implementation |
| `/plan:ci` | Analyze GitHub Actions CI/CD logs, create fix plan | CI/CD pipeline failures |
| `/plan:cro` | Conversion Rate Optimization plan (25-point framework) | Optimizing web pages for conversions |
| `/plan:archive` | Summarize and archive completed plans | Cleaning up `./plans/` directory |

### Review & Test Subcommands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/review:codebase` | Full codebase scan with parallel reviewers, generates improvement plan | Comprehensive code quality audit |
| `/test:ui` | UI tests on live website (Chrome DevTools): a11y, responsive, performance, security | Testing deployed/local website UI quality |

---

## 5. Hooks

10 hooks in `.claude/hooks/` (plus lib utilities and tests):

| Hook | Trigger | Purpose |
|------|---------|---------|
| **session-init.cjs** | `SessionStart` (startup, resume, clear, compact) | Comprehensive initialization: loads config, detects project type/framework/package manager, resolves active plan path, collects environment info (Node/Python/OS/git), writes env vars. Cleans up orphaned `.shadowed/` skill dirs. Outputs coding level guidelines and user assertions. |
| **dev-rules-reminder.cjs** | `UserPromptSubmit` | Injects development context into each prompt: session info, dev rules, modularization reminders, active Plan Context. Uses dedup to avoid redundant injection on rapid prompts. |
| **subagent-init.cjs** | `SubagentStart` | Injects compact context (~200 tokens) into subagents: agent type/ID, active plan/reports paths, language config, core rules (YAGNI/KISS/DRY), Python venv path, naming templates, trust passphrase. |
| **descriptive-name.cjs** | `PreToolUse` (file create/write) | Injects file naming guidance: kebab-case for JS/TS/Python/Shell, PascalCase for C#/Java, snake_case for Go/Rust. Advisory only — does not block. |
| **privacy-block.cjs** | `PreToolUse` (Read/file access) | Blocks access to sensitive files (.env, credentials). Exits code 2 with `@@PRIVACY_PROMPT@@` JSON marker. LLM must use `AskUserQuestion` for user approval, then re-access via bash `cat`. |
| **scout-block.cjs** | `PreToolUse` (file/directory access) | Blocks access to heavy/noisy directories listed in `.ckignore` (node_modules, .git, dist, etc.). Uses gitignore-spec pattern matching. Build commands are allowed. Detects overly broad search patterns. |
| **cook-after-plan-reminder.cjs** | `SubagentStop` (planner completes) | Reminds to invoke `/cook --auto` before implementation. Outputs active plan's absolute path for worktree/clear recovery. |
| **post-edit-simplify-reminder.cjs** | `PostToolUse` (Edit/Write/MultiEdit) | Tracks file modifications. After 5+ edits, reminds to run `code-simplifier` agent. 10-minute cooldown. Invalidates git info cache. |
| **skill-dedup.cjs** | `SessionStart`/`SessionEnd` | **DEPRECATED (v2.9.1).** Previously prevented local skills from shadowing global versions. Disabled due to race condition in concurrent sessions (Issue #422). Cleanup now handled by session-init. |
| **usage-context-awareness.cjs** | `UserPromptSubmit` + `PostToolUse` | Fetches Claude Code usage limits from Anthropic OAuth API, writes to cache file. Consumed by statusline and context-builder. Throttled: 1min for prompts, 5min for tool use. Never injects into conversation. |

### Hook Utilities (`hooks/lib/`)
- `ck-config-utils.cjs` — Config file read/write for `.ck.json`
- `colors.cjs` — Terminal color formatting
- `config-counter.cjs` — Tracks counters across sessions
- `context-builder.cjs` — Builds context injection strings
- `git-info-cache.cjs` — Caches git branch/status info
- `hook-logger.cjs` — Structured logging for hooks
- `privacy-checker.cjs` — Sensitive file pattern matching
- `project-detector.cjs` — Detects project type/framework/package manager
- `scout-checker.cjs` — Scout block pattern matching
- `transcript-parser.cjs` — Parses agent transcript files

### Notifications (`hooks/notifications/`)
- `notify.cjs` — Notification dispatcher
- `discord_notify.sh` / `send-discord.sh` — Discord webhook notifications
- `telegram_notify.sh` — Telegram bot notifications

---

## 6. Plan Templates

4 templates in `plans/templates/`:

### `feature-implementation-template.md`
For adding new functionality. Structure:
- Executive Summary (business value)
- Context Links (related plans, dependencies)
- Requirements (functional + non-functional: performance, security, scalability)
- Architecture Overview (Mermaid diagram, data models)
- Implementation Phases (multiple phases with scope, tasks with file paths, acceptance criteria)
- Testing Strategy (unit, integration, E2E targets)
- Security Considerations checklist
- Risk Assessment table
- TODO Checklist

### `bug-fix-template.md`
For diagnosing and fixing bugs. Structure:
- Executive Summary (bug description, impact)
- Issue Analysis (symptoms, root cause, evidence: logs, errors, affected components)
- Context Links (related issues, recent changes)
- Solution Design (approach, changes, test changes)
- Implementation Steps (numbered checklist with file paths)
- Verification Plan (test cases, edge cases, regression, rollback plan)
- Risk Assessment table
- TODO Checklist

### `refactor-template.md`
For structural improvements without behavior change. Structure:
- Executive Summary (what and why)
- Current State Analysis (issues, before-metrics)
- Refactoring Strategy (approach, before/after Mermaid diagram)
- 3 Implementation Phases: Preparation (tests + docs), Core Refactoring (file-level changes), Integration & Testing
- Backward Compatibility (breaking changes, migration, deprecation)
- Success Metrics (after targets)
- Risk Assessment + TODO Checklist

### `template-usage-guide.md`
Selection guidance:
- **Feature template:** New functionality (medium-large scope)
- **Bug fix template:** Fixing issues (small-medium scope)
- **Refactoring template:** Structural improvements (medium-large scope)
- Best practices: summaries < 3 sentences, max 10 tasks per phase, use context links over duplication

---

## 7. Overall Workflow

```
User Request
    │
    ▼
┌───────────────────────┐
│  session-init hook     │ ◄── SessionStart: loads config, detects project,
│  dev-rules-reminder    │     injects dev context into every prompt
│  usage-context-aware   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  /plan (auto-select)   │  ← OR /plan:fast, /plan:hard, /plan:parallel
│  ┌─────────────────┐  │
│  │ researcher ×N   │  │  ← parallel research (for /plan:hard)
│  └────────┬────────┘  │
│           ▼           │
│  ┌─────────────────┐  │
│  │ planner agent   │──┼──→ Creates ./plans/{name}/plan.md + phase-XX files
│  └─────────────────┘  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  cook-after-plan hook  │ ← Reminds to run /cook --auto
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  /cook (orchestrator)  │  ← Reads plan, executes phases sequentially or parallel
│  ┌─────────────────┐  │
│  │ fullstack-dev   │  │  ← Implements each phase (strict file ownership)
│  └────────┬────────┘  │
│           ▼           │
│  ┌─────────────────┐  │
│  │ code-simplifier │  │  ← post-edit-simplify hook triggers after 5+ edits
│  └────────┬────────┘  │
│           ▼           │
│  ┌─────────────────┐  │
│  │ tester agent    │  │  ← Runs tests, reports pass/fail/coverage
│  └────────┬────────┘  │
│           ▼           │
│  ┌─────────────────┐  │
│  │ code-reviewer   │  │  ← Reviews clean tested code
│  └────────┬────────┘  │
│           ▼           │
│  ┌─────────────────┐  │
│  │ docs-manager    │  │  ← Updates ./docs/ if needed
│  └─────────────────┘  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  git-manager agent     │ ← Commit + push with conventional commits
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  project-manager       │ ← Updates roadmap, changelog, plan status
└───────────────────────┘
```

### Agent Communication
- Agents communicate via **file artifacts**: plans in `./plans/`, reports in `./plans/reports/`, docs in `./docs/`, journals in `./docs/journals/`
- **Orchestration protocol** passes 3 mandatory paths to every subagent: work context, reports path, plans path
- **subagent-init hook** injects ~200 tokens of context (agent type, active plan, core rules) into every spawned subagent
- **Sequential chaining:** planner → fullstack-dev → code-simplifier → tester → code-reviewer → docs-manager
- **Parallel execution:** Multiple fullstack-dev instances work on isolated phases with no file overlap

---

## 8. File Structure

```
.claude/
├── .ck.json                          # ClaudeKit config (coding level, preferences)
├── .ckignore                         # Patterns blocked by scout-block hook
├── .env                              # Hook environment variables
├── .env.example                      # Template for .env
├── .gitignore                        # Git ignores for .claude/
├── .mcp.json.example                 # MCP server config template
├── metadata.json                     # ClaudeKit version metadata
├── settings.json                     # Claude Code settings (hooks, permissions)
├── settings.local.json               # Local settings override
├── statusline.cjs                    # Status bar script (Node.js)
├── statusline.ps1                    # Status bar script (PowerShell)
├── statusline.sh                     # Status bar script (Bash)
│
├── agents/                           # 14 agent definitions
│   ├── brainstormer.md
│   ├── code-reviewer.md
│   ├── code-simplifier.md
│   ├── debugger.md
│   ├── docs-manager.md
│   ├── fullstack-developer.md
│   ├── git-manager.md
│   ├── journal-writer.md
│   ├── mcp-manager.md
│   ├── planner.md
│   ├── project-manager.md
│   ├── researcher.md
│   ├── tester.md
│   └── ui-ux-designer.md
│
├── commands/                         # 27 slash commands
│   ├── ask.md
│   ├── bootstrap.md
│   ├── bootstrap/auto.md
│   ├── ck-help.md
│   ├── coding-level.md
│   ├── docs/init.md
│   ├── docs/summarize.md
│   ├── docs/update.md
│   ├── journal.md
│   ├── kanban.md
│   ├── plan.md
│   ├── plan/archive.md
│   ├── plan/ci.md
│   ├── plan/cro.md
│   ├── plan/fast.md
│   ├── plan/hard.md
│   ├── plan/parallel.md
│   ├── plan/two.md
│   ├── plan/validate.md
│   ├── preview.md
│   ├── review/codebase.md
│   ├── test.md
│   ├── test/ui.md
│   ├── use-mcp.md
│   ├── watzup.md
│   └── worktree.md
│
├── commands-archived/                # Archived/deprecated commands
│   ├── code.md, code/auto.md, ...
│   ├── cook.md, cook/auto.md
│   ├── debug.md
│   ├── design/*.md
│   ├── fix.md, fix/*.md
│   ├── scout.md, scout/ext.md
│   └── skill/*.md
│
├── hooks/                            # 10 lifecycle hooks
│   ├── cook-after-plan-reminder.cjs
│   ├── descriptive-name.cjs
│   ├── dev-rules-reminder.cjs
│   ├── post-edit-simplify-reminder.cjs
│   ├── privacy-block.cjs
│   ├── scout-block.cjs
│   ├── session-init.cjs
│   ├── skill-dedup.cjs              # (deprecated)
│   ├── subagent-init.cjs
│   ├── usage-context-awareness.cjs
│   ├── docs/README.md
│   ├── lib/                          # Shared utilities
│   │   ├── ck-config-utils.cjs
│   │   ├── colors.cjs
│   │   ├── config-counter.cjs
│   │   ├── context-builder.cjs
│   │   ├── git-info-cache.cjs
│   │   ├── hook-logger.cjs
│   │   ├── privacy-checker.cjs
│   │   ├── project-detector.cjs
│   │   ├── scout-checker.cjs
│   │   └── transcript-parser.cjs
│   ├── notifications/                # External notifications
│   │   ├── notify.cjs
│   │   ├── discord_notify.sh
│   │   ├── send-discord.sh
│   │   └── telegram_notify.sh
│   ├── scout-block/                  # Scout block sub-modules
│   │   ├── broad-pattern-detector.cjs
│   │   ├── error-formatter.cjs
│   │   ├── path-extractor.cjs
│   │   └── pattern-matcher.cjs
│   ├── __tests__/                    # Hook unit tests
│   └── tests/                        # Hook integration tests
│
├── hooks_bak/                        # Backup of hooks (mirror of hooks/)
│
├── output-styles/                    # Coding level output templates
│   ├── coding-level-0-eli5.md
│   ├── coding-level-1-junior.md
│   ├── coding-level-2-mid.md
│   ├── coding-level-3-senior.md
│   ├── coding-level-4-lead.md
│   └── coding-level-5-god.md
│
├── rules/                            # 4 governance rule files
│   ├── development-rules.md
│   ├── documentation-management.md
│   ├── orchestration-protocol.md
│   └── primary-workflow.md
│
├── schemas/
│   └── ck-config.schema.json         # JSON schema for .ck.json
│
├── scripts/                          # Utility scripts
│   ├── ck-help.py                    # Help command implementation
│   ├── commands_data.yaml            # Command metadata
│   ├── skills_data.yaml              # Skill metadata
│   ├── resolve_env.py                # Environment variable resolution
│   ├── scan_commands.py              # Command scanner
│   ├── scan_skills.py                # Skill scanner
│   ├── set-active-plan.cjs           # Active plan state management
│   ├── validate-docs.cjs             # Documentation validator
│   ├── worktree.cjs                  # Git worktree management
│   ├── fix-shebang-permissions.sh    # Unix permission fixer
│   ├── win_compat.py                 # Windows compatibility
│   └── test_*.py                     # Test scripts
│
└── skills/                           # 50 skill packages
    ├── install.sh / install.ps1      # Skill dependency installer
    ├── README.md                     # Skills overview
    ├── INSTALLATION.md               # Installation guide
    ├── THIRD_PARTY_NOTICES.md        # License notices
    ├── .venv/                        # Python virtual environment
    ├── common/                       # Shared skill utilities
    │   ├── api_key_helper.py
    │   └── api_key_rotator.py
    ├── agent-browser/SKILL.md
    ├── ai-artist/SKILL.md
    ├── ai-multimodal/SKILL.md
    ├── backend-development/SKILL.md
    ├── better-auth/SKILL.md
    ├── brainstorm/SKILL.md
    ├── chrome-devtools/SKILL.md
    ├── code-review/SKILL.md
    ├── context-engineering/SKILL.md
    ├── cook/SKILL.md
    ├── copywriting/SKILL.md
    ├── databases/SKILL.md
    ├── debug/SKILL.md
    ├── devops/SKILL.md
    ├── docs-seeker/SKILL.md
    ├── find-skills/SKILL.md
    ├── fix/SKILL.md
    ├── frontend-design/SKILL.md
    ├── frontend-development/SKILL.md
    ├── git/SKILL.md
    ├── gkg/SKILL.md
    ├── google-adk-python/SKILL.md
    ├── markdown-novel-viewer/SKILL.md
    ├── mcp-builder/SKILL.md
    ├── mcp-management/SKILL.md
    ├── media-processing/SKILL.md
    ├── mermaidjs-v11/SKILL.md
    ├── mintlify/SKILL.md
    ├── mobile-development/SKILL.md
    ├── payment-integration/SKILL.md
    ├── planning/SKILL.md
    ├── plans-kanban/SKILL.md
    ├── problem-solving/SKILL.md
    ├── react-best-practices/SKILL.md
    ├── remotion/SKILL.md
    ├── repomix/SKILL.md
    ├── research/SKILL.md
    ├── scout/SKILL.md
    ├── sequential-thinking/SKILL.md
    ├── shader/SKILL.md
    ├── shopify/SKILL.md
    ├── skill-creator/SKILL.md
    ├── template-skill/SKILL.md
    ├── threejs/SKILL.md
    ├── ui-styling/SKILL.md
    ├── ui-ux-pro-max/SKILL.md
    ├── web-design-guidelines/SKILL.md
    ├── web-frameworks/SKILL.md
    └── web-testing/SKILL.md
```
