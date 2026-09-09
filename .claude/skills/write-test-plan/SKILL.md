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

   **Then put the list of `##` procedures to the page's writer and ask which to leave out, and why.**
   Some procedures must not be completed by a run even though nothing on the page says so:
   transferring project ownership gives the automation account away irreversibly, leaving a project
   removes it, enforcing MFA or SSO can lock it out. Those sections look no less automatable than any
   other, which is exactly why a teammate reads them as forgotten. It cannot be inferred from the
   page, so ask, and record what you are told in the closing `Not scripted:` list.

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
   - **Expect a confirm dialog after any row action, and write it as `confirm`.** Every destructive
     row action in the Console opens one, and pages routinely stop before it — correctly, because a
     reader is looking at the dialog and the button says what it does. The bot still needs the step:
     without it the modal stays open and covers the table, so every later step acts on nothing.
     `confirm` is not a style preference. A plain `click` on a dialog button reads as a plan that
     wandered off the documented path (see the control-naming rule below), and `confirm` additionally
     makes the walker check that a dialog is actually open, which a click never did.
   - **Press only the controls the page names, in the places the page names them.** A reader and the
     run must not diverge on this, or the run is not evidence about the page. Every run reports a
     press whose label is not in the page's code-font spans (or, for a multi-word label, stated
     verbatim in its prose). A finding means one of two things and both need you: the page is missing
     a step, or the plan invented a control. The members plan typed into `Email`, which neither the
     page nor the Console has — the field is `Type the email` — and it passed for weeks because the
     tool resolved it by placeholder.

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

   **Prove every assertion can fail, before you trust it passing.** Write it, then break the thing it
   watches and confirm it goes red. An assertion nobody has seen fail is indistinguishable from one
   that cannot: `run SQL:` only fails when a statement ERRORS, so a mistyped catalog name, a filter
   that matches nothing, or a `DO` block that never reaches its `RAISE` all report green forever.
   Cheapest form is to run the compiled SQL against a local database twice, once with the documented
   state and once without.

   **Assert on values the way the catalog stores them, not the way the page words them.** The
   continuous-aggregate refresh policy is the worked example: the page says `24 hours` and `3 weeks`,
   and `timescaledb_information.jobs.config` holds `{"end_offset": "24:00:00", "start_offset":
   "21 days"}`. A string comparison against the page's wording therefore fails on a *correct* page.
   Compare typed instead — `(config->>'end_offset')::interval = INTERVAL '24 hours'` — and check the
   real shape on a live job first rather than predicting it.

   **Two controls offering the same options need one assertion each.** `End offset` and `Schedule
   interval` both offer 3/6/12/24 hours, which is why `click \`X\` in \`Y\`` exists — a bare
   `click \`3 hours\`` takes the first match and silently sets the wrong field. Asserting only one of
   them hides that completely: the later step overwrites its own field correctly, so the assertion on
   *it* still passes while the other value is quietly wrong. Verified: with `end_offset` regressed,
   the `schedule_interval` assertion still passed and only the `end_offset` one caught it.

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

   **`$NAME` is the only form that resolves. An `<ANGLE>` placeholder does not.** `inputs` is
   hardcoded `{}` in `scripts/test-page.mjs`, so `applyInputs` never fills anything: a page's
   `<SCHEMA_NAME>` copied into a `run SQL:` step reaches the database literally and the step fails as
   a syntax error, which reads exactly like a docs bug. Only `run command:` resolves angle
   placeholders, and only the connection-shaped ones (`<POOLER_HOST>`, a whole `postgres://` URI);
   `<table-name>`, `<database-name>` and `<password>` deliberately skip the step instead.

   So the plan names something real where the page names a gap, and **that divergence is correct, not
   drift to be fixed.** House style is placeholders everywhere on the page, including the names of
   objects the procedure creates, so the page says `CREATE ROLE <ROLE_NAME>` while the plan says
   `CREATE ROLE readaccess` — the plan may be literal because everything it touches is a throwaway
   fork. Where the page's gap is a table or schema the reader already owns, **the plan creates its
   own** rather than guessing at what the standing service holds.

8. **Parse the draft with the tool's own parser, verify its SQL locally, then run.**
   ```bash
   cd ../doc-testing-tool-poc
   node -e 'import("./lib/resolve-page.mjs").then(async (rp) => {
     const { parsePlan } = await import("./lib/plan.mjs");
     const p = parsePlan(rp.resolvePage("<page url>").mdx);
     console.log("steps", p.steps.length, "| unparsed", p.unparsed, "| inputs", p.inputs);
   })'
   node scripts/test-page.mjs "<page url>"
   ```
   `parsePlan` is the gate the run itself uses, so ask it rather than reading the grammar: it reports
   the step count, every line that matched no verb, and the `DOCTEST_INPUT_*` names the plan needs —
   and it compiles each `expect` into the `DO … RAISE EXCEPTION` block that will really execute, so
   you can read back exactly what the database will see. (An earlier version of this step ran
   `scripts/testplan-coverage.mjs --lint`. **That script no longer exists** — plan coverage was
   settled the other way, as an author-written `Not scripted:` list with no tool check.)

   Wrap a long statement in backticks so MDX leaves it alone; the parser strips them back off. Do it
   for **every** statement, not just the long ones: bare SQL in a plan trips Vale's
   `TigerData.Acronyms` on `ROLE`, `GRANT`, `USAGE` and `ALL`, which it reads as prose acronyms.

   **A plan whose steps are SQL costs nothing to verify before you spend a fork.** Extract the
   compiled statements from `parsePlan` and run them against a local PostgreSQL with TimescaleDB
   (`pg_available_extensions`), in plan order, under `-v ON_ERROR_STOP=1`. Today that caught a
   would-be assertion bug before a single cloud minute was spent. Never retype the SQL by hand for
   this — extract it, or you are testing something the plan does not say.

9. **Fix what the run reports, and expect the fix to land in three different places.** On
   tiger-cloud-essentials, five runs sent fixes to the docs (an undocumented dialog), to the plan (a
   missing "choose an option" before a disabled submit), and to the tool (a panel covering a form).
   Read the screenshots: the terminal output misled three times on one bug, and a single wrong control
   produced 13 consecutive failures.

   **Your verification harness can false-pass too, and it is not exempt.** A one-liner that split the
   compiled SQL per step matched `-- step N` while the generated lines read `\echo -- step N`, so every
   extracted file was empty and `psql` exited 0 on nothing: five steps reported PASS, including the one
   that was supposed to fail. It was caught only because a negative test is expected to go red, and a
   green there is a bug in the test. Assert the fixture is non-empty; make the negative case fail first.

   **Hash the screenshots before theorising about a failure.** `md5 screenshots/<page>-p0-step*.png`
   takes a second and answers the question the log cannot: whether the page ever changed. Seven
   byte-identical shots across seven consecutive "passing" steps is what exposed the members plan's
   real problem, and two shots that merely LOOK identical in the visible region have sent this work
   down a wrong path before, so compare bytes rather than eyes.

## Routes not to script, and why

Close every plan with a `Not scripted:` list naming each `##` procedure the plan does not drive and
why, one line each, keyed to the heading verbatim:

```
Not scripted:
- Join a project: needs the invitee's mailbox and a second account.
- Change your current project: needs two projects, and this account has one.
```

It is unnumbered prose, so the parser ignores it and nothing executes it. It exists for the person
reading the plan, who otherwise cannot tell a procedure left out on purpose from one nobody
remembered.

**Only PROCEDURES belong on it.** A `##` section of pure reference prose has nothing to press, so it
is not a gap and listing it is noise: connection-pooling has eight headings of which four are
explanation (`Pool types`, `Connection pool sizes`, `VPC and connection pooling`, `Min and max
connection ranges`), and naming those buried the one thing the list is for. When every procedure on a
page is driven, the block goes away entirely rather than listing what was never drivable.

Among procedures, name every one the plan does not drive, whatever the reason: a list filtered by
reason leaves the reader doing the same guessing the list exists to stop.

An earlier version of this was a `skip` verb, and knowing why it was dropped keeps this list honest.
That marker was a plan's ONLY record of its own gaps, so three declared skips read as more complete
than four silent ones. This list claims less. It explains the omissions it names; it does not prove
there are no others, and a reviewer still reads it against the page's headings.

The limits below are properties of the walker rather than of any one page. They are here so you do
not re-derive them, not so you can leave a route off the list:

- **Data view / PopSQL.** A cross-origin iframe the walker cannot reach inside. When a page documents
  both a Data view route and another route for the same SQL, script the other one: the statements
  still get exercised and only the route goes untested.
- **High-availability configuration.** Script the clicks and assert nothing: nothing in SQL or
  `tiger service get` exposes the replication strategy, and the page does not claim a specific
  outcome anyway.
- **A control that exists only in an object state your plan cannot reach.** Before scripting a row
  action, check the row your plan actually pins has the control the procedure describes: a plan that
  clicks a label absent from the row it pinned is indistinguishable from a broken page until someone
  looks. The members page documents changing a user's role in a drop-down, and a PENDING invite has
  no drop-down — its role is plain text, and only an accepted member gets the control. That is a
  reason to pin a DIFFERENT row, not to leave the procedure unscripted: the plan pins `$ROLE_EMAIL`,
  a standing accepted member, rather than the invite it just created. Reach for the `Not scripted:`
  list only when no reachable object has the control at all.
- **Drag-and-drop targets and unlabelled icons.** `[resolve: <hint>]` is the escape hatch, and a hint
  with no resolver behind it is reported rather than run. Only reach for it when there is genuinely no
  label to name.

## What a plan is not

- **Not the docs.** It may say things no page should tell a human (`confirm \`Let's go!\`` for an
  obvious dialog). Docs are for readers; a plan is for a bot covering the same flow.
- **Not graded step-for-step against the prose.** `expect rows:` has no counterpart in writing,
  `go to /path` is positioning, and `fork the service` is infrastructure; there is no rule that every
  documented step must have a plan step either. A rule that graded everything existed and was deleted
  for flagging every plan everywhere. What IS enforced is narrower and survives: the controls a plan
  presses must be controls the page names.
- **Not sectioned.** No Isolation, Setup, Inputs, Notes, Assert or Cleanup headings. One numbered
  list; text that is not numbered is commentary. The closing `Not scripted:` list is commentary of
  exactly that kind, not a section coming back: nothing parses it and it carries no steps.
- **Not a picture list.** Screenshots are a property of the run (`DOCTEST_SHOTS=evidence|doc-update|none`),
  and doc-update finds its own moments from the images the page already publishes.
- **Not per-step pass criteria.** Each verb already carries one, and explicit criteria are the
  `expect` steps.
