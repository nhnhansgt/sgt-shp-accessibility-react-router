# Database Design Document - Shopify Accessibility Admin App

## 1. Overview

This document describes how to work with the **existing database schema** without modifications. The app uses the current `accessibilities` table structure and Shopify's `Session` model for authentication.

**Important Constraints:**
- **NO schema changes** - Work with existing structure only
- **NO new models** - No Store, Subscription, or AuditLog tables
- **NO foreign key modifications** - `app_id` and `store_id` remain as BigInt fields
- **Application-layer validation** - Handle constraints in code, not database

---

## 2. Existing Schema Structure

### 2.1 Current Tables

```
┌─────────────────────────┐
│       Session           │  (Shopify Auth)
├─────────────────────────┤
│ id (PK)                 │
│ shop                    │
│ state                   │
│ accessToken             │
│ expires                 │
│ ...                     │
└─────────────────────────┘
           │
           │  maps via shop domain
           ▼
┌─────────────────────────┐
│    accessibilities      │  (Main Data)
├─────────────────────────┤
│ id (PK)                 │
│ app_id                  │  ← BigInt (no FK)
│ store_id                │  ← BigInt (no FK)
│ status                  │
│ icon                    │
│ position                │
│ options (TEXT/JSON)     │
│ statement (LONGTEXT)    │
│ created_at              │
│ updated_at              │
│ deleted_at              │
└─────────────────────────┘

┌─────────────────────────┐
│    Legacy Laravel       │  (Do NOT use)
│  - failed_jobs          │
│  - jobs                 │
│  - password_resets      │
│  - personal_access_tokens │
│  - users                │
│  - sessions             │
└─────────────────────────┘
```

### 2.2 accessibilities Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | BigInt (PK) | Auto-increment ID |
| `app_id` | BigInt (nullable) | App identifier (no FK relationship) |
| `store_id` | BigInt (nullable) | Legacy store identifier (retained for compatibility, do not use in new code) |
| `shop` | VarChar(255) (nullable) | Shop domain (e.g., "store.myshopify.com") - **USE THIS for queries** |
| `status` | TinyInt | 0 = disabled, 1 = enabled |
| `icon` | LongText (nullable) | Icon key (e.g., "icon-circle") |
| `position` | VarChar(256) | Widget position |
| `options` | LongText (nullable) | JSON string of widget options |
| `statement` | LongText (nullable) | HTML accessibility statement |
| `created_at` | Timestamp | Creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |
| `deleted_at` | Timestamp (nullable) | Soft delete timestamp |

### 2.3 Session Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Session ID |
| `shop` | VarChar(255) | Shop domain (e.g., "store.myshopify.com") |
| `state` | VarChar(255) | OAuth state |
| `isOnline` | Boolean | Online/offline session |
| `expires` | Timestamp | Session expiration |
| `accessToken` | Text | Shopify access token |
| ... | ... | Other Shopify fields |

---

## 3. Shop Domain to Accessibility Mapping

### 3.1 Mapping Strategy

Since `store_id` is not a foreign key, we need an application-layer mapping:

```typescript
// Mapping approach: shop domain → accessibilities record

// Option 1: Use shop domain hash as store_id
function getStoreIdFromShopDomain(shopDomain: string): bigint {
  // FNV-1a 64-bit hash function
  let hash = 0xcbf29ce484222325n; // FNV offset basis
  const prime = 0x100000001b3n;   // FNV prime

  for (let i = 0; i < shopDomain.length; i++) {
    hash ^= BigInt(shopDomain.charCodeAt(i));
    hash *= prime;
  }

  return hash;
}

// Option 2: Query by both app_id and store_id combination
async function findAccessibilityByShop(
  db: PrismaClient,
  shopDomain: string,
  appId: number
): Promise<Accessibility | null> {
  const storeId = getStoreIdFromShopDomain(shopDomain);
  return db.accessibilities.findFirst({
    where: {
      app_id: BigInt(appId),
      store_id: storeId,
      deleted_at: null,
    },
  });
}
```

### 3.2 Session.shop to accessibilities Lookup

```typescript
// Get shop from Session, then find accessibility settings
async function getAccessibilityForSession(
  db: PrismaClient,
  session: Session
): Promise<Accessibility | null> {
  const shopDomain = session.shop; // e.g., "store.myshopify.com"
  const appId = getAppIdFromConfig(); // From app config

  return findAccessibilityByShop(db, shopDomain, appId);
}
```

---

## 4. Data Access Patterns

### 4.1 Repository Pattern for Existing Schema

```typescript
// app/db/repositories/accessibility.repository.ts

import { PrismaClient } from '@prisma/client';
import type { Accessibility, AccessibilitySettings } from '~/types';

export class AccessibilityRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find accessibility settings by shop domain
   */
  async findByShopDomain(shopDomain: string, appId: number): Promise<Accessibility | null> {
    return this.db.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shopDomain,
        deleted_at: null,
      },
    });
  }

  /**
   * Get or create accessibility record for a shop
   */
  async findOrCreate(shopDomain: string, appId: number): Promise<Accessibility> {
    const existing = await this.db.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shopDomain,
        deleted_at: null,
      },
    });

    if (existing) {
      return existing;
    }

    // Create new record with defaults
    return this.db.accessibilities.create({
      data: {
        app_id: BigInt(appId),
        shop: shopDomain,
        status: 0,
        icon: 'icon-circle',
        position: 'bottom-right',
        options: JSON.stringify(this.getDefaultOptions()),
        statement: this.getDefaultStatement(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Update widget settings
   */
  async updateWidgetSettings(
    shopDomain: string,
    appId: number,
    settings: Partial<AccessibilitySettings>
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain, appId);
    if (!record) {
      throw new Error('Accessibility record not found');
    }

    const updateData: any = {
      updated_at: new Date(),
    };

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

  /**
   * Update accessibility statement
   */
  async updateStatement(
    shopDomain: string,
    appId: number,
    statement: string
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain, appId);
    if (!record) {
      throw new Error('Accessibility record not found');
    }

    return this.db.accessibilities.update({
      where: { id: record.id },
      data: {
        statement,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Enable/disable accessibility widget
   */
  async setStatus(shopDomain: string, appId: number, status: 0 | 1): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain, appId);
    if (!record) {
      throw new Error('Accessibility record not found');
    }

    return this.db.accessibilities.update({
      where: { id: record.id },
      data: { status, updated_at: new Date() },
    });
  }

  /**
   * Soft delete accessibility record
   */
  async softDelete(shopDomain: string, appId: number): Promise<void> {
    const record = await this.findByShopDomain(shopDomain, appId);
    if (!record) {
      return;
    }

    await this.db.accessibilities.update({
      where: { id: record.id },
      data: { deleted_at: new Date() },
    });
  }

  // Helper: Default widget options
  private getDefaultOptions() {
    return {
      color: '#ffffff',
      size: '24',
      background_color: '#FA6E0A',
      offsetX: 10,
      offsetY: 10,
      locale: 'en',
      theme_bg_color: '#FA6E0A',
      font: '8',
    };
  }

  // Helper: Default accessibility statement
  private getDefaultStatement(): string {
    return `
      <h1>Accessibility Statement</h1>
      <p>We are committed to ensuring digital accessibility for people with disabilities.</p>
      <h2>Conformance Status</h2>
      <p>Our website conforms to WCAG 2.1 Level AA.</p>
      <h2>Features</h2>
      <ul>
        <li>Font size adjustment</li>
        <li>Screen reader compatibility</li>
        <li>High contrast mode</li>
        <li>Link highlighting</li>
      </ul>
    `;
  }
}
```

### 4.2 Common Query Examples

```typescript
// Get accessibility for a shop (using shop column)
const accessibility = await prisma.accessibilities.findFirst({
  where: {
    app_id: BigInt(appId),
    shop: shopDomain, // e.g., "store.myshopify.com"
    deleted_at: null,
  },
});

// Get all enabled accessibility records
const enabled = await prisma.accessibilities.findMany({
  where: {
    status: 1,
    deleted_at: null,
  },
});

// Count records by app
const count = await prisma.accessibilities.count({
  where: {
    app_id: BigInt(appId),
    deleted_at: null,
  },
});

// Update with partial data
const updated = await prisma.accessibilities.update({
  where: { id },
  data: {
    icon: 'icon-wheelchair',
    updated_at: new Date(),
  },
});
```

---

## 5. Public API Endpoint Pattern

For the theme extension to fetch settings without authentication:

```typescript
// app/routes/api.accessibilities.$shop.tsx

import { json } from '@shopify/remix-oxygen';
import { prisma } from '~/db.server';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { shop } = params; // shop domain from URL

  if (!shop) {
    return json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    const appId = getAppIdFromConfig();

    const accessibility = await prisma.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shop, // Direct query using shop column
        status: 1, // Only return enabled widgets
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

    // Parse options JSON
    const data = {
      ...accessibility,
      options: accessibility.options ? JSON.parse(accessibility.options as string) : {},
    };

    return json({ data });
  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

---

## 6. Billing Status Handling

> **Note:** Billing functionality has been removed and will be implemented in a future update.

## 7. Validation Patterns (Application Layer)

Since database constraints are limited, validate in code:

### 7.1 Accessibility Settings Validator

```typescript
// app/validators/accessibility.validator.ts

import { z } from 'zod';

export const AccessibilityOptionsSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  size: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(24).max(50)
  ),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  offsetX: z.number().min(0).max(100),
  offsetY: z.number().min(0).max(100),
  locale: z.enum(['en', 'jp']),
  theme_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  font: z.coerce.number().int().min(0).max(10),
});

export const AccessibilitySettingsSchema = z.object({
  icon: z.enum([
    'icon-circle',
    'icon-wheelchair',
    'icon-eye',
    'icon-universal',
    'icon-hand',
    'icon-hearing',
  ]).optional(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
  status: z.number().int().min(0).max(1).optional(),
  options: AccessibilityOptionsSchema.optional(),
  statement: z.string().max(100000).optional(),
});

export function validateAccessibilitySettings(data: unknown) {
  return AccessibilitySettingsSchema.safeParse(data);
}
```

### 7.2 Usage in Route Actions

```typescript
// app/routes/app.widgets.tsx

import { validateAccessibilitySettings } from '~/validators/accessibility.validator';

export const action = async ({ request }: ActionFunctionArgs) => {

  const formData = await request.formData();

  const settings = {
    icon: formData.get('icon'),
    position: formData.get('position'),
    status: Number(formData.get('status')),
    options: JSON.parse(formData.get('options') as string || '{}'),
  };

  // Validate
  const validation = validateAccessibilitySettings(settings);
  if (!validation.success) {
    return json({ errors: validation.error.flatten() }, { status: 400 });
  }

  // Save to database
  const repository = new AccessibilityRepository(prisma);
  const accessibility = await repository.updateWidgetSettings(
    session.shop,
    getAppId(),
    validation.data
  );

  return json({ success: true, accessibility });
};
```

---

## 8. Recommended Indexes (Non-Breaking)

These indexes can be added without schema changes:

```sql
-- For faster lookups by app_id + store_id combination
CREATE INDEX idx_accessibilities_app_store ON accessibilities(app_id, store_id);

-- For filtering non-deleted records
CREATE INDEX idx_accessibilities_deleted_at ON accessibilities(deleted_at);

-- For filtering by status (enabled/disabled)
CREATE INDEX idx_accessibilities_status ON accessibilities(status);

-- Composite index for common queries
CREATE INDEX idx_accessibilities_lookup ON accessibilities(app_id, store_id, deleted_at, status);
```

Apply via migration (additive only):

```bash
npx prisma migrate dev --name add_accessibility_indexes
```

Or update Prisma schema:

```prisma
model accessibilities {
  id         BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  deleted_at DateTime? @db.Timestamp(0)
  status     Int       @default(0) @db.TinyInt
  // ... other fields

  @@index([app_id, store_id], map: "idx_accessibilities_app_store")
  @@index([deleted_at], map: "idx_accessibilities_deleted_at")
  @@index([status], map: "idx_accessibilities_status")
  @@index([app_id, store_id, deleted_at, status], map: "idx_accessibilities_lookup")
}
```

---

## 9. TypeScript Types

```typescript
// app/models/accessibility.ts

export type WidgetIcon =
  | 'icon-circle'
  | 'icon-wheelchair'
  | 'icon-eye'
  | 'icon-universal'
  | 'icon-hand'
  | 'icon-hearing';

export type WidgetPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type WidgetLocale = 'en' | 'jp';

export type FontOption =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export interface AccessibilityOptions {
  color: string;           // Hex color
  size: string | number;   // 24-50
  background_color: string; // Hex color
  offsetX: number;         // 0-100
  offsetY: number;         // 0-100
  locale: WidgetLocale;
  theme_bg_color: string;  // Hex color
  font: FontOption;
}

export interface AccessibilitySettings {
  icon?: WidgetIcon;
  position?: WidgetPosition;
  status?: 0 | 1;
  options?: AccessibilityOptions;
  statement?: string;
}

export interface Accessibility {
  id: bigint;
  app_id: bigint | null;
  store_id: bigint | null;
  status: number;
  icon: string | null;
  position: string | null;
  options: string | null; // JSON string
  statement: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export interface AccessibilityWithParsedOptions extends Accessibility {
  optionsParsed?: AccessibilityOptions;
}

// Prisma generated types extend these
```

---

## 10. Default Values Reference

### 10.1 Default Widget Options

```typescript
const defaultOptions: AccessibilityOptions = {
  color: '#ffffff',           // White icon
  size: '24',                 // 24px
  background_color: '#FA6E0A', // Orange background
  offsetX: 10,                // 10px from edge
  offsetY: 10,                // 10px from edge
  locale: 'en',               // English
  theme_bg_color: '#FA6E0A',  // Orange panel background
  font: '8',                  // Open Sans
};
```

### 10.2 Font Options

| ID | Font Name |
|----|-----------|
| 0  | Lobster |
| 1  | Dancing Script |
| 2  | Lato |
| 3  | Noto Sans |
| 4  | Noto Serif |
| 5  | Nunito |
| 6  | Pacifico |
| 7  | Open Sans |
| 8  | Roboto |
| 9  | Bungee |
| 10 | Bebas Neue |

### 10.3 Icon Options

- `icon-circle` - Circle icon
- `icon-wheelchair` - Wheelchair icon
- `icon-eye` - Eye/vision icon
- `icon-universal` - Universal access icon
- `icon-hand` - Hand icon
- `icon-hearing` - Hearing accessibility icon

---

## 11. API Response Format

### 11.1 GET /app/store Response

```typescript
interface StoreResponse {
  data: {
    id?: number;
    shop_url?: string;
    name?: string;
    contact_email?: string;
    paid?: 'monthly' | 'annual' | null;
    accessibility?: {
      id: number;
      status: number;
      icon: string | null;
      position: string | null;
      options: AccessibilityOptions;
      statement: string | null;
      app_id: number | null;
      store_id: number | null;
    };
  };
}
```

### 11.2 Public API Response (/app/accessibilities/:shop)

```typescript
interface PublicAccessibilityResponse {
  data: {
    status: number;
    icon: string | null;
    position: string | null;
    options: AccessibilityOptions;
    statement: string | null;
  } | null;
}
```

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2026-03-04 | Added `shop` column, removed billing functionality (to be implemented later) |
| 2.0 | 2025-03-03 | Revised for existing schema constraints - no schema changes |
| 1.0 | 2025-03-03 | Initial database design (deprecated - proposed new models) |
