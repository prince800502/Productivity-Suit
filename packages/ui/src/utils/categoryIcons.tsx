'use client';

import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Zap,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'utilities'
  | 'other';

export interface CategoryIconMap {
  [key: string]: LucideIcon;
}

export const categoryIconComponents: CategoryIconMap = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  health: HeartPulse,
  education: GraduationCap,
  utilities: Zap,
  other: MoreHorizontal,
};

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIconComponents[category] || MoreHorizontal;
}

export function CategoryIcon({
  category,
  className = '',
  size = 20,
}: {
  category: string;
  className?: string;
  size?: number;
}) {
  const IconComponent = getCategoryIcon(category);
  return <IconComponent className={className} size={size} />;
}