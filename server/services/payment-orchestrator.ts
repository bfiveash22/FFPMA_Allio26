import { CartItemRequest, VerifiedProduct } from './stripe';

export type PaymentGateway = 'stripe' | 'woocommerce' | 'crypto';

export interface CheckoutContext {
  userId: string;
  userRole: string;
  items: CartItemRequest[];
  totalAmount: number;
  hasSubscription: boolean;
  hasPhysicalProducts: boolean;
}

export class PaymentOrchestrator {
  /**
   * Rules Engine for determining the optimal payment gateway
   * based on the checkout context (cart contents, user role, etc.)
   */
  static determineGateway(context: CheckoutContext): PaymentGateway {
    
    // Rule 1: Subscriptions MUST go to Stripe for recurring billing management
    if (context.hasSubscription) {
      console.log(`[ORCHESTRATOR] Routing to Stripe: Cart contains subscription items.`);
      return 'stripe';
    }

    // Rule 2: Physical Supplement Products MUST go through WooCommerce 
    // to utilize advance shipping rate calculations and inventory syncing.
    if (context.hasPhysicalProducts) {
      console.log(`[ORCHESTRATOR] Routing to WooCommerce: Cart contains physical inventory.`);
      return 'woocommerce';
    }

    // Rule 3: High-ticket items or crypto preference (Placeholder for Lightning/BTC)
    if (context.totalAmount > 10000 && process.env.ENABLE_CRYPTO === 'true') {
      console.log(`[ORCHESTRATOR] Routing to Crypto (BTCPay): High-value transaction override.`);
      return 'crypto';
    }

    // Rule 4: Doctor wholesale orders go to WooCommerce by default for tier pricing
    if (context.userRole === 'doctor' || context.userRole === 'administrator') {
      console.log(`[ORCHESTRATOR] Routing to WooCommerce: B2B/Wholesale tier detected.`);
      return 'woocommerce';
    }

    // Default Fallback
    console.log(`[ORCHESTRATOR] Routing to Stripe: Default gateway.`);
    return 'stripe';
  }

  /**
   * Generate the correct checkout URL based on the determined gateway
   */
  static async getCheckoutUrl(
    gateway: PaymentGateway, 
    context: CheckoutContext,
    verifiedProducts: Map<string, VerifiedProduct>,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    if (gateway === 'stripe') {
      const { createCheckoutSession } = await import('./stripe');
      const session = await createCheckoutSession(
        context.items,
        verifiedProducts,
        context.userId,
        successUrl,
        cancelUrl
      );
      if (!session || !session.url) {
        throw new Error('Failed to generate Stripe checkout URL');
      }
      return session.url;
    } else if (gateway === 'woocommerce') {
      // In a real scenario, this would generate a WooCommerce cart URL with an auth token
      // For now, redirect to the main WooCommerce checkout endpoint handling B2B Carts
      return `https://forgottenformula.com/checkout/?order_context=${context.userId}`;
    } else if (gateway === 'crypto') {
      throw new Error('Crypto gateway not yet implemented - Phase 4 Pending');
    }

    throw new Error('Unknown payment gateway');
  }
}
