import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, Download, AlertCircle, Check,
  Settings, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getConversationMinutes, getProfile, type ConversationMinutes } from '../services/ProfileService';
import { stripeService, PRICING_PLANS } from '../services/StripeService';
import { getPlanIconComponent } from '../lib/utils.tsx';
import { cn } from '../lib/utils.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import BackButton from '../components/layout/BackButton';
import Breadcrumb from '../components/layout/Breadcrumb';

const Billing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [conversationMinutes, setConversationMinutes] = useState<ConversationMinutes | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    const loadBillingData = async () => {
      if (user) {
        try {
          setLoading(true);
          setStripeError(null);
          // Fetch all billing data in parallel
          const [minutes, profile] = await Promise.all([
            getConversationMinutes(user.id),
            getProfile(user.id)
          ]);
          
          setConversationMinutes(minutes);
          setUserProfile(profile);
          
          // Fetch subscription separately to handle potential errors
          try {
            const subscription = await stripeService.getSubscription(user.id);
            setSubscription(subscription);
          } catch (subscriptionError) {
            console.error('Failed to load subscription data:', subscriptionError);
            setStripeError('Unable to load subscription information. Some features may be limited.');
            setSubscription(null);
          }            
          try {            
            // For invoices, fetch real data from Supabase
            const invoiceHistory = await stripeService.getBillingHistory(user.id);
            setInvoices(invoiceHistory);
          } catch (billingError) {
            console.error('Failed to load billing data:', billingError);
            // Fall back to empty arrays if there's an error
            setInvoices([]);
          }
        } catch (error) {
          console.error('Error loading billing data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Initial data load
    loadBillingData();
  }, [user]);

  const handleManageBilling = async () => {
    if (stripeError) {
      // Show error message if Stripe service is unavailable
      alert('Billing management is currently unavailable. Please try again later.');
      return;
    }
    
    if (!userProfile?.stripe_customer_id) {
      console.error('No Stripe customer ID found');
      alert('No billing information found. Please contact support if you believe this is an error.');
      return;
    }
    
    setIsLoadingPortal(true);
    try {
      const { url } = await stripeService.createPortalSession(
        userProfile.stripe_customer_id,
        `${window.location.origin}/billing`
      );
      
      // Redirect to Stripe portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (stripeError) {
      // Show error message if Stripe service is unavailable
      alert('Subscription management is currently unavailable. Please try again later.');
      return;
    }
    
    if (!subscription?.id) {
      console.error('No subscription ID found');
      return;
    }
    
    setIsCancelling(true);
    try {
      const success = await stripeService.cancelSubscription(subscription.id);
      if (success) {
        // Update local state
        setSubscription({
          ...subscription,
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleSubscribe = async (stripePriceId: string) => {
    try {
      const { url } = await stripeService.createCheckoutSession(stripePriceId, user!.id);
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const currentSubscription = {
    plan: userProfile?.subscription_tier || 'free',
    status: userProfile?.subscription_status || 'inactive',
    price: userProfile?.subscription_tier === 'professional' ? '$199' : userProfile?.subscription_tier === 'executive' ? '$499' : userProfile?.subscription_tier === 'intro' ? '$39' : 'Free',
    period: subscription?.cancel_at_period_end ? 'until period end' : 'month',
    nextBilling: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] : '2025-02-15',
    minutesUsed: conversationMinutes?.used || 0,
    minutesTotal: conversationMinutes?.total || 60,
    daysLeft: subscription?.current_period_end ? Math.max(0, Math.floor((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  };

  const mockPaymentMethods = [
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '2027',
      isDefault: true
    },
    {
      id: '2',
      type: 'mastercard',
      last4: '8888',
      expiryMonth: '08',
      expiryYear: '2026',
      isDefault: false
    }
  ];

  const mockBillingHistory = [
    {
      id: '1',
      date: '2025-01-15',
      amount: '$59.00',
      status: 'paid',
      description: 'Professional Plan - Monthly',
      invoice: 'INV-2025-001'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-12 relative overflow-hidden">
      <div className="container-custom mx-auto">
        <Breadcrumb />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">
            Manage your subscription and billing history
          </p>
          {stripeError && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800 text-sm">{stripeError}</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Current Subscription and Billing History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Subscription */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        {getPlanIconComponent('Star')}
                        Current Subscription
                      </CardTitle>
                      <CardDescription>Your active plan and usage</CardDescription>
                    </div>
                    <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {currentSubscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{currentSubscription.plan} Plan</h3>
                      <p className="text-2xl font-bold text-primary mb-1">
                        {currentSubscription.price}
                        <span className="text-sm font-normal text-gray-500">/{currentSubscription.period}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Next billing: {new Date(currentSubscription.nextBilling).toLocaleDateString()}
                      </p>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleUpgrade}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Change Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Change Your Plan</DialogTitle>
                              <DialogDescription>
                                Choose a plan and billing cycle that best fits your interview preparation needs
                              </DialogDescription>
                            </DialogHeader>
                            
                            {/* Billing Toggle */}
                            <div className="flex justify-center mb-6">
                              <div className="bg-gray-100 p-1 rounded-xl inline-flex relative shadow-inner">
                                <div className="flex relative z-10">
                                  <button 
                                    onClick={() => setIsAnnual(false)}
                                    className={cn(
                                      "px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 relative z-10",
                                      !isAnnual 
                                        ? "text-white" 
                                        : "text-gray-600 hover:text-gray-800"
                                    )}
                                  >
                                    Monthly
                                  </button>
                                  <button 
                                    onClick={() => setIsAnnual(true)}
                                    className={cn(
                                      "px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 relative z-10",
                                      isAnnual 
                                        ? "text-white" 
                                        : "text-gray-600 hover:text-gray-800"
                                    )}
                                  >
                                    Annual <span className="text-green-600 text-xs ml-1">20%</span>
                                  </button>
                                  
                                  {/* Sliding background */}
                                  <div 
                                    className={cn(
                                      "absolute top-1 bottom-1 bg-gradient-to-r from-primary to-accent rounded-lg shadow-lg transition-all duration-300 ease-out",
                                      isAnnual ? "left-[50%] right-1" : "left-1 right-[50%]"
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                              {Object.values(PRICING_PLANS).map((plan) => (
                                <div
                                  key={plan.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedPlan === plan.id
                                      ? 'border-primary bg-primary/5'
                                      : 'border-gray-200 hover:border-gray-300'
                                  } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
                                  onClick={() => setSelectedPlan(plan.id)}
                                >
                                  {plan.popular && (
                                    <Badge className="mb-2 bg-primary text-white">Most Popular</Badge>
                                  )}
                                  <div className="flex items-center gap-2 mb-2">
                                    {getPlanIconComponent(plan.icon)}
                                    <h3 className="font-semibold">{plan.name}</h3>
                                  </div>
                                  <div className="mb-1">
                                    <p className="text-2xl font-bold">
                                      ${isAnnual ? (plan.yearly.price / 100) : (plan.monthly.price / 100)}
                                      <span className="text-sm font-normal text-gray-500">/{isAnnual ? 'year' : 'month'}</span>
                                    </p>
                                    {isAnnual && plan.yearly.originalPrice && (
                                      <div className="flex items-center justify-center gap-2 text-sm">
                                        <span className="text-gray-500 line-through">
                                          ${plan.yearly.originalPrice / 100}/year
                                        </span>
                                        <span className="text-green-600 font-medium">
                                          Save ${(plan.yearly.originalPrice - plan.yearly.price) / 100}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {isAnnual ? plan.yearly.minutes : plan.monthly.minutes} 
                                    minutes/{isAnnual ? 'year' : 'month'}
                                  </p>
                                  <ul className="space-y-1">
                                    {stripeService.getPlanFeatures(plan.id, isAnnual ? 'yearly' : 'monthly').map((feature, index) => (
                                      <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                                        <Check className="h-3 w-3 text-green-600" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                              <Button variant="outline" onClick={() => setSelectedPlan('professional')}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => {
                                  const plan = Object.values(PRICING_PLANS).find(p => p.id === selectedPlan);
                                  if (plan) {
                                    const stripePriceId = isAnnual ? plan.yearly.stripe_price_id : plan.monthly.stripe_price_id;
                                    handleSubscribe(stripePriceId);
                                  }
                                }}
                              >
                                <span className="flex items-center gap-1">
                                  Upgrade to {Object.values(PRICING_PLANS).find(p => p.id === selectedPlan)?.name}
                                  <ChevronRight className="h-4 w-4" />
                                </span>
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelSubscription}
                          disabled={isCancelling || stripeError}
                        >
                          {isCancelling ? 'Cancelling...' : (
                            stripeError ? 'Service Unavailable' : 'Cancel Subscription'
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Usage This Month</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Conversation Minutes</span>
                            <span>{currentSubscription.minutesUsed}/{currentSubscription.minutesTotal}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(currentSubscription.minutesUsed / currentSubscription.minutesTotal) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {currentSubscription.daysLeft} days left in current billing cycle
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
              
            {/* Billing History */}
            {userProfile?.subscription_tier !== 'free' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                      <Calendar className="h-5 w-5 text-primary" />
                      Billing History
                    </CardTitle>
                    <CardDescription className="dark:text-slate-300">Your recent invoices and payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invoices && invoices.length > 0 ? (
                        <div className="overflow-y-auto max-h-96 custom-scrollbar pr-2">
                          {invoices.slice(0, 3).map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg mb-3 bg-white dark:bg-slate-800/80"
                            >
                              <div>
                                <p className="font-medium dark:text-slate-100">{invoice.description}</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                  {new Date(invoice.date).toLocaleDateString()} • {invoice.invoice}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                <div className="text-right">
                                  <p className="font-medium dark:text-slate-100">{invoice.amount}</p>
                                  <Badge 
                                    variant={invoice.status === 'paid' ? 'success' : 'outline'}
                                    className={invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                                {invoice.invoice_pdf && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-slate-400">
                          <p>No billing history available yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1"></div>
        </div>
      </div>
    </div>
  );
};

export default Billing;