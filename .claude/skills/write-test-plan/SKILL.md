---
name: write-test-plan
description: Draft or update the <TestPlan> block on a docs page for the doc-testing tool. Use when a page needs a test plan, when a page's procedure changed and its plan is stale, or when asked to "write a test plan" or "make this page testable".
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash
argument-hint: "[page path or docs URL]"
effort: high
---

# Write a doc-testing test plan

A plan is a bot-facing script of the flow the page documents. The tool runs it against the live
Tiger Console and a real service, or, for a self-hosted page, against a throwaway EC2 box with
TimescaleDB installed (see [Self-hosted pages](#self-hosted-pages)), or both when the page is tagged
with both products (see [Pages tagged with both products](#pages-tagged-with-both-products)). A
failing step means something on the page is wrong.

**Read `src/components/TestPlan.astro` before writing anything.** It is the authoritative verb set
and is kept current. This skill is the method, not the grammar.

Your job ends at a draft that lints clean and has been run once. The last part of any plan, the
confirmation dialogs, the panel that covers a form, the submit that stays disabled, cannot be read
off the page. Draft, run, fix.

## Method

1. **Read the whole page, following partials.** Steps often live in `src/partials/_*.mdx`; the tool
   inlines them and the plan must cover them. Run `lint-plan.mjs` on the page before writing: "no
   `<TestPlan>` on this page" on a page whose partial visibly has one means the tool is not inlining
   that partial. Then compare the version the page claims with the one the service runs, for example
   `SELECT extversion FROM pg_extension` against the page's callout. A mismatch is a finding in
   itself, and it tells you which of the page's claims to distrust.

2. **List the page's routes.** A `<Tabs>` block is a set of alternatives for one outcome. A plan is
   one linear script, so it walks each testable route in turn and undoes what a route created before
   the next one runs, as ordinary steps a reader of the plan can see. SQL outside a `<NumberedList>`
   is still a claim: script it with fixtures the plan owns, a short `CREATE TABLE` and a few rows.
   Drop a fixture that shares its name with a table the page creates later, and shape its columns so
   it is not a near copy of a page statement, or the drift check reports it.

   Then put the list of `##` procedures to the page's writer and ask which must not be completed by
   a run: transferring project ownership, leaving a project, enforcing MFA or SSO. Nothing on the
   page marks them, so ask, and record the answer in the closing `Not scripted:` list.

3. **Declare the products.** The page's `products:` frontmatter is the claim; the plan's `target:`
   line, before step 1, is what the plan proves. `target: self-hosted` for a self-hosted page,
   nothing for a Cloud-only page, `target: cloud, self-hosted` when the page is tagged with both and
   the steps are mostly shared. A plan claiming a product the page is not tagged with does not run;
   a tagged product no plan covers is reported as not covered, which is honest and fine for a first
   plan.

4. **Decide isolation.** If any step creates, deletes or alters anything at service level, step 1 is
   `fork the service`. Without it the run uses the standing service and refuses every destructive
   step. Project-level work needs no fork: the destructive gate allows a `create` click on a
   non-service page and a row action pinned to a value the run owns. What a plan creates at project
   level it removes itself, pinned to its own name, because a fork cannot isolate it.

5. **Fetch what the page tells the reader to download.** `download <url>` as a step. Archives are
   unzipped, the folder becomes psql's working directory and the source for `upload`.

6. **Look at the screen before you transcribe it.** Open the Console on the standing service and
   walk to each screen the page names, pressing nothing that changes state, and read the controls'
   real labels and kinds. The docs' screenshots under `src/assets/images` are a first look; the live
   screen is authoritative. Then transcribe each route into verbs, in the page's order, with the
   page's own labels and statements. Rules with teeth:
   - **Press only the controls the page names, where it names them.** A press whose label is not in
     the page's code-font spans, or stated verbatim in its prose for a multi-word label, is reported
     by the linter and by the run. It means the page is missing a step or the plan invented a
     control, and both need a person. Typed fields and named drop-downs are graded the same way.
   - **A page that restates another page's steps is tested on this page.** Drive the restatement
     here; the other page's plan protects the other page.
   - **Name the kind of control when a label is ambiguous**: `click tab \`Hypertables\``. The walker
     tries `button` before `tab`.
   - **`go to <path>` is positioning, never a test.** Reach or reset state with it; test the
     documented click, and pair it with `expect url`.
   - **`use the row for $X` pins the next step only.** Put it immediately before the step that needs
     it and repeat it before every further row action; menus and dialogs render outside the row.
   - **Every row action and state-changing button opens a dialog. Write it as `confirm`.** Pages
     rightly stop before the dialog; the bot cannot. `confirm` also makes the walker check a dialog is
     open, which a plain `click` never does. A dialog that demands a value only it knows is
     `type the value the dialog asks for`, then `confirm`.
   - **Check for duplicate labels before a bare `click`.** A bare click takes the first match in DOM
     order. Scope it: ``click `Download the config` in `Download your database config` ``.
   - **In a dialog with one field, `type` lands in that field whatever the markup calls it.** Name
     the field as the reader sees it. Outside a dialog there is no such fallback.
   - **An icon the page names only by its picture** is `[resolve: <hint>]`. Use it only when there
     is no label to name.

7. **Add assertions.** `run SQL:` fails only when a statement errors, so a plan can walk an entire
   ingest route, load nothing, and pass. The mechanical pairs:

   | the step created | assert |
   |---|---|
   | a table or hypertable | `expect rows: SELECT 1 FROM <table> LIMIT 1` |
   | a hypertable specifically | `expect rows: SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = '<t>'` |
   | a continuous aggregate | `expect rows: SELECT 1 FROM timescaledb_information.continuous_aggregates WHERE view_name = '<v>'` |
   | a policy | `expect rows: SELECT 1 FROM timescaledb_information.jobs WHERE proc_name = '<proc>' AND <the documented interval>` |
   | a drop, before a route rebuilds the same object | `expect no rows: …` |

   Six rules:
   - **Assert what the page claims.** A documented value is worth an assertion, because it fails
     when the page's number is wrong. An existence check earns its place where the page states the
     outcome. A click path that promises nothing gets no assertion.
   - **Prove every assertion can fail** before trusting it passing: break the thing it watches and
     see it go red. A wrong catalog name or a filter that matches nothing is green forever.
   - **Compare values the way the catalog stores them, not the way the page words them.** Cast:
     `(config->>'end_offset')::interval = INTERVAL '24 hours'`. Check the real shape on a live object
     first. Two controls offering the same options need one assertion each.
   - **`expect label` is the weakest assertion.** Search the screen for the text before writing it:
     text present before and after the click proves nothing, and text from a different screen never
     appears. Assert where the text exists only in the new state, or pair it with `expect no label`.
     It polls for up to three minutes, so a transition is asserted directly and a wrong label costs
     the whole window. Prefer `expect rows` or `expect url`; when only a label will do, open that
     step's screenshot before you believe it.
   - **`expect` runs inside a `DO` block.** What the page says does not work in PL/pgSQL does not
     work in an assertion either; use the explicit form the page gives.
   - **Never assert a step of a procedure the plan declares unscripted.** A plan that contradicts its
     own `Not scripted:` list is worse than one that covers less.

   A plan whose steps are all clicks ends in an assertion, without exception. A click proves a
   control was found and pressed, not that anything happened. When the page promises no observable
   outcome, the smallest honest end is that the confirmation dialog closed: `expect no label \`Apply
   changes?\``.

8. **Never write a credential, address, CIDR, or service or project id.** `type $INVITE_EMAIL into
   \`Email\`` reads `DOCTEST_INPUT_INVITE_EMAIL`; `select the service` means whichever service the run
   is about. `$NAME` is the only form that resolves: an `<ANGLE>` placeholder copied into `run SQL:`
   reaches the database literally and fails like a docs bug. Only `run command:` fills angle
   placeholders, and only connection-shaped ones. So the plan names something real where the page
   names a gap, and that divergence is correct: the page says `CREATE ROLE <ROLE_NAME>`, the plan
   says `CREATE ROLE readaccess`. Where the page assumes a table the reader owns, the plan creates
   its own. Fill a placeholder the way the page's prose tells the reader to, and check the result
   against the page's sample output, before filling it the way you know is right. A plan may name a
   value the page leaves open; it may not quietly correct an instruction the page gets wrong.

9. **Write the claims table before you lint.** The linter reads fenced blocks and the controls a
   page names. It does not read the rest, and the rest is where plans come up short: a `VACUUM` in a
   tip, a `convert_to_columnstore(…, recompress => true)` in a link, a `tsdb.direct_compress` option
   named in prose, a sentence that promises an outcome ("`INSERT` produces columnstore chunks on the
   spot"). Before linting, list every claim on the page in one table and map each to the plan:

   | claim | where | step |
   |---|---|---|
   | `DELETE FROM conditions WHERE …` | fenced block | 6, asserted 7 |
   | `VACUUM FULL` | tip, inline code | 11 |
   | direct compress writes columnstore chunks on insert | prose, partial | 33, asserted 34 |
   | unique constraints must include the time column | prose | no expect-error verb |

   One row per fenced block, per inline statement or option, and per sentence that states a
   checkable outcome, partials included. Every row ends in a step number or a reason the plan
   cannot drive it; a reason is a `Not scripted:` entry or a tool gap worth raising. Post the table
   with the plan when you hand it over: a reader can see a blank in a table, and nobody can see
   one in "lint clean".

10. **Lint, verify the SQL, then run.**
   ```bash
   cd ../doc-testing-tool
   node scripts/lint-plan.mjs "<page url>"
   ```
   Six checks, none needing a browser or a service: grammar (a line matching no verb); controls not
   named on the page; statements drifted from the page (a near copy of a page block); procedures not
   covered (a `<NumberedList>` section no step touches); statements not run (a SQL or shell block no
   step executes); out of page order. The last three read the `Not scripted:` list, keyed on the
   heading text before the first colon. It also warns when a plan asserts nothing.

   A page's first plan also needs `import TestPlan from "@components/TestPlan.astro";` among its
   imports. Neither the linter nor the run builds the page, so a missing import surfaces only in the
   Vercel build of the PR. Wrap every statement in backticks: an angle bracket outside inline code
   fails the MDX build, and bare SQL trips Vale's acronym rule. For the compiled `DO … RAISE` block behind an `expect`, or the
   inputs a plan needs, ask `parsePlan` from `lib/plan.mjs`. A SQL-only plan costs nothing to verify
   before a fork:
   ```bash
   node scripts/plan-sql.mjs "<page url>" | tiger db connect $DOCTEST_SERVICE_AWS -- -q -f -
   node scripts/plan-sql.mjs "<page url>" --drop '^INSERT INTO <table>' | tiger db connect $DOCTEST_SERVICE_AWS -- -q -f -
   ```
   The first runs every statement and assertion in a transaction that rolls back, against the
   standing service. The second is the negative case; the assertion that counts rows must fail there.
   Then `node scripts/test-page.mjs "<page url>"`. Exit 3 before the browser opens means another run
   holds the project; wait for it.

11. **Fix what the run reports.** A fix lands in the docs, the plan, or the tool, and the failure does
   not say which.
   - Read the screenshots on a pass as much as on a failure. Hash them first: identical shots across
     consecutive passing steps mean the steps did nothing.
   - Compare every "you see something like" block with what the run returned, and regenerate a stale
     block from live output rather than editing numbers by hand. A stale sample is invisible to the run.
   - A "no control labelled X" failure whose own screenshot shows X is a timing flake, usually after
     a `screenshot exceeded 90s` warning. Rerun before changing anything.
   - Your verification harness can false-pass too. Make its negative case fail before trusting the
     positive one.

## Self-hosted pages

The method is the same; the substrate is not. A plan with `target: self-hosted` before step 1 runs
on a fresh Ubuntu EC2 box, provisioned for that page and destroyed after it, with no browser. The box
follows the Ubuntu install guide command for command, on whatever TimescaleDB package is latest that
day, so the target moves with each release. The `target:` line is the only opt-in; frontmatter
decides nothing. `fork the service` is allowed and means nothing extra here: the box is throwaway
by itself.

## Pages tagged with both products

Most of the site is tagged `[cloud, self_hosted]`, and most of those pages are SQL only. One plan
covers both: `target: cloud, self-hosted`, then the SQL steps and `expect` assertions unprefixed,
because psql means the same thing on both sides. The tool walks Cloud first, then the box, and
reports one verdict per product.

- **A step for one side only carries a prefix:** `[cloud] click \`SQL editor\``,
  `[self-hosted] run command: \`sudo -u postgres psql -c "..."\``. Console verbs and `run command`
  must be prefixed in a two-product plan, because `run command` runs on your machine for Cloud and
  on the box as root for self-hosted; the linter refuses an unprefixed one.
- **The extension step differs by side.** `[self-hosted] run SQL: \`CREATE EXTENSION IF NOT EXISTS
  timescaledb;\`` on the box; a Cloud service has it already.
- **Two blocks when the procedures diverge.** A Console wizard on one side and `postgresql.conf` on
  the other, or a page that imports a partial whose plan is Console-only: write a second `<TestPlan>`
  with `target: self-hosted` under it. Every block then needs its own `target:`, and no two blocks
  may claim the same product. More than a third of the steps prefixed is the sign to split.
- **Fixtures run on both sides.** A `CREATE TABLE` the plan owns is a shared step, so one copy
  serves both walks; drop it on both, too.

- **The extension is installed, not created.** `CREATE EXTENSION IF NOT EXISTS timescaledb;` is the
  first SQL step of nearly every plan, and it must precede any assertion on a `timescaledb.*`
  setting: those settings do not exist in `pg_settings` until the extension exists in that database.
- **`run SQL:` and `expect rows:` run in the `postgres` database.** Anything in another database goes
  through `run command:` with psql on the box, `sudo -u postgres psql -d restored -c "…"`, and an
  assertion there is a shell test whose exit code fails the step:
  `test "$(sudo -u postgres psql -d restored -tAc "SELECT count(*) FROM t")" = 721`.
- **Every `run command:` is its own root shell in `/tmp`.** An `export` does not carry to the next
  line, so a page's `export SOURCE=…` gets no step and `$SOURCE` is filled with a literal. Client
  tools run as the database owner: `sudo -u postgres pg_dump …`. Relative filenames persist between
  steps, so write the page's own `> schema.sql`. There is no allowlist. A bare `psql -d …` connect
  line needs no step.
- **The linter reads through the wrappers.** It strips a leading `sudo -u user`, reads the SQL out
  of `psql -c "…"`, and treats `$VAR` on the page as a placeholder. Lint clean is the expectation.
- **Assert from the catalog.** `pg_settings` for a configuration change (`setting`, and
  `pending_restart` for restart-only parameters), `timescaledb_information.*` for objects, a shell
  `test` for anything else.
- **Every step runs.** The box is throwaway, so there is no destructive gate. Undo between routes is
  still ordinary steps.
- **No screenshots, no control check.** Read the psql echo in the report the way you would read a
  screenshot: `COPY 721` proves what an `ok` does not.
- **A run costs about five minutes, most of it boot.** There is no local dry run, because the SQL
  depends on the box's TimescaleDB. Runs are sequential; two collide on one Terraform state and one
  local port. Every SQL step red with no error text while shell steps pass is a stale tunnel holding
  the port: `lsof -nP -iTCP:55432`.
- **Install, uninstall and upgrade pages get no plan here.** They need a bare box, which is a
  separate flow.

## Declaring what is not scripted

Close a plan with a `Not scripted:` list naming each documented procedure the plan does not drive
and why, one line each, keyed to its heading. The header line is exactly `Not scripted:`.

```
Not scripted:
- Join a project: needs the invitee's mailbox and a second account.
- PITR forks: from `Confirm by clicking Create recovery fork` onward: the default recovery point is out of range on a fresh fork.
```

It is unnumbered prose, so nothing executes it. The linter reads it: each entry's text before the
first colon must match a heading on the page, and a procedure or statement under that heading is
excused from the coverage checks. When everything on a page is driven, the list goes away.

A page with per-platform `<Tabs>` repeats its headings once per tab, so a heading key would excuse
every tab, the one the plan drives included. Key those entries by tab instead: `Debian tab: the
target is Ubuntu.` excuses exactly the `Debian` tab's procedures and statements, the label matched
whole, and an outer tab's key (`Linux tab`) covers the tabs nested in it. Drive the tab the target
can run and name the others, one line each.

**Only things a reader is told to do belong on it**: the page's `NumberedList` procedures and the
statements or commands it tells the reader to run. A navigation sentence gets one click and one
`expect url`. Prose describing a screen's controls gets nothing unless a procedure tells the reader
to use them. A `##` section of reference prose is not a gap.

A partly reachable procedure is still covered as far as it goes. Drive the documented clicks to the
last screen the run can reach, `expect label` what that screen promises, then `dismiss`. Run every
documented command that needs only the service, and let a non-zero exit be the assertion. Name the
rest as "from `<step>` onward" with the reason. A third-party site with a plain form is not a
stopper: `open https://…`, `paste <file> into the box`, `save the download as <path>`, and
`select the service` brings the run back.

Known limits of the walker, so you do not rediscover them:

- **Data view.** A cross-origin iframe. Script the page's other route for the same SQL.
- **High-availability strategy.** Script the clicks; nothing exposes the strategy to assert on.
- **A control that exists only in an object state your plan cannot reach.** Pin a different row that
  has the control, and declare the procedure only when no reachable object has it.
- **Drag-and-drop targets and unlabelled icons.** `[resolve: <hint>]`; a hint with no resolver is
  reported, not run.
- **Multi-select lists, date pickers, graph hover and zoom.** No verb drives them. Declare them.
- **Console `run command:` runs `psql`, `tiger` and `openssl` only.** A new client is a tool change
  first. The self-hosted box runs anything.

A page with no reachable step gets no plan, and the reason goes in the PR.

## What a plan is not

- **Not the docs.** It may say things no page should tell a human (`confirm \`Let's go!\``).
- **Not graded step for step against the prose.** `expect rows:` has no counterpart in writing,
  `go to /path` is positioning, `fork the service` is infrastructure. What is enforced is the control
  rule and the statement checks above.
- **Not sectioned.** One numbered list. Text that is not numbered is commentary, and the `Not
  scripted:` list is commentary of exactly that kind.
- **Not a picture list.** Screenshots are a property of the run, `DOCTEST_SHOTS=evidence|doc-update|none`.
- **Not per-step pass criteria.** Each verb carries one; explicit criteria are the `expect` steps.
