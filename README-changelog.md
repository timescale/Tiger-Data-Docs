# How to add a new changelog entry

This guide walks through adding a new entry to the Tiger Data changelog: which file to edit, what each part does, and where each piece of information goes.

---

## Where to add it

**File:** `src/content/docs/get-started/news/new.mdx`

All changelog entries live in this single MDX file. New entries are added at the **top** of the list (after the page intro and filter), so the changelog stays newest-first.

---

## Structure of the page

The changelog page is built from:

1. **Page frontmatter** (title, description, and so on) at the top of `get-started/news/new.mdx`.
2. **ChangelogFilter**: the filter UI (tags, search) above the list.
3. **A wrapper** `<div class="changelog-page-toc">` that holds both the table-of-contents headings and the cards.
4. **Repeating blocks**: for each entry you add **two things**:
   - A `## Title` heading (used for the right-hand “On this page” TOC; it’s visually hidden on the page).
   - A `<ChangelogEntry>...</ChangelogEntry>` block that renders the visible card.

So each logical “entry” is: one `##` heading + one `<ChangelogEntry>`.

---

## What goes where

### 1. The `##` heading (for the TOC)

**Place:** directly **above** the corresponding `<ChangelogEntry>`, inside the same `changelog-page-toc` div.

**Purpose:** drives the right-hand “On this page” navigation. The heading text is hidden on the page; the card content is what users see.

**Format:** use the same title you’ll use for the card.

```md
## Your entry title here
```

---

### 2. The `<ChangelogEntry>` component

**Place:** right after the `##` heading, still inside `div.changelog-page-toc`.

The component takes **props** and **two slots** (heading + body).

#### Props (opening tag)

| Prop   | Required | Format        | Description |
|--------|----------|---------------|-------------|
| `title`| Yes      | String        | Full title of the entry. Must match the `##` heading and the H2 in the heading slot. Used for the card and for anchor IDs. |
| `date` | Yes      | `YYYY-MM-DD`  | Release or announcement date. Shown as “Month Day, Year” (for example, February 18, 2026). Use UTC to avoid timezone issues. |
| `tags` | Yes      | Array of tag keys | One or more of the allowed tags (see below). Used for filtering and the pill labels on the card. |

**Allowed `tags` values:**  
`new-feature` | `improvement` | `performance` | `security` | `integration` | `region` | `deprecation` | `bug-fix` | `breaking-change` | `beta` | `ga` | `cli-mcp`

Example:

```mdx
<ChangelogEntry 
  title="Your entry title here"
  date="2026-02-18"
  tags={["new-feature", "improvement"]}
>
```

---

### 3. The heading slot (card title)

**Place:** first content **inside** `<ChangelogEntry>`, right after the opening tag.

**Purpose:** this is the main title shown on the card (and used for deep links). It must be an `<h2>` with `slot="heading"` and `class="changelog-entry__title"`.

**Format:** the text should match the `title` prop and the `##` heading.

```mdx
<h2 slot="heading" class="changelog-entry__title">Your entry title here</h2>
```

**Why it’s a slot:** The component puts this H2 in the card header (above the date and tags). Using a slot keeps the title in the page TOC and in the card without duplicating markup.

---

### 4. The body (default slot)

**Place:** everything after the heading slot, until `</ChangelogEntry>`.

**Purpose:** the main content of the entry: description, bullet lists, links, and so on.

**Format:**

- **Open with a summary sentence, not a heading.**  
  The first thing in the body must be a sentence (plain paragraph) that summarizes every feature or change the entry covers, not just the first one. Readers scanning the changelog should get the full picture from that one sentence alone. Don't put a `###` heading before it.
- **Add `###` subsections after the intro sentence, only if the entry needs them.**  
  If the entry covers more than one distinct topic, group the details under `###` headings (for example, “Highlighted features”, “What this means for you”, or a topic name). A single-topic entry usually doesn't need any `###` at all: the intro sentence plus a bullet list or short paragraph is enough.
- Use normal Markdown/MDX: paragraphs, **bold**, lists, [links](url), `code`, and so on.

Example (single topic, no subsection needed):

```mdx
You can now do X in Tiger Cloud. This helps with Y and Z.

- First benefit.
- Second benefit.
```

Example (multiple topics, grouped under subsections):

```mdx
This release adds X, improves Y, and deprecates Z.

### X

Details about X...

### Y

Details about Y...
```

---

## Full example

Here’s a complete new entry as it would appear at the top of the list in `new.mdx`:

```mdx
## My new feature

<ChangelogEntry 
  title="My new feature"
  date="2026-03-01"
  tags={["new-feature"]}
>
<h2 slot="heading" class="changelog-entry__title">My new feature</h2>

You can now do X and Y in Tiger Cloud, plus we've improved Z.

- First benefit.
- Second benefit.

See [docs link](https://...) for details.
</ChangelogEntry>
```

**Checklist:**

- [ ] `##` heading matches the card title.
- [ ] `title` prop matches the `##` and the H2 text.
- [ ] `date` is `YYYY-MM-DD`.
- [ ] `tags` is an array of allowed tag keys.
- [ ] Body opens with a sentence that summarizes every feature covered in the entry.
- [ ] `###` subsections, if any, come after the intro sentence and only group multi-topic entries.
- [ ] Entry is placed at the top (newest first).

---

## Quick reference

| What                    | Where it goes |
|-------------------------|----------------|
| File to edit            | `src/content/docs/get-started/news/new.mdx` |
| Position of new entry   | At the top, immediately after `<div class="changelog-page-toc">` and before the first existing `##` / `<ChangelogEntry>` |
| TOC heading             | `## Entry title` (above the card) |
| Card title (visible H2) | `<h2 slot="heading" class="changelog-entry__title">Entry title</h2>` (first thing inside `<ChangelogEntry>`) |
| Date & tags             | `date="YYYY-MM-DD"` and `tags={["tag1", "tag2"]}` on `<ChangelogEntry>` |
| Body content            | After the H2; open with the summary sentence, then optional `### Subsection`s, paragraphs/lists/links |
| First sentence          | Must summarize every feature or change covered in the entry (a plain sentence, not a heading) |

---

## Tips

- **Keep titles consistent:** use the same string for the `##` heading, the `title` prop, and the H2 in the heading slot so the TOC and card stay in sync.
- **No constants:** write product names as literal strings (`Tiger Cloud`, `PostgreSQL`, `TimescaleDB`, and so on), not `{C.X}` constants. Entries are a permanent historical record, so they must not shift when a constant's value changes. This is the one content file exempt from the constants convention.
- **One or more tags:** use the tags that best describe the entry; multiple tags (for example, `["new-feature", "improvement"]`) are fine.
- **Lead with a full summary:** open the body with a sentence that names every feature or change in the entry, not just the first one. Only add `###` subsections after that sentence, and only when the entry covers more than one distinct topic; single-topic entries usually don't need any.
