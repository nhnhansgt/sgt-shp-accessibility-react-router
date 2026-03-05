# Backend Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect all UI screens to the database using a repository pattern, replacing mock data with real persistence.

**Architecture:** Repository pattern with Prisma ORM. Single `AccessibilityRepository` class handles all data access for the `accessibilities` table using the `shop` column for lookups. Routes call repository methods in loaders/actions instead of returning mock data.

**Tech Stack:** React Router (loaders/actions), Prisma ORM, TypeScript, Polaris web components, Shopify App authentication.

**Key Constraints:**
- Use existing `accessibilities` table schema (NO migrations)
- Query using `shop` column (e.g., "store.myshopify.com")
- Soft delete support via `deleted_at` column
- Application-layer validation with Zod

---

## Task 1: Create AccessibilityRepository

**Files:**
- Create: `app/repositories/accessibility.repository.ts`
- Test: N/A (integration tested via routes)

**Step 1: Create repositories directory**

```bash
mkdir -p app/repositories
```

**Step 2: Create the repository file**

Create `app/repositories/accessibility.repository.ts`:

```typescript
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
    const existing = await this.findByShopDomain(shopDomain, appId);

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
   * Helper: Default widget options
   */
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

  /**
   * Helper: Default accessibility statement
   */
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

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/repositories/accessibility.repository.ts
git commit -m "feat: create AccessibilityRepository with Prisma"
```

---

## Task 2: Create Types File

**Files:**
- Create: `app/types/accessibility.ts`

**Step 1: Create types directory and file**

```bash
mkdir -p app/types
```

**Step 2: Create the types file**

Create `app/types/accessibility.ts`:

```typescript
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
  shop: string | null;
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
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/types/accessibility.ts
git commit -m "feat: add TypeScript types for Accessibility"
```

---

## Task 3: Create Config Utility for App ID

**Files:**
- Create: `app/utils/config.ts`

**Step 1: Create utils directory**

```bash
mkdir -p app/utils
```

**Step 2: Create config utility**

Create `app/utils/config.ts`:

```typescript
/**
 * Get App ID from environment or Shopify config
 * This should match the app_id used in the accessibilities table
 */
export function getAppIdFromConfig(): number {
  // TODO: Replace with actual App ID from Shopify config or environment
  // For now, return a placeholder value
  const appId = process.env.SHOPIFY_APP_ID || '1';
  return parseInt(appId, 10);
}
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/utils/config.ts
git commit -m "feat: add config utility for App ID"
```

---

## Task 4: Update app.widgets.tsx - Connect to Database

**Files:**
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Add repository imports**

Add at top of `app/widgets.tsx`:

```typescript
import { prisma } from '~/db.server';
import { AccessibilityRepository } from '~/repositories/accessibility.repository';
import { getAppIdFromConfig } from '~/utils/config';
import type { ActionFunctionArgs } from 'react-router';
import { json } from 'react-router';
```

**Step 2: Update loader to use repository**

Replace the loader:

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain, appId);

  return {
    isYearEndSale: false,
    saleDays: 0,
    settings: {
      ...settings,
      options: settings.options ? JSON.parse(settings.options as string) : {},
    },
  };
};
```

**Step 3: Update action to save settings**

Replace the action and handleSave logic. Add new action:

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const formData = await request.formData();
  const settings = {
    icon: formData.get('icon') as string,
    position: formData.get('position') as string,
    options: JSON.parse(formData.get('options') as string || '{}'),
  };

  const repository = new AccessibilityRepository(prisma);
  const updated = await repository.updateWidgetSettings(shopDomain, appId, settings);

  return json({
    success: true,
    settings: {
      ...updated,
      options: JSON.parse(updated.options as string),
    },
  });
};
```

**Step 4: Update default component to use useActionData**

Add import:
```typescript
import { useActionData, useNavigation } from 'react-router';
```

Update component to handle form submission via fetcher instead of manual state.

**Step 5: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 6: Manual test**

Run: `npm run dev`
Navigate to: `http://localhost:3000/app/widgets`
Action: Change widget settings and click Save
Expected: Settings saved to database, success message shown

**Step 7: Commit**

```bash
git add app/routes/app.widgets.tsx
git commit -m "feat: connect Widgets screen to database via repository"
```

---

## Task 5: Update app.statement.tsx - Connect to Database

**Files:**
- Modify: `app/routes/app.statement.tsx`

**Step 1: Add repository imports**

Add at top of `app/statement.tsx`:

```typescript
import { prisma } from '~/db.server';
import { AccessibilityRepository } from '~/repositories/accessibility.repository';
import { getAppIdFromConfig } from '~/utils/config';
import type { ActionFunctionArgs } from 'react-router';
import { json } from 'react-router';
```

**Step 2: Update loader**

Replace loader:

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain, appId);

  return {
    content: settings.statement || '',
    links: DEFAULT_LINKS,
  };
};
```

**Step 3: Add action for saving statement**

Add after loader:

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const formData = await request.formData();
  const statement = formData.get('statement') as string;

  const repository = new AccessibilityRepository(prisma);
  const updated = await repository.updateStatement(shopDomain, appId, statement);

  return json({
    success: true,
    statement: updated.statement,
  });
};
```

**Step 4: Update component to use useFetcher**

Replace handleSave with fetcher-based submission.

**Step 5: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 6: Commit**

```bash
git add app/routes/app.statement.tsx
git commit -m "feat: connect Statement screen to database via repository"
```

---

## Task 6: Update app.setup.tsx - Connect to Database

**Files:**
- Modify: `app/routes/app.setup.tsx`

**Step 1: Add repository imports**

```typescript
import { prisma } from '~/db.server';
import { AccessibilityRepository } from '~/repositories/accessibility.repository';
import { getAppIdFromConfig } from '~/utils/config';
```

**Step 2: Update loader**

Replace loader:

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain, appId);

  return {
    isAccessibilityOn: settings.status === 1,
    isYearEndSale: false,
    saleDays: 0,
  };
};
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.setup.tsx
git commit -m "feat: connect Setup screen to database via repository"
```

---

## Task 7: Update app.support.tsx - Check Billing Status

**Files:**
- Modify: `app/routes/app.support.tsx`

**Step 1: Add repository imports**

```typescript
import { prisma } from '~/db.server';
import { AccessibilityRepository } from '~/repositories/accessibility.repository';
import { getAppIdFromConfig } from '~/utils/config';
```

**Step 2: Update loader**

Replace loader:

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const appId = getAppIdFromConfig();

  const repository = new AccessibilityRepository(prisma);
  const settings = await repository.findOrCreate(shopDomain, appId);

  return {
    isYearEndSale: false,
    saleDays: 0,
    videoUrl: 'https://www.youtube.com/embed/e0WOkdanoJo',
    videoTitle: 'How to use Accessibility app',
    supportEmail: 'support@sgt-lab.com',
    knowledgeBaseUrl: 'https://sgt-lab.com/help/category/accessibility-faqs/',
    links: {
      privacyPolicy: 'https://sgt-lab.com/privacy',
      termsOfService: 'https://sgt-lab.com/terms',
    },
  };
};
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/app.support.tsx
git commit -m "feat: connect Support screen to database via repository"
```

---

## Task 8: Create Public API Endpoint

**Files:**
- Create: `app/routes/api.accessibilities.$shop.tsx`

**Step 1: Create the public API route**

Create `app/routes/api.accessibilities.$shop.tsx`:

```typescript
import type { LoaderFunctionArgs } from 'react-router';
import { json } from 'react-router';
import { prisma } from '~/db.server';
import { getAppIdFromConfig } from '~/utils/config';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { shop } = params;

  if (!shop) {
    return json({ error: 'Shop parameter required' }, { status: 400 });
  }

  try {
    const appId = getAppIdFromConfig();

    const accessibility = await prisma.accessibilities.findFirst({
      where: {
        app_id: BigInt(appId),
        shop: shop,
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
      status: accessibility.status,
      icon: accessibility.icon,
      position: accessibility.position,
      options: accessibility.options ? JSON.parse(accessibility.options as string) : {},
      statement: accessibility.statement,
    };

    return json({ data });
  } catch (error) {
    console.error('Public API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Manual test**

Run: `npm run dev`
Call: `curl http://localhost:3000/app/api.accessibilities/test-shop`
Expected: JSON response with accessibility settings or 404

**Step 4: Commit**

```bash
git add app/routes/api.accessibilities.$shop.tsx
git commit -m "feat: add public API endpoint for theme extension"
```

---

## Task 9: Add Input Validation with Zod

**Files:**
- Create: `app/validators/accessibility.validator.ts`
- Modify: `app/routes/app.widgets.tsx`

**Step 1: Create validators directory**

```bash
mkdir -p app/validators
```

**Step 2: Create validator file**

Create `app/validators/accessibility.validator.ts`:

```typescript
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

**Step 3: Update widgets action to use validator**

Modify action in `app.widgets.tsx`:

```typescript
import { validateAccessibilitySettings } from '~/validators/accessibility.validator';

// In action:
const validation = validateAccessibilitySettings(settings);
if (!validation.success) {
  return json({ errors: validation.error.flatten() }, { status: 400 });
}
```

**Step 4: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/validators/accessibility.validator.ts app/routes/app.widgets.tsx
git commit -m "feat: add Zod validation for widget settings"
```

---

## Task 10: Final Verification and Testing

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
3. Test each screen:
   - **Setup**: Should show accessibility status from DB
   - **Widgets**: Should load/save widget settings
   - **Statement**: Should load/save statement HTML
   - **Support**: Should load without errors
   - **Plans**: Should display plans (billing mock still in place)

**Step 4: Test public API**

```bash
# Seed a test record first via UI, then:
curl http://localhost:3000/app/api.accessibilities/test-shop.myshopify.com
```

Expected: JSON response with saved settings

**Step 5: Commit all changes**

```bash
git add .
git commit -m "feat: complete backend integration for all screens"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/architecture-analysis.md`

**Step 1: Update implementation status**

Mark completed items in Implementation Priorities section:

```markdown
### Phase 1: Core Infrastructure
- [x] Add `shop` column to accessibilities table
- [x] Create `repositories/accessibility.repository.ts`
- [x] Create `validators/accessibility.validator.ts`
- [x] Update `app.tsx` with navigation

### Phase 2: Setup Page
- [x] Implement `app.setup.tsx` route
- [x] Connect to database via repository

### Phase 4: Widgets Page
- [x] Implement `app.widgets.tsx` route
- [x] Connect to database via repository
- [x] Add Zod validation

### Phase 5: Statement Page
- [x] Implement `app.statement.tsx` route
- [x] Connect to database via repository

### Phase 6: Support & Public API
- [x] Implement `app.support.tsx` route
- [x] Create `api.accessibilities.$shop.tsx` public endpoint
```

**Step 2: Commit**

```bash
git add docs/architecture-analysis.md
git commit -m "docs: update implementation status"
```

---

## Testing Checklist

- [ ] Repository created and exports all methods
- [ ] Types file created with all interfaces
- [ ] Config utility returns App ID
- [ ] Widgets screen loads settings from DB
- [ ] Widgets screen saves settings to DB
- [ ] Statement screen loads HTML from DB
- [ ] Statement screen saves HTML to DB
- [ ] Setup screen shows correct status from DB
- [ ] Support screen loads without errors
- [ ] Public API returns JSON for valid shop
- [ ] Public API returns 404 for missing shop
- [ ] Zod validation rejects invalid data
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Manual E2E test passes

---

## Final File Structure

```
app/
├── routes/
│   ├── app.setup.tsx              # Connected to DB
│   ├── app.widgets.tsx            # Connected to DB + validation
│   ├── app.statement.tsx          # Connected to DB
│   ├── app.support.tsx            # Connected to DB
│   ├── app.plans.tsx              # Mock billing (future)
│   └── api.accessibilities.$shop.tsx  # Public endpoint
│
├── repositories/
│   └── accessibility.repository.ts    # NEW
│
├── types/
│   └── accessibility.ts               # NEW
│
├── validators/
│   └── accessibility.validator.ts     # NEW
│
└── utils/
    └── config.ts                      # NEW
```

---

## Notes

- **Billing functionality** remains mocked - to be implemented when Shopify Billing API integration is needed
- **Soft delete** is respected in all queries (`deleted_at: null`)
- **App ID** should be configured via environment variable `SHOPIFY_APP_ID`
- **Japanese language support** (i18n) is out of scope for this integration
- **Crisp chat integration** in Support screen remains TODO
