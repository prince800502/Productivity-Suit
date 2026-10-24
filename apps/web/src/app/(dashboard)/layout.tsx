'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@productivity-suite/ui';
import { 
  LayoutDashboard, Wallet, CheckSquare, Timer, Target, 
  Calendar, BarChart3, Settings, Menu, X, ChevronRight,
  Moon, Sun, LogOut, User, HelpCircle, Sparkles,
  PiggyBank, Flag, Heart, Bot, BellRing, GraduationCap,
  BookOpen, Loader2
} from 'lucide-react';
import { Button, Avatar, Dropdown } from '@productivity-suite/ui';
import { useAuth } from '@productivity-suite/core';
import { useTheme } from '@productivity-suite/ui';
import { useQueryClient } from '@tanstack/react-query';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Budgets', href: '/budgets', icon: PiggyBank },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Goals', href: '/goals', icon: Flag },
  { name: 'Habits', href: '/habits', icon: Heart },
  { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
  { name: 'Routines', href: '/routines', icon: Target },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Attendance', href: '/attendance', icon: BookOpen },
  { name: 'College', href: '/college', icon: GraduationCap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Notifications', href: '/notifications', icon: BellRing },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// User menu items - will be generated dynamically to support loading state
const getUserMenuItems = (isSigningOut: boolean) => [
  { label: 'Profile', value: 'profile', icon: <User className="w-4 h-4" /> },
  { label: 'Settings', value: 'settings', icon: <Settings className="w-4 h-4" /> },
  { label: 'Help & Support', value: 'help', icon: <HelpCircle className="w-4 h-4" /> },
  { divider: true },
  { 
    label: 'Sign Out', 
    value: 'signout', 
    icon: isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />, 
    danger: true,
    disabled: isSigningOut
  },
];

// Dropdown header with user info
const getUserMenuHeader = (profile: any, user: any) => (
  <div className="flex items-center gap-3">
    <Avatar
      src={user?.user_metadata?.avatar_url}
      name={profile?.full_name || user?.email}
      size="md"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
        {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
        {user?.email}
      </p>
    </div>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut: handleSignOut } = useAuth();
  const { toggleTheme, resolvedMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const queryClient = useQueryClient();

  // Client-side auth guard: redirect to login if user becomes null while on a protected route
  // This handles bfcache restoration where middleware doesn't run
  useEffect(() => {
    if (user === null) {
      // Clear all React Query cached data to prevent stale data exposure
      queryClient.clear();
      // Use replace to avoid adding login to history (Back button won't return to stale dashboard)
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [user, pathname, router, queryClient]);

  // Handle bfcache restoration: force auth re-check when page is shown from bfcache
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache, trigger a router refresh to re-run middleware
        router.refresh();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  const handleUserSelect = async (value: string) => {
    if (value === 'signout') {
      setIsSigningOut(true);
      try {
        await handleSignOut();
        // Clear React Query cache immediately
        queryClient.clear();
        // Use replace to replace the dashboard entry in history with homepage
        // This prevents Back button from returning to stale dashboard
        router.replace('/');
      } catch (error) {
        console.error('Sign out error:', error);
      } finally {
        setIsSigningOut(false);
      }
    } else if (value === 'settings') {
      router.push('/settings');
    } else if (value === 'profile') {
      router.push('/settings'); // Settings page defaults to Profile tab
    } else if (value === 'help') {
      // No dedicated help page yet - could open external docs or show toast
      // For now, navigate to settings which has notification preferences
      router.push('/settings');
    }
  };

  // If no user, don't render dashboard content (will redirect via useEffect above)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-transparent relative">
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="Productivity Suite Home">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                Productivity Suite
              </span>
            </Link>
            <button
              className="ml-auto lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main">
            <ul role="list" className="space-y-1">
              {navigation.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden',
                        isActive
                          ? 'bg-primary-500/10 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary-500/10 before:to-secondary-500/10'
                          : 'text-neutral-600 hover:bg-neutral-100/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="relative z-10 flex items-center justify-center w-5 h-5">
                        <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      </span>
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.user_metadata?.avatar_url}
                name={profile?.full_name || user?.email}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-strong border-b">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 lg:hidden" />

            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <Button
                variant="glass"
                size="sm"
                icon={resolvedMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
              />

              {/* User menu */}
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" className="gap-2 p-1.5">
                    <Avatar
                      src={user?.user_metadata?.avatar_url}
                      name={profile?.full_name || user?.email}
                      size="sm"
                    />
                    <span className="hidden sm:block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Button>
                }
                items={getUserMenuItems(isSigningOut)}
                onSelect={handleUserSelect}
                align="right"
                header={getUserMenuHeader(profile, user)}
              />
            </div>
          </div>
        </header>

        {/* Page content - reduced top padding to eliminate blank space */}
        <main className="px-4 sm:px-6 lg:px-8 py-4" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}