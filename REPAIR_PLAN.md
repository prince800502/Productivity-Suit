# Repair Plan for Productivity Suite

## Phase 1: Critical UI Package Fixes

### 1. Fix Tabs.tsx (CRITICAL - Multiple duplicate declarations)
- Remove duplicate `TabsContext` declarations (3x)
- Remove duplicate `useTabsContext` functions (3x)
- Remove duplicate `renderArrayTabs` functions (2x)
- Fix duplicate exports of `TabsList`, `TabsTrigger`, `TabsContent`
- Ensure compound components (`Tabs.List`, `Tabs.Trigger`, `Tabs.Content`) are properly exported
- Add `TabPanel` export for backward compatibility

### 2. Fix UI Package Exports
- Export `TabPanel` from index.ts (or add it as alias for `TabsContent`)
- Verify all component exports work correctly

## Phase 2: Web App Page Fixes

### 3. Dashboard Page (`src/app/(dashboard)/dashboard/page.tsx`)
- Remove `TabPanel` import (use `TabsContent` instead)

### 4. Expenses Page (`src/app/(dashboard)/expenses/page.tsx`)
- Remove `TabPanel` import

### 5. Pomodoro Page (`src/app/(dashboard)/pomodoro/page.tsx`)
- Fix Tabs usage to use compound components API correctly
- The current Tabs implementation supports compound API but the exports are broken

### 6. Schedule Page (`src/app/(dashboard)/schedule/page.tsx`)
- Fix `eventStart`/`eventEnd` scope issue in weekly view table
- Fix type errors on lines 315-321 (number vs string for Select options)

### 7. Settings Page (`src/app/(dashboard)/settings/page.tsx`)
- Fix Tabs usage to use compound components API
- Remove `defaultValue` prop (use `value` + state)
- Fix `register('theme').value` - use `watch('theme')` instead
- Fix `CardFooter` import

### 8. Tasks Page (`src/app/(dashboard)/tasks/page.tsx`)
- Fix filter type casting
- Fix view state type
- Add `CardFooter` import

### 9. Layout & Middleware Fixes
- Fix `layout.tsx` ReactNode type conflict
- Fix middleware.ts parameter types

## Phase 3: Core Package Fixes

### 10. useAuth.ts
- Add explicit types for `session` parameter
- Add explicit types for `event` and `session` in onAuthStateChange

### 11. useExpenses.ts
- Fix `byCategory` vs `by_category` property name mismatch
- Fix DailySpending type conversion

### 12. useSchedule.ts & supabase.ts
- Add explicit types for implicit any parameters

## Phase 4: Verification
- Run typecheck to verify all errors fixed
- Run dev server and test key routes
- Test authentication flow