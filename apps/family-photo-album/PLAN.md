# Family Photo Album - Project Plan

## Status: Planning Phase (Iterating — Review 4)

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
| Thumbnail generation | Server-side `sharp` after R2 upload | Future-proof — supports multiple sizes, format conversion, smart cropping later |
| R2 key convention | `media/{media_id}/original.{ext}` | Clean per-asset directories, extensible for future variants |
| People migration | Pre-defined people list in migration config | Deterministic — Tom provides names, script maps matching tags |
| Crawler blocking | `robots.txt` + `noindex` meta tags | Enforces privacy for post pages that must be publicly accessible for OG previews |
| Password storage | Hashed (bcrypt) in `site_settings` | Never store plaintext passwords |

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

#### R2 Key Convention
All media organized by media ID with separate files per variant:
```
media/{media_id}/original.{ext}     — full-size original
media/{media_id}/thumb.{ext}        — optimized thumbnail for feed
```
This structure supports future variants (multiple sizes, AVIF, etc.) by adding files to the same directory without schema changes.

#### Thumbnail Generation Flow
**Migration** (Phase 3): `sharp` runs locally on your machine — downloads Tumblr media, generates thumbnails, uploads both to R2. No server constraints.

**Admin panel & iOS Shortcut uploads** (Phases 5-6):
1. Client requests presigned upload URL(s) from API
2. Client uploads original directly to R2 via presigned URL (bypasses Vercel 4.5MB body limit)
3. Client calls `POST /api/posts` with metadata + R2 keys
4. API route fetches the original from R2, generates thumbnail via `sharp`, uploads thumbnail to R2
5. API saves post record with both R2 keys

Step 4 works because: R2 → Vercel fetch is fast (Cloudflare network), `sharp` resizes a typical iPhone photo (3-8MB) in under a second, and uploading a ~100KB thumbnail back to R2 is near-instant. Total well within Vercel's 10-second function timeout. For unusually large files, the API can stream the download rather than buffering the full file.

**Video poster frames**: For migration, use `ffmpeg` locally to extract the first frame. For admin uploads, capture a frame client-side via `<video>` element + canvas API — the browser already has the file loaded. This avoids needing ffmpeg on the server. v2 adds a frame picker for choosing a specific frame.

### Database
- **Turso** (SQLite) with FTS5 full-text search
- Free Starter plan

### Authentication & Access Control
- **Viewer access (two paths)**:
  1. **Invite link**: `thehoecks.com/invite/[token]` — clicking auto-sets a session cookie, no password needed. Admin can label, expire, or revoke links.
  2. **Shared password**: For anyone visiting the site directly without an invite link. Admin-changeable from the settings page (no redeploy). **Stored hashed** (bcrypt) in `site_settings` — never plaintext.
- **Admin access**: Separate admin password (or same JWT with an admin flag). Gates the admin panel + settings.
- **API/iOS**: Bearer token (`ADMIN_API_TOKEN`) for iOS Shortcut uploads
- All browsing/listing routes protected by default. Individual post pages publicly accessible by URL (for iMessage OG previews) but not discoverable — blocked by `robots.txt` and `noindex` meta tags (see Privacy section).

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
├── photoset_layout (string, optional — e.g., "212" = 2-1-2 grid rows, from Tumblr photosets)
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
├── file_size (integer, bytes — for storage tracking and upload validation)
├── duration (integer, seconds, video only)
├── display_order (integer, multi-photo ordering)
├── mime_type (string)

tags
├── id (PK, nanoid)
├── name (string, unique)
├── slug (string, unique — URL-friendly, auto-generated from name)
├── created_at (datetime)

post_tags (junction)
├── post_id (FK → posts)
├── tag_id (FK → tags)

people
├── id (PK, nanoid)
├── name (string)
├── slug (string, unique — URL-friendly, auto-generated from name)
├── created_at (datetime)

post_people (junction)
├── post_id (FK → posts)
├── person_id (FK → people)

albums
├── id (PK, nanoid)
├── title (string)
├── slug (string, unique — URL-friendly, auto-generated from title)
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
├── key (PK, string — e.g., "viewer_password_hash", "imessage_recipients", "site_title")
├── value (text)
├── updated_at (datetime)

posts_fts (FTS5 virtual table — external content mode)
├── Backed by posts table via SQLite's implicit integer rowid
├── title (indexed)
├── body (indexed)
├── tags (indexed — denormalized comma-separated tag names for search)
```

**Key design notes:**
- **IDs**: All primary keys use nanoid (non-sequential random strings). Since post pages are publicly accessible for iMessage OG previews, sequential IDs would make the entire archive guessable/scrapeable.
- **Slugs**: Posts, tags, people, and albums all have URL-friendly slugs auto-generated from their name/title. Posts use slugs in URLs (`/posts/happy-steaksgiving-2025`); nanoid is the internal PK for foreign keys. Duplicate titles get a suffix (`-2`, `-3`). This same suffix strategy applies to date-based fallback slugs for untitled posts (e.g., `2023-10-15`, `2023-10-15-2`).
- **Thumbnails**: `thumbnail_r2_key` stores pre-generated optimized versions (photos) and poster frames (videos). Generated via `sharp` server-side after upload — avoids Vercel's 1,000/month image optimization cap on free tier.
- **File size**: `file_size` on media tracks bytes for storage monitoring in admin and upload validation. Easy to populate at upload time, annoying to backfill later.
- **Photoset layout**: `photoset_layout` preserves Tumblr's grid layout string (e.g., `"212"` = 2 photos row 1, 1 photo row 2, 2 photos row 3). Imported during migration; new posts can set it or let the frontend auto-calculate a layout from photo count and aspect ratios.
- **Post type `text`**: Covers imported Tumblr text, quote, link, and answer post types (all fundamentally text with optional metadata). Audio posts skipped unless present.
- **Album covers**: `cover_media_id` points to an existing media item. Default: most recent photo in the album. Admin UI allows override.
- **Invite links**: Each link contains a random token (`/invite/[token]`). Clicking it sets a session cookie — viewer is authorized. Admin can label links (to track who has which), set expiry, or revoke. Optional label helps answer "who did I give access to?"
- **Site settings**: Simple key-value table for admin-configurable values. Avoids redeploying to Vercel just to change a phone number or password. Keys include: `viewer_password_hash` (bcrypt hash, never plaintext), `imessage_recipients`, `site_title`, `site_description`.
- **FTS5 implementation**: Uses external content mode (`content=posts, content_rowid=rowid`) backed by SQLite's implicit integer rowid — not the nanoid text PK. Requires triggers on `posts` INSERT/UPDATE/DELETE to keep the FTS index in sync. Tags are denormalized into the FTS table as a comma-separated string for search. This is the standard SQLite approach for FTS5 with non-integer PKs.
- **Password hashing**: `viewer_password_hash` stores a bcrypt hash. The app hashes on password set/change and compares hashes on login. Plaintext passwords never touch the database.
- Month/year tags (e.g., "aug2013") are NOT imported as tags — they become the post `date` field
- All thematic tags (school, perform, travel, etc.) migrate as-is
- FTS5 virtual table + sync triggers created at schema init

---

## 5. Build Phases

### Testing approach
Each phase ends with a **Verify** checklist — the phase isn't done until every item passes. Automated tests are reserved for logic that's tricky to validate visually (pagination cursors, slug dedup, auth middleware). Everything else is verified manually against the real deployment.

**Automated tests** (written as they come up, not batched):
- Slug generation (duplicates, untitled fallbacks, suffix logic)
- Cursor-based pagination (ordering, tiebreakers, no skips/dupes)
- Auth middleware (viewer can't reach admin, expired invite rejected, valid invite sets cookie)
- FTS5 search (insert posts, verify results match)

**Everything else**: manual verification against dev.thehoecks.com on both desktop and phone.

---

### Phase 1 — Foundation & Schema
- Initialize Next.js + Tailwind at `apps/thehoecks/`
- Turso connection + **all schema setup** (all tables, FTS5, indexes, FTS sync triggers)
- **Seed `site_settings`** with initial defaults: `viewer_password_hash` (set from env or prompted), `site_title` ("The Hoecks"), `site_description`, `imessage_recipients` (empty — admin fills in later)
- Auth (scoped for v1): shared password login page + session cookie middleware + admin bearer token validation. Invite link flow comes in Phase 5d.
- All routes protected; admin routes gated separately
- Dark theme skeleton layout (base colors, typography, spacing — applied from the start)
- **`robots.txt`**: Block all crawlers from the entire site
- **Deploy to dev.thehoecks.com** — all subsequent phases are tested against real infrastructure, not just localhost

**Verify**: `npm run dev` starts without errors. Turso connects and tables exist. Login page renders. Logging in with the seeded password shows the skeleton layout. Logging out blocks access. Hitting an admin route without admin auth returns 403. Deploy to Vercel succeeds.

### Phase 2 — First Vertical Slice
- Upload 2-3 test media files to R2 manually (one photo, one video, one multi-photo set)
- Seed corresponding posts in the DB with proper R2 key references
- Render a basic chronological feed behind auth using the dark theme
- Purpose: prove the full stack works end-to-end (Turso → API → R2 media → browser)
- **Dummy data cleanup**: These seed posts are deleted before migration runs in Phase 3

**Verify**: Log in → see posts with actual photos/videos loading from R2 → dark theme renders correctly. Check on phone too. Confirm media URLs resolve and thumbnails display.

**Test**: Unit tests for slug generation (duplicate titles, untitled fallbacks, date-based slugs, suffix incrementing). This is the trickiest pure logic and benefits most from automated coverage.

### Phase 3 — Migration Script
- Node.js local script (run once on your machine)
- Tumblr API v2 pagination with rate-limit handling
- Handles all Tumblr post types: photo/video → `photo`/`video`/`mixed`; text/quote/link/answer → `text` type
- **HTML sanitization**: Strip unsafe markup from Tumblr captions/bodies on import (DOMPurify or similar)
- All media downloaded and uploaded to R2 using key convention (`media/{media_id}/original.{ext}`, `media/{media_id}/thumb.{ext}`), with thumbnails pre-generated via `sharp` during migration. Video poster frames extracted via `ffmpeg` locally.
- **People mapping**: Migration config file contains a pre-defined list of people names (Tom provides). Script matches Tumblr tags against this list — matches go to `people` table + `post_people`, everything else goes to `tags` table + `post_tags`.
- Post dates from Tumblr metadata (not EXIF — Tumblr strips it)
- Month/year tags → post `date` field; thematic tags preserved
- Auto-generate slug from post title (or date-based fallback for untitled posts). Duplicate slugs — whether from duplicate titles or multiple untitled posts on the same date — get suffixed (`-2`, `-3`, etc.)
- Preserve Tumblr `photoset_layout` strings for multi-photo posts
- Record `file_size` for each media item during download
- Output summary for validation (post count by type, media count, people imported, tags imported, skipped items with reasons)
- **Post-migration backup**: Run `turso db dump` immediately after migration to snapshot the baseline

**Staged testing** — run against real Tumblr API in three passes:
1. **10 posts**: Verify data flow end-to-end — check DB records, R2 media, thumbnails, tags, people mapping. View in browser on dev.thehoecks.com.
2. **100 posts**: Spot-check variety — multi-photo posts render grids, videos play, date parsing is correct, slug dedup works across real titles.
3. **Full migration**: Run all posts. Compare output summary against expected totals. Browse feed to sanity check.

**Verify**: Post count matches Tumblr. Media count matches (originals + thumbnails). No orphaned media (R2 keys without DB records) or orphaned records (DB entries without R2 media). People and tags correctly split. Feed renders all content on dev.thehoecks.com.

### Phase 4 — Public Site

Dark theme: same concept as current Tumblr site, refined to be sharper and more modern. Mobile-first responsive design throughout. Each sub-slice is deployed and verified before moving to the next.

#### 4a. Feed + Infinite Scroll
- Polished chronological feed with **cursor-based pagination** (date + id tiebreaker)
- **Home feed**: newest-first
- Lazy loading images using pre-generated thumbnails from R2

**Verify**: Scroll loads next page seamlessly. No duplicated posts. No skipped posts. Works on phone.

**Test**: Automated integration test for cursor pagination — seed 50+ posts (including same-timestamp posts), verify pages return correct order with no gaps or duplicates.

#### 4b. Post Page + OG Tags + iMessage
- Individual post page at `/posts/{slug}`
- OpenGraph meta tags for iMessage preview cards (title, image, date, URL)
- iMessage "text us about this" button (green, prominent)
- Desktop fallback text for non-mobile browsers

**Verify**: Paste a post URL in iMessage → preview card renders with photo and title. Tap iMessage button on phone → opens pre-filled text to correct recipients.

**Test**: `curl` the post page → verify OG tags present in HTML response.

#### 4c. Multi-Photo Grid + Lightbox
- Grid/mosaic layout using `photoset_layout` when available, auto-calculated layout otherwise
- Full-screen lightbox overlay on photo click
- Swipe/arrow navigation between photos in a post
- Close lightbox to return to feed

**Verify**: On phone — tap photo, swipe through set, close lightbox. Grid layouts match Tumblr's layout for migrated multi-photo posts. Lightbox works with keyboard arrows on desktop.

#### 4d. Tag, People, Album Pages
- `/tags/{slug}`, `/people/{slug}`, `/albums/{slug}`
- Filtered feeds with same cursor pagination as home feed
- Album pages with cover images

**Verify**: Click a tag → see only posts with that tag. People page shows correct people. Album cover displays. Pagination works within filtered views.

#### 4e. Timeline + Month Pages
- Year/month timeline navigation (sidebar or header)
- **Month pages**: oldest-first (Oct 1 → Oct 31), cursor walks forward through the range

**Verify**: Navigate to a specific month → posts in chronological (oldest-first) order. Pagination walks forward correctly. Timeline reflects actual months with content (no empty months shown).

#### 4f. Search
- FTS5 full-text search across titles, bodies, and tags
- Search results page with highlighted matches

**Verify**: Search "birthday" → finds birthday posts. Search a person's name → finds their posts. Empty search doesn't crash.

**Test**: Automated FTS5 integration test — insert posts with known content, verify search returns correct results and ranking.

#### 4g. Crawler Blocking + Privacy Hardening
- `<meta name="robots" content="noindex, nofollow">` on individual post pages
- `X-Robots-Tag: noindex` response header
- Verify `robots.txt` from Phase 1 is working

**Verify**: `curl -H "User-Agent: Googlebot" [post-url]` → response contains `noindex` meta tag and `X-Robots-Tag` header. OG tags still work (iMessage preview still renders — iMessage ignores robots directives by design).

### Phase 5 — Admin Panel & Settings

Each sub-slice builds on the previous. Responsive web throughout (not PWA).

#### 5a. Single Photo Upload (the critical pipeline)
- Presigned URL flow: browser → R2 (using key convention `media/{media_id}/original.{ext}`)
- **Thumbnail generation**: API fetches original from R2 → `sharp` resizes → uploads thumbnail to R2 as `media/{media_id}/thumb.{ext}`
- Post created in DB with both R2 keys
- Photo appears in feed

**Verify**: Upload a single photo → it appears in the feed with a proper thumbnail. Check R2 bucket — both `original.jpg` and `thumb.jpg` exist at correct paths. This proves the entire upload pipeline end-to-end.

#### 5b. Full Upload Form
- Multi-file upload with title, date override, tags, people, album assignment
- Display order drag-to-reorder for multi-photo posts
- Video support with client-side poster frame capture (`<video>` + canvas → uploaded as thumbnail)
- Album cover selection (defaults to most recent, manually overridable)

**Verify**: Upload a 4-photo post with tags and people → renders in feed with correct grid layout, tags link to tag pages, people link to people pages. Upload a video → poster frame thumbnail displays in feed, video plays on post page. Drag-reorder changes display order.

#### 5c. Edit + Delete
- Edit post metadata: title, date, tags, people, album
- Add/remove media from existing posts
- Delete posts (with R2 cleanup — remove media files)

**Verify**: Edit a post's title → change appears in feed and post page. Add a photo to an existing post → grid updates. Delete a post → gone from feed, media removed from R2 (check bucket).

#### 5d. Settings Page
- Change viewer shared password (bcrypt hashed before storing)
- Generate, label, and revoke invite links
- Update iMessage recipient phone numbers
- Edit site title and description (used in OG tags)

**Verify**: Change password → old password fails login, new password works. Create a labeled invite link → open in incognito → auto-authorized without password. Revoke the link → same URL now rejected. Update iMessage numbers → post page button uses new numbers.

**Test**: Automated auth middleware tests — viewer JWT can't access admin routes, expired/revoked invite tokens are rejected, valid invite token sets session cookie correctly.

### Phase 6 — iOS Shortcut
- Shortcut definition + setup guide
- Uses ADMIN_API_TOKEN (stored in iOS Keychain)
- Flow: Select photos → Share → "Post to Family Album" → fill title/tags → uploads directly to R2 via presigned URL → calls `POST /api/posts` → server generates thumbnail via `sharp` (same flow as admin panel)
- Supports: single photo, multi-photo, video, mixed
- EXIF date extraction → pre-fills post date
- For video: iOS Shortcut can resize a frame as a thumbnail, or server handles it

**Verify**: On iPhone — select 3 photos → share → shortcut → fill in title and tags → post appears on dev.thehoecks.com with correct thumbnails, tags, and EXIF-derived date.

### Phase 7 — Performance & Polish
- Performance optimization with real content (no visual redesign — styling was applied in Phase 4)
- Loading states and perceived performance improvements
- Final cross-browser and mobile testing (Safari, Chrome, Firefox — desktop and phone)
- Accessibility pass (keyboard navigation, screen reader basics, color contrast)

**Verify**: Lighthouse score for performance. Feed loads quickly on throttled mobile connection. All interactive elements keyboard-accessible. No layout shifts on scroll.

### Phase 8 — Go Live
- Final review of all content on dev.thehoecks.com
- DNS update: thehoecks.com → Vercel production
- Merge to master → auto-deploy
- Verify production site works end-to-end (login → feed → post → iMessage → search)
- Share invite links with family

---

## 6. Tumblr Migration Strategy

### API Approach
- Tumblr v2 API: `/v2/blog/{blog-identifier}/posts`
- OAuth credentials required: Consumer Key + Consumer Secret
- Paginate through all posts with rate-limit backoff

### Migration Config
Before running the script, create a config file with:
- **People list**: Array of names that should be mapped to the `people` table (e.g., `["Sophie", "Emma", "Grandma"]`). Any Tumblr tag matching a name in this list becomes a `people` entry; all other tags become `tags` entries.
- Tumblr blog identifier
- R2 credentials
- Turso connection info

### Data Flow
1. Script paginates all posts via Tumblr API
2. Extracts: title, body/caption, timestamp, media URLs, tags, post type, `photoset_layout`
3. Sanitizes HTML in captions/bodies (DOMPurify or similar — strip unsafe tags, preserve basic formatting)
4. Downloads all media (photos/videos), records `file_size` in bytes
5. Uploads originals to R2 as `media/{media_id}/original.{ext}`
6. Generates photo thumbnails via `sharp`, video poster frames via `ffmpeg`; uploads as `media/{media_id}/thumb.{ext}`
7. Maps Tumblr post types: photo/video → `photo`/`video`/`mixed`; text/quote/link/answer → `text`
8. Month/year tags (aug2013, oct2024) → parsed into post `date` field
9. Tags matching the people list → `people` table + `post_people` junction
10. All other tags → `tags` table + `post_tags` junction (with auto-generated slugs)
11. Auto-generates slug from post title; untitled posts get date-based slug (`2023-10-15`). Duplicates get suffix (`-2`, `-3`)
12. Writes records to Turso (including FTS5 sync via triggers)
13. Outputs summary: post count by type, media count, people imported, tags imported, any skipped items with reasons
14. **Immediately after**: run `turso db dump` to create a baseline backup of all imported data

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

### Privacy & Crawler Blocking
Post pages must be publicly accessible by URL (for iMessage crawler to generate preview cards), but not indexed/discoverable by search engines. Three layers of protection:
1. **`robots.txt`** (Phase 1): Blocks well-behaved crawlers from the entire site
2. **`<meta name="robots" content="noindex, nofollow">`**: On individual post pages — tells search engines not to index even if they find the page
3. **`X-Robots-Tag: noindex`** response header: Belt-and-suspenders for crawlers that don't parse HTML meta tags

iMessage and social media crawlers (iMessage, Facebook, Twitter) intentionally ignore `robots.txt` to generate link previews — this is the desired behavior. Search engines (Google, Bing) respect `robots.txt` and `noindex` — they won't index the content.

All listing/browsing pages remain behind auth. Non-sequential nanoid-based slugs prevent enumeration of the archive.

### Desktop Fallback
"To share your thoughts, text us at [number(s)] and mention the photo title"

---

## 8. iOS Shortcut Workflow

1. User selects photos/videos in Photos app
2. Tap Share → "Post to Family Album"
3. Mini form: title (optional), tags, people
4. Shortcut calls `GET /api/presigned-upload` (Bearer token auth)
5. API returns presigned R2 URL per file (using key convention `media/{media_id}/original.{ext}`)
6. Shortcut uploads each file directly to R2
7. Shortcut calls `POST /api/posts` with metadata + media keys
8. Server generates thumbnails via `sharp` (photos) or accepts client-provided poster frame (videos)
9. Post created; upload continues in background if user switches apps
10. EXIF date extracted from selected media → pre-fills post date

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
# viewer_password_hash     → bcrypt hash of shared family password
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
- Multiple thumbnail sizes (feed vs. lightbox vs. OG) — R2 key convention already supports this (`media/{id}/thumb_lg.{ext}`, etc.)
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
16. ~~Thumbnail flow?~~ → Server-side `sharp` after R2 upload; video poster frames via client-side canvas (migration uses ffmpeg locally)
17. ~~People vs. tags?~~ → Pre-defined people list in migration config; script maps matching Tumblr tags to `people` table
18. ~~Crawler blocking?~~ → `robots.txt` + `noindex` meta + `X-Robots-Tag` header
19. ~~Password storage?~~ → bcrypt hashed in `site_settings`, never plaintext
