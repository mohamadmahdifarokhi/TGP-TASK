# JamJoys Mock Backend

A **zero-dependency** stand-in for the JamJoys NestJS backend, so you can build and
run the app end-to-end without setting up PostgreSQL, FFmpeg, or the real server.

It implements the exact endpoints, request/response shapes, and the "Verified Backend
Facts" from `ASSIGNMENT.md`. Data is in-memory and resets on every restart.

## Requirements

- Node.js 18+ (uses only Node's built-in `http` and `crypto` — **no `npm install`**).

## Run

```bash
cd mock-backend
node server.js
# -> http://localhost:3000
```

Options (environment variables):

```bash
PORT=4000 node server.js            # change the port
ACCESS_TOKEN_TTL=20 node server.js  # short access-token TTL (seconds) to test
                                    # the 401 -> refresh -> retry flow quickly
```

Point the app at it by setting `EXPO_PUBLIC_API_BASE_URL` in `candidate-app/.env`
(use your machine's LAN IP instead of `localhost` when testing on a physical device).

## Sign in (no SMS needed)

1. `POST /auth/send-otp` with `{ "phoneNumber": "09123456789" }`.
2. Read the 6-digit `otp` from the response body (it is also printed to the server
   console as `📱 OTP for ...`).
3. `POST /auth/verify-otp` with `{ phoneNumber, otp }` to get your tokens.

Any valid `09xxxxxxxxx` number works; a user is created on first verify.

## Implemented endpoints

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/send-otp` | returns dev `otp`; phone must match `^09\d{9}$` |
| POST | `/auth/verify-otp` | OTP valid 5 min, max 3 attempts; returns user + tokens |
| POST | `/auth/refresh` | takes `{ refreshToken }`, returns **only** `{ accessToken }` |
| POST | `/auth/logout` | requires Bearer token |
| GET | `/auth/me` | requires Bearer token |
| GET | `/games` | paginated `{ data, total, page, limit }`; `?search=` supported |
| GET | `/games/featured` | featured list |
| GET | `/games/:slugOrId` | single game with its videos |
| POST | `/games/:id/view` | **UUID id required** (400 on a slug) |
| GET | `/videos/:id` | video metadata |
| GET | `/videos/:id/validate-access` | `{ hasAccess, message }`; premium video gated by subscription |
| GET | `/videos/:id/stream` | stream info (requires Bearer) |
| GET | `/favorites` · `/favorites/wishlist` | lists |
| GET | `/favorites/:gameId/check` | `{ isFavorite }` |
| POST/DELETE | `/favorites/:gameId` | add / remove |
| GET | `/watch-history` | watched videos (newest first) |
| POST | `/watch-history/:videoId` | record `{ progress }` |
| PATCH | `/users/me` | update profile (`displayName`, `avatar`) |
| POST | `/users/me/avatar` | multipart upload (mock ignores body) |
| GET | `/users/me/token-balance` | `{ balance }` |
| GET | `/users/me/subscription-status` | subscription state |

## Seed data

Three games (هفت‌سنگ، الک‌دولک، گل‌یا‌پوچ) with stable UUIDs and embedded videos.
هفت‌سنگ has one **premium** video to exercise the access-gate (`hasAccess: false`)
for non-subscribed users. The wishlist is pre-seeded with one game so the wishlist
screen is non-empty.

> This mock is for local development and grading only. It is not a production server
> (no real auth, no persistence, in-memory data).
