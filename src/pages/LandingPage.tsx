import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, MessageSquare, BarChart2, Brain, Check, ArrowRight, 
  ExternalLink, Star, Sparkles, ArrowUpRight, Code, Lightbulb, 
  BookOpen, Compass, Award, Users, Clock, Laptop, User, CalendarDays,
  Play, Eye, Camera, Mic, Monitor, Zap, Target, TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils.tsx';
import { testimonials, siteStats } from '../data/testimonials';
import { useAuth } from '../hooks/useAuth';
import { PRICING_PLANS } from '../services/StripeService';
import { getPlanIconComponent } from '../lib/utils.tsx';

const LandingPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Bolt Badge - Clean without glow */}
      <div className="fixed top-20 right-4 z-40 sm:top-6 sm:right-6 md:top-20 md:right-6 lg:top-20 lg:right-8">
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group block"
        >
          <div className="relative bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 sm:p-2">
            <img 
              src="/white_circle_360x360.png" 
              alt="Powered by Bolt.new" 
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain rounded-full"
              loading="lazy"
            />
          </div>
          
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap">
              Powered by Bolt.new
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </a>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 backdrop-blur-xl"
              style={{
                width: Math.random() * 400 + 100,
                height: Math.random() * 400 + 100,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 50 - 25],
                x: [0, Math.random() * 50 - 25],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        
        <div className="container-custom mx-auto relative z-10 pt-32 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="mb-8 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md text-white border border-white/20">
                  <Video className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">World's First AI Video Interview Platform</span>
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                  Practice Interviews with
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Real AI Humans
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                  Experience the future of interview preparation. Talk face-to-face with AI interviewers that look, sound, and respond like real humans.
                </p>

                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <Video className="h-6 w-6 text-blue-400" />
                    <span className="text-white font-medium">Live Video</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <Mic className="h-6 w-6 text-green-400" />
                    <span className="text-white font-medium">Real Voice</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <Brain className="h-6 w-6 text-purple-400" />
                    <span className="text-white font-medium">AI Feedback</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button asChild size="lg" className="group font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 border-0 text-lg px-8 py-4">
                    <Link to="/login?signup=true">
                      <Play className="mr-3 h-5 w-5" />
                      Start Video Interview
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4">
                    <a href="#demo">
                      <Eye className="mr-2 h-5 w-5" />
                      Watch Demo
                    </a>
                  </Button>
                </div>
                
                <div className="mt-12 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-3 border-white overflow-hidden shadow-lg">
                        <img 
                          src={`https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${20 + i}.jpg`} 
                          alt="User avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-white">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300">
                      <strong className="text-white">2,500+</strong> successful interviews this month
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                {/* Main Video Demo */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated video call interface */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50"></div>
                    
                    {/* AI Interviewer */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-2xl">
                        <User className="h-24 w-24 text-white" />
                      </div>
                    </div>
                    
                    {/* Video call UI elements */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-3 py-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Live Interview</span>
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-lg px-3 py-2">
                      <span className="text-white text-sm">15:42</span>
                    </div>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Mic className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">End</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating feedback cards */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="absolute -right-8 top-1/4"
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/20 transform rotate-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Excellent Eye Contact!</span>
                      </div>
                      <p className="text-sm text-gray-600">Confidence: 94%</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                    className="absolute -left-8 bottom-1/4"
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/20 transform -rotate-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Smart Response</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Floating tech badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
                >
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-blue-400" />
                      <span className="text-white text-sm font-medium">4K Video</span>
                    </div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <span className="text-white text-sm font-medium">Real-time AI</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <a 
            href="#features" 
            className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
          >
            <span className="text-sm mb-2">Discover the Future</span>
            <motion.div 
              className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1"
              initial={{ y: 0 }}
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                className="w-1 h-2 bg-white rounded-full"
                initial={{ y: 0 }}
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm border-y border-white/10">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {siteStats.map((stat, index) => (
              <StatCard key={index} number={stat.number} label={stat.label} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-4 border border-blue-400/30">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span>Revolutionary Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading text-white">Beyond Traditional Practice</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Experience interview preparation like never before with our cutting-edge AI technology.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Video className="h-8 w-8 text-blue-400" />}
              title="Lifelike AI Interviewers"
              description="Talk face-to-face with AI that looks and responds like real humans. No more chatbots or voice-only interactions."
              delay={0}
            />
            
            <FeatureCard 
              icon={<Eye className="h-8 w-8 text-purple-400" />}
              title="Real-time Body Language Analysis"
              description="Get instant feedback on your posture, eye contact, and facial expressions during the interview."
              delay={0.1}
            />
            
            <FeatureCard 
              icon={<Brain className="h-8 w-8 text-green-400" />}
              title="Adaptive AI Responses"
              description="Our AI adapts to your answers in real-time, creating truly dynamic interview experiences."
              delay={0.2}
            />
            
            <FeatureCard 
              icon={<Target className="h-8 w-8 text-orange-400" />}
              title="Industry-Specific Scenarios"
              description="Practice with AI interviewers trained for specific roles, companies, and industries."
              delay={0.3}
            />
            
            <FeatureCard 
              icon={<TrendingUp className="h-8 w-8 text-red-400" />}
              title="Performance Analytics"
              description="Track your improvement with detailed metrics on confidence, clarity, and technical accuracy."
              delay={0.4}
            />
            
            <FeatureCard 
              icon={<Award className="h-8 w-8 text-yellow-400" />}
              title="Personalized Coaching"
              description="Receive tailored feedback and improvement plans based on your unique interview style."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-32 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading text-white">See It In Action</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Watch how our AI interviewers provide realistic, engaging interview experiences.
              </p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-lg px-8 py-4">
                  <Play className="mr-3 h-6 w-6" />
                  Watch Demo Video
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-gradient-to-br from-purple-900 via-slate-900 to-blue-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-4 border border-purple-400/30">
                <Award className="h-4 w-4 text-purple-400" />
                <span>Simple Pricing</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading text-white">Choose Your Plan</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Get started with our AI-powered video interview practice. All plans include conversation minutes and personalized feedback.
              </p>
            </motion.div>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl inline-flex relative shadow-inner border border-white/20">
              <div className="flex relative z-10">
                <button 
                  onClick={() => setIsAnnual(false)}
                  className={cn(
                    "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                    !isAnnual 
                      ? "text-white" 
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setIsAnnual(true)}
                  className={cn(
                    "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 relative z-10",
                    isAnnual 
                      ? "text-white" 
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  Annual <span className="text-green-400 text-xs ml-1">Save 20%</span>
                </button>
                
                {/* Sliding background */}
                <div 
                  className={cn(
                    "absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg transition-all duration-300 ease-out",
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
                buttonText={plan.id === 'intro' ? "Start Free Trial" : 
                           plan.id === 'professional' ? "Get Started" : 
                           "Contact Sales"}
                delay={index * 0.1}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm">
              All plans include a 7-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-300 text-sm font-medium mb-4 border border-green-400/30">
                <Compass className="h-4 w-4 text-green-400" />
                <span>Simple Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading text-white">How It Works</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Get started with AI video interviews in three simple steps
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <ProcessCard 
              number="01" 
              title="Choose Your Interview" 
              description="Select the job role, interview type, and AI interviewer that matches your target position."
            />
            <ProcessCard 
              number="02" 
              title="Start Video Interview" 
              description="Engage in a realistic face-to-face conversation with our advanced AI interviewer."
            />
            <ProcessCard 
              number="03" 
              title="Get AI Feedback" 
              description="Receive detailed analysis on your performance, body language, and areas for improvement."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium mb-4 border border-orange-400/30">
                <Users className="h-4 w-4 text-orange-400" />
                <span>Success Stories</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading text-white">What Our Users Say</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Join thousands who have improved their interview skills and landed their dream jobs
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <TestimonialCard 
                key={index}
                quote={testimonial.quote}
                name={testimonial.name}
                title={testimonial.title}
                image={testimonial.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-4 border border-blue-400/30">
                <User className="h-4 w-4 text-blue-400" />
                <span>About</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 font-heading text-white">About InterviewAI</h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-gray-300 mb-8">
                  This product was developed by Tabrez.
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-lg border border-white/20">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Built with Innovation</h3>
                  <p className="text-gray-300">
                    InterviewAI represents the cutting edge of AI-powered career preparation, 
                    combining advanced machine learning with practical interview coaching to help 
                    job seekers succeed in today's competitive market.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 z-0"></div>
            <div className="absolute inset-0 z-0 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bg-white/10 rounded-full"
                  style={{
                    width: Math.random() * 100 + 50,
                    height: Math.random() * 100 + 50,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                ></div>
              ))}
            </div>
            
            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-heading">
                    Ready to Ace Your Next Interview?
                  </h2>
                  <p className="text-white/90 text-lg mb-8 md:mb-0 max-w-xl">
                    Join thousands of job seekers who have improved their interview skills and landed their dream jobs with AI video practice.
                  </p>
                </div>
                <Button asChild size="lg" className="group whitespace-nowrap font-semibold bg-white text-blue-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4">
                  <Link to="/login?signup=true">
                    <Play className="mr-3 h-5 w-5" />
                    Start Video Interview
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="text-2xl font-bold flex items-center gap-2 mb-4 text-white">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span>InterviewAI</span>
              </Link>
              <p className="text-gray-400 mb-6 max-w-md">
                InterviewAI helps job seekers prepare for interviews with AI-powered video simulations, personalized feedback, and expert coaching.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-1-4.8 4-8.5 8-5 1.6 1.5 2 2 2 2z"></path>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-4 text-white">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-4 text-white">Company</h3>
              <ul className="space-y-3">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© 2025 InterviewAI. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface StatCardProps {
  number: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ number, label }) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20"
    >
      <p className="text-3xl md:text-4xl font-bold text-white mb-1">{number}</p>
      <p className="text-gray-300">{label}</p>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group"
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden hover:bg-white/15">
        {/* Accent border that appears on hover */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-300 transition-colors text-white">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <div className="mt-auto pt-4">
          <a href="#" className="text-blue-400 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
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
      className={`relative bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-lg border ${
        plan.popular ? 'border-blue-400 shadow-xl scale-105 bg-white/15' : 'border-white/20'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2 text-white">{plan.name}</h3>
        <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
        <div className="mb-2">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-gray-300 ml-1">{period}</span>
        </div>
        {originalPrice && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-400 line-through">
              {originalPrice}
            </span>
            <span className="text-sm text-green-400 font-medium">
              Save 20%
            </span>
          </div>
        )}
        {!isAnnual && (
          <p className="text-sm text-gray-300">
            Billed monthly
          </p>
        )}
      </div>
      
      <ul className="space-y-3 mb-8">
        {[...features, ...plan.id === 'intro' 
          ? ['Basic feedback analysis', 'Standard question library', 'Email support', 'Progress tracking', 'Mobile app access']
          : plan.id === 'professional'
            ? ['Advanced feedback & coaching', 'Industry-specific questions', 'Video analysis & tips', 'Priority support', 'Performance analytics']
            : ['Executive-level scenarios', 'Custom interview prep', '1-on-1 coaching calls', 'White-glove support', 'Advanced analytics']
        ].map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        asChild 
        className={`w-full ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
        variant={plan.popular ? 'default' : 'outline'}
      >
        <Link to="/login?signup=true">
          {buttonText}
        </Link>
      </Button>
    </motion.div>
  );
};

interface ProcessCardProps {
  number: string;
  title: string;
  description: string;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ number, title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Connection line */}
      <div className="hidden md:block absolute top-10 left-1/2 w-full h-1 bg-white/20 -z-10 rounded-full"></div>
      
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {number}
          </div>
          {/* Animated pulse effect */}
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse-slow"></div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </motion.div>
  );
};

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  image: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title, image }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all"
    >
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-medium text-white">{name}</p>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;