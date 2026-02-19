# Family Photo Album - Project Plan

## Status: Planning Phase (Iterating)

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
| Frontend | Next.js (App Router) + Tailwind CSS | Modern, SSR, image optimization |
| Auth (browser) | Session JWT / cookie-based | Simple family access |
| Auth (API) | Bearer token (ADMIN_API_TOKEN) | iOS Shortcut requirement |
| User accounts | Single shared password | "One password, everyone's in" — no individual accounts |
| Comments | None — iMessage instead | Privacy, no moderation, natural conversation |
| Feedback | iMessage pre-fill button | Zero infrastructure, "text us about this" |
| Admin UX | Responsive web (NOT PWA) | PWA on iOS is unreliable |
| Upload flow | Presigned R2 URLs | Bypass Vercel 4.5MB body limit, direct to R2 |
| Video | Direct R2 serve, no transcoding | No cost/latency for encoding |
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
- Dark theme matching current aesthetic

### Media Storage
- **Cloudflare R2** bucket: `thehoecks-media`
- Public access enabled for direct CDN URLs
- Zero egress fees (vs AWS S3 which charges per download)
- Presigned upload URLs for both admin panel and iOS Shortcut

### Database
- **Turso** (SQLite) with FTS5 full-text search
- Free Starter plan

### Authentication
- **Browser**: Session cookies (JWT-based)
- **API/iOS**: Bearer token (`ADMIN_API_TOKEN`)
- All routes protected by default
- Single shared family password for viewer access

---

## 4. Database Schema

```sql
posts
├── id (PK)
├── title (string, optional)
├── body (string, optional)
├── date (datetime — from EXIF, Tumblr metadata, or manual override)
├── type (enum: photo | video | mixed)
├── created_at (datetime)
├── updated_at (datetime)

media
├── id (PK)
├── post_id (FK → posts)
├── r2_key (string, path in R2 bucket)
├── type (enum: photo | video)
├── width (integer)
├── height (integer)
├── duration (integer, seconds, video only)
├── display_order (integer, multi-photo ordering)
├── mime_type (string)

tags
├── id (PK)
├── name (string, unique)
├── created_at (datetime)

post_tags (junction)
├── post_id (FK → posts)
├── tag_id (FK → tags)

people
├── id (PK)
├── name (string)
├── created_at (datetime)

post_people (junction)
├── post_id (FK → posts)
├── person_id (FK → people)

albums
├── id (PK)
├── title (string)
├── description (string, optional)
├── created_at (datetime)

post_albums (junction)
├── post_id (FK → posts)
├── album_id (FK → albums)

posts_fts (FTS5 virtual table)
├── rowid → posts.id
├── title (indexed)
├── body (indexed)
├── tags (indexed)
```

**Key design notes:**
- Month/year tags (e.g., "aug2013") are NOT imported as tags — they become the post `date` field
- All thematic tags (school, perform, travel, etc.) migrate as-is
- FTS5 virtual table created at schema init

---

## 5. Build Phases

### Phase 1 — Foundation
- Initialize Next.js + Tailwind at `apps/thehoecks/`
- Turso connection, schema setup, migrations
- Auth: session cookies + Bearer token validation
- All routes protected; admin routes gated separately
- Dark theme skeleton layout

### Phase 2 — Data Model + Minimal Feed
- Schema initialization (all tables + FTS5)
- Seed with 2-3 dummy posts
- Basic chronological feed rendering (unstyled)
- Purpose: validation surface for migration testing

### Phase 3 — Migration Script
- Node.js local script (run once on your machine)
- Tumblr API v2 pagination with rate-limit handling
- All media downloaded directly to R2
- Post dates from Tumblr metadata (not EXIF — Tumblr strips it)
- Month/year tags → post `date` field; thematic tags preserved
- Output summary for validation before cutover

### Phase 4 — Public Site
- Polished chronological feed
- Year/month timeline navigation
- Tag pages, album pages, people pages
- Individual post page (photo + video)
- Full-text search via FTS5
- iMessage "text us about this" button on post pages
- OpenGraph meta tags for iMessage preview cards

### Phase 5 — Admin Panel
- Presigned R2 upload flow (direct browser → R2)
- Multi-file upload form: title, date override, tags, people, album
- Display order drag-to-reorder for multi-photo posts
- Video support with poster frame selection
- Edit and delete existing posts
- Responsive web (not PWA)

### Phase 6 — iOS Shortcut
- Shortcut definition + setup guide
- Uses ADMIN_API_TOKEN (stored in iOS Keychain)
- Flow: Select photos → Share → "Post to Family Album" → fill title/tags → uploads directly to R2 → creates post via API
- Supports: single photo, multi-photo, video, mixed
- EXIF date extraction → pre-fills post date

### Phase 7 — Design & Polish
- Full dark theme, mobile-first
- Lazy loading, responsive images (Next.js Image)
- Performance optimization with real content

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
2. Extracts: title, body/caption, timestamp, media URLs, tags
3. Downloads all media (photos/videos) directly to R2
4. Month/year tags (aug2013, oct2024) → parsed into post `date` field
5. All other tags → `tags` table
6. Writes records to Turso
7. Outputs summary for validation before cutover

### Key Constraints
- Tumblr strips EXIF data — use API timestamps for post dates
- Videos stored directly in R2 (no transcoding)
- Validation step: review post count, media, dates before going live

---

## 7. iMessage Feedback System

### Button
- Label: "Text us about this"
- Sub-text: "Opens a text message on your phone"
- Color: Green (iMessage system color)
- Placement: Below photo(s) on post page, large and obvious

### Pre-filled Message
```
https://thehoecks.com/posts/[post-id]

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
Post pages must be publicly accessible by URL (for iMessage crawler to generate preview cards), but not indexed/discoverable. All listing/browsing pages remain behind auth.

### Desktop Fallback
"To share your thoughts, text us at [number] and mention the photo title"

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
TURSO_DATABASE_URL        = libsql://thehoecks-[username].turso.io
TURSO_AUTH_TOKEN           = [from Turso CLI]

R2_ACCOUNT_ID              = [from Cloudflare dashboard]
R2_ACCESS_KEY_ID           = [from R2 API token]
R2_SECRET_ACCESS_KEY       = [from R2 API token]
R2_BUCKET_NAME             = thehoecks-media
R2_PUBLIC_URL              = https://pub-[hash].r2.dev

JWT_SECRET                 = [random 32+ char string]
ADMIN_API_TOKEN            = [random 32+ char string]

NEXT_PUBLIC_SITE_URL       = https://dev.thehoecks.com
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

## 12. Open Questions / Items to Revisit

1. ~~Who uploads?~~ → Tom primarily, via admin panel + iOS Shortcut
2. ~~Privacy level?~~ → Protected. Single shared family password for viewers.
3. ~~Domain?~~ → thehoecks.com (same domain)
4. ~~Budget?~~ → ~$0-2/month
5. ~~Tech stack?~~ → Next.js + Vercel + R2 + Turso (decided)
6. iMessage recipient: single phone number or shared address? (TBD)
7. Tumblr blog handle: exact identifier needed for API (e.g., thehoecks.tumblr.com)
8. Should existing Tumblr URLs redirect to new site?
9. Invite system details: link format, expiry?
10. Any changes to the plan after this review?
