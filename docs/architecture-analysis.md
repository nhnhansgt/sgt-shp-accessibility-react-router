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
| **Shop Mapping** | Direct shop column lookup | Uses `shop` column for queries |
| **Validation** | Zod schemas | Application-layer validation |
| **Authentication** | `authenticate.admin()` | Built into template |
| **UI Components** | Polaris web components | Consistent Shopify look |
| **Billing** | To be implemented later | Future feature |

### Database Schema

**accessibilities table:**
- `shop` column (VarChar 255) - Stores shop domain (e.g., "store.myshopify.com")
- Use `shop` column for direct queries (no FNV-1a hash needed)
- `store_id` column retained for backward compatibility with legacy database
- Use `app_id` + `shop` combination for lookups

---

## 2. Routing Structure (React Router Flat Routes)

```
app/routes/
├── app.tsx                        # App layout with navigation
├── app._index.tsx                 # Entry → redirect to dashboard
├── app.setup.tsx                  # Quick start dashboard
├── app.widgets.tsx                # Widget customization
├── app.statement.tsx              # Statement editor
└── app.support.tsx                # Help & support
```

### Route Flow

```
User installs app
      ↓
OAuth flow (auth.$.tsx)
      ↓
┌─────────────────────────────────────┐
│  app._index.tsx                      │
│                                      │
│  1. Get session.shop                 │
│  2. Get settings (Repository)        │
│  3. Redirect to /app/setup           │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  All Routes                          │
│  (setup, widgets, statement, support)│
│                                      │
│  loader:                             │
│    1. Authenticate                   │
│    2. Get settings (Repository)      │
└─────────────────────────────────────┘
```

### Basic Route Implementation (No Billing)

```typescript
// app/routes/app.widgets.tsx

import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { AccessibilityRepository } from "../repositories/accessibility.repository";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

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
│   └── StatusBanner.tsx        # Accessibility status
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
| **Widgets** | `s-slider`, `s-color-picker`, `s-select`, `s-button-group` |
| **Statement** | Custom editor, `s-button-group` |
| **Support** | iframe for video |
| **Navigation** | `s-app-nav` |

---

## 4. API Design

### REST vs GraphQL

| Use Case | Choice | Rationale |
|----------|--------|-----------|
| **Settings CRUD** | Repository + Prisma | Direct access via shop column |
| **Widget Config** | Repository + Prisma | Direct DB access |
| **Public API** | REST route | No auth, simple endpoint |
| **Billing** | To be implemented | Future feature |

### Data Access Pattern (Repository)

```typescript
// app/repositories/accessibility.repository.ts

import { PrismaClient } from "@prisma/client";

export class AccessibilityRepository {
  constructor(private db: PrismaClient) {}

  async findByShopDomain(shopDomain: string, appId: number) {
    return this.db.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shopDomain,
        deleted_at: null,
      },
    });
  }

  async findOrCreate(shopDomain: string, appId: number) {
    const existing = await this.findByShopDomain(shopDomain, appId);
    if (existing) return existing;

    return this.db.accessibilities.create({
      data: {
        app_id: BigInt(appId),
        shop: shopDomain,
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

> **Note:** Billing functionality has been removed and will be implemented in a future update. All app features are currently accessible without subscription checks.

### Public API Endpoint

```typescript
// app/routes/api.accessibilities.$shop.tsx

import { json } from "react-router";
import { prisma } from "../db.server";
import { getAppIdFromConfig } from "../utils/config";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { shop } = params;

  if (!shop) {
    return json({ error: "Shop parameter required" }, { status: 400 });
  }

  try {
    const appId = getAppIdFromConfig();

    const accessibility = await prisma.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shop,
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
- [x] Add `shop` column to accessibilities table
- [ ] Create `repositories/accessibility.repository.ts`
- [ ] Create `validators/accessibility.validator.ts`
- [ ] Update `app.tsx` with navigation

### Phase 2: Setup Page (Week 1-2)
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

### Shop Domain Queries

```typescript
// Use shop column directly from session
const shopDomain = session.shop; // "store.myshopify.com"

const settings = await prisma.accessibilities.findFirst({
  where: {
    app_id: BigInt(appId),
    shop: shopDomain,
    deleted_at: null,
  },
});
```

> **Note:** The `store_id` column is retained for backward compatibility with legacy databases. New code should use the `shop` column.

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
2. **Public Endpoint**: Rate-limit `api.accessibilities.$shop.tsx`
3. **Input Validation**: Zod schemas for all user inputs
4. **XSS Prevention**: Sanitize HTML in statement editor
5. **CORS**: Restrict for public API endpoint

---

## 10. References

- **Full Database Design**: `docs/database-design.md` - Repository patterns, shop column usage
- **UI/UX Specification**: `docs/ui-ux-design-specification.md` - Polaris components
- **User Flow**: `docs/user-flow-and-screens.md` - Original requirements

---

**Document Version:** 3.0
**Last Updated:** 2026-03-04
**Changes:**
- Removed billing functionality (to be implemented later)
- Added `shop` column to accessibilities table for direct queries
- Removed FNV-1a hash requirement (use shop column directly)
- Repository pattern updated to use shop column
