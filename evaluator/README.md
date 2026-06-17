# Evaluator-Only Materials — DO NOT HAND TO CANDIDATE

> **STOP.** Everything in this `evaluator/` directory is **evaluator-only**. It contains the
> scoring rubric internals and the seeded-bug solutions. If a candidate sees any of it, the
> assignment is compromised (they get the answer key and the grading thresholds).
>
> **This directory MUST be removed from — or withheld from — the repository before it is
> handed to a candidate.** See [`../HANDOVER.md`](../HANDOVER.md) for the exact pre-handover
> procedure.

## What lives here

| File | Audience | Why it must stay hidden |
| --- | --- | --- |
| `EVALUATION.md` | Evaluator | The 100-point rubric with full/partial/zero credit thresholds. Candidates must not optimize to the rubric. |
| `BUG_ANSWER_KEY.md` | Evaluator | Root cause + exact fix + file location for every seeded bug (`BUG-01`..`BUG-06`). This is the literal answer key for the debugging exercise (Requirement 11). |
| `GRADING_WORKSHEET.md` | Evaluator | Per-category score tally used while grading a submission. |
| `README.md` | Evaluator | This file. |

These map directly to the design's "Evaluator-facing materials" set and satisfy
**Requirement 11.2** (symptom-only bug list for the candidate; root cause/fix kept hidden) and
**Requirement 12.3** (rubric internals are evaluator-only).

## Isolation principle

The candidate-facing materials (`ASSIGNMENT.md`, `BUGS.md`, `candidate-app/`, and the
`README.md` / `AI_USAGE.md` / `BUGFIX_NOTES.md` stubs) are tracked normally and handed over.
The `evaluator/` directory is the **only** part of the repo that must be stripped before handover.

We deliberately **do not** add `evaluator/` to the repository's `.gitignore`. Doing so would stop
the evaluator's own git from tracking these files (you would lose version history on the rubric and
answer key). Instead, isolation is an explicit **pre-handover step** — see
[`../HANDOVER.md`](../HANDOVER.md) and the machine-readable [`../.handover-exclude`](../.handover-exclude).

## Quick reference: how to hand over safely

Pick one of the two supported procedures (full detail in [`../HANDOVER.md`](../HANDOVER.md)):

1. **Private `evaluator` branch (recommended):** keep this directory only on a private branch the
   candidate never receives; hand over a clean branch that does not contain `evaluator/`.
2. **Pre-handover removal:** export/copy the candidate files, or run the documented
   `git rm -r --cached evaluator/` + `rm -rf evaluator/` removal on the handover copy, then verify
   the directory is gone before sharing.

**Always verify** the handover artifact contains no `evaluator/` path and no occurrence of the
answer-key/rubric files before sending it to a candidate.
