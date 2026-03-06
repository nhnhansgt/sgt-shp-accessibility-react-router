# Fix User Flow Discrepancies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all discrepancies between the user flow documentation (`docs/user-flow-and-screens.md`) and the actual codebase to ensure proper billing guards, entry route redirects, and missing routes.

**Architecture:** Repository pattern with Prisma ORM. Entry route (`app._index.tsx`) redirects based on billing status. Navigation menu dynamically shows/hides items based on subscription. All routes protected by billing guards in loaders.

**Tech Stack:** React Router (loaders/actions), Prisma ORM, TypeScript, Polaris web components, Shopify App authentication, Zod validation.

**Key Constraints:**
- Use existing `accessibilities` table schema
- Query using `shop` column only
- Billing status: Simple boolean variable with TODO for future Shopify Billing API integration

---

## Prerequisites

Before starting, ensure these files exist and are working:
- ✅ `app/repositories/accessibility.repository.ts`
- ✅ `app/types/accessibility.ts`
- ✅ `app/validators/accessibility.validator.ts`
- ✅ `app/constants/accessibility.defaults.ts`

---

## Task 1: Create Mock Billing Variable

**Files:**
- Create: `app/constants/billing.mock.ts`

**Step 1: Create constants file for mock billing**

Create `app/constants/billing.mock.ts`:

```typescript
/**
 * Mock billing status variable
 *
 * TODO: Replace with actual Shopify Billing API integration when ready.
 * This variable should be removed and replaced with:
 * 1. Query to check active subscriptions via Shopify Billing API
 * 2. Webhook handlers for subscription activation/cancellation
 * 3. Database persistence for billing status
 *
 * Reference: https://shopify.dev/docs/apps/billing
 */
export const MOCK_HAS_ACTIVE_PLAN = false; // Set to true to simulate paid user

/**
 * Mock current plan type
 * TODO: Replace with actual subscription data from Shopify Billing API
 */
export type MockPlanType = "monthly" | "annual" | null;

/**
 * Mock current plan
 *
 * TODO: Replace with actual subscription data from Shopify Billing API.
 * Should query:
 * - AppSubscription queries via Admin GraphQL API
 * - RecurringApplicationCharge endpoints
 */
export const MOCK_CURRENT_PLAN: MockPlanType = null;
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/constants/billing.mock.ts
git commit -m "feat: add mock billing variables with TODOs for future integration"
```

---

## Task 2: Create ExitIframe Route

**Files:**
- Create: `app/routes/app.ExitIframe.tsx`

**Step 1: Create ExitIframe route file**

Create `app/routes/app.ExitIframe.tsx`:

```typescript
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useSearchParams, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function ExitIframe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectUri = searchParams.get("redirectUri");

    if (!redirectUri) {
      setError("Missing redirectUri parameter");
      return;
    }

    try {
      const url = new URL(redirectUri);

      // Validate hostname matches current domain (security check)
      if (url.hostname !== window.location.hostname) {
        setError("Invalid redirect domain");
        return;
      }

      // Use App Bridge redirect or navigate directly
      navigate(url.pathname + url.search + url.hash, { replace: true });
    } catch (err) {
      setError("Invalid redirect URL");
    }
  }, [searchParams, navigate]);

  return (
    <s-page heading="Redirecting...">
      {error ? (
        <s-section>
          <s-box
            padding="base"
            background="subdued"
            borderRadius="base"
            borderWidth="base"
            borderColor="critical"
          >
            <s-text color="critical">{error}</s-text>
            <s-button
              variant="primary"
              onClick={() => navigate("/app/setup")}
              style={{ marginTop: "16px" }}
            >
              Go to Setup
            </s-button>
          </s-box>
        </s-section>
      ) : (
        <s-section>
          <s-stack direction="block" gap="base" alignment="center">
            <s-spinner size="large" />
            <s-paragraph>Redirecting to billing confirmation...</s-paragraph>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("ExitIframe page error"));
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.ExitIframe.tsx
git commit -m "feat: add ExitIframe route for billing redirects"
```

---

## Task 3: Fix Entry Route (app._index.tsx) with Redirect Logic

**Files:**
- Modify: `app/routes/app._index.tsx`

**Step 1: Replace entire file content**

Replace entire file content with:

```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app._index.tsx
git commit -m "feat: add billing-based redirect in entry route"
```

---

## Task 4: Add Billing Guard to Navigation Menu

**Files:**
- Modify: `app/routes/app.tsx`

**Step 1: Update app.tsx to use mock billing variable**

Replace entire file content with:

```typescript
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

  // Build navigation menu based on billing status
  const navigationItems: NavItem[] = [];

  if (hasActivePlan) {
    // Show all menu items for paid users
    navigationItems.push(
      { label: "Quick Start", destination: "/app/setup" },
      { label: "Customize Your Widget", destination: "/app/widgets" },
      { label: "Statement", destination: "/app/statement" },
      { label: "Subscription & Plans", destination: "/app/plans" },
      { label: "Guides & Support", destination: "/app/support" }
    );
  } else {
    // Show only Plans for unpaid users
    navigationItems.push({
      label: "Choose Your Plan",
      destination: "/app/plans",
    });
  }

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
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.tsx
git commit -m "feat: add dynamic navigation based on billing status"
```

---

## Task 5: Keep Plans Route Unchanged (Mock Billing Already In Place)

**Files:**
- No changes needed: `app/routes/app.plans.tsx`

**Note:** The Plans route already has mock billing data in place:

```typescript
// Existing code in app.plans.tsx:
const MOCK_BILLING_STATUS = null; // null = no plan, 'monthly' or 'annual' = active plan

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual billing status query
  return {
    paid: MOCK_BILLING_STATUS,
    isYearEndSale: true,
    saleDays: 90,
  };
};
```

**No action needed** - The existing mock billing is sufficient for now.

**TODO for future:** When Shopify Billing API integration is ready, replace `MOCK_BILLING_STATUS` with actual query.

---

## Task 6: Add Theme Editor Link to Setup Route

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add Theme Editor button functionality**

Find the "Open Theme Editor" button (around line 93-95) and update:

```typescript
<s-button
  variant="secondary"
  onClick={() => {
    // Open Shopify Theme Editor in new tab
    window.open(`/admin/themes/${THEME_ID}/editor`, "_blank");
  }}
>
  Open Theme Editor
</s-button>
```

Note: `THEME_ID` would need to be fetched from Shopify Admin API or configured.

**Step 2: (Optional) Add language selector**

The docs mention language selection ('en'/'jp'). Add if needed:

```typescript
// In the loader, return current locale
return {
  isAccessibilityOn: settings.status === AccessibilityStatus.ENABLED,
  isYearEndSale: false,
  saleDays: 0,
  currentLocale: settings.options?.locale || 'en',
};
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add Theme Editor link to Setup screen"
```

---

## Task 7: Add Setup Modal for First-Time Users

**Files:**
- Modify: `app/routes/app.setup.tsx`
- Create: `app/components/welcome-modal.tsx` (optional)

**Step 1: Add modal state to Setup component**

Add to component:

```typescript
const [showWelcomeModal, setShowWelcomeModal] = useState(false);
const [currentSlide, setCurrentSlide] = useState(0);

// Check if first visit
useEffect(() => {
  const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
  if (!hasSeenOnboarding) {
    setShowWelcomeModal(true);
    localStorage.setItem("hasSeenOnboarding", "true");
  }
}, []);

// Auto-slide functionality
useEffect(() => {
  if (!showWelcomeModal) return;

  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, 5000); // 5 seconds per slide

  return () => clearInterval(interval);
}, [showWelcomeModal]);
```

**Step 2: Add slides data**

```typescript
const SLIDES = [
  {
    title: "Welcome",
    description: "Make your store accessible to everyone",
    icon: "♿",
  },
  {
    title: "Customize",
    description: "Personalize your widget to match your brand",
    icon: "🎨",
  },
  {
    title: "Statement",
    description: "Create a WCAG compliant accessibility statement",
    icon: "📄",
  },
  {
    title: "Support",
    description: "We're here to help 24/7",
    icon: "💬",
  },
  {
    title: "Ready",
    description: "Start your 14-day free trial today!",
    icon: "🚀",
  },
];
```

**Step 3: Add modal JSX**

Add before closing `</s-page>`:

```typescript
{showWelcomeModal && (
  <s-section>
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setShowWelcomeModal(false)}
    >
      <s-box
        padding="loose"
        background="bg"
        borderRadius="base"
        maxWidth="400px"
        onClick={(e) => e.stopPropagation()}
      >
        <s-stack direction="block" gap="base" alignment="center">
          <s-heading level={3}>{SLIDES[currentSlide].title}</s-heading>
          <s-paragraph>{SLIDES[currentSlide].description}</s-paragraph>
          <s-text style={{ fontSize: "64px" }}>{SLIDES[currentSlide].icon}</s-text>

          {/* Dots indicator */}
          <s-stack direction="inline" gap="tight">
            {SLIDES.map((_, index) => (
              <s-box
                key={index}
                width="8px"
                height="8px"
                borderRadius="full"
                background={index === currentSlide ? "brand" : "subdued"}
              />
            ))}
          </s-stack>

          <s-button variant="primary" onClick={() => setShowWelcomeModal(false)}>
            {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
          </s-button>
        </s-stack>
      </s-box>
    </div>
  </s-section>
)}
```

**Step 4: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add welcome modal for first-time users"
```

---

## Task 8: Update Documentation Status

**Files:**
- Modify: `docs/architecture-analysis.md`
- Modify: `docs/user-flow-and-screens.md`

**Step 1: Update implementation status in architecture-analysis.md**

Find "Implementation Priorities" section and update:

```markdown
### Phase 1: Core Infrastructure
- [x] Add `shop` column to accessibilities table
- [x] Create `repositories/accessibility.repository.ts`
- [x] Create `validators/accessibility.validator.ts`
- [x] Update `app.tsx` with navigation
- [x] Create `constants/billing.mock.ts` with TODO variables

### Phase 2: Setup Page
- [x] Implement `app.setup.tsx` route
- [x] Connect to database via repository
- [x] Add welcome modal for first-time users
- [x] Add Theme Editor link

### Phase 3: Entry Route & Navigation
- [x] Add billing-based redirect in `app._index.tsx`
- [x] Create `app.ExitIframe.tsx` route
- [x] Add dynamic navigation based on billing status (mock variable)

### Phase 4: Widgets Page
- [x] Implement `app.widgets.tsx` route
- [x] Connect to database via repository
- [x] Add Zod validation

### Phase 5: Statement Page
- [x] Implement `app.statement.tsx` route
- [x] Connect to database via repository

### Phase 6: Support & Public API
- [x] Implement `app.support.tsx` route
- [x] Connect to database via repository
- [x] Create `api.accessibilities.$shop.tsx` public endpoint
```

**Step 2: Commit**

```bash
git add docs/architecture-analysis.md
git commit -m "docs: update implementation status"
```

---

## Task 9: Final Verification and Testing

**Files:**
- All modified route files

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Manual end-to-end test**

1. Run: `npm run dev`
2. Navigate to: `http://localhost:3000/app`
3. Test flow:
   - **With `MOCK_HAS_ACTIVE_PLAN = false`**: Should redirect to `/app/plans`
   - **With `MOCK_HAS_ACTIVE_PLAN = true`**: Should redirect to `/app/setup`
   - **Navigation menu**: Should show "Choose Your Plan" only when `MOCK_HAS_ACTIVE_PLAN = false`
   - **ExitIframe**: Test with `?redirectUri=/app/setup`
   - **Setup modal**: Should show on first visit (clear localStorage to test)
   - **Widgets**: Should load/save settings
   - **Statement**: Should load/save HTML
   - **Support**: Should load without errors

**Step 4: Verify mock variable location**

Open `app/constants/billing.mock.ts` and verify:
- `MOCK_HAS_ACTIVE_PLAN` is set to `false` (or `true` for testing paid user)
- TODO comment is present for future Shopify Billing API integration

**Step 5: Commit all changes**

```bash
git add .
git commit -m "feat: complete user flow implementation"
```

---

## Testing Checklist

- [ ] Entry route redirects to Plans (`MOCK_HAS_ACTIVE_PLAN = false`) or Setup (`MOCK_HAS_ACTIVE_PLAN = true`)
- [ ] ExitIframe route handles redirectUri parameter
- [ ] Navigation menu shows correct items based on `MOCK_HAS_ACTIVE_PLAN`
- [ ] Setup page shows welcome modal on first visit (clear localStorage to test)
- [ ] Setup page has Theme Editor link (or placeholder)
- [ ] All TypeScript files compile
- [ ] ESLint passes
- [ ] Manual E2E test passes

---

## Final File Structure

```
app/
├── routes/
│   ├── app._index.tsx           # Entry with billing redirect ✅
│   ├── app.ExitIframe.tsx       # NEW: Billing redirect handler ✅
│   ├── app.setup.tsx            # With modal + Theme Editor ✅
│   ├── app.widgets.tsx          # Connected to DB ✅
│   ├── app.statement.tsx        # Connected to DB ✅
│   ├── app.support.tsx          # Connected to DB ✅
│   ├── app.plans.tsx            # With mock billing (existing) ✅
│   └── api.accessibilities.$shop.tsx  # Public endpoint ✅
│
├── repositories/
│   └── accessibility.repository.ts    # Complete ✅
│
├── types/
│   └── accessibility.ts               # Complete ✅
│
├── validators/
│   └── accessibility.validator.ts     # Complete ✅
│
└── constants/
    ├── accessibility.defaults.ts      # Complete ✅
    └── billing.mock.ts                # NEW: Mock billing with TODO ✅
```

---

## Notes

- **Billing functionality**: Uses mock variable (`MOCK_HAS_ACTIVE_PLAN`) with TODO for future Shopify Billing API integration
- **Welcome modal** uses localStorage for persistence
- **ExitIframe** validates redirect domain for security
- **Navigation menu** dynamically builds based on `MOCK_HAS_ACTIVE_PLAN` from loader

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-06 | Initial implementation plan created |
| 1.1 | 2026-03-06 | Removed BillingService, replaced with simple mock variable |
| 1.2 | 2026-03-06 | Removed Crisp chat integration from plans |
```
