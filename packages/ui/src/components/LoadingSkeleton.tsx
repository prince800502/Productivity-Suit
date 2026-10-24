'use client';

import { cn } from '../utils';
import { ReactElement } from 'react';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circular' | 'rectangular' | 'table-row' | 'list-item';
  className?: string;
  width?: string | number;
  height?: string | number;
  lines?: number;
  showAnimation?: boolean;
}

export function LoadingSkeleton({
  variant = 'text',
  className,
  width,
  height,
  lines = 3,
  showAnimation = true,
}: LoadingSkeletonProps) {
  const baseClass = cn(
    'bg-neutral-200 dark:bg-neutral-700 rounded',
    showAnimation && 'animate-pulse',
    className
  );

  switch (variant) {
    case 'card':
      return (
        <div className={cn(baseClass, 'rounded-xl', width ? `w-${width}` : 'w-full', height ? `h-${height}` : 'h-64')} />
      );
    case 'circular':
      return (
        <div className={cn(baseClass, 'rounded-full', width ? `w-${width}` : 'w-12', height ? `h-${height}` : 'h-12')} />
      );
    case 'rectangular':
      return (
        <div className={cn(baseClass, width ? `w-${width}` : 'w-full', height ? `h-${height}` : 'h-4')} />
      );
    case 'table-row':
      return (
        <div className={cn(baseClass, 'h-16')} />
      );
    case 'list-item':
      return (
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={cn('flex items-center gap-3 animate-pulse')}>
              <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="w-20 h-6 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      );
    case 'text':
    default:
      return (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClass,
                'h-4 rounded',
                i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'
              )}
            />
          ))}
        </div>
      );
  }
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      <div className="h-6 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
      <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
      <div className="h-32 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-12 gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn('h-4 bg-neutral-200 dark:bg-neutral-700 rounded', i === 0 ? 'col-span-4' : 'col-span-2')} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid grid-cols-12 gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={cn('h-10 bg-neutral-200 dark:bg-neutral-700 rounded', i === 0 ? 'col-span-4' : 'col-span-2')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ items = 6, cols = 3 }: { items?: number; cols?: number }) {
  return (
    <div className={cn('grid gap-4 animate-pulse', `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 space-y-3">
          <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}