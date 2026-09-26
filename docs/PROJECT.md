# MIDA project reference

Read the section relevant to the current task. Schema and source code determine implemented behavior; this file records product requirements.

## Rendering and data flow

- Prefer Server Components for page-level database reads.
- Add `"use client"` only to components that require state, effects, browser APIs, or event handlers.
- Public pages read from MySQL and may use `src/data/projects.ts` as a fallback. Do not silently remove the fallback without replacing its resilience behavior.
- Project pages are keyed by project `slug`; project-scoped CMS pages are keyed by project UUID.
- Application pages, API routes, and authentication must use Prisma models. Do not add raw SQL strings to runtime code.
- Keep database access through the shared client in `src/lib/prisma.ts`; do not create a new client per request or hot reload.
- Preserve `export const dynamic = "force-dynamic"` on pages whose current MySQL content must render per request.

## Database model

The MySQL database name defaults to `mida_app`. Important tables:

- `users`: admin identity, password hash, role, and active status.
- `projects`: project catalogue, status, tags, price, and project description.
- `projects.latitude` and `projects.longitude`: optional coordinates used by OpenStreetMap markers and Google Maps directions.
- `project_settings`: per-project homepage copy, phone, email, map/virtual-tour URLs, nearby places, and the three Mida Care service descriptions.
- `house_types`: house model name, description, bedrooms, bathrooms, usable area, and starting price.
- `facilities`: project facilities and display order.
- `promotions`: project/global promotions and publication state.
- `news_items`: news/events and publication state.
- `leads`: registrations and follow-up status.
- `site_content`: editable global website copy.
- `media_assets`: file metadata, entity ownership, media kind, and sort order.
- `page_views`: basic analytics records.

When adding a persisted field:

1. Update `prisma/schema.prisma` and regenerate Prisma Client.
2. Apply a safe migration to the active local database when the user expects immediate use.
3. Update create, read, and update API paths.
4. Update both project-specific and global admin forms when both expose the resource.
5. Update the public data query and its TypeScript shape.
6. Verify existing rows with `NULL` values still render safely.

`project_settings` serves both homepage and contact forms. The settings API must update only fields present in the request so saving one menu never clears the other menu's values.

## Authentication and authorization

- Session cookie: `mida_session`.
- Session implementation: signed HS256 JWT in an HTTP-only, SameSite=Lax cookie.
- Session lifetime: 8 hours.
- Roles: `SUPER_ADMIN` (Super Admin), `MARKETING` (Marketing).
- `SUPER_ADMIN` can manage users.
- `MARKETING` can only view/manage assigned projects and their content. Central content, user management and project creation require `SUPER_ADMIN`.
- `UserProject` (`user_projects`) stores many-to-many assignments. User create/update writes assignments atomically; Marketing requires at least one valid project. Existing Marketing accounts with no assignments have no project access until assigned.
- `src/lib/project-access.ts` centralizes project scopes and stored-record ownership checks. CRUD checks both existing ownership and any submitted destination; lead CSV, settings and CMS media listings/uploads/deletes are scoped too. Public project/house image downloads remain public for frontend rendering.
- Sessions reload the account's current role and active status from the database, so changes take effect on the next request. Invalid roles are rejected on user creation and update.
- Protected route handlers must enforce permissions server-side; hiding a menu is not authorization.
- A logged-in admin should not be sent back to the login form.
- Never log passwords, password hashes, session tokens, `AUTH_SECRET`, or database credentials.

Run `pnpm exec tsx --env-file=.env.local scripts/check-project-access.ts` against a local running server to check project authorization. It creates temporary accounts/projects/content and removes those fixtures in `finally`; existing accounts and projects are not modified. `TEST_ORIGIN` can override the localhost URL.

## Uploads and media

Uploaded images and videos are files on the local machine, not remote URLs and not database blobs.

- Physical files live in `UPLOADS_DIRECTORY`.
- The development machine uses `/Users/taradol/งาน/uploads/mida`.
- `media_assets` stores only metadata and a logical `storage_key`.
- `public/uploads/` is ignored and must not become the active upload store again.
- Serve media through `/api/admin/media`; do not expose absolute filesystem paths to the browser.
- Resolve stored names with `path.basename` before joining to the upload directory to prevent path traversal.
- Current accepted types: JPEG, PNG, WEBP, PDF, MP4, and WEBM.
- Current limits: 5 MB per image, 20 MB per PDF brochure, and 50 MB per video.
- Project and house-type public media reads are intentionally available without an admin session; mutations require admin authorization.
- Hero media supports multiple items. Image slides advance automatically; video slides advance only after the video ends.
- Published news and promotions support multiple local gallery images. Their first image is the card cover on the MIDA homepage; all images remain available in the lightbox on the linked project page.
- Cover media is single-value and replacing it must remove the old metadata and file.
- Before deleting or moving stored media, resolve exact targets and keep the filesystem and `media_assets` consistent.

## Admin behavior

- `/admin` is the global dashboard.
- `/admin/project/[id]/[section]` is the project-scoped workspace.
- `/admin/projects` creates new projects only. Existing project catalogue details are edited in the project-scoped `project-info` section.
- Project information and homepage management share one form on the `project-info` page; it contains catalogue fields, cover media, Hero copy/media, and the brochure with one save action. Latitude and longitude are managed only from the contact/map section.
- Project-scoped house types, facilities, promotions, and news use summary tables. Creating and editing records happens in a modal so existing records remain easy to scan.
- News and promotion edit modals can upload, review, and remove multiple JPG, PNG, or WEBP images. The table displays the saved image count.
- Project sidebar sections include dashboard, combined project information/homepage, house types, facilities, promotions, news, contact/map, and leads.
- Edit forms must preload current database values.
- Image inputs upload files from the user's computer; do not replace them with URL-only fields.
- Contact/map settings use `project_settings` and must display a clear success or failure message.
- The contact/map form is full width and intentionally does not show the unused “รายการของโครงการ” card.
- House types support a local cover image and a text description; both must render on the public project page.
- Existing media should remain visible while editing until a replacement is selected.

## Public UI and design rules

- Primary language is Thai; keep labels understandable and preserve supplied English subtitles where the Web Frame uses them.
- Primary font: IBM Plex Sans Thai via `next/font/google`.
- Brand colors are declared in `src/app/globals.css`: MIDA blue, navy, gold, ink, and mist.
- Icons must use Font Awesome `<i>` tags and the stylesheet already loaded in `src/app/layout.tsx`.
- Do not introduce a second icon system without explicit approval.
- Preserve the user-requested wide layout utilities:

  ```css
  width: min(100% - 20rem, 160rem);
  ```

  Changes to this rule must be explicitly requested and checked on smaller screens.

- All new layouts must remain usable on mobile even though the desktop reference is very wide.
- Homepage/project hero media, project gallery, house types, promotions/news, and floating lead CTA are data-driven.
- The homepage uses OpenStreetMap with Leaflet to show MIDA Property as the central marker and every active project marker without an API key. Project pages show one project marker, and direction links open Google Maps.
- Project gallery initially shows two rows (six items on desktop), exposes “ดูเพิ่มเติม”, supports image/video lightbox viewing, and keeps existing hover behavior unless the user asks to change it.
- House types use an overlapping carousel with cover image, description, specifications, and starting price.
- Preserve readable contrast, visible focus states, semantic headings, alt text, and Thai ARIA labels.

## Shared form controls

Import `Input`, `Textarea`, and `Select` from `@/components/ui/form-controls` for all form controls, including file uploads, checkboxes, radio buttons and hidden fields. These components forward native HTML props and React refs, so existing validation, event handlers and FormData work normally. Keep labels associated with their controls.

The default appearance is defined once in `.form-control` in `src/app/globals.css`; use `className` for layout or small overrides. Use `variant="plain"` for custom compact filters or sidebar selectors. Native file, checkbox, radio, hidden, range and color inputs automatically skip the text-field styling.

Banner upload panels use `BannerMediaUpload` from `src/components/banner-media-upload.tsx`. Pass saved media, pending files, file-change and remove callbacks, and the saving state. Saved media and pending previews appear inside one frame; the parent form owns persistence and deletion confirmation. Pending previews release their object URLs when removed or unmounted.

## API routes

- Admin CRUD: `/api/admin/[resource]`.
- Project settings: `/api/admin/project-settings`.
- Media: `/api/admin/media`.
- Authentication: `/api/auth/login` and `/api/auth/logout`.
- Public project filtering: `/api/projects`.
- Public lead registration: `/api/leads`.

Use appropriate status codes and JSON `{ message }` errors. Do not expose raw database errors or stack traces. For upload/list/delete operations, verify entity type, UUID, media kind, MIME type, size, authorization, and entity existence.
