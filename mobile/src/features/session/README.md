# Session & Card System Architecture

## Overview

This directory contains the refactored learning/question screen system with a clear separation of concerns and a single source of truth for delivery methods.

> **Note**: See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for how `session` differs from `course` features.

## File Structure

```
session/
├── delivery-methods.ts          # Single source of truth for delivery method constants and mappings
├── components/
│   ├── SessionRunner.tsx        # Main session orchestrator (simplified)
│   ├── CardRenderer.tsx         # Central registry for rendering cards by CardKind
│   └── cards/                   # Individual card components
│       ├── TeachCard.tsx
│       ├── MultipleChoiceCard.tsx
│       ├── FillBlankCard.tsx
│       ├── TranslateCard.tsx
│       ├── ListeningCard.tsx
│       └── index.ts
└── screens/
    └── SessionRunnerScreen.tsx  # Screen wrapper that fetches and transforms data
```

## Delivery Methods → Card Types → Components

### Backend Delivery Methods (from Prisma)
- `FILL_BLANK` → `CardKind.FillBlank` → `<FillBlankCard />`
- `FLASHCARD` → `CardKind.TranslateToEn` → `<TranslateCard />`
- `MULTIPLE_CHOICE` → `CardKind.MultipleChoice` → `<MultipleChoiceCard />`
- `SPEECH_TO_TEXT` → `CardKind.Listening` → `<ListeningCard />`
- `TEXT_TO_SPEECH` → `CardKind.Listening` → `<ListeningCard />`
- `TEXT_TRANSLATION` → `CardKind.TranslateToEn/TranslateFromEn` → `<TranslateCard />`

### Mapping Flow

1. **Backend API** returns delivery method (e.g., `"MULTIPLE_CHOICE"`)
2. **Transformer** (`session-plan-transformer.ts`) uses `delivery-methods.ts` to map to `CardKind`
3. **CardRenderer** uses `CardKind` to select the appropriate component
4. **Card Component** renders the UI

## Key Files

### `delivery-methods.ts`
- Defines `DELIVERY_METHOD` constants (matches backend Prisma enum)
- Maps delivery methods to `CardKind`
- Provides utility functions (`requiresInput`, `requiresSelection`, etc.)

### `CardRenderer.tsx`
- **Single place** where `CardKind` maps to React components
- Handles card container styling
- Delegates to specific card components

### Individual Card Components
Each card type has its own component file:
- `TeachCard.tsx` - Teaching/learning cards with phrase, translation, TTS
- `MultipleChoiceCard.tsx` - Multiple choice questions
- `FillBlankCard.tsx` - Fill-in-the-blank questions
- `TranslateCard.tsx` - Translation questions (both directions)
- `ListeningCard.tsx` - Audio/listening questions

## Benefits

1. **Single Source of Truth**: `delivery-methods.ts` is the only place that defines delivery method constants
2. **Clear Mapping**: Easy to see which delivery method → which card type → which component
3. **Maintainable**: Adding a new delivery method only requires:
   - Adding constant to `delivery-methods.ts`
   - Adding mapping to `DELIVERY_METHOD_TO_CARD_KIND`
   - Creating new card component (if needed)
   - Adding case to `CardRenderer`
4. **Type Safe**: TypeScript ensures delivery methods match between backend and frontend
5. **Testable**: Each card component can be tested independently

## Adding a New Delivery Method

1. Add constant to `backend/prisma/schema.prisma` (DELIVERY_METHOD enum)
2. Add constant to `mobile/src/features/session/delivery-methods.ts`
3. Add mapping in `DELIVERY_METHOD_TO_CARD_KIND`
4. Update transformer in `session-plan-transformer.ts` to handle the new method
5. Create new card component if needed, or reuse existing
6. Add case to `CardRenderer.tsx`

## Example: Adding a New "Drag and Drop" Delivery Method

```typescript
// 1. delivery-methods.ts
export const DELIVERY_METHOD = {
  // ... existing
  DRAG_AND_DROP: 'DRAG_AND_DROP',
} as const;

export const DELIVERY_METHOD_TO_CARD_KIND: Record<DeliveryMethod, CardKind> = {
  // ... existing
  [DELIVERY_METHOD.DRAG_AND_DROP]: CardKind.DragAndDrop,
};

// 2. types/session.ts - Add CardKind.DragAndDrop and DragAndDropCard type

// 3. components/cards/DragAndDropCard.tsx - Create component

// 4. CardRenderer.tsx - Add case for CardKind.DragAndDrop

// 5. session-plan-transformer.ts - Add transformation logic
```
