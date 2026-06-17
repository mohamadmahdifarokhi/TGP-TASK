# Seeded Bugs

This starter contains **6 intentional bugs** (`BUG-01` … `BUG-06`) spanning
authentication, API integration, state management, and UI rendering. Your job is
to find and fix each one.

Only the **observable symptoms** are listed below. The root causes, file
locations, and fixes are intentionally omitted — locating them is part of the
exercise.

## Bug list

### BUG-01 — Authentication
After entering a valid OTP I'm briefly signed in, but on app restart I'm always
logged out.

### BUG-02 — API client
Protected screens always show 401 even right after signing in.

### BUG-03 — Token lifecycle
After ~15 minutes the app logs me out instead of refreshing.

### BUG-04 — State
Toggling a favorite shows it as favorited, then it silently flips back / the
wrong game gets favorited.

### BUG-05 — UI / data mapping
Game cards render blank titles/categories on the detail screen.

### BUG-06 — UI / state
The catalog spinner never disappears even after data loads (or it crashes on
empty results).

## What you must do

For each bug above:

1. **Find and fix it.** The behavior tied to the symptom must no longer occur
   after your fix.
2. **Commit each fix separately** as its own
   [Conventional Commit](https://www.conventionalcommits.org/) using the `fix:`
   type and referencing the bug identifier — for example:

   ```
   fix: persist auth tokens across restart (BUG-01)
   ```

3. **Document each fix in `BUGFIX_NOTES.md`**, recording for every bug:
   - the **root cause** you identified,
   - the **fix** you applied, and
   - the **AI-assisted vs hand-written split** (which parts were generated with
     AI tooling and which you wrote by hand).
