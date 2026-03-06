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
