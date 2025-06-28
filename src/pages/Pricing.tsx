import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Loader2, ArrowRight, CreditCard 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils.tsx';
import { useAuth } from '../hooks/useAuth';
import { stripeService, PRICING_PLANS } from '../services/StripeService';
import { getPlanIconComponent } from '../lib/utils.tsx';
import Breadcrumb from '../components/layout/Breadcrumb';

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user } = useAuth();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  const faqs = [
    {
      question: 'How do the AI interview sessions work?',
      answer: 'Our AI interviewer conducts realistic video interviews tailored to your role and industry. You\'ll receive real-time feedback on your responses, body language, and overall performance.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to your plan features until the end of your billing period.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 7-day money-back guarantee for all plans. If you\'re not satisfied within the first week, we\'ll provide a full refund.'
    },
    {
      question: 'What types of interviews can I practice?',
      answer: 'You can practice technical interviews, behavioral interviews, case studies, and industry-specific scenarios across various fields including tech, finance, consulting, and more.'
    }
  ];

  const getPrice = (planId: string) => {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return 0;
    
    const priceInCents = isAnnual ? plan.yearly.price : plan.monthly.price;
    return priceInCents / 100;
  };

  const getSavings = (planId: string) => {
    if (!isAnnual) return 0;
    
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan || !plan.yearly.originalPrice) return 0;
    
    return (plan.yearly.originalPrice - plan.yearly.price) / 100;
  };

  const getMinutes = (planId: string) => {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return 0;
    
    return isAnnual ? plan.yearly.minutes : plan.monthly.minutes;
  };

  const getStripePriceId = (planId: string) => {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) return '';
    
    return isAnnual ? plan.yearly.stripe_price_id : plan.monthly.stripe_price_id;
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    
    setIsCreatingCheckout(true);
    setCheckoutPlanId(getStripePriceId(planId));
    
    try {
      const session = await stripeService.createCheckoutSession(
        getStripePriceId(planId),
        user.id,
        `${window.location.origin}/billing?success=true`,
        `${window.location.origin}/pricing?canceled=true`
      );
      
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsCreatingCheckout(false);
      setCheckoutPlanId(null);
    }
  };

  return (
    <>
      <Breadcrumb />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-medium mb-4 dark:bg-slate-800 dark:text-blue-200">
          <CreditCard className="h-4 w-4" />
          <span>Pricing Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Get started with our AI-powered interview practice. All plans include personalized feedback and performance analytics.
        </p>
      </motion.div>

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center mb-8 sm:mb-12"
      >
        <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl inline-flex relative shadow-inner w-full max-w-xs">
          <div className="flex relative z-10 w-full">
            <button 
              onClick={() => setIsAnnual(false)}
              className={cn(
                "flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                !isAnnual 
                  ? "text-white dark:text-white" 
                  : "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
              )}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={cn(
                "flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                isAnnual 
                  ? "text-white dark:text-white" 
                  : "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
              )}
            >
              Annual <span className="text-green-700 dark:text-green-300 text-xs ml-1">20%</span>
            </button>
            
            {/* Sliding background */}
            <div 
              className={cn(
                "absolute top-1 bottom-1 bg-gradient-to-r from-primary to-accent dark:from-blue-700 dark:to-purple-700 rounded-lg shadow-lg transition-all duration-300 ease-out",
                isAnnual ? "left-[50%] right-1" : "left-1 right-[50%]"
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {Object.values(PRICING_PLANS).map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
              "relative h-full flex flex-col",
              plan.popular ? 'scale-105' : ''
            )}
          >
            <Card className={cn(
              "flex flex-col h-full",
              plan.popular ? 'border-primary-500 shadow-xl' : 'border-gray-200 dark:border-slate-700',
              'bg-white dark:bg-slate-900/90'
            )}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={cn(
                  "w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center",
                  `bg-${plan.color}-100 dark:bg-${plan.color}-900`
                )}>
                  <div className={cn(`text-${plan.color}-600 dark:text-${plan.color}-300`)}>
                    {getPlanIconComponent(plan.icon)}
                  </div>
                </div>
                <CardTitle className="text-xl dark:text-slate-100">{plan.name}</CardTitle>
                <CardDescription className="dark:text-slate-300">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold dark:text-slate-100">${getPrice(plan.id)}</span>
                    <span className="text-gray-500 dark:text-slate-300 ml-1">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                      {getMinutes(plan.id)} conversation minutes
                    </span>
                  </div>
                  {isAnnual && getSavings(plan.id) > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500 dark:text-slate-400 line-through">
                        ${(PRICING_PLANS[plan.id as keyof typeof PRICING_PLANS].yearly.originalPrice || 0) / 100}/year
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-300 font-medium ml-2">
                        Save ${getSavings(plan.id)}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <ul className="space-y-3 mb-6">
                  {stripeService.getPlanFeatures(plan.id, isAnnual ? 'yearly' : 'monthly').map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-300 flex-shrink-0 mt-0.5" />
                      <span className="text-sm dark:text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  asChild 
                  className={cn(
                    "w-full mt-auto",
                    plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                  )}
                  variant={plan.popular ? 'default' : 'outline'} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubscribe(plan.id);
                  }}
                  disabled={isCreatingCheckout && checkoutPlanId === getStripePriceId(plan.id)}
                >
                  <span>
                    {isCreatingCheckout && checkoutPlanId === getStripePriceId(plan.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-12 sm:mb-16"
      >
        <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl dark:text-slate-100">Feature Comparison</CardTitle>
            <CardDescription className="dark:text-slate-300">
              See what's included in each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-sm sm:text-base">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="text-left py-3 px-4 dark:text-slate-200">Features</th>
                    <th className="text-center py-3 px-4 dark:text-slate-200">Intro</th>
                    <th className="text-center py-3 px-4 dark:text-slate-200">Professional</th>
                    <th className="text-center py-3 px-4 dark:text-slate-200">Executive</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-slate-700">
                    <td className="py-3 px-4 dark:text-slate-300">Conversation Minutes</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">60/month</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">330/month</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">900/month</td>
                  </tr>
                  <tr className="border-b dark:border-slate-700">
                    <td className="py-3 px-4 dark:text-slate-300">Video Analysis</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">-</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-600 dark:text-green-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-600 dark:text-green-300 mx-auto" /></td>
                  </tr>
                  <tr className="border-b dark:border-slate-700">
                    <td className="py-3 px-4 dark:text-slate-300">1-on-1 Coaching</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">-</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">-</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-600 dark:text-green-300 mx-auto" /></td>
                  </tr>
                  <tr className="border-b dark:border-slate-700">
                    <td className="py-3 px-4 dark:text-slate-300">Priority Support</td>
                    <td className="text-center py-3 px-4 dark:text-slate-300">-</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-600 dark:text-green-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-600 dark:text-green-300 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <div className="mb-12 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Everything you need to know about our pricing and features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 dark:text-slate-100">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-slate-300 text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Pricing;