import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, MessageSquare, Settings, CreditCard, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isTransparent 
          ? "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/30 dark:border-slate-700/50 py-5 shadow-sm"
          : "bg-gradient-to-br from-white/80 via-blue-50/80 to-purple-100/80 dark:from-slate-900/90 dark:via-blue-900/80 dark:to-purple-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 py-3 shadow-lg"
      )}
    >
      <div className="container-custom mx-auto flex justify-between items-center">
        <Link 
          to="/" 
          className="text-2xl font-bold flex items-center gap-2 transition-colors"
          onClick={closeMenu}
        >
          {/* Logo with glow effect on hover */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-70 blur-md transition-opacity"></div>
            <div className="relative">
              <MessageSquare className={cn(
                "h-6 w-6 transition-colors", 
                isTransparent ? "text-blue-700 dark:text-white" : "text-blue-600 dark:text-blue-400"
              )} />
            </div>
          </div>
          <span className={cn(
            "transition-colors", 
            isTransparent ? "text-blue-900 dark:text-white" : "text-slate-900 dark:text-white"
          )}>
            InterviewAI
          </span>
        </Link>

        {/* Tab-style navigation for landing page */}
        {isHome && !user && (
          <div className={cn(
            "hidden md:flex items-center gap-1 rounded-full p-1 border transition-all duration-300",
            isTransparent 
              ? "bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border-white/30 dark:border-slate-700/50" 
              : "bg-gradient-to-r from-blue-100/60 to-purple-100/60 dark:from-blue-900/40 dark:to-purple-900/40 border-white/20 dark:border-slate-700/50 shadow"
          )}>
            <button
              onClick={() => scrollToSection('features')}
              className={cn(
                "px-4 py-2 rounded-full transition-all text-sm font-medium",
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
                "px-4 py-2 rounded-full transition-all text-sm font-medium",
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
                "px-4 py-2 rounded-full transition-all text-sm font-medium",
                isTransparent 
                  ? "text-blue-900 dark:text-white hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm" 
                  : "text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-sm"
              )}
            >
              About
            </button>
          </div>
        )}

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {/* Theme Toggle */}
          <ThemeToggle 
            size="sm" 
            className={cn(
              "transition-opacity",
              isTransparent ? "opacity-80 hover:opacity-100" : ""
            )}
          />
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-medium", 
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
                            <Badge variant="outline" className="ml-2 text-xs">
                              {user.subscription_tier}
                            </Badge>
                          )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        console.log('Logout button clicked');
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Logout failed:', error);
                          // Force redirect even if logout fails
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
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
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
              "focus:outline-none",
              isTransparent ? "text-white" : "text-foreground"
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

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container-custom mx-auto flex flex-col space-y-3">
            {user ? (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full justify-start gap-2 text-sm"
                      onClick={closeMenu}
                    >
                      <Link to="/settings">
                      <Settings className="h-4 w-4" />
                      Settings
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full justify-start gap-2 text-sm"
                      onClick={closeMenu}
                    >
                      <Link to="/billing">
                      <CreditCard className="h-4 w-4" />
                      Billing
                      </Link>
                    </Button>
                    <Button
                      onClick={async () => {
                        console.log('Mobile logout button clicked');
                        closeMenu();
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Mobile logout failed:', error);
                          // Force redirect even if logout fails
                          window.location.href = '/';
                        }
                      }}
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {isHome && (
                  <>
                    <button
                      onClick={() => scrollToSection('features')}
                      className="py-2 px-4 font-medium text-foreground text-left hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => scrollToSection('pricing')}
                      className="py-2 px-4 font-medium text-foreground text-left hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => scrollToSection('about')}
                      className="py-2 px-4 font-medium text-foreground text-left hover:bg-gray-100 rounded-md transition-colors"
                    >
                      About
                    </button>
                  </>
                )}
                <div className="pt-3 border-t border-gray-200 flex flex-col gap-3">
                  <Button 
                    asChild
                    variant="outline" 
                    className="w-full justify-center"
                    onClick={closeMenu}
                  >
                    <Link to="/login">
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    className="w-full justify-center"
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
      )}
    </nav>
  );
};

export default Navbar;