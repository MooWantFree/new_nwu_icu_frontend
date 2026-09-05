# Visual system unification QA

- Source visual truth: Codex in-app Browser captures of the pre-change homepage and review timeline from this run. The browser returned inline JPEG evidence but did not expose filesystem paths.
- Implementation: local Vite preview on the homepage, review timeline, and course list.
- Implementation screenshots: Codex in-app Browser inline captures from this run; no filesystem path was exposed.
- Desktop CSS viewport: 1002 × 911 at device pixel ratio 2. Full-page evidence was normalized by the browser to 987 px width (homepage 1072 px high; timeline 1715 px high).
- Responsive target: 390 × 844 viewport override. Browser content captures were 375 × 812 px.
- State: logged out, light appearance, real local API data.

## Full-view comparison evidence

The pre-change homepage and timeline captures were reviewed together with the post-change captures. The review links now share one semantic link color, the timeline pagination follows the same system blue instead of Naive UI's default green, and both routes use the same cool-neutral page background. Timeline cards were reduced from heavy elevation and small radii to the same lightweight border, 16 px radius, and subtle shadow used by the homepage.

The course-list capture confirms that “登录/注册”, “添加课程”, and “应用筛选” use the same primary blue and control treatment. The 390 × 844 homepage and timeline captures preserve the new hierarchy without horizontal overflow, clipped controls, or broken long-title wrapping.

## Focused-region comparison evidence

- Color tokens: homepage and timeline course links both resolve to `rgb(0, 102, 204)`; primary actions resolve to `rgb(0, 122, 255)`; active pagination uses the same `rgb(0, 122, 255)` system blue.
- Surfaces: timeline review cards resolve to 16 px radii with a subtle 1 px shadow and neutral border, matching the homepage surface language.
- Typography: the product now prefers the Apple system font stack, with unified `#1D1D1F` primary text and Apple-style secondary gray ramps.
- Semantic color: green remains only for success, verified-user, strength, contribution, and avatar states. It is no longer used for ordinary primary actions.
- Component library: Naive UI receives the same primary, neutral, border, radius, and system-font tokens as Tailwind-rendered components.

## Required fidelity surfaces

- Fonts and typography: passed. System font stack, antialiasing, weights, and primary/secondary text hierarchy are consistent on inspected routes.
- Spacing and layout rhythm: passed. Homepage, timeline, and course-list captures use consistent page padding, card radii, borders, and reduced elevation.
- Colors and visual tokens: passed. The mismatched homepage/timeline blues and green primary controls are resolved.
- Image quality and asset fidelity: passed. Existing logo and user-avatar pipelines were preserved; no replacement imagery or drawn assets were introduced.
- Copy and content: passed. Labels, route content, and real API data were preserved.
- Interaction and accessibility: passed for the inspected surfaces. Focus-visible treatment remains present, primary controls retain disabled states, and desktop/mobile layouts showed no clipping. Screenshot review does not establish full WCAG conformance.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested color and style unification.

## Comparison history

### Pass 1 — issues found

- P2: homepage used deep-blue links while the timeline used light-blue links.
- P2: Naive UI pagination and several primary actions used green, while comparable actions used blue.
- P2: timeline cards used visibly heavier elevation and smaller radii than homepage cards.
- P2: gray/slate text and background ramps were not governed by one token set.

### Pass 2 — passed

- Added shared Apple-style color, typography, radius, and elevation tokens.
- Added a matching Naive UI theme override.
- Replaced non-semantic green actions with the shared primary button treatment.
- Reworked timeline links, cards, heading, page background, and pagination styling.
- Recaptured desktop homepage, timeline, course list, and 390 × 844 homepage/timeline states.
- Confirmed zero browser console warnings or errors on the final timeline state.

## Test evidence

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- Vitest: 9 files, 33 tests passed.
- `pnpm build`: passed.
- Existing Vite large-chunk advisory remains and is unrelated to this visual change.

## Addendum — Guestbook collapsed reply

- Source visual truth path: `C:\Users\ms\AppData\Local\Temp\codex-clipboard-65cdd963-d8d9-42f2-ae7e-e1dd5ff0125b.png` (1713 × 1260 px).
- Implementation: `http://localhost:5173/guestbook/3`, 959 × 911 CSS px at device pixel ratio 2.
- Implementation screenshot: focused 860 × 90 inline Codex in-app Browser capture; the browser surface did not expose a filesystem path.
- State: direct child reply collapsed while its parent remains expanded.
- Full-view evidence: the existing NWU.ICU card system is intentionally preserved; the source is used for the reply-tree interaction pattern rather than wholesale Reddit restyling.
- Focused-region evidence: the collapsed row contains only a circular plus, author, separator, and relative time. Body, actions, avatar, and descendants are hidden. Clicking the plus restores the complete reply and its loaded descendant.
- Typography, spacing, colors, imagery, and copy: passed within scope. Existing product font and blue/neutral tokens remain; compact hierarchy matches the source; the icon comes from the installed Lucide set; author and relative time use live entry data.
- Comparison history: the first pass found a P1 reactive-state defect for newly discovered branches. The branch factory now returns the reactive collection entry, a regression test covers it, and the post-fix browser pass verified collapse, expansion, descendant restoration, and zero console warnings or errors.
- Result: no actionable P0, P1, or P2 differences remain for the requested collapsed-reply state.

final result: passed
