import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to dark theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const currentTheme = savedTheme || 'dark';
    
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`animate-pulse bg-muted rounded-lg ${getSizeClasses(size)} ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg border border-border bg-background
        text-foreground transition-all duration-300
        hover:bg-muted hover:border-primary/30
        focus:outline-none focus:ring-2 focus:ring-primary/20
        active:scale-95
        ${getSizeClasses(size)}
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {/* Sun Icon */}
        <Sun 
          className={`
            transition-all duration-300 ease-in-out
            ${theme === 'light' 
              ? 'rotate-0 scale-100 text-warning' 
              : 'rotate-90 scale-0 text-muted-foreground'
            }
          `}
          size={getIconSize(size)}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            absolute inset-0 transition-all duration-300 ease-in-out
            ${theme === 'dark' 
              ? 'rotate-0 scale-100 text-primary' 
              : '-rotate-90 scale-0 text-muted-foreground'
            }
          `}
          size={getIconSize(size)}
        />
      </div>
      
      {/* Glow effect */}
      <div 
        className={`
          absolute inset-0 rounded-lg transition-all duration-300
          ${theme === 'dark' 
            ? 'shadow-theme-glow' 
            : 'shadow-none'
          }
        `}
      />
    </button>
  );
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'w-8 h-8';
    case 'md':
      return 'w-10 h-10';
    case 'lg':
      return 'w-12 h-12';
    default:
      return 'w-10 h-10';
  }
};

const getIconSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 16;
    case 'md':
      return 20;
    case 'lg':
      return 24;
    default:
      return 20;
  }
};

export default ThemeToggle; 