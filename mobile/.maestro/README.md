# Maestro E2E Tests

This directory contains comprehensive end-to-end tests for the Fluentia mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

- Maestro CLI installed (already set up)
- Java 17+ (already installed via Homebrew)
- iOS Simulator or Android Emulator running
- App built and installed on the simulator/emulator
- **User must be logged in** (these tests assume you're past authentication)

## Running Tests

### Run all tests (~8 min)

```bash
npm run test:e2e
# or
npm run test:e2e:all
```

### Run individual tests

```bash
# Smoke test - app launches
npm run test:e2e:smoke

# Core learning journeys
npm run test:e2e:lesson          # Start a lesson from home
npm run test:e2e:review          # Start a review session
npm run test:e2e:session         # Complete a learning session

# Navigation & exploration
npm run test:e2e:navigation      # Navigate between tabs
npm run test:e2e:learn           # Browse and explore lessons
npm run test:e2e:progress        # View streak and progress
npm run test:e2e:profile         # View profile and mastery
npm run test:e2e:settings        # Access settings

# Special journeys
npm run test:e2e:first-time      # First-time user experience
npm run test:e2e:full-journey    # Complete end-to-end flow
npm run test:e2e:learn-module    # Learn → module (e.g. Basics) → Start
```

### Run tests manually

```bash
# Make sure your simulator is running with the app installed
npm run ios

# In another terminal, run specific test:
maestro test .maestro/01-home-to-lesson.yaml

# Or run a specific category:
maestro test .maestro/1[1-8]-*.yaml  # Card type tests
maestro test .maestro/2[0-9]-*.yaml  # Course tests
```

## Test Coverage

### Total Test Suite: 12 Tests

**Coverage:** Core user journeys, settings, and Learn → module → Start flow

All tests (except `app-launch.yaml`) start from the **Home screen** and assume the user is already authenticated.

### Test Organization

Tests cover core user flows:

- **app-launch.yaml** - Smoke test (unauthenticated)
- **01-11** - Core user journeys and extended flows

### Core User Journeys (01-11)

Comprehensive tests covering main app flows:

1. **`01-home-to-lesson.yaml`** - Start learning from primary CTA
2. **`02-home-to-review.yaml`** - Start a review session
3. **`03-home-navigation.yaml`** - Navigate between Home, Learn, Profile tabs
4. **`04-learn-exploration.yaml`** - Browse lessons and discover content
5. **`05-streak-and-progress.yaml`** - View daily stats, streak, and focus
6. **`06-profile-view.yaml`** - Check profile, XP, and skill mastery
7. **`07-settings-navigation.yaml`** - **All settings**: Help, FAQ, Dark Mode, Speech, Session defaults, Adaptivity, Notifications
8. **`08-session-completion-flow.yaml`** - Complete a full learning session
9. **`09-first-time-user-experience.yaml`** - First-time user empty state
10. **`10-complete-user-journey.yaml`** - Full flow: Home → Learn → Lesson → Session → Completion
11. **`11-learn-module-start.yaml`** - Home → Learn → module (e.g. Basics) → first lesson → Start session

### Basic Smoke Test

- **`app-launch.yaml`** - Verifies app launches to landing screen (before login)

## Writing Tests

Maestro tests are written in YAML. Here's a basic example:

```yaml
appId: com.ch363.fluentia
---
- launchApp
- assertVisible: "Some Text"
- tapOn: "Button Text"
- inputText: "user@example.com"
```

### Common Commands

- `launchApp` - Launch the app
- `assertVisible: "text"` - Assert text/element is visible
- `tapOn: "text"` - Tap on element with text
- `tapOn: { index: 0 }` - Tap first matching element
- `tapOn: { id: "element-id" }` - Tap by accessibility ID
- `inputText: "value"` - Input text into focused field
- `scroll` - Scroll the screen
- `swipe` - Swipe gesture
- `back` - Go back (Android)
- `waitForAnimationToEnd` - Wait for animations to complete
- `optional: true` - Make assertion optional (won't fail if not found)

### Pattern Matching

Use regex patterns for flexible matching:

```yaml
- assertVisible:
    text: "Continue|Start Learning"  # Match either text
- tapOn:
    text: ".*lesson.*"  # Match any text containing "lesson"
    optional: true
```

## Test Design Philosophy

1. **Start from Home** - All main journeys assume user is logged in
2. **Graceful handling** - Use `optional: true` for dynamic content
3. **Pattern matching** - Use regex to handle varying text
4. **Wait strategically** - Brief waits after actions for animations
5. **Verify outcomes** - Check key elements after navigation

## Debugging Tests

If a test fails:

1. Run manually with verbose output: `maestro test --debug-output=./maestro-debug <test-file>`
2. Check the debug output for screenshots and logs
3. Verify the app is in the expected state before the test
4. Adjust selectors or add waits if timing issues occur

## Data Requirements

### All Tests

Tests work with seeded backend data and handle empty states gracefully:

- **Backend seed data required** - Run `npm run seed` in backend directory
- **User must be logged in** - Tests assume authenticated state
- **Dynamic content handled** - Tests use `optional: true` for varying content

## Expected Execution Times

| Test Category | Count | Estimated Time |
|--------------|-------|----------------|
| Smoke test | 1 | ~5 seconds |
| Core journeys (01-10) | 10 | ~8 minutes |
| **Total** | **11 tests** | **~8 minutes** |

**Quick Test Suites:**
- Critical path: ~2 minutes (4 tests: 01, 02, 08, 10)
- Full suite: ~8 minutes (11 tests)

## Continuous Integration

### Recommended Test Strategy

- **On every PR:** Run critical path tests (~2 min)
- **On main branch:** Run full test suite (~8 min)
- **Before releases:** Run full test suite manually

## Troubleshooting

### Common Issues

**Test fails with "Element not found"**
- Check if text pattern matches actual app text
- Use `optional: true` for dynamic content
- Add `waitForAnimationToEnd` after navigation
- Verify app is in expected state before assertion

**Test times out**
- Increase wait times for slow animations
- Check if app is responding (not crashed)
- Verify network requests are completing
- Check backend is running and accessible

**Microphone/Audio tests fail on iOS Simulator**
- Expected behavior: iOS Simulator doesn't support microphone
- Tests handle this gracefully with "iOS Simulator" error checks
- Run on physical device for full audio testing

**TTS/Speech tests inconsistent**
- Check TTS is enabled in settings
- Verify device volume is not muted
- Add brief waits after audio playback
- Test on physical device if simulator issues persist

**Tests pass locally but fail in CI**
- Ensure backend is accessible from CI environment
- Check simulator boot time (add longer initial wait)
- Verify all dependencies are installed
- Review CI logs for specific error messages

**Random test failures**
- Add stability waits: `waitForAnimationToEnd`
- Use more specific selectors (avoid index-based when possible)
- Check for race conditions in app code
- Increase timeouts for network-dependent operations

### Best Practices

1. **Run tests on clean state** - Reset app data between test runs if needed
2. **Use seeded data** - Consistent backend data improves test reliability
3. **Monitor test execution** - Watch tests run to catch UI issues
4. **Update tests with app changes** - Keep tests in sync with UI updates
5. **Test on multiple devices** - iOS and Android may behave differently
6. **Document flaky tests** - Note any tests that occasionally fail and why

## Documentation

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro Examples](https://github.com/mobile-dev-inc/maestro/tree/main/examples)
- [Maestro Test Syntax](https://maestro.mobile.dev/api-reference/commands)
