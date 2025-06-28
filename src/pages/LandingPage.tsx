import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Video, MessageSquare, Brain, Check, ArrowRight, 
  Play, Target, TrendingUp, Sparkles,
  Clock, Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils.tsx';
import { useAuth } from '../hooks/useAuth';
import { PRICING_PLANS } from '../services/StripeService';
import Navbar from '../components/layout/Navbar';

const marqueeLogos = [
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg', alt: 'Supabase', label: 'Supabase' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', alt: 'TypeScript', label: 'TypeScript' },
  { src: '/tavus.jpeg', alt: 'Tavus', label: 'Tavus' },
  { src: '/vite.png', alt: 'Vite', label: 'Vite' },
  { src: '/white_circle_360x360.png', alt: 'Bolt', label: 'Bolt' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', alt: 'PostgreSQL', label: 'PostgreSQL' },
  { src: '/openai.jpeg', alt: 'OpenAI', label: 'OpenAI' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', alt: 'Node.js', label: 'Node.js' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', alt: 'React', label: 'React' },
  { src: '/zustand.svg', alt: 'Zustand', label: 'Zustand' },
  { src: '/tailwind.png', alt: 'Tailwind CSS', label: 'Tailwind' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg', alt: 'ESLint', label: 'ESLint' },
];

const LandingPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 100]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain" />
      </div>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navbar />
      {/* Sticky Bolt badge below navbar, only on Landing Page */}
      <div className="relative">
        <div className="sticky top-[64px] sm:top-[80px] z-40 flex justify-end pointer-events-none">
          <a
            href="https://bolt.new/"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto mr-4 mt-2 group relative"
          >
            <img
              src="/white_circle_360x360.png"
              alt="Powered by Bolt.new"
              className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain rounded-full shadow-lg transition-all duration-300 md:hover:shadow-[0_0_40px_10px_rgba(99,102,241,0.4),0_0_80px_20px_rgba(168,85,247,0.3)] md:focus:shadow-[0_0_40px_10px_rgba(99,102,241,0.4),0_0_80px_20px_rgba(168,85,247,0.3)]"
              loading="lazy"
            />
            <div className="absolute left-1/2 md:left-auto md:right-0 top-full mt-2 -translate-x-1/2 md:translate-x-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 py-1 rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg whitespace-nowrap">
                Powered by Bolt.new
              </div>
            </div>
          </a>
        </div>
        <div className="min-h-screen bg-slate-50 dark:bg-black overflow-hidden">
          {/* Animated Background Elements */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10" />
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/10 dark:to-purple-400/10"
                style={{
                  width: Math.random() * 300 + 50,
                  height: Math.random() * 300 + 50,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, Math.random() * 100 - 50],
                  x: [0, Math.random() * 100 - 50],
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center pt-16 sm:pt-20">
            <div className="container-custom mx-auto relative z-10">
              <div className="max-w-6xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{ y }}
                >
                  {/* AI Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/20 dark:to-purple-400/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 mb-6 sm:mb-8"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <span className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-medium">AI-Powered Interview Platform</span>
                  </motion.div>
                  
                  {/* Main Headline */}
                  <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-tight"
                  >
                    <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                      Master Your
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Interview Skills
                    </span>
                  </motion.h1>
                  
                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4"
                  >
                    Experience the future of interview preparation with AI-powered video simulations. 
                    Practice with lifelike AI interviewers and get instant, personalized feedback.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button asChild size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl w-full sm:w-auto">
                        <Link to="/login?signup=true">
                          <Play className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                          Start Free Trial
                          <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button asChild variant="outline" size="lg" className="group border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl w-full sm:w-auto">
                        <Link to="#features">
                          <Video className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                          See How It Works
                        </Link>
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Trust Indicators */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Free trial available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Cancel anytime</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Marquee Section (Technologies and Partners) */}
          <div className="overflow-hidden w-full relative h-20 my-8">
            <div className="absolute left-0 top-0 flex animate-marquee-loop w-max">
              {/* LOGOS SET 1 */}
              {marqueeLogos.map(({ src, alt, label }) => (
                <div key={alt + '-1'} className="flex flex-col items-center min-w-[100px] mx-6">
                  <img src={src} alt={alt} className="h-10 w-10 object-contain mb-1" />
                  <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                </div>
              ))}
              {/* LOGOS SET 2 (duplicate for seamless loop) */}
              {marqueeLogos.map(({ src, alt, label }) => (
                <div key={alt + '-2'} className="flex flex-col items-center min-w-[100px] mx-6">
                  <img src={src} alt={alt} className="h-10 w-10 object-contain mb-1" />
                  <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <section id="features" className="section-lg relative">
            <div className="container-custom mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 sm:mb-16 lg:mb-20"
              >
                <h2 className="heading-responsive font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Why Choose InterviewAI?
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4">
                  Experience the most advanced AI-powered interview preparation platform
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {[
                  {
                    icon: Video,
                    title: "Lifelike AI Interviewers",
                    description: "Practice with AI that looks, sounds, and responds like real humans",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: Brain,
                    title: "Real-time AI Feedback",
                    description: "Get instant analysis on your responses, body language, and confidence",
                    gradient: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: Target,
                    title: "Industry-Specific Scenarios",
                    description: "Practice with AI trained for your specific role and industry",
                    gradient: "from-indigo-500 to-blue-500"
                  },
                  {
                    icon: TrendingUp,
                    title: "Performance Analytics",
                    description: "Track your improvement with detailed metrics and insights",
                    gradient: "from-green-500 to-emerald-500"
                  },
                  {
                    icon: Clock,
                    title: "24/7 Availability",
                    description: "Practice anytime, anywhere with no scheduling conflicts",
                    gradient: "from-orange-500 to-red-500"
                  },
                  {
                    icon: Shield,
                    title: "Safe Practice Environment",
                    description: "Build confidence in a judgment-free space designed for learning",
                    gradient: "from-teal-500 to-cyan-500"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <div className="card-responsive border border-white/20 dark:border-slate-700/50 shadow-responsive bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-responsive hover-responsive">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Demo Section */}
          <section id="demo" className="section-lg relative">
            <div className="container-custom mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 sm:mb-16"
              >
                <h2 className="heading-responsive font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  See It In Action
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4">
                  Watch how our AI interviewers provide realistic, engaging interview experiences
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto px-4"
              >
                <div className="relative rounded-responsive overflow-hidden shadow-responsive-lg border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-xl">
                      <Play className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                      Watch Demo Video
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="section-lg relative">
            <div className="container-custom mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 sm:mb-16 lg:mb-20"
              >
                <h2 className="heading-responsive font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Choose Your Plan
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4">
                  Start your interview preparation journey with our flexible pricing plans
                </p>
              </motion.div>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-8 sm:mb-12">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl inline-flex relative shadow-xl border border-white/20 dark:border-slate-700/50">
                  <div className="flex relative z-10">
                    <button 
                      onClick={() => setIsAnnual(false)}
                      className={cn(
                        "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                        !isAnnual 
                          ? "text-slate-900 dark:text-white" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => setIsAnnual(true)}
                      className={cn(
                        "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                        isAnnual 
                          ? "text-slate-900 dark:text-white" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Yearly
                    </button>
                    
                    <div 
                      className={cn(
                        "absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg transition-all duration-300 ease-out",
                        isAnnual ? "left-[50%] right-1" : "left-1 right-[50%]"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {Object.values(PRICING_PLANS).map((plan, index) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    isAnnual={isAnnual}
                    buttonText="Get Started"
                    delay={index * 0.1}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-32 relative">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-4xl mx-auto"
              >
                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Ready to Ace Your Next Interview?
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                  Join thousands of job seekers who have improved their interview skills and landed their dream jobs
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0 text-lg px-8 py-4 rounded-xl">
                    <Link to="/login?signup=true">
                      <Play className="mr-3 h-5 w-5" />
                      Start Free Trial
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Meet the Creator Section (above footer, styled to match hero) */}
          <section id="about" className="relative py-24 overflow-hidden">
            {/* Minimal animated bubbles background (Framer Motion) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-400/20 dark:to-purple-400/20"
                  style={{
                    width: Math.random() * 120 + 40,
                    height: Math.random() * 120 + 40,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, Math.random() * 60 - 30, 0],
                    x: [0, Math.random() * 60 - 30, 0],
                    scale: [1, 1.15, 1],
                    opacity: [0.12, 0.22, 0.12],
                  }}
                  transition={{
                    duration: 12 + Math.random() * 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Meet the Creator of InterviewAI
                </h2>
                <div className="mx-auto w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full mb-4"></div>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white/90 via-blue-50/80 to-purple-100/80 dark:from-slate-900/90 dark:via-blue-900/80 dark:to-purple-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 dark:border-slate-700/50 p-8 md:p-12">
                  <img
                    src="/tabrezavatar.png"
                    alt="Shaik Tabrez Avatar"
                    className="w-32 h-32 rounded-full border-4 border-blue-500/30 dark:border-blue-400/30 shadow-lg object-cover bg-white dark:bg-slate-800 mb-6 md:mb-0"
                    loading="lazy"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">Shaik Tabrez</div>
                    <div className="text-blue-700 dark:text-blue-300 font-medium mb-2 text-lg">Software Engineer · Full-Stack · Machine Learning · Cloud Solutions · Generative AI</div>
                    <div className="text-slate-600 dark:text-slate-300 text-base mb-4 max-w-2xl mx-auto md:mx-0">
                      Tabrez is a Software Engineer with 5 years of experience in full-stack development, Generative AI, and cloud-native solutions. He's worked with startups and enterprises, building scalable apps using JavaScript, Python, Node.js, FastAPI, React, Next.js, and more. Tabrez is passionate about Machine Learning, Generative AI, CLoud Automation, and delivering real impactful results fast.
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                      {['Full-Stack', 'Machine Learning', 'Cloud Solutions', 'DevOps', 'Microservices', 'Generative AI'].map((tag) => (
                        <span key={tag} className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/20 dark:to-purple-400/20 text-xs text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full font-medium">{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-3 justify-center md:justify-start">
                      <a href="https://github.com/tabrezdn1" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.338 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
                      </a>
                      <a href="https://www.linkedin.com/in/shaik-tabrez/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8a6 6 0 016 6v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a2 2 0 00-4 0v4a1 1 0 01-1 1H7a1 1 0 01-1-1v-5a6 6 0 016-6z"/><circle cx="8.5" cy="8.5" r="1.5"/><rect x="2" y="2" width="20" height="20" rx="5"/></svg>
                      </a>
                      <a href="https://www.hackerrank.com/tabrezdn1" target="_blank" rel="noopener noreferrer" aria-label="HackerRank" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M12 7v10m5-5H7" strokeWidth="2" strokeLinecap="round"/></svg>
                      </a>
                      <a href="https://x.com/tabrezdn1" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="hover:text-black dark:hover:text-white transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.53 6.47a.75.75 0 0 1 1.06 1.06l-10 10a.75.75 0 1 1-1.06-1.06l10-10z"/><path d="M6.47 6.47a.75.75 0 0 1 1.06 0l10 10a.75.75 0 1 1-1.06 1.06l-10-10a.75.75 0 0 1 0-1.06z"/></svg>
                      </a>
                      <a href="mailto:tabrezdn1@gmail.com" aria-label="Email" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M22 6.5l-10 7-10-7" strokeWidth="2" strokeLinecap="round"/></svg>
                      </a>
                      <a href="https://shaiktabrez.com" target="_blank" rel="noopener noreferrer" aria-label="Website" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                      </a>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Contact: <a href="mailto:tabrezdn1@gmail.com" className="underline hover:text-blue-600 dark:hover:text-blue-400">tabrezdn1@gmail.com</a></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-16 border-t border-white/20 dark:border-slate-700/50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Existing Footer Columns */}
                <div>
                  <h3 className="font-medium text-lg mb-4 text-slate-900 dark:text-white">Product</h3>
                  <ul className="space-y-3">
                    <li><a href="#demo" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Demo</a></li>
                    <li><a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Features</a></li>
                    <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">API</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-4 text-slate-900 dark:text-white">Company</h3>
                  <ul className="space-y-3">
                    <li><a href="#about" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">About</a></li>
                    <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Blog</a></li>
                    <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Careers</a></li>
                    <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Contact</a></li>
                  </ul>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <Link to="/" className="text-2xl font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <span>InterviewAI</span>
                  </Link>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">
                    The most advanced AI-powered interview preparation platform. Practice with lifelike AI interviewers and get instant, personalized feedback.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-white/20 dark:border-slate-700/50 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-600 dark:text-slate-300 mb-4 md:mb-0">© 2025 InterviewAI. All rights reserved.</p>
                <div className="flex gap-6">
                  <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Privacy Policy</a>
                  <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

interface PricingCardProps {
  plan: typeof PRICING_PLANS[keyof typeof PRICING_PLANS];
  isAnnual: boolean;
  buttonText: string;
  delay: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isAnnual, buttonText, delay }) => {
  const price = isAnnual 
    ? `$${(plan.yearly.price / 100)}`
    : `$${(plan.monthly.price / 100)}`;
    
  const period = isAnnual ? 'year' : 'month';
  
  const originalPrice = isAnnual && plan.yearly.originalPrice 
    ? `$${(plan.yearly.originalPrice / 100)}/year` 
    : undefined;
    
  const features = isAnnual
    ? [`${plan.yearly.minutes} conversation minutes/year`]
    : [`${plan.monthly.minutes} conversation minutes/month`];
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border ${
        plan.popular 
          ? 'border-blue-500/50 shadow-2xl scale-105 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20' 
          : 'border-white/20 dark:border-slate-700/50 hover:border-blue-500/30 dark:hover:border-blue-400/30'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{plan.name}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{plan.description}</p>
        <div className="mb-2">
          <span className="text-4xl font-bold text-slate-900 dark:text-white">{price}</span>
          <span className="text-slate-600 dark:text-slate-400 ml-1">/{period}</span>
        </div>
        {originalPrice && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
              {originalPrice}
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Save 20%
            </span>
          </div>
        )}
      </div>
      
      <ul className="space-y-3 mb-8">
        {[...features, ...plan.id === 'intro' 
          ? ['Basic feedback analysis', 'Standard question library', 'Email support', 'Progress tracking']
          : plan.id === 'professional'
            ? ['Advanced feedback & coaching', 'Industry-specific questions', 'Video analysis & tips', 'Priority support']
            : ['Executive-level scenarios', 'Custom interview prep', '1-on-1 coaching calls', 'White-glove support']
        ].map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        asChild 
        className={`w-full ${
          plan.popular 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl' 
            : 'bg-white dark:bg-slate-800 border border-white/20 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
        } rounded-xl`}
        variant={plan.popular ? 'default' : 'outline'}
      >
        <Link to="/login?signup=true">
          {buttonText}
        </Link>
      </Button>
    </motion.div>
  );
};

export default LandingPage;