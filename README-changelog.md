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

The component takes **props** and a **body** (default slot). The visible card title is generated from the `title` prop, so you do **not** add a heading inside the component.

#### Props (opening tag)

| Prop   | Required | Format        | Description |
|--------|----------|---------------|-------------|
| `title`| Yes      | String        | Full title of the entry. Must be **plain literal text** (no `{C.X}` constants) and **match the `##` heading exactly**. Used for the visible card title, the anchor ID, and the deep-link permalink. |
| `date` | Yes      | `YYYY-MM-DD`  | Release or announcement date. Shown as “Month Day, Year” (for example, February 18, 2026). Use UTC to avoid timezone issues. |
| `tags` | Yes      | Array of tag keys | One or more of the allowed tags (see below). Used for filtering and the pill labels on the card. |

**Allowed `tags` values:**  
`new-feature` | `improvement` | `performance` | `security` | `integration` | `region` | `deprecation` | `bug-fix` | `breaking-change` | `beta` | `ga`

Example:

```mdx
<ChangelogEntry 
  title="Your entry title here"
  date="2026-02-18"
  tags={["new-feature", "improvement"]}
>
```

---

### 3. The card title (generated, do not add it)

The visible card title is rendered by the component from the `title` prop. **Do not add an `<h2 slot="heading">` inside `<ChangelogEntry>`** — that pattern is removed. The component also derives the deep-link anchor from `title` (via the same slugger Starlight uses), so the permalink always matches the heading.

**Do not use `{C.X}` constants in changelog entries.** This is a deliberate exception to the repo-wide "use constants for product names" rule. The `title` prop is a plain HTML attribute, so `{C.PG}` inside it is **not** interpolated: it renders the literal characters `{C.PG}` and produces a permalink whose slug never matches the heading. Write product names out in full (`PostgreSQL`, `Tiger Cloud`, `TimescaleDB`, and so on) in both the `##` heading and the `title` prop. (The `TigerData.ProductConstants` Vale rule may still suggest constants here; ignore it for `new.mdx`.)

---

### 4. The body (default slot)

**Place:** everything after the opening `<ChangelogEntry>` tag, until `</ChangelogEntry>`.

**Purpose:** the main content of the entry: description, bullet lists, links, and so on.

**Format:**

- **Usually start with a `###` subsection.**  
  Most entries open with a `###` heading, which keeps layout and spacing consistent. Examples: “Now available”, “What’s new”, “Release highlights”, or a short topic name. A short entry can open with a paragraph instead (several existing entries do).
- Use normal Markdown/MDX: paragraphs, **bold**, lists, [links](url), `code`, and so on.
- You can add more `###` subsections to group content (for example, “Feature A”, “Feature B”).

Example:

```mdx
### Now available

Short intro sentence or paragraph.

- Bullet one.
- Bullet two.

### Another topic

More content...
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

### What's new

You can now do X in Tiger Cloud. This helps with Y and Z.

- First benefit.
- Second benefit.

See [docs link](https://...) for details.
</ChangelogEntry>
```

**Checklist:**

- [ ] `title` prop matches the `##` heading exactly.
- [ ] No `{C.X}` constants; product names written out in full.
- [ ] No `<h2 slot="heading">` inside the component (the title is generated).
- [ ] `date` is `YYYY-MM-DD`.
- [ ] `tags` is an array of allowed tag keys.
- [ ] Body opens with a `###` subsection (typical) or a short intro paragraph.
- [ ] Entry is placed at the top (newest first).

---

## Quick reference

| What                    | Where it goes |
|-------------------------|----------------|
| File to edit            | `src/content/docs/get-started/news/new.mdx` |
| Position of new entry   | At the top, immediately after `<div class="changelog-page-toc">` and before the first existing `##` / `<ChangelogEntry>` |
| TOC heading             | `## Entry title` (above the card; must match `title`, no constants) |
| Card title              | Generated from the `title` prop — do not add an `<h2>` inside `<ChangelogEntry>` |
| Date & tags             | `date="YYYY-MM-DD"` and `tags={["tag1", "tag2"]}` on `<ChangelogEntry>` |
| Body content            | Inside `<ChangelogEntry>`; start with `### Subsection`, then paragraphs/lists/links |

---

## Tips

- **Keep titles consistent:** use the same literal string for the `##` heading and the `title` prop (no `{C.X}` constants) so the TOC, card, and permalink stay in sync.
- **One or more tags:** use the tags that best describe the entry; multiple tags (for example, `["new-feature", "improvement"]`) are fine.
- **Body structure:** starting with a `###` and using more `###` for sub-topics keeps the changelog scannable and the layout consistent across entries.
