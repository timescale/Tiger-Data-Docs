# KnowledgeCheck Component

An interactive quiz component for the Tiger Data Academy courses. Allows users to test their understanding with self-paced quizzes that provide immediate feedback.

## Features

- ✅ Interactive multiple-choice questions
- ✅ Immediate feedback with explanations
- ✅ Score tracking and completion screen
- ✅ Progress indicator
- ✅ Responsive design
- ✅ Accessible (keyboard navigation, clear feedback)

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

### Answer

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Answer text (e.g., "A) Option one") |
| `correct` | `boolean` | Yes | Whether this is the correct answer |

## Example for Course Module

```mdx
---
title: What is TimescaleDB?
---

import * as C from "@constants";
import { KnowledgeCheck } from '@components/KnowledgeCheck';

## Content...

## Knowledge Check

<KnowledgeCheck
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
    },
  ]}
/>
```

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
