# Features Architecture

## Overview

This document explains the difference between `course` and `session` features, and how they work together.

## Course vs Session

### `src/features/course` - Course Organization & Navigation

**Purpose**: High-level course/module management, navigation, and metadata.

**Responsibilities**:
- Displaying course listings (CourseIndexScreen)
- Showing course details and metadata (CourseDetailScreen)
- Navigating to start a course (CourseRunScreen)
- Course-level progress tracking

**Key Files**:
- `CourseIndexScreen.tsx` - Lists available courses/modules
- `CourseDetailScreen.tsx` - Shows course info, "Start" button
- `CourseRunScreen.tsx` - **Wrapper that delegates to SessionRunnerScreen**

**Data Model**: Works with **Modules** (courses) and **Lessons**

**Example Flow**:
```
User clicks "Basics" course
  → CourseDetailScreen (shows course info)
  → User clicks "Start"
  → CourseRunScreen (finds first lesson in module)
  → SessionRunnerScreen (actual learning experience)
```

### `src/features/session` - Learning Experience & Practice

**Purpose**: Low-level learning experience - cards, questions, practice, progress tracking.

**Responsibilities**:
- Fetching session plans from backend
- Rendering different card types (Teach, MultipleChoice, FillBlank, etc.)
- Managing session state (current card, attempts, progress)
- Handling user interactions (answers, selections)
- Tracking attempt logs
- Session completion

**Key Files**:
- `SessionRunnerScreen.tsx` - Fetches session plan, manages session state
- `SessionRunner.tsx` - Orchestrates card progression
- `CardRenderer.tsx` - Renders cards based on type
- `cards/*.tsx` - Individual card components
- `delivery-methods.ts` - Maps backend delivery methods to card types

**Data Model**: Works with **SessionPlans**, **Cards**, **Questions**, **DeliveryMethods**

**Example Flow**:
```
SessionRunnerScreen receives lessonId
  → Fetches session plan from backend
  → Transforms backend format to frontend cards
  → SessionRunner displays cards one by one
  → User interacts with cards
  → Progress tracked, session completed
```

## Relationship

```
Course (High-Level)
  └── Module: "Italian Basics"
      └── Lesson: "Greetings"
          └── Session (Low-Level)
              └── Cards: [Teach, MultipleChoice, FillBlank, ...]
```

### How They Work Together

1. **Course** provides navigation and context
   - User browses courses
   - User selects a course
   - Course finds the first lesson

2. **Session** provides the actual learning
   - CourseRunScreen gets the lesson ID
   - Passes it to SessionRunnerScreen
   - SessionRunnerScreen handles all the learning logic

3. **Separation of Concerns**
   - **Course** = "What should I learn?" (organization)
   - **Session** = "How do I learn it?" (practice)

## Code Example

```tsx
// CourseRunScreen.tsx - Course feature
export default function CourseRun() {
  const { slug } = useLocalSearchParams();
  const [firstLessonId, setFirstLessonId] = useState(null);
  
  // Course responsibility: Find first lesson in module
  useEffect(() => {
    const lessons = await getModuleLessons(slug);
    setFirstLessonId(lessons[0].id);
  }, [slug]);
  
  // Delegate to Session feature for actual learning
  return <SessionRunnerScreen lessonId={firstLessonId} kind="learn" />;
}
```

```tsx
// SessionRunnerScreen.tsx - Session feature
export default function SessionRunnerScreen({ lessonId }) {
  // Session responsibility: Fetch and run learning session
  const planData = await getSessionPlan({ lessonId });
  const transformedPlan = transformSessionPlan(planData);
  
  return <SessionRunner plan={transformedPlan} onComplete={handleComplete} />;
}
```

## When to Use Which

### Use `course` feature when:
- ✅ Displaying course/module listings
- ✅ Showing course metadata (title, description, progress)
- ✅ Navigating between courses
- ✅ Course-level actions (mark complete, etc.)

### Use `session` feature when:
- ✅ Rendering learning cards/questions
- ✅ Handling user answers/interactions
- ✅ Tracking session progress
- ✅ Managing card progression
- ✅ Working with delivery methods

## Summary

| Aspect | Course | Session |
|--------|--------|---------|
| **Level** | High-level (organization) | Low-level (practice) |
| **Focus** | Modules, Lessons, Navigation | Cards, Questions, Interactions |
| **Data** | Module metadata, lesson lists | Session plans, cards, attempts |
| **User Action** | "Start Course" | "Answer Question" |
| **Delegates To** | Session (for learning) | N/A (end of chain) |

## Future Considerations

Currently, `CourseRunScreen` is a thin wrapper that just finds the first lesson and delegates. In the future, you might want to:

1. **Course-level features**:
   - Course progress overview
   - Lesson sequencing logic
   - Course completion tracking
   - Course recommendations

2. **Session-level features**:
   - Adaptive difficulty
   - Spaced repetition
   - Session analytics
   - Review scheduling

The separation allows these features to evolve independently.
