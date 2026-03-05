# Plans Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Plans Screen (`/app/plans`) UI with billing plan selection cards, sale banner, and fake data for display.

**Architecture:** Single React Router route file using Polaris web components, fetcher for form submissions, and mock data for billing status. The route will be publicly accessible (no paid plan check required).

**Tech Stack:** React Router, Polaris web components (`<s-page>`, `<s-card>`, `<s-button>`, etc.), TypeScript, mock data.

---

## Task 1: Create Plans Screen Route File

**Files:**
- Create: `app/routes/app.plans.tsx`
- Test: N/A (manual testing in browser)

**Step 1: Create the route file with basic structure**

Create `app/routes/app.plans.tsx` with:
- Loader function (no auth check required per spec)
- Action function for plan selection (returns fake response)
- Default export component with Plans page UI

```tsx
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
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
      {/* TODO: Add Year End Sale Banner */}

      {/* TODO: Add Plans Grid */}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

**Step 2: Verify file compiles**

Run: `npm run typecheck`
Expected: No errors for the new file

**Step 3: Commit**

```bash
git add app/routes/app.plans.tsx
git commit -m "feat: add Plans screen route with basic structure"
```

---

## Task 2: Add Year End Sale Banner Component

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Add Banner import and component**

Add the sale banner that shows conditionally:

```tsx
// Add import at top
import { Banner } from "@shopify/polaris";

// Inside Plans component, after getting data:
{isYearEndSale && (
  <Banner
    status="info"
    onDismiss={() => {}}
  >
    <s-stack direction="inline" gap="base">
      <span>🎉</span>
      <s-text>
        Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
      </s-text>
    </s-stack>
  </Banner>
)}
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.plans.tsx
git commit -m "feat: add Year End Sale banner to Plans screen"
```

---

## Task 3: Create Plan Data and Features List

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Add plan data constants**

Add at the top of the file (after imports):

```tsx
interface Plan {
  id: "monthly" | "annual";
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
  trialDays: number;
  isPopular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 6.99,
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
```

**Step 2: Add helper function for button text**

```tsx
function getButtonText(
  currentPlan: string | null,
  planPeriod: "monthly" | "annual"
): string {
  if (!currentPlan) return "Start free trial";
  if (currentPlan === planPeriod) return "Current plan";
  if (currentPlan === "monthly" && planPeriod === "annual") return "Upgrade";
  return "Downgrade";
}
```

**Step 3: Commit**

```bash
git add app/routes/app.plans.tsx
git commit -m "feat: add plan data constants and helper functions"
```

---

## Task 4: Create Plan Card Component

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Create PlanCard sub-component**

Add before the Plans component:

```tsx
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
      padding="loose"
      borderWidth="base"
      borderRadius="base"
      background={plan.isPopular ? "bg" : "subdued"}
      style={{
        flex: 1,
        position: "relative",
      }}
    >
      {plan.isPopular && (
        <s-box
          position="absolute"
          style={{ top: "8px", right: "8px" }}
        >
          <Badge status="success">Best Value</Badge>
        </s-box>
      )}

      <s-stack direction="block" gap="base">
        <s-heading level="2">{plan.name}</s-heading>

        <s-stack direction="inline" gap="tight" alignment="baseline">
          <s-text variant="headingLg">
            ${plan.price}
          </s-text>
          <s-text variant="subdued">
            /{plan.period === "annual" ? "month (billed annually)" : "month"}
          </s-text>
        </s-stack>

        {plan.originalPrice && (
          <s-text variant="subdued" textDecoration="lineThrough">
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
          style={{ width: "100%" }}
        >
          {getButtonText(currentPlan, plan.id)}
        </s-button>
      </s-stack>
    </s-box>
  );
}
```

**Step 2: Fix type error - add period to Plan interface**

Update Plan interface:

```tsx
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
```

And update PLANS data to include period:

```tsx
const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 6.99,
    period: "monthly",
    // ...
  },
  {
    id: "annual",
    name: "Annual Plan",
    price: 5.60,
    period: "annual",
    // ...
  },
];
```

**Step 3: Add Badge import**

```tsx
import { Badge } from "@shopify/polaris";
```

**Step 4: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/routes/app.plans.tsx
git commit -m "feat: create PlanCard sub-component with all features"
```

---

## Task 5: Add Plans Grid Layout to Main Component

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Add state for tracking which plan is being requested**

Inside Plans component:

```tsx
import { useState } from "react";

// ...

export default function Plans() {
  const fetcher = useFetcher<typeof loader>();
  const { paid, isYearEndSale, saleDays } = fetcher.data || {
    paid: null,
    isYearEndSale: true,
    saleDays: 90,
  };

  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setRequestingPlan(planId);
    fetcher.submit({ planId }, { method: "post" });
  };

  // ...
}
```

**Step 2: Add the plans grid layout**

Inside the s-page, after the banner:

```tsx
<s-section>
  <s-stack
    direction="inline"
    gap="loose"
    style={{
      "@media (max-width: 768px)": {
        flexDirection: "column",
      },
    }}
  >
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
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

---

## Task 6: Add Polish and Accessibility Features

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Add proper ARIA labels**

Update PlanCard button:

```tsx
<s-button
  variant={plan.isPopular ? "primary" : "secondary"}
  onClick={() => onSelect(plan.id)}
  loading={isRequesting}
  disabled={isCurrentPlan}
  aria-label={`Select ${plan.name} - ${plan.price} per ${plan.period}, ${plan.trialDays}-day free trial`}
  style={{ width: "100%" }}
>
  {getButtonText(currentPlan, plan.id)}
</s-button>
```

**Step 2: Add keyboard navigation support**

Update PlanCard container:

```tsx
<s-box
  padding="loose"
  borderWidth="base"
  borderRadius="base"
  background={plan.isPopular ? "bg" : "subdued"}
  role="article"
  aria-label={`${plan.name} - ${plan.price} per month`}
  style={{
    flex: 1,
    position: "relative",
  }}
>
```

**Step 3: Add responsive styling**

Update the Stack with inline styles for responsive:

```tsx
<s-stack direction="inline" gap="loose" wrap>
  {PLANS.map((plan) => (
    <s-box
      key={plan.id}
      style={{
        flex: "1 1 300px",
        maxWidth: "500px",
      }}
    >
      <PlanCard ... />
    </s-box>
  ))}
</s-stack>
```

**Step 4: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/routes/app.plans.tsx
git commit -m "feat: add accessibility features and responsive design"
```

---

## Task 7: Add Error Boundary and Headers

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Add ErrorBoundary component**

The headers function is already in the template. Add the ErrorBoundary:

```tsx
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
```

Add import:

```tsx
import { useRouteError } from "react-router";
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

---

## Task 8: Manual Testing and TODO Documentation

**Files:**
- Modify: `app/routes/app.plans.tsx`

**Step 1: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/app/plans`

Verify:
- Year End Sale banner displays
- Two plan cards display side by side (desktop) or stacked (mobile)
- Annual plan has "Best Value" badge
- All features are listed correctly
- Buttons show correct text based on plan status
- Button loading states work

**Step 2: Add TODO comments for backend integration**

Add these TODOs in the file:

```tsx
// TODO: Replace mock billing data with actual query from database
// TODO: Implement actual billing confirmation with Shopify Billing API
// TODO: Handle webhook for billing status updates
// TODO: Add Japanese language support using multipleLanguageSelector hook
// TODO: Add dismissible state for sale banner (persist to localStorage)
```

---

## Final File Structure

The completed `app/routes/app.plans.tsx` should include:

1. **Imports**: React, React Router, Polaris components, Shopify auth
2. **Types**: Plan interface, PlanCardProps interface
3. **Constants**: PLANS array with mock data, FEATURES array
4. **Helper Functions**: getButtonText, previewPositionStyle
5. **Loader**: Returns mock billing status
6. **Action**: Returns mock confirmation URL
7. **PlanCard Component**: Renders individual plan cards
8. **Plans Component**: Main page with banner and plans grid
9. **ErrorBoundary**: Error handling
10. **Headers**: Boundary headers

---

## Testing Checklist

- [ ] Banner displays during sale period
- [ ] Two plans display correctly on desktop (side by side)
- [ ] Plans stack on mobile (< 768px)
- [ ] Annual plan shows "Best Value" badge
- [ ] All 5 features listed for each plan
- [ ] Prices display correctly ($6.99/month, $5.60/month)
- [ ] Button states work:
  - "Start free trial" when no plan
  - "Current plan" when active
  - "Upgrade" / "Downgrade" for switching
- [ ] Loading state shows on button click
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] TypeScript compiles without errors

---

## Notes

- This implementation uses **fake/mock data** for display purposes only
- Backend integration (Shopify Billing API) is out of scope for this UI task
- The route is placed at `/app/plans` following React Router's flat routing convention
- Polaris web components (`<s-page>`, `<s-button>`, etc.) are used consistently with the existing codebase
