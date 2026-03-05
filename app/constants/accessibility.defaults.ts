import type { WidgetIcon, WidgetPosition, AccessibilityOptions } from '~/types/accessibility';

/**
 * Accessibility status enum
 */
export enum AccessibilityStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/**
 * Default widget icon
 */
export const DEFAULT_ICON: WidgetIcon = 'icon-circle';

/**
 * Default widget position
 */
export const DEFAULT_POSITION: WidgetPosition = 'bottom-right';

/**
 * Default widget options
 */
export const DEFAULT_OPTIONS: AccessibilityOptions = {
  color: '#ffffff',
  size: 24,
  background_color: '#FA6E0A',
  offsetX: 10,
  offsetY: 10,
  locale: 'en',
  theme_bg_color: '#FA6E0A',
  font: '8',
};

/**
 * Default accessibility statement HTML
 */
export const DEFAULT_STATEMENT = `<h1>Accessibility Statement</h1>
<p>We are committed to ensuring digital accessibility for people with disabilities.</p>
<h2>Conformance Status</h2>
<p>Our website conforms to WCAG 2.1 Level AA.</p>
<h2>Features</h2>
<ul>
  <li>Font size adjustment</li>
  <li>Screen reader compatibility</li>
  <li>High contrast mode</li>
  <li>Link highlighting</li>
</ul>`;

/**
 * Default widget status (disabled)
 */
export const DEFAULT_STATUS: 0 | 1 = 0;
