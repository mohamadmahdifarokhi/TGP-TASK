# EVALUATION.md — JamJoys React Native Frontend Assignment

**Evaluator-only document. Do not include in the candidate checkout.**

This is the standalone scoring rubric for the JamJoys React Native frontend take-home
assignment. It is self-contained: an evaluator can grade a submission using only this
file plus the candidate's repository. Where a category needs supporting detail (exact
seeded-bug fixes), use the companion `BUG_ANSWER_KEY.md`; where a tally sheet is needed,
use `GRADING_WORKSHEET.md`.

> **This is a UI/UX-first assignment.** The starter app already works end-to-end but ships
> deliberately **unstyled**. The candidate's main job is to **redesign and elevate the UI/UX of
> every screen** (plus add a Discover screen and fix a few seeded bugs). Grade primarily on
> front-end craft and visual quality — a working-but-ugly submission must score poorly.

---

## How to grade

1. **Start the bundled mock backend.** `cd mock-backend && node server.js`. Confirm
   `POST /auth/send-otp` returns the dev `otp` so you can complete the OTP flow without an SMS
   gateway. (No database/real backend is needed.)

2. **Clean checkout.** Grade against a fresh clone of the candidate's submission. Run the
   documented install command. Do **not** hand-edit files to make things work — if it does not
   run as documented, that is an observable grading signal.

3. **Run the app and walk every screen.** Launch against the mock backend and run the shipped
   `typecheck` script. Then **look at each screen** — this assignment is judged primarily on how
   the app looks and feels, so spend your time in the running app comparing against the
   unstyled baseline. Screenshots in the README help, but verify in the app.

4. **Score each category independently** using the observable conditions below. Each category
   lists bands: **Full credit** (all conditions observed), **Partial credit** (award
   proportionally), **Zero** (absent, non-functional, or fails the gating condition).

5. **UI gating rule.** If the app still looks like the unstyled starter (no meaningful
   redesign), categories 1–4 cannot rise above ~30% each no matter how clean the code is. The
   point of this assignment is front-end craft.

6. **Zero-on-omission rule.** If a submission omits a deliverable required for a given category,
   assign **zero** for that category, regardless of the quality of unrelated work.

7. **Record the total out of 100** on `GRADING_WORKSHEET.md`. Record completed stretch goals
   **separately**; they never raise the total above 100.

8. **Be evidence-based.** For every score below full credit, note the specific observed signal
   (screen, command output, file/line) that justified the deduction.

---

## Score summary

This is a **UI/UX-first** assignment. ~60 of the 100 points are the visual/interaction quality
of the redesigned app. Functional correctness (bugs, data wiring) is necessary but lightly
weighted — a working-but-ugly app should score poorly.

| # | Category | Points |
|---|----------|-------:|
| 1 | UI/UX visual design across all screens | 35 |
| 2 | Design system & reusable component quality | 15 |
| 3 | Discover screen (UI + data composition) | 15 |
| 4 | States & interaction/motion polish | 10 |
| 5 | Seeded-bug fixing | 5 |
| 6 | Architecture, correctness & performance (API client, state, structure, typecheck) | 5 |
| 7 | Git workflow | 5 |
| 8 | AI-usage documentation | 5 |
| 9 | README quality & screenshots | 5 |
| | **Total** | **100** |

> **Gating rule:** if the candidate did **not** meaningfully redesign the screens (i.e. the app
> still looks like the unstyled starter), categories 1–4 cannot exceed ~30% each, regardless of
> how clean the code is.

---

## 1. UI/UX visual design across all screens — 35 points

*The primary category. Grade the running app on a clean checkout, screen by screen. This is
about visual craft and taste, not whether data loads (covered lightly elsewhere).*

Screens in scope (each must be redesigned from the unstyled baseline): Phone sign-in, OTP,
Catalog, Game Detail, Video Player, Favorites, Wishlist, Watch History, Profile, Discover.

**Full credit (35):**
- Every screen looks like a **deliberately designed, production-quality** product: consistent
  layout, spacing rhythm, a real typographic scale, considered color/contrast, clear visual
  hierarchy, and tasteful use of imagery/placeholders and iconography.
- The visual language is **cohesive across all screens** — they clearly belong to one app.
- Persian/RTL layout and alignment are correct throughout.
- Cards, headers, badges, inputs, and list rows are visually refined (not default RN views).

**Partial credit (1–34) — grade as a per-screen average, then scale to 35:**
- ~26: most screens well-designed but a few remain plain or inconsistent with the rest.
- ~18: a clear design direction exists but execution is uneven (spacing/typography/color drift;
  some screens barely touched).
- ~10: light styling applied (a few colors/margins) but it still reads as the starter.
- ~5: token gestures only.

**Zero (0):**
- Screens are essentially the unstyled starter. A working-but-ugly app scores at/near zero here.

---

## 2. Design system & reusable component quality — 15 points

*The candidate's own design tokens and shared component library.*

**Full credit (15):**
- A centralized **design-token** layer (color, spacing, typography, radius, shadow) is defined
  once and used everywhere — no scattered magic numbers / inline hex per screen.
- A small library of **reusable components** (e.g. Button, Card, Input, Badge, SectionHeader,
  ListRow, Skeleton) with sensible props powers the screens; no copy-pasted style blocks.
- Components are composable, typed, and consistent; variants handled via props, not forks.

**Partial credit (1–14):**
- ~11: tokens exist and are mostly used, but some screens still hard-code styles, or the
  component set is thin.
- ~7: a couple of shared components, but most styling is per-screen one-offs.
- ~3: minimal reuse; mostly repeated inline styles.

**Zero (0):**
- No design system; every screen styles itself ad hoc.

---

## 3. Discover screen (UI + data composition) — 15 points

*A new landing surface the candidate builds. Grade both its visual quality and that it composes
the right data. Should be the initial authenticated tab.*

**Full credit (15):**
- **Visual quality (7):** the strongest, most magazine-like surface in the app — featured rail,
  category sections, and continue-watching all polished and cohesive with the design system.
- **Data composition (5):** featured rail (`GET /games/featured`), continue-watching from
  `GET /watch-history` (hidden when empty), browse-by-category grouped from `GET /games` via
  `categoryConfig`, and a debounced search.
- **Engineering (3):** virtualized lists with stable keys, memoized rows, reuses the shared API
  client and state, pull-to-refresh, and loading/error/empty states.

**Partial credit (1–14):**
- ~11: built and functional with good composition, but average visual design.
- ~8: most sections present but one missing (e.g. no continue-watching / no search) or plain UI.
- ~4: a basic single list rather than the composed multi-section surface.

**Zero (0):**
- No Discover screen, or it does not render / is unreachable.

---

## 4. States & interaction/motion polish — 10 points

*Loading, error, empty states plus interaction feel across the app.*

**Full credit (10):**
- Every screen that can block shows a **designed** loading state (skeletons/shimmer or a
  considered spinner), a **retryable** error state, and a **designed** empty state (not raw
  text).
- Interaction polish: pressed/disabled states, keyboard avoidance on inputs, pull-to-refresh,
  smooth transitions, optimistic UI where appropriate (e.g. favorite toggle).
- A single failed request never crashes the app.

**Partial credit (1–9):**
- ~7: states present on most screens but inconsistent or undesigned on a few.
- ~5: functional states but plain (default spinner, generic empty text), little interaction
  polish.
- ~3: only ad hoc handling on a couple of screens.

**Zero (0):**
- No designed states; raw spinners/blank screens, or a failed request crashes the app.

---

## 5. Seeded-bug fixing — 5 points

*Use `BUG_ANSWER_KEY.md` to verify each fix. There are 6 seeded bugs (`BUG-01`..`BUG-06`).
Secondary to the UI work, but the app must actually function.*

**Full credit (5):**
- All documented symptoms in `BUGS.md` no longer occur after the fixes.
- `BUGFIX_NOTES.md` records, per fixed bug, the **root cause** and the **applied fix**, plus the
  AI-assisted vs hand-written split.
- Each fix is a separate `fix:` Conventional Commit referencing the bug id.

**Partial credit (1–4):**
- ~0.8 per correctly fixed-and-documented bug. Partial within a bug when the symptom is resolved
  but notes omit root cause/fix, or the fix isn't a discrete `fix:` commit referencing the id.
- Deduct when a "fix" suppresses the symptom without addressing the root cause.

**Zero (0):**
- No bugs fixed, or `BUGFIX_NOTES.md` absent with no observable symptom resolution.

---

## 6. Architecture, correctness & performance — 5 points

*The layered architecture, project structure, that the data layer stays sound, and that the app
is built with reasonable performance hygiene. Structural improvements are rewarded here.*

**Full credit (5):**
- Clean separation of concerns (UI → state → API client → backend); the centralized API client
  and shared store are reused — no second networking path, no hard-coded base URL.
- TypeScript compiles with **no** errors via the `typecheck` script.
- **Performance (app-wide, not just Discover):** all long/scrolling lists are virtualized
  (`FlatList`/`SectionList`, not `.map()` inside a `ScrollView`) with stable `keyExtractor`s;
  rows/cards are `React.memo`'d and render callbacks are `useCallback`/`useMemo`'d so there are
  no obvious re-render storms; no heavy work in render; inputs/scroll handlers are
  debounced/throttled where appropriate; no duplicate/redundant requests (e.g. refetch loops,
  n+1 calls). `getItemLayout` / image sizing where it clearly helps is a plus.
- **Structure bonus:** if the candidate reorganized the project into a clearer/more scalable
  structure (e.g. feature-based folders, an explicit design-system layer) and justified it,
  reward it here. A thoughtful, well-argued structure scores full marks; keeping the original
  layout cleanly is also acceptable.

**Partial credit (1–4):**
- ~4: sound architecture and typecheck clean, but a couple of performance smells (a non-
  virtualized list, missing memoization on a hot list, or an inline object/function in a hot
  prop) or minor structure issues.
- ~3: minor architectural leaks (a screen calls the backend directly, or some hard-coded
  values), a few type errors, or noticeable re-render/perf problems on a main screen.
- ~1: significant architectural leaks or many type errors; lists not virtualized at all.

**Zero (0):**
- Architecture broken: ad-hoc fetches everywhere, hard-coded base URLs, or typecheck fails badly.

---

## 7. Git workflow — 5 points

**Full credit (5):**
- Features developed on dedicated feature branches, not committed directly to the default
  branch.
- Commit messages follow the Conventional Commits spec.
- History reads as coherent, self-contained commits — one logical change each.
- A pull-request-style merge into the default branch exists with a summarizing description.
- Dependency directories, build artifacts, and env secrets are excluded from all commits.

**Partial credit (1–4):**
- ~4: Conventional Commits and clean history, but all work landed on the default branch.
- ~3: feature branches used but commit messages are inconsistent or commits bundle unrelated
  changes.
- ~1: a single squashed/initial commit, or messages do not follow the convention.

**Zero (0):**
- No meaningful git history, or `node_modules`/build artifacts/secrets are committed.

---

## 8. AI-usage documentation — 5 points

**Full credit (5):**
- An `AI_USAGE.md` deliverable exists.
- It records whether the AI agent was used and, per significant use, the prompt intent and the
  artifact produced.
- It records which Kiro/agent features were used among Skills, Hooks, MCP servers, and
  Steering, naming each feature used, and the observed effect of each.
- It distinguishes AI-generated work from hand-written work, per feature or major artifact.
- If no AI tooling was used for a deliverable, it states that explicitly.

**Partial credit (1–4):**
- ~4: present and mostly complete, but the AI-vs-hand split is vague or missing for some
  artifacts.
- ~3: records agent use but omits the Skills/Hooks/MCP/Steering matrix or the observed effects.
- ~1: a stub with little substantive content.

**Zero (0):**
- `AI_USAGE.md` absent, or empty/template-only with no candidate content.

---

## 9. README quality & screenshots — 5 points

**Full credit (5):**
- Documents prerequisites and the exact commands to install and run the app.
- Documents how to configure the backend base URL and required env variables.
- Describes the project structure and the chosen state-management approach.
- Lists the implemented screens and the backend endpoints each consumes.
- Includes **screenshots (or a short recording) of every redesigned screen** and a note on the
  design system / UI decisions.
- Links to `BUGFIX_NOTES.md` and `AI_USAGE.md`; a clean-checkout reader can launch the app
  without reading the source.

**Partial credit (1–4):**
- ~4: complete instructions but missing screenshots or the screens↔endpoints map.
- ~3: run instructions present but env/base-URL config unclear, or no design notes/screenshots.
- ~1: minimal README; cannot launch from it alone.

**Zero (0):**
- No README, or it lacks runnable setup instructions.

---

## Stretch goals (recorded separately — do NOT add to the 100-point total)

Record completed stretch goals on `GRADING_WORKSHEET.md` as qualitative notes. They demonstrate
excellence beyond scope but **never** raise the score above 100. Suggested observable stretch
goals:

- **Animations/motion** beyond the basics (shared element transitions, list item entrance,
  skeleton shimmer) via reanimated/moti.
- **Dark mode** / theme switching built on the design tokens.
- **A thoughtful project-structure refactor** (feature-based folders, design-system package)
  with a clear rationale in the README.
- **Avatar upload** via `POST /users/me/avatar` wired into the redesigned profile.
- **Resume playback** from stored watch-history progress.
- **Accessibility pass** (labels, focus order, contrast) documented in the README.
- **Component tests / Storybook-style previews** of the design-system components.

---

## Final tally

Sum categories 1–9. Maximum **100**. Stretch goals are noted separately and excluded from the
total. Record the breakdown and supporting evidence on `GRADING_WORKSHEET.md`.
