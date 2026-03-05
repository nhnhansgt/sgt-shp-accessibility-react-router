import { PrismaClient } from '@prisma/client';
import type { Accessibility, AccessibilitySettings } from '~/types/accessibility';

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
   */
  async findOrCreate(shopDomain: string): Promise<Accessibility> {
    const existing = await this.findByShopDomain(shopDomain);

    if (existing) {
      return existing;
    }

    // Create new record with defaults
    // Note: app_id is kept null for legacy compatibility
    return this.db.accessibilities.create({
      data: {
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
    settings: Partial<AccessibilitySettings>
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
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
    statement: string
  ): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
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
  async setStatus(shopDomain: string, status: 0 | 1): Promise<Accessibility> {
    const record = await this.findByShopDomain(shopDomain);
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
