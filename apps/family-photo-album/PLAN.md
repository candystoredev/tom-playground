# Family Photo Album - Project Plan

## Status: Planning Phase

---

## 1. Current Site Review (thehoecks.com)

### What It Is
A Tumblr-hosted family photo blog running since ~2012, using a custom dark theme. It serves as a chronological family photo album spanning 13+ years of content.

### Design & Layout
- **Color scheme**: Dark background (#1d1c1c) with light gray text (#d3d3d3) and blue accents (#427ea3)
- **Typography**: "Calluna Sans" font, centered text, 1.5rem body size
- **Layout**: Single-column feed, narrow width (~900px desktop), centered
- **Header**: Custom banner image with dark overlay and site title
- **Scrolling**: Infinite/endless scroll for browsing posts

### Content Structure (Per Post)
- **Title** (e.g., "Happy Steaksgiving", "Naptime", "Sister love")
- **Photo(s)** or **video** — some posts have multiple photos (photosets)
- **Caption** (optional, often short — e.g., "We'll do the real one Saturday")
- **Date** posted
- **Tags** for categorization
- **Social sharing buttons** (Facebook, Twitter, Reddit, email, embed)

### Organization & Navigation
- **Chronological feed**: Most recent posts first, infinite scroll
- **Archive page**: Filterable by month and post type
- **Tag system** with 60+ tags, including:
  - **People**: Rosie, Juno, family members
  - **Time-based**: Monthly tags (jan2023, dec2024, etc.) and yearly tags (2012-2025)
  - **Content type**: "video" (~260 posts), school photos
  - **Locations**: Boston, Notre Dame, Barcelona, France
- **Hamburger menu** on mobile for navigation
- **Sidebar/menu** with yearly + monthly archive links (2012-2025)

### Content Volume
- 13+ years of posts (2012-2025)
- Hundreds of posts (the "video" tag alone has ~260)
- Mix of photos, photosets (multiple photos), and videos

### Responsive Behavior
- Desktop: 900px main content width, 700px photosets
- Tablet: 540px photosets
- Mobile: Hamburger menu, scaled typography

### Key Strengths to Preserve
1. Simple, chronological browsing — just scroll and see family moments
2. Rich tagging system for finding specific content
3. Archive with year/month drilling
4. Dark theme that makes photos pop
5. Captions and titles give context to each moment
6. Video support alongside photos
7. Low friction — posts are short and visual-first

### Limitations / Opportunities for Improvement
1. Dependent on Tumblr platform (could shut down, change policies, etc.)
2. Single-column only — no grid/masonry layout option
3. No private/password-protected access (family content is public)
4. No built-in photo management (relies on Tumblr's hosting)
5. Social sharing buttons (Facebook, Twitter) aren't really needed for a family site
6. No album/gallery grouping beyond tags
7. Search could be improved
8. No way to download originals easily
9. Comment/interaction model is Tumblr's reblog system, not ideal for family

---

## 2. Requirements (To Be Discussed)

### Must Have
- [ ] Photo and video display
- [ ] Chronological browsing
- [ ] Tagging / categorization system
- [ ] Archive / timeline navigation
- [ ] Mobile responsive
- [ ] Migration of existing content from Tumblr

### Should Have
- [ ] Privacy / access control (password, invite-only, etc.)
- [ ] Photo upload interface
- [ ] Multiple photos per post (photosets/galleries)
- [ ] Search functionality
- [ ] Dark theme (preserve current aesthetic)

### Could Have
- [ ] Album/gallery grouping (beyond just tags)
- [ ] Full-resolution download
- [ ] Comments / reactions from family members
- [ ] Email notifications for new posts
- [ ] Slideshow / lightbox viewing

### Won't Have (initially)
- Social sharing buttons
- Tumblr reblog functionality

---

## 3. Technical Architecture (To Be Decided)

_Pending discussion on:_
- Frontend framework
- Backend / API approach
- Database
- Photo storage & CDN
- Hosting / deployment
- Authentication approach

---

## 4. Migration Strategy (To Be Decided)

_Need to plan how to export and import 13+ years of Tumblr content._

---

## 5. Open Questions

1. Who will be uploading new photos? Just you, or multiple family members?
2. What level of privacy is needed? Public, password-protected, invite-only?
3. Is the domain (thehoecks.com) staying the same?
4. What's the budget for hosting/storage?
5. Should existing Tumblr URLs redirect to the new site?
6. Any preference on tech stack?
7. How important is preserving the exact look vs. modernizing the design?

---

## 6. Previous Conversation Notes

_Tom mentioned having a previous conversation about this project saved as a PDF. Contents to be incorporated once the PDF is shared._
