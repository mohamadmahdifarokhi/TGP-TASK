# AI Usage Log

> **Candidate template — fill this in.** This file documents how you used AI tooling
> during the assignment. It is graded against Requirement 14 (AI-Usage Tracking and
> Documentation). Be honest and specific: the evaluator uses this to assess your
> AI-assisted workflow and to verify originality.
>
> **If you used no AI tooling at all**, you must still complete this file: write
> "No" in the Summary, and for every deliverable state explicitly that no AI tooling
> was used (see Section 4). An empty or missing file scores zero for this category.
>
> Delete the `TODO` / `<...>` prompts as you fill each section in.

---

## 1. Summary

**Did you use an AI agent during this assignment?** `<Yes / No>`

- TODO: If **Yes**, give a one- or two-sentence overview of how you used it
  (e.g., which agent/tool, and roughly which parts of the work it touched).
- TODO: If **No**, state that explicitly here — e.g., "No AI agent or AI tooling was
  used for any part of this submission. All artifacts were written by hand." You can
  then leave the tables below empty but keep this statement (Req 14.6).

---

## 2. Agent usage log

One row per significant agent interaction. "Prompt intent" = what you were trying to
get the agent to do (not the verbatim prompt). "Artifact produced" = the file(s) or
output the agent generated. "Disposition" = whether you took it as-is, edited it, or
rejected it.

| #  | Task / prompt intent | Artifact produced | Accepted as-is / edited / rejected |
|----|----------------------|-------------------|------------------------------------|
| 1  | `<TODO: e.g., scaffold the API client>` | `<TODO: e.g., src/api/client.ts>` | `<as-is / edited / rejected>` |
| 2  | | | |
| 3  | | | |

> If you used no agent, write "N/A — no AI agent used" in row 1 and leave the rest blank.

---

## 3. Feature usage matrix

Record which Kiro / agent features you used. For each feature type, mark `Used?` as
`Y` or `N`. Where used, give the **name(s)** of the specific feature, the **task it
supported**, and its **observed effect** on the work (Req 14.3, 14.4).

| Feature      | Used? (Y/N) | Name(s) | Task it supported | Observed effect |
|--------------|-------------|---------|-------------------|-----------------|
| Skills       | `<Y/N>` | `<TODO>` | `<TODO>` | `<TODO>` |
| Hooks        | `<Y/N>` | `<TODO>` | `<TODO>` | `<TODO>` |
| MCP servers  | `<Y/N>` | `<TODO>` | `<TODO>` | `<TODO>` |
| Steering     | `<Y/N>` | `<TODO>` | `<TODO>` | `<TODO>` |

> For any feature you did not use, set `Used?` to `N` and leave the remaining cells
> blank (or write "none"). Do not delete the row — the evaluator checks all four.

---

## 4. AI-vs-hand-written split

For each major artifact, mark whether it was **AI-generated**, **hand-written**, or
**mixed**. If mixed, briefly note which parts were which. This is how the evaluator
distinguishes AI work from your own (Req 14.5). If you used no AI tooling, mark every
row **hand-written** (this satisfies the explicit "none" requirement per artifact,
Req 14.6).

| Artifact | AI-generated / hand-written / mixed | Notes |
|----------|-------------------------------------|-------|
| API client | `<TODO>` | `<TODO>` |
| Auth store / state management | `<TODO>` | `<TODO>` |
| Screen: `<TODO: name>` | `<TODO>` | `<TODO>` |
| Screen: `<TODO: name>` | `<TODO>` | `<TODO>` |
| Screen: `<TODO: name>` | `<TODO>` | `<TODO>` |
| Bug fix: `<TODO: bug id>` | `<TODO>` | `<TODO>` |
| Bug fix: `<TODO: bug id>` | `<TODO>` | `<TODO>` |
| README / docs | `<TODO>` | `<TODO>` |

> Add one row per screen you implemented and one row per bug you fixed. Remove unused
> placeholder rows once your artifact list is final.
