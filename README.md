# clean-writer-ruby-version

A 1:1 reimplementation of [clean-writer](https://github.com/stussysenik/clean-writer) in **Rails 8 + React 19**, adding server persistence, multi-tab sync, and a deployable backend.

Everything the original clean-writer does — distraction-free writing with 16 themes, real-time syntax highlighting, song mode with rhyme detection — but backed by PostgreSQL instead of localStorage.

## Why

The original clean-writer is a static React app. It works great, but:

| | clean-writer | clean-writer-ruby-version |
|---|---|---|
| **Storage** | localStorage (one browser) | PostgreSQL (any device) |
| **Multi-tab** | Conflicts / overwrites | ActionCable real-time sync |
| **Themes** | Hardcoded JSON | Database-backed, customizable per session |
| **Settings** | localStorage | Server-persisted per session |
| **Offline** | Always works | Offline queue with IndexedDB replay |
| **Deploy** | Static hosting | Fly.io / any Docker host |
| **Extensibility** | Frontend-only | Full Rails API for future features |

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser                                     │
│  ┌─────────────────────────────────────────┐ │
│  │  React 19 (Vite)                        │ │
│  │  - Typewriter editor                    │ │
│  │  - Syntax highlighting (Web Worker)     │ │
│  │  - Song mode / rhyme detection          │ │
│  │  - 16 theme presets + customizer        │ │
│  │  - GSAP animations                      │ │
│  └──────────┬──────────────────────────────┘ │
│             │ REST API + ActionCable          │
└─────────────┼────────────────────────────────┘
              │
┌─────────────┼────────────────────────────────┐
│  Rails 8.1  │                                │
│  ┌──────────┴──────────────────────────────┐ │
│  │  API Controllers (v1)                   │ │
│  │  - Documents (autosave, CRUD)           │ │
│  │  - Themes (presets + overrides)         │ │
│  │  - Settings (per-session)               │ │
│  │  - Export (markdown download)           │ │
│  └──────────┬──────────────────────────────┘ │
│             │                                │
│  ┌──────────┴──────────────────────────────┐ │
│  │  PostgreSQL                             │ │
│  │  Solid Cache · Solid Queue · Solid Cable│ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## The NERV Theme

The 16th theme is a full **Neon Genesis Evangelion** tech-art aesthetic:

- Animated boot sequence (MAGI system initialization, AT Field status)
- CRT scanline overlay with phosphor glow
- Glitch effects and terminal-style status bar
- EVA Unit-01 color palette (purple/green/orange on black)

The NERV components live in `frontend/components/nerv/` and activate only when the NERV theme is selected.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Rails 8.1, Ruby 4.0.1 |
| **Frontend** | React 19, TypeScript 5.8 |
| **Build** | Vite 6.4, vite_rails |
| **Database** | PostgreSQL |
| **Real-time** | ActionCable (Solid Cable) |
| **Background Jobs** | Solid Queue (in-Puma) |
| **Caching** | Solid Cache |
| **Styling** | Tailwind CSS 4 |
| **Animation** | GSAP 3.14 |
| **NLP** | compromise 14 (Web Worker) |
| **Rhyme Detection** | CMU Pronouncing Dictionary |
| **Drag & Drop** | dnd-kit |
| **Markdown** | react-markdown + remark-gfm |
| **HTTP Proxy** | Thruster |
| **Deployment** | Fly.io (Docker) |

## Setup

### Prerequisites

- Ruby 4.0.1
- Node.js 22+
- PostgreSQL 14+

### Install

```bash
git clone https://github.com/stussysenik/clean-writer-ruby-version.git
cd clean-writer-ruby-version

bundle install
npm install
```

### Database

```bash
bin/rails db:create db:migrate
bin/rails db:seed    # seeds 16 preset themes
```

### Run

```bash
bin/dev
```

This starts both Rails (port 3000) and Vite dev server via `Procfile.dev`.

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Fly.io)

### First-time setup

```bash
fly auth login
fly apps create clean-writer-ruby-version
fly postgres create --name clean-writer-ruby-db --region iad
fly postgres attach clean-writer-ruby-db --app clean-writer-ruby-version
fly secrets set RAILS_MASTER_KEY=$(cat config/master.key) --app clean-writer-ruby-version
```

### Deploy

```bash
fly deploy --app clean-writer-ruby-version
```

### Seed themes (one-time after first deploy)

```bash
fly ssh console --app clean-writer-ruby-version -C "/rails/bin/rails db:seed"
```

### Estimated cost

| Resource | Spec | Cost |
|----------|------|------|
| Web machine | shared-cpu-1x, 512MB | ~$3.32/mo |
| Postgres | shared-cpu-1x, 256MB, 1GB disk | ~$2.17/mo |
| **Total** | | **~$5.49/mo** |

Auto-stop machines reduce cost when idle. New accounts get a free trial.

## Models

- **Document** — content, word count, view mode, font settings, highlight config (per session)
- **Theme** — 16 presets + custom themes with full color customization
- **ThemeOverride** — per-session color overrides for any theme
- **UserSetting** — active theme, theme order, visibility, rhyme settings (per session)

## License

MIT
