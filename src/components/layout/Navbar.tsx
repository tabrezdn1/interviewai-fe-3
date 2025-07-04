import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, Home, Settings, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getConversationMinutes } from '../../services/ProfileService';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { ThemeToggle } from '../ui/theme-toggle';
import { cn } from '../../lib/utils.tsx';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [conversationMinutes, setConversationMinutes] = useState<{total: number, used: number, remaining: number} | null>(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const minutes = await getConversationMinutes(user.id);
          setConversationMinutes(minutes);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    
    loadUserData();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    closeMenu();
  };

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isTransparent 
            ? "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/30 dark:border-slate-700/50 py-3 sm:py-4 lg:py-5 shadow-sm"
            : "bg-gradient-to-br from-white/80 via-blue-50/80 to-purple-100/80 dark:from-slate-900/90 dark:via-blue-900/80 dark:to-purple-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 py-2 sm:py-3 shadow-lg"
        )}
      >
        <div className="container-custom mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-xl sm:text-2xl font-bold flex items-center gap-2 transition-colors"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
              closeMenu();
            }}
          >
            {/* Brand Logo */}
            <img
              src="/interviewai-logo.png"
              alt="InterviewAI Logo"
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
              style={{ display: 'block' }}
            />
            <span className={cn(
              "transition-colors",
              isTransparent ? "text-blue-900 dark:text-white" : "text-slate-900 dark:text-white"
            )}>
              InterviewAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Landing page navigation */}
            {isHome && !user && (
              <div className={cn(
                "flex items-center gap-1 rounded-full p-1 border transition-all duration-300",
                isTransparent 
                  ? "bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border-white/30 dark:border-slate-700/50" 
                  : "bg-gradient-to-r from-blue-100/60 to-purple-100/60 dark:from-blue-900/40 dark:to-purple-900/40 border-white/20 dark:border-slate-700/50 shadow"
              )}>
                <button
                  onClick={() => scrollToSection('features')}
                  className={cn(
                    "px-3 py-2 rounded-full transition-all text-sm font-medium",
                    isTransparent 
                      ? "text-blue-900 dark:text-white hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm" 
                      : "text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm"
                  )}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className={cn(
                    "px-3 py-2 rounded-full transition-all text-sm font-medium",
                    isTransparent 
                      ? "text-blue-900 dark:text-white hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm" 
                      : "text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm"
                  )}
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className={cn(
                    "px-3 py-2 rounded-full transition-all text-sm font-medium",
                    isTransparent 
                      ? "text-blue-900 dark:text-white hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm" 
                      : "text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm"
                  )}
                >
                  About
                </button>
              </div>
            )}

            {/* User menu */}
            {user && (
              <div className="flex items-center gap-4">
                {/* Conversation minutes indicator */}
                {conversationMinutes && (
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {conversationMinutes.remaining}/{conversationMinutes.total} min
                    </span>
                  </div>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden xl:flex flex-col">
                        <span className={cn(
                          "font-medium text-sm", 
                          isTransparent ? "text-white" : "text-foreground"
                        )}>
                          {user.name}
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4", 
                        isTransparent ? "text-white" : "text-foreground"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                        {user.subscription_tier && user.subscription_tier !== 'free' && (
                          <Badge className="ml-2" variant="secondary">{user.subscription_tier}</Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pricing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Logout failed:', error);
                          window.location.href = '/';
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Auth buttons */}
            {!user && (
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm" className={cn(isTransparent ? "hover:bg-white/10" : "", "text-blue-700 dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600")}>
                  <Link to="/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="hover:bg-blue-700 dark:hover:bg-blue-600">
                  <Link to="/login?signup=true">
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle 
              size="sm" 
              className={cn(
                "transition-opacity",
                isTransparent ? "opacity-80 hover:opacity-100" : ""
              )}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Theme Toggle for Mobile */}
            <ThemeToggle 
              size="sm" 
              className={cn(
                "transition-opacity",
                isTransparent ? "opacity-80 hover:opacity-100" : ""
              )}
            />
            
            <button 
              className={cn(
                "focus:outline-none p-1 rounded-md transition-colors",
                isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
            
            {/* Mobile Menu */}
            <motion.div 
              className="lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l shadow-xl z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6">
                {/* Close button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={closeMenu}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {user ? (
                  <>
                    {/* User info */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-primary-100 text-primary-700 text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Conversation minutes */}
                      {conversationMinutes && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {conversationMinutes.remaining} of {conversationMinutes.total} minutes remaining
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Navigation links */}
                    <div className="space-y-2 mb-6">
                      <Button 
                        asChild 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-base h-12"
                        onClick={closeMenu}
                      >
                        <Link to="/dashboard">
                          <Home className="h-5 w-5" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-base h-12"
                        onClick={closeMenu}
                      >
                        <Link to="/settings">
                          <Settings className="h-5 w-5" />
                          Settings
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-base h-12"
                        onClick={closeMenu}
                      >
                        <Link to="/billing">
                          <CreditCard className="h-5 w-5" />
                          Billing
                          {user.subscription_tier && user.subscription_tier !== 'free' && (
                            <Badge variant="outline" className="ml-2">
                              {user.subscription_tier}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-base h-12"
                        onClick={closeMenu}
                      >
                        <Link to="/pricing">
                          <CreditCard className="h-5 w-5" />
                          Pricing
                        </Link>
                      </Button>
                    </div>
                    
                    {/* Logout */}
                    <Button
                      onClick={async () => {
                        console.log('Mobile logout button clicked');
                        closeMenu(); // Close mobile menu first
                        console.log('Calling logout function from mobile menu');
                        try {
                          await logout();
                          console.log('Mobile logout function completed successfully');
                        } catch (error) {
                          console.error('Mobile logout failed:', error);
                          window.location.href = '/';
                          console.log('Forcing redirect to home page after mobile logout error');
                        }
                      }}
                      variant="outline"
                      className="w-full justify-start gap-3 text-base h-12"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Landing page navigation for non-authenticated users */}
                    {isHome && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Navigation</h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => scrollToSection('features')}
                            className="w-full text-left py-3 px-4 font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            Features
                          </button>
                          <button
                            onClick={() => scrollToSection('pricing')}
                            className="w-full text-left py-3 px-4 font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            Pricing
                          </button>
                          <button
                            onClick={() => scrollToSection('about')}
                            className="w-full text-left py-3 px-4 font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            About
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Auth buttons */}
                    <div className="space-y-3">
                      <Button 
                        asChild
                        variant="outline" 
                        className="w-full justify-center h-12 text-base"
                        onClick={closeMenu}
                      >
                        <Link to="/login">
                          Sign In
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        className="w-full justify-center h-12 text-base"
                        onClick={closeMenu}
                      >
                        <Link to="/login?signup=true">
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;