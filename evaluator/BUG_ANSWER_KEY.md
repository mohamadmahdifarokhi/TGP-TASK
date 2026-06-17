# BUG_ANSWER_KEY.md (Evaluator-Only)

> **Confidential — evaluator material.** This document is part of the evaluator-facing
> materials and **must never be included in the candidate checkout**. It reveals the root
> cause and exact fix for every seeded bug. Keep it under `evaluator/` (private branch or
> removed before handover) alongside `EVALUATION.md` and `GRADING_WORKSHEET.md`.

This is the answer key for the six seeded bugs (`BUG-01`..`BUG-06`) shipped in
`candidate-app/`. The candidate sees only the observable symptoms (in `BUGS.md`); this file
holds, per bug: the candidate-visible symptom, the exact file/location, the root cause, the
minimal correct fix, a post-fix verification step, and the correctness property the bug is
linked to.

Bug distribution spans authentication, API integration, state management, and UI rendering
(satisfies Requirement 11.1). Each fix is independently committable as a `fix:` Conventional
Commit referencing its bug ID (Requirement 11.4). Several seeded bugs flip a shipped
property-based test red; fixing the bug turns the linked property green.

| Bug | Category | File / location | Linked property |
|---|---|---|---|
| BUG-01 | Auth | `candidate-app/src/store/authStore.ts` | Property 4 |
| BUG-02 | API client (request) | `candidate-app/src/api/client.ts` (request interceptor) | Property 1 |
| BUG-03 | API client / token lifecycle | `candidate-app/src/api/client.ts` (response interceptor) | Property 5 |
| BUG-04 | State | optimistic favorites reducer (`candidate-app/src/utils/` or `src/store/`) | Property 9 |
| BUG-05 | UI / data mapping | game display mapper (`candidate-app/src/utils/`) | Property 7 |
| BUG-06 | UI / state | `candidate-app/src/screens/catalog/CatalogScreen.tsx` | Properties 6 and 10 |

---

## BUG-01 — Auth session lost on restart

- **Category:** Authentication
- **Linked property:** Property 4 (Token persistence round-trips and restores the session)
- **Validates:** Requirements 4.2, 4.3

**Symptom (candidate-visible):**
"After entering a valid OTP I'm briefly signed in, but on app restart I'm always logged out."

**Exact file / location:**
`candidate-app/src/store/authStore.ts` — the session setter action and the launch-time
hydration logic.

**Root cause:**
Tokens (`accessToken`, `refreshToken`) and `user` are written to in-memory Zustand state
only. The store never persists them to secure storage (`expo-secure-store`), and/or the
hydration step that should read them back on launch is missing or never called. Because the
in-memory store is recreated empty on each cold start, the persisted session is never
restored and `status` resolves to `unauthenticated`.

**Minimal correct fix:**
On every session mutation (set on verify-otp success, update on refresh, clear on logout),
write the tokens and user to secure storage; on app launch, hydrate the store by reading
those values back and set `status` to `authenticated` when valid tokens are present.

```ts
// On successful auth (set session):
await SecureStore.setItemAsync('accessToken', accessToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);
await SecureStore.setItemAsync('user', JSON.stringify(user));

// On launch (hydrate), called from App.tsx before rendering the navigator:
const [accessToken, refreshToken, userJson] = await Promise.all([
  SecureStore.getItemAsync('accessToken'),
  SecureStore.getItemAsync('refreshToken'),
  SecureStore.getItemAsync('user'),
]);
set({
  accessToken,
  refreshToken,
  user: userJson ? JSON.parse(userJson) : null,
  status: accessToken && refreshToken ? 'authenticated' : 'unauthenticated',
});

// On logout / clear: SecureStore.deleteItemAsync for each key.
```

**Post-fix verification:**
Sign in with a valid OTP, fully kill the app, and relaunch. The session is restored and the
app opens on the authenticated tabs without prompting for sign-in (Req 4.2 / 4.3). Property 4
goes green.

---

## BUG-02 — Malformed Bearer header → constant 401

- **Category:** API client (request interceptor)
- **Linked property:** Property 1 (Bearer header is well-formed for any token)
- **Validates:** Requirement 2.2

**Symptom (candidate-visible):**
"Protected screens always show 401 even right after signing in."

**Exact file / location:**
`candidate-app/src/api/client.ts` — the request interceptor that attaches the
`Authorization` header.

**Root cause:**
The header is built by string concatenation without the separating space, e.g.
`"Bearer" + token` → `"Bearereyx..."`. The backend cannot parse the scheme/credential, so
every protected request is rejected with 401 even with a valid access token.

**Minimal correct fix:**
Construct the header with a single space using a template literal (or `'Bearer ' + token`):

```ts
// Request interceptor
const { accessToken } = useAuthStore.getState();
if (accessToken) {
  config.headers.Authorization = `Bearer ${accessToken}`; // single space, unmodified token
}
return config;
```

**Post-fix verification:**
With a valid session, open a protected screen (favorites or profile). The request carries
`Authorization: Bearer <token>` and returns 200; data loads (Req 2.2). Property 1 goes green.

---

## BUG-03 — Logged out after ~15 minutes instead of refreshing

- **Category:** API client / token lifecycle (response interceptor)
- **Linked property:** Property 5 (A single 401 triggers exactly one refresh and one retry with the new token)
- **Validates:** Requirements 4.4, 4.5

**Symptom (candidate-visible):**
"After ~15 minutes the app logs me out instead of refreshing."

**Exact file / location:**
`candidate-app/src/api/client.ts` — the 401 response interceptor (refresh-and-retry logic).

**Root cause:**
One of two seeded variants:
1. The interceptor calls `POST /auth/refresh` and receives a new `accessToken`, but **does
   not apply that token to the retried request** (it retries with the old, still-expired
   token), so the retry 401s again and the user is dropped to sign-in; or
2. The interceptor treats the refresh response — which by design is `{ accessToken }` **only**
   (no new refresh token) — as malformed/missing a refresh token and **clears the session**.

Both stem from mishandling the backend's documented refresh contract: `POST /auth/refresh`
takes `{ refreshToken }` and returns only `{ accessToken }`; the stored refresh token must be
**reused** until it expires (7 days).

**Minimal correct fix:**
Apply the newly issued `accessToken` to the Auth_Store and to the retried request's
`Authorization` header; keep reusing the stored refresh token. Retry the original request
exactly once. Use a single in-flight refresh promise so parallel 401s share one refresh. Only
clear the session and mark `unauthenticated` if the refresh request itself fails.

```ts
// Response interceptor (401 branch), retry-once guarded by a flag:
if (error.response?.status === 401 && !original._retry) {
  original._retry = true;
  try {
    inFlightRefresh ??= authApi.refresh(useAuthStore.getState().refreshToken!);
    const { accessToken } = await inFlightRefresh; // response is { accessToken } only
    useAuthStore.getState().setAccessToken(accessToken); // refresh token unchanged/reused
    original.headers.Authorization = `Bearer ${accessToken}`; // apply NEW token to retry
    return client(original);
  } catch (refreshErr) {
    useAuthStore.getState().clearSession(); // -> unauthenticated -> sign-in
    throw toApiError(refreshErr);
  } finally {
    inFlightRefresh = null;
  }
}
```

**Post-fix verification:**
Force access-token expiry (wait out the 15-minute TTL or inject an expired token). The next
protected request transparently triggers exactly one refresh and one retry and succeeds; the
user stays signed in (Req 4.4). If refresh genuinely fails, tokens are cleared and the user
returns to sign-in (Req 4.5), with no infinite retry loop. Property 5 goes green.

---

## BUG-04 — Optimistic favorite keyed by index, no revert

- **Category:** State management
- **Linked property:** Property 9 (Optimistic favorite is keyed by gameId and reverts on failure)
- **Validates:** Requirements 8.1, 8.6

**Symptom (candidate-visible):**
"Toggling a favorite shows it as favorited, then it silently flips back / the wrong game gets
favorited."

**Exact file / location:**
The optimistic favorites reducer — `candidate-app/src/utils/` (e.g. `favoritesReducer.ts`) or
the favorites slice in `candidate-app/src/store/`.

**Root cause:**
The optimistic update locates the affected game by its **array index** (list position)
instead of by `gameId`. When the list order differs from the action's assumptions, the wrong
game's state is toggled. Additionally, the failure path does not revert: when the mutation
request fails, the optimistic change is left in place, so the UI silently disagrees with the
backend.

**Minimal correct fix:**
Key the toggle by `gameId` (never by list position), and on mutation failure revert exactly
that game's favorite state to its prior value, leaving all other games unchanged.

```ts
// Toggle keyed by gameId
function applyToggle(state: Game[], gameId: string, isFavorite: boolean): Game[] {
  return state.map(g => (g.id === gameId ? { ...g, isFavorite } : g));
}

// Optimistic apply, with revert on failure:
const prev = current.find(g => g.id === gameId)?.isFavorite ?? false;
setGames(applyToggle(current, gameId, !prev)); // optimistic
try {
  prev ? await favoritesApi.remove(gameId) : await favoritesApi.add(gameId);
} catch (e) {
  setGames(applyToggle(useGames.getState(), gameId, prev)); // revert exactly this game
  showError(e);
}
```

**Post-fix verification:**
Toggle a favorite on a game in any list position: the correct game updates and the change
persists on success. Simulate a failed mutation: only that game's control reverts to its prior
state and an error message shows; other games are untouched (Req 8.1 / 8.6). Property 9 goes
green.

---

## BUG-05 — Blank titles/categories (legacy enum fields)

- **Category:** UI / data mapping
- **Linked property:** Property 7 (Game display reads configuration fields, not legacy enums)
- **Validates:** Requirement 6.5

**Symptom (candidate-visible):**
"Game cards render blank titles/categories on the detail screen."

**Exact file / location:**
The game display mapper — `candidate-app/src/utils/` (e.g. `gameDisplay.ts` /
`gameMapper.ts`).

**Root cause:**
The mapper derives category and difficulty from the backend's **legacy enum fields**
(`category`, `difficulty`), which are absent/empty on current game objects. The current
backend exposes these as configuration objects (`categoryConfig`, `difficultyConfig`), so the
mapper reads `undefined` and renders blank.

**Minimal correct fix:**
Read category and difficulty from `categoryConfig` / `difficultyConfig` and never from the
legacy `category` / `difficulty` enum fields.

```ts
function toDisplayGame(game: Game): DisplayGame {
  return {
    id: game.id,
    title: game.title,
    thumbnail: game.thumbnail,
    category: game.categoryConfig?.name ?? game.categoryConfig?.label ?? '',
    difficulty: game.difficultyConfig?.name ?? game.difficultyConfig?.label ?? '',
  };
}
```

**Post-fix verification:**
Open the catalog and a game detail screen: titles, categories, and difficulty render with
values sourced from the `*Config` fields rather than blank (Req 6.5). Property 7 goes green.

---

## BUG-06 — Spinner never clears / crash on empty results

- **Category:** UI / state
- **Linked property:** Properties 6 and 10 (Pagination append preserves order and contents; Error view always renders a human-readable message)
- **Validates:** Requirements 5.3, 5.5, 10.4 (and pagination 5.6 / error rendering 10.2 via the linked properties)

**Symptom (candidate-visible):**
"The catalog spinner never disappears even after data loads (or it crashes on empty results)."

**Exact file / location:**
`candidate-app/src/screens/catalog/CatalogScreen.tsx` — the fetch effect and the list render.

**Root cause:**
Two coupled defects:
1. The `loading` flag is cleared only on the success path (no `finally`), so any thrown
   error — or an unexpected code path — leaves `loading` stuck `true` and the spinner hangs;
2. The list maps over the response data directly, which is `undefined` when the response is
   empty/missing, throwing on `.map` and crashing the screen instead of showing the empty
   state.

**Minimal correct fix:**
Clear `loading` in a `finally` block so it always resets regardless of success or failure,
and guard the list against `undefined` (default to `[]`) so an empty response renders the
empty state instead of crashing.

```ts
async function load() {
  setLoading(true);
  setError(null);
  try {
    const res = await gamesApi.list(params);
    setGames(prev => [...prev, ...(res.data ?? [])]); // guard undefined; preserve order
  } catch (e) {
    setError(toApiError(e));
  } finally {
    setLoading(false); // always cleared
  }
}

// Render: guard data and branch to empty state
const items = games ?? [];
// loading -> spinner; error -> StateView error+retry; items.length === 0 -> empty state; else list
```

**Post-fix verification:**
Load the catalog: the spinner clears once the request settles (success or error). Point at an
account/filter that yields zero games: the empty-state message renders with no crash
(Req 5.3 / 5.5 / 10.4). Paginating by scrolling appends pages in order with no dropped or
duplicated items. Properties 6 and 10 go green.

---

## Property ↔ bug cross-reference

| Property | Statement (abbrev.) | Linked bug |
|---|---|---|
| Property 1 | Bearer header well-formed | BUG-02 |
| Property 4 | Token persistence round-trips / restores session | BUG-01 |
| Property 5 | Single 401 → one refresh + one retry w/ new token | BUG-03 |
| Property 6 | Pagination append preserves order & contents | BUG-06 |
| Property 7 | Display reads `*Config`, not legacy enums | BUG-05 |
| Property 9 | Optimistic favorite keyed by gameId + reverts | BUG-04 |
| Property 10 | Error view always renders human-readable message | BUG-06 |

In the handed-over starter the bug-linked properties (P1, P4, P5, P6, P7, P9, P10) are
intentionally red; each goes green when the candidate fixes the corresponding bug.
