import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useRouteError } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock billing data
const MOCK_BILLING_STATUS = null; // null = no plan, 'monthly' or 'annual' = active plan

interface Plan {
  id: "monthly" | "annual";
  name: string;
  price: number;
  originalPrice?: number;
  period: "monthly" | "annual";
  features: string[];
  trialDays: number;
  isPopular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 6.99,
    period: "monthly",
    features: [
      "Enhanced Readability",
      "Visually Pleasing Design",
      "Simplified Navigation",
      "Custom Brand Integration",
      "Premium Support",
    ],
    trialDays: 14,
  },
  {
    id: "annual",
    name: "Annual Plan",
    price: 5.60,
    originalPrice: 6.99,
    period: "annual",
    features: [
      "Enhanced Readability",
      "Visually Pleasing Design",
      "Simplified Navigation",
      "Custom Brand Integration",
      "Premium Support",
    ],
    trialDays: 14,
    isPopular: true,
  },
];

const FEATURES = [
  "Enhanced Readability",
  "Visually Pleasing Design",
  "Simplified Navigation",
  "Custom Brand Integration",
  "Premium Support",
];

function getButtonText(
  currentPlan: string | null,
  planPeriod: "monthly" | "annual"
): string {
  if (!currentPlan) return "Start free trial";
  if (currentPlan === planPeriod) return "Current plan";
  if (currentPlan === "monthly" && planPeriod === "annual") return "Upgrade";
  return "Downgrade";
}

interface PlanCardProps {
  plan: Plan;
  currentPlan: string | null;
  onSelect: (planId: string) => void;
  isLoading: boolean;
  requestingPlan: string | null;
}

function PlanCard({
  plan,
  currentPlan,
  onSelect,
  isLoading,
  requestingPlan,
}: PlanCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isRequesting = requestingPlan === plan.id;

  return (
    <s-box
      padding="base"
      borderWidth="base"
      borderRadius="base"
      background="subdued"
    >
      {plan.isPopular && (
        <s-section>
          <s-stack direction="inline" gap="base">
            <s-badge>Best Value</s-badge>
          </s-stack>
        </s-section>
      )}

      <s-stack direction="block" gap="base">
        <s-heading>{plan.name}</s-heading>

        <s-stack direction="inline" gap="base">
          <s-text>
            ${plan.price}
          </s-text>
          <s-text color="subdued">
            /{plan.period === "annual" ? "month (billed annually)" : "month"}
          </s-text>
        </s-stack>

        {plan.originalPrice && (
          <s-text color="subdued">
            Was ${plan.originalPrice}/month
          </s-text>
        )}

        <s-text>
          {plan.trialDays}-day free trial
        </s-text>

        <s-unordered-list>
          {plan.features.map((feature) => (
            <s-list-item key={feature}>{feature}</s-list-item>
          ))}
        </s-unordered-list>

        <s-button
          variant={plan.isPopular ? "primary" : "secondary"}
          onClick={() => onSelect(plan.id)}
          loading={isRequesting}
          disabled={isCurrentPlan}
        >
          {getButtonText(currentPlan, plan.id)}
        </s-button>
      </s-stack>
    </s-box>
  );
}

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

  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);
  const isLoading = fetcher.state === "loading";

  const handlePlanSelect = (planId: string) => {
    setRequestingPlan(planId);
    fetcher.submit({ planId }, { method: "post" });
  };

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

      <s-section>
        <s-stack direction="inline" gap="base">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={paid}
              onSelect={handlePlanSelect}
              isLoading={isLoading}
              requestingPlan={requestingPlan}
            />
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// TODO: Replace mock billing data with actual query from database
// TODO: Implement actual billing confirmation with Shopify Billing API
// TODO: Handle webhook for billing status updates
// TODO: Add Japanese language support using multipleLanguageSelector hook
// TODO: Add dismissible state for sale banner (persist to localStorage)
