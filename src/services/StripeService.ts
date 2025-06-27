import { supabase } from '../lib/supabase';

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  minutes: number;
  features: string[];
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
  product_id: string;
  cancel_at_period_end: boolean;
}

// Pricing plans configuration
export const PRICING_PLANS = {
  intro: {
    id: 'intro',
    name: 'Intro',
    description: 'Perfect for getting started',
    icon: 'Zap',
    color: 'blue',
    popular: false,
    monthly: {
      price: 3900, // in cents
      minutes: 60,
      stripe_price_id: 'price_1ReU7NGAHtqBz61ItNOTT7IA',
      features: [
        "60 conversation minutes/month",
        "Basic feedback analysis",
        "Standard question library",
        "Email support",
        "Progress tracking"
      ]
    },
    yearly: {
      price: 44500, // in cents
      minutes: 720, // 60 * 12
      stripe_price_id: 'price_1ReVdYGAHtqBz61IKmbslk04',
      originalPrice: 46800, // 3900 * 12
      features: [
        "720 conversation minutes/year",
        "Basic feedback analysis",
        "Standard question library",
        "Email support",
        "Progress tracking"
      ]
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Most popular for job seekers',
    icon: 'Star',
    color: 'primary',
    popular: true,
    monthly: {
      price: 19900, // in cents
      minutes: 330,
      stripe_price_id: 'price_1ReVewGAHtqBz61IJaedyXwa',
      features: [
        "330 conversation minutes/month",
        "Advanced feedback & coaching",
        "Industry-specific questions",
        "Video analysis & tips",
        "Priority support",
        "Performance analytics"
      ]
    },
    yearly: {
      price: 226800, // in cents
      minutes: 3960, // 330 * 12
      stripe_price_id: 'price_1ReVgAGAHtqBz61IoR5OLXVL',
      originalPrice: 238800, // 19900 * 12
      features: [
        "3960 conversation minutes/year",
        "Advanced feedback & coaching",
        "Industry-specific questions",
        "Video analysis & tips",
        "Priority support",
        "Performance analytics"
      ]
    }
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'For senior-level positions',
    icon: 'Crown',
    color: 'purple',
    popular: false,
    monthly: {
      price: 49900, // in cents
      minutes: 900,
      stripe_price_id: 'price_1ReVfkGAHtqBz61IZvGYezkS',
      features: [
        "900 conversation minutes/month",
        "Executive-level scenarios",
        "Custom interview prep",
        "1-on-1 coaching calls",
        "White-glove support",
        "Advanced analytics"
      ]
    },
    yearly: {
      price: 539100, // in cents
      minutes: 10800, // 900 * 12
      stripe_price_id: 'price_1ReVgeGAHtqBz61Ij9vN90jN',
      originalPrice: 598800, // 49900 * 12
      features: [
        "10800 conversation minutes/year",
        "Executive-level scenarios",
        "Custom interview prep",
        "1-on-1 coaching calls",
        "White-glove support",
        "Advanced analytics"
      ]
    }
  }
};

class StripeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  }

  async createCheckoutSession(
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<StripeCheckoutSession> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: priceId,
          user_id: userId,
          success_url: successUrl,
          cancel_url: cancelUrl
        }
      });

      if (error) {
        console.error('Supabase Functions error:', error);
        
        // Check if it's a FunctionsHttpError with context
        if (error.name === 'FunctionsHttpError' && error.context) {
          try {
            // Try to parse the error context as JSON to get the detailed error message
            const errorDetails = JSON.parse(error.context);
            throw new Error(errorDetails.error || 'Failed to create checkout session');
          } catch (parseError) {
            // If parsing fails, use the original error message
            throw new Error(`Edge Function error: ${error.message}`);
          }
        }
        
        throw error;
      }
      
      if (!data || !data.url) {
        throw new Error('Invalid response from checkout service');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: {
          customer_id: customerId,
          return_url: returnUrl
        }
      });

      if (error) {
        console.error('Supabase Functions error:', error);
        
        // Check if it's a FunctionsHttpError with context
        if (error.name === 'FunctionsHttpError' && error.context) {
          try {
            // Try to parse the error context as JSON to get the detailed error message
            const errorDetails = JSON.parse(error.context);
            throw new Error(errorDetails.error || 'Failed to create portal session');
          } catch (parseError) {
            // If parsing fails, use the original error message
            throw new Error(`Edge Function error: ${error.message}`);
          }
        }
        
        throw error;
      }
      
      if (!data || !data.url) {
        throw new Error('Invalid response from portal service');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }

  async getSubscription(userId: string): Promise<StripeSubscription | null> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('Supabase Functions error:', error);
        
        // Log detailed error information for debugging
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          context: error.context
        });
        
        // For subscription fetching, we'll return null to prevent UI breaking
        // This allows the billing page to still load with limited functionality
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-cancel', {
        body: { subscription_id: subscriptionId }
      });

      if (error) {
        console.error('Supabase Functions error:', error);
        
        // Check if it's a FunctionsHttpError with context
        if (error.name === 'FunctionsHttpError' && error.context) {
          try {
            // Try to parse the error context as JSON to get the detailed error message
            const errorDetails = JSON.parse(error.context);
            throw new Error(errorDetails.error || 'Failed to cancel subscription');
          } catch (parseError) {
            // If parsing fails, use the original error message
            throw new Error(`Edge Function error: ${error.message}`);
          }
        }
        
        return false;
      }
      
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response from cancellation service');
      }
      
      return data.success;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  getPlanDetails(planId: string, interval: 'monthly' | 'yearly') {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return null;

    const details = interval === 'yearly' ? plan.yearly : plan.monthly;
    return {
      ...details,
      planId,
      interval
    };
  }

  getMinutesForPlan(planId: string, interval: 'monthly' | 'yearly'): number {
    const details = this.getPlanDetails(planId, interval);
    return details?.minutes || 0;
  }

  // Get user's billing history from Supabase
  async getBillingHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }

      // Format the invoice data for display
      return data.map(invoice => ({
        id: invoice.id,
        date: invoice.created_at,
        amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
        status: invoice.status,
        description: invoice.description || 'Subscription Payment',
        invoice: invoice.id.substring(0, 8),
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url
      }));
    } catch (error) {
      console.error('Error in getBillingHistory:', error);
      return [];
    }
  }
  // Format price for display (converts cents to dollars)
  formatPrice(amount: number): string {
    return `$${(amount / 100).toFixed(2)}`;
  }

  // Get features for a plan
  getPlanFeatures(planId: string, interval: 'monthly' | 'yearly' = 'monthly'): string[] {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return [];
    
    // Return the features for the selected interval
    return interval === 'monthly' 
      ? plan.monthly.features || []
      : plan.yearly.features || [];
  }

  // Calculate savings between monthly and yearly plans
  calculateSavings(planId: string): number {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return 0;
    
    const monthlyAnnualized = plan.monthly.price * 12;
    const yearlyCost = plan.yearly.price;
    
    return monthlyAnnualized - yearlyCost;
  }

  // Calculate savings percentage
  calculateSavingsPercentage(planId: string): number {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return 0;
    
    const monthlyAnnualized = plan.monthly.price * 12;
    const yearlyCost = plan.yearly.price;
    
    return Math.round((1 - (yearlyCost / monthlyAnnualized)) * 100);
  }
}

export const stripeService = new StripeService();
export default StripeService;