# Storybook implementation QA

final result: passed

Final post-fix full-view and focused comparisons reviewed. No remaining actionable P0/P1/P2 findings for the agreed composition and interaction scope.

## Visual truth and capture conditions

- Approved drawing room: `/workspace/design/ainsworth-storybook/drawing-room-day.png` and `drawing-room-night.png`.
- Approved screen concepts: `/workspace/design/ainsworth-storybook/screens/` (`diary-writing.png`, `owl-post-letter.png`, `manor-map.png`, and the eight other-room concepts).
- Source image dimensions: 1586×992 for room/screen concepts. Runtime viewport: 1600×1000 CSS pixels, deviceScaleFactor 1, screenshots 1600×1000. Source and runtime images are normalized to 800×500 slots with object-fit contain in each combined comparison; no art is stretched for comparison.
- Live evidence: `review/screenshots/drawing-day.png`, `drawing-night.png`, `diary.png`, `letter.png`, `map.png`, `settings.png`, `phone.png` (390×844), `tablet-portrait.png` (800×1280). All are actual Chromium browser screenshots, not HTTP checks or rendered source-image substitutes.
- Same-input comparisons: `comparison-main.png`, `comparison-diary.png`, `comparison-letter.png`, `comparison-map.png`. Focused native-scale writing-area comparison: `comparison-diary-detail.png`. These put source and implementation together before judgment.
- State: normal app, drawing room daytime then night, example letter opened, an editable diary with sample text, map opened from drawing room. Mock fictional dates/text differ intentionally from the actual editable data. Keyboard focus ring is visible on the active editor by design.

## Findings and fix history

1. [P1, resolved] Initial activity surfaces looked like one large paper form card instead of a desk and open book. Removed the outer app-card surface for writing activities, encoded a separate generated journal asset, placed real editable content into its two-page spread and used the original wood/paper art. Post-fix evidence: diary and letter combined comparisons.
2. [P2, resolved] Native diary content overlapped the painted cover and could run beyond the book edge. Added a constrained left-page content region, independent right-page ink region and page navigation inside the cover. Preserved scrolling on small viewports instead of clipping input controls. Evidence: latest diary full and focused comparisons; diary storage/ink/recovery tests.
3. [P2, resolved] The persistent minimap intercepted lower room-menu/profile actions. Reserved vertical space in scrolling lists and constrained the room menu above the map area. Evidence: actual pointer-based room/character/profile tests now pass.
4. [P2, resolved] Full map was initially a picture inside another paper panel. Removed that second panel, made the parchment map the full viewport surface, and kept real destination buttons, current location and a close control. Final combined map comparison reviewed: the parchment fills the viewport and real room targets remain readable and reachable.
5. [P2, resolved] Ink focus mode could leave the trash/restore toolbar hidden after deleting an entry. Limit focus mode to a selected, nondeleted entry. Actual delete/restore and reload tests pass.
6. [P2, resolved] Standalone HTML assembly initially risked replacement-string interpolation of bundle contents. Use replacement callbacks and byte-equivalence validation of the embedded JS. Test the HTML with external-resource requests blocked, including navigation, save and reload.
7. [P2, resolved] Mobile room crop lacked a visual panning cue. Show an explicit portrait-mode hint; retain the semantic viewport label, fixed controls and alternative activity tray. Native screenshot and responsive layout checks cover phone and tablet portrait.

## Required fidelity surfaces

- Typography: Georgia/available serif fallback for interface text; bundled Allura cursive and Nanum Pen Korean handwriting for letters and practice. Native editing text replaces raster lettering; user data remains selectable/editable and readable. The original illustration's exact handwritten glyph contours are not a font claim.
- Spacing/layout: full-window room art preserves its 1.6 aspect ratio, cropped views pan rather than squash. Fixed controls are at the reference corners. Activity canvases scroll internally where needed. The book and map composition, page margins and narrow indexes were revised after direct comparison.
- Colour/tokens: cream, sage, powder blue, antique brass and honey oak are taken from approved art. Drawing room uses independent day/night plates. Native focus contrast is intentionally stronger than decorative marks in the concepts. Paper and stationery colour choices remain live.
- Images: real generated background plates, transparent pose/prop/effect atlases and journal/map artwork are used. WebP delivery uses the original composition and preserves alpha; no replacement SVG room drawings or CSS illustrations. Separate overlays include cat, owl, mail, books, fire, candle and steam. Object positions were checked against furniture; the quill was lowered onto the desk during QA.
- Copy/content: implementation keeps actual Korean controls, editable titles, explicit sample-letter status and the canonical fixed mystery facts. Generated decorative receipt/letter wording does not overwrite the case truth. AI replies use an optional local OpenAI gateway with per-letter consent; real postal/email delivery remains unavailable.

## Interaction and runtime evidence

Primary checks: opening/skip/reduced motion, all nine rooms, object actions, day/night setting, map from activities without losing the mounted activity, letter CRUD/attachment/reply/filter, diary save/ink/zoom/undo/trash recovery, companion persistence, complete mystery, plant/collection/pixel/practice workflows, JSON validation and restore confirmation, keyboard focus, production offline use and browser-restart restoration. Browser screenshot tests collect console page errors.

Unit tests cover v1 backwards compatibility and additional practice/sketchbook records. Browser tests cover the self-contained HTML with no external subresource requests. This environment's managed Chromium blocks `file://` navigation by policy, so direct local-file opening is an explicit verification gap; the same HTML bytes were rendered as an isolated intercepted document with networking disabled. Actual Android/S-pen hardware and Netlify hosting were not tested or published.

## Follow-up polish (P3)

- Other-room evening tones currently use the approved plate with dimmed colour treatment; only the drawing room has an independently painted night plate.
- Character atlases are key poses with light movement/reaction effects, not continuous rigged walking/flight cycles.
- Small botanical decorations and native form-control details differ from the illustrative mocks. Browser font and date-control appearance vary by OS.

## Implementation checklist

- [x] Use supplied/generated art; preserve user records.
- [x] Full-screen rooms and persistent reachable map.
- [x] Functional typed/ink editing and creative workspaces.
- [x] Actual browser captures and combined visual comparisons.
- [x] Standalone HTML with isolated preview storage.
- [x] Review latest expanded-map capture and record final result.
- [x] No Netlify upload or deployment.

Validation: build and standalone assembly passed; Vitest 13/13; full Playwright suite 17/17. After the final diary content-boundary adjustment, affected diary/HTML/studio checks passed 6/6; after expanded-map changes, affected foundation/HTML/map checks passed 8/8. No application deployment or main-branch update.

## Correspondence follow-up — 2026-11-05

- Replaced generic cursive/Georgia fallback in practice and letter handwriting with locally bundled Allura and Nanum Pen. Handwriting is the initial letter view, text mode remains available, and HTML wrapping handles Korean and long lines. Fonts and their licenses are embedded in the standalone review.
- Mini-map is 150px on desktop / 112px on phone, including activity screens. Hit area remains greater than 44px. Fixed sparkle targets have a dark sage backing, gold border and a pulse that never fades to invisibility; reduced motion is respected.
- OpenAI correspondence has explicit content review, optional selected history, immutable generated replies, source labels and unread arrival state. The app-level delivery controller survives closing the mailbox and reload. Failed/uncertain requests expose recovery instead of silently issuing another billed generation.
- Server has an authenticated loopback HTTP gateway, origin checks, persistent request IDs and UTC daily reservations. Production hosting remains a separate step; no Netlify deployment was performed. Real OpenAI access is unverified because no key is configured.
- Native captures: `test-results/cursive-letter.png`, `cursive-practice.png`, `clear-hotspots-phone.png`, `ai-consent-{390,800,1440}.png`, `ai-arrived-letter.png`. Letter/lesson font loading and standalone offline font loading are tested in Chromium.

Follow-up verification: Vitest 17/17; server tests 9/9 including UTF-8 chunk boundaries; full browser suite 20/20 before the final recovery guards. The affected correspondence/standalone/map checks then passed 7 cases plus the added expiry-recovery case (1/1). Build, self-contained assembly, embedded font/license inspection and static ZIP verification passed. No actual OpenAI call or Netlify deployment was performed.
