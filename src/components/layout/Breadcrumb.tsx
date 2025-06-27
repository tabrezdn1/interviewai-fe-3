import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const items: BreadcrumbItem[] = [];
    
    // Always start with Dashboard (except for landing page and login)
    if (path !== '/' && path !== '/login' && path !== '/pricing') {
      items.push({ label: 'Dashboard', path: '/dashboard' });
    }
    
    // Add specific breadcrumb items based on current path
    if (path === '/setup') {
      items.push({ label: 'Interview Setup', path: '/setup', isActive: true });
    } else if (path.startsWith('/interview/')) {
      items.push({ label: 'Interview Setup', path: '/setup' });
      items.push({ label: 'Interview Session', path: path, isActive: true });
    } else if (path.startsWith('/feedback/')) {
      items.push({ label: 'Interview Feedback', path: path, isActive: true });
    } else if (path === '/settings') {
      items.push({ label: 'Settings', path: '/settings', isActive: true });
    } else if (path === '/billing') {
      items.push({ label: 'Billing', path: '/billing', isActive: true });
    } else if (path === '/pricing') {
      items.push({ label: 'Home', path: '/' });
      items.push({ label: 'Pricing', path: '/pricing', isActive: true });
    }
    
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();
  
  // Don't show breadcrumb on dashboard, landing page, or login
  if (location.pathname === '/dashboard' || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {item.isActive ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;