export type WidgetIcon =
  | 'icon-circle'
  | 'icon-wheelchair'
  | 'icon-eye'
  | 'icon-universal'
  | 'icon-hand'
  | 'icon-hearing';

export type WidgetPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type WidgetLocale = 'en' | 'jp';

export type FontOption =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export interface AccessibilityOptions {
  color: string;           // Hex color
  size: string | number;   // 24-50
  background_color: string; // Hex color
  offsetX: number;         // 0-100
  offsetY: number;         // 0-100
  locale: WidgetLocale;
  theme_bg_color: string;  // Hex color
  font: FontOption;
}

export interface AccessibilitySettings {
  icon?: WidgetIcon;
  position?: WidgetPosition;
  status?: 0 | 1;
  options?: AccessibilityOptions;
  statement?: string;
}

export interface Accessibility {
  id: bigint;
  app_id: bigint | null;
  shop: string | null;
  store_id: bigint | null;
  status: number;
  icon: string | null;
  position: string | null;
  options: string | null; // JSON string
  statement: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export interface AccessibilityWithParsedOptions extends Accessibility {
  optionsParsed?: AccessibilityOptions;
}
