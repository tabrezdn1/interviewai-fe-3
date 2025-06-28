import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Breadcrumb from './Breadcrumb';
import BackButton from './BackButton';
import { ProtectedRoute } from '../auth/ProtectedRoute';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  showBreadcrumb?: boolean;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ 
  children, 
  showBackButton = true,
  showBreadcrumb = true
}) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <div className="pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 relative overflow-hidden">
          {/* Full-screen fixed gradient background */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Light theme: soft blue/purple gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:hidden" />
            {/* Dark theme: pure black background only */}
            <div className="absolute inset-0 hidden dark:block bg-black" />
          </div>
          {/* Subtle animated bubbles */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-700/10 dark:to-purple-700/10"
                style={{
                  width: Math.random() * 100 + 40,
                  height: Math.random() * 100 + 40,
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
                }}
                animate={{
                  y: [0, Math.random() * 30 - 15],
                  x: [0, Math.random() * 30 - 15],
                  scale: [1, 1.08, 1],
                  opacity: [0.10, 0.18, 0.10],
                }}
                transition={{
                  duration: 16 + Math.random() * 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <div className="container-custom mx-auto relative z-10">
            {showBreadcrumb && <Breadcrumb />}
            {showBackButton && <BackButton className="mb-4" />}
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AuthenticatedLayout;