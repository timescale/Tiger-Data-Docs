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
   you want to see exactly what it sees. **Run `lint-plan.mjs` on the page once before you write
   anything**: "no `<TestPlan>` on this page" on a page whose partial you can see has one means the
   tool is not inlining that partial. The security overview page imports its partials through the
   `@partials/` alias, and until 2026-09-18 the resolver silently dropped every alias import, on 107
   pages.

   **Then compare the version the page claims with the one the service runs**, before writing a single
   assertion: `SELECT extversion FROM pg_extension` after the install step, against the page's callout
   or `SinceRelease`. The pg_textsearch page said v1.1.0 and the service had 1.4.0; a monitoring
   function the page recommended for Cloud no longer existed, and the settings table had four gaps.
   A version mismatch is a finding in itself, and it tells you which of the page's claims to distrust.

2. **List the page's routes.** A `<Tabs>` block is a set of alternatives for the same outcome (psql
   vs Console vs Data view). A plan is ONE linear script, so it walks each testable route in turn and
   **undoes what a route created before the next one runs** — two routes that build the same table
   will collide on "already exists" otherwise. That undo is ordinary steps, in order, where a reader
   of the plan can see them.

   **SQL outside a `<NumberedList>` is still a claim.** A reference section that shows `CREATE INDEX`
   statements against tables the page never creates (`events`, `docs`, `articles`) is where a version
   bump drifts first, so script it with fixtures the plan owns: a short `CREATE TABLE` and a few rows.
   Two rules for those fixtures. Drop one that shares its name with a table the page creates later,
   before that step. And shape its DDL so it is not a near-copy of a page statement, or the drift
   check reports your fixture: `articles (id, title, body)` was flagged against the page's
   `articles (id, title, content, embedding)` until it gained a column the page's table lacks.

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

5. **Look at the screen before you transcribe it.** Open the Console on the standing service and
   walk to each screen the page names, without pressing anything that changes state, and read the
   controls' real labels and kinds. Ten minutes of looking found in one pass that the resource
   picker is a react-select drop-down and not radios, that its label is `CPU/Memory` while the page
   wrote `CPU / Memory`, and that the environment tags are two radios the page never names. Each of
   those would otherwise have cost a ten-minute run to discover. The docs' own screenshots under
   `src/assets/images` are a good first look, and the live screen is the authoritative one.

   **Transcribe each route's steps into verbs, in the page's own order.** Use the page's own labels
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
   - **Expect a confirm dialog after any row action or state-changing button, and write it as
     `confirm`.** Every destructive row action in the Console opens one, and so does every button in
     a service's Danger zone, `Resume service` included. Pages routinely stop before the dialog —
     correctly, because a reader is looking at it and the button says what it does. The bot still
     needs the step: without it the modal stays open and covers the page, so every later step acts
     on nothing.
     `confirm` is not a style preference. A plain `click` on a dialog button reads as a plan that
     wandered off the documented path (see the control-naming rule below), and `confirm` additionally
     makes the walker check that a dialog is actually open, which a click never did.
   - **Check for a duplicate label before writing a bare `click`.** A bare click takes the first
     match in DOM order. The screen shown after a {C.SERVICE_SHORT} is created has TWO buttons
     labelled `Download the config`, one per file, and the plan hit the right one by luck. Scope it:
     ``click `Download the config` in `Download your database config` ``.
   - **In a dialog with one field, `type` lands in that field whatever the markup calls it.** Name
     the field as the reader sees it. Outside a dialog there is no such fallback. The control check
     still wants the field named on the page; a warning you keep is a choice, not an oversight.

   - **Press only the controls the page names, in the places the page names them.** A reader and the
     run must not diverge on this, or the run is not evidence about the page. A press whose label is
     not in the page's code-font spans (or, for a multi-word label, stated verbatim in its prose) is
     reported by `lint-plan.mjs` before you spend a walk, and again by the run. A finding means one of two things and both need you: the page is missing
     a step, or the plan invented a control. A plan once typed into `Email`, a field neither the page
     nor the Console has, and passed for weeks because the tool resolved it by placeholder.

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
   that cannot, and for the same reason as above: a mistyped catalog name, a filter that matches
   nothing, or a `DO` block that never reaches its `RAISE` all report green forever.
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

   **Before you write `expect label`, search the page you will be on for that text.** `#prod` is the
   new state after switching a service's environment, and it is also printed in the radio's own
   description on the very page where the switch happens, so an `expect label \`#prod\`` there passes
   before the click as well as after. Assert on a screen where the text appears only in the new state
   (the Overview chips), or pair it with `expect no label` for the old state.

   The mirror mistake is asserting text from a different screen: `Ready` is an Overview badge, and on
   Service management the running state is the `Pause service` row coming back.

   **`expect label` and `expect no label` poll for up to three minutes**, so a state reached through a
   transition (`Pausing` to `Paused`) is asserted directly. A wrong label holds the run for the whole
   window before failing.

   **`expect label` is the weakest assertion there is, and it passes on text you cannot see.** On
   create-service it reported `✓ \`Ready\` is on the page` where the screenshot shows no such word:
   it had matched the SQL editor's own connection indicator, not the {C.SERVICE_SHORT}'s status. Reach
   for `expect rows` or `expect url` first, and when only `expect label` will do, open the screenshot
   for that step before you believe it.

   **`expect` runs inside a `DO` block, so whatever the page says does not work in PL/pgSQL does not
   work in an assertion either.** pg_textsearch's implicit `content <@> 'query'` relies on planner
   hooks that `DO` blocks skip; the page says so under its limitations. A `run SQL:` step can use the
   page's implicit form, and the assertion two lines later must switch to the explicit
   `to_bm25query('query', 'index_name')`, or it fails on a correct page.

   **Never assert a step that belongs to a procedure the plan declares unscripted.** The
   create-service plan ended on the `Ready` check, which is the opening step of "Connect to your
   {C.SERVICE_SHORT}" — the procedure listed under `Not scripted:` three lines below. A plan that
   contradicts its own list is worse than one that covers less, because the list is the only record a
   reviewer has of what was left out on purpose.

   **A plan whose steps are all clicks needs an assertion at the END, without exception.** A click
   step is the weakest evidence a plan can carry: it says a control was found and pressed, not that
   anything happened. That is not a hypothetical — for a stretch of the tool's history every
   unresolvable click reported green, and the plans that stayed honest through it were the ones whose
   last step was an `expect`. On a page with no SQL behind it (project members, and anything else at
   project scope) the closing assertion is the only thing standing between you and a plan that walks
   twelve steps, changes nothing, and passes. Assert the end state you created is gone, or that the
   thing you made is named on the page.

   When the page promises no observable outcome at all, as change-resources does (a restart, and
   nothing the Console prints), the smallest honest end is that the confirmation dialog closed:
   `expect no label \`Apply changes?\``. It is a real state the documented clicks produced, it was on
   screen one step earlier so it can fail, and it does not invent a claim the page never made.

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

   **Fill a placeholder exactly the way the page's prose tells the reader to, and check the result
   against the sample output, before you fill it the way you know is right.** The postgis page said to
   replace `<Interval_Time>` with a number of days, and `INTERVAL '1200'` is 1200 seconds: the
   documented query returns nothing. The plan's `INTERVAL '3650 days'` passed, and would have gone
   on passing over a broken page. The plan may name a value the page leaves open; it may not quietly
   correct an instruction the page gets wrong.

8. **Lint the draft, verify its SQL locally, then run.**
   ```bash
   cd ../doc-testing-tool-poc
   node scripts/lint-plan.mjs "<page url>"
   ```
   Three checks, none of which needs a browser, a service or a fork, so run this on every draft
   before spending a walk:
   - **Grammar.** Any line matching no verb, which would otherwise be dropped silently.
   - **Controls not named on the page.** The rule in step 5, checked before you spend a walk rather
     than after one.
   - **Statements drifted from the page.** A `run SQL:` that is *almost* one of the page's blocks.
     Filled placeholders and fixtures the plan invents are not flagged, by construction; what is
     flagged is a retyping slip, or a page that moved under its plan.

   Three more look from the page's side, at what the plan LEAVES OUT (added 2026-09-18):
   - **Procedure not covered.** A section with a `<NumberedList>` that no pressed control or run
     statement touches, and that `Not scripted:` does not name. One control or one statement from
     the section counts; this is a floor, not a step-for-step grade.
   - **Statement not run.** A SQL or shell block the page prints that no `run SQL:` or
     `run command:` executes, outside sections `Not scripted:` excuses. A `psql … -c "SHOW STATS;"`
     counts as running `SHOW STATS;`.
   - **Out of page order.** A statement whose section the plan has not yet touched, run after a
     statement the page prints later. Re-entering a section for its second route is allowed.

   So `Not scripted:` is now read by the tool, keyed on the heading text before the first colon,
   and an entry that names no real heading excuses nothing.

   It also warns when a plan asserts nothing at all.

   For the detail behind a finding, or to see the compiled `DO … RAISE EXCEPTION` block an `expect`
   turns into, ask `parsePlan` directly:
   ```bash
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

   **A plan whose steps are SQL costs nothing to verify before you spend a fork.**
   ```bash
   node scripts/plan-sql.mjs "<page url>" | tiger db connect $DOCTEST_SERVICE_AWS -- -q -f -
   node scripts/plan-sql.mjs "<page url>" --drop '^INSERT INTO <table>' | tiger db connect $DOCTEST_SERVICE_AWS -- -q -f -
   ```
   The first line runs every statement and compiled assertion, in plan order, inside a transaction
   that rolls back, against the STANDING service: a local PostgreSQL has none of the extensions a
   page installs (postgis, pg_textsearch, vectorscale), and the Cloud build is the one the page is
   about. The second line is the negative case, the same plan without the load. The assertion that
   counts rows must fail there, or it was never checking anything. Never retype the SQL by hand for
   this: the script extracts it from the same `parsePlan` the run uses, so you are testing what the
   plan says. On postgis and pg_textsearch this found every doc bug of the day before a fork existed.

   **Exit 3 before the browser opens means another run holds the project.** The message names the
   holder; wait for it rather than retrying. A dead run's lock expires after five minutes.

9. **Fix what the run reports.** A fix lands in one of three places, and which one is not obvious
   from the failure: the docs, the plan, or the tool.

   **Read the screenshots, on a pass as much as a failure.** The terminal says what a step claimed;
   the screenshot says what was on screen. They prove things an assertion cannot — result ordering,
   or a value reaching the database verbatim — and they expose the opposite: a green step whose
   screenshot does not show the thing it claims to have found.

   **Compare every "you see something like" block with what the run returned.** A `run SQL:` step
   passes when the statement does not error, so a stale output block is invisible to the run and only
   a person reading psql's echo catches it. The postgis SkipScan sample showed one row where the data
   yields two, and both pg_textsearch hybrid-search samples were from an older version with a
   different tie. Regenerate the block from the live output rather than editing the numbers by hand.

   **A "no control labelled X" failure whose own screenshot shows X is a timing flake, not a docs
   bug.** The walker gives a label two attempts and about 25 seconds in all; a slow fork can take
   longer than that to paint a tab strip. The tell is a `step 2 screenshot exceeded 90s` warning a
   few lines earlier. Rerun before changing anything; the passwordless-access plan failed this way on
   a path the IP-allow-list plan walks green.

   **Hash them before theorising.** `md5 screenshots/<page>-p0-step*.png` answers what the log cannot:
   whether the page ever changed. Identical shots across consecutive passing steps mean the steps did
   nothing. Compare bytes, not eyes — shots that look alike in the visible region have misled before.

   **Your verification harness can false-pass too.** Assert its fixtures are non-empty, and make the
   negative case fail before you trust the positive one. A harness that silently extracted no SQL
   once reported five passes, including the step that was supposed to fail.

## Routes not to script, and why

Close every plan with a `Not scripted:` list naming each documented interaction the plan does not
drive and why, one line each, keyed to the heading it sits under. The header line is exactly
`Not scripted:`; the linter finds the list by it.

```
Not scripted:
- Join a project: needs the invitee's mailbox and a second account.
- Change your current project: needs two projects, and this account has one.
```

It is unnumbered prose, so the walker ignores it and nothing executes it. The linter does read it:
each entry's text before the first colon must match a heading on the page, and a procedure or
statement under a named heading is excused from the coverage checks. It exists for the person
reading the plan, who otherwise cannot tell a procedure left out on purpose from one nobody
remembered, and since 2026-09-18 for the linter, which reports the ones nobody declared.

**Only things a reader is told to DO belong on it.** A `##` section of pure reference prose has
nothing to press, so it is not a gap, and listing it buries the entries that are. When everything
on a page is driven, the block goes away entirely rather than listing what was never drivable.

**"Things to do" is wider than `NumberedList` procedures.** Interactions written as prose count too
(hover, filter, export, expand, click a row). Walk the page for those verbs and name every one the
plan does not drive, whatever the reason: a list filtered by reason leaves the reader doing the same
guessing the list exists to stop. Start each entry with its heading so the linter can key it.

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

## Partial coverage, when the page needs something the run does not have

A page whose procedure needs an Azure subscription, an identity provider or a third-party website
can still be covered up to that point, and should be: the Console half is where the labels drift.
The pattern, from the Azure Private Link and strict-SSL plans:

- Drive the documented clicks to the last screen the run can reach, `expect label` the headings and
  fields that screen promises, then `dismiss`. Nothing is claimed, created or typed.
- Run every documented command that needs only the service, and let a non-zero exit be the
  assertion: `openssl … | grep "Google\|ZeroSSL"` fails when neither issuer signs the certificate.
  `run command:` refuses programs off its allowlist (`psql`, `tiger`, `openssl`), so a new client is
  a tool change first.
- Name the rest under `Not scripted:` with the heading and where the plan stopped: "from `Create a
  private endpoint in Azure` onward: needs an Azure subscription, a virtual network and a private
  DNS zone."

Two pages resist even this. SAML has no Console step at all. MFA's `Add two-factor authentication`
is absent from the automation account's Account page, in a password-login session like the tool's;
the page shows `SSO authentication: SSO added` for that account, and the docs say 2FA is not offered
with Google SSO, so the linked SSO is the likely reason, though the Console does not say. Neither
gets a plan, and the second is a requirement on the dedicated account (#32): no SSO linked.

**A project-level `create` needs no fork, and the walker knows it.** The destructive gate refuses a
`create`, `delete`, `remove`, `apply` or `change` click off a fork, except a row pinned to the run's
own value, `Create service`, and, since 2026-09-18, a `create` click on a page that is not a service
page. `Create credentials` on Settings mutates no service, so a fork protected nothing and the plan
stopped at step 3. What the plan creates there it must remove itself, pinned to its own name.

## What a plan is not

- **Not the docs.** It may say things no page should tell a human (`confirm \`Let's go!\`` for an
  obvious dialog). Docs are for readers; a plan is for a bot covering the same flow.
- **Not graded step-for-step against the prose.** `expect rows:` has no counterpart in writing,
  `go to /path` is positioning, and `fork the service` is infrastructure; there is no rule that every
  documented step must have a plan step either. A rule that graded everything existed and was deleted
  for flagging every plan everywhere. What IS enforced is narrower and survives: the control rule in
  step 5, and the statement rule in step 8.
- **Not sectioned.** No Isolation, Setup, Inputs, Notes, Assert or Cleanup headings. One numbered
  list; text that is not numbered is commentary. The closing `Not scripted:` list is commentary of
  exactly that kind, not a section coming back: nothing parses it and it carries no steps.
- **Not a picture list.** Screenshots are a property of the run (`DOCTEST_SHOTS=evidence|doc-update|none`),
  and doc-update finds its own moments from the images the page already publishes.
- **Not per-step pass criteria.** Each verb already carries one, and explicit criteria are the
  `expect` steps.
