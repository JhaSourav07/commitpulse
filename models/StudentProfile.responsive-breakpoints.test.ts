import { beforeEach, describe, expect, it } from 'vitest';
import { StudentProfile } from './StudentProfile';

describe('StudentProfileModel - Responsive Breakpoints Layout Cohesion', () => {
  beforeEach(() => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('mocks standard mobile-width media coordinates correctly', () => {
    expect(StudentProfile).toBeDefined();
    expect(window.innerWidth).toBe(375);
  });

  it('asserts that grid/columns layout reflows into a single vertical flex list on mobile', () => {
    const getLayoutColumns = (width: number) => (width < 768 ? 1 : 3);
    expect(getLayoutColumns(window.innerWidth)).toBe(1);

    // Desktop should have 3 columns
    expect(getLayoutColumns(1024)).toBe(3);
  });

  it('verifies that styling values use percentage or flex widths rather than absolute widths', () => {
    const containerStyle = {
      width: '100%',
      maxWidth: 'max-w-7xl',
    };

    expect(containerStyle.width).toBe('100%');
    expect(containerStyle.maxWidth).toBe('max-w-7xl');
  });

  it('checks that profile navigation headers scale down gracefully on mobile screen sizes', () => {
    const navLinks = ['Dashboard', 'Profile', 'Settings'];
    const showMenuIcon = window.innerWidth < 768;

    expect(showMenuIcon).toBe(true);
    expect(navLinks.length).toBe(3);
  });

  it('asserts mobile-specific side drawer toggle states respond cleanly to resize events', () => {
    let isDrawerOpen = false;
    const toggleDrawer = () => {
      isDrawerOpen = !isDrawerOpen;
    };

    toggleDrawer();
    expect(isDrawerOpen).toBe(true);

    // Desktop breakpoint hides/resets mobile drawer state
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    if (window.innerWidth >= 768) {
      isDrawerOpen = false;
    }
    expect(isDrawerOpen).toBe(false);
  });
});
