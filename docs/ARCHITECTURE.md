# Architecture

## System Overview

Private family photo album replacing a Tumblr blog at thehoecks.com (~15 years, hundreds of posts, ~260 videos). Auth-protected web app with direct iPhone upload support and iMessage-based feedback instead of comments.

### Source Site (thehoecks.com on Tumblr)
- Tumblr-hosted since ~2012, custom dark theme (bg `#1d1c1c`, text `#d3d3d3`, accent `#427ea3`)
- Typography: "Calluna Sans" font, centered text, 1.5rem body
- Layout: single-column feed, ~900px desktop, centered, infinite scroll
- Content: title + photo(s)/video + caption + date + tags (60+ tags: people, time, location, content type)
- Mix of photos, photosets (multi-photo), and videos

### Design Principles (carried from Tumblr)
- Simple chronological browsing
- Rich tagging (people, locations, themes)
- Dark theme making photos pop
- Captions/titles for context
- Visual-first, low friction

### Improvements Over Tumblr
- Self-hosted (no platform dependency)
- Privacy controls (auth, invite links)
- Direct iPhone upload via iOS Shortcut
- Album/gallery grouping beyond tags
- FTS5 search
- No social sharing clutter or reblog model

## Components

### Frontend
- **Next.js** (App Router) on **Vercel** free tier
- **Tailwind CSS** — dark theme (bg `#1d1c1c`, text `#d3d3d3`, accent `#427ea3`)
- Single-column feed, ~900px max width, centered
- Photo interaction: full-screen lightbox on click, swipe/arrow navigation
- Multi-photo posts: grid/mosaic layout using `photoset_layout` string or auto-calculated

### Media Storage (Cloudflare R2)
- Bucket: `thehoecks-media`, public access enabled
- Zero egress fees
- Presigned upload URLs for admin panel and iOS Shortcut (bypasses Vercel 4.5MB body limit)

#### R2 Key Convention
```
media/{media_id}/original.{ext}   — full-size original
media/{media_id}/thumb.{ext}      — optimized thumbnail for feed
```
Extensible: future variants added as sibling files without schema changes.

### Database (Turso / SQLite)
- **Turso** free Starter plan with FTS5 full-text search
- FTS5 uses external content mode backed by SQLite implicit integer rowid (not nanoid PK)
- FTS sync triggers on posts INSERT/UPDATE/DELETE
- Tags denormalized into FTS table as comma-separated string

### Authentication & Access Control
- **Viewer access (two paths)**:
  1. **Invite link**: `/invite/[token]` — auto-sets session cookie, no password needed. Admin can label, expire, revoke.
  2. **Shared password**: Admin-changeable from settings page. Stored as bcrypt hash in `site_settings`.
- **Admin access**: Separate admin password (env var). Gates admin panel + settings.
- **API/iOS**: Bearer token (`ADMIN_API_TOKEN`) for iOS Shortcut uploads
- All browsing routes protected by default
- Individual post pages publicly accessible by URL (for iMessage OG previews) but not discoverable

## Data Flow

### Feed Rendering
```
Client request → Middleware (JWT check) → Next.js API → Turso query → R2 media URLs → Browser
```

### Upload Flow (Admin Panel / iOS Shortcut)
1. Client requests presigned upload URL(s) from API
2. Client uploads original directly to R2 via presigned URL
3. Client calls `POST /api/posts` with metadata + R2 keys
4. API route fetches original from R2, generates thumbnail via `sharp`, uploads thumbnail to R2
5. API saves post record with both R2 keys

Step 4 constraints: R2 → Vercel fetch is fast (Cloudflare network), `sharp` resizes typical iPhone photo (3-8MB) in <1 second, thumbnail upload (~100KB) near-instant. Within Vercel 10-second function timeout.

### Video Handling
- **Migration**: `ffmpeg` locally extracts poster frame
- **Admin uploads**: client-side `<video>` + canvas API captures frame (avoids server ffmpeg)
- Direct R2 serve, no transcoding

### Tumblr Migration

**API**: Tumblr v2 API (`/v2/blog/{blog-identifier}/posts`) with OAuth credentials (Consumer Key + Consumer Secret). Paginate with rate-limit backoff.

**Migration Config** (required before running):
- People list: array of names to route to `people` table (e.g., `["Sophie", "Emma", "Grandma"]`)
- Tumblr blog identifier
- R2 credentials
- Turso connection info

**Staged Testing** (run against real Tumblr API):
1. 10 posts: Verify data flow — check DB records, R2 media, thumbnails, tags, people mapping
2. 100 posts: Spot-check variety — multi-photo grids, video playback, date parsing, slug dedup
3. Full migration: Compare summary against expected totals, browse feed to sanity check

**Post-migration verification**: Post count matches Tumblr. Media count matches (originals + thumbnails). No orphaned media or orphaned records. People and tags correctly split.

**Data Flow**:
1. Paginate all posts via Tumblr API v2
2. Extract: title, body/caption, timestamp, media URLs, tags, post type, `photoset_layout`
3. Sanitize HTML in captions/bodies (strip unsafe tags, preserve basic formatting)
4. Download all media, record `file_size` in bytes
5. Upload originals to R2 as `media/{media_id}/original.{ext}`
6. Generate photo thumbnails via `sharp`, video poster frames via `ffmpeg`; upload as `media/{media_id}/thumb.{ext}`
7. Map Tumblr post types: photo/video → `photo`/`video`/`mixed`; text/quote/link/answer → `text`
8. Month/year tags (aug2013, oct2024) → parsed into post `date` field
9. Tags matching people list → `people` table + `post_people` junction
10. All other tags → `tags` table + `post_tags` junction (with auto-generated slugs)
11. Auto-generate slug from title; untitled posts get date-based slug. Duplicates suffixed (`-2`, `-3`)
12. Write records to Turso (FTS5 sync via triggers)
13. Output summary: post count by type, media count, people/tags imported, skipped items with reasons
14. Immediately after: `turso db dump` for baseline backup

## Integrations

### iMessage Feedback System
- **Button**: "Text us about this" (green, prominent) on post pages
- **Recipients**: Group message via `sms:+1XXXXXXXXXX,+1YYYYYYYYYY&body=...`
- **Numbers**: Stored in `site_settings` (`imessage_recipients`), admin-changeable
- **Pre-filled message**: Post URL + "My reaction:" + cursor
- **Desktop fallback**: Text instruction with phone numbers and post title
- **OG tags**: title, description ("Posted [date]"), image (first media), URL, site_name

### iOS Shortcut
1. Select photos/videos → Share → "Post to Family Album"
2. Mini form: title (optional), tags, people
3. `GET /api/presigned-upload` (Bearer token auth) → presigned R2 URL per file
4. Upload each file directly to R2
5. `POST /api/posts` with metadata + media keys
6. Server generates thumbnails; continues in background if user switches apps
7. EXIF date extracted → pre-fills post date

### Privacy & Crawler Blocking (3 layers)
1. `robots.txt`: Blocks well-behaved crawlers from entire site
2. `<meta name="robots" content="noindex, nofollow">`: On individual post pages
3. `X-Robots-Tag: noindex` response header

iMessage/social crawlers intentionally ignore `robots.txt` (desired — enables link previews). Search engines respect `robots.txt` and `noindex`.

## Data Model

```sql
posts
├── id (PK, nanoid)
├── slug (unique, URL-friendly, auto-generated from title, editable)
├── title (optional)
├── body (optional, sanitized HTML)
├── date (from EXIF, Tumblr metadata, or manual override)
├── type (photo | video | mixed | text)
├── photoset_layout (e.g., "212" = 2-1-2 grid rows)
├── created_at
├── updated_at

media
├── id (PK, nanoid)
├── post_id (FK → posts)
├── r2_key (path to original in R2)
├── thumbnail_r2_key (path to thumbnail in R2)
├── type (photo | video)
├── width, height (integer)
├── file_size (bytes)
├── duration (seconds, video only)
├── display_order (integer)
├── mime_type

tags
├── id (PK, nanoid)
├── name (unique)
├── slug (unique)
├── created_at

post_tags (junction: post_id, tag_id)

people
├── id (PK, nanoid)
├── name
├── slug (unique)
├── created_at

post_people (junction: post_id, person_id)

albums
├── id (PK, nanoid)
├── title
├── slug (unique)
├── description (optional)
├── cover_media_id (FK → media, nullable, defaults to most recent)
├── created_at

post_albums (junction: post_id, album_id)

invite_links
├── id (PK, nanoid)
├── token (unique, random)
├── label (optional, e.g., "Grandma's link")
├── created_at
├── expires_at (nullable)
├── revoked (boolean)

site_settings (key-value)
├── key (PK: viewer_password_hash, imessage_recipients, site_title, site_description)
├── value
├── updated_at

posts_fts (FTS5, external content mode, content=posts, content_rowid=rowid)
├── title, body, tags (denormalized comma-separated)
```

### Data Model Notes
- **IDs**: nanoid everywhere — non-sequential prevents archive enumeration since post pages are publicly accessible
- **Slugs**: Posts, tags, people, albums all have auto-generated slugs. Duplicate titles → suffix (`-2`, `-3`). Untitled posts → date-based slug (`2023-10-15`)
- **Thumbnails**: Pre-generated via `sharp` — avoids Vercel 1,000/month image optimization cap
- **File size**: Populated at upload time for storage monitoring and validation
- **Photoset layout**: Tumblr format string preserved during migration; new posts can set manually or auto-calculate
- **Post type `text`**: Covers imported Tumblr text, quote, link, and answer types. Audio posts skipped unless present.
- **Album covers**: Points to existing media item. Default: most recent photo. Admin-overridable.
- **Password hashing**: bcrypt hash in `site_settings`, never plaintext
- **Month/year tags**: NOT imported as tags — become post `date` field

## Constraints

- Vercel free tier: 10-second function timeout, 4.5MB body limit (bypassed via presigned R2 URLs), 1,000 image optimizations/month (bypassed via pre-generated thumbnails)
- Turso free Starter: SQLite limitations apply
- R2: Free up to 10GB, then $0.015/GB/month
- Tumblr strips EXIF data — use API timestamps for post dates
- Videos stored directly (no transcoding)
- Non-sequential IDs required for publicly accessible post pages

## Deployment

### Infrastructure
| Component | Service | Tier |
|-----------|---------|------|
| Hosting | Vercel | Free (Hobby) |
| Media storage | Cloudflare R2 | Free up to 10GB |
| Database | Turso (SQLite) | Free Starter |
| Domain | thehoecks.com | Already owned |

### Environment Variables (Vercel Dashboard)
```
# Infrastructure (rarely change)
TURSO_DATABASE_URL        = libsql://thehoecks-[username].turso.io
TURSO_AUTH_TOKEN           = [from Turso CLI]
R2_ACCOUNT_ID              = [from Cloudflare dashboard]
R2_ACCESS_KEY_ID           = [from R2 API token]
R2_SECRET_ACCESS_KEY       = [from R2 API token]
R2_BUCKET_NAME             = thehoecks-media
R2_PUBLIC_URL              = https://pub-[hash].r2.dev
JWT_SECRET                 = [random 32+ char string]
ADMIN_API_TOKEN            = [random 32+ char string]
ADMIN_PASSWORD             = [random string]
NEXT_PUBLIC_SITE_URL       = https://dev.thehoecks.com
```

### Operational Settings (DB `site_settings`, admin-changeable)
- `viewer_password_hash` — bcrypt hash of shared family password
- `imessage_recipients` — comma-separated phone numbers
- `site_title` — "The Hoecks"
- `site_description` — for OG meta tags

### Setup Steps

**Vercel**: Import GitHub repo `tom-playground` → Root Directory: `apps/thehoecks` → Framework: Next.js
- Dev: `dev.thehoecks.com` mapped to feature branch
- Production: `thehoecks.com` mapped to master branch

**Cloudflare R2**: Create bucket `thehoecks-media` → enable public access → create R2 API token (read + write)

**Turso**: `turso db create thehoecks` → get URL + auth token

**DNS**:
- Dev: CNAME `dev` → `cname.vercel-dns.com`
- Production: Vercel provides A records / CNAME at go-live

### Pipeline
- Push to branch → Vercel auto-builds → `dev.thehoecks.com`
- Merge to master → auto-deployed to `thehoecks.com`

### Backup Strategy
- **Baseline**: `turso db dump` immediately after migration — known-good snapshot
- **Ongoing**: Periodic `turso db dump` (manual or scripted)
- R2 media is durable (Cloudflare infrastructure); database is single point of failure
- Store dumps locally and/or in R2

### Estimated Costs
- ~$0-2/month total
- 50GB photos = ~$0.60/month on R2, zero egress fees
