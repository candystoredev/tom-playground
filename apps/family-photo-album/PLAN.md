# Family Photo Album - Project Plan

## Status: Planning Phase (Iterating — Review 2)

**Goal:** Replace the Tumblr-hosted family photo archive at thehoecks.com (~15 years, hundreds of posts, ~260 videos) with a custom self-hosted platform offering privacy controls, direct iPhone uploads, and family-specific features.

---

## 1. Current Site Review (thehoecks.com)

### What It Is
A Tumblr-hosted family photo blog running since ~2012, using a custom dark theme. Chronological family photo album spanning 13+ years.

### Design & Layout
- **Color scheme**: Dark background (#1d1c1c), light gray text (#d3d3d3), blue accents (#427ea3)
- **Typography**: "Calluna Sans" font (warm, non-corporate), centered text, 1.5rem body
- **Layout**: Single-column feed, narrow width (~900px desktop), centered
- **Header**: Custom banner image with dark overlay and site title
- **Scrolling**: Infinite/endless scroll

### Content Structure (Per Post)
- **Title** (e.g., "Happy Steaksgiving", "Naptime", "Sister love")
- **Photo(s)** or **video** — some posts have multiple photos (photosets)
- **Caption** (optional, often short — e.g., "We'll do the real one Saturday")
- **Date** posted
- **Tags** for categorization (60+ tags: people, time, location, content type)

### Content Volume
- 13+ years of posts (2012-2025)
- Hundreds of posts (the "video" tag alone has ~260)
- Mix of photos, photosets (multi-photo), and videos

### Key Strengths to Preserve
1. Simple chronological browsing — just scroll and see family moments
2. Rich tagging system (people, locations, themes)
3. Archive with year/month drilling
4. Dark theme that makes photos pop
5. Captions and titles give context
6. Video support alongside photos
7. Low friction — posts are short and visual-first

### Limitations Being Fixed
1. Tumblr platform dependency (could shut down, change policies)
2. No privacy controls — family content is fully public
3. No direct upload from iPhone
4. No album/gallery grouping beyond tags
5. Search is limited
6. Social sharing buttons are clutter for a family site
7. Comment model (Tumblr reblogs) is wrong for family use

---

## 2. Decisions Made (from previous conversation)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel (free tier) | Smoother Next.js support, auto-deploy |
| Media storage | Cloudflare R2 | Zero egress fees — critical for a media site |
| Database | Turso (SQLite) | Simple, free tier, FTS5 built-in |
| Frontend | Next.js (App Router) + Tailwind CSS | Modern, SSR, dark theme from start |
| Image optimization | Pre-generated via `sharp`, stored in R2 | Vercel free tier caps at 1,000/month — too low for photo site |
| Post IDs | nanoid (non-sequential random) | Public post pages need non-guessable IDs |
| Post URLs | Slug-based (`/posts/happy-steaksgiving`) | Human-readable, better iMessage previews |
| Feed pagination | Cursor-based infinite scroll | Home: newest-first; month pages: oldest-first |
| Auth (browser) | Session JWT / cookie-based | Simple family access |
| Auth (API) | Bearer token (ADMIN_API_TOKEN) | iOS Shortcut requirement |
| Viewer access | Invite links + shared password fallback | Invite links auto-authorize; password for direct visits |
| Admin settings | Settings page in admin panel | Change password, manage invites, update iMessage numbers — no redeploy needed |
| Comments | None — iMessage instead | Privacy, no moderation, natural conversation |
| Feedback | iMessage pre-fill to both Tom + wife | Group message via `sms:` URI with multiple recipients |
| Tumblr redirects | None — let old URLs 404 | Clean break, no redirect maintenance |
| Admin UX | Responsive web (NOT PWA) | PWA on iOS is unreliable |
| Upload flow | Presigned R2 URLs | Bypass Vercel 4.5MB body limit, direct to R2 |
| Video | Direct R2 serve, no transcoding | No cost/latency for encoding |
| Dark theme | Same concept as Tumblr, refined/sharper | Keep the feel, modernize the execution |
| Multi-photo layout | Grid/mosaic (Tumblr photoset style) | Natural for multi-photo posts |
| Photo click | Full-screen lightbox | Immersive viewing without leaving the page |
| Migration source | Tumblr API | Official, complete, preserves metadata |
| Search | FTS5 (SQLite) | Free, included, performant |
| EXIF (migration) | Use Tumblr timestamps | Tumblr strips EXIF from uploads |
| EXIF (new posts) | iOS extracts, pre-fills date | Native, automatic |
| Project location | `apps/thehoecks/` | Alongside other apps in monorepo |

---

## 3. Tech Stack

### Frontend & Hosting
- **Next.js** (App Router) on **Vercel** free tier
- **Tailwind CSS** for styling
- Dark theme — same concept as current Tumblr site but refined: sharper, more modern, cleaner
- **Photo interaction**: Full-screen lightbox on click (no page navigation needed to view photos)
- **Multi-photo posts**: Grid/mosaic layout (similar to Tumblr photosets)

### Media Storage & Optimization
- **Cloudflare R2** bucket: `thehoecks-media`
- Public access enabled for direct CDN URLs
- Zero egress fees (vs AWS S3 which charges per download)
- Presigned upload URLs for both admin panel and iOS Shortcut
- **Image optimization**: Pre-generate thumbnails/web-optimized versions via `sharp` at upload time, stored alongside originals in R2. Serves pre-built versions directly — does NOT rely on Vercel/Next.js Image optimization (free tier caps at 1,000 optimizations/month, far too low for a photo site)

### Database
- **Turso** (SQLite) with FTS5 full-text search
- Free Starter plan

### Authentication & Access Control
- **Viewer access (two paths)**:
  1. **Invite link**: `thehoecks.com/invite/[token]` — clicking auto-sets a session cookie, no password needed. Admin can label, expire, or revoke links.
  2. **Shared password**: For anyone visiting the site directly without an invite link. Admin-changeable from the settings page (no redeploy).
- **Admin access**: Separate admin password (or same JWT with an admin flag). Gates the admin panel + settings.
- **API/iOS**: Bearer token (`ADMIN_API_TOKEN`) for iOS Shortcut uploads
- All browsing/listing routes protected by default. Individual post pages publicly accessible by URL (for iMessage OG previews) but not discoverable.

---

## 4. Database Schema

```sql
posts
├── id (PK, nanoid — non-sequential random string)
├── slug (string, unique — URL-friendly, auto-generated from title, editable)
├── title (string, optional)
├── body (text, optional — sanitized HTML)
├── date (datetime — from EXIF, Tumblr metadata, or manual override)
├── type (enum: photo | video | mixed | text)
├── created_at (datetime)
├── updated_at (datetime)

media
├── id (PK, nanoid)
├── post_id (FK → posts)
├── r2_key (string, path to original in R2 bucket)
├── thumbnail_r2_key (string, path to optimized/thumbnail version in R2)
├── type (enum: photo | video)
├── width (integer)
├── height (integer)
├── duration (integer, seconds, video only)
├── display_order (integer, multi-photo ordering)
├── mime_type (string)

tags
├── id (PK, nanoid)
├── name (string, unique)
├── created_at (datetime)

post_tags (junction)
├── post_id (FK → posts)
├── tag_id (FK → tags)

people
├── id (PK, nanoid)
├── name (string)
├── created_at (datetime)

post_people (junction)
├── post_id (FK → posts)
├── person_id (FK → people)

albums
├── id (PK, nanoid)
├── title (string)
├── description (string, optional)
├── cover_media_id (FK → media, nullable — defaults to most recent photo in album)
├── created_at (datetime)

post_albums (junction)
├── post_id (FK → posts)
├── album_id (FK → albums)

invite_links
├── id (PK, nanoid)
├── token (string, unique — random, used in URL)
├── label (string, optional — e.g., "Grandma's link", "Uncle Joe")
├── created_at (datetime)
├── expires_at (datetime, nullable — null = never expires)
├── revoked (boolean, default false)

site_settings (key-value store)
├── key (PK, string — e.g., "viewer_password", "imessage_recipients", "site_title")
├── value (text)
├── updated_at (datetime)

posts_fts (FTS5 virtual table)
├── rowid → posts.id
├── title (indexed)
├── body (indexed)
├── tags (indexed)
```

**Key design notes:**
- **IDs**: All primary keys use nanoid (non-sequential random strings). Since post pages are publicly accessible for iMessage OG previews, sequential IDs would make the entire archive guessable/scrapeable.
- **Slugs**: Posts have URL-friendly slugs (`/posts/happy-steaksgiving-2025`) auto-generated from title. Slug is used in URLs; nanoid is the internal PK for foreign keys. Duplicate titles get a suffix (`-2`, `-3`).
- **Thumbnails**: `thumbnail_r2_key` stores pre-generated optimized versions (photos) and poster frames (videos). Generated via `sharp` at upload time, not on-the-fly — avoids Vercel's 1,000/month image optimization cap on free tier.
- **Post type `text`**: Covers imported Tumblr text, quote, link, and answer post types (all fundamentally text with optional metadata). Audio posts skipped unless present.
- **Album covers**: `cover_media_id` points to an existing media item. Default: most recent photo in the album. Admin UI allows override.
- **Invite links**: Each link contains a random token (`/invite/[token]`). Clicking it sets a session cookie — viewer is authorized. Admin can label links (to track who has which), set expiry, or revoke. Optional label helps answer "who did I give access to?"
- **Site settings**: Simple key-value table for admin-configurable values. Avoids redeploying to Vercel just to change a phone number or password. Keys include: `viewer_password`, `imessage_recipients`, `site_title`, `site_description`.
- Month/year tags (e.g., "aug2013") are NOT imported as tags — they become the post `date` field
- All thematic tags (school, perform, travel, etc.) migrate as-is
- FTS5 virtual table created at schema init

---

## 5. Build Phases

### Phase 1 — Foundation & Schema
- Initialize Next.js + Tailwind at `apps/thehoecks/`
- Turso connection + **all schema setup** (all tables, FTS5, indexes)
- Auth: session cookies + Bearer token validation
- All routes protected; admin routes gated separately
- Dark theme skeleton layout (base colors, typography, spacing — applied from the start)

### Phase 2 — Minimal Feed (Validation Surface)
- Seed with 2-3 dummy posts (photo, video, text)
- Basic chronological feed rendering using the dark theme
- Purpose: validation surface for migration testing

### Phase 3 — Migration Script
- Node.js local script (run once on your machine)
- Tumblr API v2 pagination with rate-limit handling
- Handles all Tumblr post types: photo/video → `photo`/`video`/`mixed`; text/quote/link/answer → `text` type
- **HTML sanitization**: Strip unsafe markup from Tumblr captions/bodies on import (DOMPurify or similar)
- All media downloaded and uploaded to R2, with thumbnails pre-generated via `sharp` during migration
- Post dates from Tumblr metadata (not EXIF — Tumblr strips it)
- Month/year tags → post `date` field; thematic tags preserved
- Auto-generate slug from post title (or date-based fallback for untitled posts)
- Output summary for validation (post count by type, media count, skipped items with reasons)
- **Post-migration backup**: Run `turso db dump` immediately after migration to snapshot the baseline

### Phase 4 — Public Site (styled from the start)
- Dark theme: same concept as current Tumblr site, refined to be sharper and more modern
- Polished chronological feed with **cursor-based infinite scroll**
  - **Home feed**: newest-first, cursor = `posted_at` timestamp
  - **Month/year pages**: oldest-first (Oct 1 → Oct 31), cursor walks forward through the range
- **Multi-photo posts**: Grid/mosaic layout (Tumblr photoset style)
- **Photo click**: Full-screen lightbox overlay (swipe/arrow between photos in a post, close to return to feed)
- Year/month timeline navigation
- Tag pages, album pages (with cover images), people pages
- Individual post page with slug-based URLs (`/posts/happy-steaksgiving-2025`)
- Full-text search via FTS5
- iMessage "text us about this" button on post pages
- OpenGraph meta tags for iMessage preview cards
- Lazy loading, responsive images served from R2 (pre-generated thumbnails, not Vercel image optimization)
- Mobile-first responsive design

### Phase 5 — Admin Panel & Settings
- **Content management**:
  - Presigned R2 upload flow (direct browser → R2)
  - Thumbnail generation via `sharp` on upload (stored in R2 alongside original)
  - Multi-file upload form: title, date override, tags, people, album
  - Display order drag-to-reorder for multi-photo posts
  - Video support with poster frame selection (stored as `thumbnail_r2_key`)
  - Album cover selection (defaults to most recent, manually overridable)
  - Edit and delete existing posts
- **Settings page** (admin-only, stored in `site_settings` table):
  - Change viewer shared password
  - Generate, label, and revoke invite links
  - Update iMessage recipient phone numbers
  - Edit site title and description (used in OG tags)
- Responsive web (not PWA)

### Phase 6 — iOS Shortcut
- Shortcut definition + setup guide
- Uses ADMIN_API_TOKEN (stored in iOS Keychain)
- Flow: Select photos → Share → "Post to Family Album" → fill title/tags → uploads directly to R2 → creates post via API
- Supports: single photo, multi-photo, video, mixed
- EXIF date extraction → pre-fills post date

### Phase 7 — Performance & Polish
- Performance optimization with real content (no visual redesign — styling was applied in Phase 4)
- Loading states and perceived performance improvements
- Final cross-browser and mobile testing
- Accessibility pass

### Phase 8 — Go Live
- DNS update: thehoecks.com → Vercel production
- Merge to master → auto-deploy

---

## 6. Tumblr Migration Strategy

### API Approach
- Tumblr v2 API: `/v2/blog/{blog-identifier}/posts`
- OAuth credentials required: Consumer Key + Consumer Secret
- Paginate through all posts with rate-limit backoff

### Data Flow
1. Script paginates all posts via Tumblr API
2. Extracts: title, body/caption, timestamp, media URLs, tags, post type
3. Sanitizes HTML in captions/bodies (DOMPurify or similar — strip unsafe tags, preserve basic formatting)
4. Downloads all media (photos/videos), uploads to R2
5. Generates thumbnails via `sharp` during upload, stores as separate R2 keys
6. Maps Tumblr post types: photo/video → `photo`/`video`/`mixed`; text/quote/link/answer → `text`
7. Month/year tags (aug2013, oct2024) → parsed into post `date` field
8. All other tags → `tags` table
9. Auto-generates slug from post title (untitled posts get date-based slug like `2023-10-15`)
10. Writes records to Turso
11. Outputs summary: post count by type, media count, tags imported, any skipped items with reasons
12. **Immediately after**: run `turso db dump` to create a baseline backup of all imported data

### Key Constraints
- Tumblr strips EXIF data — use API timestamps for post dates
- Videos stored directly in R2 (no transcoding)
- Audio posts: skip unless present in the archive (log if encountered)
- Validation step: review post count, media, dates before going live

---

## 7. iMessage Feedback System

### Button
- Label: "Text us about this"
- Sub-text: "Opens a text message on your phone"
- Color: Green (iMessage system color)
- Placement: Below photo(s) on post page, large and obvious

### Recipients
- Group message to both Tom and wife via `sms:` URI with multiple recipients
- Format: `sms:+1XXXXXXXXXX,+1YYYYYYYYYY&body=...`
- Phone numbers stored in `site_settings` table (key: `imessage_recipients`) — admin can update without redeploying

### Pre-filled Message
```
https://thehoecks.com/posts/[post-slug]

My reaction:
[cursor here]
```

### OpenGraph Tags (for iMessage preview card)
```html
<meta property="og:title" content="[post title]" />
<meta property="og:description" content="Posted [date]" />
<meta property="og:image" content="[first media URL]" />
<meta property="og:url" content="[post URL]" />
<meta property="og:site_name" content="The Hoecks" />
```

### Privacy Note
Post pages must be publicly accessible by URL (for iMessage crawler to generate preview cards), but not indexed/discoverable. All listing/browsing pages remain behind auth. Non-sequential nanoid-based slugs prevent enumeration of the archive.

### Desktop Fallback
"To share your thoughts, text us at [number(s)] and mention the photo title"

---

## 8. iOS Shortcut Workflow

1. User selects photos/videos in Photos app
2. Tap Share → "Post to Family Album"
3. Mini form: title (optional), tags, people
4. Shortcut calls `GET /api/presigned-upload` (Bearer token auth)
5. API returns presigned R2 URL per file
6. Shortcut uploads each file directly to R2
7. Shortcut calls `POST /api/posts` with metadata + media keys
8. Post created; upload continues in background if user switches apps
9. EXIF date extracted from selected media → pre-fills post date

---

## 9. Environment Variables (Vercel Dashboard)

```
# Infrastructure (Vercel env vars — rarely change)
TURSO_DATABASE_URL        = libsql://thehoecks-[username].turso.io
TURSO_AUTH_TOKEN           = [from Turso CLI]

R2_ACCOUNT_ID              = [from Cloudflare dashboard]
R2_ACCESS_KEY_ID           = [from R2 API token]
R2_SECRET_ACCESS_KEY       = [from R2 API token]
R2_BUCKET_NAME             = thehoecks-media
R2_PUBLIC_URL              = https://pub-[hash].r2.dev

JWT_SECRET                 = [random 32+ char string]
ADMIN_API_TOKEN            = [random 32+ char string]
ADMIN_PASSWORD             = [random string — for admin panel access]

NEXT_PUBLIC_SITE_URL       = https://dev.thehoecks.com

# Operational settings (stored in DB site_settings table — admin-changeable)
# viewer_password          → shared family password
# imessage_recipients      → comma-separated phone numbers
# site_title               → "The Hoecks"
# site_description         → for OG meta tags
```

---

## 10. Hosting & Deployment Setup

### Vercel
1. Create Vercel Hobby account (free)
2. Import GitHub repo: `tom-playground`
3. Root Directory: `apps/thehoecks`
4. Framework: Next.js
5. Dev domain: `dev.thehoecks.com` mapped to feature branch
6. Production: `thehoecks.com` mapped to master branch

### Cloudflare R2
1. Create Cloudflare account (free)
2. Create bucket: `thehoecks-media`
3. Enable public access
4. Create R2 API token (read + write)

### Turso
1. Create Turso account (free Starter)
2. `turso db create thehoecks`
3. Get URL + auth token

### DNS
- Dev: CNAME `dev` → `cname.vercel-dns.com`
- Production: Vercel provides A records / CNAME at go-live

### Deployment Pipeline
- Push to branch → Vercel auto-builds → deployed to dev.thehoecks.com
- Merge to master → auto-deployed to thehoecks.com

---

## 11. Estimated Costs

| Component | Service | Cost |
|-----------|---------|------|
| Hosting | Vercel free tier | Free |
| Media storage | Cloudflare R2 | ~$0-2/mo (free up to 10GB, then $0.015/GB) |
| Database | Turso free tier | Free |
| Domain | Already owned | $0 |
| **Total** | | **~$0-2/month** |

50GB of photos would cost ~$0.60/month on R2. Zero egress fees.

---

## 12. Backup Strategy

### Baseline
- Run `turso db dump` immediately after migration completes — this is the known-good snapshot of 15 years of imported data
- Store the dump file locally and/or in R2

### Ongoing
- Periodic `turso db dump` (can be scripted or manual)
- R2 media is durable by design (Cloudflare's infrastructure), but the database linking everything together is the single point of failure
- Consider a simple cron or manual reminder to dump monthly

---

## 13. V2 Features (Post-Launch)

Things that are good ideas but not needed to ship v1. Schema can accommodate these later without breaking changes.

### Category Management
- **Tags**: Display name (e.g., "perform" → "Performances"), description, custom sort order
- **People**: Display name, profile photo (`profile_photo_r2_key`), description, custom sort order
- **Albums**: Already have title/description/cover — add custom sort order

### Admin Enhancements
- Change admin password from settings (v1: env var only)
- Default tags/people quick-pick lists for upload form
- Posts-per-page tuning knob
- Site banner image upload (changeable without redeploy)
- Bulk operations (multi-select posts for tag/album assignment)

### Content Features
- "On this day" — surface posts from the same date in past years
- Favorites / pinned posts
- Download original photo button (for family members)
- Print-friendly view for individual posts or albums

### Search & Discovery
- Search by date range
- Filter by multiple tags/people simultaneously
- "Related posts" suggestions (same tags/people/date)

### Media
- Video thumbnail selection from frame picker (v1: auto poster frame)
- Multiple thumbnail sizes (feed vs. lightbox vs. OG)
- HEIC → JPEG conversion on upload for broader compatibility

### Analytics (lightweight)
- Most-viewed posts (simple counter, no third-party tracking)
- Invite link usage stats (which links are active)

### Infrastructure
- Automated backup schedule (cron → `turso db dump` → R2)
- Staging environment for testing changes

---

## 14. Open Questions / Items to Revisit

1. ~~Who uploads?~~ → Tom primarily, via admin panel + iOS Shortcut
2. ~~Privacy level?~~ → Invite links (auto-authorize) + shared password fallback
3. ~~Domain?~~ → thehoecks.com (same domain)
4. ~~Budget?~~ → ~$0-2/month
5. ~~Tech stack?~~ → Next.js + Vercel + R2 + Turso (decided)
6. ~~Post IDs?~~ → nanoid (non-sequential, non-guessable)
7. ~~Image optimization?~~ → Pre-generated via sharp, stored in R2 (not Vercel)
8. ~~Feed pagination?~~ → Cursor-based infinite scroll; newest-first on home, oldest-first on month pages
9. ~~Non-photo Tumblr posts?~~ → Import as `text` type; skip audio unless present
10. ~~iMessage recipients?~~ → Group message to both Tom + wife; numbers stored in DB, admin-changeable
11. Tumblr blog handle: exact identifier needed for API (e.g., thehoecks.tumblr.com) — **Tom will provide later**
12. ~~Tumblr URL redirects?~~ → No redirects, let old URLs 404. Clean break.
13. ~~Invite system?~~ → Token-based links (`/invite/[token]`), admin can label/expire/revoke, plus shared password fallback
14. ~~Design?~~ → Same dark theme concept but refined/sharper; grid/mosaic for multi-photo; full-screen lightbox on click
15. ~~Admin console?~~ → Yes — settings page in admin panel for password, invites, iMessage numbers, site metadata
