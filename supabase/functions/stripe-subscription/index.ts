import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'npm:stripe@12.4.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables are not set');
      return new Response(
        JSON.stringify({ error: 'Database configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { user_id } = requestBody;

    if (!user_id) {
      console.error('Missing user_id parameter');
      return new Response(
        JSON.stringify({ error: 'Missing user_id parameter' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Fetching profile for user:', user_id);

    // Get user profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, current_subscription_id')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: `Database error: ${profileError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!profile) {
      console.error('Profile not found for user:', user_id);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log('Profile found:', {
      hasStripeCustomerId: !!profile.stripe_customer_id,
      hasCurrentSubscriptionId: !!profile.current_subscription_id
    });

    if (!profile.stripe_customer_id) {
      // User doesn't have a Stripe customer ID yet
      console.log('User has no Stripe customer ID');
      return new Response(
        JSON.stringify(null),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If user has a subscription ID, fetch it directly
    if (profile.current_subscription_id) {
      try {
        console.log('Fetching subscription by ID:', profile.current_subscription_id);
        const subscription = await stripe.subscriptions.retrieve(profile.current_subscription_id);
        
        return new Response(
          JSON.stringify({
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            product_id: subscription.items.data[0]?.price?.product,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (stripeError) {
        // If subscription not found or other error, continue to list subscriptions
        console.warn('Error fetching subscription by ID:', stripeError.message);
      }
    }

    // List all subscriptions for the customer
    console.log('Listing subscriptions for customer:', profile.stripe_customer_id);
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscriptions found
      console.log('No active subscriptions found');
      return new Response(
        JSON.stringify(null),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Return the first active subscription
    const subscription = subscriptions.data[0];
    console.log('Found active subscription:', subscription.id);
    
    return new Response(
      JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        product_id: subscription.items.data[0]?.price?.product,
        cancel_at_period_end: subscription.cancel_at_period_end,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Unexpected error in stripe-subscription function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});