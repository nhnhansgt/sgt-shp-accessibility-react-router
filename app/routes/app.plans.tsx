import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useRouteError } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock billing data
const MOCK_BILLING_STATUS = null; // null = no plan, 'monthly' or 'annual' = active plan

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual billing status query
  return {
    paid: MOCK_BILLING_STATUS,
    isYearEndSale: true, // Set to true to show sale banner
    saleDays: 90,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const planId = formData.get("planId");

  // TODO: Replace with actual billing mutation
  // For now, return fake confirmation URL
  return {
    confirmUrl: "https://shopify.com/admin/billing/confirm?test=true",
    paid: false,
  };
};

export default function Plans() {
  const fetcher = useFetcher<typeof loader>();
  const { paid, isYearEndSale, saleDays } = fetcher.data || {
    paid: null,
    isYearEndSale: true,
    saleDays: 90,
  };

  const isLoading = fetcher.state === "loading";

  return (
    <s-page heading="Choose your plan">
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

      {/* TODO: Add Plans Grid */}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
