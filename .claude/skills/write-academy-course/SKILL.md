# Write Tiger Data Academy Course

Create new Tiger Data Academy courses with structured modules and interactive knowledge checks.

## When to Use

Use this skill when you need to:
- Create a new Tiger Data Academy course under `/learn/tiger-data-academy/`
- Add modules to an existing Academy course
- Implement knowledge checks with resource recommendations
- Ensure Academy content follows pedagogical best practices

**Academy is course-based learning only.** Do not use this skill for general `/learn/` documentation.

## Prerequisites

Before starting, understand:
- Academy courses live at `/learn/tiger-data-academy/`
- Each course has an overview page and multiple modules
- Each module should be 10-15 minutes (see timing breakdown below)
- Knowledge checks are **required** for each module
- Use the KnowledgeCheck component for all assessments

## Structure

### Course Directory Layout

```
/learn/tiger-data-academy/
├── your-course/
│   ├── index.mdx              (course overview & module listing)
│   ├── module-1.mdx           (first module with knowledge check)
│   ├── module-2.mdx           (second module with knowledge check)
│   ├── module-3.mdx           (optional: additional modules)
│   └── resources.mdx          (curated reading list)
```

### Module Structure

Each module should follow this outline:

```mdx
---
title: Module Title
description: One sentence describing the module
products: [cloud, self_hosted]
---

import * as C from "@constants";
import { KnowledgeCheck } from '@components/KnowledgeCheck';

**Module:** Course Name → Section Name
**Estimated time:** X–Y minutes

---

## Learning Objectives

By the end of this module, you will be able to:

- **Verb** concept (Bloom's level)
- **Verb** concept (Bloom's level)

---

## [Main Section 1]

Content here...

## [Main Section 2]

Content here...

> TODO: Content coming soon.

---

## Summary & Next Steps

**What you learned:**
- Summary bullet
- Summary bullet

**Up next:**
- [Next Module](/learn/tiger-data-academy/your-course/module-2)

---

## Knowledge Check

<KnowledgeCheck client:load
  questions={[
    {
      id: 'q1',
      text: 'Question text?',
      answers: [
        { label: 'Wrong answer', correct: false },
        { label: 'Correct answer', correct: true },
        { label: 'Wrong answer', correct: false },
      ],
      explanation: 'Explanation of why...',
      resources: [
        { title: 'Resource Name', url: '/path/to/page', type: 'docs' },
      ],
    },
    // 2-4 more questions
  ]}
/>
```

## Timing Breakdown

Total course time should be **~60 minutes** spread across modules:

- **Introductory module**: 12–15 min
- **Concept modules**: 8–12 min each
- **Advanced/applied modules**: 10–15 min each
- **Optional sections**: Mark clearly as "TODO: Content coming soon"

Total modules: 5–8 (adjust based on scope)

## Module Content Guidelines

### Learning Objectives

Use Bloom's taxonomy levels:
- **Remember**: Define, recall, identify
- **Understand**: Explain, describe, classify
- **Apply**: Demonstrate, use, solve
- **Analyze**: Distinguish, compare, contrast
- **Evaluate**: Judge, assess, recommend
- **Create**: Design, construct, synthesize

Each module should have 3–5 objectives.

### Main Content

- Use constants for product names (`{C.TIMESCALE_DB}`, `{C.HYPERTABLE}`, etc.)
- Keep sections focused (2–3 subsections per module)
- Use code examples when applicable
- Include ASCII diagrams for architecture concepts
- Mark incomplete sections with `> TODO: Content coming soon.`

### Knowledge Checks

**Design principles:**
- 3–5 questions per module (keep to 5 max to stay within time budget)
- Progress from conceptual to applied
- Test for common misconceptions
- Provide detailed explanations for each answer

**Question format:**
- 3-4 answer options (3 for intro, 4 for advanced)
- One clearly correct answer
- Plausible wrong answers (not "obviously wrong")
- Clear, concise question text

**Resources:**
- Link only to relevant materials
- Prioritize: Academy modules → `/learn/` docs → blog posts → external
- 1–3 resources per question (2 is optimal)
- Use appropriate type badges: `'docs'`, `'blog'`, `'external'`
- Resources only show when user answers incorrectly

## Sidebar Integration

After creating the course, update `astro.config.ts` in the Learn section:

```ts
{
  label: "Your Course Name",
  collapsed: true,
  items: [
    { label: "Overview", link: "/learn/tiger-data-academy/your-course" },
    { label: "Module 1", link: "/learn/tiger-data-academy/your-course/module-1" },
    { label: "Module 2", link: "/learn/tiger-data-academy/your-course/module-2" },
    { label: "Resources", link: "/learn/tiger-data-academy/your-course/resources" },
  ],
},
```

## Example: Tiger Data 101

Reference implementation: `/learn/tiger-data-academy/tiger-data-101/`

- `index.mdx` — Course overview with module listing
- `what-is-timescaledb.mdx` — First module (reference for KnowledgeCheck usage)
- `working-with-time-series-data.mdx` — Module with partial content (shows TODO pattern)
- Other modules follow the same pattern
- `resources.mdx` — Curated reading list

## Technical Requirements

### Imports Required

```mdx
import * as C from "@constants";
import { KnowledgeCheck } from '@components/KnowledgeCheck';
import { Callout } from "@stainless-api/docs/components";
```

### KnowledgeCheck Usage

**Critical:** Always add `client:load` directive for interactivity.

```mdx
<KnowledgeCheck client:load
  questions={[...]}
/>
```

Without `client:load`, the component will render but won't be interactive.

## Testing Before Publishing

1. **Build locally:** `pnpm build` (checks for MDX errors)
2. **Dev server:** `pnpm dev` and test at `localhost:4321`
3. **Test knowledge checks:** Go through each quiz
   - Verify all answers work
   - Check that correct answers are marked correctly
   - Verify explanations display
   - Confirm resources show on incorrect answers
4. **Check links:** All internal links should be root-absolute: `/learn/tiger-data-academy/...`
5. **Lint prose:** `pnpm lint:prose` (if changed files only)
6. **Sidebar:** Verify navigation structure in `astro.config.ts`

## Common Pitfalls

❌ **Don't:** Use this component outside `/learn/tiger-data-academy/`
❌ **Don't:** Create courses with modules > 20 minutes (breaks pacing)
❌ **Don't:** Use double braces for constants (`{{C.NAME}}`) — use single braces: `{C.NAME}`
❌ **Don't:** Include `<KnowledgeCheck>` without `client:load`
❌ **Don't:** Create questions with 2 or 5+ answer options

✅ **Do:** Link to Academy modules for prerequisites
✅ **Do:** Use plain text for section headings (not constants)
✅ **Do:** Test every question before publishing
✅ **Do:** Keep total course time ~60 minutes across all modules
✅ **Do:** Mark incomplete sections with TODO comments

## Resources

- **Component documentation:** `src/components/KnowledgeCheck.README.md`
- **Component code:** `src/components/KnowledgeCheck.tsx`
- **Agent guidance:** `AGENTS.md` (search for "KnowledgeCheck")
- **Reference course:** `/learn/tiger-data-academy/tiger-data-101/`

---

*For questions about Academy course design or pedagogy, refer to the KnowledgeCheck component README and the Tiger Data 101 reference implementation.*
