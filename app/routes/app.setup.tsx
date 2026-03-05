import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock data - TODO: Replace with actual data from database
const MOCK_ACCESSIBILITY_ENABLED = true;
const MOCK_IS_YEAR_END_SALE = false;
const MOCK_SALE_DAYS = 0;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual query to get store settings
  return {
    isAccessibilityOn: MOCK_ACCESSIBILITY_ENABLED,
    isYearEndSale: MOCK_IS_YEAR_END_SALE,
    saleDays: MOCK_SALE_DAYS,
  };
};

export default function Setup() {
  const { isAccessibilityOn, isYearEndSale, saleDays } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Quick Start">
      {/* TODO: Add content */}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Setup page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};