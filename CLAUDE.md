# Claude Code — Project Guide

## Repository
`tom-playground` — personal monorepo. The active project is **The Hoecks**, a private family photo album at `apps/thehoecks/`.

## Quick Orientation
- **App code**: `apps/thehoecks/src/` (Next.js App Router)
- **Docs**: `apps/thehoecks/docs/` — read these before making changes:
  - `ARCHITECTURE.md` — system design, data model, deployment, integrations
  - `ROADMAP.md` — phased build plan with verify checklists
  - `STATE.md` — current status, blockers, known issues, AI guardrails
  - `DECISIONS.md` — technical decision log with rationale
- **Tests**: `apps/thehoecks/tests/`
- **Migration script**: `apps/thehoecks/scripts/migrate.ts`

## Tech Stack
| Component | Service |
|-----------|---------|
| Framework | Next.js (App Router) + Tailwind CSS |
| Hosting | Vercel (free tier) |
| Database | Turso (SQLite) with FTS5 |
| Media | Cloudflare R2 (zero egress) |
| Secrets | Doppler |
| Domain | dev.thehoecks.com (production) |

## Key Commands
```bash
cd apps/thehoecks
npm install        # install dependencies
npm run dev        # local dev server
npm run migrate    # run Tumblr migration (requires .env)
npm run migrate:dry  # dry-run migration
```

## Development Rules
1. Read `STATE.md` first — it has current status, blockers, and guardrails
2. All changes must work within Vercel free tier (10s function timeout, 4.5MB body limit)
3. Media uploads go through presigned R2 URLs, not through Vercel
4. Never store plaintext passwords — bcrypt only
5. Don't add paid dependencies without explicit approval
6. Update `ARCHITECTURE.md` if you change the schema
7. Update `STATE.md` when completing work or discovering issues
8. Don't run the migration script against production without Tom's confirmation

## Deployment
- `dev.thehoecks.com` is the production site (the old Tumblr site still lives on `www.thehoecks.com`)
- Push to branch → Vercel auto-builds preview deployments
- Merge to master → auto-deployed to `dev.thehoecks.com`
- Vercel root directory is set to `apps/thehoecks`
