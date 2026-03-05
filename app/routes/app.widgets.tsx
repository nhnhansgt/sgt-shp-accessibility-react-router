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
        <s-stack direction="inline" gap="base">
          {ICON_OPTIONS.map((icon) => (
            <s-box
              key={icon.id}
              padding="base"
              borderWidth="base"
              borderColor={selectedIcon === icon.id ? "border" : "subdued"}
              borderRadius="base"
              background={selectedIcon === icon.id ? "subdued" : "subdued"}
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
              <s-stack direction="block" gap="base">
                <span style={{ fontSize: "24px" }}>{icon.emoji}</span>
                <s-text>{icon.label}</s-text>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Widgets page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};