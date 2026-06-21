# JamJoys Frontend Assignment — Candidate Submission

> **Template — fill this in.** This README is part of your graded deliverables (Requirement 15).
> The evaluator will follow it on a **clean checkout** to install, configure, and run your app
> **without reading your source code**. Replace every `TODO` below with real content and delete
> these quote-block instructions when you're done.

---

## 1. Prerequisites & Run Commands

<!-- Requirement 15.1 — exact commands to install dependencies and run the app on a clean checkout. -->

> **TODO:** List everything the evaluator must have installed before running your app, with versions.
> Then give the exact, copy-pasteable commands. Examples of what to cover:
> - Node.js version, package manager (npm/yarn/pnpm), Expo CLI, and the mobile runtime
>   (Expo Go app, Android emulator, or iOS simulator) you tested against.
> - The install command and the run command(s).

**Prerequisites**

- TODO: e.g. Node.js >= 18, npm >= 9
- TODO: Expo Go on a physical device, or Android/iOS emulator
- TODO: any other tooling

**Install**

```bash
# TODO: exact install command, e.g.
# cd candidate-app && npm install
```

**Run**

```bash
# TODO: exact run command(s), e.g.
# npm start          # then scan the QR code with Expo Go
# npm run android    # launch on Android emulator
# npm run ios        # launch on iOS simulator
```

---

## 2. Backend Base URL & Environment Configuration

<!-- Requirement 15.2 — how to configure the backend base URL and any required env vars. -->

> **TODO:** Explain how the app discovers the JamJoys backend and how to point it at a running instance.
> Cover:
> - The environment variable(s) the app reads (this starter uses `EXPO_PUBLIC_API_BASE_URL`).
> - How to create the local env file from the example (`.env.example` -> `.env`).
> - The gotcha that `localhost` won't work from a physical device/emulator — a LAN IP is needed.

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Base URL of the JamJoys NestJS backend | TODO: `http://192.168.x.x:3000` |
| TODO | TODO | TODO | TODO |

```bash
# TODO: how to set it up, e.g.
# cd candidate-app && cp .env.example .env
# then edit .env and set EXPO_PUBLIC_API_BASE_URL to your machine's LAN IP
```

---

## 3. Project Structure & State Management

<!-- Requirement 15.3 — describe the project structure and the chosen state-management approach. -->

> **TODO:** Give a short tour of the folder layout (API/networking, state, navigation, screens,
> components, configuration) and state **which state-management library you used** (e.g. Zustand,
> Redux, Context) and **why**.

**Folder structure**

```text
TODO: outline the key directories, e.g.
candidate-app/src/
  api/          # TODO
  store/        # TODO
  navigation/   # TODO
  screens/      # TODO
  components/   # TODO
  config/       # TODO
  utils/        # TODO
```

**State management:** TODO — name the approach and explain in 2–3 sentences how auth/session state flows through the app.

---

## 4. Implemented Screens ↔ Backend Endpoints

<!-- Requirement 15.4 — list each implemented screen and the backend endpoints it consumes. -->

> **TODO:** Fill the table with the screens you built and the backend endpoints each one calls.
> Add or remove rows to match what you actually implemented.

| Screen | Purpose | Backend endpoint(s) consumed |
| --- | --- | --- |
| TODO: Phone / Sign-in | Send OTP to a phone number | `POST /auth/send-otp` |
| TODO: OTP | Verify the code, start session | `POST /auth/verify-otp` |
| TODO: Catalog | Browse games | `GET /games` |
| TODO: Game Detail | Game details + record view | `GET /games/:slugOrId`, `POST /games/:id/view` |
| TODO: Video Player | Play video, gate access, save progress | `GET /videos/:id`, `GET /videos/:id/validate-access`, `POST /watch-history/:videoId` |
| TODO: Favorites | List favorites | `GET /favorites` |
| TODO: Wishlist | List wishlist | `GET /favorites/wishlist` |
| TODO: Watch History | List watched videos | `GET /watch-history` |
| TODO: Profile | View/edit profile, token balance, logout | `GET /auth/me`, `PATCH /users/me`, `GET /users/me/token-balance`, `POST /auth/logout` |
| TODO: **Discover** (new) | Featured + continue-watching + browse-by-category + search | `GET /games/featured`, `GET /games`, `GET /watch-history` |

---

## 4b. Design System & UI/UX Decisions — Screenshots

<!-- This is a UI/UX-first assignment. Redesigning every screen is the main deliverable and the
     bulk of the score. Use this section to present your design system and to SHOW your work. -->

> **TODO — this is the heart of the submission.** Describe and **show** your redesign:
>
> - **Design system:** your tokens (color, spacing, typography, radius, shadow) and the reusable
>   components you built (buttons, cards, inputs, badges, section headers, list rows, skeletons).
> - **Design decisions:** the visual direction, how you handle loading/empty/error states,
>   interaction/motion, RTL/Persian layout, and any UI/icon/animation library you added (and why).
> - **Project structure:** if you reorganized the folder/architecture, explain what and why.
> - **Screenshots of EVERY redesigned screen** (Phone, OTP, Catalog, Game Detail, Video Player,
>   Favorites, Wishlist, Watch History, Profile, Discover). A short screen recording is welcome too.

| Screen | Screenshot |
| --- | --- |
| Phone / OTP | TODO |
| Catalog | TODO |
| Game Detail | TODO |
| Video Player | TODO |
| Favorites / Wishlist | TODO |
| Watch History | TODO |
| Profile | TODO |
| Discover | TODO |

---

## 5. Related Documents

<!-- Requirement 15.5 — link to the bug-fix notes file and the AI-usage log. -->

> **TODO:** Keep these links working. They point to your other required deliverables.

- Bug-fix notes: [`BUGFIX_NOTES.md`](./BUGFIX_NOTES.md) — root cause + applied fix per seeded bug
- AI-usage log: [`AI_USAGE.md`](./AI_USAGE.md) — how you used (or didn't use) AI tooling

---

## 6. Run on a Clean Checkout (Walkthrough)

<!-- Requirement 15.6 — a step-by-step walkthrough that lets the evaluator launch against the backend
     without consulting the source code. -->

> **TODO:** Write the end-to-end steps an evaluator follows starting from a fresh `git clone`,
> ending with the app running and connected to the backend. Be explicit and ordered.

1. TODO: Start the JamJoys backend and confirm it's reachable (see the assignment brief for backend setup).
2. TODO: `cd candidate-app && npm install`
3. TODO: `cp .env.example .env` and set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP.
4. TODO: `npm start` and open the app in Expo Go / an emulator.
5. TODO: Sign in with a valid Iranian phone number (`09xxxxxxxxx`); read the dev OTP from the backend response/logs.
6. TODO: Note anything else the evaluator needs to reproduce your working app.
