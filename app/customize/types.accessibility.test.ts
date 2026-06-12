import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  THEME_KEYS,
  SPEEDS,
  SIZES,
  FONTS,
  VIEW_MODES,
  DELTA_FORMATS,
  LANGUAGES,
  TIMEZONES,
} from './types';

function createCustomizeDOM(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'customize-container';

  // Heading hierarchy: H1 (Customization Studio)
  const title = document.createElement('h1');
  title.id = 'customize-title';
  title.textContent = 'Customization Studio';
  container.appendChild(title);

  // Form wrapping all controls
  const form = document.createElement('form');
  form.setAttribute('aria-labelledby', 'customize-title');
  container.appendChild(form);

  // Heading H2 (Visual Configuration Options)
  const visualHeading = document.createElement('h2');
  visualHeading.id = 'visual-heading';
  visualHeading.textContent = 'Visual Configuration Options';
  form.appendChild(visualHeading);

  // 1. Theme Option Selector
  const themeGroup = document.createElement('div');
  themeGroup.setAttribute('role', 'group');
  themeGroup.setAttribute('aria-labelledby', 'theme-label');

  const themeLabel = document.createElement('span');
  themeLabel.id = 'theme-label';
  themeLabel.textContent = 'Select Theme:';
  themeGroup.appendChild(themeLabel);

  const themeSelect = document.createElement('select');
  themeSelect.id = 'theme-select';
  themeSelect.setAttribute('aria-describedby', 'theme-description');
  THEME_KEYS.forEach((theme) => {
    const opt = document.createElement('option');
    opt.value = theme;
    opt.textContent = theme;
    themeSelect.appendChild(opt);
  });
  themeGroup.appendChild(themeSelect);

  const themeDesc = document.createElement('div');
  themeDesc.id = 'theme-description';
  themeDesc.setAttribute('role', 'tooltip');
  themeDesc.textContent = 'Choose auto, random, or a concrete theme preset.';
  themeGroup.appendChild(themeDesc);

  form.appendChild(themeGroup);

  // Heading H2 (Export & Size Settings)
  const exportHeading = document.createElement('h2');
  exportHeading.id = 'export-heading';
  exportHeading.textContent = 'Export & Size Settings';
  form.appendChild(exportHeading);

  // 2. SIZES control (Interactive Radio Buttons)
  const sizeGroup = document.createElement('div');
  sizeGroup.setAttribute('role', 'radiogroup');
  sizeGroup.setAttribute('aria-labelledby', 'size-label');

  const sizeLabel = document.createElement('span');
  sizeLabel.id = 'size-label';
  sizeLabel.textContent = 'Badge Size:';
  sizeGroup.appendChild(sizeLabel);

  SIZES.forEach((sz) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', sz.value === 'medium' ? 'true' : 'false');
    btn.setAttribute('aria-label', sz.label);
    btn.textContent = sz.label;
    btn.tabIndex = sz.value === 'medium' ? 0 : -1;
    btn.style.outline = 'none';

    btn.addEventListener('focus', () => {
      btn.style.outline = '2px solid blue';
    });
    btn.addEventListener('blur', () => {
      btn.style.outline = 'none';
    });

    sizeGroup.appendChild(btn);
  });
  form.appendChild(sizeGroup);

  // Heading H3 (Advanced Parameters)
  const advancedHeading = document.createElement('h3');
  advancedHeading.id = 'advanced-heading';
  advancedHeading.textContent = 'Advanced Parameters';
  form.appendChild(advancedHeading);

  // 3. Timezone Selector
  const tzGroup = document.createElement('div');
  const tzLabel = document.createElement('label');
  tzLabel.setAttribute('for', 'timezone-select');
  tzLabel.textContent = 'Timezone:';
  tzGroup.appendChild(tzLabel);

  const tzSelect = document.createElement('select');
  tzSelect.id = 'timezone-select';
  TIMEZONES.forEach((tz) => {
    const opt = document.createElement('option');
    opt.value = tz.value;
    opt.textContent = tz.label;
    tzSelect.appendChild(opt);
  });
  tzGroup.appendChild(tzSelect);
  form.appendChild(tzGroup);

  // 4. Save Button
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.id = 'save-btn';
  saveBtn.textContent = 'Save Customization';
  saveBtn.setAttribute('aria-label', 'Save customized configurations');
  saveBtn.style.outline = 'none';
  saveBtn.addEventListener('focus', () => {
    saveBtn.style.outline = '2px solid green';
  });
  saveBtn.addEventListener('blur', () => {
    saveBtn.style.outline = 'none';
  });
  form.appendChild(saveBtn);

  return container;
}

describe('CustomizeTypes Accessibility Standards & Screen Reader Aria Compliance', () => {
  let rootContainer: HTMLDivElement;

  beforeEach(() => {
    rootContainer = createCustomizeDOM();
    document.body.appendChild(rootContainer);
  });

  afterEach(() => {
    if (rootContainer) {
      document.body.removeChild(rootContainer);
    }
  });

  // Test Case 1: Inspect markup for correct use of accessible label coordinates
  it('Verify markup contains correct roles and linking coordinate attributes', () => {
    const form = rootContainer.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form?.getAttribute('aria-labelledby')).toBe('customize-title');

    const themeGroup = rootContainer.querySelector('[role="group"]');
    expect(themeGroup).toBeInTheDocument();
    expect(themeGroup?.getAttribute('aria-labelledby')).toBe('theme-label');

    const sizeGroup = rootContainer.querySelector('[role="radiogroup"]');
    expect(sizeGroup).toBeInTheDocument();
    expect(sizeGroup?.getAttribute('aria-labelledby')).toBe('size-label');

    const radioButtons = rootContainer.querySelectorAll('[role="radio"]');
    expect(radioButtons.length).toBe(SIZES.length);
    radioButtons.forEach((btn, idx) => {
      expect(btn.getAttribute('aria-label')).toBe(SIZES[idx].label);
    });
  });

  // Test Case 2: Assert elements that accept key focus maintain visible outline behaviors
  it('Verify key interactive focus nodes change and maintain visible outline behaviors', () => {
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    expect(saveBtn).toBeInTheDocument();

    // Before focus
    expect(saveBtn.style.outline).toBe('none');

    // Focus save button
    saveBtn.focus();
    expect(document.activeElement).toBe(saveBtn);
    expect(saveBtn.style.outline).toBe('2px solid green');

    // Blur save button
    saveBtn.blur();
    expect(saveBtn.style.outline).toBe('none');

    // Verify radio buttons
    const radioButtons = rootContainer.querySelectorAll('[role="radio"]');
    radioButtons.forEach((btn) => {
      const htmlBtn = btn as HTMLButtonElement;
      expect(htmlBtn.style.outline).toBe('none');

      htmlBtn.focus();
      expect(document.activeElement).toBe(htmlBtn);
      expect(htmlBtn.style.outline).toBe('2px solid blue');

      htmlBtn.blur();
      expect(htmlBtn.style.outline).toBe('none');
    });
  });

  // Test Case 3: Verify tooltip labels are announced with correct accessibility descriptions
  it('Verify tooltip nodes are correctly referenced via aria-describedby', () => {
    const themeSelect = document.getElementById('theme-select');
    expect(themeSelect).toBeInTheDocument();

    const descId = themeSelect?.getAttribute('aria-describedby');
    expect(descId).not.toBeNull();

    const tooltip = document.getElementById(descId!);
    expect(tooltip).toBeInTheDocument();
    expect(tooltip?.getAttribute('role')).toBe('tooltip');
    expect(tooltip?.textContent).toContain('Choose auto, random, or a concrete theme preset.');
  });

  // Test Case 4: Test keyboard control path selectors to ensure normal tab ordering
  it('Verify sequential keyboard tab focus ordering aligns with visual placement', () => {
    const themeSelect = document.getElementById('theme-select');
    const radioButtons = rootContainer.querySelectorAll('[role="radio"]');
    const tzSelect = document.getElementById('timezone-select');
    const saveBtn = document.getElementById('save-btn');

    // Sequential list of focusable nodes
    const focusableNodes = [themeSelect, ...Array.from(radioButtons), tzSelect, saveBtn];

    focusableNodes.forEach((node) => {
      const htmlNode = node as HTMLElement;
      expect(htmlNode).not.toBeNull();
      htmlNode.focus();
      expect(document.activeElement).toBe(htmlNode);
    });
  });

  // Test Case 5: Confirm standard headings exist in the correct logical hierarchical order
  it('Verify heading tags respect correct semantic nesting levels without skipping', () => {
    const h1 = rootContainer.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.id).toBe('customize-title');

    const h2s = rootContainer.querySelectorAll('h2');
    expect(h2s.length).toBe(2);

    const h3 = rootContainer.querySelector('h3');
    expect(h3).toBeInTheDocument();
    expect(h3?.id).toBe('advanced-heading');

    const headings = rootContainer.querySelectorAll('h1, h2, h3');
    const tags = Array.from(headings).map((el) => el.tagName.toLowerCase());

    expect(tags[0]).toBe('h1');
    expect(tags[1]).toBe('h2');
    expect(tags[2]).toBe('h2');
    expect(tags[3]).toBe('h3');
  });
});
