import React from 'react';
import { ProductCategory } from '../types';
import {
  Hammer,
  Wrench,
  Zap,
  Droplet,
  Lock,
  Package,
  Layers,
  Sparkles,
  Scissors,
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: ProductCategory | null) => void;
  categoryCounts: Record<string, number>;
}

interface CategoryMeta {
  name: ProductCategory;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel: string;
}

const CATEGORIES: CategoryMeta[] = [
  { name: 'Screws & Fasteners', icon: Layers, shortLabel: 'Screws & Fasteners' },
  { name: 'Nails & Fixings', icon: Hammer, shortLabel: 'Nails & Fixings' },
  { name: 'Adhesives', icon: Scissors, shortLabel: 'Adhesives' },
  { name: 'Hand Tools', icon: Wrench, shortLabel: 'Hand Tools' },
  { name: 'Electrical Fittings', icon: Zap, shortLabel: 'Electrical' },
  { name: 'Plumbing Fittings', icon: Droplet, shortLabel: 'Plumbing' },
  { name: 'Locks & Security', icon: Lock, shortLabel: 'Locks & Security' },
  { name: 'Repair Essentials', icon: Sparkles, shortLabel: 'Repair Essentials' },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const totalCount = Object.values(categoryCounts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 sticky top-[57px] sm:top-[65px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* "All" button */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
              selectedCategory === null
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>All Products</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                selectedCategory === null ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Category buttons */}
          {CATEGORIES.map(({ name, icon: Icon, shortLabel }) => {
            const count = categoryCounts[name] || 0;
            const isSelected = selectedCategory === name;
            return (
              <button
                key={name}
                onClick={() => onSelectCategory(name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{shortLabel}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      isSelected ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
