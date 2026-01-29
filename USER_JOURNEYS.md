# Fluentia — HCI-Focused User Journeys & Screen Usage (Figma + Prototype Reference)

This document defines Fluentia’s end-to-end user journeys and per-screen behaviour, grounded in HCI principles: progressive disclosure, reduced cognitive load, clear feedback, accessibility, and habit formation. It is intended to support high-fidelity Figma prototyping and interaction design decisions.

---

## Part 1: Core User Journeys

### Journey 1: First-time user (Sign up → Onboarding → Home)

**Design intent:** Minimise friction, avoid early overload, and communicate value before effort.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Landing | `/` | Value proposition + two clear actions (“Get Started” / “Log In”). |
| 2 | Sign up | `/(auth)/sign-up` | Email/password with inline validation + visible password rules. |
| 3 | Verify email (optional) | `/(auth)/verify-email` | App handles state and redirects automatically after verification. |
| 4 | Onboarding welcome | `/(onboarding)/welcome` | Sets expectations (“1–2 minutes”). One primary CTA. |
| 5 | Onboarding step 1 | `/(onboarding)/1_motivation-goals` | One question, single-choice, skip available but secondary. |
| 6 | Onboarding steps 2–9 | `/(onboarding)/2_*` → `9_*` | Optional personalisation using consistent patterns. |
| 7 | Onboarding completion | `/(onboarding)/completion` | Review summary, save, proceed. |
| 8 | Home | `/(tabs)/home` | One primary “what should I do now?” CTA. |

**HCI notes**
- Prioritise recognition over recall (options as cards).
- Optional steps reduce perceived commitment.
- “Continue” language reinforces momentum.

---

### Journey 2: Returning user (Sign in → Home)

**Design intent:** Fast re-entry with instant orientation.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Landing | `/` | User taps “Log In”. |
| 2 | Sign in | `/(auth)/sign-in` | Autofocus email, keyboard-optimised, quick submit. |
| 3 | Home | `/(tabs)/home` | Greeting + streak + single recommended action. |

**HCI notes**
- System status is visible (streak, next action).
- Avoid branching decisions on entry.

---

### Journey 3: Start a lesson from Home (Primary CTA)

**Design intent:** One tap from intent to learning.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Home | `/(tabs)/home` | “Next up” card with time estimate and lesson type. |
| 2 | Lesson start | `/(tabs)/learn/[lessonId]/start` | Lightweight confirmation, not a second decision gate. |
| 3 | Session runner | `/session/[sessionId]` | Linear flow, one task at a time, visible progress. |
| 4 | Session completion | `/session/[sessionId]/completion` | Positive reinforcement (XP, mastery). |
| 5 | Session summary | `/session/[sessionId]/summary` | Reflection + next step choice. |

**HCI notes**
- Time estimates reduce anxiety.
- Progress bar supports goal-gradient effect.
- Completion and summary are separated to avoid overload.

---

### Journey 4: Start a review session

**Design intent:** Make maintenance feel lightweight, not punitive.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Home | `/(tabs)/home` | Review framed as a small task (“12 cards, ~4 min”). |
| 2 | Review overview | `/(tabs)/learn/review` | Due count + clear zero-due state (no guilt framing). |
| 3 | Session runner | `/session/[sessionId]` | Same interaction model as lessons for consistency. |
| 4 | Completion → Summary | As above | Same reward and reflection loop. |

---

### Journey 5: Browse Learn → Choose lesson → Run session

**Design intent:** Support exploration without decision paralysis.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Home | `/(tabs)/home` | Secondary CTA: “Browse learning paths”. |
| 2 | Learn hub | `/(tabs)/learn` | Curated suggestions first, full list later. |
| 3 | Lesson list | `/(tabs)/learn/list` | Filters reduce complexity; search optional. |
| 4 | Lesson overview | `/(tabs)/learn/[lessonId]` | Outcome-focused description + progress. |
| 5 | Lesson start | `/(tabs)/learn/[lessonId]/start` | Same launch pattern as Home CTA. |
| 6 | Session → Completion → Summary | | Consistent learning loop. |

---

### Journey 6: Profile & Settings

**Design intent:** Reflection and control without distracting from learning.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Profile | `/(tabs)/profile` | Identity, progress, mastery at a glance. |
| 2 | Profile edit | `/(tabs)/profile/edit` | Lightweight edits only (name/avatar). |
| 3 | Settings | `/(tabs)/settings` | Clear grouping: appearance vs learning behaviour. |
| 4 | Sub-settings | `/(tabs)/settings/speech`, `/(tabs)/settings/session`, `/(tabs)/settings/session-lesson` | Single-purpose screens. |

---

### Journey 7: Password recovery

**Design intent:** Low stress, clear recovery, no dead ends.

| Step | Screen | Route | User experience |
|---:|---|---|---|
| 1 | Sign in | `/(auth)/sign-in` | Tap “Forgot password?”. |
| 2 | Forgot password | `/(auth)/forgot-password` | Enter email; clear success confirmation. |
| 3 | Update password | `/(auth)/update-password` | Set new password from email link; confirmation then redirect. |

---

## Part 2: Per-Screen Behaviour (Figma-Ready)

For each screen: purpose, interaction model, key UI, feedback, example content, states, actions, and Figma frame checklist.

---

### Landing

- **Route:** `/`
- **Purpose:** Orient new users; reduce choice complexity.
- **Interaction model:** Two full-width buttons; no scrolling.
- **Key UI:** Logo, title, subtitle, primary/secondary CTA.
- **Example content:**
  - Title: “Fluentia”
  - Subtitle: “Personalised learning, one step at a time.”
  - Buttons: “Get Started” / “Log In”
- **States:** Default only.
- **Actions:** Get Started → `/(auth)/sign-up`; Log In → `/(auth)/sign-in`
- **Figma frames:** Default (light + dark).

---

### Sign in

- **Route:** `/(auth)/sign-in`
- **Purpose:** Fast authentication with clear recovery paths.
- **Interaction model:** Inline validation; submit disabled until valid.
- **Key UI:** Email, password, Sign in, Forgot password, link to Sign up.
- **Example content:** Email: `you@example.com`, Password: `••••••••`
- **States:** Default; Loading (button); Error (inline); Validation errors.
- **Actions:** Submit → RouteGuard → onboarding or Home.
- **Figma frames:** Default; field error; auth error; loading.

---

### Sign up

- **Route:** `/(auth)/sign-up`
- **Purpose:** Create account with minimal friction.
- **Interaction model:** Inline rules (password); confirm password optional.
- **Key UI:** Email, password, (confirm), Create account, link to Sign in.
- **States:** Default; Loading; Error (email in use); Validation errors.
- **Actions:** Submit → verify email (if required) or onboarding/Home.
- **Figma frames:** Default; validation error; loading; email in use.

---

### Verify email

- **Route:** `/(auth)/verify-email`
- **Purpose:** Handle email confirmation link; show system status.
- **Interaction model:** Passive; no user work unless fallback needed.
- **Key UI:** “Verifying…” + subtle progress indicator; optional “Resend email”.
- **States:** Verifying; Success (auto redirect); Failed (resend + support).
- **Actions:** Success → onboarding/Home; Failed → resend.
- **Figma frames:** Verifying; failed/resend.

---

### Onboarding welcome

- **Route:** `/(onboarding)/welcome`
- **Purpose:** Set expectations and reduce onboarding anxiety.
- **Interaction model:** Single CTA.
- **Key UI:** Headline, subtext (“1–2 mins”), illustration, Start button.
- **Example content:**
  - Headline: “Learn Italian, your way.”
  - Subtext: “A few quick questions to personalise your journey (1–2 mins).”
  - Button: “Start My Journey”
- **States:** Default.
- **Actions:** Start → step 1.
- **Figma frames:** Default (light + dark).

---

### Onboarding steps (pattern)

- **Routes:** `/(onboarding)/1_*` … `/(onboarding)/9_*`
- **Purpose:** Personalise learning while keeping effort low.
- **Interaction model:** One question per screen; single-choice unless necessary.
- **Key UI:** Stepper (“Step X of 9”), progress bar, title, option cards, Skip + Next.
- **States:** None selected; selected; (optional) multi-select; error (rare).
- **Actions:** Select → enable Next; Skip → next step; Next → next step.
- **Figma frames:** No selection; selected; (optional) skip confirmation pattern.

**Example (Step 1: Motivation & goals)**
- Options: Travel, Family/friends, Study/career, Fun/personal growth

---

### Onboarding completion

- **Route:** `/(onboarding)/completion`
- **Purpose:** Confirm choices and give a sense of control.
- **Interaction model:** Summary + one CTA.
- **Key UI:** “You’re all set” + summary list, Continue, optional Back/edit.
- **States:** Default; Saving; Error (retry + continue anyway).
- **Actions:** Continue → save → Home.
- **Figma frames:** Default; saving; error modal.

---

### Home

- **Route:** `/(tabs)/home`
- **Purpose:** Reduce decision load; provide a single recommended next action.
- **Interaction model:** One primary CTA; secondary explore link.
- **Key UI (top to bottom):**
  - Welcome card (name, streak, minutes studied)
  - Today summary (reviews due / time)
  - Primary “Next up” CTA card (review or lesson)
  - Short “Why this next” line (optional)
  - “Browse learning paths” link
- **States:** Loading (skeleton); Loaded (review/lesson variants); Error (fallback CTA).
- **Actions:** Primary CTA → review overview or lesson start/session; Browse → Learn.
- **Figma frames:** Loading; Review CTA; Continue lesson CTA; Start next CTA; All caught up; Error fallback.

---

### Learn hub

- **Route:** `/(tabs)/learn`
- **Purpose:** Guided exploration; entry point for review and lesson discovery.
- **Interaction model:** Curated content first; lists second.
- **Key UI:** Discover carousel, Review card with due count, Your path modules, See all lessons.
- **States:** Loading; Loaded; Empty suggestions.
- **Actions:** Discover → lesson start; Review → review overview; Path item → lesson overview; See all → lesson list.
- **Figma frames:** Loading; loaded; empty suggestions.

---

### Lesson list

- **Route:** `/(tabs)/learn/list`
- **Purpose:** Browse all lessons with manageable complexity.
- **Interaction model:** Filter chips + optional search.
- **Key UI:** Search bar, filter chips, lesson rows with progress/status.
- **States:** Loading; Loaded; Empty; Error.
- **Actions:** Tap row → lesson overview; filter/search updates list.
- **Figma frames:** Mixed statuses; empty; filters active.

---

### Lesson overview

- **Route:** `/(tabs)/learn/[lessonId]`
- **Purpose:** Confirm the lesson outcome and current progress.
- **Interaction model:** Outcome-led description (not content dump).
- **Key UI:** Title, short outcome, progress indicator, Start/Continue.
- **States:** Loading; Not started; In progress; Completed; Error.
- **Actions:** Start/Continue → lesson start.
- **Figma frames:** Not started; in progress; completed.

---

### Lesson start

- **Route:** `/(tabs)/learn/[lessonId]/start`
- **Purpose:** Lightweight confirmation and session launch.
- **Interaction model:** Minimal choices, avoids a second “decision wall”.
- **Key UI:** Lesson title, time estimate, card count, Start button, secondary nav.
- **States:** Loading; Loaded; Error.
- **Actions:** Start → session runner.
- **Figma frames:** Loading; loaded; error.

---

### Review overview

- **Route:** `/(tabs)/learn/review`
- **Purpose:** Provide clarity on what review means today.
- **Interaction model:** One CTA + clear zero state.
- **Key UI:** Due count, estimated time, Start review.
- **States:** Loading; Has due; Zero due.
- **Actions:** Start review → session runner (`kind=review`).
- **Figma frames:** Has due; zero due.

---

### Session runner

- **Route:** `/session/[sessionId]`
- **Purpose:** Deep focus learning flow with tight feedback loops.
- **Interaction model:** One card at a time; no scrolling during tasks.
- **Key UI:** Progress (e.g. 3/8), card content, primary action button (“Check/Next”), optional audio.
- **Card types (example content):**
  - Teach: “Ciao!” → “Hi/Hello” + Listen
  - MCQ: “What does ‘Ciao’ mean?” + options + Check
  - Fill blank: “___, come stai?” + word bank
  - Translate: IT ↔ EN prompt + input
  - Listening: Play audio → answer
- **States:** Loading; Active; Correct feedback; Incorrect feedback; Submitting; Error.
- **Actions:** Check → feedback → Next; last card → completion.
- **Figma frames:** One per card type + correct/incorrect variants + loading/error.

---

### Session completion

- **Route:** `/session/[sessionId]/completion`
- **Purpose:** Motivation and reinforcement.
- **Interaction model:** Celebrate then move on.
- **Key UI:** “Session Complete!”, XP earned, mastery stats, See summary.
- **States:** Default.
- **Actions:** See summary → summary screen.
- **Figma frames:** Light + dark.

---

### Session summary

- **Route:** `/session/[sessionId]/summary`
- **Purpose:** Reflection and transition.
- **Interaction model:** Simple list + next step.
- **Key UI:** Teachings list (phrase + translation), CTA to next lesson (if available), Back to Learn/Home.
- **States:** Loading; Loaded; No next lesson.
- **Actions:** Continue → next lesson start; Back → Learn/Home.
- **Figma frames:** With next lesson CTA; without.

---

### Profile

- **Route:** `/(tabs)/profile`
- **Purpose:** Identity, progress, mastery overview.
- **Interaction model:** Stats are descriptive; avoids comparative framing.
- **Key UI:** Avatar, name, streak, XP, progress bar, recent activity, mastery/skills.
- **States:** Loading; Loaded; Edit entry point.
- **Actions:** Edit → profile edit.
- **Figma frames:** Loading; loaded; edit entry highlighted.

---

### Profile edit

- **Route:** `/(tabs)/profile/edit`
- **Purpose:** Lightweight changes only.
- **Key UI:** Avatar picker, name field, Save/Cancel.
- **States:** Default; Saving; Error.
- **Actions:** Save → Profile.
- **Figma frames:** Default; saving; error.

---

### Settings

- **Route:** `/(tabs)/settings`
- **Purpose:** User control over learning and appearance.
- **Interaction model:** Grouped by mental model.
- **Key UI:** Sections: Appearance (dark mode), Learning (speech/session defaults/session scope), Sign out.
- **States:** Default.
- **Actions:** Navigate into sub-settings; Sign out confirmation.
- **Figma frames:** Light; dark; sign out confirm modal.

---

### Speech settings

- **Route:** `/(tabs)/settings/speech`
- **Purpose:** TTS preferences.
- **Key UI:** Toggle + speed slider/presets.
- **States:** Default.
- **Figma frames:** Default.

---

### Session defaults

- **Route:** `/(tabs)/settings/session`
- **Purpose:** Session length and exercise mix.
- **Key UI:** Time budget picker; toggles for exercise types.
- **States:** Default.
- **Figma frames:** Default.

---

### Session lesson picker

- **Route:** `/(tabs)/settings/session-lesson`
- **Purpose:** Session scope (“Any” or a chosen lesson/module).
- **Key UI:** Single-select list; “Any” option at top.
- **States:** Default.
- **Figma frames:** Default; one selected.

---

### Forgot password

- **Route:** `/(auth)/forgot-password`
- **Purpose:** Recovery request with clear success feedback.
- **Key UI:** Email field + send button + link back to sign in.
- **States:** Default; Loading; Success (“Check your email”); Error.
- **Figma frames:** Default; success; error.

---

### Update password

- **Route:** `/(auth)/update-password`
- **Purpose:** Set new password from email link.
- **Key UI:** New password, confirm, submit.
- **States:** Default; validation error; success redirect.
- **Figma frames:** Default; validation error.

---

## Part 3: Global UI + HCI Principles (Figma + Implementation Notes)

### Navigation model
- **Tabs (persistent):** Home, Learn, Profile, Settings.
- **Stacks (task flows):** Auth, Onboarding, Sessions, and deep Learn pages.
- No visible header by default; show back affordance where users expect it (lesson start, lesson overview, summaries).

### Consistency rules
- Primary action sits in the same place across flows.
- Use consistent verbs: “Start”, “Continue”, “Check”, “Next”.
- Same runner for lesson and review to reduce learning overhead.

### Accessibility requirements
- Large tap targets (≥44px).
- Input labels not placeholder-only.
- No colour-only meaning for correctness; add icon/text.
- Respect reduced motion.
- Text scales with OS settings.
- Light/dark parity (contrast checks).

### Feedback and system status
- Every action yields visible feedback within 100–300ms.
- Loading uses skeletons where context matters (Home, Learn lists).
- Errors are recoverable, written plainly, and provide a next action.

### Error handling principles
- Prefer inline field errors over modals.
- Network/session failure: show retry and safe exit (Home).
- Never strand users in auth/onboarding states without guidance.

---

## Figma Frame Checklist (quick build list)

- Landing (light + dark)
- Sign in (default, validation error, auth error, loading)
- Sign up (default, validation error, email in use, loading)
- Verify email (verifying, failed/resend)
- Onboarding welcome (light + dark)
- Onboarding step template (no selection, selected)
- Onboarding completion (default, saving, error)
- Home (loading, review CTA, continue lesson CTA, start next CTA, all caught up, error fallback)
- Learn hub (loading, loaded, empty suggestions)
- Lesson list (loading, loaded mixed statuses, empty, error)
- Lesson overview (not started, in progress, completed)
- Lesson start (loading, loaded, error)
- Review overview (has due, zero due)
- Session runner: Teach, MCQ (default/correct/incorrect), Fill blank (default/correct/incorrect), Translate (default/correct/incorrect), Listening (default/correct/incorrect), loading, error
- Completion (light + dark)
- Summary (with next, without next)
- Profile (loading, loaded)
- Profile edit (default, saving, error)
- Settings (light + dark, sign out confirm)
- Speech settings
- Session defaults
- Session lesson picker
- Forgot password (default, success, error)
- Update password (default, validation error)
