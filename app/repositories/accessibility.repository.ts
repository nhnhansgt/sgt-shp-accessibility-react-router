import { PrismaClient } from '@prisma/client';
import type { Accessibility, AccessibilitySettings } from '~/types/accessibility';
import {
  DEFAULT_ICON,
  DEFAULT_POSITION,
  DEFAULT_OPTIONS,
  DEFAULT_STATEMENT,
  DEFAULT_STATUS,
} from '~/constants/accessibility.defaults';
import { stringifyJson } from '~/utils/json.utils';

// Pre-stringified defaults for performance
const DEFAULT_OPTIONS_JSON = stringifyJson(DEFAULT_OPTIONS);

export class AccessibilityRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find accessibility settings by shop domain
   */
  async findByShopDomain(shopDomain: string): Promise<Accessibility | null> {
    return this.db.accessibilities.findFirst({
      where: {
        shop: shopDomain,
        deleted_at: null,
      },
    });
  }

  /**
   * Get or create accessibility record for a shop
   * Note: Uses find-then-create pattern. For concurrent calls, consider adding unique constraint on shop column.
   */
  async findOrCreate(shopDomain: string): Promise<Accessibility> {
    const existing = await this.findByShopDomain(shopDomain);

    if (existing) {
      return existing;
    }

    return this.db.accessibilities.create({
      data: {
        shop: shopDomain,
        status: DEFAULT_STATUS,
        icon: DEFAULT_ICON,
        position: DEFAULT_POSITION,
        options: DEFAULT_OPTIONS_JSON,
        statement: DEFAULT_STATEMENT,
        // created_at, updated_at auto-set by Prisma defaults
      },
    });
  }

  /**
   * Update widget settings
   */
  async updateWidgetSettings(
    shopDomain: string,
    settings: Partial<AccessibilitySettings>
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
    if (!record) {
      throw new Error(`Accessibility record not found for shop: ${shopDomain}`);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
      ...settings,
      // Auto-transform options to JSON string
      ...(settings.options && {
        options: stringifyJson(settings.options),
      }),
    };

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
    statement: string
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
    if (!record) {
      throw new Error(`Accessibility record not found for shop: ${shopDomain}`);
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
  async setStatus(shopDomain: string, status: 0 | 1): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
    if (!record) {
      throw new Error(`Accessibility record not found for shop: ${shopDomain}`);
    }

    return this.db.accessibilities.update({
      where: { id: record.id },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }
}
