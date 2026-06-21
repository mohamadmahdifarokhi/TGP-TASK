# Frontend Engineering Assignment — JamJoys Mobile Client

## Context

JamJoys is a Persian platform that teaches traditional games through short videos. Users sign in with their Iranian phone number and a one-time password, browse a catalog of games, watch the associated videos, favorite and wishlist games, and track their watch history.

Your task is to work on a **React Native frontend** for JamJoys that consumes the **JamJoys backend API**. The backend is a **fixed external dependency** — you do not modify it; you build the client against its contract. A ready-to-run mock of that backend is bundled in [`mock-backend/`](./mock-backend) so you can run everything locally without a database (see [Running the Backend](#running-the-backend)). A working starter app lives in [`candidate-app/`](./candidate-app); it runs end-to-end but contains a set of **seeded bugs** that you must locate and fix (see [`BUGS.md`](./BUGS.md)).

This is a graded take-home test. It is designed to be completable in roughly **two days (~16 hours)** by a competent React Native developer, and it is graded objectively against observable behavior and the deliverables listed below.

## Scope

The app already runs end-to-end: the data layer (API client, auth store, navigation, and all
screens) is wired up and functional. **But the UI is deliberately bare-bones** — unstyled
default React Native views, no design system, no visual polish. **Your main job is to redesign
and elevate the UI/UX of the entire app**, plus fix a set of seeded bugs along the way.

> **Treat what ships as a baseline, not a finished product.** The current screens, components,
> and folder layout are the **starting point** — they define *what* the app does, not *how well*
> it looks or *how* it's organized. We want to see how much better you can make it. You are free
> (and encouraged) to **restructure the project** too — reorganize folders, introduce a
> feature-based or layered structure, extract a design-system layer, split/merge modules — if
> you believe it's an improvement. We'll compare the structure you choose against others. Just
> keep the app working and the data/navigation wired; **don't delete screens** — elevate them.

This is primarily a **front-end craft and UI/UX assignment**. The bulk of the score is the
visual and interaction quality of *every* screen — not just that data loads. The areas in play:

- **UI/UX overhaul of every existing screen (primary, heavily weighted)** — redesign all the
  screens listed below into a cohesive, polished, production-feeling product. This is where
  most of the grade lives (see [UI/UX Overhaul](#uiux-overhaul-the-main-task)).
- **A reusable design system** — build your own tokens (color, spacing, typography, radius,
  shadow) and a small library of reusable components; don't scatter magic numbers.
- **Project structure (optional, rewarded)** — improve the architecture/folder structure if you
  can justify a better one. A cleaner, scalable structure counts in your favor.
- **Seeded-bug fixing** — locate and fix the bugs in [`BUGS.md`](./BUGS.md), documenting each
  in [`BUGFIX_NOTES.md`](./BUGFIX_NOTES.md). These are secondary to the UI work.
- **Loading, error, and empty states** — every screen that blocks on a request must show a
  polished loading, a retryable error, and a designed empty state.
- **Keep the layered architecture** — UI → state → API client → backend. Reuse the existing
  API client and store; do not add a second networking path or hard-code the base URL.

Creator/upload/admin flows are **out of scope** — this assignment is consumer-facing only.
You may **not** delete or hollow out existing screens; you redesign them in place (or move them
into a better structure), keeping each one functional.

## Time Budget

Target **~2 days (~16 hours)**. The UI overhaul is the large part; budget accordingly. Fix the auth +
token-refresh bugs early so the app is usable, then spend the bulk of your time on the UI/UX of
all screens. Document anything you left unfinished in your `README.md`.

## UI/UX Overhaul (the main task)

The starter ships every screen in a **functional-but-ugly** state on purpose. We want to see
**how you design and build a real front-end**. Redesign and extend the UI/UX of **all** of the
following screens into one cohesive product. The data and navigation already work — your job is
the look, feel, interaction, and component architecture.

**Screens you must redesign (all of them):**

| Screen | What "good" looks like here |
|---|---|
| **Phone / Sign-in** (`screens/auth/PhoneScreen`) | Branded sign-in, clear input affordance, inline validation, disabled/loading states, keyboard handling |
| **OTP** (`screens/auth/OtpScreen`) | Segmented/boxed OTP input, resend countdown, attempt feedback, error states |
| **Catalog** (`screens/catalog/CatalogScreen`) | Designed game cards, grid/list, skeleton loading, smooth pagination, empty/error states |
| **Game Detail** (`screens/catalog/GameDetailScreen`) | Hero header, metadata (category/difficulty badges), video list, favorite toggle, view tracking |
| **Video Player** (`screens/video/VideoPlayerScreen`) | Player chrome, access-gate messaging, progress UI, watch-history feedback |
| **Favorites & Wishlist** (`screens/favorites/*`) | Consistent collection layout, designed empty states, quick actions |
| **Watch History** (`screens/history/WatchHistoryScreen`) | Watched list with real progress indicators, resume affordance |
| **Profile** (`screens/profile/ProfileScreen`) | Profile header/avatar, editable fields, token balance, logout, subscription state |

**Plus build a new landing surface — the Discover screen** (`screens/discover/DiscoverScreen`):
make it the initial authenticated tab, with a featured rail (`GET /games/featured`), a
continue-watching rail (`GET /watch-history`, hidden when empty), browse-by-category sections
(grouped from `GET /games` via `categoryConfig`), and a debounced search field. It must reuse
the shared API client and state, with loading/error/empty states and pull-to-refresh.

**What we grade across every screen:**

- **Visual design & taste** — layout, spacing rhythm, typography scale, color, hierarchy,
  iconography, imagery/placeholders, dark-on-light contrast. Deliberate, consistent, and
  pleasant to look at.
- **Design system** — your own tokens + reusable components (buttons, cards, inputs, badges,
  section headers, list rows, skeletons). Consistency across screens is rewarded; one-off
  styling per screen is penalized.
- **Interaction & motion** — pressed/disabled states, transitions, pull-to-refresh, skeletons
  or shimmer while loading, optimistic UI where appropriate, keyboard avoidance.
- **States everywhere** — loading, retryable error, and a *designed* empty state on every
  screen that can be empty.
- **Responsiveness & a11y** — adapts to different screen sizes/safe areas; touch targets,
  `accessibilityLabel`s, and reasonable contrast.
- **Performance** — virtualized lists (`FlatList`/`SectionList`), stable `keyExtractor`s,
  memoized rows, no re-render storms.
- **RTL/Persian** — the product is Persian; lay out and align for RTL correctly.

**Constraints:**

- Redesign screens **in place** — keep them functional and wired to the same data/navigation.
- Reuse the existing API client (`src/api/*`) and store; no second networking path, no
  hard-coded base URL.
- You may add a UI/icon/animation library (e.g. an icon set, reanimated, moti) **if you justify
  it in `README.md`** — but the design (layout, composition, visual language) must be your own.
- Document your design decisions and include **screenshots** (or a short screen recording) of
  every redesigned screen in `README.md`.

## Recommended Stack (substitutions allowed)

Use the stack that lets you move fastest while keeping a clean layered architecture (UI → state → API client → backend). The following is recommended; reasonable substitutions are accepted as long as the layering holds:

| Concern | Recommended | Accepted substitutions |
|---|---|---|
| Framework | **React Native via Expo** | Bare React Native |
| HTTP client | **axios** (single configured instance) | A `fetch` wrapper of equivalent capability |
| Auth state | **Zustand** | Redux Toolkit, React Context |
| Navigation | **React Navigation** (native stack + bottom tabs) | — |
| Token storage | **expo-secure-store** | react-native-keychain, or AsyncStorage with a stated tradeoff |
| Server state | **TanStack Query** (optional) | Manual fetch/loading/error hooks |
| Language | **TypeScript** (recommended) | JavaScript (you lose the typecheck-based criteria) |

If you substitute, briefly justify the choice in your `README.md`.

## Verified Backend Facts (must be honored)

These were confirmed against the real backend source. Build your client to match them exactly:

- **Phone format** — the backend validates `^09\d{9}$` (e.g. `09123456789`). Your client-side validation must accept this canonical form. Normalizing `+98` / `0098` prefixes to `09xxxxxxxxx` is a reasonable enhancement.
- **OTP validity** — an OTP is valid for **5 minutes** and allows a maximum of **3 verification attempts** (not 2 minutes).
- **Dev OTP is returned** — in non-production, `POST /auth/send-otp` returns the `otp` in its response body and also logs it to the server console (`📱 OTP for ...`). This means you can test the full auth flow **without a real SMS gateway**.
- **Refresh returns only an access token** — `POST /auth/refresh` takes `{ refreshToken }` and returns **only** `{ accessToken }`. There is no new refresh token; keep reusing the stored refresh token until it expires (**7 days**). Do not treat the missing refresh token in the response as an error.
- **View route needs a UUID** — `POST /games/:id/view` requires a **UUID** `id` (it uses `ParseUUIDPipe` and `OptionalJwtAuthGuard`). Call it with the game's UUID, not its slug. Auth is optional on this route.
- **Access validation shape** — `GET /videos/:id/validate-access` returns `{ hasAccess, message }`. Begin playback only when `hasAccess` is `true`; otherwise show the returned `message`.

When a response shape is not documented here, inspect the actual response (the dev OTP makes the full flow testable) rather than guessing field names. Grading is based on **behavior**, not exact field-name guesses.

## Deliverables

Submit all of the following:

- **Source code** — your completed `candidate-app/` React Native project, installable from a clean checkout, with **every screen redesigned** and the new **Discover** screen added (see [UI/UX Overhaul](#uiux-overhaul-the-main-task)).
- **`README.md`** — prerequisites and exact run commands, how to configure the backend base URL and env vars, project structure and your state-management choice, the implemented screens and the endpoints each consumes, a section on your **design system and UI/UX decisions** with **screenshots of every redesigned screen**, and links to `BUGFIX_NOTES.md` and `AI_USAGE.md`.
- **`AI_USAGE.md`** — document how you used AI tooling: whether you used an AI agent and for what, which Kiro/agent features you used (Skills, Hooks, MCP servers, Steering) by name, and an AI-generated vs hand-written split per major artifact. If you used no AI for a deliverable, say so explicitly.
- **`BUGFIX_NOTES.md`** — for each seeded bug you fix, record the root cause, the applied fix, and which parts were AI-assisted vs hand-written.
- **Git history** — see Git Workflow below.

## Seeded Bugs

The starter ships with seeded bugs spanning authentication, API integration, state management, and UI rendering. Their observable **symptoms** are listed in [`BUGS.md`](./BUGS.md) — root causes are not given. Find them, fix them, and:

- Document the root cause and fix for each in [`BUGFIX_NOTES.md`](./BUGFIX_NOTES.md).
- Commit each fix as a separate `fix:` Conventional Commit referencing the bug identifier (e.g. `fix: BUG-02 attach Bearer token correctly`).
- For each fix, note in `BUGFIX_NOTES.md` which parts were AI-assisted and which were hand-written.

## Git Workflow

- **Host your code in a public Git repository** (e.g. GitHub, GitLab) and share the link for grading.
- Develop features on dedicated feature branches; do not commit directly to the default branch.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, ...) — proper commit hygiene is graded.
- Keep each commit a single coherent, self-contained change.
- Open a pull-request-style merge into the default branch with a description summarizing the change.
- Exclude dependency directories, build artifacts, and environment secrets from all commits.

## Running the Backend

A ready-to-run **mock backend** is bundled in [`mock-backend/`](./mock-backend). It is a
zero-dependency Node server that implements the exact endpoints, request/response shapes, and
the Verified Backend Facts above — so you can build and test the app end-to-end **without**
setting up PostgreSQL, FFmpeg, or a real server. The backend contract is what matters here; you
do not modify it (treat it as a fixed external dependency).

**Prerequisites:** Node.js 18+ (no `npm install` needed for the mock — it uses only Node's
built-in modules).

```bash
cd mock-backend

# Start the server (listens on http://localhost:3000)
node server.js

# Optional: use a short access-token TTL to exercise the 401 -> refresh -> retry flow
ACCESS_TOKEN_TTL=20 node server.js
```

Once running:

- API base URL: `http://localhost:3000`
- Health check: `GET http://localhost:3000/health`
- Full endpoint list and seed data: [`mock-backend/README.md`](./mock-backend/README.md)

Point your app at the backend by setting `EXPO_PUBLIC_API_BASE_URL` in `candidate-app/.env` (see `candidate-app/.env.example`). When testing on a physical device, use your machine's LAN IP instead of `localhost`.

**Testing auth without SMS:** call `POST /auth/send-otp` with a valid `09xxxxxxxxx` number, then read the `otp` from the response body (or the server console log) and submit it to `POST /auth/verify-otp`.

## Submission Steps

1. Get the app running against the bundled mock backend.
2. Fix the seeded bugs so the app is fully usable.
3. **Redesign the UI/UX of every screen and add the Discover screen** — this is the main task.
4. Fill in `README.md` (with **screenshots of every redesigned screen**), `AI_USAGE.md`, and `BUGFIX_NOTES.md`.
5. Ensure a clean checkout installs and runs by following your own `README.md`.
6. Commit your work on feature branches with Conventional Commits, and open PR-style merges into the default branch.
7. Confirm `.gitignore` excludes `node_modules`, build artifacts, and `.env`.
8. Push your code to a **public Git repository** (with full git history) and share the repository link for grading.
