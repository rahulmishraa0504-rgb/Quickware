import React from 'react';
import { Product } from '../types';
import { Plus, Minus, Store, Check, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col h-full group overflow-hidden">
      {/* Product Image Area */}
      <div
        onClick={() => onOpenDetails(product)}
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Elegant fallback SVG container
            const target = e.target as HTMLElement;
            target.style.display = 'none';
          }}
        />

        {/* Fallback pattern underneath image */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 bg-slate-100 text-slate-400 text-xs font-medium">
          {product.category}
        </div>

        {/* Pro / Popular quiet tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isProRecommended && (
            <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide backdrop-blur-xs">
              Pro Trade Pick
            </span>
          )}
          {product.isPopular && !product.isProRecommended && (
            <span className="bg-orange-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide backdrop-blur-xs">
              Popular
            </span>
          )}
        </div>

        {/* Pack Size / Unit Overlay */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
          {product.unit}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand & Category quiet metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.category}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onOpenDetails(product)}
            className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-orange-600 cursor-pointer transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Retailer Source */}
          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-500">
            <Store className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{product.retailerName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 font-medium shrink-0">{product.retailerLocality}</span>
          </div>
        </div>

        {/* Pricing & Add To Cart Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                ₹{product.price}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {product.inStock ? `${product.stockCount} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Add to Cart / Quantity Stepper */}
          <div>
            {!product.inStock ? (
              <span className="text-xs text-slate-400 font-medium py-1 px-2 rounded bg-slate-100">
                Unavailable
              </span>
            ) : cartQuantity > 0 ? (
              <div className="flex items-center rounded-lg bg-orange-50 border border-orange-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-orange-700 hover:bg-orange-100 transition-colors focus:outline-none"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs text-orange-950 tabular-nums">
                  {cartQuantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-orange-700 hover:bg-orange-100 transition-colors focus:outline-none"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
