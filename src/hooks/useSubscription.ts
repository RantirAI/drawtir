import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Stripe price IDs for Drawtir subscription tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    price_id: "price_1SaXdFIhz3KTN6c8UqG2fdLN",
    name: "Starter",
    interval: "month",
  },
  sdk_whitelabel: {
    price_id: "price_1SaXdFIhz3KTN6c85HtCsI6f",
    name: "SDK Whitelabel",
    interval: "year",
  },
} as const;

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  priceId: string | null;
  productId: string | null;
  subscriptionEnd: string | null;
  error: string | null;
}

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    priceId: null,
    productId: null,
    subscriptionEnd: null,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, isLoading: false, subscribed: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setState({
        isLoading: false,
        subscribed: data.subscribed,
        priceId: data.price_id,
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  }, []);

  const getCurrentTier = useCallback(() => {
    if (!state.priceId) return null;
    
    for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
      if (tier.price_id === state.priceId) {
        return { key, ...tier };
      }
    }
    return null;
  }, [state.priceId]);

  useEffect(() => {
    checkSubscription();
    
    // Set up auth state listener to refresh subscription on login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkSubscription();
      } else if (event === 'SIGNED_OUT') {
        setState({
          isLoading: false,
          subscribed: false,
          priceId: null,
          productId: null,
          subscriptionEnd: null,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getCurrentTier,
  };
};
