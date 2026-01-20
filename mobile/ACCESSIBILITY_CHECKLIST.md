# Accessibility (WCAG 2.2 AA) checklist for Fluentia Mobile

This checklist translates **WCAG 2.2 AA** into practical expectations for an **Expo / React Native** app (VoiceOver + TalkBack).

Use this as the acceptance criteria for screen reviews and PRs.

## 1) Perceivable

### 1.1 Text alternatives (1.1.1)
- **Non-text controls** (icon-only buttons, custom tab buttons) have `accessibilityLabel`.
- **Decorative icons/images** are hidden from screen readers when appropriate (`accessible={false}` / `importantForAccessibility="no"`).

### 1.3 Adaptable (1.3.1) + 1.3.2 Meaningful sequence
- **Interactive elements** use correct `accessibilityRole` (`button`, `link`, `tab`, `switch`, etc.).
- **Reading + focus order** matches the visual order (especially in complex cards).
- Avoid embedding important meaning only via layout/position.

### 1.4 Distinguishable
- **1.4.1 Use of color**: don’t rely on color alone for meaning (e.g., error state also includes text/icon).
- **1.4.3 Contrast (Minimum)**: text contrast \(\ge 4.5:1\) (normal) and \(\ge 3:1\) (large text). Validate theme tokens and in-screen combinations.
- **1.4.4 Resize text** / **1.4.10 Reflow (mobile equivalent)**:
  - Support Dynamic Type / font scaling; avoid clipping.
  - Avoid fixed heights for text containers; prefer wrapping and flexible layouts.

## 2) Operable

### 2.1 Keyboard accessible (mobile equivalent)
- Inputs can be navigated predictably; “Next/Done” flows work.
- No traps (e.g., modal can always be dismissed).

### 2.2 Enough time (2.2.1)
- Time-based interactions (sessions) provide pausing/continuation where applicable.

### 2.3 Seizures and physical reactions
- Avoid flashing.
- Respect **Reduce Motion**: don’t force long/complex animations when reduce motion is enabled.

### 2.4 Navigable
- **Screen titles/headings**: each screen has a clear heading (and ideally sets navigation title when using headers).
- **Back navigation** works and is discoverable.
- Avoid unexpected focus jumps after navigation.

### 2.5 Input modalities
- **2.5.8 Target Size (Minimum)**: touch targets \(\ge 44 \times 44\) pt (or provide spacing so accidental activation is unlikely).
  - Applies to tabs, icon buttons, row actions, small toggles.
- Avoid gestures that require fine motor precision without alternatives.

## 3) Understandable

### 3.2 Predictable
- Consistent control placement and labeling across screens (especially settings rows).
- Consistent component behavior (disabled/loading states).

### 3.3 Input assistance (forms)
- **3.3.1 Error identification**: errors are clearly tied to the input, not just a generic toast.
- **3.3.2 Labels/instructions**: inputs have visible labels or strong accessible labels; helper text provided for complex inputs.
- **3.3.3 Error suggestion**: provide actionable recovery guidance (e.g., “Password must be 8+ characters”).
- **Announcements**: when an error occurs, it should be announced (VoiceOver/TalkBack) or be discoverable in the normal reading order.

## 4) Robust

### 4.1 Compatible
- Use standard RN primitives and `accessibility*` props; avoid custom controls that don’t expose semantics.
- Ensure selected/checked/disabled states are exposed (`accessibilityState`, `accessibilityValue`).

## Project conventions (implementation notes)
- Prefer theme tokens over hard-coded colors:
  - Text-on-fill must use `theme.colors.onPrimary` / `theme.colors.onSecondary`.
- Prefer shared primitives for common patterns:
  - `Button`, `ListRow`, `IconButton`, `DestructiveRow` (consistent hit targets + a11y props).
- Add/extend tests:
  - Theme contrast tests.
  - Unit tests for key accessibility props on shared components.

