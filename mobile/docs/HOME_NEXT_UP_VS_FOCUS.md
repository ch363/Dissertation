# Why both "NEXT UP" and "Focus" belong on Home

It’s easy to think they’re redundant when both mention the same topic (e.g. "Basics") and can point at the same lesson. They serve different jobs: **NEXT UP** is the immediate action; **Focus** is context and continuity.

## What each section does

| | NEXT UP | Focus |
|---|--------|--------|
| **Question it answers** | "What should I do *right now*?" | "*Where* am I in my journey and *why* this?" |
| **Content** | One primary action: Start Review / Continue Lesson / Start Learning, with time and exercise count | Current focus *area* (e.g. "Basics"), next lesson in that area, progress, and optional "Why?" |
| **Interaction** | Single, prominent CTA (and Review vs Learn toggle when both exist) | Tappable card that can start the same lesson, but emphasis is on *reading* context |
| **Driven by** | `selectHomeNextAction` (review → continue → start next) | Same data, but framed as *topic + narrative* (module, weakest skill, progress, "why this") |

So when both show "Basics", NEXT UP is saying *"Start this session now"*; Focus is saying *"You’re in Basics; here’s the next lesson in that thread (and why)."*

## Why both are needed

1. **Different cognitive roles**  
   NEXT UP is the decision: "Do this." Focus is the story: "You’re here; this is what’s next in this strand." One is *action*, the other is *orientation*. Removing Focus would make the home feel like a single button with no sense of path; removing NEXT UP would make "what to do now" less obvious.

2. **They diverge when review is primary**  
   When the user has due reviews, NEXT UP becomes "Start Review • ~5 min • 14 due" (and optionally a Learn segment). Focus can still show "Focus: Basics" (or "Weakest skill: X" / "Due reviews") and "Next lesson: Numbers 20–100" or "From: [last lesson]". So NEXT UP answers "do reviews now"; Focus answers "what’s my current strand and what comes after?"

3. **Focus carries the "why"**  
   Focus is where we surface "Based on your learning path", "Your lowest mastery right now", or lesson-level "why" copy. That rationale doesn’t fit on the primary CTA without cluttering it. Focus is the right place for trust and transparency.

4. **Continuity across sessions**  
   NEXT UP changes every time the recommended action changes (review vs continue vs new lesson). Focus keeps the *topic* (e.g. "Basics") and progress ("2/3 complete", "Next: Numbers 20–100") visible so the user sees a stable thread, not just a one-off task.

5. **One tap vs. understanding**  
   Both can start the same lesson when there’s a single clear next step. NEXT UP is optimized for "I’ll just do the thing"; Focus is optimized for "I see where I am and what’s next." Same destination, different need.

## When they look the same

When the next action is "Start Learning" and the suggested lesson is the first in a module, both can show the same topic and the same lesson. That overlap is expected: one block is the *call to action*, the other is the *context*. Redundancy in *information* (topic name, lesson name) is not redundancy in *purpose*.

## Summary

- **NEXT UP** = immediate action: what to do now, with time and size.  
- **Focus** = context and continuity: current area, next step in that area, progress, and why.

Keeping both gives a clear "do this" and a clear "here’s where you are and why," which supports both quick sessions and a sense of progression.
