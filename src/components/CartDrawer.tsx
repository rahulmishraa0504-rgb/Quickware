import React, { useState } from 'react';
import { CartItem, EconomicsConfig } from '../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Truck,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  economics: EconomicsConfig;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: (discountAmount: number, couponCode: string) => void;
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  economics,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculation
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Delivery charge rule:
  const isFreeDelivery = subtotal >= economics.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery || cart.length === 0 ? 0 : economics.baseDeliveryCharge;

  // Coupon calculation
  let discount = 0;
  if (appliedCoupon === 'PRO10') {
    discount = Math.round(subtotal * 0.1); // 10% discount for tradespeople
  } else if (appliedCoupon === 'FIRST50') {
    discount = Math.min(50, subtotal);
  }

  const orderTotal = Math.max(0, subtotal + deliveryCharge - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleaned = couponInput.trim().toUpperCase();
    if (cleaned === 'PRO10') {
      setAppliedCoupon('PRO10');
      setCouponInput('');
    } else if (cleaned === 'FIRST50') {
      setAppliedCoupon('FIRST50');
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon. Try "PRO10" (10% off) or "FIRST50"');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold tracking-tight">Your Hardware Cart</h2>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {cart.reduce((total, i) => total + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {cart.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200/70 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
            {isFreeDelivery ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Unlocked FREE Local Delivery in Greater Noida!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                Add ₹{economics.freeDeliveryThreshold - subtotal} more for FREE site delivery.
              </span>
            )}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Browse screws, fasteners, adhesives, and everyday fittings from local hardware retailers.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Explore Hardware Catalogue
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={item.product.name}>
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.product.unit} · {item.product.retailerName}
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-1 tabular-nums">
                    ₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}
                  </div>
                </div>

                {/* Stepper & Delete */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center rounded-lg bg-slate-100 border border-slate-200">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-800 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-4">
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon '{appliedCoupon}' Applied (-₹{discount})</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-slate-500 hover:text-red-600 text-[11px] underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. PRO10, FIRST50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs uppercase placeholder-normal bg-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-600 mt-1">{couponError}</p>}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Product Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Local Delivery Fee</span>
                {deliveryCharge === 0 ? (
                  <span className="font-semibold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-900 tabular-nums">₹{deliveryCharge}</span>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount Applied</span>
                  <span className="tabular-nums">-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Estimated Order Total</span>
                <span className="text-base text-orange-600 tabular-nums">₹{orderTotal}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onProceedToCheckout(discount, appliedCoupon || '');
              }}
              className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Cash on Delivery (COD) & WhatsApp order available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
