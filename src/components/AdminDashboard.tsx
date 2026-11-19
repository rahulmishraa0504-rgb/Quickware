import React, { useState, useEffect } from 'react';
import {
  Product,
  Retailer,
  Order,
  CustomerEnquiry,
  EconomicsConfig,
  OrderStatus,
  ProductCategory,
  UserProfile,
} from '../types';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { GREATER_NOIDA_LOCALITIES } from '../data/seedData';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  FileQuestion,
  Settings,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  RotateCcw,
  Search,
  Eye,
  X,
  Save,
  Check,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Users,
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  retailers: Retailer[];
  orders: Order[];
  enquiries: CustomerEnquiry[];
  users: UserProfile[];
  economics: EconomicsConfig;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  retailers,
  orders,
  enquiries,
  users,
  economics,
  onClose,
}) => {
  const { user, isAdmin, authLoading, authError, loginWithGoogle, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'retailers' | 'customers' | 'enquiries' | 'economics'>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Partial<Retailer> | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmSeedSync, setConfirmSeedSync] = useState(false);

  const [localEconomics, setLocalEconomics] = useState<EconomicsConfig>({ ...economics });
  const [economicsSavedNotice, setEconomicsSavedNotice] = useState(false);
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedOrderDetails = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null;

  useEffect(() => {
    setLocalEconomics({ ...economics });
  }, [economics]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Protected Admin Gate
  if (!user) {
    return (
      <div className="min-h-[75vh] bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-900">Admin Console Sign-In</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with an authorized administrator Google account to manage Quickware orders, inventory, local retailers, and economics.
            </p>
          </div>
          {authError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{authError}</div>
          )}
          <div className="flex flex-col items-center gap-3">
            <GoogleSignInButton
              onClick={loginWithGoogle}
              disabled={authLoading}
              label="Sign in with Admin Google Account"
            />
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-lg max-w-md w-full p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Signed in as <strong>{user.email}</strong>. This account does not have administrator permissions for the Quickware Operations Console.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <GoogleSignInButton
              onClick={loginWithGoogle}
              disabled={authLoading}
              label="Switch Google Account"
            />
            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold mt-2"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculations for KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
  const grossOrderValue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(grossOrderValue / Math.max(1, totalOrders - cancelledOrders)) : 0;

  const estimatedRetailerPayouts = Math.round(grossOrderValue * (1 - economics.retailerCommissionPct / 100));
  const estimatedPlatformCommission = grossOrderValue - estimatedRetailerPayouts;

  const handleUpdateOrderStatus = async (order: Order, nextStatus: OrderStatus) => {
    await FirestoreService.updateOrderStatus(order, nextStatus);
    showNotice(`Order ${order.orderNumber} updated to ${nextStatus}`);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct?.price === undefined) return;

    const cleanPrice = Math.max(0, Number(editingProduct.price ?? 0));
    const cleanStock = Math.max(0, Number(editingProduct.stockCount ?? 50));
    const prodToSave: Product = {
      id: editingProduct.id || `prd-${Date.now()}`,
      name: editingProduct.name.trim(),
      category: (editingProduct.category as ProductCategory) || 'Screws & Fasteners',
      brand: editingProduct.brand?.trim() || 'Quickware Assorted',
      description: editingProduct.description?.trim() || 'Quality hardware essential.',
      price: cleanPrice,
      mrp: Math.max(0, Number(editingProduct.mrp ?? Math.round(cleanPrice * 1.2))),
      unit: editingProduct.unit?.trim() || '1 Pack',
      inStock: editingProduct.inStock ?? cleanStock > 0,
      stockCount: cleanStock,
      isPopular: editingProduct.isPopular ?? false,
      isProRecommended: editingProduct.isProRecommended ?? false,
      rating: editingProduct.rating ?? 4.8,
      reviewCount: editingProduct.reviewCount ?? 12,
      imageUrl: editingProduct.imageUrl || '/src/assets/images/product_screws_fasteners_1791888248024.jpg',
      retailerId: editingProduct.retailerId || retailers[0]?.id || 'ret-1',
      retailerName: editingProduct.retailerName || retailers[0]?.name || 'Partner Hardware',
      retailerLocality: editingProduct.retailerLocality || retailers[0]?.locality || 'Sector Alpha 1',
      specifications: editingProduct.specifications || { Material: 'Steel', Application: 'General repair' },
      tags: editingProduct.tags?.length ? editingProduct.tags : ['hardware', 'quickware'],
    };

    await FirestoreService.saveProduct(prodToSave);
    setEditingProduct(null);
    setIsNewProduct(false);
    showNotice(`Saved product: ${prodToSave.name}`);
  };

  const handleDeleteProduct = async (id: string) => {
    await FirestoreService.deleteProduct(id);
    setConfirmDeleteProductId(null);
    showNotice('Product deleted from Firestore catalogue');
  };

  const handleSaveEconomics = async (e: React.FormEvent) => {
    e.preventDefault();
    await FirestoreService.saveEconomics(localEconomics);
    setEconomicsSavedNotice(true);
    setTimeout(() => setEconomicsSavedNotice(false), 2000);
  };

  const handleResetSeedData = async () => {
    await FirestoreService.forceResetDemoSeeds();
    setConfirmSeedSync(false);
    showNotice('Firestore demo catalogue & retailers synced!');
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const filteredProducts = products.filter((p) => {
    if (!adminProductSearch) return true;
    const q = adminProductSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-100 min-h-screen pb-16">
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-xs text-white">
            ADM
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
              Quickware Operations Console
              <span className="text-[10px] font-semibold bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                {user.email}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Hyperlocal Retailer & Site Delivery Control (Cloud Synced)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!confirmSeedSync ? (
            <button
              onClick={() => setConfirmSeedSync(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              title="Sync initial demo catalogue & retailers to Firestore"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sync Demo Seeds</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-amber-300 font-semibold">Sync seeds?</span>
              <button
                onClick={handleResetSeedData}
                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmSeedSync(false)}
                className="px-2 py-0.5 rounded bg-slate-700 text-slate-200"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
          >
            Storefront View
          </button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 sticky top-[57px] z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'products', label: `Catalogue (${products.length})`, icon: Package },
            { id: 'retailers', label: `Retailers (${retailers.length})`, icon: Store },
            { id: 'customers', label: `Customers (${users.length})`, icon: Users },
            { id: 'enquiries', label: `Custom Requests (${enquiries.length})`, icon: FileQuestion },
            { id: 'economics', label: 'Unit Economics & Pricing', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {totalOrders}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <span className="text-emerald-600 font-bold">{deliveredOrders} Delivered</span>
                  <span>·</span>
                  <span className="text-orange-600 font-bold">{pendingOrders} Active</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Gross Order Value (GOV)
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  ₹{grossOrderValue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Excludes {cancelledOrders} cancelled order(s)
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Average Order Value (AOV)
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  ₹{averageOrderValue}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Venture Plan Target: ₹{economics.defaultAssumedAOV}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Network Density
                </span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {retailers.filter((r) => r.active).length} Retailers
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Across Greater Noida sectors
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span>Venture Economics & Contribution Model (Greater Noida Pilot)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distinguishing gross order turnover from retailer fulfillment costs and platform contribution.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  Planning Assumptions vs Reality
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wide">
                    1. Turnover (Gross Value)
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                    ₹{grossOrderValue.toLocaleString('en-IN')}
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Customer billings including product cost and delivery fees.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wide">
                    2. Retailer Payouts (~{100 - economics.retailerCommissionPct}%)
                  </div>
                  <div className="text-xl font-extrabold text-slate-800 tabular-nums">
                    ₹{estimatedRetailerPayouts.toLocaleString('en-IN')}
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Passed through to local hardware shops (Jagat Farm, Alpha 1, Pari Chowk).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-800 uppercase tracking-wide">
                    3. Net Commission & Delivery Margin
                  </div>
                  <div className="text-xl font-extrabold text-emerald-900 tabular-nums">
                    ₹{estimatedPlatformCommission.toLocaleString('en-IN')}
                  </div>
                  <p className="text-emerald-700 leading-relaxed">
                    Platform cut ({economics.retailerCommissionPct}% average take rate).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Dispatch Feed
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-orange-600 font-bold hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No orders placed in Firestore yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{order.orderNumber}</span>
                          <span className="font-normal text-slate-500">· {order.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {order.locality} · {order.items.length} item(s) · {order.retailerName}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900 tabular-nums">₹{order.total}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {order.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setActiveTab('orders');
                          }}
                          className="text-slate-400 hover:text-slate-800 p-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="font-bold text-slate-700 mr-1">Status:</span>
                {[
                  'all',
                  'Order Placed',
                  'Awaiting Retailer Confirmation',
                  'Confirmed',
                  'Preparing Order',
                  'Out for Delivery',
                  'Delivered',
                  'Cancelled',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      orderFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500">Showing {filteredOrders.length} order(s)</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Customer & Email</th>
                      <th className="py-3 px-4">Fulfilling Retailer</th>
                      <th className="py-3 px-4">Items & Amount</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{order.orderNumber}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{order.customerName}</div>
                          <div className="text-[11px] text-slate-500">{order.customerEmail || order.customerPhone}</div>
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-xs">
                            {order.locality}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{order.retailerName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 tabular-nums">₹{order.total}</div>
                          <div className="text-[11px] text-slate-500">{order.items.length} items</div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order, e.target.value as OrderStatus)}
                            className={`px-2 py-1 rounded-lg font-bold text-xs border focus:outline-none cursor-pointer ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : order.status === 'Cancelled'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-orange-50 text-orange-800 border-orange-300'
                            }`}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Awaiting Retailer Confirmation">Awaiting Retailer</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Preparing Order">Preparing Order</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrderId(order.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrderDetails && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl border">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-900">
                      Order Details: {selectedOrderDetails.orderNumber}
                    </h3>
                    <button
                      onClick={() => setSelectedOrderId(null)}
                      className="p-1 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-800">Customer:</strong>{' '}
                      {selectedOrderDetails.customerName} ({selectedOrderDetails.customerPhone})
                    </div>
                    {selectedOrderDetails.customerEmail && (
                      <div>
                        <strong className="text-slate-800">Google Email:</strong>{' '}
                        {selectedOrderDetails.customerEmail}
                      </div>
                    )}
                    <div>
                      <strong className="text-slate-800">Address:</strong>{' '}
                      {selectedOrderDetails.deliveryAddress}, {selectedOrderDetails.locality}
                    </div>
                    {selectedOrderDetails.deliveryInstructions && (
                      <div className="p-2 bg-slate-50 rounded border">
                        <strong>Site Instructions:</strong> {selectedOrderDetails.deliveryInstructions}
                      </div>
                    )}
                    <div>
                      <strong className="text-slate-800">Assigned Retailer:</strong>{' '}
                      {selectedOrderDetails.retailerName}
                    </div>
                  </div>

                  <div className="border-t pt-2 space-y-2">
                    <div className="font-bold text-xs uppercase text-slate-700">Items Ordered:</div>
                    {selectedOrderDetails.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100">
                        <span>{it.quantity}x {it.name} ({it.unit})</span>
                        <span className="font-bold tabular-nums">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-extrabold text-sm pt-1">
                      <span>Total:</span>
                      <span className="text-orange-600 tabular-nums">₹{selectedOrderDetails.total}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedOrderId(null)}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter products by name or category..."
                  value={adminProductSearch}
                  onChange={(e) => setAdminProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'Screws & Fasteners',
                    brand: '',
                    price: 150,
                    mrp: 180,
                    unit: 'Pack of 100 pcs',
                    stockCount: 50,
                    inStock: true,
                    retailerId: retailers[0]?.id || 'ret-1',
                    retailerName: retailers[0]?.name || 'Shree Ganesh Hardware',
                    retailerLocality: retailers[0]?.locality || 'Sector Alpha 1',
                  });
                  setIsNewProduct(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hardware Product</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item & Brand</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price (INR)</th>
                      <th className="py-3 px-4">Unit / Pack Size</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4">Partner Store</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.brand}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{p.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                          ₹{p.price}{' '}
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{p.mrp}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.unit}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={async () => {
                              await FirestoreService.saveProduct({ ...p, inStock: !p.inStock });
                              showNotice(`Updated stock for ${p.name}`);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.inStock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.inStock ? `${p.stockCount} in stock` : 'Out of stock'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                          {p.retailerName}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {confirmDeleteProductId === p.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteProductId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsNewProduct(false);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteProductId(p.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editingProduct && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl border"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      {isNewProduct ? 'Add New Hardware Product' : 'Edit Product'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="p-1 rounded hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={editingProduct.category || 'Screws & Fasteners'}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })
                          }
                          className="w-full p-2 border rounded-lg bg-white"
                        >
                          <option value="Screws & Fasteners">Screws & Fasteners</option>
                          <option value="Nails & Fixings">Nails & Fixings</option>
                          <option value="Adhesives">Adhesives</option>
                          <option value="Hand Tools">Hand Tools</option>
                          <option value="Electrical Fittings">Electrical Fittings</option>
                          <option value="Plumbing Fittings">Plumbing Fittings</option>
                          <option value="Locks & Security">Locks & Security</option>
                          <option value="Repair Essentials">Repair Essentials</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                        <input
                          type="text"
                          value={editingProduct.brand || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.price || 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          className="w-full p-2 border rounded-lg tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          value={editingProduct.mrp || 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, mrp: Number(e.target.value) })}
                          className="w-full p-2 border rounded-lg tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={editingProduct.stockCount || 50}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) })
                          }
                          className="w-full p-2 border rounded-lg tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit / Pack Size</label>
                      <input
                        type="text"
                        value={editingProduct.unit || ''}
                        placeholder="e.g. Pack of 100 pcs, 500g bottle"
                        onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fulfilling Retailer</label>
                      <select
                        value={editingProduct.retailerId || retailers[0]?.id || 'ret-1'}
                        onChange={(e) => {
                          const ret = retailers.find((r) => r.id === e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            retailerId: ret?.id,
                            retailerName: ret?.name,
                            retailerLocality: ret?.locality,
                          });
                        }}
                        className="w-full p-2 border rounded-lg bg-white"
                      >
                        {retailers.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.locality})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'retailers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Participating Hardware Retailers ({retailers.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Asset-light partner store network across Greater Noida.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRetailer({
                    name: '',
                    locality: 'Sector Beta 1',
                    sector: 'Sector Beta 1',
                    address: '',
                    phone: '+91 ',
                    contactPerson: '',
                    commissionPct: 12,
                    active: true,
                    rating: 4.8,
                    ordersFulfilled: 0,
                    distanceKm: 2.5,
                  });
                }}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Retailer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {retailers.map((ret) => (
                <div
                  key={ret.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ret.name}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{ret.locality} · {ret.distanceKm} km from center</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ret.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ret.active ? 'Active Partner' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div><strong>Address:</strong> {ret.address}</div>
                    <div><strong>Contact:</strong> {ret.contactPerson} ({ret.phone})</div>
                    <div><strong>Commission Take-Rate:</strong> {ret.commissionPct}%</div>
                    <div><strong>Orders Fulfilled:</strong> {ret.ordersFulfilled} orders</div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Products Sourced: {products.filter((p) => p.retailerId === ret.id).length} items
                    </span>
                    <button
                      onClick={async () => {
                        await FirestoreService.saveRetailer({ ...ret, active: !ret.active });
                        showNotice(`${ret.name} status updated`);
                      }}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      {ret.active ? 'Pause Partner' : 'Activate Partner'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editingRetailer && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingRetailer.name) return;
                    await FirestoreService.saveRetailer({
                      id: editingRetailer.id || `ret-${Date.now()}`,
                      name: editingRetailer.name,
                      locality: editingRetailer.locality || 'Sector Alpha 1',
                      sector: editingRetailer.sector || 'Sector Alpha 1',
                      address: editingRetailer.address || 'Commercial Market, Greater Noida',
                      phone: editingRetailer.phone || '+91 98112 00000',
                      contactPerson: editingRetailer.contactPerson || 'Store Owner',
                      commissionPct: Number(editingRetailer.commissionPct || 12),
                      active: true,
                      rating: 4.8,
                      ordersFulfilled: 0,
                      distanceKm: 2.0,
                    });
                    setEditingRetailer(null);
                    showNotice('Retailer onboarded to Firestore');
                  }}
                  className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl border text-xs"
                >
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-sm text-slate-900">Onboard Local Hardware Partner</h3>
                    <button type="button" onClick={() => setEditingRetailer(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Fasteners & Tools"
                      value={editingRetailer.name || ''}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, name: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Greater Noida Locality</label>
                    <select
                      value={editingRetailer.locality || 'Sector Alpha 1'}
                      onChange={(e) =>
                        setEditingRetailer({ ...editingRetailer, locality: e.target.value, sector: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      {GREATER_NOIDA_LOCALITIES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Address Details</label>
                    <input
                      type="text"
                      placeholder="Shop No, Market name"
                      value={editingRetailer.address || ''}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, address: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Owner Contact Name</label>
                      <input
                        type="text"
                        value={editingRetailer.contactPerson || ''}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, contactPerson: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone</label>
                      <input
                        type="text"
                        value={editingRetailer.phone || ''}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingRetailer(null)}
                      className="px-3 py-1.5 rounded-lg border font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-orange-600 text-white font-bold"
                    >
                      Save Partner
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Registered Customers & Contractors ({users.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Verified Google accounts persisted in Firestore with order volume and Greater Noida sector preferences.
              </p>
            </div>

            {users.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No registered customer records found in Firestore yet.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Google Email</th>
                        <th className="py-3 px-4">Default Sector</th>
                        <th className="py-3 px-4">Orders Placed</th>
                        <th className="py-3 px-4">Total Spend</th>
                        <th className="py-3 px-4">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const userOrders = orders.filter((o) => o.userId === u.uid);
                        const spend = userOrders
                          .filter((o) => o.status !== 'Cancelled')
                          .reduce((sum, o) => sum + o.total, 0);
                        return (
                          <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{u.displayName}</div>
                              {u.phone && <div className="text-[11px] text-slate-500">{u.phone}</div>}
                            </td>
                            <td className="py-3 px-4 text-slate-700">{u.email}</td>
                            <td className="py-3 px-4 text-slate-600">{u.defaultLocality}</td>
                            <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                              {userOrders.length}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-900 tabular-nums">
                              ₹{spend.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Unlisted Hardware Site Requests ({enquiries.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Urgent requests from electricians, carpenters, and contractors when items aren't in the standard catalogue.
              </p>
            </div>

            {enquiries.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No custom sourcing enquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{enq.customerName}</span>
                          <span className="font-normal text-slate-500">({enq.customerPhone})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {enq.locality} · {enq.customerEmail} · Category: <strong className="text-slate-700">{enq.category}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            enq.urgency.includes('Urgent')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {enq.urgency}
                        </span>

                        <select
                          value={enq.status}
                          onChange={async (e) => {
                            await FirestoreService.updateEnquiry(enq.id, {
                              status: e.target.value as any,
                            });
                            showNotice('Enquiry status updated');
                          }}
                          className="px-2 py-1 rounded border bg-slate-50 font-bold focus:outline-none"
                        >
                          <option value="Received">Received</option>
                          <option value="Checking Retailers">Checking Retailers</option>
                          <option value="Available for Sourcing">Available for Sourcing</option>
                          <option value="Fulfilled">Fulfilled</option>
                          <option value="Unserviceable">Unserviceable</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      <strong className="text-slate-900 block mb-0.5">Requested Item Description:</strong>
                      {enq.itemDescription}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t text-[11px] text-slate-400">
                      <span>Submitted on {new Date(enq.createdAt).toLocaleString()}</span>
                      <a
                        href={`https://wa.me/${enq.customerPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(enq.customerName)},%20regarding%20your%20hardware%20request%20on%20Quickware...`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline"
                      >
                        Reply via WhatsApp →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'economics' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Delivery Charge & Pricing Parameters (Capstone Model)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust baseline fees, free delivery thresholds, and retailer take-rates. Updates sync to Firestore immediately.
              </p>
            </div>

            {economicsSavedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Pricing parameters updated in Firestore!</span>
              </div>
            )}

            <form onSubmit={handleSaveEconomics} className="space-y-4 max-w-xl text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Base Local Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={localEconomics.baseDeliveryCharge}
                    onChange={(e) =>
                      setLocalEconomics({ ...localEconomics, baseDeliveryCharge: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={localEconomics.freeDeliveryThreshold}
                    onChange={(e) =>
                      setLocalEconomics({ ...localEconomics, freeDeliveryThreshold: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Average Retailer Commission (%)
                  </label>
                  <input
                    type="number"
                    value={localEconomics.retailerCommissionPct}
                    onChange={(e) =>
                      setLocalEconomics({ ...localEconomics, retailerCommissionPct: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Planning Assumed AOV (₹)
                  </label>
                  <input
                    type="number"
                    value={localEconomics.defaultAssumedAOV}
                    onChange={(e) =>
                      setLocalEconomics({ ...localEconomics, defaultAssumedAOV: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Economics Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
