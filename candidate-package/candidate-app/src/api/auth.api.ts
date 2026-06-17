/**
 * Authentication resource module.
 *
 * Typed wrappers over the JamJoys backend's auth endpoints. Every screen and
 * the Auth_Store talk to auth through these functions rather than issuing
 * requests directly, so the backend contract lives in exactly one place
 * (Requirement 2.5). All requests go through the centralized {@link apiClient},
 * so the shared base URL/timeout (Requirement 2.6) and — once attached — the
 * Bearer/refresh interceptors apply uniformly.
 *
 * Each function resolves with the typed response body and, on failure, rejects
 * with a structured `ApiError` (mapped by the client's `request` wrapper /
 * `toApiError`). Callers therefore never reason about raw axios error shapes.
 *
 * Verified backend facts honored here:
 * - `POST /auth/send-otp` accepts `{ phoneNumber }` (`^09\d{9}$`); in non-prod
 *   the response includes the dev `otp` (Requirements 3.1).
 * - `POST /auth/verify-otp` accepts `{ phoneNumber, otp }` and returns the user
 *   plus access + refresh tokens (Requirement 3.4).
 * - `POST /auth/refresh` accepts `{ refreshToken }` and returns ONLY
 *   `{ accessToken }` — no new refresh token (Requirements 4.4, 4.6).
 * - `POST /auth/logout` and `GET /auth/me` require a Bearer token; `me()` is the
 *   canonical "current user" source (Requirement 9.1).
 *
 * Requirements: 2.5, 2.6, 3.1, 3.4, 4.6, 9.1
 */

import { request } from './client';
import type {
  AuthUser,
  RefreshReq,
  RefreshRes,
  SendOtpReq,
  SendOtpRes,
  VerifyOtpReq,
  VerifyOtpRes,
} from './types';

/**
 * Request an OTP for the given phone number.
 *
 * `POST /auth/send-otp` with body `{ phoneNumber }`. In non-production the
 * resolved {@link SendOtpRes} includes the dev `otp`, making the flow testable
 * without a real SMS gateway.
 *
 * Requirements: 3.1
 */
export async function sendOtp(phoneNumber: string): Promise<SendOtpRes> {
  const body: SendOtpReq = { phoneNumber };
  const res = await request<SendOtpRes>({
    method: 'POST',
    url: '/auth/send-otp',
    data: body,
  });
  return res.data;
}

/**
 * Verify the OTP for a phone number and obtain a session.
 *
 * `POST /auth/verify-otp` with body `{ phoneNumber, otp }`. Resolves with the
 * authenticated user plus the access and refresh tokens the caller persists.
 *
 * Requirements: 3.4
 */
export async function verifyOtp(
  phoneNumber: string,
  otp: string
): Promise<VerifyOtpRes> {
  const body: VerifyOtpReq = { phoneNumber, otp };
  const res = await request<VerifyOtpRes>({
    method: 'POST',
    url: '/auth/verify-otp',
    data: body,
  });
  return res.data;
}

/**
 * Exchange a refresh token for a fresh access token.
 *
 * `POST /auth/refresh` with body `{ refreshToken }`. The backend returns ONLY
 * `{ accessToken }` (no new refresh token), so callers must keep reusing the
 * stored refresh token until it expires.
 *
 * Requirements: 4.4, 4.6
 */
export async function refresh(refreshToken: string): Promise<RefreshRes> {
  const body: RefreshReq = { refreshToken };
  const res = await request<RefreshRes>({
    method: 'POST',
    url: '/auth/refresh',
    data: body,
  });
  return res.data;
}

/**
 * Invalidate the current session server-side.
 *
 * `POST /auth/logout` (requires a Bearer token). Resolves with no value.
 *
 * Requirements: 4.6
 */
export async function logout(): Promise<void> {
  await request<void>({
    method: 'POST',
    url: '/auth/logout',
  });
}

/**
 * Fetch the currently authenticated user.
 *
 * `GET /auth/me` (requires a Bearer token). This is the canonical "current
 * user" source used by the profile screen and session hydration.
 *
 * Requirements: 9.1
 */
export async function me(): Promise<AuthUser> {
  const res = await request<AuthUser>({
    method: 'GET',
    url: '/auth/me',
  });
  return res.data;
}
