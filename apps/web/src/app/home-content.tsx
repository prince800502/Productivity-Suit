import Link from 'next/link';
import { Button } from '@productivity-suite/ui';
import { 
  Wallet, CheckSquare, Timer, Target, Calendar, BarChart3, 
  Moon, Sun, Shield, Zap, Sparkles, ArrowRight 
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Expense Tracking',
    description: 'Track daily spends, categorize expenses, set budgets, and visualize your spending patterns with beautiful charts.',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Organize tasks with priorities, due dates, tags, and subtasks. Kanban board and list views included.',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Built-in focus timer with customizable sessions, break intervals, and session analytics.',
  },
  {
    icon: Target,
    title: 'Routine Builder',
    description: 'Create daily routines, track streaks, and build habits with smart reminders and progress tracking.',
  },
  {
    icon: Calendar,
    title: 'Smart Schedule',
    description: 'Upload your timetable and academic calendar. Get class reminders and holiday notifications automatically.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Deep analytics on spending, productivity, focus time, and routine completion rates.',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '1M+', label: 'Tasks Completed' },
  { value: '500K+', label: 'Focus Hours' },
  { value: '99.9%', label: 'Uptime' },
];

export default function HomePageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                Productivity Suite
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#stats" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Stats
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              <span>New: AI-powered insights & smart scheduling</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 animate-slide-up">
              Your Personal <span className="gradient-text">Productivity Hub</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              Track expenses, manage tasks, focus with Pomodoro, build routines, and organize your schedule — all in one beautiful, cross-platform app.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Start Free — No Credit Card
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Secure & Private
              </span>
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4" />
                <Sun className="w-4 h-4" />
                Dark & Light Mode
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Real-time Sync
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <div className="flex-1 text-center text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                  dashboard.productivity-suite.app
                </div>
              </div>
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Expense Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Monthly Budget</h3>
                      <span className="badge badge-md badge-primary">On Track</span>
                    </div>
                    <div className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">$2,340</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">of $3,000 budget • 78% used</div>
                    <div className="mt-4 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: '78%' }} />
                    </div>
                  </div>

                  {/* Task Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Today's Tasks</h3>
                      <span className="badge badge-md badge-success">3/5 Done</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Review quarterly report', done: true },
                        { title: 'Team sync meeting', done: true },
                        { title: 'Code review for PR #234', done: false },
                        { title: 'Update documentation', done: false },
                        { title: 'Plan sprint retrospective', done: false },
                      ].map((task, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'bg-success-500 border-success-500 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                            {task.done && <CheckSquare className="w-3 h-3" />}
                          </div>
                          <span className={`text-sm ${task.done ? 'text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-300'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pomodoro Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Focus Session</h3>
                      <span className="badge badge-md badge-warning">Active</span>
                    </div>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          className="text-neutral-200 dark:text-neutral-800"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="50"
                          cx="64"
                          cy="64"
                        />
                        <circle
                          className="text-primary-500 transition-all duration-1000 ease-linear"
                          strokeWidth="4"
                          strokeDasharray="314"
                          strokeDashoffset="94"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="50"
                          cx="64"
                          cy="64"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold font-mono text-neutral-900 dark:text-white">18:42</span>
                      </div>
                    </div>
                    <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Session 3 of 4 • Deep Work
                    </div>
                  </div>

                  {/* Routine Card */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">Daily Routines</h3>
                      <span className="badge badge-md badge-secondary">12 Day Streak</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Morning meditation', time: '7:00 AM', done: true },
                        { title: 'Exercise', time: '7:30 AM', done: true },
                        { title: 'Read 20 pages', time: '8:00 PM', done: false },
                        { title: 'Plan tomorrow', time: '10:00 PM', done: false },
                      ].map((routine, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${routine.done ? 'bg-success-500 border-success-500 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                              {routine.done && <CheckSquare className="w-3 h-3" />}
                            </div>
                            <div>
                              <p className={`text-sm ${routine.done ? 'text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {routine.title}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{routine.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32 bg-white dark:bg-neutral-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Everything You Need to <span className="gradient-text">Stay Productive</span>
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">
              Powerful features designed to work together seamlessly across all your devices.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card p-6 card-hover animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-neutral-900 dark:bg-neutral-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-lg text-neutral-300 mb-8">
              Join thousands of users who have already streamlined their daily workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-neutral-900 hover:bg-neutral-100 gap-2">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-neutral-500 text-sm">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                Productivity Suite
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © 2024 Productivity Suite. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}