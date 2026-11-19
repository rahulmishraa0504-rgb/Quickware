import React, { useState, useEffect } from 'react';
import { CartItem, EconomicsConfig, Order, OrderItem, SavedAddress } from '../types';
import { FirestoreService } from '../services/firestoreService';
import { StorageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { GREATER_NOIDA_LOCALITIES } from '../data/seedData';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  X,
  Phone,
  User,
  CreditCard,
  Banknote,
  MessageCircle,
  AlertCircle,
  Truck,
  ArrowRight,
  Mail,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  economics: EconomicsConfig;
  discount: number;
  couponCode: string;
  defaultLocality: string;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  economics,
  discount,
  couponCode,
  defaultLocality,
  onOrderSuccess,
}) => {
  const { user, profile, authLoading, authError, loginWithGoogle } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState(defaultLocality || GREATER_NOIDA_LOCALITIES[0]);
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'whatsapp_order' | 'online_simulated'>('cash_on_delivery');
  const [saveThisAddress, setSaveThisAddress] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from signed-in Google profile
  useEffect(() => {
    if (user || profile) {
      setCustomerName((prev) => prev || profile?.displayName || user?.displayName || '');
      setPhone((prev) => prev || profile?.phone || '');
      if (profile?.defaultLocality) {
        setLocality(profile.defaultLocality);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    const unsub = FirestoreService.subscribeSavedAddresses(user.uid, (list) => {
      setSavedAddresses(list);
    });
    return () => unsub();
  }, [user]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= economics.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery || cart.length === 0 ? 0 : economics.baseDeliveryCharge;
  const payableTotal = Math.max(0, subtotal + deliveryCharge - discount);

  const primaryRetailer = cart[0]?.product.retailerName || 'Local Partner Hardware';
  const primaryRetailerId = cart[0]?.product.retailerId || 'ret-1';

  const handleApplySavedAddress = (saved: SavedAddress) => {
    setCustomerName(saved.contactName);
    setPhone(saved.phone);
    setAddress(saved.address);
    setLocality(saved.locality);
    setInstructions(saved.instructions || '');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please sign in with your Google email to place and track your order.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter customer or site supervisor name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for order delivery coordination.');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMsg('Please enter complete delivery address or site building details (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        imageUrl: item.product.imageUrl,
        retailerName: item.product.retailerName,
      }));

      const formattedPhone = `+91 ${phone.replace(/^\+91\s*/, '').replace(/\D/g, '').slice(-10)}`;

      const newOrder = await FirestoreService.createOrder(user, {
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        deliveryAddress: address.trim(),
        locality,
        city: 'Greater Noida',
        deliveryInstructions: instructions.trim() || undefined,
        items: orderItems,
        subtotal,
        deliveryCharge,
        discount,
        total: payableTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Paid on Delivery',
        status: 'Order Placed',
        retailerId: primaryRetailerId,
        retailerName: primaryRetailer,
        estimatedDeliveryTime: '30-45 mins from partner confirmation',
      });

      if (saveThisAddress && savedAddresses.length === 0) {
        await FirestoreService.addSavedAddress(user.uid, {
          label: 'Primary Site / Home',
          contactName: customerName.trim(),
          phone: formattedPhone,
          address: address.trim(),
          locality,
          instructions: instructions.trim() || undefined,
        });
      }

      await FirestoreService.clearUserCart(user.uid);
      StorageService.clearCart();
      setIsSubmitting(false);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to process order. Please check inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Checkout & Site Delivery</h2>
              <p className="text-xs text-slate-400">Hyperlocal hardware fulfillment in Greater Noida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Sign-In Gate if user not logged in */}
        {!user ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Sign in with Google to Complete Checkout
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Verify your identity with your Google email so your order (₹{payableTotal}) is securely linked to your account for live status tracking and saved addresses.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <GoogleSignInButton
                onClick={loginWithGoogle}
                disabled={authLoading}
                label="Continue with Google Email"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Cart
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-6">
            {/* Signed-in Google Email Confirmation */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Ordering as <strong>{user.email}</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 shrink-0">
                Verified Google Account
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Your Saved Addresses
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => handleApplySavedAddress(saved)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>{saved.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                1. Customer & Supervisor Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Contractor Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar (Electrician)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (+91) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={14}
                      placeholder="e.g. 9812345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Location Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                2. Delivery Address in Greater Noida
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Locality / Sector *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    {GREATER_NOIDA_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Greater Noida, Uttar Pradesh"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Site Address / House / Flat *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Flat 304, Tower C, Stellar Park, Sector Alpha 1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call supervisor upon reaching gate, urgent wood work"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              {savedAddresses.length === 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveThisAddress}
                    onChange={(e) => setSaveThisAddress(e.target.checked)}
                    className="accent-orange-600 rounded"
                  />
                  <span>Save this address to my Google account for faster reorders</span>
                </label>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                3. Payment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-orange-600 bg-orange-50/60 ring-1 ring-orange-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-4 h-4 text-orange-600" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="accent-orange-600"
                    />
                  </div>
                  <div className="font-bold text-xs text-slate-900">Cash on Delivery</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pay rider upon inspection</div>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === 'whatsapp_order'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'whatsapp_order'}
                      onChange={() => setPaymentMethod('whatsapp_order')}
                      className="accent-emerald-600"
                    />
                  </div>
                  <div className="font-bold text-xs text-slate-900">WhatsApp Assist</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Order verified via chat</div>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === 'online_simulated'
                      ? 'border-sky-600 bg-sky-50/60 ring-1 ring-sky-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'online_simulated'}
                      onChange={() => setPaymentMethod('online_simulated')}
                      className="accent-sky-600"
                    />
                  </div>
                  <div className="font-bold text-xs text-slate-900">UPI / Cards</div>
                  <div className="text-[10px] text-sky-700 mt-0.5 font-medium">UPI on Delivery / Pilot</div>
                </label>
              </div>
            </div>

            {/* Order Summary & Final Payable */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Order Summary ({cart.length} unique items)
              </h4>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.reduce((t, i) => t + i.quantity, 0)} items)</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  {deliveryCharge === 0 ? (
                    <span className="font-semibold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-900 tabular-nums">₹{deliveryCharge}</span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({couponCode})</span>
                    <span className="tabular-nums">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Payable</span>
                  <span className="text-base text-orange-600 tabular-nums">₹{payableTotal}</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{isSubmitting ? 'Placing Order...' : `Confirm & Place Order — ₹${payableTotal}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
