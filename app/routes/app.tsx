import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { MOCK_HAS_ACTIVE_PLAN, type MockPlanType } from "~/constants/billing.mock";

interface NavItem {
  label: string;
  destination: string;
}

// Static navigation items - memoized to avoid rebuild on every render
const PAID_NAV_ITEMS: NavItem[] = [
  { label: "Quick Start", destination: "/app/setup" },
  { label: "Customize Your Widget", destination: "/app/widgets" },
  { label: "Statement", destination: "/app/statement" },
  { label: "Subscription & Plans", destination: "/app/plans" },
  { label: "Guides & Support", destination: "/app/support" },
];

const UNPAID_NAV_ITEMS: NavItem[] = [
  { label: "Choose Your Plan", destination: "/app/plans" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Return mock billing status
  // TODO: Replace with actual billing status from Shopify Billing API
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasActivePlan: MOCK_HAS_ACTIVE_PLAN,
    currentPlan: null as MockPlanType,
  };
};

export default function App() {
  const { apiKey, hasActivePlan } = useLoaderData<typeof loader>();

  // Use static navigation arrays - no rebuild on every render
  const navigationItems = hasActivePlan ? PAID_NAV_ITEMS : UNPAID_NAV_ITEMS;

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        {navigationItems.map((item) => (
          <s-link key={item.destination} href={item.destination}>
            {item.label}
          </s-link>
        ))}
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
