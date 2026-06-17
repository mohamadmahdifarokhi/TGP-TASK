# Handover Procedure — Isolating Evaluator Materials

> **Audience: the person preparing this repository for a candidate.**
> This is an evaluator/operator document. It is harmless if a candidate sees it (it reveals no
> rubric thresholds and no bug solutions), but its whole purpose is to make sure the candidate
> **never** receives the contents of [`evaluator/`](./evaluator/).

## What must be excluded

The single source of truth for what to strip is [`.handover-exclude`](./.handover-exclude). Today
that is exactly one path:

```
evaluator/
```

`evaluator/` contains `EVALUATION.md` (the 100-point rubric), `BUG_ANSWER_KEY.md` (root cause + fix
for every seeded bug), and `GRADING_WORKSHEET.md`. Handing any of these to a candidate defeats the
debugging exercise (Requirement 11) and the objective-grading goal (Requirement 12). Everything else
in the repo is candidate-facing and should be handed over.

> **Why not just `.gitignore` it?** Adding `evaluator/` to `.gitignore` would stop the evaluator's
> own repository from version-controlling the rubric and answer key — you'd lose history on the very
> files you most need to maintain. Isolation is therefore an explicit handover step, not a
> gitignore rule.

## Procedure A — Private `evaluator` branch (recommended)

Keep evaluator materials only on a private branch the candidate never receives.

```bash
# One-time setup (evaluator's repo): move evaluator/ onto a private branch.
git checkout -b evaluator                 # private branch that DOES contain evaluator/
git add evaluator/ .handover-exclude HANDOVER.md
git commit -m "chore: keep evaluator materials on private evaluator branch"

# Create the candidate handover branch WITHOUT evaluator/.
git checkout -b candidate-handover main   # branch from your candidate-facing base
git rm -r --cached evaluator/             # untrack on this branch only
rm -rf evaluator/                         # remove the working-tree copy on this branch
git commit -m "chore: strip evaluator-only materials for candidate handover"
```

Hand the candidate **only** the `candidate-handover` branch (or an archive built from it — see
"Verify" below). Keep `evaluator` and `main` private.

## Procedure B — Pre-handover removal on a throwaway copy

Use this when you hand over a zip/tarball or a fresh clone rather than a branch.

```bash
# Work on a disposable copy so you never mutate your evaluator repo.
git clone . /tmp/candidate-handover
cd /tmp/candidate-handover

# Remove every path listed in .handover-exclude (currently just evaluator/).
while IFS= read -r p; do
  case "$p" in ''|\#*) continue;; esac      # skip blanks and comments
  git rm -r --cached "$p" 2>/dev/null || true
  rm -rf "$p"
done < .handover-exclude

git commit -m "chore: strip evaluator-only materials for candidate handover"
```

Then build the candidate archive from this cleaned copy.

## Verify before sending (do this every time)

```bash
# 1. The directory must be gone from the working tree.
test ! -e evaluator/ && echo "OK: evaluator/ absent" || echo "FAIL: evaluator/ still present"

# 2. Git must not track it on the handover branch/copy.
git ls-files | grep -q '^evaluator/' && echo "FAIL: evaluator/ still tracked" || echo "OK: not tracked"

# 3. No stray answer-key/rubric file anywhere in what you're about to send.
grep -rli --include='*.md' 'BUG_ANSWER_KEY\|GRADING_WORKSHEET' . && echo "FAIL: answer-key reference found" || echo "OK: clean"
```

If you produced an archive, also confirm it:

```bash
git archive --format=tar HEAD | tar -t | grep -q '^evaluator/' \
  && echo "FAIL: evaluator/ in archive" || echo "OK: archive clean"
```

Only send the candidate the artifact once all checks print `OK`.

## Restoring evaluator materials for grading

When a candidate submits their work, grade it against the rubric by checking out the private
`evaluator` branch (Procedure A) or your original evaluator clone (Procedure B). The candidate's
submission contains no evaluator files, so there is nothing to merge back — you grade from your own
private copy of `evaluator/`.
