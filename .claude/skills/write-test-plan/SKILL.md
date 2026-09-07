---
name: write-test-plan
description: Draft or update the <TestPlan> block on a docs page for the doc-testing tool. Use when a page needs a test plan, when a page's procedure changed and its plan is stale, or when asked to "write a test plan" or "make this page testable".
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash
argument-hint: "[page path or docs URL]"
effort: high
---

# Write a doc-testing test plan

A plan is a bot-facing script of the same flow the page documents. The tool runs it against the live
Tiger Console and a real service, and every failing step means something on the page is wrong.

**Read `src/components/TestPlan.astro` before writing anything.** It is the authoritative verb set,
and it is kept current; this skill is the method, not the grammar.

Your job ends at a draft that lints and has been run once. **The last fifth of a plan cannot be
derived from the page** — confirmation dialogs, a panel that covers a form, a submit that stays
disabled until something changes. All three were found by running, not reading. Draft, run, fix.

## Method

1. **Read the whole page, following partials.** Steps often live in `src/partials/_*.mdx`; the tool
   inlines them, so the plan must cover them. `resolvePage` in the tool does the same resolution if
   you want to see exactly what it sees.

2. **List the page's routes.** A `<Tabs>` block is a set of alternatives for the same outcome (psql
   vs Console vs Data view). A plan is ONE linear script, so it walks each testable route in turn and
   **undoes what a route created before the next one runs** — two routes that build the same table
   will collide on "already exists" otherwise. That undo is ordinary steps, in order, where a reader
   of the plan can see them.

3. **Decide isolation.** If any step creates, deletes, or alters anything at service level, step 1 is
   `fork the service`. Without it the run uses the standing service and refuses every destructive
   step. There is nothing to write for the project-level case: not forking is the default.

4. **Fetch what the page tells the reader to download.** `download <url>` as a step. Archives are
   unzipped, the folder becomes psql's working directory and the source for `upload`.

5. **Transcribe each route's steps into verbs, in the page's own order.** Use the page's own labels
   and its own statements, written out. Two rules with teeth:
   - **Name the kind of control when a label is ambiguous**: `click tab \`Hypertables\``. The Explorer
     has a `Hypertables` tab and a sidebar filter button of the same name, and the tool tries
     `button` before `tab`.
   - **`go to <path>` is positioning, never a test.** Navigating by URL proves nothing about the nav
     labels the page promises. Use it to reach or reset state; use documented clicks for the claim
     under test, and `expect url` to turn "the label was clickable" into "the documented path works".
   - **`use the row for $X` pins for the NEXT step only.** Put it immediately before the step that
     needs it, with nothing in between, and repeat it before every further row action — the members
     plan pins twice, once before each. Only the first click of the following step is scoped to
     the row, because a row's `⋮` menu and its confirm dialog render in portals outside the row.
   - **Expect a confirm dialog after any row action, and give it its own step.** Every destructive
     row action in the Console opens one, and the pages routinely stop before it. `Resend invitation`
     opens a `Resend invitation` dialog that waits for `Resend`; without that step the modal stays
     open and covers the table, so every later step in the plan acts on nothing. Finding this fixed
     the PAGE as well as the plan.

6. **Add assertions.** `run SQL:` only fails when a statement ERRORS, so a `SELECT` over an empty
   table passes: without assertions a plan can walk an entire ingest route, load nothing, and report
   a pass. The mechanical pairs:

   | the step created | assert |
   |---|---|
   | a table or hypertable | `expect rows: SELECT 1 FROM <table> LIMIT 1` |
   | a hypertable specifically | `expect rows: SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = '<t>'` |
   | a continuous aggregate | `expect rows: SELECT 1 FROM timescaledb_information.continuous_aggregates WHERE view_name = '<v>'` |
   | a policy | `expect rows: SELECT 1 FROM timescaledb_information.jobs WHERE proc_name = '<proc>' AND <the documented interval>` |
   | a drop, before a route rebuilds the same object | `expect no rows: …` |

   **Assert only what the page claims.** The tool tests the docs, not the product: if a documented
   control is there and responds, the page is right, and a setting that then fails to take effect is a
   Console bug. So the assertions worth writing are the ones that check a documented VALUE — a policy
   assertion checking `schedule_interval = INTERVAL '3 hours'` fails when the page's number is wrong,
   which is exactly a docs bug. An existence check earns its place where the page states the outcome
   ("the wizard creates a hypertable containing the data"), and `expect label` where the page states
   what the interface will say (the members table groups people into `Meeting policy` and `Not meeting
   policy`).

   The high-availability section is the clearest case of NOT asserting: the page documents a click
   path and promises nothing about what the setting becomes, so the click path is the whole claim.

   **A plan whose steps are all clicks needs an assertion at the END, without exception.** A click
   step is the weakest evidence a plan can carry: it says a control was found and pressed, not that
   anything happened. That is not a hypothetical — for a stretch of the tool's history every
   unresolvable click reported green, and the plans that stayed honest through it were the ones whose
   last step was an `expect`. On a page with no SQL behind it (project members, and anything else at
   project scope) the closing assertion is the only thing standing between you and a plan that walks
   twelve steps, changes nothing, and passes. Assert the end state you created is gone, or that the
   thing you made is named on the page.

7. **Never write a credential, address or CIDR.** `type $INVITE_EMAIL into \`Email\`` reads
   `DOCTEST_INPUT_INVITE_EMAIL` from the environment. Never write a service or project id either:
   `select the service` means whichever service the run is about.

8. **Lint, then run.**
   ```bash
   node scripts/testplan-coverage.mjs --lint <path to the page>
   cd ../doc-testing-tool-poc && node scripts/test-page.mjs "<page url>"
   ```
   The lint catches a step no verb matches, an angle-bracket placeholder outside backticks (it fails
   the site build), and numbering that is not 1..n. Wrap a long statement in backticks so MDX leaves
   it alone; the parser strips them.

9. **Fix what the run reports, and expect the fix to land in three different places.** On
   tiger-cloud-essentials, five runs sent fixes to the docs (an undocumented dialog), to the plan (a
   missing "choose an option" before a disabled submit), and to the tool (a panel covering a form).
   Read the screenshots: the terminal output misled three times on one bug, and a single wrong control
   produced 13 consecutive failures.

   **Hash the screenshots before theorising about a failure.** `md5 screenshots/<page>-p0-step*.png`
   takes a second and answers the question the log cannot: whether the page ever changed. Seven
   byte-identical shots across seven consecutive "passing" steps is what exposed the members plan's
   real problem, and two shots that merely LOOK identical in the visible region have sent this work
   down a wrong path before, so compare bytes rather than eyes.

## Routes not to script, and why

Do not write steps for these, and do not write a marker saying you skipped them. A route the tool
cannot drive simply gets no steps: absence of steps IS the skip. A per-page skip marker only records
what the author remembered to declare, so a plan with three honest skips reads as more complete than
one that quietly ignored four routes, and nothing can check that a stated reason is still true.

These are limits of the walker, not of any one page:

- **Data view / PopSQL.** A cross-origin iframe the walker cannot reach inside. When a page documents
  both a Data view route and another route for the same SQL, script the other one: the statements
  still get exercised and only the route goes untested.
- **High-availability configuration.** Script the clicks and assert nothing: nothing in SQL or
  `tiger service get` exposes the replication strategy, and the page does not claim a specific
  outcome anyway.
- **A control that exists only in an object state your plan cannot reach.** The members page
  documents changing a user's role in a drop-down, but a PENDING invite has no drop-down: its role is
  plain text, and only an accepted member gets the control. The tool cannot accept an invitation, so
  that route gets no steps. Before scripting a row action, check the row your plan actually creates
  has the control the procedure describes — a plan that clicks a label absent from the row it pinned
  is indistinguishable from a broken page until someone looks.
- **Drag-and-drop targets and unlabelled icons.** `[resolve: <hint>]` is the escape hatch, and a hint
  with no resolver behind it is reported rather than run. Only reach for it when there is genuinely no
  label to name.

## What a plan is not

- **Not the docs.** It may say things no page should tell a human ("click `Let's go!`" for an obvious
  confirm dialog). Docs are for readers; a plan is for a bot covering the same flow.
- **Not graded against the prose.** There is no rule that a plan's labels must appear in the page, and
  no rule that every documented step must have one. Both existed and were deleted: they flagged every
  bot-only step and every legitimately unscripted route.
- **Not sectioned.** No Isolation, Setup, Inputs, Notes, Assert or Cleanup headings. One numbered
  list; text that is not numbered is commentary.
- **Not a picture list.** Screenshots are a property of the run (`DOCTEST_SHOTS=evidence|doc-update|none`),
  and doc-update finds its own moments from the images the page already publishes.
- **Not per-step pass criteria.** Each verb already carries one, and explicit criteria are the
  `expect` steps.
