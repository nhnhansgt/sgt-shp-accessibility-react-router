# Widgets Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Widgets Screen (`/app/widgets`) UI with icon selector, position picker, size/offset sliders, color pickers, font selector, and live preview using mock data for display.

**Architecture:** Single React Router route file using Polaris web components (`<s-page>`, `<s-section>`, `<s-button>`, etc.) with two-column layout (settings on left, preview on right). The route will follow the same patterns as existing routes (`app.setup.tsx`, `app.plans.tsx`).

**Tech Stack:** React Router, Polaris web components, TypeScript, mock data, CSS custom properties for live preview.

---

## Task 1: Create Widgets Screen Route File

**Files:**
- Create: `app/routes/app.widgets.tsx`

**Step 1: Create the route file with basic structure**

Create `app/routes/app.widgets.tsx` with:
- Loader function (auth check required)
- Default export component with Widgets page UI
- Mock data for widget settings

```tsx
import { useState, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock data - TODO: Replace with actual data from database
const MOCK_IS_YEAR_END_SALE = false;
const MOCK_SALE_DAYS = 0;

// Default widget options (matches database defaults)
const DEFAULT_WIDGET_OPTIONS = {
  color: "#ffffff",
  size: "24",
  background_color: "#FA6E0A",
  offsetX: 10,
  offsetY: 10,
  locale: "en",
  theme_bg_color: "#FA6E0A",
  font: "8",
};

// Mock current settings
const MOCK_WIDGET_SETTINGS = {
  icon: "icon-circle",
  position: "bottom-right",
  options: DEFAULT_WIDGET_OPTIONS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual query to get widget settings from database
  return {
    isYearEndSale: MOCK_IS_YEAR_END_SALE,
    saleDays: MOCK_SALE_DAYS,
    settings: MOCK_WIDGET_SETTINGS,
  };
};

export default function Widgets() {
  const { isYearEndSale, saleDays, settings } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Customize Your Widget">
      {/* TODO: Add content */}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Widgets page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

**Step 2: Verify file compiles**

Run: `npm run typecheck`
Expected: No errors for the new file

**Step 3: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add Widgets screen route with basic structure"
```

---

## Task 2: Add Icon Options Data and Icon Selector Component

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Define icon options constant**

Add after imports (before loader):

```tsx
// Widget icon options
interface IconOption {
  id: string;
  label: string;
  emoji: string;
}

const ICON_OPTIONS: IconOption[] = [
  { id: "icon-circle", label: "Circle", emoji: "⭕" },
  { id: "icon-wheelchair", label: "Wheelchair", emoji: "♿" },
  { id: "icon-eye", label: "Eye", emoji: "👁" },
  { id: "icon-star", label: "Star", emoji: "⭐" },
  { id: "icon-gear", label: "Gear", emoji: "⚙️" },
  { id: "icon-universal", label: "Universal", emoji: "🌐" },
  { id: "icon-palette", label: "Palette", emoji: "🎨" },
  { id: "icon-chat", label: "Chat", emoji: "💬" },
  { id: "icon-blind", label: "Blind", emoji: "🦯" },
  { id: "icon-hearing", label: "Hearing", emoji: "👂" },
];
```

**Step 2: Add state management for widget settings**

Inside Widgets function, add state:

```tsx
const [selectedIcon, setSelectedIcon] = useState(settings.icon);
const [selectedPosition, setSelectedPosition] = useState(settings.position);
const [widgetSize, setWidgetSize] = useState(Number(settings.options.size));
const [offsetX, setOffsetX] = useState(settings.options.offsetX);
const [offsetY, setOffsetY] = useState(settings.options.offsetY);
const [iconColor, setIconColor] = useState(settings.options.color);
const [backgroundColor, setBackgroundColor] = useState(settings.options.background_color);
const [themeBgColor, setThemeBgColor] = useState(settings.options.theme_bg_color);
const [selectedFont, setSelectedFont] = useState(settings.options.font);
const [isSaving, setIsSaving] = useState(false);
```

**Step 3: Add Year End Sale Banner and Icon Selector Section**

Replace the `return` content with:

```tsx
return (
  <s-page heading="Customize Your Widget">
    {/* Year End Sale Banner (conditional) */}
    {isYearEndSale && (
      <s-section>
        <s-box
          padding="base"
          background="subdued"
          borderRadius="base"
        >
          <s-stack direction="inline" gap="base">
            <span>🎉</span>
            <s-text>
              Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
            </s-text>
          </s-stack>
        </s-box>
      </s-section>
    )}

    {/* Widget Icon Section */}
    <s-section heading="Widget Icon">
      <s-stack direction="inline" gap="base" wrap>
        {ICON_OPTIONS.map((icon) => (
          <s-box
            key={icon.id}
            padding="base"
            borderWidth={selectedIcon === icon.id ? "thick" : "base"}
            borderColor={selectedIcon === icon.id ? "primary" : "subdued"}
            borderRadius="base"
            background={selectedIcon === icon.id ? "subdued" : "bg"}
            cursor="pointer"
            onClick={() => setSelectedIcon(icon.id)}
            aria-label={`Select ${icon.label} icon`}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                setSelectedIcon(icon.id);
              }
            }}
          >
            <s-stack direction="block" gap="tight" alignment="center">
              <s-box fontSize="2xl">{icon.emoji}</s-box>
              <s-text variant="bodySm">{icon.label}</s-text>
            </s-stack>
          </s-box>
        ))}
      </s-stack>
    </s-section>
  </s-page>
);
```

**Step 4: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add icon selector grid to Widgets screen"
```

---

## Task 3: Add Position Selector Component

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add position options constant**

Add after ICON_OPTIONS:

```tsx
// Widget position options
interface PositionOption {
  id: string;
  label: string;
}

const POSITION_OPTIONS: PositionOption[] = [
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
];
```

**Step 2: Add Position Selector Section**

Add after the Icon Section, inside the `<s-page>`:

```tsx
{/* Widget Position Section */}
<s-section heading="Widget Position">
  <s-stack direction="inline" gap="base" wrap>
    {POSITION_OPTIONS.map((position) => (
      <s-box
        key={position.id}
        padding="base"
        borderWidth={selectedPosition === position.id ? "thick" : "base"}
        borderColor={selectedPosition === position.id ? "primary" : "subdued"}
        borderRadius="base"
        background={selectedPosition === position.id ? "subdued" : "bg"}
        cursor="pointer"
        onClick={() => setSelectedPosition(position.id)}
        aria-label={`Set position to ${position.label}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            setSelectedPosition(position.id);
          }
        }}
      >
        <s-stack direction="block" gap="tight" alignment="center">
          <s-box
            width="60px"
            height="40px"
            borderWidth="base"
            borderRadius="base"
            position="relative"
            background="subdued"
          >
            {/* Visual indicator dot */}
            <s-box
              position="absolute"
              width="12px"
              height="12px"
              borderRadius="full"
              background={selectedPosition === position.id ? "primary" : "subdued"}
              style={{
                top: position.id.includes("top") ? "4px" : "auto",
                bottom: position.id.includes("bottom") ? "4px" : "auto",
                left: position.id.includes("left") ? "4px" : "auto",
                right: position.id.includes("right") ? "4px" : "auto",
              }}
            />
          </s-box>
          <s-text variant="bodySm">{position.label}</s-text>
        </s-stack>
      </s-box>
    ))}
  </s-stack>
</s-section>
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add position selector to Widgets screen"
```

---

## Task 4: Add Size and Offset Sliders

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add Size and Offset Section**

Add after the Position Section:

```tsx
{/* Widget Size Section */}
<s-section heading="Widget Size">
  <s-stack direction="block" gap="base">
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "80px" }}>
        Size: {widgetSize}px
      </s-text>
      <input
        type="range"
        min="24"
        max="50"
        value={widgetSize}
        onChange={(e) => setWidgetSize(Number(e.target.value))}
        aria-label="Widget size"
        style={{ flex: 1 }}
      />
    </s-stack>
  </s-stack>
</s-section>

{/* Widget Offset Section */}
<s-section heading="Widget Offset">
  <s-stack direction="block" gap="base">
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "80px" }}>
        X Offset: {offsetX}px
      </s-text>
      <input
        type="range"
        min="0"
        max="100"
        value={offsetX}
        onChange={(e) => setOffsetX(Number(e.target.value))}
        aria-label="Widget X offset"
        style={{ flex: 1 }}
      />
    </s-stack>

    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "80px" }}>
        Y Offset: {offsetY}px
      </s-text>
      <input
        type="range"
        min="0"
        max="100"
        value={offsetY}
        onChange={(e) => setOffsetY(Number(e.target.value))}
        aria-label="Widget Y offset"
        style={{ flex: 1 }}
      />
    </s-stack>
  </s-stack>
</s-section>
```

**Step 2: Add slider styles (CSS-in-JS via style tag)**

Add at the top of the Widgets function:

```tsx
// Slider styles for better appearance
const sliderStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: #c9cccf;
    outline: none;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #008060;
    cursor: pointer;
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #008060;
    cursor: pointer;
    border: none;
  }
`;
```

Add a style tag in the component (useEffect to inject):

```tsx
useEffect(() => {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
  return () => {
    document.head.removeChild(styleSheet);
  };
}, []);
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add size and offset sliders to Widgets screen"
```

---

## Task 5: Add Color Pickers

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add Color Section**

Add after the Offset Section:

```tsx
{/* Widget Colors Section */}
<s-section heading="Widget Colors">
  <s-stack direction="block" gap="base">
    {/* Icon Color */}
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "100px" }}>
        Icon Color:
      </s-text>
      <input
        type="color"
        value={iconColor}
        onChange={(e) => setIconColor(e.target.value)}
        aria-label="Icon color"
        style={{
          width: "40px",
          height: "40px",
          border: "1px solid #c9cccf",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
      <s-text variant="bodySm" color="subdued">
        {iconColor}
      </s-text>
    </s-stack>

    {/* Background Color */}
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "100px" }}>
        Background:
      </s-text>
      <input
        type="color"
        value={backgroundColor}
        onChange={(e) => setBackgroundColor(e.target.value)}
        aria-label="Widget background color"
        style={{
          width: "40px",
          height: "40px",
          border: "1px solid #c9cccf",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
      <s-text variant="bodySm" color="subdued">
        {backgroundColor}
      </s-text>
    </s-stack>

    {/* Panel Background Color */}
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text variant="bodySm" style={{ minWidth: "100px" }}>
        Panel Bg:
      </s-text>
      <input
        type="color"
        value={themeBgColor}
        onChange={(e) => setThemeBgColor(e.target.value)}
        aria-label="Panel background color"
        style={{
          width: "40px",
          height: "40px",
          border: "1px solid #c9cccf",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
      <s-text variant="bodySm" color="subdued">
        {themeBgColor}
      </s-text>
    </s-stack>
  </s-stack>
</s-section>
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add color pickers to Widgets screen"
```

---

## Task 6: Add Font Selector

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add font options constant**

Add after POSITION_OPTIONS:

```tsx
// Font options (ID maps to font family)
interface FontOption {
  id: string;
  label: string;
  family: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: "0", label: "Lobster", family: "Lobster, cursive" },
  { id: "1", label: "Dancing Script", family: "'Dancing Script', cursive" },
  { id: "2", label: "Lato", family: "Lato, sans-serif" },
  { id: "3", label: "Noto Sans", family: "'Noto Sans', sans-serif" },
  { id: "4", label: "Noto Serif", family: "'Noto Serif', serif" },
  { id: "5", label: "Nunito", family: "Nunito, sans-serif" },
  { id: "6", label: "Pacifico", family: "Pacifico, cursive" },
  { id: "7", label: "Open Sans", family: "'Open Sans', sans-serif" },
  { id: "8", label: "Roboto", family: "Roboto, sans-serif" },
  { id: "9", label: "Bungee", family: "Bungee, cursive" },
  { id: "10", label: "Bebas Neue", family: "'Bebas Neue', cursive" },
];
```

**Step 2: Add Font Section**

Add after the Colors Section:

```tsx
{/* Widget Font Section */}
<s-section heading="Widget Font">
  <s-stack direction="block" gap="base">
    <select
      value={selectedFont}
      onChange={(e) => setSelectedFont(e.target.value)}
      aria-label="Select font"
      style={{
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #c9cccf",
        fontSize: "14px",
        minWidth: "200px",
      }}
    >
      {FONT_OPTIONS.map((font) => (
        <option key={font.id} value={font.id}>
          {font.label}
        </option>
      ))}
    </select>

    {/* Font Preview */}
    <s-box
      padding="base"
      borderWidth="base"
      borderRadius="base"
      background="subdued"
    >
      <s-text
        style={{
          fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
          fontSize: "16px",
        }}
      >
        Preview: The quick brown fox jumps over the lazy dog
      </s-text>
    </s-box>
  </s-stack>
</s-section>
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add font selector with preview to Widgets screen"
```

---

## Task 7: Add Live Preview Component

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add Live Preview Section**

Add after all settings sections (before Save button):

```tsx
{/* Live Preview Section */}
<s-section heading="Live Preview">
  <s-box
    padding="loose"
    borderWidth="base"
    borderRadius="base"
    background="subdued"
    position="relative"
    minHeight="300px"
  >
    {/* Simulated storefront background */}
    <s-box
      position="relative"
      width="100%"
      height="280px"
      borderRadius="base"
      background="bg"
      borderWidth="base"
    >
      {/* Simulated content */}
      <s-box padding="base">
        <s-heading level="3">Your Store</s-heading>
        <s-paragraph color="subdued">
          This is how your accessibility widget will appear on your storefront.
        </s-paragraph>
      </s-box>

      {/* Widget Button Preview */}
      <s-box
        position="absolute"
        style={{
          top: selectedPosition.includes("top") ? `${offsetY}px` : "auto",
          bottom: selectedPosition.includes("bottom") ? `${offsetY}px` : "auto",
          left: selectedPosition.includes("left") ? `${offsetX}px` : "auto",
          right: selectedPosition.includes("right") ? `${offsetX}px` : "auto",
        }}
      >
        <s-box
          width={`${widgetSize}px`}
          height={`${widgetSize}px`}
          borderRadius="base"
          background={backgroundColor}
          display="flex"
          alignment="center"
          justification="center"
          cursor="pointer"
          borderWidth="base"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <s-text
            style={{
              color: iconColor,
              fontSize: `${widgetSize * 0.6}px`,
              lineHeight: 1,
            }}
          >
            {ICON_OPTIONS.find((i) => i.id === selectedIcon)?.emoji}
          </s-text>
        </s-box>
      </s-box>
    </s-box>

    {/* Panel Preview */}
    <s-box
      marginTop="base"
      padding="base"
      borderRadius="base"
      background={themeBgColor}
    >
      <s-stack direction="block" gap="tight">
        <s-heading
          level="4"
          style={{
            fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
            color: iconColor,
          }}
        >
          Accessibility Options
        </s-heading>
        <s-text
          style={{
            fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
            color: iconColor,
            fontSize: "14px",
          }}
        >
          Font Size: A A A
        </s-text>
        <s-text
          style={{
            fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
            color: iconColor,
            fontSize: "14px",
          }}
        >
          Contrast: ○ ○ ○
        </s-text>
      </s-stack>
    </s-box>
  </s-box>
</s-section>
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add live preview component to Widgets screen"
```

---

## Task 8: Add Save Button and Form Submission

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add Save Button Section**

Add after the Live Preview section (at the end of `<s-page>`):

```tsx
{/* Save Button Section */}
<s-section>
  <s-stack direction="inline" gap="base">
    <s-button
      variant="primary"
      onClick={handleSave}
      {...(isSaving ? { loading: true } : {})}
      aria-label="Save widget settings"
    >
      Save
    </s-button>

    <s-button
      variant="secondary"
      onClick={handleReset}
      aria-label="Reset to default settings"
    >
      Reset to Default
    </s-button>
  </s-stack>
</s-section>
```

**Step 2: Add save and reset handlers**

Add before the return statement in the Widgets function:

```tsx
// Handle save
const handleSave = async () => {
  setIsSaving(true);

  // TODO: Replace with actual API call to save settings
  const widgetSettings = {
    icon: selectedIcon,
    position: selectedPosition,
    options: {
      color: iconColor,
      size: String(widgetSize),
      background_color: backgroundColor,
      offsetX,
      offsetY,
      locale: settings.options.locale,
      theme_bg_color: themeBgColor,
      font: selectedFont,
    },
  };

  console.log("Saving widget settings:", widgetSettings);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  setIsSaving(false);

  // TODO: Show success toast
  alert("Widget settings saved! (Mock - no backend)");
};

// Handle reset to defaults
const handleReset = () => {
  setSelectedIcon("icon-circle");
  setSelectedPosition("bottom-right");
  setWidgetSize(24);
  setOffsetX(10);
  setOffsetY(10);
  setIconColor("#ffffff");
  setBackgroundColor("#FA6E0A");
  setThemeBgColor("#FA6E0A");
  setSelectedFont("8");
};
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add save and reset buttons to Widgets screen"
```

---

## Task 9: Add Two-Column Layout (Responsive)

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Wrap content in two-column layout**

Replace the entire `<s-page>` content with a two-column layout:

```tsx
return (
  <s-page heading="Customize Your Widget">
    {/* Year End Sale Banner (conditional) */}
    {isYearEndSale && (
      <s-section>
        <s-box
          padding="base"
          background="subdued"
          borderRadius="base"
        >
          <s-stack direction="inline" gap="base">
            <span>🎉</span>
            <s-text>
              Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
            </s-text>
          </s-stack>
        </s-box>
      </s-section>
    )}

    {/* Two-column layout */}
    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
      {/* Settings Column (Left) */}
      <div style={{ flex: "1 1 400px", minWidth: "300px" }}>
        {/* All settings sections go here */}
        {/* Icon, Position, Size, Offset, Colors, Font sections */}
      </div>

      {/* Preview Column (Right) */}
      <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
        {/* Live Preview Section */}
      </div>
    </div>

    {/* Save Button Section (full width) */}
    <s-section>
      {/* Save buttons */}
    </s-section>
  </s-page>
);
```

**Step 2: Reorganize all sections into the two columns**

Move all settings sections into the left column div and the Live Preview into the right column div.

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: add responsive two-column layout to Widgets screen"
```

---

## Task 10: Manual Testing and TODO Documentation

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/app/widgets`

Verify:
- "Customize Your Widget" heading displays
- Year End Sale banner (if sale is active)
- Icon selector grid with all 10 icons
- Clicking icons updates selection (visual feedback)
- Position selector with 4 options
- Position preview dots show correct position
- Size slider (24-50px) works
- X Offset slider (0-100px) works
- Y Offset slider (0-100px) works
- Color pickers for icon, background, panel
- Font dropdown with 11 options
- Font preview text updates
- Live preview shows widget button
- Live preview position updates with settings
- Live preview colors update
- Save button works (mock save)
- Reset button resets all settings
- Two-column layout displays correctly
- Responsive layout works on smaller screens
- Keyboard navigation works

**Step 2: Add TODO comments**

Add at the end of the file:

```tsx
// TODO: Replace mock settings with actual query from database
// TODO: Implement actual save functionality with API call
// TODO: Add success/error toast notifications
// TODO: Add Japanese language support
// TODO: Load Google Fonts for font preview
// TODO: Add validation for color values
// TODO: Implement real widget preview with actual accessibility features
// TODO: Add debounced preview updates for better performance
// TODO: Add accessibility features to preview panel (font size, contrast, etc.)
```

---

## Final File Structure

The completed `app/routes/app.widgets.tsx` should include:

1. **Imports**: React (useState, useEffect), React Router, Shopify auth
2. **Types**: IconOption, PositionOption, FontOption interfaces
3. **Constants**: ICON_OPTIONS, POSITION_OPTIONS, FONT_OPTIONS arrays
4. **Mock Data**: Default widget settings, sale info
5. **Loader**: Returns mock settings and sale info
6. **State**: All widget settings state variables
7. **Handlers**: handleSave, handleReset functions
8. **Widgets Component**: Main page with all sections
9. **Two-Column Layout**: Settings (left) + Preview (right)
10. **ErrorBoundary**: Error handling
11. **Headers**: Boundary headers

---

## Testing Checklist

- [ ] "Customize Your Widget" heading displays
- [ ] Year End Sale banner shows conditionally
- [ ] 10 icon options display in grid
- [ ] Icon selection updates visual state
- [ ] 4 position options display
- [ ] Position preview shows correct corner dot
- [ ] Size slider works (24-50px)
- [ ] Size value displays next to slider
- [ ] X Offset slider works (0-100px)
- [ ] Y Offset slider works (0-100px)
- [ ] Icon color picker works
- [ ] Background color picker works
- [ ] Panel background color picker works
- [ ] Color hex values display
- [ ] Font dropdown has 11 options
- [ ] Font preview updates with selection
- [ ] Live preview displays widget button
- [ ] Preview position updates with settings
- [ ] Preview colors update with pickers
- [ ] Save button triggers mock save
- [ ] Reset button restores defaults
- [ ] Two-column layout displays
- [ ] Responsive layout works
- [ ] Keyboard navigation works
- [ ] TypeScript compiles without errors

---

## Notes

- This implementation uses **fake/mock data** for display purposes only
- Backend integration (Shopify API, database queries) is out of scope for this UI task
- The live preview is a simplified representation - the real widget has more features
- Color pickers use native HTML5 color input for simplicity
- Slider styles are injected via JavaScript for demo purposes
- Google Fonts are referenced but not loaded - should load via CDN or @font-face in production
- The two-column layout uses inline styles for responsiveness - consider using Polaris Layout component if available