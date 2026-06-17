/**
 * Users resource module.
 *
 * Typed functions for the JamJoys users endpoints. Calls route through the
 * shared {@link request} helper so failures surface as a structured `ApiError`
 * (Requirement 2.3) and the 401 refresh/retry interceptor applies uniformly.
 * Each function returns the parsed `response.data`.
 *
 * Routes (targeted exactly as published — Requirement 2.6):
 * - `get`                → `GET   /users/:id`
 * - `updateMe`           → `PATCH /users/me`
 * - `uploadAvatar`       → `POST  /users/me/avatar`            (multipart `file`)
 * - `tokenBalance`       → `GET   /users/me/token-balance`     → `{ balance }`
 * - `subscriptionStatus` → `GET   /users/me/subscription-status`
 *
 * Requirements: 2.5, 2.6, 9.1, 9.2, 9.3
 */

import { request } from './client';
import type { AuthUser, TokenBalanceRes } from './types';

/** Editable subset of the current user's profile for `PATCH /users/me`. */
export type UpdateMePatch = Partial<Pick<AuthUser, 'avatar'>> & {
  [key: string]: unknown;
};

/**
 * A file to upload as the avatar. In React Native a multipart file part is
 * `{ uri, name, type }`; a browser/test environment may pass a `Blob`/`File`.
 */
export type AvatarFile =
  | { uri: string; name: string; type: string }
  | Blob;

/** `GET /users/:id` — fetch a user by id. */
export async function get(id: string): Promise<AuthUser> {
  const res = await request<AuthUser>({
    method: 'GET',
    url: `/users/${encodeURIComponent(id)}`,
  });
  return res.data;
}

/** `PATCH /users/me` — update the current user's profile with changed fields. */
export async function updateMe(patch: UpdateMePatch): Promise<AuthUser> {
  const res = await request<AuthUser>({
    method: 'PATCH',
    url: '/users/me',
    data: patch,
  });
  return res.data;
}

/**
 * `POST /users/me/avatar` — upload a new avatar image as multipart form data
 * under the `file` field.
 */
export async function uploadAvatar(file: AvatarFile): Promise<AuthUser> {
  const form = new FormData();
  // The cast keeps both the RN `{ uri, name, type }` part and web `Blob`
  // shapes acceptable to FormData across environments.
  form.append('file', file as unknown as Blob);

  const res = await request<AuthUser>({
    method: 'POST',
    url: '/users/me/avatar',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** `GET /users/me/token-balance` — current token balance. */
export async function tokenBalance(): Promise<TokenBalanceRes> {
  const res = await request<TokenBalanceRes>({
    method: 'GET',
    url: '/users/me/token-balance',
  });
  return res.data;
}

/**
 * `GET /users/me/subscription-status` — current subscription status.
 *
 * The response shape is not part of the assignment contract, so it is returned
 * untyped (`unknown`) for the caller to interpret.
 */
export async function subscriptionStatus(): Promise<unknown> {
  const res = await request<unknown>({
    method: 'GET',
    url: '/users/me/subscription-status',
  });
  return res.data;
}

export const usersApi = {
  get,
  updateMe,
  uploadAvatar,
  tokenBalance,
  subscriptionStatus,
};

export default usersApi;
