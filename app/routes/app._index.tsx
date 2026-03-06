import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MOCK_HAS_ACTIVE_PLAN } from "~/constants/billing.mock";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Check billing status
  // TODO: Replace MOCK_HAS_ACTIVE_PLAN with actual billing status query
  // from Shopify Billing API when ready
  const hasActivePlan = MOCK_HAS_ACTIVE_PLAN;

  // If no active plan, redirect to Plans page
  if (!hasActivePlan) {
    return redirect("/app/plans");
  }

  // If has plan, redirect to Setup page
  return redirect("/app/setup");
};

export default function Index() {
  // This component won't render due to redirect in loader
  // Kept for fallback/error state
  return null;
}

export function ErrorBoundary() {
  return boundary.error(new Error("Index page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
