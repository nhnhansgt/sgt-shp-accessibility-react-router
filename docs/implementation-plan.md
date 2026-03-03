# Shopify Accessibility Admin App - Implementation Plan

> **Document Version:** 2.0
> **Date:** 2026-03-03
> **Status:** Ready for Implementation
> **Scope:** Admin UI only (NOT theme extension)
> **Billing Strategy:** Implement LAST (development mode first)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Critical Constraints](#critical-constraints)
3. [Architecture Overview](#architecture-overview)
4. [Directory Structure](#directory-structure)
5. [Task Breakdown](#task-breakdown)
6. [Component Inventory](#component-inventory)
7. [API Design](#api-design)
8. [Database Design](#database-design)
9. [Critical Considerations](#critical-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Timeline](#implementation-timeline)

---

## Project Overview

### Objective

Clone the Shopify Accessibility App admin interface using modern tech stack based on the requirements documented in `user-flow-and-screens.md`.

### Tech Stack

- **Framework:** React Router (flat routes)
- **UI Library:** Polaris Web Components (`<s-page>`, `<s-button>`, etc.)
- **Database:** Prisma with MySQL (existing schema)
- **Authentication:** Shopify Admin API (token-based)
- **State Management:** Server loaders + useFetcher (no complex client state)
- **API:** REST for settings, GraphQL for billing

### Screens to Build

1. **Plans** (`/app/plans`) - Billing plan selection
2. **Setup** (`/app/setup`) - Welcome dashboard
3. **Widgets** (`/app/widgets`) - Widget customization
4. **Statement** (`/app/statement`) - Accessibility statement editor
5. **Support** (`/app/support`) - Help resources
6. **ExitIframe** (`/app/ExitIframe`) - Billing redirect handler

---

## Critical Constraints

### ⚠️ MUST NOT DO

- ❌ **DO NOT edit database schema** - Work with existing `accessibilities` table only
- ❌ **DO NOT add new models** (Store, Subscription, AuditLog, etc.)
- ❌ **DO NOT add foreign keys** to existing tables
- ❌ **DO NOT change relationships** between tables
- ❌ **DO NOT build theme extension** - Admin UI only

### ✅ MUST DO

- ✅ Keep existing `Session` model for Shopify auth
- ✅ Work with `accessibilities` table as-is
- ✅ Use FNV-1a hash for shop domain → store_id mapping
- ✅ Implement validation at application layer (Zod schemas)
- ✅ Use repository pattern for data access
- ✅ Handle billing via Shopify GraphQL API

---

## Architecture Overview

### Architecture Pattern

**Server-First with Prisma + React Router**

```
┌─────────────────────────────────────────────────────────┐
│                    Shopify Admin                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Our App (Embedded Iframe)               │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         Polaris Web Components               │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │     React Router Routes               │  │  │  │
│  │  │  │  (Loaders → Server → Database)        │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
  Shopify Admin API                      Prisma + MySQL
  (GraphQL for billing)                  (accessibilities table)
```

### Authentication Flow

**Development Mode (Billing not yet implemented):**
```
User installs app
    ↓
Shopify OAuth
    ↓
Token stored in Session model
    ↓
DEV_MODE=true → Skip billing check
    ↓
Redirect to /app/setup (main dashboard)
```

**Production Mode (After billing implemented):**
```
User installs app
    ↓
Shopify OAuth
    ↓
Token stored in Session model
    ↓
Check billing status (Shopify GraphQL API)
    ↓
    ├─ No plan → /app/plans
    └─ Has plan → /app/setup (main dashboard)
```

### Billing Guard Pattern

**Development Mode (Before billing implementation):**
```typescript
export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  // Skip billing check in dev mode
  if (process.env.DEV_MODE !== 'true') {
    const billingCheck = await checkBillingStatus(admin, session.shop);

    if (!billingCheck.hasActiveSubscription) {
      return redirect("/app/plans");
    }
  }

  return { settings: await getAccessibilitySettings(session.shop) };
};
```

**Production Mode (After billing implementation):**
```typescript
export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  // Check billing via Shopify GraphQL API
  const billingCheck = await checkBillingStatus(admin, session.shop);

  if (!billingCheck.hasActiveSubscription) {
    return redirect("/app/plans");
  }

  return { settings: await getAccessibilitySettings(session.shop) };
};
```

---

## Directory Structure

```
app/
├── routes/                          # React Router flat routes
│   ├── app.tsx                     # App layout with dynamic navigation
│   ├── app._index.tsx              # Entry point + billing redirect
│   ├── app.plans.tsx               # Plans page (no billing guard)
│   ├── app.setup.tsx               # Quick start dashboard
│   ├── app.widgets.tsx             # Widget customization
│   ├── app.statement.tsx           # Statement editor
│   ├── app.support.tsx             # Help & support
│   └── app.ExitIframe.tsx          # Billing redirect handler
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           # Main layout wrapper
│   │   ├── BillingBanner.tsx       # Year end sale banner
│   │   └── StatusBanner.tsx        # Widget status indicator
│   │
│   ├── plans/
│   │   ├── PlanCard.tsx            # Single plan card
│   │   ├── PlanGrid.tsx            # Grid of plans
│   │   └── PlanComparison.tsx      # Feature comparison
│   │
│   ├── widgets/
│   │   ├── WidgetPreview.tsx       # Live widget preview
│   │   ├── IconSelector.tsx        # Icon selection grid
│   │   ├── PositionSelector.tsx    # Position selector (4 options)
│   │   ├── SizeSlider.tsx          # Size control (24-50px)
│   │   ├── OffsetSliders.tsx       # X/Y offset controls
│   │   ├── ColorPicker.tsx         # Icon & background colors
│   │   └── FontSelector.tsx        # Font selection dropdown
│   │
│   ├── statement/
│   │   ├── RichTextEditor.tsx      # Draft.js-based editor
│   │   ├── EditorToolbar.tsx       # Bold, italic, lists, links
│   │   └── StatementPreview.tsx    # Preview of statement
│   │
│   ├── support/
│   │   ├── VideoEmbed.tsx          # YouTube video embed
│   │   ├── SupportCard.tsx         # Chat, email, KB links
│   │   └── HelpModal.tsx           # Auto-sliding help popup
│   │
│   └── common/
│       ├── LoadingSpinner.tsx      # Consistent loading states
│       ├── ErrorBanner.tsx         # Error display
│       ├── SaveButton.tsx          # Save button with loading state
│       └── Toast.tsx               # Success/error notifications
│
├── models/
│   ├── accessibility.server.ts     # Accessibility CRUD operations
│   ├── store.server.ts             # Store queries (via accessibilities)
│   └── billing.server.ts           # Billing API operations
│
├── utils/
│   ├── billing.ts                  # Shopify billing API helpers
│   ├── settings.ts                 # Settings CRUD helpers
│   ├── validators.ts               # Zod validation schemas
│   ├── hash.ts                     # FNV-1a hash for shop mapping
│   └── constants.ts                # Plans, fonts, icons, colors
│
├── types/
│   ├── accessibility.ts            # TypeScript types for settings
│   ├── billing.ts                  # Billing types
│   └── api.ts                      # API request/response types
│
├── shopify.server.ts               # Shopify app config (existing)
└── db.server.ts                    # Prisma client (existing)
```

---

## Task Breakdown

### Phase 1: Infrastructure & Setup (Week 1, Days 1-2)

#### Step 1.1: Project Setup
- [ ] Review existing codebase structure
- [ ] Verify Shopify CLI configuration
- [ ] Test database connection
- [ ] Verify Polaris web components are available
- [ ] Set up TypeScript path aliases (if needed)

#### Step 1.2: Database Utilities
- [ ] Implement `utils/hash.ts` - FNV-1a hash function for shop → store_id
- [ ] Create `models/accessibility.server.ts` - Repository pattern
- [ ] Add Zod validation schemas in `utils/validators.ts`
- [ ] Create TypeScript types in `types/accessibility.ts`
- [ ] Add indexes for performance (non-breaking):
  ```sql
  CREATE INDEX idx_accessibilities_app_store ON accessibilities(app_id, store_id);
  CREATE INDEX idx_accessibilities_deleted_at ON accessibilities(deleted_at);
  CREATE INDEX idx_accessibilities_status ON accessibilities(status);
  ```

#### Step 1.3: Authentication Setup (Dev Mode)
- [ ] Implement basic Shopify OAuth flow
- [ ] Add session management with existing `Session` model
- [ ] Create dev mode flag (`DEV_MODE=true` in `.env`)
- [ ] Add billing guard with dev mode bypass
- [ ] Test OAuth flow without billing

**Deliverable:** Working authentication in dev mode

---

### Phase 2: Core Layout & Navigation (Week 1, Days 3-4)

#### Step 2.1: App Layout
- [ ] Create `routes/app.tsx` - Main layout with dynamic navigation
- [ ] Implement `components/layout/AppLayout.tsx`
- [ ] Add conditional navigation menu (paid vs. unpaid)
- [ ] Add error boundaries to all routes
- [ ] Add loading states

#### Step 2.2: Routing Setup
- [ ] Create `routes/app._index.tsx` - Entry point with billing redirect
- [ ] Create `routes/app.ExitIframe.tsx` - Billing redirect handler
- [ ] Test OAuth flow
- [ ] Test billing redirect flow

#### Step 2.3: Shared Components
- [ ] Create `components/layout/BillingBanner.tsx` - Year end sale banner
- [ ] Create `components/layout/StatusBanner.tsx` - Widget status indicator
- [ ] Create `components/common/LoadingSpinner.tsx`
- [ ] Create `components/common/ErrorBanner.tsx`
- [ ] Create `components/common/SaveButton.tsx`
- [ ] Create `components/common/Toast.tsx`

**Deliverable:** Working layout with navigation and shared components

---

### Phase 3: Setup/Dashboard Page (Week 1, Days 3-4)

#### Step 3.1: Setup Components
- [ ] Create welcome card with 5-step guide
- [ ] Create support card (chat, email, KB links)
- [ ] Create help modal with auto-sliding content
- [ ] Add links to Shopify Theme Editor

#### Step 3.2: Setup Route
- [ ] Create `routes/app.setup.tsx`
- [ ] Implement loader (fetch store + settings)
- [ ] Add billing guard
- [ ] Implement language selector
- [ ] Add first-visit modal logic
- [ ] Test all links and actions

**Deliverable:** Working setup dashboard with all features

---

### Phase 4: Widgets Page (Week 1, Days 5-7)

#### Step 4.1: Widget Components
- [ ] Create `components/widgets/WidgetPreview.tsx` - Live preview
- [ ] Create `components/widgets/IconSelector.tsx` - Grid with keyboard nav
- [ ] Create `components/widgets/PositionSelector.tsx` - 4 positions
- [ ] Create `components/widgets/SizeSlider.tsx` - 24-50px range
- [ ] Create `components/widgets/OffsetSliders.tsx` - X/Y offset
- [ ] Create `components/widgets/ColorPicker.tsx` - Icon + BG colors
- [ ] Create `components/widgets/FontSelector.tsx` - 11 fonts

#### Step 4.2: Widget Customization Logic
- [ ] Implement CSS custom props for real-time preview
- [ ] Add form state management
- [ ] Add validation (size range, offset limits, etc.)
- [ ] Add save functionality with optimistic updates

#### Step 4.3: Widgets Route
- [ ] Create `routes/app.widgets.tsx`
- [ ] Implement loader (fetch current settings)
- [ ] Implement action (save settings)
- [ ] Add 2-column layout (settings + preview)
- [ ] Add "Save" button with loading state
- [ ] Test all customization options

**Deliverable:** Working widgets page with live preview

---

### Phase 5: Statement Page (Week 2, Days 1-2)

#### Step 5.1: Rich Text Editor
- [ ] Choose editor: Draft.js or modern alternative (TipTap/Quill)
- [ ] Create `components/statement/RichTextEditor.tsx`
- [ ] Create `components/statement/EditorToolbar.tsx`
- [ ] Add features: Bold, Italic, Underline, Lists, Links, Images
- [ ] Implement HTML sanitization (DOMPurify)

#### Step 5.2: Statement Route
- [ ] Create `routes/app.statement.tsx`
- [ ] Implement loader (fetch current statement)
- [ ] Implement action (save statement)
- [ ] Add default statement template
- [ ] Add "Reset to default" button
- [ ] Add preview mode
- [ ] Test HTML sanitization

**Deliverable:** Working statement editor with rich text

---

### Phase 6: Support Page (Week 2, Days 3-4)

#### Step 6.1: Support Components
- [ ] Create `components/support/VideoEmbed.tsx` - YouTube embed
- [ ] Create `components/support/SupportCard.tsx` - Chat, email, KB
- [ ] Add Crisp chat integration (or defer to later)
- [ ] Add external links to KB

#### Step 6.2: Support Route
- [ ] Create `routes/app.support.tsx`
- [ ] Implement loader (auth check only)
- [ ] Add video embed
- [ ] Add support options card
- [ ] Test all external links

**Deliverable:** Working support page with help resources

---

### Phase 7: Polish & Testing (Week 2, Days 4-5 + Week 3, Day 1)

#### Step 7.1: Testing
- [ ] Test all routes in development
- [ ] Test on mobile browsers
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Performance audit (Lighthouse)
- [ ] Test all CRUD operations (widgets, statement)

#### Step 7.2: Bug Fixes
- [ ] Fix reported bugs from testing
- [ ] Add error handling improvements
- [ ] Add loading states for all async operations
- [ ] Add toast notifications for user feedback

#### Step 7.3: Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Document API endpoints (if public)
- [ ] Create deployment checklist

#### Step 7.4: Deployment
- [ ] Deploy to production
- [ ] Test in production Shopify app
- [ ] Monitor for errors
- [ ] Set up error tracking (Sentry, etc.)

**Deliverable:** Working app without billing (dev mode ready)

---

### Phase 8: Billing Implementation (Week 3, Days 2-4) ⭐ **FINAL PHASE**

#### Step 8.1: Billing Infrastructure
- [ ] Implement `utils/billing.ts` - Shopify GraphQL billing helpers
- [ ] Create `models/billing.server.ts` - Billing check & subscription
- [ ] Add `checkBillingStatus()` function (queries Shopify GraphQL API)
- [ ] Add `createSubscription()` function (appSubscriptionCreate mutation)
- [ ] Add `cancelSubscription()` function
- [ ] Add `handleBillingConfirmation()` helper
- [ ] Test billing flow with Shopify test mode

#### Step 8.2: Plans Components
- [ ] Create `components/plans/PlanCard.tsx`
- [ ] Create `components/plans/PlanGrid.tsx`
- [ ] Add plan data to `utils/constants.ts`
- [ ] Implement plan comparison features

#### Step 8.3: Plans Route
- [ ] Create `routes/app.plans.tsx`
- [ ] Implement loader (fetch billing status from Shopify)
- [ ] Implement action (subscribe to plan)
- [ ] Add loading states for subscription
- [ ] Handle billing confirmation URL
- [ ] Add `routes/app.ExitIframe.tsx` - Billing redirect handler
- [ ] Test plan subscription flow (test mode)

#### Step 8.4: Billing Guard Integration
- [ ] Update all protected routes to check billing (remove `DEV_MODE` bypass)
- [ ] Add subscription status to navigation menu
- [ ] Show "Upgrade" prompts for free tier users (if applicable)
- [ ] Handle subscription expiry/cancellation
- [ ] Add webhook handler for subscription updates (optional)

#### Step 8.5: Testing & Launch
- [ ] Test full billing flow in Shopify test environment
- [ ] Test plan upgrade/downgrade
- [ ] Test trial period expiration
- [ ] Test billing failure scenarios
- [ ] Deploy to production
- [ ] Monitor billing webhooks
- [ ] Set up error tracking for billing issues

**Deliverable:** Production-ready app with full billing integration

---

## Component Inventory

### Layout Components

| Component | Props | Polaris Components Used |
|-----------|-------|------------------------|
| `AppLayout` | `children` | `<s-page>`, `<s-navigation>` |
| `BillingBanner` | `isSalePeriod` | `<s-banner>`, `<s-button>` |
| `StatusBanner` | `isEnabled`, `themeEditorUrl` | `<s-banner>`, `<s-link>` |

### Plans Page Components

| Component | Props | Description |
|-----------|-------|-------------|
| `PlanCard` | `plan`, `currentPlan`, `onSelect` | Single plan with features |
| `PlanGrid` | `plans`, `currentPlan`, `onSelect` | Grid of plan cards |
| `PlanComparison` | `plans` | Feature comparison table |

**Plan Data Structure:**
```typescript
interface Plan {
  id: 'monthly' | 'annual' | 'year_end_sale_monthly' | 'year_end_sale_annual';
  name: string;
  price: number;
  interval: 'month' | 'year';
  trialDays: number;
  features: string[];
  isHighlighted: boolean;
}
```

### Widgets Page Components

| Component | Props | Description |
|-----------|-------|-------------|
| `WidgetPreview` | `settings` | Live widget preview |
| `IconSelector` | `icons`, `selected`, `onSelect` | Grid with keyboard nav |
| `PositionSelector` | `positions`, `selected`, `onSelect` | 4 positions |
| `SizeSlider` | `min`, `max`, `value`, `onChange` | Size slider (24-50px) |
| `OffsetSliders` | `x`, `y`, `max`, `onChange` | X/Y offset controls |
| `ColorPicker` | `label`, `value`, `onChange` | Color input |
| `FontSelector` | `fonts`, `selected`, `onSelect` | Dropdown with 11 fonts |

**Widget Settings Structure:**
```typescript
interface WidgetSettings {
  icon: string;              // 'icon-circle', 'icon-wheelchair', etc.
  position: string;          // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  size: number;              // 24-50 (px)
  offsetX: number;           // 0-100 (px)
  offsetY: number;           // 0-100 (px)
  color: string;             // hex color
  backgroundColor: string;   // hex color
  themeBackgroundColor: string; // hex color
  font: string;              // '0'-'10' (font ID)
}
```

### Statement Page Components

| Component | Props | Description |
|-----------|-------|-------------|
| `RichTextEditor` | `value`, `onChange`, `onSave` | Draft.js/TipTap editor |
| `EditorToolbar` | `onAction` | Bold, italic, lists, links |
| `StatementPreview` | `html` | Rendered preview |

**Rich Text Features:**
- Bold, Italic, Underline
- Ordered/Unordered Lists
- Text Alignment
- Link Insertion
- Image Insertion (optional for MVP)

### Support Page Components

| Component | Props | Description |
|-----------|-------|-------------|
| `VideoEmbed` | `videoId`, `title` | YouTube embed |
| `SupportCard` | `onChat`, `onEmail`, `onKB` | Chat, email, KB links |
| `HelpModal` | `isOpen`, `onClose`, `slides` | Auto-sliding modal |

### Common Components

| Component | Props | Description |
|-----------|-------|-------------|
| `LoadingSpinner` | `size` | Consistent loading UI |
| `ErrorBanner` | `message`, `onDismiss` | Error display |
| `SaveButton` | `onClick`, `isLoading`, `disabled` | Save with loading state |
| `Toast` | `message`, `type` | Success/error notifications |

---

## API Design

### REST API (Settings & Configuration)

#### GET /app/api/store

Fetch store information and accessibility settings.

**Authentication:** Required (Shopify session)

**Query Parameters:**
- `shop` - Shop domain
- `host` - Shopify host parameter

**Response:**
```json
{
  "data": {
    "id": 1,
    "shop_url": "example.myshopify.com",
    "name": "Example Store",
    "contact_email": "owner@example.com",
    "paid": "annual",
    "accessibility": {
      "status": 1,
      "icon": "icon-circle",
      "position": "bottom-right",
      "options": {
        "color": "#ffffff",
        "size": "24",
        "background_color": "#FA6E0A",
        "offsetX": 10,
        "offsetY": 10,
        "locale": "en",
        "theme_bg_color": "#FA6E0A",
        "font": "8"
      },
      "statement": "<html>...</html>"
    }
  }
}
```

#### POST /app/api/store

Update accessibility settings.

**Authentication:** Required (Shopify session)

**Request Body:**
```json
{
  "icon": "icon-circle",
  "position": "bottom-right",
  "options": {
    "color": "#ffffff",
    "size": "24",
    "background_color": "#FA6E0A",
    "offsetX": 10,
    "offsetY": 10,
    "locale": "en",
    "theme_bg_color": "#FA6E0A",
    "font": "8"
  },
  "statement": "<html>...</html>"
}
```

**Response:** Updated store data (same format as GET)

#### GET /app/api/public/accessibilities/{shop}

Public endpoint for theme extension to fetch settings.

**Authentication:** Not required (CORS-enabled)

**URL Parameter:**
- `shop` - Shop domain

**Response:**
```json
{
  "status": 1,
  "icon": "icon-circle",
  "position": "bottom-right",
  "options": { ... },
  "statement": "<html>...</html>"
}
```

### GraphQL API (Billing via Shopify)

#### appSubscriptionCreate Mutation

```graphql
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
    appRecurringPricingDetails: {
      price: { amount: 6.99, currencyCode: USD }
      interval: MONTHLY
    }
  ) {
    appSubscription {
      id
      status
    }
    confirmationUrl
    userErrors {
      field
      message
    }
  }
}
```

#### appSubscriptionLineItem Update

```graphql
mutation appSubscriptionLineItemUpdate(
  $id: ID!
  $quantity: Int
) {
  appSubscriptionLineItemUpdate(
    id: $id
    quantity: $quantity
  ) {
    appSubscription {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## Database Design

### Existing Schema (Must Not Change)

```prisma
model accessibilities {
  id         BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  deleted_at DateTime? @db.Timestamp(0)
  created_at DateTime? @db.Timestamp(0)
  updated_at DateTime? @db.Timestamp(0)
  status     Int       @default(0) @db.TinyInt
  icon       String?   @db.LongText
  position   String?   @db.VarChar(256)
  options    String?   @db.LongText  // JSON string
  statement  String?   @db.LongText  // HTML
  app_id     BigInt?
  store_id   BigInt?
}

model Session {
  id                   String    @id
  shop                 String
  state                String
  isOnline             Boolean   @default(false)
  scope                String?
  expires              DateTime?
  accessToken          String    @db.Text
  // ... other fields
}
```

### Shop Domain Mapping

Use FNV-1a hash to map shop domain → store_id:

```typescript
function getStoreIdFromShopDomain(shopDomain: string): bigint {
  let hash = 0xcbf29ce484222325n; // FNV-1a 64-bit offset basis
  const prime = 0x100000001b3n;    // FNV-1a 64-bit prime

  for (let i = 0; i < shopDomain.length; i++) {
    hash ^= BigInt(shopDomain.charCodeAt(i));
    hash *= prime;
    hash &= 0xffffffffffffffffn; // Ensure 64-bit
  }

  return hash;
}
```

### Repository Pattern

```typescript
// models/accessibility.server.ts

export const accessibilityRepository = {
  async findByShopDomain(shopDomain: string, appId: number) {
    const storeId = getStoreIdFromShopDomain(shopDomain);

    return prisma.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        deleted_at: null
      }
    });
  },

  async findOrCreate(shopDomain: string, appId: number) {
    const storeId = getStoreIdFromShopDomain(shopDomain);

    let settings = await this.findByShopDomain(shopDomain, appId);

    if (!settings) {
      settings = await prisma.accessibilities.create({
        data: {
          app_id: BigInt(appId),
          store_id: storeId,
          status: 0,
          options: JSON.stringify(defaultOptions),
          statement: defaultStatement
        }
      });
    }

    return settings;
  },

  async updateWidgetSettings(shopDomain: string, appId: number, settings: WidgetSettings) {
    const storeId = getStoreIdFromShopDomain(shopDomain);

    return prisma.accessibilities.updateMany({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        deleted_at: null
      },
      data: {
        icon: settings.icon,
        position: settings.position,
        options: JSON.stringify({
          color: settings.color,
          size: settings.size.toString(),
          background_color: settings.backgroundColor,
          offsetX: settings.offsetX,
          offsetY: settings.offsetY,
          locale: settings.locale || 'en',
          theme_bg_color: settings.themeBackgroundColor,
          font: settings.font
        }),
        updated_at: new Date()
      }
    });
  },

  async updateStatement(shopDomain: string, appId: number, html: string) {
    const storeId = getStoreIdFromShopDomain(shopDomain);

    return prisma.accessibilities.updateMany({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        deleted_at: null
      },
      data: {
        statement: html,
        updated_at: new Date()
      }
    });
  },

  async setStatus(shopDomain: string, appId: number, status: 0 | 1) {
    const storeId = getStoreIdFromShopDomain(shopDomain);

    return prisma.accessibilities.updateMany({
      where: {
        app_id: BigInt(appId),
        store_id: storeId,
        deleted_at: null
      },
      data: {
        status,
        updated_at: new Date()
      }
    });
  }
};
```

### Validation (Application Layer)

```typescript
// utils/validators.ts

import { z } from 'zod';

export const widgetSettingsSchema = z.object({
  icon: z.enum([
    'icon-circle', 'icon-wheelchair', 'icon-eye', 'icon-universal',
    // ... all icon options
  ]),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  size: z.number().min(24).max(50),
  offsetX: z.number().min(0).max(100),
  offsetY: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  themeBackgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  font: z.string().regex(/^[0-9]$/), // 0-10
  locale: z.enum(['en', 'jp']).default('en')
});

export const statementSchema = z.object({
  statement: z.string().max(100000) // 100KB limit
});
```

---

## Critical Considerations

### Development Mode Strategy

**Why implement billing LAST?**
1. **Focus on core features first** - Build and test all UI/UX without billing complexity
2. **Faster iteration** - Don't need to deal with billing API during development
3. **Easier testing** - Can test full app flow without subscription checks
4. **Billing is critical path** - Implement once at the end with proper testing

**Development Mode Setup:**
```bash
# .env
DEV_MODE=true  # Skip billing checks
```

**Development vs Production Flow:**

| Phase | Development Mode | Production Mode |
|-------|-----------------|-----------------|
| **Auth** | OAuth + skip billing | OAuth + check billing |
| **Navigation** | Show all menu items | Show/hide based on subscription |
| **Routes** | No billing guard | Billing guard on all routes |
| **Plans Page** | Hidden/accessible for testing | Required for unpaid users |

**Removing Dev Mode:**
When Phase 8 (Billing) is complete:
1. Remove `DEV_MODE` flag from `.env`
2. Update billing guards to remove dev mode bypass
3. Test full billing flow
4. Deploy to production

### Security Considerations

1. **HTML Injection (Statement Content)**
   - Use DOMPurify to sanitize all HTML before saving
   - Validate against XSS attacks
   - Consider disallowing `<script>` tags entirely

2. **Public Endpoint Abuse**
   - `/app/api/public/accessibilities/{shop}` can be DDoS'd
   - Add rate limiting (e.g., 100 req/min per IP)
   - Cache with CDN (Cloudflare)
   - Add CORS restrictions

3. **Billing Bypass**
   - Always check billing status server-side
   - Never rely on client-side checks
   - Verify subscription with Shopify GraphQL API on each request

4. **OAuth State Mismatch**
   - Verify state parameter strictly
   - Use crypto-random state tokens
   - Short expiration (5-10 minutes)

### Performance Considerations

1. **Widget Preview Performance**
   - Use CSS custom properties for instant updates
   - Debounce save operations (500ms)
   - Use optimistic UI updates

2. **Font Loading**
   - 11 fonts can be heavy → lazy load selected font only
   - Use font-display: swap
   - Consider reducing to 3-5 popular fonts for MVP

3. **Rich Text Editor**
   - Draft.js is deprecated → consider TipTap or Quill
   - Lazy load editor component
   - Add loading state

4. **Database Queries**
   - Add indexes for common queries
   - Use connection pooling
   - Cache frequently accessed data

### UX Considerations

1. **Billing Flow**
   - Clear messaging during trial vs. paid
   - Handle failed payments gracefully
   - Show next steps clearly

2. **Widget Preview**
   - Preview should match storefront exactly
   - Consider opening storefront in new tab for accurate preview
   - Or use sandboxed iframe

3. **Mobile Responsiveness**
   - Test all screens on mobile
   - Widget customization needs 2-column layout → stack on mobile
   - Icon selector grid needs responsive columns

4. **Accessibility (Irony Check)**
   - This IS an accessibility app → must be accessible!
   - Full keyboard navigation
   - Screen reader support
   - ARIA labels everywhere
   - Focus management

---

## Testing Strategy

### Unit Tests

- [ ] Repository methods (`accessibility.server.ts`)
- [ ] Hash function (`utils/hash.ts`)
- [ ] Validation schemas (`utils/validators.ts`)
- [ ] Billing helpers (`utils/billing.ts`)

### Integration Tests

- [ ] Authentication flow (OAuth)
- [ ] Settings CRUD operations
- [ ] Widget settings save/load
- [ ] Statement save/load
- [ ] **[Phase 8]** Billing flow (subscription creation)

### E2E Tests

- [ ] Full installation flow
- [ ] Widget customization
- [ ] Statement editing
- [ ] Navigation between pages
- [ ] **[Phase 8]** Plan selection and subscription

### Manual Testing Checklist

#### Authentication
- [ ] Can install app from Shopify App Store
- [ ] OAuth flow completes successfully
- [ ] Session is created correctly
- [ ] Can access admin panel

#### Billing
- [ ] Redirected to /app/plans if no subscription
- [ ] Can select plan and complete subscription
- [ ] Billing confirmation URL works
- [ ] Can upgrade/downgrade plans
- [ ] Trial period is enforced

#### Widgets
- [ ] Can customize icon
- [ ] Can change position
- [ ] Can adjust size
- [ ] Can change colors
- [ ] Can select font
- [ ] Preview updates in real-time
- [ ] Save button shows loading state
- [ ] Settings persist after page reload

#### Statement
- [ ] Can edit statement in rich text editor
- [ ] All formatting tools work
- [ ] Can insert links
- [ ] Can reset to default
- [ ] HTML is sanitized
- [ ] Statement persists

#### Support
- [ ] Video embed plays
- [ ] Support links work
- [ ] Email link opens mail client
- [ ] Chat widget loads (if implemented)

#### Billing **[Phase 8 Only]**
- [ ] Redirected to /app/plans if no subscription
- [ ] Can select plan and complete subscription
- [ ] Billing confirmation URL works
- [ ] Can upgrade/downgrade plans
- [ ] Trial period is enforced

### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader (NVDA, JAWS, VoiceOver)
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Form labels associated

---

## Implementation Timeline

### Week 1

| Days | Tasks | Deliverable |
|------|-------|-------------|
| 1-2 | Infrastructure & Setup | Auth (dev mode), database utilities |
| 3-4 | Layout & Navigation | App layout, routing, shared components |
| 3-4 | Setup/Dashboard Page | Dashboard with all features |
| 5-7 | Widgets Page | Full widget customization with preview |

### Week 2

| Days | Tasks | Deliverable |
|------|-------|-------------|
| 1-2 | Statement Page | Rich text editor for statement |
| 3-4 | Support Page | Help resources and video embed |
| 4-5 + Week 3 Day 1 | Polish & Testing | Bug fixes, testing (without billing) |

### Week 3

| Days | Tasks | Deliverable |
|------|-------|-------------|
| 2-4 | **Billing Implementation** ⭐ | Plans page, billing guard, production launch |

**Total:** 3 weeks (15 working days)
**Note:** Phase 8 (Billing) is the FINAL phase after all other features are complete

---

## Appendix

### Related Documents

- `user-flow-and-screens.md` - Original requirements
- `docs/architecture-analysis.md` - Detailed architecture analysis
- `docs/ui-ux-design-specification.md` - UI/UX specifications
- `docs/database-design.md` - Database design (existing schema)

### Constants

#### Widget Icons
```typescript
const WIDGET_ICONS = [
  'icon-circle', 'icon-wheelchair', 'icon-eye', 'icon-universal',
  'icon-accessibility', 'icon-hand', 'icon-hearing', 'icon-visible'
];
```

#### Widget Positions
```typescript
const WIDGET_POSITIONS = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right'
];
```

#### Fonts
```typescript
const FONTS = [
  { id: '0', name: 'Lobster' },
  { id: '1', name: 'Dancing Script' },
  { id: '2', name: 'Lato' },
  { id: '3', name: 'Noto Sans' },
  { id: '4', name: 'Noto Serif' },
  { id: '5', name: 'Nunito' },
  { id: '6', name: 'Pacifico' },
  { id: '7', name: 'Open Sans' },
  { id: '8', name: 'Roboto' },
  { id: '9', name: 'Bungee' },
  { id: '10', name: 'Bebas Neue' }
];
```

#### Billing Plans
```typescript
const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 6.99,
    interval: 'month',
    trialDays: 14
  },
  annual: {
    id: 'annual',
    name: 'Annual Plan',
    price: 5.60,
    interval: 'year',
    trialDays: 14
  }
};
```

---

**End of Implementation Plan**
