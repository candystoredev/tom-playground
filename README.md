# tom-playground

Personal monorepo for web apps and experiments.

## Apps

### `apps/thehoecks/` — Family Photo Album
Private photo album replacing a Tumblr blog. Auth-protected, dark theme, iMessage feedback, iOS Shortcut uploads.

**Stack**: Next.js (App Router) + Tailwind CSS + Turso (SQLite) + Cloudflare R2 + Vercel

### `apps/hello/` — Static HTML
Minimal static page.

## Setup

```bash
# Install dependencies (thehoecks app)
cd apps/thehoecks && npm install

# Run dev server
npm run dev

# Run Tumblr migration (requires .env)
npm run migrate
npm run migrate:dry  # dry-run mode
```

## Structure

```
tom-playground/
├── apps/
│   ├── thehoecks/        # Family photo album (Next.js)
│   │   ├── src/
│   │   │   ├── app/      # Pages and API routes
│   │   │   ├── components/
│   │   │   └── lib/      # DB, auth, R2, schema
│   │   └── scripts/      # Migration script
│   └── hello/            # Static HTML app
├── docs/                 # Project documentation
│   ├── ARCHITECTURE.md   # System design and data model
│   ├── ROADMAP.md        # Feature phases and backlog
│   ├── DECISIONS.md      # Technical decision log
│   └── STATE.md          # Current working state (AI handoff file)
└── .github/workflows/    # CI/CD
```

## Deployment

Push to branch → Vercel auto-builds `apps/thehoecks/` → `dev.thehoecks.com`
Merge to master → auto-deployed to `thehoecks.com`

Static apps deploy to Bluehost via GitHub Actions.