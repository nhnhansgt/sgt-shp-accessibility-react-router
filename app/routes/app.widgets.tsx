import { useState } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "~/db.server";
import { AccessibilityRepository } from "~/repositories/accessibility.repository";
import { SaleBanner } from "~/components/sale-banner";
import type { AccessibilityOptions, WidgetIcon, WidgetPosition, FontOption as FontOptionType } from "~/types/accessibility";
import { validateAccessibilitySettings } from "~/validators/accessibility.validator";
import { parseJson } from "~/utils/json.utils";

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
interface FontOptionDef {
  id: string;
  label: string;
  family: string;
}

const FONT_OPTIONS: FontOptionDef[] = [
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
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain);

  return {
    isYearEndSale: false,
    saleDays: 0,
    settings: {
      ...settings,
      options: parseJson<AccessibilityOptions>(settings.options as string, {
        color: "#ffffff",
        size: "24",
        background_color: "#FA6E0A",
        offsetX: 10,
        offsetY: 10,
        locale: "en",
        theme_bg_color: "#FA6E0A",
        font: "8",
      }),
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const formData = await request.formData();
  const settings = {
    icon: formData.get("icon") as WidgetIcon,
    position: formData.get("position") as WidgetPosition,
    options: JSON.parse(formData.get("options") as string || "{}") as AccessibilityOptions,
  };

  // Validate settings with Zod
  const validation = validateAccessibilitySettings(settings);
  if (!validation.success) {
    return new Response(JSON.stringify({ errors: validation.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const repository = new AccessibilityRepository(prisma);
  await repository.updateWidgetSettings(shopDomain, settings);

  return redirect("/app/widgets");
};

export default function Widgets() {
  const { isYearEndSale, saleDays, settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  // State management for widget settings
  const [selectedIcon, setSelectedIcon] = useState<WidgetIcon | null>(settings.icon as WidgetIcon | null);
  const [selectedPosition, setSelectedPosition] = useState<WidgetPosition | null>(settings.position as WidgetPosition | null);
  const [widgetSize, setWidgetSize] = useState(Number(settings.options.size));
  const [offsetX, setOffsetX] = useState(settings.options.offsetX);
  const [offsetY, setOffsetY] = useState(settings.options.offsetY);
  const [iconColor, setIconColor] = useState(settings.options.color);
  const [backgroundColor, setBackgroundColor] = useState(settings.options.background_color);
  const [themeBgColor, setThemeBgColor] = useState(settings.options.theme_bg_color);
  const [selectedFont, setSelectedFont] = useState<FontOptionType>(settings.options.font);

  // Handle save using fetcher
  const handleSave = () => {
    const formData = new FormData();
    formData.append("icon", selectedIcon || "");
    formData.append("position", selectedPosition || "");
    formData.append(
      "options",
      JSON.stringify({
        color: iconColor,
        size: String(widgetSize),
        background_color: backgroundColor,
        offsetX,
        offsetY,
        locale: settings.options.locale,
        theme_bg_color: themeBgColor,
        font: selectedFont,
      })
    );

    fetcher.submit(formData, { method: "post" });
  };

  // Handle reset to defaults
  const handleReset = () => {
    setSelectedIcon("icon-circle" as WidgetIcon);
    setSelectedPosition("bottom-right" as WidgetPosition);
    setWidgetSize(24);
    setOffsetX(10);
    setOffsetY(10);
    setIconColor("#ffffff");
    setBackgroundColor("#FA6E0A");
    setThemeBgColor("#FA6E0A");
    setSelectedFont("8" as FontOptionType);
  };

  const isSaving = fetcher.state !== "idle";

  return (
    <s-page heading="Customize Your Widget">
      {/* Year End Sale Banner (conditional) */}
      {isYearEndSale && <SaleBanner saleDays={saleDays} />}

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Settings Column (Left) */}
        <div style={{ flex: "1 1 400px", minWidth: "320px" }}>
          {/* Widget Icon Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Icon</SectionHeading>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {ICON_OPTIONS.map((icon) => (
                <SelectableCard
                  key={icon.id}
                  id={icon.id}
                  isSelected={selectedIcon === icon.id}
                  onClick={() => setSelectedIcon(icon.id as WidgetIcon)}
                  ariaLabel={`Select ${icon.label} icon`}
                >
                  <div style={EMOJI_STYLE}>{icon.emoji}</div>
                  <span style={LABEL_STYLE}>{icon.label}</span>
                </SelectableCard>
              ))}
            </div>
          </div>

          {/* Widget Position Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Position</SectionHeading>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {POSITION_OPTIONS.map((position) => (
                <SelectableCard
                  key={position.id}
                  id={position.id}
                  isSelected={selectedPosition === position.id}
                  onClick={() => setSelectedPosition(position.id as WidgetPosition)}
                  ariaLabel={`Set position to ${position.label}`}
                  minWidth="100px"
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
                  <span style={LABEL_STYLE}>{position.label}</span>
                </SelectableCard>
              ))}
            </div>
          </div>

          {/* Widget Size Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Size</SectionHeading>
            <div style={{ marginBottom: "16px" }}>
              <SliderRow label="Size" value={widgetSize} unit="px" onChange={setWidgetSize} min={24} max={50} ariaLabel="Widget size" />
            </div>
          </div>

          {/* Widget Offset Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Offset</SectionHeading>
            <div style={{ marginBottom: "16px" }}>
              <SliderRow label="X Offset" value={offsetX} unit="px" onChange={setOffsetX} min={0} max={100} ariaLabel="Widget X offset" />
              <SliderRow label="Y Offset" value={offsetY} unit="px" onChange={setOffsetY} min={0} max={100} ariaLabel="Widget Y offset" />
            </div>
          </div>

          {/* Widget Colors Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Colors</SectionHeading>
            <div style={{ marginBottom: "16px" }}>
              <ColorPickerRow label="Icon Color" value={iconColor} onChange={setIconColor} ariaLabel="Icon color" />
              <ColorPickerRow label="Background" value={backgroundColor} onChange={setBackgroundColor} ariaLabel="Widget background color" />
              <ColorPickerRow label="Panel Bg" value={themeBgColor} onChange={setThemeBgColor} ariaLabel="Panel background color" />
            </div>
          </div>

          {/* Widget Font Section */}
          <div style={SECTION_STYLE}>
            <SectionHeading>Widget Font</SectionHeading>
            <div style={{ marginBottom: "16px" }}>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value as FontOptionType)}
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
                <FontPreviewText fontId={selectedFont}>
                  Preview: The quick brown fox jumps over the lazy dog
                </FontPreviewText>
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
                <div style={getPreviewPositionStyle(selectedPosition, offsetX, offsetY)}>
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
                  <strong style={{ fontFamily: FONT_OPTIONS.find((f) => f.id === selectedFont)?.family, color: iconColor, fontSize: "16px" }}>
                    Accessibility Options
                  </strong>
                </div>
                <FontPreviewText fontId={selectedFont as string}>
                  <div style={{ marginBottom: "4px" }}>Font Size: A A A</div>
                  <div>Contrast: ○ ○ ○</div>
                </FontPreviewText>
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

// Reusable styles
const SECTION_STYLE = { marginBottom: "24px" };
const HEADING_STYLE = { fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#202223" };
const CARD_BASE_STYLE = {
  padding: "16px",
  borderRadius: "8px",
  cursor: "pointer",
  textAlign: "center" as const,
};
const getCardSelectedStyle = (isSelected: boolean) => ({
  borderStyle: isSelected ? "solid" : "dashed",
  borderColor: isSelected ? "#008060" : "#c9cccf",
  borderWidth: isSelected ? "2px" : "1px",
  background: isSelected ? "#f6f6f7" : "transparent",
});
const LABEL_STYLE = { fontSize: "12px", color: "#6d7175" };
const EMOJI_STYLE = { fontSize: "24px", marginBottom: "4px" };

// Helper to get preview position styles
function getPreviewPositionStyle(position: string | null, offsetX: number, offsetY: number) {
  const pos = position || "bottom-right";
  return {
    position: "absolute" as const,
    top: pos.includes("top") ? `${offsetY}px` : "auto",
    bottom: pos.includes("bottom") ? `${offsetY}px` : "auto",
    left: pos.includes("left") ? `${offsetX}px` : "auto",
    right: pos.includes("right") ? `${offsetX}px` : "auto",
  };
}

// Reusable section heading component
function SectionHeading({ children }: { children: string }) {
  return <h2 style={HEADING_STYLE}>{children}</h2>;
}

// Reusable slider row component
interface SliderRowProps {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  min: number;
  max: number;
  ariaLabel: string;
}

function SliderRow({ label, value, unit, onChange, min, max, ariaLabel }: SliderRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
      <span style={{ minWidth: "80px", fontSize: "14px" }}>{label}: {value}{unit}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        style={{ flex: 1, height: "4px", borderRadius: "2px" }}
      />
    </div>
  );
}

// Reusable color picker row component
interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

function ColorPickerRow({ label, value, onChange, ariaLabel }: ColorPickerRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
      <span style={{ minWidth: "100px", fontSize: "14px" }}>{label}:</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        style={{
          width: "40px",
          height: "40px",
          border: "1px solid #c9cccf",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "2px",
        }}
      />
      <span style={{ fontSize: "14px", color: "#6d7175" }}>{value}</span>
    </div>
  );
}

// Reusable font preview component
interface FontPreviewTextProps {
  fontId: string;
  children: React.ReactNode;
}

function FontPreviewText({ fontId, children }: FontPreviewTextProps) {
  const font = FONT_OPTIONS.find((f) => f.id === fontId);
  return (
    <span
      style={{
        fontFamily: font?.family,
        fontSize: "16px",
      }}
    >
      {children}
    </span>
  );
}

// Reusable icon/position card component
interface SelectableCardProps {
  id: string;
  isSelected: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  minWidth?: string;
}

function SelectableCard({
  id,
  isSelected,
  onClick,
  ariaLabel,
  children,
  minWidth = "80px",
}: SelectableCardProps) {
  return (
    <div
      key={id}
      onClick={onClick}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      style={{
        ...CARD_BASE_STYLE,
        ...getCardSelectedStyle(isSelected),
        minWidth,
      }}
    >
      {children}
    </div>
  );
}