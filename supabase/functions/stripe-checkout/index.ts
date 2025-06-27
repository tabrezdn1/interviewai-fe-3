import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'npm:stripe@12.4.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Database } from '../_shared/database.types.ts';
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

    // Log environment variable status (without revealing actual values)
    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Stripe API key is not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables are not set');
      return new Response(
        JSON.stringify({ error: 'Database configuration is incomplete' }),
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
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    const { price_id, user_id, success_url, cancel_url } = requestBody;
    
    console.log('Creating checkout session with:', { 
      price_id, 
      user_id, 
      success_url, 
      cancel_url 
    });

    if (!price_id || !user_id || !success_url || !cancel_url) {
      console.error('Missing required parameters:', { price_id, user_id, success_url, cancel_url });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Processing checkout for:', { price_id, user_id });
    
    // Verify the price exists in Stripe
    try {
      const price = await stripe.prices.retrieve(price_id);
      console.log('Price verified:', price.id);
    } catch (priceError) {
      console.error('Error retrieving price from Stripe:', priceError);
      return new Response(
        JSON.stringify({ 
          error: `Invalid price ID: ${priceError.message}`,
          code: priceError.code || 'invalid_price'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: `User profile not found: ${profileError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
      user_id
    );

    if (userError || !user) {
      console.error('Error fetching user:', userError || 'User not found');
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError?.message || 'User not found'}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Check if user already has a Stripe customer ID
    let customerId = profile.stripe_customer_id;

    console.log('Customer check:', { hasExistingCustomer: !!customerId });

    // If not, create a new customer
    if (!customerId) {
      try {
        console.log('Creating new Stripe customer for user:', user.email);
        const customer = await stripe.customers.create({
          email: user.email,
          name: profile.name,
          metadata: {
            user_id: user_id,
          },
        });
        
        customerId = customer.id;
        console.log('Created new Stripe customer:', customerId);
        console.log('Customer details:', customer);
        
        // Update profile with Stripe customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user_id);
          
        if (updateError) {
          console.error('Error updating profile with customer ID:', updateError);
          // Continue anyway since we have the customer ID
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        return new Response(
          JSON.stringify({ error: `Failed to create customer: ${stripeError.message}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // Create checkout session
    let session;
    try {
      console.log('Creating checkout session with:', {
        customer: customerId,
        price: price_id,
        success_url,
        cancel_url,
        metadata: { user_id }
      });
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url,
        metadata: {
          user_id: user_id,
        },
        subscription_data: {
          metadata: {
            user_id: user_id,
          },
        },
      });
      
      console.log('Checkout session created:', session.id);
      console.log('Session URL:', session.url);
    } catch (stripeError) {
      console.error('Error creating checkout session:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: `Stripe checkout error: ${stripeError.message}`,
          code: stripeError.code || 'unknown_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});