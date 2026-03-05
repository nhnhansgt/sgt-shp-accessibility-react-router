# Setup / Quick Start Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Setup/Quick Start Screen (`/app/setup`) UI with status banner, welcome card with 5-step guide, support card, and mock data for display.

**Architecture:** Single React Router route file using Polaris web components (`<s-page>`, `<s-section>`, `<s-button>`, etc.) and mock data for display. The route will follow the same patterns as existing routes (`app.plans.tsx`, `app.additional.tsx`).

**Tech Stack:** React Router, Polaris web components, TypeScript, mock data.

---

## Task 1: Create Setup Screen Route File

**Files:**
- Create: `app/routes/app.setup.tsx`

**Step 1: Create the route file with basic structure**

Create `app/routes/app.setup.tsx` with:
- Loader function (auth check required)
- Default export component with Setup page UI

```tsx
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
  return boundary.error(Error("Setup page error"));
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
git add app/routes/app.setup.tsx
git commit -m "feat: add Setup screen route with basic structure"
```

---

## Task 2: Add Navigation Link to Setup Page

**Files:**
- Modify: `app/routes/app.tsx`

**Step 1: Add Quick Start link to navigation**

Update the navigation:

```tsx
<s-app-nav>
  <s-link href="/app">Home</s-link>
  <s-link href="/app/setup">Quick Start</s-link>
  <s-link href="/app/plans">Plans</s-link>
</s-app-nav>
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.tsx
git commit -m "feat: add Quick Start link to navigation"
```

---

## Task 3: Add Year End Sale Banner (Conditional)

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add Sale Banner to Setup component**

Add after `<s-page>` opening tag:

```tsx
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
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add Year End Sale banner to Setup screen"
```

---

## Task 4: Add Status Banner Component

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add Status Banner**

The status banner shows whether accessibility is enabled (green) or disabled (yellow).

Add after the sale banner section:

```tsx
<s-section>
  <s-box
    padding="base"
    background={isAccessibilityOn ? "success-light" : "warning-light"}
    borderRadius="base"
  >
    <s-stack direction="inline" gap="base" alignment="center">
      <s-text>
        {isAccessibilityOn
          ? "Accessibility is enabled"
          : "Accessibility is not enabled"}
      </s-text>
      <s-button variant="secondary" size="slim">
        Open Theme Editor
      </s-button>
    </s-stack>
  </s-box>
</s-section>
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add status banner to Setup screen"
```

---

## Task 5: Add Welcome Card with Getting Started Guide

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Define getting started steps data**

Add after imports (before loader):

```tsx
interface GuideStep {
  number: number;
  title: string;
  description: string;
  href: string;
}

const GETTING_STARTED_STEPS: GuideStep[] = [
  {
    number: 1,
    title: "Customize your widget",
    description: "Choose icons, colors, and position",
    href: "/app/widgets",
  },
  {
    number: 2,
    title: "Create your statement",
    description: "Write your accessibility statement",
    href: "/app/statement",
  },
  {
    number: 3,
    title: "Visit Help Center",
    description: "Get answers to common questions",
    href: "https://sgt-lab.com/help",
    target: "_blank",
  },
  {
    number: 4,
    title: "Website & Facebook",
    description: "Learn more about our services",
    links: [
      { label: "Website", href: "https://sgt-lab.com" },
      { label: "Facebook", href: "https://facebook.com/sgtlab" },
    ],
  },
  {
    number: 5,
    title: "Manage your plan",
    description: "View or change your subscription",
    href: "/app/plans",
  },
];
```

**Step 2: Add Welcome Card with 5-step guide**

Add after status banner:

```tsx
<s-section>
  <s-box
    padding="loose"
    borderWidth="base"
    borderRadius="base"
    background="subdued"
  >
    <s-stack direction="block" gap="base">
      <s-heading level="2">Welcome to Accessibility App</s-heading>

      <s-paragraph>
        Getting started is easy! Follow these steps to make your store more accessible:
      </s-paragraph>

      <s-unordered-list>
        {GETTING_STARTED_STEPS.map((step) => (
          <s-list-item key={step.number}>
            <s-stack direction="block" gap="tight">
              <s-text>
                <strong>{step.number}. {step.title}</strong>
                {" - "}{step.description}
              </s-text>
              {"links" in step ? (
                <s-stack direction="inline" gap="base">
                  {step.links?.map((link) => (
                    <s-link
                      key={link.label}
                      href={link.href}
                      target={link.target || "_blank"}
                    >
                      {link.label}
                    </s-link>
                  ))}
                </s-stack>
              ) : (
                <s-link href={step.href}>
                  Go to {step.title.toLowerCase()}
                </s-link>
              )}
            </s-stack>
          </s-list-item>
        ))}
      </s-unordered-list>
    </s-stack>
  </s-box>
</s-section>
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add welcome card with 5-step getting started guide"
```

---

## Task 6: Add Support Card Component

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add Support Card**

Add after Welcome Card:

```tsx
<s-section>
  <s-box
    padding="loose"
    borderWidth="base"
    borderRadius="base"
    background="subdued"
  >
    <s-stack direction="block" gap="base">
      <s-heading level="2">Have questions or need assistance?</s-heading>

      <s-paragraph>
        Our team is here to help you with any questions about accessibility.
      </s-paragraph>

      <s-stack direction="inline" gap="base" wrap>
        <s-button
          variant="primary"
          aria-label="Open chat support"
          onClick={() => {
            // TODO: Open Crisp chat
            window.open("https://crisp.chat", "_blank");
          }}
        >
          Chat with us
        </s-button>

        <s-button
          variant="secondary"
          aria-label="Send email to support"
          onClick={() => {
            window.location.href = "mailto:support@sgt-lab.com";
          }}
        >
          Email
        </s-button>

        <s-button
          variant="secondary"
          aria-label="Open knowledge base"
          onClick={() => {
            window.open("https://sgt-lab.com/help", "_blank");
          }}
        >
          Knowledge Base
        </s-button>
      </s-stack>

      {/* Technical support illustration placeholder */}
      <s-box padding="loose" textAlign="center">
        <s-text color="subdued">
          Technical Support Available
        </s-text>
      </s-box>
    </s-stack>
  </s-box>
</s-section>
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add support card with contact buttons"
```

---

## Task 7: Add Welcome Modal (First Visit)

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add modal state and data**

Add import for useState:

```tsx
import { useState } from "react";
```

Add modal content data after GETTING_STARTED_STEPS:

```tsx
interface ModalSlide {
  title: string;
  description: string;
  icon: string;
}

const WELCOME_MODAL_SLIDES: ModalSlide[] = [
  {
    title: "Welcome to Accessibility App",
    description: "Make your Shopify store accessible to everyone",
    icon: "🌐",
  },
  {
    title: "Customize the Widget",
    description: "Choose from various icons, colors, and positions",
    icon: "🎨",
  },
  {
    title: "Create Accessibility Statement",
    description: "Show your commitment to accessibility",
    icon: "📝",
  },
  {
    title: "Get Support Anytime",
    description: "Chat with us or browse our knowledge base",
    icon: "💬",
  },
  {
    title: "You're All Set!",
    description: "Start making your store accessible today",
    icon: "✅",
  },
];
```

**Step 2: Add modal state to component**

Inside Setup function, add state:

```tsx
const [isModalOpen, setIsModalOpen] = useState(true);
const [currentSlide, setCurrentSlide] = useState(0);

const closeModal = () => setIsModalOpen(false);
const nextSlide = () => {
  if (currentSlide < WELCOME_MODAL_SLIDES.length - 1) {
    setCurrentSlide(currentSlide + 1);
  } else {
    closeModal();
  }
};
const prevSlide = () => {
  if (currentSlide > 0) {
    setCurrentSlide(currentSlide - 1);
  }
};
```

**Step 3: Add modal rendering**

Add at the end of the component (before ErrorBoundary):

```tsx
{isModalOpen && (
  <s-box
    position="fixed"
    inset="0"
    background="rgba(0,0,0,0.5)"
    display="flex"
    alignment="center"
    justification="center"
    zIndex="1000"
    onClick={closeModal}
  >
    <s-box
      padding="loose"
      background="bg"
      borderRadius="base"
      maxWidth="400px"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <s-stack direction="block" gap="base" alignment="center">
        {/* Logo */}
        <s-box textAlign="center" padding="base">
          <s-heading level="2">Accessibility App</s-heading>
        </s-box>

        <s-divider></s-divider>

        {/* Slide content */}
        <s-stack direction="block" gap="base" alignment="center" padding="loose">
          <s-box fontSize="4xl">
            {WELCOME_MODAL_SLIDES[currentSlide].icon}
          </s-box>
          <s-text variant="headingMd">
            {WELCOME_MODAL_SLIDES[currentSlide].title}
          </s-text>
          <s-text color="subdued" textAlign="center">
            {WELCOME_MODAL_SLIDES[currentSlide].description}
          </s-text>
        </s-stack>

        {/* Progress dots */}
        <s-stack direction="inline" gap="tight">
          {WELCOME_MODAL_SLIDES.map((_, index) => (
            <s-box
              key={index}
              width="8px"
              height="8px"
              borderRadius="full"
              background={index === currentSlide ? "primary" : "subdued"}
            />
          ))}
        </s-stack>

        {/* Close button */}
        <s-button variant="primary" onClick={closeModal}>
          Close
        </s-button>
      </s-stack>
    </s-box>
  </s-box>
)}
```

**Step 4: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: add welcome modal with feature slides"
```

---

## Task 8: Manual Testing and TODO Documentation

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/app/setup`

Verify:
- Quick Start page heading displays
- Year End Sale banner (if sale is active)
- Status banner shows accessibility status with correct color
- "Open Theme Editor" button is present
- Welcome card with all 5 steps displays
- Each step has correct link/destination
- Support card with 3 buttons displays
- Welcome modal appears on first visit
- Modal slides navigate correctly
- Close button works

**Step 2: Add TODO comments**

Add at the end of the file:

```tsx
// TODO: Replace mock accessibility status with actual query from database
// TODO: Add first-visit modal dismiss logic (persist to localStorage)
// TODO: Implement Crisp chat integration
// TODO: Replace external links with actual help center URLs
// TODO: Add Japanese language support
// TODO: Add theme editor redirect logic
```

---

## Final File Structure

The completed `app/routes/app.setup.tsx` should include:

1. **Imports**: React, React Router, Shopify auth
2. **Types**: GuideStep, ModalSlide interfaces
3. **Constants**: GETTING_STARTED_STEPS, WELCOME_MODAL_SLIDES arrays
4. **Loader**: Returns mock accessibility status and sale info
5. **Setup Component**: Main page with all sections
6. **Welcome Modal**: First-visit popup with slides
7. **ErrorBoundary**: Error handling
8. **Headers**: Boundary headers

---

## Testing Checklist

- [ ] Quick Start heading displays correctly
- [ ] Year End Sale banner shows conditionally
- [ ] Status banner displays with correct color (green/yellow)
- [ ] Status text matches accessibility state
- [ ] "Open Theme Editor" button is present
- [ ] Welcome card displays with 5 steps
- [ ] Each step has correct links
- [ ] Step 4 shows both Website and Facebook links
- [ ] Support card displays below welcome card
- [ ] 3 buttons in support card (Chat, Email, Knowledge Base)
- [ ] Welcome modal appears on page load
- [ ] Modal slides work (next/close)
- [ ] Progress dots show current slide
- [ ] Responsive layout works
- [ ] Keyboard navigation works
- [ ] TypeScript compiles without errors

---

## Notes

- This implementation uses **fake/mock data** for display purposes only
- Backend integration (Shopify API, database queries) is out of scope for this UI task
- The modal uses React state - real implementation would use localStorage to track first visit
- External links currently go to placeholder URLs - should be replaced with actual URLs