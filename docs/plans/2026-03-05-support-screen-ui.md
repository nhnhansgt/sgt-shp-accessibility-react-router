# Support Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Support Screen interface at `/app/support` with video tutorial embed, support options cards, and footer links using Polaris web components.

**Architecture:** Follow existing screen patterns from `app.plans.tsx` and `app.statement.tsx` - use Polaris web components (`<s-page>`, `<s-section>`, `<s-stack>`, `<s-box>`, `<s-button>`, `<s-link>`, `<s-heading>`, `<s-paragraph>`), mock data for display, and TODO comments for backend integration.

**Tech Stack:** React Router, Polaris web components, TypeScript, Shopify App authentication.

---

## Task 1: Create Support Screen Route File

**Files:**
- Create: `app/routes/app.support.tsx`
- Test: Manual verification in browser at `/app/support`

**Step 1: Create the route file with basic structure**

Create `app/routes/app.support.tsx` with:
- Required imports (authenticate, boundary, useLoaderData, etc.)
- Loader function with mock data
- Default export component with page structure
- ErrorBoundary and headers exports

```tsx
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Mock data - TODO: Replace with actual data from database
const MOCK_DATA = {
  isYearEndSale: true,
  saleDays: 90,
  videoUrl: "https://www.youtube.com/embed/e0WOkdanoJo",
  videoTitle: "How to use Accessibility app",
  supportEmail: "support@sgt-lab.com",
  knowledgeBaseUrl: "https://sgt-lab.com/help/category/accessibility-faqs/",
  links: {
    privacyPolicy: "https://sgt-lab.com/privacy",
    termsOfService: "https://sgt-lab.com/terms",
  },
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // TODO: Replace with actual query to get store settings
  return {
    ...MOCK_DATA,
  };
};

export default function Support() {
  const {
    isYearEndSale,
    saleDays,
    videoUrl,
    videoTitle,
    supportEmail,
    knowledgeBaseUrl,
    links
  } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Guides & Support">
      {/* Year End Sale Banner - Conditional */}
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

      {/* Video Tutorial Section */}
      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-heading level={2}>How to use Accessibility app</s-heading>
          <div style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
            marginTop: "16px",
            borderRadius: "8px"
          }}>
            <iframe
              src={videoUrl}
              title={videoTitle}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none"
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </s-box>
      </s-section>

      {/* Support Options Section */}
      <s-section>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-heading level={2}>Have questions or need assistance?</s-heading>

          <s-paragraph>
            We respond within <strong>12 - 24 hours</strong> via email
          </s-paragraph>

          <s-stack direction="inline" gap="base" style={{ marginTop: "16px" }}>
            {/* Chat with us button */}
            <s-button
              variant="primary"
              onClick={() => {
                // TODO: Open Crisp chat widget
                console.log("Open Crisp chat");
              }}
              aria-label="Chat with support"
            >
              Chat with us
            </s-button>

            {/* Email button */}
            <s-button
              variant="secondary"
              onClick={() => {
                window.location.href = `mailto:${supportEmail}`;
              }}
              aria-label={`Email support at ${supportEmail}`}
            >
              Email
            </s-button>

            {/* Knowledge Base button */}
            <s-button
              variant="secondary"
              onClick={() => {
                window.open(knowledgeBaseUrl, "_blank");
              }}
              aria-label="Visit Knowledge Base"
            >
              Knowledge Base
            </s-button>
          </s-stack>

          {/* Technical Support Illustration */}
          <s-box
            padding="base"
            style={{
              textAlign: "center",
              marginTop: "24px"
            }}
          >
            <div style={{
              fontSize: "64px",
              marginBottom: "8px"
            }}>
              🛠️
            </div>
            <s-text color="subdued">Technical Support Team</s-text>
          </s-box>
        </s-box>
      </s-section>

      {/* Footer Links Section */}
      <s-section>
        <s-stack direction="inline" gap="base">
          <s-link href={links.privacyPolicy} target="_blank">
            Privacy Policy
          </s-link>
          <s-link href={links.termsOfService} target="_blank">
            Terms of Service
          </s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(new Error("Support page error"));
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// TODO: Replace mock data with actual query from database
// TODO: Implement Crisp chat widget integration (CHAT_SCRIPT_ID: d170d7db-9b6f-4278-9058-c0216e1daeb7)
// TODO: Add Japanese language support using multipleLanguageSelector hook
// TODO: Add responsive design for mobile/tablet
// TODO: Add loading state for video embed
// TODO: Add video thumbnail/preview before loading
// TODO: Add FAQ accordion section
// TODO: Add search functionality for knowledge base
```

**Step 2: Verify file creation**

Run:
```bash
ls -la app/routes/app.support.tsx
```

Expected: File exists with ~150 lines

---

## Task 2: Add Support Route to Navigation Menu

**Files:**
- Modify: `app/routes/app._index.tsx` (or wherever NavigationMenu is configured)

**Step 1: Find current navigation configuration**

Search for NavigationMenu usage in the codebase to understand how navigation is configured.

**Step 2: Add Support menu item**

Add the Support menu item to the navigation configuration (following the pattern from CLAUDE.md):

```typescript
{
  label: 'Guides & Support',
  destination: '/app/support',
}
```

**Step 3: Verify navigation update**

Run the dev server and verify the Support link appears in the navigation menu.

---

## Task 3: Run Type Checking

**Files:**
- Modified: `app/routes/app.support.tsx`

**Step 1: Run TypeScript type check**

```bash
npm run typecheck
```

Expected output:
- `react-router typegen` runs successfully
- `tsc --noEmit` passes with no errors

**Step 2: Fix any type errors if found**

Common issues to check:
- Missing type annotations
- Incorrect import paths
- Unused variables

---

## Task 4: Run Linting

**Files:**
- Modified: `app/routes/app.support.tsx`

**Step 1: Run ESLint**

```bash
npm run lint
```

Expected: No errors, warnings allowed for initial implementation

**Step 2: Fix linting errors if any**

Fix any ESLint errors reported (accessibility rules, TypeScript rules, etc.)

---

## Task 5: Manual Testing in Browser

**Files:**
- Created: `app/routes/app.support.tsx`

**Step 1: Start development server**

```bash
npm run dev
```

Expected: Server starts at http://localhost:3000

**Step 2: Navigate to Support page**

Open browser and navigate to:
```
http://localhost:3000/app/support
```

**Step 3: Verify UI elements**

Check the following display correctly:
- [ ] Page heading: "Guides & Support"
- [ ] Year End Sale banner (conditional, shows during sale period)
- [ ] Video tutorial section with YouTube embed
- [ ] Support options card with heading
- [ ] Response time text: "We respond within 12 - 24 hours via email"
- [ ] Three buttons: "Chat with us", "Email", "Knowledge Base"
- [ ] Technical support illustration (emoji 🛠️)
- [ ] Footer links: Privacy Policy, Terms of Service

**Step 4: Test button interactions**

- [ ] "Chat with us" - logs to console (for now)
- [ ] "Email" - opens mailto: link
- [ ] "Knowledge Base" - opens external URL in new tab

**Step 5: Verify responsive layout**

Resize browser window to verify:
- Mobile (< 768px): Single column, stacked elements
- Tablet (768px - 1024px): Wider containers
- Desktop (> 1024px): Full layout with max-width 1024px

---

## Task 6: Commit Changes

**Files:**
- Created: `app/routes/app.support.tsx`
- Modified: `app/routes/app._index.tsx` (navigation menu)

**Step 1: Stage files**

```bash
git add app/routes/app.support.tsx app/routes/app._index.tsx
```

**Step 2: Verify staged changes**

```bash
git status
```

Expected: Both files listed under "Changes to be committed"

**Step 3: Create commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add Support screen with video and contact options

- Create /app/support route with Polaris web components
- Add YouTube video embed for tutorial
- Display support contact options (chat, email, knowledge base)
- Include TODO comments for backend integration
- Follow existing screen patterns from plans.tsx and statement.tsx

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

**Step 4: Verify commit**

```bash
git log -1
```

Expected: Commit message shows the feat: commit

---

## Verification Checklist

After completing all tasks, verify:

- [ ] File created at correct path: `app/routes/app.support.tsx`
- [ ] All required imports present
- [ ] Loader function with authentication
- [ ] Mock data defined with TODO comments
- [ ] Year End Sale banner (conditional display)
- [ ] Video tutorial section with responsive iframe
- [ ] Support options card with 3 buttons
- [ ] Footer links section
- [ ] ErrorBoundary exported
- [ ] headers function exported
- [ ] TypeScript typecheck passes
- [ ] ESLint passes
- [ ] Navigation menu includes Support link
- [ ] Manual testing in browser successful
- [ ] Code committed with conventional commit message

---

## UI Specification Reference

This implementation follows the design specification in:
- `docs/ui-ux-design-specification.md` - Section 5: Support Screen (lines 319-365)
- `docs/user-flow-and-screens.md` - Support Screen details

Key design decisions:
- Single-column centered layout (max-width: 1024px)
- Polaris web components for consistency
- Responsive iframe for YouTube embed (16:9 aspect ratio)
- Three support action buttons in inline stack
- Technical support illustration using emoji placeholder
- Footer links matching other screens

---

## Notes for Future Implementation

**TODO items marked in code:**

1. **Crisp Chat Integration**
   - Chat script ID: `d170d7db-9b6f-4278-9058-c0216e1daeb7`
   - Position dynamically adjusted opposite to accessibility widget

2. **Japanese Language Support**
   - Use `multipleLanguageSelector()` hook
   - Translate all UI labels

3. **Backend Integration**
   - Replace mock data with database queries
   - Fetch store settings for support configuration

4. **Enhanced Features**
   - FAQ accordion section
   - Knowledge base search
   - Video thumbnail/preview
   - Loading states for async operations

---

**Plan complete and saved to `docs/plans/2026-03-05-support-screen-ui.md`. Two execution options:**

**1. Subagent-Driven (this session)** - Tôi sẽ dispatch subagent để implement từng task, review giữa các task

**2. Parallel Session (separate)** - Mở session mới với executing-plans skill

**Bạn muốn approach nào?**
