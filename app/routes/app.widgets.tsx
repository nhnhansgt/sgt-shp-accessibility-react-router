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