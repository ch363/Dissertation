# Maestro E2E Tests

This directory contains comprehensive end-to-end tests for the Fluentia mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

- Maestro CLI installed (already set up)
- Java 17+ (already installed via Homebrew)
- iOS Simulator or Android Emulator running
- App built and installed on the simulator/emulator
- **User must be logged in** (these tests assume you're past authentication)

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run specific journey tests

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
```

### Run tests manually

```bash
# Make sure your simulator is running with the app installed
npm run ios

# In another terminal, run specific test:
maestro test .maestro/01-home-to-lesson.yaml
```

## Test Coverage

### User Journeys Tested

All tests start from the **Home screen** (assumes user is already authenticated):

1. **`01-home-to-lesson.yaml`** - Start learning from primary CTA
2. **`02-home-to-review.yaml`** - Start a review session
3. **`03-home-navigation.yaml`** - Navigate between Home, Learn, Profile, Settings tabs
4. **`04-learn-exploration.yaml`** - Browse lessons and discover content
5. **`05-streak-and-progress.yaml`** - View daily stats, streak, and focus
6. **`06-profile-view.yaml`** - Check profile, XP, and skill mastery
7. **`07-settings-navigation.yaml`** - Access and explore settings
8. **`08-session-completion-flow.yaml`** - Complete a full learning session
9. **`09-first-time-user-experience.yaml`** - First-time user empty state
10. **`10-complete-user-journey.yaml`** - Full flow: Home → Learn → Lesson → Session → Completion

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
- `wait: 1000` - Wait for milliseconds
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

## Documentation

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro Examples](https://github.com/mobile-dev-inc/maestro/tree/main/examples)
- [Maestro Test Syntax](https://maestro.mobile.dev/api-reference/commands)
