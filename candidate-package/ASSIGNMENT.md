# Frontend Engineering Assignment — JamJoys Mobile Client

## Context

JamJoys is a Persian platform that teaches traditional games through short videos. Users sign in with their Iranian phone number and a one-time password, browse a catalog of games, watch the associated videos, favorite and wishlist games, and track their watch history.

Your task is to work on a **React Native frontend** for JamJoys that consumes the **JamJoys backend API**. The backend is a **fixed external dependency** — you do not modify it; you build the client against its contract. A ready-to-run mock of that backend is bundled in [`mock-backend/`](./mock-backend) so you can run everything locally without a database (see [Running the Backend](#running-the-backend)). A working starter app lives in [`candidate-app/`](./candidate-app); it runs end-to-end but contains a set of **seeded bugs** that you must locate and fix (see [`BUGS.md`](./BUGS.md)).

This is a graded take-home test. It is designed to be completable in roughly **one working day (~8 hours)** by a competent React Native developer, and it is graded objectively against observable behavior and the deliverables listed below.

## Scope

The app already implements the consumer-facing screens and the supporting layers. Your job is to get it working correctly by finding and fixing the seeded bugs, and to demonstrate that you understand the codebase. The areas in play are:

- **OTP authentication** — phone entry, OTP entry, token persistence, and automatic token refresh.
- **Auth state management** — a shared store holding tokens and the current user, persisted across app restarts.
- **A centralized API client** — a single networking module that attaches auth tokens, surfaces structured errors, and handles the 401 → refresh → retry flow.
- **Core content screens** — game catalog (with pagination), game detail (with view tracking and favorite toggle), video playback (gated by access validation, with watch-history progress), favorites, wishlist, watch history, and profile.
- **Loading, error, and empty states** — every screen that blocks on a request shows a loading indicator, a retryable error state, and an empty state where applicable.
- **Seeded-bug fixing** — locate and fix the bugs in [`BUGS.md`](./BUGS.md), documenting each in [`BUGFIX_NOTES.md`](./BUGFIX_NOTES.md).

Creator/upload/admin flows are **out of scope** — this assignment is consumer-facing only.

## Time Budget

Target **~8 hours**. The scope above is sized to fit. If you run short on time, prioritize the auth + token-refresh bugs, the API client, and the catalog/detail screens. Document anything you left unfinished in your `README.md`.

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

- **Source code** — your completed `candidate-app/` React Native project, installable from a clean checkout.
- **`README.md`** — prerequisites and exact run commands, how to configure the backend base URL and env vars, project structure and your state-management choice, the implemented screens and the endpoints each consumes, and links to `BUGFIX_NOTES.md` and `AI_USAGE.md`.
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

1. Complete the app in `candidate-app/` and get it running against the backend.
2. Fill in `README.md`, `AI_USAGE.md`, and `BUGFIX_NOTES.md`.
3. Ensure a clean checkout installs and runs by following your own `README.md`.
4. Commit your work on feature branches with Conventional Commits, and open PR-style merges into the default branch.
5. Confirm `.gitignore` excludes `node_modules`, build artifacts, and `.env`.
6. Push your code to a **public Git repository** (with full git history) and share the repository link for grading.
