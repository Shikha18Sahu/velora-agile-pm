import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import { 
  LayoutDashboard, 
  FolderKanban, 
  LogOut, 
  Menu, 
  X, 
  User,
  Zap
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-900 text-dark-100">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-dark-950 border-b border-dark-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-brand-500 fill-brand-500" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            Velora
          </span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsDropdown />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-dark-400 hover:text-dark-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Menu Overlay) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-dark-800 border-r border-dark-700 p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-brand-500 fill-brand-500" />
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                  Velora
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-dark-400 hover:text-dark-100 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const Active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      Active 
                        ? 'bg-brand-500 text-white shadow-premium shadow-brand-500/10' 
                        : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-dark-700 pt-6 mt-6">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="h-10 w-10 rounded-full bg-dark-700 flex items-center justify-center border border-dark-600 text-brand-400 font-semibold uppercase">
                  {user?.name?.substring(0, 2) || <User className="h-5 w-5" />}
                </div>
                <div className="truncate">
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-800 border-r border-dark-700/60 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <Zap className="h-7 w-7 text-brand-500 fill-brand-500" />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              Velora
            </span>
          </div>
          <NotificationsDropdown />
        </div>

        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const Active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  Active 
                    ? 'bg-brand-500 text-white shadow-premium shadow-brand-500/10' 
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card Widget */}
        <div className="border-t border-dark-700/60 pt-6 mt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 font-bold uppercase select-none">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : <User className="h-5 w-5" />}
            </div>
            <div className="truncate">
              <p className="font-semibold text-sm truncate text-dark-100">{user?.name}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
