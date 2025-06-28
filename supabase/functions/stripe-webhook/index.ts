import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { Database } from '../_shared/database.types.ts';

// Function to determine conversation minutes based on tier and interval
function getMinutesForPlan(tier: string, isAnnual: boolean): number {
  switch (tier) {
    case 'intro':
      return isAnnual ? 720 : 60;
    case 'professional':
      return isAnnual ? 3960 : 330;
    case 'executive':
      return isAnnual ? 10800 : 900;
    default: // free tier
      return 25;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!stripeWebhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error('Stripe environment variables are not set');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Initialize Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found in request headers');
    }

    // Get the raw request body
    const body = await req.text();

    // Create a crypto provider for async verification
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    // Verify the webhook signature asynchronously
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({
        error: 'Webhook signature verification failed'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }

    console.log(`Received Stripe webhook event: ${event.type}`);
    
    // Log the event data for debugging
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    // Handle different event types
    switch(event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout.session.completed event');
        console.log('Session metadata:', session.metadata);
        
        const userId = session.metadata.user_id;
        const subscriptionId = session.subscription;
        if (!userId || !subscriptionId) {
          console.error('Missing user_id or subscription_id in session metadata', session.metadata);
          return new Response(JSON.stringify({
            error: 'Missing user_id or subscription_id in session metadata'
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 400
          });
        }

        console.log(`Found user_id: ${userId} and subscription_id: ${subscriptionId}`);
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log('Retrieved subscription:', JSON.stringify(subscription, null, 2));
        
        const priceId = subscription.items.data[0].price.id;
        console.log(`Price ID: ${priceId}`);
        
        // Get price details to determine plan
        const price = await stripe.prices.retrieve(priceId);
        console.log('Retrieved price:', JSON.stringify(price, null, 2));
        
        const productId = price.product;
        console.log(`Product ID: ${productId}`);
        
        const product = await stripe.products.retrieve(productId);
        console.log('Retrieved product:', JSON.stringify(product, null, 2));
        
        // Determine subscription tier from product name
        let subscriptionTier = 'intro'; // Default
        if (product.name.toLowerCase().includes('professional')) {
          subscriptionTier = 'professional';
        } else if (product.name.toLowerCase().includes('executive')) {
          subscriptionTier = 'executive';
        }
        console.log(`Determined subscription tier: ${subscriptionTier}`);
        
        // Determine if this is an annual subscription
        const isAnnual = price.recurring?.interval === 'year';
        console.log(`Is annual subscription: ${isAnnual}`);

        // Get the new plan minutes
        const newPlanMinutes = getMinutesForPlan(subscriptionTier, isAnnual);
        console.log(`New plan minutes: ${newPlanMinutes}`);

        // Get the user's current profile to calculate carried over minutes
        const { data: currentProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('total_conversation_minutes, used_conversation_minutes')
          .eq('id', userId)
          .single();

        if (profileFetchError) {
          console.error('Error fetching user profile:', profileFetchError);
          // Continue with default values if we can't fetch the profile
        }

        // Calculate minutes to carry over (remaining unused minutes)
        const currentTotal = currentProfile?.total_conversation_minutes || 0;
        const currentUsed = currentProfile?.used_conversation_minutes || 0;
        const remainingMinutes = Math.max(0, currentTotal - currentUsed);
        
        // Add carried over minutes to the new plan minutes
        const totalMinutes = newPlanMinutes + remainingMinutes;
        console.log(`Carrying over ${remainingMinutes} unused minutes. New total: ${totalMinutes}`);

        // Update user profile with subscription info and reset used minutes
        const { error: profileUpdateError } = await supabase.from('profiles').update({
          subscription_tier: subscriptionTier,
          subscription_status: 'active',
          current_subscription_id: subscriptionId,
          subscription_current_period_start: new Date(subscription.current_period_start * 1000),
          subscription_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end,
          stripe_customer_id: subscription.customer,
          total_conversation_minutes: totalMinutes,
          used_conversation_minutes: 0 // Reset used minutes on new subscription
        }).eq('id', userId);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          
          // Log the error but continue with the webhook processing
          await supabase.rpc('log_webhook_event', {
            event_type: event.type,
            event_data: event.data.object,
            processing_result: 'error: profile update failed',
            user_id: userId,
            subscription_id: subscriptionId,
            customer_id: subscription.customer,
            minutes_before: currentTotal,
            minutes_after: totalMinutes,
            carried_over_minutes: remainingMinutes
          });
          
          return new Response(JSON.stringify({
            error: `Failed to update profile: ${profileUpdateError.message}`
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 500
          });
        }
        
        console.log('Profile updated successfully with carried over minutes');
        
        // Log successful subscription update with minute details
        await supabase.rpc('log_webhook_event', {
          event_type: event.type,
          event_data: event.data.object,
          processing_result: 'success',
          user_id: userId,
          subscription_id: subscriptionId,
          customer_id: subscription.customer,
          minutes_before: currentTotal,
          minutes_after: totalMinutes,
          carried_over_minutes: remainingMinutes
        });
        
        // Insert subscription record
        const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
          id: subscriptionId,
          user_id: userId,
          stripe_customer_id: subscription.customer,
          plan_id: priceId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        });
        
        if (subscriptionError) {
          console.error('Error inserting subscription:', subscriptionError);
          // Don't throw here, as the profile update is more important
        } else {
          console.log('Subscription record inserted successfully');
        }
        
        // Try to manually trigger the handle_subscription_update function
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('manually_update_subscription', {
            p_user_id: userId,
            p_subscription_tier: subscriptionTier,
            p_subscription_id: subscriptionId,
            p_customer_id: subscription.customer,
            p_period_start: new Date(subscription.current_period_start * 1000),
            p_period_end: new Date(subscription.current_period_end * 1000)
          });
          
          if (rpcError) {
            console.error('Error calling manually_update_subscription RPC:', rpcError);
          } else {
            console.log('Manually updated subscription successfully');
          }
        } catch (rpcCallError) {
          console.error('Exception calling manually_update_subscription RPC:', rpcCallError);
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Processing customer.subscription.updated event');
        
        let userId = subscription.metadata.user_id;
        if (!userId) {
          // Try to find the user by customer ID
          const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').eq('stripe_customer_id', subscription.customer).limit(1);
          
          if (profilesError) {
            console.error('Error finding user by customer ID:', profilesError);
            throw new Error(`Could not find user for subscription update: ${profilesError.message}`);
          }
          
          if (profiles && profiles.length > 0) {
            userId = profiles[0].id;
            console.log(`Found user by customer ID: ${userId}`);
          } else {
            console.error('Could not find user for subscription update');
            throw new Error('Could not find user for subscription update');
          }
        }
        
        // Get price details to determine plan
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const productId = price.product;
        console.log(`Product ID: ${productId}`);
        
        const product = await stripe.products.retrieve(productId);
        console.log('Retrieved product:', JSON.stringify(product, null, 2));
        
        // Determine subscription tier from product name
        let subscriptionTier = 'intro'; // Default
        if (product.name && product.name.toLowerCase().includes('professional')) {
          subscriptionTier = 'professional';
        } else if (product.name && product.name.toLowerCase().includes('executive')) {
          subscriptionTier = 'executive';
        }
        console.log(`Determined subscription tier: ${subscriptionTier}`);
        
        // Determine if this is an annual subscription
        const isAnnual = price.recurring?.interval === 'year';
        console.log(`Is annual subscription: ${isAnnual}`);

        // Get the new plan minutes
        const newPlanMinutes = getMinutesForPlan(subscriptionTier, isAnnual);
        console.log(`New plan minutes: ${newPlanMinutes}`);

        // Get the user's current profile to calculate carried over minutes
        const { data: currentProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('total_conversation_minutes, used_conversation_minutes')
          .eq('id', userId)
          .single();

        if (profileFetchError) {
          console.error('Error fetching user profile:', profileFetchError);
          // Continue with default values if we can't fetch the profile
        }

        // Calculate minutes to carry over (remaining unused minutes)
        const currentTotal = currentProfile?.total_conversation_minutes || 0;
        const currentUsed = currentProfile?.used_conversation_minutes || 0;
        const remainingMinutes = Math.max(0, currentTotal - currentUsed);
        
        // Add carried over minutes to the new plan minutes
        const totalMinutes = newPlanMinutes + remainingMinutes;
        console.log(`Carrying over ${remainingMinutes} unused minutes. New total: ${totalMinutes}`);

        // Update user profile with subscription info and reset used minutes
        const { error: profileUpdateError } = await supabase.from('profiles').update({
          subscription_tier: subscriptionTier,
          subscription_status: subscription.status,
          current_subscription_id: subscription.id,
          subscription_current_period_start: new Date(subscription.current_period_start * 1000),
          subscription_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end,
          total_conversation_minutes: totalMinutes,
          used_conversation_minutes: 0 // Reset used minutes on subscription renewal
        }).eq('id', userId);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          
          // Log the error but continue with the webhook processing
          await supabase.rpc('log_webhook_event', {
            event_type: event.type,
            event_data: event.data.object,
            processing_result: 'error: profile update failed',
            user_id: userId,
            subscription_id: subscription.id,
            customer_id: subscription.customer,
            minutes_before: currentTotal,
            minutes_after: totalMinutes,
            carried_over_minutes: remainingMinutes
          });
          
          return new Response(JSON.stringify({
            error: `Failed to update profile: ${profileUpdateError.message}`
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 500
          });
        }
        
        console.log('Profile updated successfully with carried over minutes');
        
        // Log successful subscription update with minute details
        await supabase.rpc('log_webhook_event', {
          event_type: event.type,
          event_data: event.data.object,
          processing_result: 'success',
          user_id: userId,
          subscription_id: subscription.id,
          customer_id: subscription.customer,
          minutes_before: currentTotal,
          minutes_after: totalMinutes,
          carried_over_minutes: remainingMinutes
        });
        
        // Update subscription record
        const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: userId,
          stripe_customer_id: subscription.customer,
          plan_id: priceId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          updated_at: new Date()
        });

        if (subscriptionError) {
          console.error('Error updating subscription record:', subscriptionError);
          // Don't throw here, as the profile update is more important
        } else {
          console.log('Subscription record updated successfully');
        }
        
        // Try to manually trigger the handle_subscription_update function
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('manually_update_subscription', {
            p_user_id: userId,
            p_subscription_tier: subscriptionTier,
            p_subscription_id: subscription.id,
            p_customer_id: subscription.customer,
            p_period_start: new Date(subscription.current_period_start * 1000),
            p_period_end: new Date(subscription.current_period_end * 1000)
          });
          
          if (rpcError) {
            console.error('Error calling manually_update_subscription RPC:', rpcError);
          } else {
            console.log('Manually updated subscription successfully');
          }
        } catch (rpcCallError) {
          console.error('Exception calling manually_update_subscription RPC:', rpcCallError);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Processing customer.subscription.deleted event');
        
        let userId = subscription.metadata.user_id;
        if (!userId) {
          // Try to find the user by customer ID
          const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').eq('stripe_customer_id', subscription.customer).limit(1);
          
          if (profilesError) {
            console.error('Error finding user by customer ID:', profilesError);
            throw new Error(`Could not find user for subscription deletion: ${profilesError.message}`);
          }
          
          if (profiles && profiles.length > 0) {
            userId = profiles[0].id;
            console.log(`Found user by customer ID: ${userId}`);
          } else {
            console.error('Could not find user for subscription deletion');
            throw new Error('Could not find user for subscription deletion');
          }
        }
        
        // Update user profile
        const { data: profileData, error: profileError } = await supabase.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          current_subscription_id: null,
          subscription_current_period_end: null,
          subscription_current_period_start: null,
          subscription_cancel_at_period_end: false,
          // Keep the existing total_conversation_minutes to preserve any remaining minutes
          // Don't reset used_conversation_minutes either
        }).eq('id', userId);

        if (profileError) {
          console.error('Error updating profile for subscription deletion:', profileError);
          throw new Error(`Failed to update profile for subscription deletion: ${profileError.message}`);
        }
        console.log('Profile updated successfully for subscription deletion');
        
        // Update subscription record
        const { error: subscriptionError } = await supabase.from('subscriptions').update({
          status: subscription.status || 'canceled',
          canceled_at: new Date(),
          updated_at: new Date()
        }).eq('id', subscription.id);

        if (subscriptionError) {
          console.error('Error updating subscription record for deletion:', subscriptionError);
          // Don't throw here, as the profile update is more important
        } else {
          console.log('Subscription record updated successfully for deletion');
        }
        
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('Processing invoice.paid event');

        // Check if this is a subscription renewal
        const isRenewal = invoice.billing_reason === 'subscription_cycle';
        console.log(`Is subscription renewal: ${isRenewal}`);
        
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        // Find user by customer ID
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1);
        
        if (profilesError) {
          console.error('Error finding user by customer ID for invoice:', profilesError);
          throw new Error(`Could not find user for invoice: ${profilesError.message}`);
        }
        
        if (!profiles || profiles.length === 0) {
          console.error('Could not find user for invoice');
          throw new Error('Could not find user for invoice');
        }
        
        const userId = profiles[0].id;
        console.log(`Found user by customer ID: ${userId}`);
        
        // Insert invoice record
        const { error: invoiceError } = await supabase.from('invoices').upsert({
          id: invoice.id,
          user_id: userId,
          subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          amount_paid: invoice.amount_paid,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status,
          description: invoice.description || `Invoice ${invoice.number}`,
          invoice_pdf: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url,
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paid_at: new Date()
        });
        
        if (invoiceError) {
          console.error('Error inserting invoice record:', invoiceError);
          // Don't throw here, as this is not critical
        } else {
          console.log('Invoice record inserted successfully');
        }

        // If this is a subscription renewal, update the user's conversation minutes
        if (isRenewal && subscriptionId) {
          console.log('Processing subscription renewal');
          
          // Get subscription details
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('plan_id, user_id')
            .eq('id', subscriptionId)
            .single();
            
          if (subscriptionError) {
            console.error('Error fetching subscription:', subscriptionError);
          } else if (subscriptionData) {
            // Get plan details
            const { data: planData, error: planError } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('id', subscriptionData.plan_id)
              .single();
              
            if (planError) {
              console.error('Error fetching plan:', planError);
            } else if (planData) {
              // Get user's current profile
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('total_conversation_minutes, used_conversation_minutes')
                .eq('id', subscriptionData.user_id)
                .single();
                
              if (profileError) {
                console.error('Error fetching profile:', profileError);
              } else if (profileData) {
                // Calculate remaining minutes to carry over
                const remainingMinutes = Math.max(0, profileData.total_conversation_minutes - profileData.used_conversation_minutes);
                const newTotalMinutes = planData.conversation_minutes + remainingMinutes;
                
                // Update profile with new total and reset used minutes
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    total_conversation_minutes: newTotalMinutes,
                    used_conversation_minutes: 0
                  })
                  .eq('id', subscriptionData.user_id);
                  
                if (updateError) {
                  console.error('Error updating profile on renewal:', updateError);
                }
              }
            }
          }
        }
        
        break;
      }
      
      case 'payment_method.attached': {
        const paymentMethod = event.data.object;
        console.log('Processing payment_method.attached event');
        
        const customerId = paymentMethod.customer;
        
        // Find user by customer ID
        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1);
        
        if (profilesError) {
          console.error('Error finding user by customer ID for payment method:', profilesError);
          throw new Error(`Could not find user for payment method: ${profilesError.message}`);
        }
        
        if (!profiles || profiles.length === 0) {
          console.error('Could not find user for payment method');
          throw new Error('Could not find user for payment method');
        }
        
        const userId = profiles[0].id;
        console.log(`Found user by customer ID: ${userId}`);
        
        // Get card details if available
        let cardBrand = null;
        let cardLast4 = null;
        let cardExpMonth = null;
        let cardExpYear = null;
        
        if (paymentMethod.card) {
          cardBrand = paymentMethod.card.brand;
          cardLast4 = paymentMethod.card.last4;
          cardExpMonth = paymentMethod.card.exp_month;
          cardExpYear = paymentMethod.card.exp_year;
        }
        
        // Insert payment method record
        const { error: paymentMethodError } = await supabase.from('payment_methods').upsert({
          id: paymentMethod.id,
          user_id: userId,
          stripe_customer_id: customerId,
          type: paymentMethod.type,
          card_brand: cardBrand,
          card_last4: cardLast4,
          card_exp_month: cardExpMonth,
          card_exp_year: cardExpYear,
          is_default: true
        });
        
        if (paymentMethodError) {
          console.error('Error inserting payment method record:', paymentMethodError);
          // Don't throw here, as this is not critical
        } else {
          console.log('Payment method record inserted successfully');
        }
        
        // Update any existing payment methods to not be default
        const { error: updatePaymentMethodsError } = await supabase.from('payment_methods').update({
          is_default: false
        }).eq('user_id', userId).neq('id', paymentMethod.id);
        
        if (updatePaymentMethodsError) {
          console.error('Error updating existing payment methods:', updatePaymentMethodsError);
          // Don't throw here, as this is not critical
        } else {
          console.log('Existing payment methods updated successfully');
        }
        
        break;
      }
      
      case 'payment_method.detached': {
        const paymentMethod = event.data.object;
        console.log('Processing payment_method.detached event');
        
        // Delete payment method record
        const { error: deletePaymentMethodError } = await supabase.from('payment_methods').delete().eq('id', paymentMethod.id);
        
        if (deletePaymentMethodError) {
          console.error('Error deleting payment method record:', deletePaymentMethodError);
          // Don't throw here, as this is not critical
        } else {
          console.log('Payment method record deleted successfully');
        }
        
        break;
      }
    }

    // Log successful processing
    try {
      await supabase.rpc('log_webhook_event', {
        event_type: event.type,
        event_data: event.data.object,
        processing_result: 'success'
      });
    } catch (logError) {
      console.error('Error logging webhook event:', logError);
    }

    return new Response(JSON.stringify({
      received: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.rpc('log_webhook_event', {
          event_type: 'error',
          event_data: { error: error.message || 'Unknown error' },
          processing_result: 'error'
        });
      }
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
    
    return new Response(JSON.stringify({
      error: error.message || 'Failed to process webhook'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});