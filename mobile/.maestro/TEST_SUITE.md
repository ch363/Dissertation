# Fluentia E2E Test Suite

Complete test coverage for all major user journeys in the Fluentia mobile app.

## Test Execution Order

For best results, run tests in this order:

### 1. Smoke Test
```bash
npm run test:e2e:smoke
```
Verifies basic app launch.

### 2. Navigation & Discovery
```bash
npm run test:e2e:navigation    # Tab navigation
npm run test:e2e:progress      # View stats and streak
npm run test:e2e:learn         # Browse lessons
```

### 3. Core Learning Flows
```bash
npm run test:e2e:lesson        # Start from home CTA
npm run test:e2e:review        # Review session
npm run test:e2e:session       # Complete session flow
```

### 4. Profile & Settings
```bash
npm run test:e2e:profile       # View mastery
npm run test:e2e:settings      # Configure preferences
```

### 5. Special Cases
```bash
npm run test:e2e:first-time    # Empty state experience
npm run test:e2e:full-journey  # Complete end-to-end
```

## Run All Tests

```bash
npm run test:e2e
```

This runs all 11 test files in sequence.

## Test Matrix

| Journey | Test File | Commands | Coverage |
|---------|-----------|----------|----------|
| App Launch | `app-launch.yaml` | 5 | Landing screen verification |
| Home → Lesson | `01-home-to-lesson.yaml` | 8 | Primary CTA interaction |
| Home → Review | `02-home-to-review.yaml` | 6 | Review session start |
| Tab Navigation | `03-home-navigation.yaml` | 10 | All tab transitions |
| Learn Exploration | `04-learn-exploration.yaml` | 12 | Lesson discovery |
| Streak & Progress | `05-streak-and-progress.yaml` | 7 | Dashboard stats |
| Profile View | `06-profile-view.yaml` | 11 | XP and mastery |
| Settings | `07-settings-navigation.yaml` | 12 | Preferences |
| Session Completion | `08-session-completion-flow.yaml` | 14 | Full session |
| First-time UX | `09-first-time-user-experience.yaml` | 9 | Empty states |
| Complete Journey | `10-complete-user-journey.yaml` | 24 | Full user flow |

## Expected Results

All tests use `optional: true` for dynamic content, so they should pass gracefully even if:
- User has no streak yet
- No reviews are due
- Empty lesson lists
- First-time user with no data

## CI/CD Integration

To run in CI:

```bash
maestro test .maestro --format=JUNIT --output=test-results.xml
```

Or use Maestro Cloud for testing on real devices:

```bash
maestro cloud --apiKey=$MAESTRO_CLOUD_API_KEY .maestro
```

## Troubleshooting

### Tests timing out
- Increase wait times in session flows
- Check if API responses are slow

### Element not found
- Verify app is in expected state
- Check accessibility IDs match
- Add more flexible regex patterns

### Random failures
- Run individual test to isolate: `npm run test:e2e:lesson`
- Check simulator/emulator performance
- Ensure app is in clean state before test

## Maintenance

When UI changes:
1. Update text assertions in affected test files
2. Check accessibility IDs if using `id:` selectors
3. Re-run full suite: `npm run test:e2e`
4. Update this documentation with new patterns
