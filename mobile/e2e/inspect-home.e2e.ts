import { device, element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword, getE2ECredentials } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Home Screen Inspection Test
 * Logs in and inspects what elements actually exist on the home screen
 */
describe('Home Screen Inspection', () => {
  beforeAll(async () => {
    await launchAppSafe();

    try {
      getE2ECredentials();
      await loginWithEmailPassword();
      await new Promise((r) => setTimeout(r, 3000)); // Wait for home screen to fully load
    } catch (error: any) {
      console.log('Login skipped or failed:', error.message);
      // Check if already on home screen
      try {
        await waitFor(element(by.text('Home')))
          .toBeVisible()
          .withTimeout(3000);
        console.log('Already on home screen');
      } catch {
        throw new Error('Could not reach home screen');
      }
    }
  });

  it('should inspect all visible elements on home screen', async () => {
    // Navigate to Home tab if not already there
    try {
      const homeTab = element(by.text('Home'));
      await waitFor(homeTab).toBeVisible().withTimeout(5000);
      await homeTab.tap();
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      console.log('Already on home tab or tab not found');
    }

    console.log('\n=== HOME SCREEN INSPECTION ===\n');

    // Find the scroll view
    const scrollView = element(by.type('RCTCustomScrollView'));
    let scrollViewFound = false;
    try {
      await waitFor(scrollView).toBeVisible().withTimeout(3000);
      scrollViewFound = true;
      console.log('✓ Scroll view found (RCTCustomScrollView)');
    } catch {
      console.log('✗ RCTCustomScrollView not found, trying RCTScrollView...');
      try {
        await waitFor(element(by.type('RCTScrollView')))
          .toBeVisible()
          .withTimeout(3000);
        scrollViewFound = true;
        console.log('✓ Scroll view found (RCTScrollView)');
      } catch {
        console.log('✗ No scroll view found');
      }
    }

    // Check for various possible text labels
    console.log('\n--- Checking for section headers and labels (initial view) ---');
    const textLabelsToCheck = [
      'Today at a Glance',
      "TODAY'S PROGRESS",
      'Why This Next',
      'Why this next',
      'Focus:',
      'Start Review',
      'Continue Lesson',
      'Start Lesson',
      'Learn something new today',
      '5-minute lesson',
      'Minutes',
      'Items',
      'Accuracy',
      'Streak',
      'Days',
      'Completed',
      'Lessons',
      'Practice',
      'Review',
      'Today',
      'Week',
      'Total',
      'Home',
      'Learn',
      'Progress',
      'Settings',
    ];

    const foundLabels: string[] = [];
    const notFoundLabels: string[] = [];

    // Initial check without scrolling
    for (const label of textLabelsToCheck) {
      try {
        await waitFor(element(by.text(label)))
          .toBeVisible()
          .withTimeout(2000);
        foundLabels.push(label);
        console.log(`✓ Found: "${label}"`);
      } catch {
        notFoundLabels.push(label);
      }
    }

    // Try scrolling to find more elements using whileElement
    if (scrollViewFound && notFoundLabels.length > 0) {
      console.log('\n--- Scrolling to discover more elements ---');

      // Try scrolling while looking for missing labels
      for (const targetLabel of notFoundLabels.slice(0, 5)) {
        // Try first 5 missing labels
        try {
          await waitFor(element(by.text(targetLabel)))
            .toBeVisible()
            .whileElement(by.type('RCTCustomScrollView'))
            .scroll(300, 'down')
            .withTimeout(5000);
          if (!foundLabels.includes(targetLabel)) {
            foundLabels.push(targetLabel);
            console.log(`✓ Found after scrolling: "${targetLabel}"`);
          }
        } catch {
          // Not found, continue
        }
      }
    }

    // Try using swipe gesture as alternative to scroll
    if (scrollViewFound && notFoundLabels.length > 0) {
      console.log('\n--- Trying swipe gestures to discover more elements ---');
      try {
        // Swipe up to scroll down
        await device.swipe({ x: 200, y: 400 }, { x: 200, y: 200 }, 'fast');
        await new Promise((r) => setTimeout(r, 1000));

        // Check again for labels after swipe
        for (const label of notFoundLabels) {
          try {
            await waitFor(element(by.text(label)))
              .toBeVisible()
              .withTimeout(1000);
            if (!foundLabels.includes(label)) {
              foundLabels.push(label);
              console.log(`✓ Found after swipe: "${label}"`);
            }
          } catch {
            // Still not found
          }
        }

        // Swipe again
        await device.swipe({ x: 200, y: 400 }, { x: 200, y: 200 }, 'fast');
        await new Promise((r) => setTimeout(r, 1000));

        // Check again
        for (const label of notFoundLabels) {
          try {
            await waitFor(element(by.text(label)))
              .toBeVisible()
              .withTimeout(1000);
            if (!foundLabels.includes(label)) {
              foundLabels.push(label);
              console.log(`✓ Found after second swipe: "${label}"`);
            }
          } catch {
            // Still not found
          }
        }
      } catch (swipeError: any) {
        console.log(`  Swipe failed: ${swipeError.message.split('\n')[0]}`);
      }
    }

    // Summary
    console.log('\n--- Summary of found elements ---');
    console.log(`Found ${foundLabels.length} text labels:`);
    foundLabels.forEach((label) => {
      console.log(`  ✓ "${label}"`);
    });

    const stillNotFound = textLabelsToCheck.filter((l) => !foundLabels.includes(l));
    if (stillNotFound.length > 0) {
      console.log(`\nNot found (${stillNotFound.length} labels):`);
      stillNotFound.forEach((label) => {
        console.log(`  ✗ "${label}"`);
      });
    }

    console.log('\n=== INSPECTION COMPLETE ===\n');
    console.log('ELEMENTS ACTUALLY VISIBLE ON HOME SCREEN:');
    console.log('==========================================');
    foundLabels.forEach((label) => {
      console.log(`  - "${label}"`);
    });
  });
});
