# Homepage redesign QA

- Source visual truth path: `C:\Users\ms\.codex\generated_images\01a06c7c-94a7-7971-a116-6c9b3ed63e2a\exec-f7de8a3a-06d6-4eca-b517-7922d03d6fd9.png`
- Implementation: `http://127.0.0.1:5173/`
- Implementation screenshot path: Codex in-app Browser inline capture for the local URL (desktop, tablet, and mobile captures are attached to the task run; the browser API did not expose a filesystem save path).
- Source pixels: 1487 × 1058.
- Implementation desktop viewport and capture: 1440 × 1024 CSS px at 1× density.
- Additional responsive captures: 768 × 1024 and 390 × 844 CSS px at 1× density.
- State: logged out; latest reviews loaded from the local Django backend; guestbook loaded successfully with an empty result; school-service disclosure collapsed by default.

## Full-view comparison evidence

The selected source and the browser-rendered implementation were reviewed together in the task context at the desktop target size. Both use the selected 2:1 review/guestbook grid, place content immediately below the navigation, omit the page-level NWU.ICU welcome copy, keep only the green logo in the top-left, and relegate school services to a full-width collapsed disclosure. The implementation intentionally uses the installed Lucide icon family for all UI icons and the real project logo asset.

The responsive captures preserve the same hierarchy: latest reviews first, guestbook second, and the school-service disclosure last. No horizontal clipping, overlap, unusable controls, or broken long-course-name wrapping was observed at 768 px or 390 px.

## Focused-region comparison evidence

- Header: the dashed NWU.ICU wordmark and the large page title/subtitle are absent. Logo scale, navigation rhythm, and white header surface match the revised direction.
- Latest reviews: the gradient ornament is replaced by a single-color `MessageSquareText` outline icon. Rows use one grouped surface, lightweight dividers, blue course links, secondary teacher/author/time metadata, and three-line excerpts.
- Guestbook: the region uses the same surface language and lightweight rows. Loading, success, empty, and retry states share the final spacing and typography tokens.
- School links: the disclosure is keyboard-operable, collapsed by default, rotates its chevron when opened, and exposes all nine existing external links with safe new-tab attributes.

## Required fidelity surfaces

- Fonts and typography: passed. Existing Inter/system stack is retained; headings, body text, metadata, wrapping, truncation, and line heights match the selected hierarchy.
- Spacing and layout rhythm: passed. Desktop 2:1 tracks, single-column breakpoints, card padding, dividers, radii, and vertical spacing remain stable across all three viewports.
- Colors and visual tokens: passed. Neutral slate surfaces and brand-blue links/icons match the target without reintroducing gradient decorations.
- Image quality and asset fidelity: passed. The real logo and existing avatar pipeline are retained; no fake imagery, handcrafted SVG, CSS illustration, or placeholder art was introduced.
- Copy and content: passed. Removed copy stays removed; all remaining labels are task-relevant and existing routes keep their original names.
- Accessibility and behavior: passed. Semantic regions and headings, focus-visible rings, descriptive logo control, native disclosure behavior, and practical touch targets are present.

## Comparison history

### Pass 1 — blocked

- P2 mobile density: per-review “查看详情” controls made each mobile row unnecessarily tall compared with the selected digest design.
- P2 mobile navigation: the existing mobile menu rendered “主页” twice.
- Fixes: linked each course title directly to the exact review anchor and removed redundant row actions; removed the hard-coded duplicate home entry from `MobileMenu.vue`.

### Pass 2 — passed

- Recaptured 1440 × 1024, 768 × 1024, and 390 × 844 views after the fixes.
- Confirmed the compact review rows, single mobile home entry, collapsed service disclosure, link targets, loading/error rendering, and zero browser console warnings or errors.
- No actionable P0, P1, or P2 findings remain.

## Test evidence

- `pnpm check`: passed.
- Vitest: 8 files, 31 tests passed.
- New homepage integration coverage verifies review and guestbook success, retry, empty, metadata, and detail-link behavior.
- Production build completed successfully; the existing large-chunk advisory remains unrelated to this change.

## Local integration evidence

- The development-only `.env.local` points `VITE_BACKEND_API_URL` to `http://127.0.0.1:8000`.
- Requests through Vite to `/api/assessment/latest-review/` and `/api/guestbook/` both returned HTTP 200 from the local Django backend.
- The browser rendered the real guestbook empty state (`还没有留言。`) instead of the previous remote-backend 404 retry state.
- Populated guestbook content remains covered by the homepage integration tests because the current local database has no guestbook rows.

final result: passed
