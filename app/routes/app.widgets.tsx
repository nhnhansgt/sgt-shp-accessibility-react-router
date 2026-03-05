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

  // State management for widget settings
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
        <div style={{ flex: "1 1 400px", minWidth: "320px" }}>
          {/* Widget Icon Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Icon</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {ICON_OPTIONS.map((icon) => (
                <div
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  aria-label={`Select ${icon.label} icon`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedIcon(icon.id);
                    }
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    borderStyle: selectedIcon === icon.id ? "solid" : "dashed",
                    borderColor: selectedIcon === icon.id ? "#008060" : "#c9cccf",
                    borderWidth: selectedIcon === icon.id ? "2px" : "1px",
                    background: selectedIcon === icon.id ? "#f6f6f7" : "transparent",
                    textAlign: "center",
                    minWidth: "80px",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{icon.emoji}</div>
                  <span style={{ fontSize: "12px", color: "#6d7175" }}>{icon.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget Position Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Position</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {POSITION_OPTIONS.map((position) => (
                <div
                  key={position.id}
                  onClick={() => setSelectedPosition(position.id)}
                  aria-label={`Set position to ${position.label}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedPosition(position.id);
                    }
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    borderStyle: selectedPosition === position.id ? "solid" : "dashed",
                    borderColor: selectedPosition === position.id ? "#008060" : "#c9cccf",
                    borderWidth: selectedPosition === position.id ? "2px" : "1px",
                    background: selectedPosition === position.id ? "#f6f6f7" : "transparent",
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "40px",
                      border: "1px solid #c9cccf",
                      borderRadius: "4px",
                      background: "#f6f6f7",
                      margin: "0 auto 8px",
                      position: "relative",
                    }}
                  >
                    {/* Visual indicator dot */}
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: selectedPosition === position.id ? "#008060" : "#c9cccf",
                        position: "absolute",
                        top: position.id.includes("top") ? "4px" : "auto",
                        bottom: position.id.includes("bottom") ? "4px" : "auto",
                        left: position.id.includes("left") ? "4px" : "auto",
                        right: position.id.includes("right") ? "4px" : "auto",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", color: "#6d7175" }}>{position.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget Size Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Size</h2>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <span style={{ minWidth: "80px", fontSize: "14px" }}>Size: {widgetSize}px</span>
                <input
                  type="range"
                  min="24"
                  max="50"
                  value={widgetSize}
                  onChange={(e) => setWidgetSize(Number(e.target.value))}
                  aria-label="Widget size"
                  style={{ flex: 1, height: "4px", borderRadius: "2px" }}
                />
              </div>
            </div>
          </div>

          {/* Widget Offset Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Offset</h2>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <span style={{ minWidth: "80px", fontSize: "14px" }}>X Offset: {offsetX}px</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  aria-label="Widget X offset"
                  style={{ flex: 1, height: "4px", borderRadius: "2px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ minWidth: "80px", fontSize: "14px" }}>Y Offset: {offsetY}px</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  aria-label="Widget Y offset"
                  style={{ flex: 1, height: "4px", borderRadius: "2px" }}
                />
              </div>
            </div>
          </div>

          {/* Widget Colors Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Colors</h2>
            <div style={{ marginBottom: "16px" }}>
              {/* Icon Color */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <span style={{ minWidth: "100px", fontSize: "14px" }}>Icon Color:</span>
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
                    padding: "2px",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#6d7175" }}>{iconColor}</span>
              </div>
              {/* Background Color */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <span style={{ minWidth: "100px", fontSize: "14px" }}>Background:</span>
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
                    padding: "2px",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#6d7175" }}>{backgroundColor}</span>
              </div>
              {/* Panel Background Color */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ minWidth: "100px", fontSize: "14px" }}>Panel Bg:</span>
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
                    padding: "2px",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#6d7175" }}>{themeBgColor}</span>
              </div>
            </div>
          </div>

          {/* Widget Font Section */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Widget Font</h2>
            <div style={{ marginBottom: "16px" }}>
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
                  marginBottom: "12px",
                }}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>

              {/* Font Preview */}
              <div
                style={{
                  padding: "16px",
                  border: "1px solid #c9cccf",
                  borderRadius: "4px",
                  background: "#f6f6f7",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
                    fontSize: "16px",
                  }}
                >
                  Preview: The quick brown fox jumps over the lazy dog
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Column (Right) */}
        <div style={{ flex: "1 1 350px", minWidth: "320px" }}>
          {/* Live Preview Section */}
          <div style={{ position: "sticky", top: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" }}>Live Preview</h2>
            <div
              style={{
                padding: "16px",
                border: "1px solid #c9cccf",
                borderRadius: "8px",
                background: "#f6f6f7",
              }}
            >
              {/* Simulated storefront background */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "280px",
                  borderRadius: "4px",
                  background: "#ffffff",
                  border: "1px solid #c9cccf",
                  marginBottom: "16px",
                }}
              >
                {/* Simulated content */}
                <div style={{ padding: "16px" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Your Store</h3>
                  <p style={{ margin: 0, color: "#6d7175", fontSize: "14px" }}>
                    This is how your accessibility widget will appear on your storefront.
                  </p>
                </div>

                {/* Widget Button Preview */}
                <div
                  style={{
                    position: "absolute",
                    top: selectedPosition.includes("top") ? `${offsetY}px` : "auto",
                    bottom: selectedPosition.includes("bottom") ? `${offsetY}px` : "auto",
                    left: selectedPosition.includes("left") ? `${offsetX}px` : "auto",
                    right: selectedPosition.includes("right") ? `${offsetX}px` : "auto",
                  }}
                >
                  <div
                    style={{
                      width: `${widgetSize}px`,
                      height: `${widgetSize}px`,
                      borderRadius: "8px",
                      background: backgroundColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: "1px solid #c9cccf",
                    }}
                  >
                    <span
                      style={{
                        color: iconColor,
                        fontSize: `${widgetSize * 0.6}px`,
                        lineHeight: 1,
                      }}
                    >
                      {ICON_OPTIONS.find((i) => i.id === selectedIcon)?.emoji}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel Preview */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "4px",
                  background: themeBgColor,
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong
                    style={{
                      fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
                      color: iconColor,
                      fontSize: "16px",
                    }}
                  >
                    Accessibility Options
                  </strong>
                </div>
                <div
                  style={{
                    fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family,
                    color: iconColor,
                    fontSize: "14px",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>Font Size: A A A</div>
                  <div>Contrast: ○ ○ ○</div>
                </div>
              </div>
            </div>

            {/* Save Button Section */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "4px",
                    border: "none",
                    background: isSaving ? "#a0a0a0" : "#008060",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  aria-label="Save widget settings"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={handleReset}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "4px",
                    border: "1px solid #c9cccf",
                    background: "#ffffff",
                    color: "#202223",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  aria-label="Reset to default settings"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Widgets page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// TODO: Replace mock settings with actual query from database
// TODO: Implement actual save functionality with API call
// TODO: Add success/error toast notifications
// TODO: Add Japanese language support
// TODO: Load Google Fonts for font preview
// TODO: Add validation for color values
// TODO: Implement real widget preview with actual accessibility features
// TODO: Add debounced preview updates for better performance
// TODO: Add accessibility features to preview panel (font size, contrast, etc.)