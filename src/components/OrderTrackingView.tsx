import React from 'react';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Store,
  MapPin,
  Phone,
  XCircle,
  MessageCircle,
  ArrowLeft,
  RefreshCw,
  Mail,
} from 'lucide-react';

interface OrderTrackingViewProps {
  orders: Order[];
  selectedOrderId?: string;
  onSelectOrder: (id: string) => void;
  onContinueShopping: () => void;
  onReorder: (order: Order) => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'Order Placed', label: 'Order Placed', icon: Clock },
  { status: 'Awaiting Retailer Confirmation', label: 'Retailer Check', icon: Store },
  { status: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'Preparing Order', label: 'Packing Hardware', icon: Package },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
  onContinueShopping,
  onReorder,
}) => {
  const { user, authLoading, loginWithGoogle } = useAuth();
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-orange-400 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Sign in to Track Your Orders</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Customer orders are private and protected. Sign in with your Google email to view your order history and real-time fulfillment status.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <GoogleSignInButton
              onClick={loginWithGoogle}
              disabled={authLoading}
              label="Sign in with Google Email"
            />
            <button
              onClick={onContinueShopping}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeOrder = orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || orders[0];

  if (!activeOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Orders Found for {user.email}</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          You haven't placed any hardware orders yet. Explore our catalogue to get supplies delivered to your site.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
        >
          Explore Hardware
        </button>
      </div>
    );
  }

  const isCancelled = activeOrder.status === 'Cancelled';
  const isTerminal = activeOrder.status === 'Delivered' || activeOrder.status === 'Cancelled';
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.status === activeOrder.status);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await FirestoreService.updateOrderStatus(activeOrder, 'Cancelled', 'Cancelled by customer.');
      setConfirmingCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Order {activeOrder.orderNumber}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                activeOrder.status === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeOrder.status === 'Cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {activeOrder.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Placed on {new Date(activeOrder.createdAt).toLocaleDateString()} at{' '}
            {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Order Selector */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Your Orders:</span>
            <select
              value={activeOrder.id}
              onChange={(e) => {
                setConfirmingCancel(false);
                onSelectOrder(e.target.value);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:outline-none"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} ({o.status} - ₹{o.total})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Sync Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>
            <strong>Live Cloud Sync:</strong> Status updates from partner retailers and admins appear here automatically.
          </span>
        </span>
        <div className="flex items-center gap-3">
          {!isTerminal && !confirmingCancel && (
            <button
              onClick={() => setConfirmingCancel(true)}
              className="text-red-700 font-bold underline hover:text-red-900"
            >
              Cancel Order
            </button>
          )}
          {!isTerminal && confirmingCancel && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
              <span className="text-red-800 font-semibold">Cancel order?</span>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold"
              >
                Keep
              </button>
            </div>
          )}
          <button
            onClick={() => onReorder(activeOrder)}
            className="text-blue-900 font-bold underline hover:text-blue-700 whitespace-nowrap"
          >
            Reorder Items
          </button>
        </div>
      </div>

      {/* Timeline Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Order Fulfillment Progress
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">This order has been cancelled</div>
              <div className="text-xs text-red-700 mt-1">
                {activeOrder.timeline[activeOrder.timeline.length - 1]?.note ||
                  'Cancelled due to retailer stock or delivery constraints.'}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Step Pipeline (Desktop & Tablet) */}
            <div className="hidden sm:grid grid-cols-6 gap-2 relative">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center relative group">
                    {idx < ORDER_STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-1 -z-0 transition-colors ${
                          currentStepIndex > idx ? 'bg-orange-600' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 scale-110 shadow-md'
                          : isPassed
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <span
                      className={`text-[11px] font-semibold mt-2 leading-tight ${
                        isCurrent
                          ? 'text-orange-600 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Pipeline (Mobile) */}
            <div className="sm:hidden space-y-3">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-2 ring-orange-100'
                          : isPassed
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span
                        className={`text-xs ${
                          isCurrent ? 'font-bold text-orange-600' : isPassed ? 'font-semibold text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Timeline Events */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Status Activity Log
          </h4>
          <div className="space-y-2.5">
            {activeOrder.timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-3 text-xs">
                <span className="font-mono text-slate-400 text-[11px] shrink-0 mt-0.5">
                  {event.timestamp}
                </span>
                <div className="flex-1">
                  <span className="font-bold text-slate-800">{event.status}: </span>
                  <span className="text-slate-600">{event.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Order Items & Delivery Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Items Ordered ({activeOrder.items.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {activeOrder.items.map((item, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.unit} · {item.retailerName}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-slate-900 tabular-nums">
                    ₹{item.price * item.quantity}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ₹{item.price} × {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900 tabular-nums">₹{activeOrder.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              {activeOrder.deliveryCharge === 0 ? (
                <span className="font-semibold text-emerald-600">FREE</span>
              ) : (
                <span className="font-semibold text-slate-900 tabular-nums">₹{activeOrder.deliveryCharge}</span>
              )}
            </div>
            {activeOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span className="tabular-nums">-₹{activeOrder.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="text-orange-600 tabular-nums text-base">₹{activeOrder.total}</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Payment Method: <strong className="text-slate-800 uppercase">{activeOrder.paymentMethod.replace(/_/g, ' ')}</strong> ({activeOrder.paymentStatus})
            </div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>Participating Partner Retailer</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{activeOrder.retailerName}</div>
            <div className="text-xs text-slate-600">
              Local Hardware Store · Greater Noida Network
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>Delivery Address</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{activeOrder.customerName}</div>
              <div className="text-xs text-slate-700 mt-0.5">{activeOrder.deliveryAddress}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{activeOrder.locality}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{activeOrder.customerPhone}</span>
              </div>
            </div>

            {activeOrder.deliveryInstructions && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                <strong className="text-slate-800">Site Notes:</strong> {activeOrder.deliveryInstructions}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
            <div className="font-bold text-xs flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Need Immediate Dispatch Update?</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Connect directly with our Greater Noida dispatch desk on WhatsApp with Order #{activeOrder.orderNumber}.
            </p>
            <a
              href={`https://wa.me/919811234567?text=Hello%20Quickware,%20checking%20status%20of%20Order%20${activeOrder.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              <span>Chat with Dispatch</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
