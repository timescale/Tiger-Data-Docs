# KnowledgeCheck Component

An interactive quiz component **exclusively for Tiger Data Academy courses**. Provides self-paced quizzes with immediate feedback, smart resource recommendations, and score tracking.

## Features

- ✅ Interactive multiple-choice questions (one at a time)
- ✅ Immediate feedback with detailed explanations
- ✅ Smart resource recommendations based on wrong answers
- ✅ Score tracking and completion screen with motivational messaging
- ✅ Progress indicator (e.g., "Question 1 of 5")
- ✅ Responsive mobile-friendly design
- ✅ Light/dark mode support
- ✅ Accessible (keyboard navigation, semantic HTML, ARIA labels)
- ✅ Answer deduplication for resource suggestions

## Usage

### Basic Example

```mdx
import { KnowledgeCheck } from '@components/KnowledgeCheck';

<KnowledgeCheck
  title="Knowledge Check"
  questions={[
    {
      id: 'q1',
      text: 'What is TimescaleDB?',
      answers: [
        { label: 'A standalone time-series database', correct: false },
        { label: 'A PostgreSQL extension for time-series', correct: true },
        { label: 'A cloud-only service', correct: false },
      ],
      explanation: 'TimescaleDB is a PostgreSQL extension that adds time-series capabilities while maintaining full SQL compatibility.',
    },
  ]}
/>
```

## Props

### KnowledgeCheckProps

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `questions` | `Question[]` | Yes | Array of quiz questions |
| `title` | `string` | No | Title displayed at top of quiz (default: "Knowledge Check") |

### Question

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Unique identifier for the question |
| `text` | `string` | Yes | The question text |
| `answers` | `Answer[]` | Yes | Array of 3-4 answer options |
| `explanation` | `string` | Yes | Explanation shown after answering |
| `resources` | `Resource[]` | No | Suggested reading if user answers incorrectly |

### Answer

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Answer text (e.g., "A) Option one") |
| `correct` | `boolean` | Yes | Whether this is the correct answer |

### Resource

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Display name of the resource |
| `url` | `string` | Yes | Link to the resource |
| `type` | `'docs' \| 'blog' \| 'external'` | No | Resource type (for badge display) |

## Example for Course Module

```mdx
---
title: What is TimescaleDB?
---

import * as C from "@constants";
import { KnowledgeCheck } from '@components/KnowledgeCheck';

## Content...

## Knowledge Check

<KnowledgeCheck client:load
  questions={[
    {
      id: 'tsdb-intro-q1',
      text: 'TimescaleDB is best described as:',
      answers: [
        { label: 'A standalone time-series database that replaces PostgreSQL', correct: false },
        { label: 'A PostgreSQL extension that adds time-series capabilities', correct: true },
        { label: 'A cloud-only managed database service', correct: false },
      ],
      explanation: 'TimescaleDB is a PostgreSQL extension; your app sees a regular Postgres database with superpowers for time-series workloads.',
      resources: [
        { title: 'What is TimescaleDB?', url: '/learn/tiger-data-academy/tiger-data-101/what-is-timescaledb', type: 'docs' },
        { title: 'Tiger Data Whitepaper', url: '/learn/deep-dive/whitepaper', type: 'docs' },
      ],
    },
    {
      id: 'tsdb-intro-q2',
      text: 'Which feature automatically partitions a table by time?',
      answers: [
        { label: 'Hypercore', correct: false },
        { label: 'Continuous Aggregates', correct: false },
        { label: 'Hypertables', correct: true },
      ],
      explanation: 'Hypertables handle automatic time-based partitioning into chunks; this optimization enables efficient queries on time-series data.',
      resources: [
        { title: 'Understand Hypertables', url: '/learn/hypertables/understand-hypertables', type: 'docs' },
        { title: 'Create and Configure a Hypertable', url: '/learn/hypertables/creating-and-configuring-hypertables', type: 'docs' },
      ],
    },
  ]}
/>
```

## How It Works

1. User completes the quiz
2. Component identifies which questions they got wrong
3. On the results screen, it displays a "Suggested Reading" section
4. Resources from incorrect answers are shown with:
   - **Title**: The resource name
   - **Link**: Clickable link to the resource
   - **Badge**: Type indicator (docs, blog, external)
5. Multiple same resources are deduplicated automatically

## Resource Type Badges

- 🟢 **docs** - Internal documentation (green)
- 🔵 **blog** - Tiger Data blog posts (blue)
- 🟣 **external** - External resources (purple)

## Tips for Customization

- **Easy updates**: Just change the `resources` array in any question
- **Reuse**: Link to the same resource across multiple questions
- **Flexibility**: Mix docs, blog posts, and external resources
- **Smart dedup**: If multiple wrong answers link to the same resource, it appears once
- **Relevance**: Suggestions only show for questions the user got wrong

## Styling

The component uses CSS custom properties and the `light-dark()` function for theme support, so it works seamlessly in both light and dark modes.

### Colors Used

- `--sl-color-accent` - Primary button and accent color
- `--sl-color-gray-1` through `--sl-color-gray-7` - Background and text colors
- `#22c55e` - Success/correct answer color
- `#ef4444` - Error/incorrect answer color

## Behavior

1. **Initial State**: User sees the first question and can select one of the answer options
2. **Submit**: Click "Check Answer" to submit (disabled until an answer is selected)
3. **Feedback**: Component shows if the answer is correct/incorrect with an explanation
4. **Next Question**: Click "Next Question" to advance
5. **Results**: After all questions, user sees a completion screen with:
   - Percentage score
   - Number of correct answers
   - Motivational message based on score
   - Option to retake the quiz

## Accessibility

- Keyboard navigable (Tab to move between buttons, Enter/Space to select)
- Clear visual feedback for selected and correct/incorrect answers
- ARIA-friendly button structure
- Semantic HTML
- Sufficient color contrast

## Integration Steps

1. Import the component in your MDX file
2. Define questions array with proper structure
3. Render component with `<KnowledgeCheck ... />`
4. No additional setup needed

The component handles all state management internally.

---

## Academy-Only Component ⚠️

**This component is designed exclusively for Tiger Data Academy courses** (located at `/learn/tiger-data-academy/`). Do not use in other documentation sections.

### Where to Use

✅ **DO use in:**
- Tiger Data Academy course modules (`/learn/tiger-data-academy/tiger-data-101/*`)
- Academy course assessments and knowledge checks
- Module learning outcomes validation

❌ **DON'T use in:**
- General `/learn/` documentation pages
- `/build/` quickstarts or tutorials
- `/deploy/` guides
- `/integrate/` sections
- `/reference/` material
- `/get-started/` pages

### Why Academy-Only?

The component is purpose-built for self-paced structured learning with:
- Curated question progression
- Smart resource linking within the Academy
- Score-based pathways and recommendations
- Course-specific learning objectives

Using it elsewhere dilutes its pedagogical value and creates navigation confusion.

---

## Creating Academy Course Modules

When creating a new Tiger Data Academy course:

1. **Create the course directory** under `/learn/tiger-data-academy/`
   ```
   /learn/tiger-data-academy/
   ├── tiger-data-101/          (existing 101 course)
   ├── your-new-course/         (your course)
   │   ├── index.mdx            (overview)
   │   ├── module-1.mdx
   │   ├── module-2.mdx
   │   └── resources.mdx
   ```

2. **Add Knowledge Check to each module**
   - Import component: `import { KnowledgeCheck } from '@components/KnowledgeCheck';`
   - Add `client:load` directive: `<KnowledgeCheck client:load questions={[...]} />`
   - Structure 3-5 questions per module (keep modules to 10-15 minutes)

3. **Link resources strategically**
   - Link to other Academy modules for foundational concepts
   - Link to `/learn/` docs for deep dives
   - Link to blog posts for context/case studies
   - Prefer internal links (Academy and `/learn/`) over external

4. **Update sidebar in astro.config.ts**
   ```ts
   {
     label: "Your Course",
     collapsed: true,
     items: [
       { label: "Overview", link: "/learn/tiger-data-academy/your-course" },
       { label: "Module 1", link: "/learn/tiger-data-academy/your-course/module-1" },
       { label: "Module 2", link: "/learn/tiger-data-academy/your-course/module-2" },
     ],
   }
   ```

---

## Question Design Best Practices

### Question Structure
- Keep text **clear and concise** (one sentence when possible)
- Avoid ambiguous wording
- Options should be **mutually exclusive**
- Order options logically (avoid always putting correct answer in same position)

### Answer Options
- **3-4 options** per question (3 for intro modules, 4 for advanced)
- **One clearly correct answer**
- Incorrect options should be **plausible distractors** (not obviously wrong)
- Avoid "all of the above" / "none of the above"

### Explanations
- **Always explain why the correct answer is right**
- Briefly mention why common wrong answers are wrong
- 1-2 sentences max; keep it scannable
- Use language consistent with module content

### Resources
- Link to resources **directly relevant** to the question topic
- Prioritize:
  1. Other Academy modules on prerequisites
  2. `/learn/` doc pages on the topic
  3. Tiger Data blog posts for context
  4. External resources (sparingly)
- 1-3 resources per question (usually 2 is optimal)
- Use accurate `type` badges: `'docs'`, `'blog'`, `'external'`

---

## Scoring & Messaging

The component shows different messaging based on score:

| Score | Message |
| --- | --- |
| 100% | "Perfect score! You've mastered this material." |
| 80-99% | "Great job! You understand the key concepts." |
| 60-79% | "Good effort! Consider reviewing the material." |
| <60% | "Keep learning! Review the module and try again." |

Scores are shown as:
- Percentage (0-100%)
- Fraction (e.g., "4/5")
- Circular progress indicator

---

## Common Patterns

### Pattern 1: Progressive Difficulty
Arrange questions from concept → application → analysis

```mdx
Q1: "What is a Hypertable?" (Definition - Remember level)
Q2: "Which feature does X?" (Concept - Understand level)
Q3: "Which approach would you use for Y scenario?" (Application - Apply level)
```

### Pattern 2: Misconception Testing
Include questions that test common misunderstandings

```mdx
❌ "TimescaleDB is its own database"
✅ "TimescaleDB is a PostgreSQL extension"
```

### Pattern 3: Real-World Scenarios
Use practical examples for application-level questions

```mdx
"A team collects 10M sensor readings daily.
Which TimescaleDB feature handles the write volume?"
```

---

## Troubleshooting

### Component not interactive
- ✅ Add `'use client'` directive (already in component)
- ✅ Add `client:load` to MDX usage: `<KnowledgeCheck client:load ... />`
- ✅ Rebuild dev server

### Questions not rendering
- ✅ Verify all required fields (`id`, `text`, `answers`, `explanation`)
- ✅ Ensure `answers` array has at least 3 items
- ✅ Check for syntax errors in the questions array

### Resources not showing
- ✅ Resources only show when user answers a question **incorrectly**
- ✅ Verify `resources` array is included in question
- ✅ Check URL format (internal: `/path`, external: `https://...`)

---

## Maintenance & Updates

### When to Update Questions
- After significant product changes (new features, API changes)
- When misconceptions emerge in user feedback
- To improve relevance to current use cases
- When resources become outdated or links break

### How to Update
1. Edit the question in the `.mdx` file
2. Rebuild (questions load dynamically)
3. Test in dev server (`pnpm dev`)
4. Deploy via normal PR process

### Monitoring
- No built-in analytics, but you can:
  - Monitor user completion rates via page analytics
  - Gather feedback through course surveys
  - Track common wrong answers manually

---

## Support & Contribution

To improve the KnowledgeCheck component:
- Report bugs or issues to maintainers
- Suggest new features via product feedback
- Share best practices with other course creators
- Update this README if you discover gaps or improvements

Questions about using the component in Academy courses? Check the examples in:
- `/learn/tiger-data-academy/tiger-data-101/what-is-timescaledb.mdx` (reference implementation)
- Other Tiger Data 101 modules for additional patterns
