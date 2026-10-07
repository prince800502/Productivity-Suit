# Productivity Suite

A comprehensive cross-platform productivity application built with Next.js, React Native (Expo), Supabase, and a custom design system. Track expenses, manage tasks, focus with Pomodoro, build routines, and organize your schedule — all in one beautiful app.

## ✨ Features

### 💰 Expense Tracking
- Track daily spends with categories
- Set monthly budgets with visual progress
- Recurring expenses support
- Beautiful charts and analytics
- Export data (CSV/JSON)

### ✅ Task Management
- Kanban board and list views
- Priorities (Low, Medium, High, Urgent)
- Due dates and reminders
- Subtasks and tags
- Drag-and-drop reordering

### 🍅 Pomodoro Timer
- Customizable focus/break intervals
- Session history and analytics
- Streak tracking
- Background notifications
- Keyboard shortcuts

### 🎯 Routine Builder
- Daily, weekdays, weekends, or custom frequency
- Streak tracking with visual progress
- Completion reminders
- Time-of-day scheduling

### 📅 Smart Schedule
- Weekly recurring events
- Class/work/personal/appointment types
- Holiday management
- ICS/CSV import support
- Today's view with notifications

### 📊 Analytics Dashboard
- Spending trends and category breakdowns
- Task completion rates
- Focus time analytics
- Routine streak tracking
- Weekly/monthly comparisons

### 🌙 Dark/Light Mode
- System preference detection
- Manual toggle
- Persistent across devices
- Beautiful in both themes

### 🔐 Authentication
- Email/password signup/login
- OAuth (Google, GitHub)
- Password reset
- Session management
- Row-level security

## 🏗️ Architecture

```
productivity-suite/
├── apps/
│   ├── web/                 # Next.js 14 web application
│   └── mobile/              # React Native (Expo) - Phase 2
├── packages/
│   ├── core/                # Shared business logic, hooks, types
│   │   ├── src/
│   │   │   ├── lib/         # Supabase client, utilities
│   │   │   ├── hooks/       # React Query hooks for all entities
│   │   │   └── types/       # TypeScript types & Zod schemas
│   ├── ui/                  # Custom design system
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── theme/       # Theme provider, tokens
│   │   │   └── utils/       # Utility functions
│   └── config/              # Shared configuration
└── supabase/
    └── migrations/          # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm
- Supabase account

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo>
cd productivity-suite

# Install dependencies
pnpm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `apps/web/supabase/migrations/001_initial_schema.sql`
3. Enable Realtime for tables: expenses, tasks, routines, pomodoro_sessions, schedule_events, reminders
4. Create storage bucket `avatars` (public)
5. Get your project URL and anon key from Settings > API

### 3. Configure Environment

```bash
# Copy example env file
cp apps/web/.env.example apps/web/.env.local

# Edit with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
# Start web app
pnpm dev:web

# Or from the web directory
cd apps/web && pnpm dev
```

Visit `http://localhost:3000` to see the app.

## 📦 Available Scripts

```bash
# Development
pnpm dev:web          # Start Next.js dev server
pnpm dev:mobile       # Start Expo dev server (Phase 2)

# Building
pnpm build:web        # Build Next.js for production
pnpm build:mobile     # Build Expo for production

# Database
pnpm db:push          # Push schema changes to Supabase
pnpm db:studio        # Open Supabase Studio

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript check
```

## 🛠️ Tech Stack

### Web (Phase 1 - Current)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Mobile (Phase 2 - Planned)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Shared Code**: Core hooks, types, utilities

## 🎨 Design System

The custom design system (`@productivity-suite/ui`) includes:

- **Tokens**: Colors, spacing, typography, shadows, transitions
- **Components**: Button, Input, Card, Modal, Badge, Avatar, Dropdown, Tabs, Tooltip, Toast, Progress
- **Theme**: Light/Dark/System with CSS variables
- **Accessibility**: ARIA attributes, focus management, keyboard navigation

## 📱 Phase 2: Mobile App

The mobile app will share:
- All business logic (`@productivity-suite/core`)
- Type definitions
- API client configuration
- Utility functions

Mobile-specific features:
- Native push notifications
- Offline-first with WatermelonDB/RxDB
- Home screen widgets
- Biometric authentication
- Native Pomodoro timer with background execution

## 📁 Project Structure Details

### Core Package (`@productivity-suite/core`)
```
src/
├── lib/
│   └── supabase.ts        # Supabase client singleton
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   ├── useExpenses.ts     # Expense CRUD + analytics
│   ├── useTasks.ts        # Task CRUD + Kanban
│   ├── usePomodoro.ts     # Timer + session management
│   ├── useRoutines.ts     # Routine CRUD + streaks
│   ├── useSchedule.ts     # Schedule + holidays
│   └── useReminders.ts    # Reminder management
└── types/
    └── index.ts           # All TypeScript types + Zod schemas
```

### UI Package (`@productivity-suite/ui`)
```
src/
├── theme/
│   ├── ThemeProvider.tsx  # React context for theming
│   └── tokens.ts          # Design tokens
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Dropdown.tsx
│   ├── Tabs.tsx
│   ├── Tooltip.tsx
│   ├── Toast.tsx
│   └── Progress.tsx
└── utils/
    └── index.ts           # Formatters, validators, helpers
```

## 🔧 Configuration

### Tailwind Config
The design system uses a custom Tailwind config with:
- Extended color palette (primary, secondary, success, warning, danger, neutral)
- Custom font families (Inter, JetBrains Mono, Cal Sans)
- Custom animations and keyframes
- Component-specific utilities

### TypeScript
Strict mode enabled with path aliases:
- `@/*` → `apps/web/src/*`
- `@productivity-suite/ui/*` → `packages/ui/src/*`
- `@productivity-suite/core/*` → `packages/core/src/*`

## 🌐 Deployment

### Vercel (Recommended for Web)
```bash
# Connect your repo to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push
```

### Supabase
- Database: Already hosted
- Auth: Configure redirect URLs in Supabase dashboard
- Storage: Avatars bucket configured
- Realtime: Enabled for live updates

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📝 Database Schema

Key tables:
- `profiles` - User profile data
- `expenses` - Expense tracking
- `tasks` - Task management
- `routines` - Habit/routine tracking
- `pomodoro_sessions` - Focus sessions
- `schedule_events` - Weekly schedule
- `holidays` - Academic/personal holidays
- `reminders` - Notification reminders

All tables have RLS policies ensuring users only access their own data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint` and `pnpm typecheck`
5. Submit a PR

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend
- [Tailwind CSS](https://tailwindcss.com) for styling
- [TanStack Query](https://tanstack.com/query) for data fetching
- [Lucide](https://lucide.dev) for icons
- [Recharts](https://recharts.org) for charts
- [Next.js](https://nextjs.org) for the framework

---

Built with ❤️ for productivity enthusiasts everywhere.