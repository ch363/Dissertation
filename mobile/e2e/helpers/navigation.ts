/**
 * Shared E2E navigation helpers
 * Consolidates navigation patterns used across E2E tests
 */

/**
 * Delay helper for waiting between actions
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Navigate to a specific tab by ID
 * @param tabId Tab identifier (home, learn, profile, settings)
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function navigateToTab(
  tabId: string,
  timeout: number = 5000,
): Promise<void> {
  const tab = element(by.id(`tab-${tabId}`));
  await waitFor(tab).toBeVisible().withTimeout(timeout);
  await tab.tap();
  await delay(2000);
}

/**
 * Navigate to the Home tab
 */
export async function navigateToHome(): Promise<void> {
  return navigateToTab('home');
}

/**
 * Navigate to the Learn tab
 */
export async function navigateToLearn(): Promise<void> {
  return navigateToTab('learn');
}

/**
 * Navigate to the Profile tab
 */
export async function navigateToProfile(): Promise<void> {
  return navigateToTab('profile');
}

/**
 * Navigate to the Settings tab
 */
export async function navigateToSettings(): Promise<void> {
  return navigateToTab('settings');
}

/**
 * Wait for an element to be visible with default timeout
 * @param elementMatcher Detox element matcher
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function waitForElement(
  elementMatcher: Detox.NativeMatcher,
  timeout: number = 5000,
): Promise<void> {
  await waitFor(element(elementMatcher)).toBeVisible().withTimeout(timeout);
}

/**
 * Scroll down in a scroll view
 * @param scrollViewId ID of the scroll view
 * @param pixels Number of pixels to scroll (default: 300)
 */
export async function scrollDown(
  scrollViewId: string,
  pixels: number = 300,
): Promise<void> {
  const scrollView = element(by.id(scrollViewId));
  await scrollView.scroll(pixels, 'down');
  await delay(1000);
}

/**
 * Scroll up in a scroll view
 * @param scrollViewId ID of the scroll view
 * @param pixels Number of pixels to scroll (default: 300)
 */
export async function scrollUp(
  scrollViewId: string,
  pixels: number = 300,
): Promise<void> {
  const scrollView = element(by.id(scrollViewId));
  await scrollView.scroll(pixels, 'up');
  await delay(1000);
}

/**
 * Tap on an element by ID with retry logic
 * @param elementId Element ID to tap
 * @param retries Number of retries (default: 3)
 */
export async function tapById(
  elementId: string,
  retries: number = 3,
): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const el = element(by.id(elementId));
      await waitFor(el).toBeVisible().withTimeout(3000);
      await el.tap();
      return;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await delay(1000);
    }
  }
}
