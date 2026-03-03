# Shopify Accessibility App - Architecture Analysis

**Date:** 2025-03-03
**Author:** Shopify Development Architect
**Scope:** Admin UI only (not theme extension)
**Constraint:** Work with EXISTING database schema (NO schema changes)

---

## 1. Architecture Pattern Recommendation

### Recommended Pattern: Server-First with Repository Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shopify Admin Embedded Iframe                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           React Router App (app.tsx)                     │  │
│  │   ┌──────────────────────────────────────────────────┐   │  │
│  │   │   AppProvider (App Bridge)                        │   │  │
│  │   │   ┌────────────────────────────────────────────┐  │   │  │
│  │   │   │   Dynamic Navigation Menu                   │  │   │  │
│  │   │   │   (billing from GraphQL)                    │  │   │  │
│  │   │   └────────────────────────────────────────────┘  │   │  │
│  │   │                                                    │   │  │
│  │   │   ┌────────────────────────────────────────────┐  │   │  │
│  │   │   │   Route Outlet                             │  │   │  │
│  │   │   │   ┌──────────────────────────────────────┐ │   │  │
│  │   │   │   │  Pages (Plans, Setup, Widgets, etc.)  │ │   │  │
│  │   │   │   └──────────────────────────────────────┘ │   │  │
│  │   │   └────────────────────────────────────────────┘  │   │  │
│  │   └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Server-Side Architecture                        │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Loaders/Actions                                   │  │  │
│  │  │    ↓                                                │  │  │
│  │  │  ┌──────────────────────────────────────────────┐ │  │  │
│  │  │  │  Services (Business Logic)                    │ │  │  │
│  │  │  │  - billing.service.ts                         │ │  │  │
│  │  │  │  - accessibility.service.ts                   │ │  │  │
│  │  │  │     ↓                                          │  │  │
│  │  │  │  ┌──────────────────────────────────────────┐ │ │  │  │
│  │  │  │  │  Repositories (Data Access)              │ │ │  │  │
│  │  │  │  │  - accessibility.repository.ts           │ │ │  │  │
│  │  │  │  │     ↓                                     │ │ │  │  │
│  │  │  │  │  ┌──────────────────────────────────────┐ │ │ │  │  │
│  │  │  │  │  │  Prisma (accessibilities table)     │ │ │ │  │  │
│  │  │  │  │  │  shop → FNV-1a → store_id           │ │ │ │  │  │
│  │  │  │  │  └──────────────────────────────────────┘ │ │ │  │  │
│  │  │  │  └──────────────────────────────────────────┘ │ │  │  │
│  │  │  └──────────────────────────────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Validators (Zod)                                  │  │  │
│  │  │  - accessibility.validator.ts                      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Routing** | React Router flat routes | Template already configured |
| **State Management** | Server state via loaders | Data always fresh from server |
| **Data Access** | Repository pattern | Works with existing `accessibilities` table |
| **Shop Mapping** | FNV-1a hash function | Maps shop domain → `store_id` |
| **Billing** | Shopify GraphQL API | No DB changes needed |
| **Validation** | Zod schemas | Application-layer validation |
| **Authentication** | `authenticate.admin()` | Built into template |
| **UI Components** | Polaris web components | Consistent Shopify look |

### Database Constraint

**⚠️ IMPORTANT: NO SCHEMA CHANGES**

- Work with existing `accessibilities` table only
- Use `app_id` + `store_id` (BigInt, no FK) for lookups
- Use FNV-1a hash to convert shop domain → `store_id`
- Billing status from Shopify GraphQL API, not database

---

## 2. Routing Structure (React Router Flat Routes)

```
app/routes/
├── app.tsx                        # App layout with dynamic navigation
├── app._index.tsx                 # Entry → redirect based on billing
├── app.plans.tsx                  # Plans page (no billing guard)
├── app.setup.tsx                  # Quick start dashboard
├── app.widgets.tsx                # Widget customization
├── app.statement.tsx              # Statement editor
├── app.support.tsx                # Help & support
└── app.ExitIframe.tsx             # Billing redirect handler
```

### Route Flow with Billing Guard

```
User installs app
      ↓
OAuth flow (auth.$.tsx)
      ↓
┌─────────────────────────────────────┐
│  app._index.tsx                      │
│                                      │
│  1. Get session.shop                 │
│  2. hashShopDomain(shop) → store_id  │
│  3. Check billing via GraphQL        │
│                                      │
│  IF !hasActivePlan → /app/plans      │
│  IF hasActivePlan → /app/setup       │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Protected Routes                    │
│  (setup, widgets, statement, support)│
│                                      │
│  loader:                             │
│    1. Authenticate                   │
│    2. Check billing (GraphQL)        │
│    3. If !paid → redirect(/plans)    │
│    4. Get settings (Repository)      │
└─────────────────────────────────────┘
```

### Billing Guard Implementation

```typescript
// app/routes/app.widgets.tsx

import { redirect, json } from "react-router";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.service";
import { AccessibilityRepository } from "../repositories/accessibility.repository";
import { hashShopDomain } from "../utils/hash";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check billing via Shopify GraphQL
  const billingService = new BillingService();
  const billingStatus = await billingService.checkBillingStatus(admin);

  if (!billingStatus.hasActivePlan) {
    return redirect("/app/plans");
  }

  // Get accessibility settings via Repository
  const repository = new AccessibilityRepository(prisma);
  const appId = getAppIdFromConfig();
  const settings = await repository.findByShopDomain(shopDomain, appId);

  return json({
    billingStatus,
    settings: settings ? {
      ...settings,
      options: settings.options ? JSON.parse(settings.options) : {},
    } : null,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Verify billing before allowing updates
  const billingService = new BillingService();
  const billingStatus = await billingService.checkBillingStatus(admin);

  if (!billingStatus.hasActivePlan) {
    return json({ error: "No active subscription" }, { status: 403 });
  }

  // Process form data
  const formData = await request.formData();
  const repository = new AccessibilityRepository(prisma);
  const appId = getAppIdFromConfig();

  // Update settings via Repository
  await repository.updateWidgetSettings(
    session.shop,
    appId,
    {
      icon: formData.get("icon") as string,
      position: formData.get("position") as string,
      options: JSON.parse(formData.get("options") as string),
    }
  );

  return json({ success: true });
};
```

---

## 3. Key Components Needed

### Component Hierarchy

```
app/components/
├── layout/
│   ├── AppLayout.tsx           # Main app wrapper
│   ├── BillingBanner.tsx       # Sale banner (conditional)
│   └── StatusBanner.tsx        # Accessibility status
│
├── plans/
│   ├── PlanCard.tsx            # Pricing card
│   └── PlanGrid.tsx            # Container
│
├── widgets/
│   ├── WidgetPreview.tsx       # Live preview
│   ├── IconSelector.tsx        # Icon grid
│   ├── PositionSelector.tsx    # Position picker
│   ├── SizeSlider.tsx          # Size slider
│   ├── OffsetSliders.tsx       # X/Y offsets
│   ├── ColorPicker.tsx         # Color pickers
│   └── FontSelector.tsx        # Font dropdown
│
├── statement/
│   ├── RichTextEditor.tsx      # WYSIWYG editor
│   └── StatementPreview.tsx    # Preview
│
├── support/
│   ├── VideoEmbed.tsx          # YouTube embed
│   └── SupportCard.tsx         # Chat/email/KB links
│
└── common/
    ├── LoadingSpinner.tsx      # Loading state
    ├── ErrorBanner.tsx         # Error display
    └── SaveButton.tsx          # Save button
```

### Polaris Components Mapping

| Screen | Polaris Components |
|--------|-------------------|
| **All** | `s-page`, `s-section`, `s-button`, `s-paragraph`, `s-link`, `s-stack` |
| **Plans** | `s-card`, `s-badge`, `s-banner` |
| **Widgets** | `s-slider`, `s-color-picker`, `s-select`, `s-button-group` |
| **Statement** | Custom editor, `s-button-group` |
| **Support** | iframe for video |
| **Navigation** | `s-app-nav` |

---

## 4. API Design

### REST vs GraphQL

| Use Case | Choice | Rationale |
|----------|--------|-----------|
| **Billing** | GraphQL (Shopify) | Only option for subscriptions |
| **Settings CRUD** | Repository + Prisma | Works with existing table |
| **Widget Config** | Repository + Prisma | Direct DB access |
| **Public API** | REST route | No auth, simple endpoint |

### Data Access Pattern (Repository)

```typescript
// app/repositories/accessibility.repository.ts

import { PrismaClient } from "@prisma/client";
import { hashShopDomain } from "../utils/hash";

export class AccessibilityRepository {
  constructor(private db: PrismaClient) {}

  async findByShopDomain(shopDomain: string, appId: number) {
    const storeId = hashShopDomain(shopDomain);

    return this.db.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        deleted_at: null,
      },
    });
  }

  async findOrCreate(shopDomain: string, appId: number) {
    const storeId = hashShopDomain(shopDomain);

    const existing = await this.findByShopDomain(shopDomain, appId);
    if (existing) return existing;

    return this.db.accessibilities.create({
      data: {
        app_id: BigInt(appId),
        store_id: storeId,
        status: 0,
        icon: "icon-circle",
        position: "bottom-right",
        options: JSON.stringify(this.getDefaultOptions()),
        statement: this.getDefaultStatement(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updateWidgetSettings(
    shopDomain: string,
    appId: number,
    settings: WidgetSettingsInput
  ) {
    const record = await this.findByShopDomain(shopDomain, appId);
    if (!record) throw new Error("Record not found");

    const updateData: any = { updated_at: new Date() };

    if (settings.icon !== undefined) updateData.icon = settings.icon;
    if (settings.position !== undefined) updateData.position = settings.position;
    if (settings.options !== undefined) updateData.options = JSON.stringify(settings.options);
    if (settings.status !== undefined) updateData.status = settings.status;
    if (settings.statement !== undefined) updateData.statement = settings.statement;

    return this.db.accessibilities.update({
      where: { id: record.id },
      data: updateData,
    });
  }

  private getDefaultOptions() {
    return {
      color: "#ffffff",
      size: "24",
      background_color: "#FA6E0A",
      offsetX: 10,
      offsetY: 10,
      locale: "en",
      theme_bg_color: "#FA6E0A",
      font: "8",
    };
  }

  private getDefaultStatement(): string {
    return `<h1>Accessibility Statement</h1>
      <p>We are committed to ensuring digital accessibility...</p>`;
  }
}
```

### Billing Service (GraphQL)

```typescript
// app/services/billing.service.ts

export interface BillingStatus {
  hasActivePlan: boolean;
  planType?: "monthly" | "annual";
  trialEndsAt?: Date;
  status: "none" | "trial" | "active" | "past_due" | "cancelled";
}

export class BillingService {
  async checkBillingStatus(admin: AdminApiContext): Promise<BillingStatus> {
    const query = `#graphql
      query {
        appInstallation {
          activeSubscriptions {
            ... on AppSubscription {
              id
              status
              createdAt
              name
              trialDays
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();
    const subscriptions = data.data?.appInstallation?.activeSubscriptions || [];

    if (subscriptions.length === 0) {
      return { hasActivePlan: false, status: "none" };
    }

    const sub = subscriptions[0];
    return {
      hasActivePlan: true,
      planType: sub.name?.toLowerCase().includes("annual") ? "annual" : "monthly",
      status: sub.status,
      trialEndsAt: sub.trialDays
        ? new Date(Date.now() + sub.trialDays * 24 * 60 * 60 * 1000)
        : undefined,
    };
  }

  async requestPlan(
    admin: AdminApiContext,
    planType: "monthly" | "annual",
    returnUrl: string
  ): Promise<{ confirmUrl: string | null }> {
    const mutation = `#graphql
      mutation appSubscriptionCreate(
        $name: String!
        $returnUrl: URL!
        $trialDays: Int
        $test: Boolean
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          trialDays: $trialDays
          test: $test
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                price: ${planType === "monthly" ? "{ amount: 6.99, currencyCode: USD }" : "{ amount: 67.2, currencyCode: USD }"}
                interval: ${planType === "monthly" ? "EVERY_30_DAYS" : "ANNUAL"}
              }
            }
          }]
        ) {
          userErrors { field message }
          confirmationUrl
          appSubscription { id status }
        }
      }
    `;

    const response = await admin.graphql(mutation, {
      variables: {
        name: planType === "monthly" ? "Monthly Plan" : "Annual Plan",
        returnUrl,
        trialDays: 14,
        test: true,
      },
    });

    const data = await response.json();
    return { confirmUrl: data.data?.appSubscriptionCreate?.confirmationUrl };
  }
}
```

### FNV-1a Hash Utility

```typescript
// app/utils/hash.ts

/**
 * FNV-1a 64-bit hash function
 * Converts shop domain to store_id for accessibilities table lookup
 */
export function hashShopDomain(shopDomain: string): bigint {
  let hash = 0xcbf29ce484222325n; // FNV offset basis
  const prime = 0x100000001b3n;   // FNV prime

  for (let i = 0; i < shopDomain.length; i++) {
    hash ^= BigInt(shopDomain.charCodeAt(i));
    hash *= prime;
  }

  return hash;
}
```

### Public API Endpoint

```typescript
// app/routes/api.accessibilities.$shop.tsx

import { json } from "react-router";
import { prisma } from "../db.server";
import { hashShopDomain } from "../utils/hash";
import { getAppIdFromConfig } from "../utils/config";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { shop } = params;

  if (!shop) {
    return json({ error: "Shop parameter required" }, { status: 400 });
  }

  try {
    const storeId = hashShopDomain(shop);
    const appId = getAppIdFromConfig();

    const accessibility = await prisma.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        status: 1, // Only enabled widgets
        deleted_at: null,
      },
      select: {
        status: true,
        icon: true,
        position: true,
        options: true,
        statement: true,
      },
    });

    if (!accessibility) {
      return json({ data: null }, { status: 404 });
    }

    return json({
      data: {
        ...accessibility,
        options: accessibility.options ? JSON.parse(accessibility.options) : {},
      },
    });
  } catch (error) {
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
```

---

## 5. Directory Structure (Updated)

```
app/
├── routes.ts                          # Auto-generated
├── root.tsx                           # Root layout
├── entry.server.tsx                   # Server entry
├── shopify.server.ts                  # Shopify config
├── db.server.ts                       # Prisma client
│
├── routes/
│   ├── _index/route.tsx              # Landing
│   ├── auth.$.tsx                    # OAuth
│   ├── webhooks.app.uninstalled.tsx
│   ├── webhooks.app.scopes_update.tsx
│   ├── app.tsx                       # App layout
│   ├── app._index.tsx                # Entry + billing check
│   ├── app.plans.tsx                 # Plans
│   ├── app.setup.tsx                 # Dashboard
│   ├── app.widgets.tsx               # Widget config
│   ├── app.statement.tsx             # Statement editor
│   ├── app.support.tsx               # Help
│   ├── app.ExitIframe.tsx            # Billing redirect
│   └── api.accessibilities.$shop.tsx # Public API
│
├── components/
│   ├── layout/
│   ├── plans/
│   ├── widgets/
│   ├── statement/
│   ├── support/
│   └── common/
│
├── services/                          # Business logic
│   ├── billing.service.ts
│   └── accessibility.service.ts
│
├── repositories/                      # Data access
│   └── accessibility.repository.ts
│
├── validators/                        # Input validation
│   └── accessibility.validator.ts
│
├── utils/
│   ├── hash.ts                       # FNV-1a
│   ├── config.ts                     # App config
│   └── constants.ts                  # Plans, fonts, icons
│
└── types/
    ├── accessibility.ts
    └── billing.ts

prisma/
├── schema.prisma                      # EXISTING (no changes)
└── migrations/

docs/
├── user-flow-and-screens.md
├── architecture-analysis.md           # This document
├── database-design.md
└── ui-ux-design-specification.md
```

---

## 6. Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                               DATA FLOW                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  CLIENT                                            SERVER                  │
│  ┌──────────────────┐                            ┌──────────────────┐      │
│  │   Browser        │                            │   React Router    │      │
│  │                  │    1. Page Load            │     Server        │      │
│  │  ┌────────────┐  │ ─────────────────────────>│  ┌────────────┐  │      │
│  │  │ Component  │  │                            │  │  Loader    │  │      │
│  │  └────────────┘  │                            │  └────────────┘  │      │
│  │         │         │                            │         │         │      │
│  │         │         │  2. Authenticate           │         ▼         │      │
│  │         │         │ <─────────────────────────│  ┌────────────┐  │      │
│  │         │         │                            │  │  Shopify   │  │      │
│  │         │         │  3. Check Billing (GraphQL)│  │   Auth     │  │      │
│  │         │         │ ─────────────────────────>│  └────────────┘  │      │
│  │         │         │                            │         │         │      │
│  │         │         │  4. Billing Status          │         ▼         │      │
│  │         │         │ <─────────────────────────│  ┌────────────┐  │      │
│  │         │         │                            │  │  Billing   │  │      │
│  │         │         │  5. Get Settings            │  │  Service   │  │      │
│  │         │         │ ─────────────────────────>│  └────────────┘  │      │
│  │         │         │                            │         │         │      │
│  │         │         │  6. hashShopDomain(shop)    │         ▼         │      │
│  │         │         │ <─────────────────────────│  ┌────────────┐  │      │
│  │         │         │                            │  │Repository  │  │      │
│  │         │         │  7. Query Database          │  └────────────┘  │      │
│  │         │         │ ─────────────────────────>│         │         │      │
│  │         │         │                            │         ▼         │      │
│  │         │         │  8. Return JSON             │  ┌────────────┐  │      │
│  │         │         │ <─────────────────────────│  │  Prisma    │  │      │
│  │         │         │                            │  │accessibili│  │      │
│  │         │         │  9. Render                  │  │   ties     │  │      │
│  │         │         │ ─────────────────────────>│  └────────────┘  │      │
│  │         ▼         │                            │                   │      │
│  │  ┌────────────┐  │                            │                   │      │
│  │  │   Render   │  │                            │                   │      │
│  │  └────────────┘  │                            │                   │      │
│  │         │         │                            │                   │      │
│  │         │         │  10. User Action (Save)    │                   │      │
│  │         │         │ ─────────────────────────>│                   │      │
│  │         │         │                            │  ┌────────────┐  │      │
│  │         │         │  11. Validate              │  │ Validator  │  │      │
│  │         │         │ <─────────────────────────│  │   (Zod)    │  │      │
│  │         │         │                            │  └────────────┘  │      │
│  │         │         │  12. Repository Update     │         │         │      │
│  │         │         │ ─────────────────────────>│         ▼         │      │
│  │         │         │                            │  ┌────────────┐  │      │
│  │         │         │  13. Success Response       │  │  Prisma    │  │      │
│  │         │         │ <─────────────────────────│  │   Write    │  │      │
│  │         ▼         │                            │  └────────────┘  │      │
│  │  ┌────────────┐  │                            │                   │      │
│  │  │   Show     │  │                            │                   │      │
│  │  │  Success   │  │                            │                   │      │
│  │  └────────────┘  │                            │                   │      │
│  └──────────────────┘                            └──────────────────┘      │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Priorities

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `utils/hash.ts` - FNV-1a function
- [ ] Create `repositories/accessibility.repository.ts`
- [ ] Create `services/billing.service.ts`
- [ ] Create `validators/accessibility.validator.ts`
- [ ] Update `app.tsx` with dynamic navigation

### Phase 2: Plans Page (Week 1-2)
- [ ] Implement `app.plans.tsx` route
- [ ] Create PlanCard component
- [ ] Integrate BillingService with GraphQL
- [ ] Handle subscription confirmation flow

### Phase 3: Setup Page (Week 2)
- [ ] Implement `app.setup.tsx` route
- [ ] Create welcome/onboarding UI
- [ ] Implement status banner
- [ ] Add Crisp chat integration

### Phase 4: Widgets Page (Week 2-3)
- [ ] Implement `app.widgets.tsx` route
- [ ] Create all widget configuration components
- [ ] Implement live preview with CSS custom props
- [ ] Save via Repository

### Phase 5: Statement Page (Week 3)
- [ ] Implement `app.statement.tsx` route
- [ ] Integrate rich text editor
- [ ] Load/save statement via Repository

### Phase 6: Support & Public API (Week 3-4)
- [ ] Implement `app.support.tsx` route
- [ ] Create `api.accessibilities.$shop.tsx` public endpoint
- [ ] Add ExitIframe redirect handler
- [ ] Error handling and testing

---

## 8. Key Technical Considerations

### Embedded App Navigation

```typescript
// ❌ DON'T - Will break iframe
<a href="/app/widgets">Widgets</a>

// ✅ DO - Preserves iframe context
<Link to="/app/widgets">Widgets</Link>

// ✅ DO - Polaris link
<s-link href="/app/widgets">Widgets</s-link>
```

### Billing Check (Server-Side Only)

```typescript
// ❌ DON'T - Can be spoofed
const isPaid = localStorage.getItem("isPaid");

// ✅ DO - Verified via GraphQL
const billingStatus = await billingService.checkBillingStatus(admin);
if (!billingStatus.hasActivePlan) {
  return redirect("/app/plans");
}
```

### Shop Domain to store_id Mapping

```typescript
// Always use hash function
import { hashShopDomain } from "~/utils/hash";

const storeId = hashShopDomain(session.shop); // "store.myshopify.com" → BigInt

const settings = await prisma.accessibilities.findFirst({
  where: {
    app_id: BigInt(appId),
    store_id: storeId,
    deleted_at: null,
  },
});
```

### Widget Preview (CSS Custom Properties)

```typescript
const WidgetPreview = ({ settings }) => (
  <div
    style={{
      "--widget-color": settings.options.color,
      "--widget-bg": settings.options.background_color,
      "--widget-size": `${settings.options.size}px`,
      "--widget-offset-x": `${settings.options.offsetX}px`,
      "--widget-offset-y": `${settings.options.offsetY}px`,
    } as React.CSSProperties}
  >
    <WidgetIcon />
  </div>
);
```

---

## 9. Security Considerations

1. **Authentication**: All `/app/*` routes use `authenticate.admin(request)`
2. **Billing Verification**: Check subscription via GraphQL before feature access
3. **Public Endpoint**: Rate-limit `api.accessibilities.$shop.tsx`
4. **Input Validation**: Zod schemas for all user inputs
5. **XSS Prevention**: Sanitize HTML in statement editor
6. **CORS**: Restrict for public API endpoint

---

## 10. References

- **Full Database Design**: `docs/database-design.md` - Repository patterns, FNV-1a details
- **UI/UX Specification**: `docs/ui-ux-design-specification.md` - Polaris components
- **User Flow**: `docs/user-flow-and-screens.md` - Original requirements

---

**Document Version:** 2.0
**Last Updated:** 2025-03-03
**Changes:** Updated to work with existing schema (no Store model, use FNV-1a hash, Repository pattern)
