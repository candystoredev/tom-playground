# State

## Current Status
Phases 1-3 complete. Foundation, vertical slice, and migration script implemented. App has auth, dark theme feed, schema with FTS5, R2 integration, and a working Tumblr migration script. Phase 4 (public site polish) is next.

## Active Branch
master

## Current Task
Begin Phase 4a — polished feed with cursor-based infinite scroll

## Blockers
- Tumblr blog handle not yet confirmed by Tom (migration script has `www.thehoecks.com` hardcoded)

## Known Issues
- Feed pagination is basic LIMIT 50, not cursor-based yet
- No individual post pages
- No OG tags for iMessage previews
- Seed test posts from Phase 2 must be deleted before running real migration
- PEOPLE set in migration script is empty (needs family names from Tom)
- FTS5 tags field always inserts empty string (trigger doesn't join tag names)

## Next Action
Implement cursor-based pagination in the home feed (Phase 4a)

## Relevant Files
- `apps/thehoecks/src/app/page.tsx` — home feed
- `apps/thehoecks/src/app/login/page.tsx` — login page
- `apps/thehoecks/src/middleware.ts` — auth middleware
- `apps/thehoecks/src/lib/auth.ts` — session/JWT/password logic
- `apps/thehoecks/src/lib/db.ts` — Turso client
- `apps/thehoecks/src/lib/r2.ts` — R2 upload/delete
- `apps/thehoecks/src/lib/schema.ts` — all table definitions + FTS5
- `apps/thehoecks/src/components/PhotoGrid.tsx` — multi-photo grid + layout parser
- `apps/thehoecks/src/components/LogoutButton.tsx` — logout UI
- `apps/thehoecks/src/components/SeedButton.tsx` — seed test data UI
- `apps/thehoecks/src/app/api/init/route.ts` — schema init + settings seed
- `apps/thehoecks/src/app/api/seed/route.ts` — test data seeder
- `apps/thehoecks/src/app/api/auth/login/route.ts` — login endpoint
- `apps/thehoecks/src/app/api/auth/logout/route.ts` — logout endpoint
- `apps/thehoecks/src/app/robots.txt/route.ts` — crawler blocking
- `apps/thehoecks/scripts/migrate.ts` — Tumblr migration script

## AI Guardrails
Assumptions:
- Phases 1-3 are considered complete per PLAN.md phase definitions
- Migration script has not been run against real Tumblr data yet
- Dev deployment at dev.thehoecks.com is the primary test target
- Tom is the primary admin user

Constraints:
- All changes must work within Vercel free tier limits
- Media uploads must go through presigned R2 URLs (not through Vercel)
- All passwords must be bcrypt hashed, never plaintext
- Post pages must remain publicly accessible (for OG previews)
- Do not break existing auth flow

Do Not:
- Add new services or paid dependencies without explicit approval
- Change the database schema without updating `schema.ts` and ARCHITECTURE.md
- Modify auth middleware behavior without re-verifying all access paths
- Run the migration script against production without Tom's confirmation
- Remove crawler blocking from post pages
- Store plaintext passwords anywhere
- Add features from the V2 backlog during current phases
