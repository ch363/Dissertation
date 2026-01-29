# Fluentia – Comprehensive Design Spec (v1.2, HCI + Nielsen Compliance)

This document defines the colours, typography, spacing, component styling, and interaction rules used in the Fluentia mobile app. It is written to support consistent UI, strong usability, accessibility, and predictable behaviour across the app.

---

## 0. HCI and usability goals

Fluentia’s UI should:
- Reduce cognitive load during learning (short actions, clear hierarchy, progressive disclosure).
- Make system status and progress obvious at all times.
- Prevent errors where possible; recover gracefully when they happen.
- Support accessibility by default (contrast, focus, screen reader, scalable text, reduced motion).

---

## 1. Design principles

- **Theme-driven:** All UI uses tokens from a single theme (light or dark). Avoid hardcoded hex values except where noted.
- **WCAG AA:** Text/background and button/on-button colour pairs meet WCAG 2.1 AA contrast (≥4.5:1). This is enforced in tests.
- **Light and dark:** The app supports light mode, dark mode, and “system” (follow device). Use theme colours so both modes look correct.
- **Touch targets:** Interactive elements use a minimum height of 44–48 px where possible.
- **Safe areas:** Respect top (status bar/notch) and bottom (home indicator/tab bar) safe areas.
- **Clear feedback:** Every interaction produces visible feedback (pressed, loading, selected, success/error) quickly (target: within ~100ms).
- **Progressive disclosure:** Explanations and detail are optional and expandable. The default learning loop stays lightweight.
- **Consistency:** Same component behaves the same everywhere (labels, placement, icons, states, terminology).

---

## 2. Colour palette

### 2.1 Light theme

| Token | Hex | Usage |
|-------|-----|--------|
| **primary** | `#1A6FD6` | Primary buttons, links, active tab, progress fill, key CTAs |
| **secondary** | `#12BFA1` | Secondary buttons, accent |
| **onPrimary** | `#FFFFFF` | Text on primary buttons |
| **onSecondary** | `#0E141B` | Text on secondary buttons |
| **link** | `#1A6FD6` | Inline links |
| **background** | `#F4F8FF` | Screen background |
| **card** | `#FFFFFF` | Cards, list rows, modals, inputs |
| **border** | `#E5EAF2` | Dividers, borders |
| **text** | `#0D1B2A` | Primary text |
| **mutedText** | `#5B6C84` | Secondary text |
| **success** | `#2E7D32` | Success |
| **error** | `#D32F2F` | Error / destructive |

### 2.2 Dark theme

| Token | Hex | Usage |
|-------|-----|--------|
| **primary** | `#62A0FF` | Primary buttons, links, active states |
| **secondary** | `#26D4BA` | Secondary buttons, accent |
| **onPrimary** | `#0E141B` | Text on primary |
| **onSecondary** | `#0E141B` | Text on secondary |
| **link** | `#62A0FF` | Inline links |
| **background** | `#0E141B` | Screen background |
| **card** | `#172435` | Cards, surfaces |
| **border** | `#2A3A4F` | Borders |
| **text** | `#E6EEF8` | Primary text |
| **mutedText** | `#9FB1C6` | Secondary text |
| **success** | `#30D158` | Success |
| **error** | `#FF453A` | Error / destructive |

### 2.3 Semantic usage rules

- **Primary:** Main CTAs, active states, progress fill.
- **Secondary:** Secondary actions and accents.
- **Text / mutedText:** Core copy and supporting copy.
- **Card / border:** Surface hierarchy and separation.
- **Success / error:** Feedback and validation.

Non-negotiables:
- Never rely on colour alone for meaning (selection, correctness, destructive, warnings).
- Use icons, labels, and/or shape changes alongside colour.

---

## 2.4 Interaction state tokens (derived; no new hex)

These tokens standardise press/selection/focus/disabled states across the app. They must be derived from existing tokens so they work in both themes.

Recommended additions to `theme.colors`:
- **primaryPressed**: a pressed variant of `primary` (shade/overlay).
- **secondaryPressed**: a pressed variant of `secondary`.
- **surfacePressed**: subtle overlay on `card` for pressed rows/cards (theme-aware).
- **surfaceSelected**: `primary` tint overlay for selected cards/options (theme-aware).
- **borderFocus**: focus ring colour (usually `primary`).
- **borderError**: error border colour (`error`).
- **scrim**: overlay for sheets/modals (e.g., black with alpha).
- **toastBackground** (optional): high-contrast background for transient messages.

State rules:
- **Pressed:** visible state change within ~100ms.
- **Loading:** disable repeat taps; show progress indicator; keep label visible where possible.
- **Selected:** never colour-only; must also show check icon, thicker border, or a clear “Selected” label.
- **Focus:** visible focus ring for keyboard/switch access.
- **Disabled:** visibly disabled and non-interactive; never ambiguous.

---

## 2.5 Surface model (for hierarchy and dark mode)

Standardise surface levels to reduce reliance on shadows:

- **surface0**: `background`
- **surface1**: `card` (default elevated surface)
- **surface2**: more elevated surfaces (bottom sheets, floating toolbars, sticky panels)
- **surfaceInverse** (optional): toasts/snackbars (high contrast)

Dark mode guidance:
- Prefer surface contrast + borders + overlays.
- Use shadows sparingly; don’t depend on them for hierarchy.

---

## 3. Typography

### 3.1 Font family

- Poppins only.
- Weights: 400 (Regular), 600 (SemiBold), 700 (Bold).
- Tokens: `theme.typography.regular`, `semiBold`, `bold`.

### 3.2 Font sizes (in use)

| Size (px) | Use |
|-----------|-----|
| 12 | Captions, labels, metadata, tab label |
| 13 | Small body, card subtitles |
| 14 | Body small, stepper, stat labels |
| 15 | Body |
| 16 | Body default, buttons, list titles, inputs |
| 18 | Section titles, card titles, sheet title |
| 22 | Screen titles, onboarding question titles |
| 24 | Stat value |
| 28 | Session completion title |
| 32 | Session completion stat value, landing title |
| 34 | Onboarding welcome headline |

### 3.3 Semantic text styles (preferred)

Define named styles mapping size + weight + lineHeight so meaning stays consistent:

- **titleXL**: 34, bold, lineHeight ~40–44
- **titleL**: 32, bold, lineHeight ~38–42
- **titleM**: 28, bold/semiBold, lineHeight ~34–38
- **heading**: 22, semiBold, lineHeight ~28–32
- **sectionTitle**: 18, semiBold, lineHeight ~24–28
- **body**: 16, regular, lineHeight ~22–24
- **bodySmall**: 14, regular, lineHeight ~20–22
- **caption**: 12, regular, lineHeight ~16–18

### 3.4 Text scaling, wrapping, truncation

- Support system font scaling where feasible.
- Components must handle wrapping without breaking layout (especially learning content).
- Truncation is allowed for metadata and secondary text, not for core learning prompts.

---

## 4. Spacing

All spacing uses the theme scale.

| Token | Value (px) | Use |
|-------|------------|-----|
| **xs** | 8 | Tight gaps, icon–text spacing |
| **sm** | 12 | Related elements, list padding |
| **md** | 16 | Default card/row padding |
| **lg** | 24 | Section and screen padding |
| **xl** | 32 | Large section gaps, scroll bottom padding |

---

## 5. Border radius

| Token | Value (px) | Use |
|-------|------------|-----|
| **sm** | 8 | Chips, inputs, progress |
| **md** | 12 | Buttons, option cards |
| **lg** | 16 | Cards, modals |
| **round** | 999 | Pills, avatars |

Keep existing hero card radius (22–24) consistent if used; avoid introducing new one-offs.

---

## 6. Shadows and elevation

### 6.1 Light theme

- Standard card: shadowOpacity ~0.08, shadowRadius ~22, elevation ~5.
- Subtle card/row: elevation 1–2 with small shadow.
- Hero cards may use slightly stronger elevation.

### 6.2 Dark theme

Prefer borders and surface separation. Shadows may be used, but must not be required to perceive hierarchy.

---

## 7. Components (design rules)

### 7.1 Buttons

- **Primary:** `primary` + `onPrimary`, min height 44–48, radius 12, clear label.
- **Secondary:** `secondary` + `onSecondary`, same sizing.
- **Ghost:** transparent background, `text`, border `border`.
- **Disabled:** clearly disabled, non-interactive.

Required states:
- pressed (visual)
- loading (spinner + disable)
- disabled (visual + disable)

### 7.2 Cards and surfaces

- Default: surface1 (`card`) + 1px `border`, radius 16, padding md/lg.
- Selected: `surfaceSelected` + non-colour cue (check icon, border thickness, label).
- Pressed: `surfacePressed` overlay.

### 7.3 List rows

- Title 16, subtitle 12, padding md, divider border optional inset.
- Pressed overlay required.
- Destructive variant uses `error` plus icon/label where appropriate.

### 7.4 Inputs

- Border `border`, focus `borderFocus`, error `borderError`.
- Placeholder uses `mutedText`.
- Inline error messages must be specific and close to the field.

### 7.5 Progress indicators

- Track `border`, fill `primary`, height 8, radius 8.
- Always pair with an accessible text label for progress (“3 of 10”, “60%”).

### 7.6 Tab bar

- Active primary; inactive mutedText.
- Background `card`, border top `border`.
- Safe area padding applied.

### 7.7 Icons

- Ionicons only.
- Never use icons as the only indicator of meaning; pair with text where ambiguity exists.

---

## 8. Screen-level defaults

- Background: `background`
- Content padding: md or lg, bottom padding xl + safe area
- No global header bar; screens use semantic title styles
- Safe area respected on top/bottom

---

## 9. Feedback UI contract (learning flows)

Fluentia supports feedback depth (Gentle / Direct / Detailed). This must be consistent across question types.

- **Gentle:**
  - Correct/incorrect status
  - Show the right answer
  - One primary CTA (“Continue”)

- **Direct:**
  - Gentle + one short hint or “why” line
  - Optional plain-language error category (e.g., tense, gender)

- **Detailed:**
  - Direct + expandable explanation (“Why this is right”)
  - Example sentence(s)
  - Optional “Try again” (when pedagogically useful)
  - Detailed content collapsed by default

Rules:
- The primary CTA is always obvious and consistent in placement.
- Explanations never block progress; they’re optional.

---

## 10. Accessibility

- WCAG 2.1 AA contrast for all text/background and button/on-button pairs.
- Minimum touch targets 44–48px.
- Reduce motion supported; animations optional.
- Focus rings visible and consistent.
- Screen reader labels for all controls; announce loading/busy states.
- Do not rely on colour alone for status/selection/correctness.

---

## 11. Error handling and recovery (HCI requirement)

- Validation errors are specific, actionable, and placed near the relevant field.
- Errors explain what happened and what to do next.
- Provide a safe “Back”/cancel path for any potentially destructive flow.
- Prefer undo where feasible (e.g., snackbars for reversible actions).
- Preserve user input after errors (never wipe forms without warning).

---

## 12. Nielsen’s 10 usability heuristics (explicit compliance checklist)

This section is the contract. New UI must satisfy these.

1. **Visibility of system status**
   - Always show loading states, progress, and current step (e.g., onboarding stepper, session progress).
   - Give immediate feedback for taps and selections.

2. **Match between system and the real world**
   - Use plain language: “Review”, “Try again”, “Continue”, “Streak”, “Progress”.
   - Avoid internal jargon (e.g., “SRS”, “FSRS”, “Item difficulty”) in the learner UI.

3. **User control and freedom**
   - Clear back/cancel actions.
   - Safe exits from flows; confirm destructive actions.
   - Allow skipping optional onboarding; allow changing preferences later.

4. **Consistency and standards**
   - Same labels and placements for primary CTAs across screens.
   - Consistent icon meaning and component behaviour.
   - Follow platform conventions where helpful (e.g., iOS/Android navigation expectations).

5. **Error prevention**
   - Disable invalid actions until input is valid where possible.
   - Provide constraints and hints (password rules, required fields).
   - Prefer pickers/toggles over free text where appropriate.

6. **Recognition rather than recall**
   - Keep key options visible; avoid forcing users to remember prior settings.
   - Use previews, examples, and inline hints.
   - Provide persistent progress indicators and recent activity.

7. **Flexibility and efficiency of use**
   - Support quick paths for returning users (resume lesson, continue streak).
   - Keep “advanced” features available but not intrusive (progressive disclosure).
   - Where feasible, support accessibility shortcuts and keyboard/switch navigation.

8. **Aesthetic and minimalist design**
   - Default screens show only what’s needed for the current step.
   - Detailed explanations are expandable, not always-on.
   - Avoid decorative clutter during sessions.

9. **Help users recognize, diagnose, and recover from errors**
   - Error messages explain: what happened, why, and how to fix it.
   - Provide recovery actions (retry, edit, contact support, restore).

10. **Help and documentation**
   - Provide lightweight, contextual help (tooltips, “Why am I seeing this?” links).
   - Include a simple Help/FAQ entry point in settings.
   - For learning logic, provide optional explanations in plain language.

---

## 13. Summary: what to use in new design

| Element | Use |
|--------|-----|
| Colours | Theme tokens + derived state tokens (pressed/selected/focus/scrim) |
| Typography | Poppins + semantic styles + defined line-heights |
| Spacing | xs→xl scale only |
| Radius | sm/md/lg/round only |
| Shadows | supportive, not required (especially in dark mode) |
| Components | standardised states and consistent CTA placement |
| Accessibility | contrast, focus, labels, reduced motion, non-colour cues |
| Usability | must meet Nielsen checklist above |

Avoid introducing new hex values or font families. For new surfaces or states, derive from existing tokens so light/dark and contrast remain consistent.
