/**
 * Shared E2E interaction helpers
 * Consolidates common interaction patterns like scrolling, waiting, tapping
 */

/**
 * Delay helper for waiting between actions
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait and scroll to an element
 * @param scrollViewId ID of the scroll view
 * @param elementId ID of the element to scroll to
 * @param direction Scroll direction (default: 'down')
 */
export async function scrollToElement(
  scrollViewId: string,
  elementId: string,
  direction: 'up' | 'down' = 'down',
): Promise<void> {
  const scrollView = element(by.id(scrollViewId));
  const targetElement = element(by.id(elementId));

  try {
    // Try to find the element without scrolling first
    await waitFor(targetElement).toBeVisible().withTimeout(1000);
    return;
  } catch {
    // Element not visible, scroll to find it
    await scrollView.scrollTo(direction === 'down' ? 'bottom' : 'top');
    await delay(1000);
    await waitFor(targetElement).toBeVisible().withTimeout(5000);
  }
}

/**
 * Wait for an element and then tap it
 * @param elementMatcher Detox element matcher
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function waitAndTap(
  elementMatcher: Detox.NativeMatcher,
  timeout: number = 5000,
): Promise<void> {
  const el = element(elementMatcher);
  await waitFor(el).toBeVisible().withTimeout(timeout);
  await el.tap();
  await delay(500);
}

/**
 * Type text into an input with retry logic
 * @param elementMatcher Detox element matcher
 * @param text Text to type
 * @param retries Number of retries (default: 3)
 */
export async function typeTextWithRetry(
  elementMatcher: Detox.NativeMatcher,
  text: string,
  retries: number = 3,
): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const input = element(elementMatcher);
      await waitFor(input).toBeVisible().withTimeout(3000);
      await input.clearText();
      await input.typeText(text);
      return;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await delay(1000);
    }
  }
}

/**
 * Swipe on an element
 * @param elementId ID of the element to swipe
 * @param direction Swipe direction
 * @param speed Swipe speed (default: 'fast')
 */
export async function swipeElement(
  elementId: string,
  direction: 'left' | 'right' | 'up' | 'down',
  speed: 'slow' | 'fast' = 'fast',
): Promise<void> {
  const el = element(by.id(elementId));
  await el.swipe(direction, speed);
  await delay(500);
}

/**
 * Wait for multiple elements to be visible
 * @param elementMatchers Array of element matchers
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function waitForMultipleElements(
  elementMatchers: Detox.NativeMatcher[],
  timeout: number = 5000,
): Promise<void> {
  await Promise.all(
    elementMatchers.map((matcher) =>
      waitFor(element(matcher)).toBeVisible().withTimeout(timeout),
    ),
  );
}

/**
 * Take a screenshot with a descriptive name
 * Useful for debugging test failures
 * @param name Screenshot name
 */
export async function takeScreenshot(name: string): Promise<void> {
  try {
    await device.takeScreenshot(name);
  } catch (error) {
    console.warn(`Failed to take screenshot "${name}":`, error);
  }
}
