---
name: write-test-plan
description: Draft or update the <TestPlan> block on a docs page for the doc-testing tool. Use when a page needs a test plan, when a page's procedure changed and its plan is stale, or when asked to "write a test plan" or "make this page testable".
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash
argument-hint: "[page path or docs URL]"
effort: high
---

# Write a doc-testing test plan

**STUB.** Only the section below is written. The rest of this skill (how to read a page's routes, turn
each documented step into a verb, and choose assertions) is not yet built. The grammar itself is
documented in `src/components/TestPlan.astro` — read that first; it is the authoritative verb set.

## Routes not to script, and why

Do not write steps for these, and do not write a marker saying you skipped them. A route the tool
cannot drive simply gets no steps: absence of steps IS the skip. A per-page skip marker only records
what the author remembered to declare, so a plan with three honest skips reads as more complete than
one that quietly ignored four routes, and nothing can check that a stated reason is still true.

These are limits of the walker, not of any one page, so they are listed once here:

- **Data view / PopSQL.** A cross-origin iframe the walker cannot reach inside. When a page documents
  both a Data view route and another route for the same SQL, script the other route: the statements
  still get exercised and only the route goes untested.
- **High-availability configuration.** Neither SQL nor `tiger service get` exposes the replication
  strategy, so a plan can prove the controls worked but not that the setting changed. Script the
  clicks, and do not try to assert the outcome until the tool grows an `expect label` verb.
- **Drag-and-drop targets and unlabelled icons.** `[resolve: <hint>]` is the escape hatch. A hint with
  no resolver behind it is reported rather than run, so only reach for it when there is genuinely no
  label to name.

## Open questions for when this skill is built

- Which assertion belongs with which kind of step. The mechanical pairs so far: a hypertable →
  `timescaledb_information.hypertables`, a continuous aggregate → `continuous_aggregates`, a policy →
  `timescaledb_information.jobs` (assert `schedule_interval`, so a wrong documented value fails).
- The last 20% of a plan cannot be derived from the page. Confirm dialogs, a panel that covers a form,
  a submit that stays disabled until something changes: all three were found by RUNNING, not reading.
  So the loop is draft → run → fix, and the skill's job ends at the draft.
