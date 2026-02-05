import { element, by, expect } from 'detox';

describe('App launch', () => {
  it('should show landing screen with Fluentia branding', async () => {
    await expect(element(by.text('Fluentia'))).toBeVisible();
    await expect(
      element(by.text('Personalised learning, one step at a time.')),
    ).toBeVisible();
    await expect(element(by.text('Get Started'))).toBeVisible();
    await expect(element(by.text('Log In'))).toBeVisible();
  });
});
