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

      <s-section>
        <s-box
          padding="base"
          background={isAccessibilityOn ? "subdued" : "subdued"}
          borderRadius="base"
        >
          <s-stack direction="inline" gap="base">
            <s-text>
              {isAccessibilityOn
                ? "Accessibility is enabled"
                : "Accessibility is not enabled"}
            </s-text>
            <s-button variant="secondary">
              Open Theme Editor
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Setup page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};