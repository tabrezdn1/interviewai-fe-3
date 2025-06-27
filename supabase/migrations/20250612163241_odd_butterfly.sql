/*
  # Populate Subscription Plans
  
  1. Insert subscription plans matching the pricing page
  2. Set up default plans for intro, professional, and executive tiers
*/

-- Insert subscription plans
INSERT INTO subscription_plans (id, name, description, amount, currency, interval_type, conversation_minutes, features) VALUES
-- Intro Monthly
('price_intro_monthly', 'Intro', 'Perfect for getting started', 3900, 'usd', 'month', 60, 
 '["60 conversation minutes/month", "Basic feedback analysis", "Standard question library", "Email support", "Progress tracking", "Mobile app access"]'),

-- Intro Annual
('price_intro_annual', 'Intro', 'Perfect for getting started', 44500, 'usd', 'year', 720,
 '["720 conversation minutes/year", "Basic feedback analysis", "Standard question library", "Email support", "Progress tracking", "Mobile app access"]'),

-- Professional Monthly
('price_professional_monthly', 'Professional', 'Most popular for job seekers', 19900, 'usd', 'month', 330,
 '["330 conversation minutes/month", "Advanced feedback & coaching", "Industry-specific questions", "Video analysis & tips", "Priority support", "Performance analytics", "Custom interview scenarios", "Resume optimization tips"]'),

-- Professional Annual
('price_professional_annual', 'Professional', 'Most popular for job seekers', 226800, 'usd', 'year', 3960,
 '["3960 conversation minutes/year", "Advanced feedback & coaching", "Industry-specific questions", "Video analysis & tips", "Priority support", "Performance analytics", "Custom interview scenarios", "Resume optimization tips"]'),

-- Executive Monthly
('price_executive_monthly', 'Executive', 'For senior-level positions', 49900, 'usd', 'month', 900,
 '["900 conversation minutes/month", "Executive-level scenarios", "Custom interview prep", "1-on-1 coaching calls", "White-glove support", "Advanced analytics", "Leadership assessments", "Salary negotiation guidance", "Personal brand coaching"]'),

-- Executive Annual
('price_executive_annual', 'Executive', 'For senior-level positions', 539100, 'usd', 'year', 10800,
 '["10800 conversation minutes/year", "Executive-level scenarios", "Custom interview prep", "1-on-1 coaching calls", "White-glove support", "Advanced analytics", "Leadership assessments", "Salary negotiation guidance", "Personal brand coaching"]')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  conversation_minutes = EXCLUDED.conversation_minutes,
  features = EXCLUDED.features,
  updated_at = NOW();