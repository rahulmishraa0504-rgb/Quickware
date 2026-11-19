import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Store,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  cartQuantity: number;
  onAddToCart: (product: Product, quantity: number) => void;
  allProducts: Product[];
  onSelectRelated: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  cartQuantity,
  onAddToCart,
  allProducts,
  onSelectRelated,
}) => {
  const [selectedQty, setSelectedQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAdd = () => {
    onAddToCart(product, selectedQty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-8">
          {/* Left Column: Image & Badges */}
          <div className="space-y-4">
            <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.isProRecommended && (
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                    Pro Contractor Standard
                  </span>
                )}
                {product.isPopular && (
                  <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                    Frequently Ordered
                  </span>
                )}
              </div>
            </div>

            {/* Retailer Info Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-600" />
                <span>Fulfilled By Verified Local Retailer</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{product.retailerName}</div>
              <div className="text-xs text-slate-600">
                Location: {product.retailerLocality}, Greater Noida
              </div>
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified physical store with instant site dispatch capability</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Specs & Add to Cart */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              {/* Category & Brand */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-bold text-orange-600 uppercase tracking-wide">
                  {product.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Pack Size / Unit */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Standard Packaging: {product.unit}</span>
              </div>

              {/* Price & Availability */}
              <div className="mt-4 flex items-baseline gap-3 pb-3 border-b border-slate-100">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  ₹{product.price}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-sm text-slate-400 line-through tabular-nums">
                    ₹{product.mrp} MRP
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                  {product.inStock ? `${product.stockCount} units available` : 'Out of stock'}
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Specifications Table */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[10px] uppercase font-medium">{key}</span>
                        <span className="font-semibold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Module */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {addedNotice && (
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Added {selectedQty} {product.unit} to your Quickware cart!</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-1">
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900 tabular-nums">
                    {selectedQty}
                  </span>
                  <button
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={handleAdd}
                  disabled={!product.inStock}
                  className="flex-1 py-3 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart — ₹{product.price * selectedQty}</span>
                </button>
              </div>

              {cartQuantity > 0 && (
                <div className="text-center text-xs text-slate-500 font-medium">
                  Currently {cartQuantity} {cartQuantity === 1 ? 'pack' : 'packs'} of this item in cart.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Hardware Items Section */}
        {relatedProducts.length > 0 && (
          <div className="p-5 sm:p-8 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Frequently Bought Together in {product.category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-orange-600">
                      {rel.name}
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 tabular-nums">
                      ₹{rel.price}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
