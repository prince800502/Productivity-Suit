'use client';

import { cn } from '../utils';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from './Button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">/</span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={cn(
                      'text-sm transition-colors',
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-neutral-900 dark:text-white'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                    )}
                    aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-neutral-900 dark:text-white" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-neutral-500 dark:text-neutral-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  count?: number;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  count,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
            {count}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 sm:hidden">{description}</p>
      )}
      <div className="flex items-center gap-3">
        {description && (
          <p className="hidden sm:block text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
        {action}
      </div>
    </div>
  );
}