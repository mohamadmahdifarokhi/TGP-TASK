# EVALUATION.md — JamJoys React Native Frontend Assignment

**Evaluator-only document. Do not include in the candidate checkout.**

This is the standalone scoring rubric for the JamJoys React Native frontend take-home
assignment. It is self-contained: an evaluator can grade a submission using only this
file plus the candidate's repository. Where a category needs supporting detail (exact
seeded-bug fixes), use the companion `BUG_ANSWER_KEY.md`; where a tally sheet is needed,
use `GRADING_WORKSHEET.md`.

---

## How to grade

1. **Set up the backend.** Start the JamJoys NestJS backend (see the candidate's
   `ASSIGNMENT.md` / `README.md`). Confirm `POST /auth/send-otp` returns the dev `otp`
   in its response so you can complete the OTP flow without an SMS gateway.

2. **Clean checkout.** Grade against a fresh clone of the candidate's submission. Run
   the documented install command. Do **not** hand-edit files to make things work — if
   it does not run as documented, that is an observable grading signal.

3. **Run the app and the test suite.** Launch the app against the backend, run the
   shipped `typecheck` and `test` scripts, and walk each screen. The starter ships a
   fast-check property suite; several properties double as seeded-bug regression tests
   (a fixed bug turns its linked property green).

4. **Score each category independently** using the observable conditions below. Each
   category lists three bands:
   - **Full credit** — all listed conditions observed.
   - **Partial credit** — award proportionally; the rows describe what earns the
     intermediate points. Round to the nearest whole point.
   - **Zero** — the deliverable is absent, non-functional, or fails the gating
     condition.

5. **Zero-on-omission rule (Requirement 12.3).** If a submission omits a deliverable
   required by the assignment for a given category, assign **zero** for that category,
   regardless of the quality of unrelated work.

6. **Record the total out of 100** on `GRADING_WORKSHEET.md`. Record any completed
   stretch goals **separately** (see the Stretch Goals section); they never raise the
   total above 100.

7. **Be evidence-based.** For every score below full credit, note the specific observed
   behavior (screen, command output, file/line) that justified the deduction.

---

## Score summary

| # | Category | Points |
|---|----------|-------:|
| 1 | Project setup and structure | 10 |
| 2 | API client layer | 10 |
| 3 | Authentication and state management | 20 |
| 4 | Core screens and features | 25 |
| 5 | Error and loading handling | 10 |
| 6 | Seeded-bug fixing | 10 |
| 7 | Git workflow | 5 |
| 8 | AI-usage documentation | 5 |
| 9 | README quality | 5 |
| | **Total** | **100** |

---

## 1. Project setup and structure — 10 points

*Covers Requirement 1.1–1.7.*

**Full credit (10):**
- App is built with React Native; `package.json` declares all runtime and dev
  dependencies with pinned or explicitly ranged versions (1.1, 1.2).
- The documented install command succeeds on a clean checkout with **no** manual file
  edits (1.3).
- Source is organized into separated concerns — at minimum API/networking, state
  management, navigation, screens, reusable components, and configuration (1.4).
- The backend base URL is read from an environment configuration file; **no** hard-coded
  base-URL literals appear in screen or component logic (1.5).
- A `.gitignore` excludes dependency directories, build artifacts, and local env secrets
  (1.6).
- Where TypeScript is used, the project compiles with **no** type errors using the
  configured `typecheck` script (1.7).

**Partial credit (1–9):**
- ~6: installs cleanly and is reasonably organized, but a layer is missing/merged
  (e.g., API calls live inside screens) or some deps use floating/unpinned versions.
- ~4: installs only after a manual tweak, or the base URL is hard-coded in one or more
  screens/components rather than read from env config.
- ~2: structure is flat or ad hoc; `.gitignore` misses `node_modules`/build/secrets, or
  TypeScript reports type errors.

**Zero (0):**
- Not a React Native project, no `package.json`, install cannot be completed, or the
  project is so disorganized that no separation of concerns is observable.

---

## 2. API client layer — 10 points

*Covers Requirement 2.1–2.6.*

**Full credit (10):**
- A **single, reusable** API client module is used by all screens for backend
  communication (2.1).
- Protected requests attach the current access token as `Authorization: Bearer <token>`
  (exactly one space, unmodified token) (2.2).
- Non-2xx responses surface a **structured** error carrying the HTTP status code and the
  backend error message (2.3).
- Timeouts / no-network conditions return an error result rather than hanging
  indefinitely (2.4).
- Typed request functions exist for every resource group used: auth, games, videos,
  favorites, watch-history, users (2.5).
- Routes match the published backend paths exactly (`POST /auth/send-otp`,
  `POST /auth/verify-otp`, `POST /auth/refresh`, `GET /auth/me`, `GET /games`,
  `GET /games/:slugOrId`, `GET /videos/:id`, `GET /favorites`,
  `POST /watch-history/:videoId`, `PATCH /users/me`, etc.) (2.6).

**Partial credit (1–9):**
- ~7: centralized client exists and works, but error results are unstructured (raw
  axios/fetch error) or omit the status code/message.
- ~5: client works for the happy path but does not handle timeouts/no-network, leaving
  callers able to hang.
- ~3: networking is partly centralized but some screens call the backend directly, or a
  resource group is missing typed functions.
- ~2: route paths are wrong/mistyped in ways that would break against the real backend.

**Zero (0):**
- No reusable client (each screen wires its own fetch), or the client is non-functional.

---

## 3. Authentication and state management — 20 points

*Covers Requirement 3 (OTP auth) and Requirement 4 (state + token lifecycle).*

**Full credit (20):**
- **OTP sign-in (3.1–3.7):** phone submission calls `send-otp`; invalid Iranian phone
  numbers are rejected client-side **without** a backend call; a 6-digit OTP screen
  appears; valid OTP calls `verify-otp`; tokens persist and the session is marked
  authenticated; invalid/expired OTP shows an error and allows re-entry; submit controls
  are disabled while a request is in flight.
- **State + lifecycle (4.1–4.7):** a dedicated state-management approach holds auth
  state app-wide; tokens persist to device storage and survive an app restart; a launch
  with a valid persisted session restores authenticated state without re-login; a 401
  triggers `POST /auth/refresh` and **one** retry of the original request with the new
  access token; refresh failure clears all tokens and returns to sign-in; logout calls
  `POST /auth/logout`, clears storage, and returns to sign-in; protected screens are
  unreachable while unauthenticated.

**Partial credit (1–19):**
- ~16: full OTP flow and shared state, but session does **not** survive restart
  (persistence/hydration missing) — note BUG-01 territory if unfixed.
- ~13: tokens persist, but the 401 → refresh → retry-once flow is missing or broken
  (logs the user out instead of refreshing) — note BUG-03 territory if unfixed.
- ~10: auth works but the Bearer header is malformed so protected calls 401 (BUG-02), or
  refresh-failure does not clear tokens / return to sign-in.
- ~6: sign-in succeeds but state is local to a screen (not shared), or no client-side
  phone validation, or submit controls are not disabled in flight.
- ~3: partial OTP flow only (e.g., send works, verify or persistence does not).

**Zero (0):**
- No working authentication, or tokens are never stored so the user cannot reach any
  protected screen.

---

## 4. Core screens and features — 25 points

*Covers Requirement 5 (catalog), 6 (detail + view), 7 (video + history), 8 (favorites +
wishlist), and 9 (profile). Allocate the 25 points across the five feature areas
(suggested 5 each); award per-area partial credit and sum.*

**Full credit (25) — all five areas complete:**
- **Catalog (5):** `GET /games` renders a scrollable list with at least title +
  thumbnail per game; loading indicator while in flight; error+retry on failure; empty
  state on zero results; appends pages on scroll where the response is paginated.
- **Game detail + view (5):** `GET /games/:slugOrId` renders title, description, and
  associated videos; `POST /games/:id/view` fires on load (UUID id); error+retry on
  failure; display reads `categoryConfig`/`difficultyConfig`, **not** legacy
  `category`/`difficulty` enum fields.
- **Video + watch history (5):** `GET /videos/:id` loads metadata and renders a player;
  `GET /videos/:id/validate-access` gates playback (plays only when `hasAccess` is true,
  shows the message otherwise); progress posts periodically to
  `POST /watch-history/:videoId`; the watch-history screen lists previously watched
  videos via `GET /watch-history`.
- **Favorites + wishlist (5):** favorite control calls `POST`/`DELETE /favorites/:gameId`;
  detail reflects status from `GET /favorites/:gameId/check`; favorites and wishlist
  screens list via `GET /favorites` and `GET /favorites/wishlist`; failed mutations
  revert the control and show an error (optimistic update keyed by `gameId`, not index).
- **Profile (5):** `GET /auth/me` populates the profile; `PATCH /users/me` saves edits
  and reflects them; `GET /users/me/token-balance` displays the balance; failed
  read/update shows an error and retains last-known values.

**Partial credit (1–24):**
- Award per area as above; within an area, give roughly half credit when the primary
  read/render works but secondary behaviors are missing (e.g., catalog lists but never
  paginates, or detail renders but never fires the view call, or favorite toggles but
  does not revert on failure / is keyed by index — BUG-04 territory).
- Deduct within "game detail" when blank titles/categories indicate reading legacy enum
  fields (BUG-05 territory).

**Zero (0):**
- No core content screen is functional (e.g., catalog never loads and nothing downstream
  is reachable). Apply 12.3 per area: an entirely omitted feature area scores 0 for that
  area's points.

---

## 5. Error and loading handling — 10 points

*Covers Requirement 10.1–10.4.*

**Full credit (10):**
- Every backend request that blocks a screen's primary content shows a loading indicator
  while in flight (10.1).
- Failed requests show a **human-readable** error message describing the failure
  (10.2).
- Each list that returns zero items shows a **screen-specific** empty-state message
  (10.3).
- A single failed backend request never crashes the app — it stays operable (10.4).

**Partial credit (1–9):**
- ~7: loading and error states are present on most screens but inconsistent (one or two
  screens spin forever — BUG-06 territory — or show a raw/blank error).
- ~5: loading and error handled, but empty states are generic or missing.
- ~3: only ad hoc handling on a couple of screens; others have no feedback.

**Zero (0):**
- No loading/error/empty handling, or a single failed request crashes the app.

---

## 6. Seeded-bug fixing — 10 points

*Covers Requirement 11.1–11.6. Use `BUG_ANSWER_KEY.md` to verify each fix. There are 6
seeded bugs (`BUG-01`..`BUG-06`).*

**Full credit (10):**
- All documented symptoms in `BUGS.md` no longer occur when running the app after the
  fixes (11.5).
- `BUGFIX_NOTES.md` records, per fixed bug, the **root cause** and the **applied fix**
  (11.3), and distinguishes AI-assisted parts from hand-written parts (11.6).
- Each fix is committed as a separate `fix:` Conventional Commit referencing the bug
  identifier (11.4).

**Partial credit (1–9):**
- Award ~1.6 points per correctly fixed-and-documented bug (6 bugs ≈ 10). Within a bug,
  give partial credit when the symptom is resolved but the notes omit root cause/fix or
  the AI-vs-hand split, or when the fix is correct but not committed as a discrete
  `fix:` commit referencing the bug id.
- Deduct when a "fix" suppresses the symptom without addressing the root cause, or
  introduces a regression in a linked property test.

**Zero (0):**
- No bugs fixed, or `BUGFIX_NOTES.md` absent with no observable symptom resolution.

---

## 7. Git workflow — 5 points

*Covers Requirement 13.1–13.5.*

**Full credit (5):**
- Features developed on dedicated feature branches, not committed directly to the
  default branch (13.1).
- Commit messages follow the Conventional Commits spec (13.2).
- History reads as coherent, self-contained commits — one logical change each (13.3).
- A pull-request-style merge into the default branch exists with a summarizing
  description (13.4).
- Dependency directories, build artifacts, and env secrets are excluded from all commits
  (13.5).

**Partial credit (1–4):**
- ~4: Conventional Commits and clean history, but all work landed on the default branch
  (no feature branch / PR-style merge).
- ~3: feature branches used but commit messages are inconsistent or commits bundle
  unrelated changes.
- ~1: a single squashed/initial commit, or messages do not follow the convention.

**Zero (0):**
- No meaningful git history, or `node_modules`/build artifacts/secrets are committed.

---

## 8. AI-usage documentation — 5 points

*Covers Requirement 14.1–14.6.*

**Full credit (5):**
- An `AI_USAGE.md` deliverable exists (14.1).
- It records whether the AI agent was used and, per significant use, the prompt intent
  and the artifact produced (14.2).
- It records which Kiro/agent features were used among Skills, Hooks, MCP servers, and
  Steering, naming each feature used (14.3).
- For each Skill/Hook/MCP/Steering used, it describes the task supported and the observed
  effect (14.4).
- It distinguishes AI-generated work from hand-written work, per feature or per major
  artifact (14.5).
- If no AI tooling was used for a deliverable, it states that explicitly (14.6).

**Partial credit (1–4):**
- ~4: present and mostly complete, but the AI-vs-hand split is vague or missing for some
  artifacts.
- ~3: records agent use but omits the Skills/Hooks/MCP/Steering feature matrix or the
  observed effects.
- ~1: a stub with little substantive content.

**Zero (0):**
- `AI_USAGE.md` absent, or empty/template-only with no candidate content.

---

## 9. README quality — 5 points

*Covers Requirement 15.1–15.6.*

**Full credit (5):**
- Documents prerequisites and the exact commands to install and run the app (15.1).
- Documents how to configure the backend base URL and required env variables (15.2).
- Describes the project structure and the chosen state-management approach (15.3).
- Lists the implemented screens and the backend endpoints each consumes (15.4).
- Links to `BUGFIX_NOTES.md` and `AI_USAGE.md` (15.5).
- Following the README on a clean checkout lets the evaluator launch the app against the
  backend **without** consulting the source (15.6).

**Partial credit (1–4):**
- ~4: complete instructions but missing the screens↔endpoints map or the links to the
  notes/log.
- ~3: run instructions present but env/base-URL configuration is unclear, requiring
  source inspection to launch.
- ~1: minimal README; cannot launch from it alone.

**Zero (0):**
- No README, or it lacks runnable setup instructions.

---

## Stretch goals (recorded separately — do NOT add to the 100-point total)

Per Requirement 12.5, record completed stretch goals on `GRADING_WORKSHEET.md` as
qualitative notes. They demonstrate excellence beyond scope but **never** raise the score
above 100. Suggested observable stretch goals:

- **Avatar upload** via `POST /users/me/avatar` (multipart) wired into the profile
  screen.
- **Subscription status** surfaced via `GET /users/me/subscription-status`.
- **Featured / landing data** using `GET /games/featured` or
  `GET /games/landing-page/data`.
- **Phone normalization** that accepts `+98` / `0098` prefixes and normalizes to
  `09xxxxxxxxx` before validation.
- **Resume playback** from the stored watch-history progress.
- **Offline/cache layer** (e.g., TanStack Query persistence) for catalog/detail.
- **Accessibility** pass (labels, focus order, contrast) on the core screens.
- **CI** running typecheck + the test suite on each push.
- **Test coverage beyond the shipped property suite** (additional unit/component tests).

---

## Final tally

Sum categories 1–9. Maximum **100**. Stretch goals are noted separately and excluded
from the total. Record the breakdown and supporting evidence on `GRADING_WORKSHEET.md`.
