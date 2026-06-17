# Requirements Document

## Introduction

This document specifies an **employment evaluation assignment** (a graded take-home test). The candidate must build a complete, production-quality mobile frontend in **React Native** that consumes the real JamJoys NestJS backend API. JamJoys is a Persian platform that teaches traditional games through short videos; the candidate's application is a fresh React Native frontend inspired by JamJoys, built in `/home/tgp-dev/Documents/TGP-TASK`.

The assignment is scoped to be completable in **one working day (approximately 8 hours)** by a competent React Native developer. It is designed to be **objectively gradeable**: each requirement below carries acceptance criteria that an evaluator can verify, and Requirement 12 defines the scoring rubric.

The assignment intentionally measures four dimensions: (1) frontend engineering quality, (2) integration with a real, non-trivial authentication-protected API, (3) debugging and problem-solving via a set of seeded bugs the candidate must find and fix, and (4) the candidate's use of AI tooling (the AI agent, Skills, Hooks, MCP servers, and Steering) including how that use is documented.

This document defines **what** the candidate must deliver and **how** it will be graded. It is solution-free: it does not prescribe component-level implementation, only observable behavior and verifiable deliverables.

## Glossary

- **Assignment**: The complete graded take-home test defined by this document.
- **Candidate**: The person completing the Assignment.
- **Candidate_App**: The React Native mobile application the Candidate builds in `/home/tgp-dev/Documents/TGP-TASK`.
- **Evaluator**: The person who grades the Candidate's submission against the rubric in Requirement 12.
- **Backend**: The existing JamJoys NestJS API server located at `/home/tgp-dev/Projects/JamJoys/backend`, exposing the documented HTTP endpoints. It is treated as a fixed, external dependency.
- **API_Client**: The networking layer inside the Candidate_App responsible for issuing HTTP requests to the Backend, attaching auth tokens, and handling responses and errors.
- **Auth_Store**: The state-management module inside the Candidate_App that holds authentication state (tokens, current user, authentication status).
- **Access_Token**: The short-lived (15-minute) JWT issued by the Backend and required for protected requests.
- **Refresh_Token**: The long-lived (7-day) token issued by the Backend, used to obtain a new Access_Token.
- **OTP**: A 6-digit one-time password sent to an Iranian phone number, valid for 2 minutes, with a maximum of 3 verification attempts.
- **Protected_Screen**: Any screen in the Candidate_App that requires an authenticated session to view.
- **Public_Screen**: Any screen viewable without an authenticated session.
- **Game**: A catalog item returned by the Backend games endpoints.
- **Video**: A short video associated with a Game, returned by the Backend videos endpoints.
- **Seeded_Bug**: A defect intentionally introduced into a provided starter artifact that the Candidate must locate and fix.
- **AI_Usage_Log**: The document in which the Candidate records how AI tooling (agent, Skills, Hooks, MCP, Steering) was used during the Assignment.
- **README**: The `README.md` deliverable at the root of the Candidate_App describing setup, architecture, and usage.
- **Conventional_Commit**: A git commit message following the Conventional Commits specification (e.g., `feat:`, `fix:`, `chore:`, `docs:`).
- **Submission**: The complete set of deliverables (source code, git history, README, AI_Usage_Log, and bug-fix notes) the Candidate provides for grading.

---

## Requirements

### Requirement 1: Project Setup and Structure

**User Story:** As an Evaluator, I want the Candidate_App to be a well-organized React Native project, so that I can assess professional project structure and run the application reliably.

#### Acceptance Criteria

1. THE Candidate_App SHALL be implemented using React Native as the application framework.
2. THE Candidate_App SHALL include a dependency manifest (`package.json`) that declares all runtime and development dependencies with pinned or explicitly ranged versions.
3. WHEN the Evaluator runs the documented install command in a clean checkout, THE Candidate_App SHALL install all dependencies without manual file edits.
4. THE Candidate_App SHALL organize source code into separated concerns including at minimum: API/networking, state management, navigation, screens, reusable components, and configuration.
5. THE Candidate_App SHALL read the Backend base URL from an environment configuration file rather than from hard-coded literals embedded in screen or component logic.
6. THE Candidate_App SHALL include a `.gitignore` that excludes dependency directories, build artifacts, and local environment secrets from version control.
7. WHERE the project uses TypeScript, THE Candidate_App SHALL compile without type errors using the project's configured compiler settings.

### Requirement 2: API Client Layer

**User Story:** As a Candidate, I want a centralized API client, so that all Backend communication is consistent, testable, and maintainable.

#### Acceptance Criteria

1. THE API_Client SHALL be implemented as a single, reusable module that all screens use for Backend communication.
2. WHEN a request targets a Protected_Screen endpoint, THE API_Client SHALL attach the current Access_Token in the HTTP `Authorization` header as a Bearer token.
3. WHEN the Backend returns a non-2xx HTTP status, THE API_Client SHALL surface a structured error containing the HTTP status code and the Backend error message.
4. WHEN a request times out or the network is unavailable, THE API_Client SHALL return an error result rather than leaving the caller waiting indefinitely.
5. THE API_Client SHALL expose typed request functions for each Backend resource group used by the Candidate_App (auth, games, videos, favorites, watch-history, users).
6. THE API_Client SHALL target the Backend routes exactly as published, including `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/refresh`, `GET /auth/me`, `GET /games`, `GET /games/:slugOrId`, `GET /videos/:id`, `GET /favorites`, `POST /watch-history/:videoId`, and `PATCH /users/me`.

### Requirement 3: OTP Authentication

**User Story:** As a user of the Candidate_App, I want to sign in with my phone number and a one-time password, so that I can access protected content without managing a password.

#### Acceptance Criteria

1. WHEN the user submits a phone number on the sign-in screen, THE Candidate_App SHALL call `POST /auth/send-otp` with the entered phone number.
2. IF the entered phone number does not match a valid Iranian phone format, THEN THE Candidate_App SHALL display a validation message and SHALL NOT call the Backend.
3. WHEN the Backend confirms the OTP was sent, THE Candidate_App SHALL display an OTP entry screen accepting a 6-digit code.
4. WHEN the user submits a 6-digit OTP, THE Candidate_App SHALL call `POST /auth/verify-otp` with the phone number and code.
5. WHEN the Backend returns Access_Token and Refresh_Token after OTP verification, THE Auth_Store SHALL persist both tokens and mark the session as authenticated.
6. IF the Backend rejects the OTP as invalid or expired, THEN THE Candidate_App SHALL display an error message and SHALL allow the user to re-enter the code.
7. WHILE an OTP send or verify request is in flight, THE Candidate_App SHALL disable the submit control to prevent duplicate submissions.

### Requirement 4: Authentication State Management and Token Lifecycle

**User Story:** As a user of the Candidate_App, I want my session to persist and refresh automatically, so that I stay signed in across app restarts and token expiry.

#### Acceptance Criteria

1. THE Auth_Store SHALL be implemented using a dedicated state-management approach (for example Zustand, Redux, or React Context) shared across the Candidate_App.
2. THE Auth_Store SHALL persist the Access_Token and Refresh_Token to device storage so that the session survives an application restart.
3. WHEN the Candidate_App launches with a persisted valid session, THE Candidate_App SHALL restore the authenticated state without requiring the user to sign in again.
4. WHEN a protected request fails with HTTP 401 due to an expired Access_Token, THE API_Client SHALL call `POST /auth/refresh` with the Refresh_Token and retry the original request once with the new Access_Token.
5. IF the refresh request fails, THEN THE Auth_Store SHALL clear all tokens and THE Candidate_App SHALL return the user to the sign-in screen.
6. WHEN the user selects logout, THE Candidate_App SHALL call `POST /auth/logout`, clear all persisted tokens from device storage, and return to the sign-in screen.
7. WHILE the session is unauthenticated, THE Candidate_App SHALL prevent navigation to any Protected_Screen.

### Requirement 5: Game Catalog Browsing

**User Story:** As a user of the Candidate_App, I want to browse the catalog of games, so that I can discover content to watch.

#### Acceptance Criteria

1. WHEN the catalog screen opens, THE Candidate_App SHALL call `GET /games` and display the returned games as a scrollable list.
2. THE Candidate_App SHALL display, for each listed Game, at minimum its title and thumbnail image.
3. WHILE the catalog request is in flight, THE Candidate_App SHALL display a loading indicator.
4. IF the catalog request fails, THEN THE Candidate_App SHALL display an error state with a control that retries the request.
5. WHEN the catalog response contains zero games, THE Candidate_App SHALL display an empty-state message.
6. WHERE the Backend response is paginated, THE Candidate_App SHALL request and append additional pages as the user scrolls to the end of the list.

### Requirement 6: Game Detail and View Tracking

**User Story:** As a user of the Candidate_App, I want to open a game to see its details and videos, so that I can decide what to watch.

#### Acceptance Criteria

1. WHEN the user selects a Game from the catalog, THE Candidate_App SHALL call `GET /games/:slugOrId` and display the returned game detail.
2. THE Candidate_App SHALL display, on the detail screen, the Game title, description, and the list of associated Videos.
3. WHEN the detail screen finishes loading a Game, THE Candidate_App SHALL call `POST /games/:id/view` to record the view.
4. IF the detail request fails, THEN THE Candidate_App SHALL display an error state with a retry control.
5. THE Candidate_App SHALL read Game attributes from the Backend's configuration-object fields (for example `categoryConfig`, `difficultyConfig`) rather than from legacy enum fields.

### Requirement 7: Video Playback and Watch History

**User Story:** As a user of the Candidate_App, I want to watch a game's video and have my progress saved, so that I can resume later.

#### Acceptance Criteria

1. WHEN the user selects a Video, THE Candidate_App SHALL call `GET /videos/:id` to load the video metadata and render a video player.
2. WHEN the user plays a Video that requires access validation, THE Candidate_App SHALL call `GET /videos/:id/validate-access` and SHALL only begin playback when access is granted.
3. IF access to a Video is denied, THEN THE Candidate_App SHALL display a message explaining that access is unavailable.
4. WHILE a Video is playing, THE Candidate_App SHALL periodically call `POST /watch-history/:videoId` to record playback progress.
5. WHEN the user opens the watch-history screen, THE Candidate_App SHALL call `GET /watch-history` and display the previously watched Videos.

### Requirement 8: Favorites and Wishlist

**User Story:** As a user of the Candidate_App, I want to favorite or wishlist games, so that I can find them again quickly.

#### Acceptance Criteria

1. WHEN the user activates the favorite control on a Game, THE Candidate_App SHALL call `POST /favorites/:gameId`.
2. WHEN the user deactivates the favorite control on a Game, THE Candidate_App SHALL call `DELETE /favorites/:gameId`.
3. WHEN a Game detail screen opens, THE Candidate_App SHALL call `GET /favorites/:gameId/check` and reflect the returned favorite status in the favorite control.
4. WHEN the user opens the favorites screen, THE Candidate_App SHALL call `GET /favorites` and display the favorited games.
5. WHEN the user opens the wishlist screen, THE Candidate_App SHALL call `GET /favorites/wishlist` and display the wishlisted games.
6. IF a favorite or wishlist mutation fails, THEN THE Candidate_App SHALL revert the control to its prior state and display an error message.

### Requirement 9: User Profile

**User Story:** As a user of the Candidate_App, I want to view and update my profile, so that I can manage my account.

#### Acceptance Criteria

1. WHEN the profile screen opens, THE Candidate_App SHALL call `GET /auth/me` and display the current user's profile information.
2. WHEN the user submits profile edits, THE Candidate_App SHALL call `PATCH /users/me` with the changed fields and reflect the updated values on success.
3. WHEN the profile screen opens, THE Candidate_App SHALL call `GET /users/me/token-balance` and display the user's current token balance.
4. IF a profile read or update request fails, THEN THE Candidate_App SHALL display an error message and retain the last known values.

### Requirement 10: Loading, Error, and Empty State Handling

**User Story:** As a user of the Candidate_App, I want clear feedback during loading, errors, and empty results, so that the application feels reliable.

#### Acceptance Criteria

1. WHILE any Backend request that blocks a screen's primary content is in flight, THE Candidate_App SHALL display a loading indicator on that screen.
2. IF a Backend request fails, THEN THE Candidate_App SHALL display a human-readable error message describing the failure.
3. WHERE a screen displays a list that returns zero items, THE Candidate_App SHALL display an empty-state message specific to that screen.
4. THE Candidate_App SHALL remain operable (no unhandled crash) when any single Backend request returns an error response.

### Requirement 11: Seeded-Bug Fixing Exercise

**User Story:** As an Evaluator, I want the Candidate to find and fix a set of seeded bugs, so that I can assess debugging and problem-solving skills.

#### Acceptance Criteria

1. THE Assignment SHALL provide a starter artifact containing at least five Seeded_Bugs spanning authentication, API integration, state management, and UI rendering.
2. THE Assignment SHALL document, in a dedicated bug-list file, the observable symptom of each Seeded_Bug without revealing its root cause or fix.
3. WHEN the Candidate fixes a Seeded_Bug, THE Candidate SHALL record the root cause and the applied fix in a bug-fix notes file.
4. THE Candidate SHALL commit each Seeded_Bug fix as a separate Conventional_Commit using the `fix:` type that references the corresponding bug identifier.
5. WHEN the Evaluator runs the Candidate_App after the fixes, THE behavior associated with each documented symptom SHALL no longer occur.
6. THE bug-fix notes file SHALL distinguish, for each fix, the parts that were AI-assisted from the parts that were hand-written.

### Requirement 12: Grading Rubric

**User Story:** As an Evaluator, I want an objective scoring rubric, so that I can rate Submissions consistently and fairly.

#### Acceptance Criteria

1. THE Assignment SHALL be scored out of 100 points allocated across these categories: project setup and structure (10), API client layer (10), authentication and state management (20), core screens and features (25), error and loading handling (10), seeded-bug fixing (10), git workflow (5), AI-usage documentation (5), and README quality (5).
2. THE Assignment SHALL define, for each scoring category, the observable conditions that distinguish a full-credit Submission from a partial-credit Submission.
3. WHEN a Submission omits a deliverable required by Requirements 1 through 11, THE Evaluator SHALL assign zero points for the affected category.
4. THE Assignment SHALL be scoped so that a competent React Native developer can satisfy Requirements 1 through 11 within approximately eight hours.
5. WHERE the Candidate completes optional stretch goals defined in the Assignment, THE Evaluator SHALL record them separately without exceeding the 100-point maximum.

### Requirement 13: Git Workflow

**User Story:** As an Evaluator, I want the Candidate to follow professional git practices, so that I can assess collaboration and version-control discipline.

#### Acceptance Criteria

1. THE Candidate SHALL develop features on dedicated feature branches rather than committing directly to the default branch.
2. THE Candidate SHALL author commit messages following the Conventional_Commit specification.
3. THE Candidate SHALL produce a git history in which each commit represents one coherent, self-contained change.
4. WHEN the Candidate completes a feature branch, THE Candidate SHALL open a pull-request-style merge into the default branch with a description summarizing the change.
5. THE Candidate SHALL exclude dependency directories, build artifacts, and environment secrets from all commits.

### Requirement 14: AI-Usage Tracking and Documentation

**User Story:** As an Evaluator, I want the Candidate to document how they used AI tooling, so that I can assess their AI-assisted workflow and verify originality.

#### Acceptance Criteria

1. THE Candidate SHALL maintain an AI_Usage_Log file as a deliverable in the Submission.
2. THE AI_Usage_Log SHALL record whether the AI agent was used and, for each significant use, the prompt intent and the artifact the agent produced.
3. THE AI_Usage_Log SHALL record which Kiro/agent features were used among Skills, Hooks, MCP servers, and Steering, including the name of each feature used.
4. WHERE a Skill, Hook, MCP server, or Steering file was used, THE AI_Usage_Log SHALL describe the task it supported and its observed effect on the work.
5. THE AI_Usage_Log SHALL distinguish, per feature or per major artifact, the work generated by AI tooling from the work written by hand.
6. IF the Candidate used no AI tooling for a given deliverable, THEN THE AI_Usage_Log SHALL state that explicitly for that deliverable.

### Requirement 15: README Deliverable

**User Story:** As an Evaluator, I want a complete README, so that I can set up, run, and understand the Candidate_App without external help.

#### Acceptance Criteria

1. THE README SHALL document the prerequisites and exact commands required to install dependencies and run the Candidate_App.
2. THE README SHALL document how to configure the Backend base URL and any required environment variables.
3. THE README SHALL describe the project structure and the chosen state-management approach.
4. THE README SHALL list the implemented screens and the Backend endpoints each screen consumes.
5. THE README SHALL link to the bug-fix notes file and the AI_Usage_Log.
6. WHEN the Evaluator follows the README on a clean checkout, THE Evaluator SHALL be able to launch the Candidate_App against the Backend without consulting the source code.
