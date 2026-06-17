# Implementation Plan: employment-frontend (Assignment Package Authoring)

## Overview

The deliverable of this spec is **not a shipping app** — it is an **employment evaluation assignment package**. These tasks author two coordinated material sets:

1. **Candidate-facing materials**: a React Native (Expo + TypeScript) starter repo under `candidate-app/` that consumes the real JamJoys backend, is intentionally incomplete, ships a fast-check property-test suite covering the 10 correctness properties, and contains 6 documented seeded bugs (`BUG-01`..`BUG-06`); plus `ASSIGNMENT.md`, `BUGS.md` (symptom-only), and the `README.md` / `AI_USAGE.md` / `BUGFIX_NOTES.md` stubs.
2. **Evaluator-facing materials** (kept out of the candidate checkout): `EVALUATION.md` (100-point rubric), `BUG_ANSWER_KEY.md` (root cause + fix per bug), `GRADING_WORKSHEET.md`.

The authoring sequence builds a coherent layered reference (config → types → API client → auth/store → resources → pure logic → components → navigation → screens → app wiring), ships the property suite green against the correct reference, and **only then** seeds the 6 documented bugs (which intentionally turn their linked properties red in the handed-over starter). All code is TypeScript per the design's verified technology guidance.

**Verified backend facts honored throughout** (from design): phone format `^09\d{9}$`; OTP valid **5 minutes / 3 attempts**; dev `send-otp` returns the `otp` in its response and logs it; `POST /auth/refresh` returns **only** `{ accessToken }` (no new refresh token, reuse stored refresh token, 7d); `POST /games/:id/view` requires a **UUID** id (`ParseUUIDPipe`, `OptionalJwtAuthGuard`); `GET /videos/:id/validate-access` returns `{ hasAccess, message }`.

> **Note on test tasks:** The 10 property-based tests are a **shipped deliverable** of the starter (not optional verification of our authoring), so their tasks are **required** (not marked `*`). Supplementary reference unit/integration tests are marked optional (`*`). Each property is implemented by exactly one property-based test, runs ≥100 iterations on fast-check, and is tagged `Feature: employment-frontend, Property N`.

## Tasks

- [x] 1. Scaffold the candidate starter project and tooling
  - [x] 1.1 Initialize the Expo + TypeScript starter and project manifests
    - Create `candidate-app/` with `package.json` (pinned/ranged deps: expo, react-native, axios, zustand, @react-navigation/*, expo-secure-store; scripts: `start`/`android`/`ios`/`typecheck`/`test`), `app.json`/`app.config`, `tsconfig.json`, `.env.example` (`EXPO_PUBLIC_API_BASE_URL=...`), and `.gitignore` (node_modules, build artifacts, `.env`)
    - Create the `src/` directory skeleton: `config/`, `api/`, `store/`, `navigation/`, `screens/`, `components/`, `utils/`, `__tests__/`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [x] 1.2 Implement the configuration module
    - Add `src/config/` exposing the backend base URL read from `EXPO_PUBLIC_API_BASE_URL` (no hard-coded literals in screens/components) plus shared constants
    - _Requirements: 1.5, 2.6_

  - [x] 1.3 Set up the testing framework for the starter
    - Configure Jest (or Vitest) with React Native Testing Library and `fast-check`; add a test setup file and in-memory mocks for HTTP and secure storage
    - _Requirements: 1.3_

- [x] 2. Define shared API types and data models
  - [x] 2.1 Author `src/api/types.ts`
    - Encode the design data models: `SendOtpReq/Res`, `VerifyOtpReq/Res`, `AuthUser`, `RefreshReq/Res` (response is `{ accessToken }` only), `AuthState`, `Game` (with `categoryConfig`/`difficultyConfig`), `Paginated<T>`, `Video`, `ValidateAccessRes`, `FavoriteCheckRes`, `WatchHistoryItem`, `TokenBalanceRes`, and `ApiError { status, message, data? }`
    - _Requirements: 2.5, 6.5_

- [x] 3. Implement the centralized API client and interceptors
  - [x] 3.1 Implement `src/api/client.ts` core instance
    - Single configured axios instance using the config base URL; translate every non-2xx response and every transport failure (timeout, no network) into a structured `ApiError`; set a request timeout so callers never hang
    - _Requirements: 2.1, 2.3, 2.4, 2.6_

  - [x] 3.2 Implement request/response interceptors
    - Request interceptor attaches `Authorization: Bearer ${accessToken}` from the Auth_Store for protected requests; response interceptor handles 401 by calling `POST /auth/refresh` with the stored refresh token, applying the returned `accessToken`, and retrying the original request exactly once; use a single in-flight refresh promise so parallel 401s share one refresh; on refresh failure clear tokens and mark unauthenticated
    - _Requirements: 2.2, 4.4, 4.5_

  - [x] 3.3 Write property test for Bearer header construction
    - **Property 1: Bearer header is well-formed for any token**
    - Tag: `Feature: employment-frontend, Property 1`
    - **Validates: Requirements 2.2**

  - [x] 3.4 Write property test for structured error mapping
    - **Property 2: Non-2xx responses become structured errors**
    - Tag: `Feature: employment-frontend, Property 2`
    - **Validates: Requirements 2.3**

  - [x] 3.5 Write property test for refresh-and-retry sequencing
    - **Property 5: A single 401 triggers exactly one refresh and one retry with the new token**
    - Tag: `Feature: employment-frontend, Property 5`
    - **Validates: Requirements 4.4, 4.5**

- [x] 4. Implement authentication resource, phone validation, and Auth_Store
  - [x] 4.1 Implement `src/api/auth.api.ts`
    - Typed functions `sendOtp`, `verifyOtp`, `refresh`, `logout`, `me` targeting `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
    - _Requirements: 2.5, 2.6, 3.1, 3.4, 4.6, 9.1_

  - [x] 4.2 Implement Iranian phone validation/normalization util
    - `src/utils/phone.ts`: pure validation against `^09\d{9}$` and optional normalization of `+98`/`0098` prefixes to `09xxxxxxxxx`
    - _Requirements: 3.2_

  - [x] 4.3 Implement `src/store/authStore.ts` (Auth_Store)
    - Zustand store holding `accessToken`, `refreshToken`, `user`, `status`; persist tokens to `expo-secure-store`; hydrate on launch to restore an authenticated session; expose actions to set/clear session for refresh-failure and logout flows
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 4.4 Write property test for phone validation gating
    - **Property 3: Phone validation gates the backend call**
    - Tag: `Feature: employment-frontend, Property 3`
    - **Validates: Requirements 3.2**

  - [x] 4.5 Write property test for token persistence round-trip
    - **Property 4: Token persistence round-trips and restores the session**
    - Tag: `Feature: employment-frontend, Property 4`
    - **Validates: Requirements 4.2, 4.3**

- [x] 5. Checkpoint - networking and auth foundation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement remaining API resource modules and pure logic units
  - [x] 6.1 Implement remaining resource modules
    - `games.api.ts` (`list`, `featured`, `getBySlugOrId`, `recordView` with UUID id), `videos.api.ts` (`get`, `validateAccess`, `stream`), `favorites.api.ts` (`list`, `wishlist`, `add`, `remove`, `check`), `watchHistory.api.ts` (`list`, `record`), `users.api.ts` (`get`, `updateMe`, `uploadAvatar`, `tokenBalance`, `subscriptionStatus`)
    - _Requirements: 2.5, 2.6, 5.1, 6.1, 6.3, 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3_

  - [x] 6.2 Implement pagination accumulation util
    - Pure function that appends fetched pages in order with no dropped/duplicated items
    - _Requirements: 5.6_

  - [x] 6.3 Implement game display mapper
    - Pure mapper deriving category/difficulty from `categoryConfig`/`difficultyConfig`, never from legacy `category`/`difficulty` enum fields
    - _Requirements: 6.5_

  - [x] 6.4 Implement video access-gate logic
    - Pure predicate over `{ hasAccess, message }` deciding playback start vs. showing the explanatory message
    - _Requirements: 7.2, 7.3_

  - [x] 6.5 Implement optimistic favorites reducer
    - Pure reducer that toggles favorite state keyed by `gameId` (never list index) and reverts exactly the affected game on failure
    - _Requirements: 8.1, 8.6_

  - [x] 6.6 Write property test for pagination append
    - **Property 6: Pagination append preserves order and contents**
    - Tag: `Feature: employment-frontend, Property 6`
    - **Validates: Requirements 5.6**

  - [x] 6.7 Write property test for game display mapping
    - **Property 7: Game display reads configuration fields, not legacy enums**
    - Tag: `Feature: employment-frontend, Property 7`
    - **Validates: Requirements 6.5**

  - [x] 6.8 Write property test for video access gating
    - **Property 8: Video playback is gated strictly by access**
    - Tag: `Feature: employment-frontend, Property 8`
    - **Validates: Requirements 7.2, 7.3**

  - [x] 6.9 Write property test for optimistic favorite reducer
    - **Property 9: Optimistic favorite is keyed by gameId and reverts on failure**
    - Tag: `Feature: employment-frontend, Property 9`
    - **Validates: Requirements 8.1, 8.6**

- [x] 7. Implement reusable components
  - [x] 7.1 Implement `StateView` component
    - Shared loading / error+retry / empty / data states; error rendering always produces a non-empty human-readable message from an `ApiError`
    - _Requirements: 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4_

  - [x] 7.2 Implement `GameCard` component
    - Renders title and thumbnail per game, sourcing display fields via the game display mapper
    - _Requirements: 5.2, 6.5_

  - [x] 7.3 Implement `VideoPlayer` component
    - Renders the player and exposes a play gate wired to the access-gate logic
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.4 Write property test for error view rendering
    - **Property 10: Error view always renders a human-readable message**
    - Tag: `Feature: employment-frontend, Property 10`
    - **Validates: Requirements 10.2**

- [x] 8. Checkpoint - property suite green against the correct reference
  - Ensure all 10 property tests pass against the pre-bug reference, ask the user if questions arise.

- [x] 9. Implement screens and navigation
  - [x] 9.1 Implement auth screens
    - `PhoneScreen` (validate before calling `send-otp`, disable submit in-flight) and `OtpScreen` (6-digit entry, persist tokens on success, error + re-entry, disable submit in-flight)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 9.2 Implement catalog and game detail screens
    - `CatalogScreen` (list, loading, error+retry, empty, paginate on scroll) and `GameDetailScreen` (detail, fire `POST /games/:id/view` on load with UUID id, favorite toggle with optimistic revert, favorite status check)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.6_

  - [x] 9.3 Implement video player screen
    - `VideoPlayerScreen` loads `GET /videos/:id`, gates playback on `validate-access`, periodically posts `POST /watch-history/:videoId` progress
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.4 Implement favorites, wishlist, and watch-history screens
    - `FavoritesScreen`, `WishlistScreen`, `WatchHistoryScreen` with list + loading/error/empty states
    - _Requirements: 7.5, 8.4, 8.5, 10.1, 10.2, 10.3_

  - [x] 9.5 Implement profile screen
    - `ProfileScreen` shows `GET /auth/me`, edits via `PATCH /users/me`, displays `GET /users/me/token-balance`, and provides logout
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 4.6_

  - [x] 9.6 Implement navigation
    - `RootNavigator` switching auth stack vs. app tabs by auth status; `AuthStack`; `AppTabs`; guard preventing navigation to any protected screen while unauthenticated
    - _Requirements: 4.7_

  - [x] 9.7 Write example/edge component tests for the reference
    - Screen-mount endpoint calls and rendered data (happy path) plus error/empty/denied/timeout branches, using a mocked API client
    - _Requirements: 3.1, 3.3, 3.6, 5.1, 5.4, 5.5, 6.1, 6.4, 7.1, 7.3, 9.1, 9.4, 10.3, 10.4, 2.4_

  - [x] 9.8 Write integration test against a live backend
    - OTP happy path: `send-otp` (read dev `otp`) → `verify-otp` → `GET /auth/me` with the access token; optional one games-list fetch
    - _Requirements: 2.6_

- [x] 10. Wire the starter application entry point
  - [x] 10.1 Implement `App.tsx` wiring
    - Mount providers, hydrate the Auth_Store on launch, render `RootNavigator`; ensure the starter boots on a clean checkout
    - _Requirements: 1.3, 4.3, 4.7_

- [x] 11. Checkpoint - reference starter complete and boots
  - Ensure the app boots, typecheck passes, and the property suite is green before seeding bugs. Ask the user if questions arise.

- [x] 12. Seed the documented bugs into the starter
  - [x] 12.1 Seed BUG-01 (auth persistence)
    - In `authStore.ts`, break token persistence/hydration so the session is lost on restart (symptom: signed in then logged out on relaunch); links to Property 4
    - _Requirements: 11.1, 11.2_

  - [x] 12.2 Seed BUG-02 (Bearer header)
    - In the request interceptor, malform the header (e.g. `"Bearer" + token` missing the space) so protected screens 401; links to Property 1
    - _Requirements: 11.1, 11.2_

  - [x] 12.3 Seed BUG-04 (favorite keyed by index)
    - In the optimistic favorites reducer, key the update by array index instead of `gameId` and drop the failure revert; links to Property 9
    - _Requirements: 11.1, 11.2_

  - [x] 12.4 Seed BUG-05 (legacy enum fields)
    - In the game display mapper, read legacy `category`/`difficulty` instead of `categoryConfig`/`difficultyConfig` so titles/categories render blank; links to Property 7
    - _Requirements: 11.1, 11.2_

  - [x] 12.5 Seed BUG-06 (loading/empty handling)
    - In `CatalogScreen`, leave `loading` uncleared (no `finally`) and map over possibly-`undefined` data so the spinner hangs / crashes on empty; links to Properties 6 and 10
    - _Requirements: 11.1, 11.2_

  - [x] 12.6 Seed BUG-03 (token refresh)
    - In the response interceptor, fail to apply the new `accessToken` to the retried request (or mistreat the `{ accessToken }`-only refresh response as missing a refresh token and clear the session); symptom: logged out after ~15 minutes instead of refreshing; links to Property 5
    - _Requirements: 11.1, 11.2_

- [x] 13. Author candidate-facing markdown deliverables
  - [x] 13.1 Write `ASSIGNMENT.md` (brief)
    - Context, scope, ~8h budget, recommended stack with allowed substitutions, deliverables, submission steps, how to run the JamJoys backend, and the verified backend facts (5min/3-attempt OTP, dev OTP in response, refresh returns only `accessToken`, view route needs UUID)
    - _Requirements: 12.4_

  - [x] 13.2 Write `BUGS.md` (symptom-only seeded-bug list)
    - List `BUG-01`..`BUG-06` with observable symptoms only, no root cause or fix
    - _Requirements: 11.1, 11.2_

  - [x] 13.3 Write `README.md` stub (candidate template)
    - Heading scaffold mapping 1:1 to Requirement 15: prerequisites & run commands, base URL/env config, structure + state choice, screens↔endpoints, links to `BUGFIX_NOTES.md` and `AI_USAGE.md`, clean-checkout walkthrough
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 13.4 Write `AI_USAGE.md` stub (candidate template)
    - Summary (used agent? yes/no), agent usage log table, Skills/Hooks/MCP/Steering feature matrix with name + effect, AI-vs-hand split per artifact, explicit "none" guidance
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 13.5 Write `BUGFIX_NOTES.md` stub (candidate template)
    - Per-bug sections for root cause, applied fix, and the AI-assisted vs hand-written split
    - _Requirements: 11.3, 11.6_

- [x] 14. Author evaluator-facing materials (excluded from candidate checkout)
  - [x] 14.1 Write `EVALUATION.md` (standalone 100-point rubric)
    - Grading instructions plus the nine scored categories summing to 100 (setup 10, API client 10, auth+state 20, screens 25, error/loading 10, bug-fixing 10, git 5, AI-usage 5, README 5), each with observable full-credit / partial-credit / zero conditions; stretch goals recorded separately without exceeding 100
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 14.2 Write `BUG_ANSWER_KEY.md` (evaluator-only)
    - For each `BUG-01`..`BUG-06`: symptom, exact file/location, root cause, minimal correct fix, post-fix verification step
    - _Requirements: 11.5_

  - [x] 14.3 Write `GRADING_WORKSHEET.md`
    - Per-category score tally with notes and a stretch-goals section
    - _Requirements: 12.1, 12.2_

  - [x] 14.4 Configure evaluator-material isolation
    - Place evaluator docs under `evaluator/` and document/configure their exclusion from the candidate checkout (private branch or pre-handover removal) so candidates never receive rubric internals or bug solutions
    - _Requirements: 11.2, 12.3_

- [x] 15. Final checkpoint - package complete
  - Confirm candidate starter installs/boots/typechecks, property suite ships with bug-linked properties red as intended, all candidate docs present, and evaluator materials isolated. Ensure all (non-bug-linked) tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster minimum package.
- The 10 property tests are required because the property suite is a shipped deliverable of the starter, not optional verification of our authoring.
- Each correctness property is implemented by exactly one fast-check property test, runs ≥100 iterations, mocks external I/O, and is tagged `Feature: employment-frontend, Property N`.
- Bug seeding (Task 12) happens **after** the reference and property suite are complete; in the handed-over starter the bug-linked properties (P1/P5, P3, P4, P6/P10, P7, P9) are intentionally red and go green when the candidate fixes the corresponding bug.
- Each task references specific requirement sub-clauses for traceability; checkpoints provide incremental validation.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "13.1", "13.2", "13.3", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4"] },
    { "id": 2, "tasks": ["3.1", "4.2", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 3, "tasks": ["3.2", "4.1", "4.3", "6.1", "7.1", "7.2", "7.3"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "4.4", "4.5", "6.6", "6.7", "6.8", "6.9", "7.4"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 6, "tasks": ["9.7", "9.8", "10.1"] },
    { "id": 7, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5"] },
    { "id": 8, "tasks": ["12.6"] }
  ]
}
```
