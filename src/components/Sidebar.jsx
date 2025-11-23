import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, Users, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'Manage Users', href: '/admin/users', icon: Users },
];

export function Sidebar({ user, userRole, onSignOut }) {
  const location = useLocation();
  
  // Combine navigation items based on user role
  const navigation = userRole === 'admin' 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">RapidRecall</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userRole === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
