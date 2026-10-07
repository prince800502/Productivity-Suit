'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@productivity-suite/ui';
import { 
  LayoutDashboard, Wallet, CheckSquare, Timer, Target, 
  Calendar, BarChart3, Settings, Menu, X, ChevronRight,
  Moon, Sun, Bell, LogOut, User, HelpCircle, Sparkles,
  PiggyBank, Flag, Heart, Bot, BellRing
} from 'lucide-react';
import { Button, Avatar, Dropdown, Tooltip } from '@productivity-suite/ui';
import { useAuth, signOut } from '@productivity-suite/core';

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
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Notifications', href: '/notifications', icon: BellRing },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const userMenuItems = [
  { label: 'Profile', value: 'profile', icon: User as any },
  { label: 'Settings', value: 'settings', icon: Settings as any },
  { label: 'Help & Support', value: 'help', icon: HelpCircle as any },
  { divider: true },
  { label: 'Sign Out', value: 'signout', icon: LogOut as any, danger: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut: handleSignOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleUserSelect = async (value: string) => {
    setUserMenuOpen(false);
    if (value === 'signout') {
      await handleSignOut();
    } else if (value === 'settings') {
      router.push('/settings');
    } else if (value === 'profile') {
      router.push('/settings/profile');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
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

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:hidden" />

            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <Tooltip content="Toggle theme" position="bottom">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Moon className="w-5 h-5" />}
                  aria-label="Toggle dark mode"
                />
              </Tooltip>

              {/* Notifications */}
              <Tooltip content="Notifications" position="bottom">
                <Button variant="ghost" size="sm" icon={<Bell className="w-5 h-5" />} aria-label="Notifications" />
              </Tooltip>

              {/* User menu */}
              <Dropdown
                trigger={
                  <Tooltip content="User menu" position="bottom">
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
                  </Tooltip>
                }
                items={userMenuItems}
                onSelect={handleUserSelect}
                align="right"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}