import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  Retailer,
  Order,
  CartItem,
  CartItemDoc,
  CustomerEnquiry,
  EconomicsConfig,
  ProductCategory,
  UserProfile,
} from './types';
import { StorageService } from './services/storageService';
import { FirestoreService } from './services/firestoreService';
import { useAuth } from './context/AuthContext';
import { INITIAL_PRODUCTS, INITIAL_RETAILERS, DEFAULT_ECONOMICS } from './data/seedData';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { CustomerAccountView } from './components/CustomerAccountView';
import { CustomEnquiryModal } from './components/CustomEnquiryModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import {
  ArrowUpDown,
  CheckCircle2,
  HardHat,
  Search,
  Sparkles,
  Store,
  Wrench,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const { user, profile, isAdmin, authReady } = useAuth();

  // Data state backed by Firestore (with graceful storefront seed fallback)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [retailers, setRetailers] = useState<Retailer[]>(INITIAL_RETAILERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [economics, setEconomics] = useState<EconomicsConfig>(DEFAULT_ECONOMICS);
  const [guestCart, setGuestCart] = useState<CartItem[]>(() => StorageService.getCart());
  const [cloudCartDocs, setCloudCartDocs] = useState<CartItemDoc[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>(() =>
    StorageService.getSelectedLocality()
  );

  // UI view state
  const [activeView, setActiveView] = useState<'home' | 'catalogue' | 'tracking' | 'account' | 'admin'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'pro_recommended'>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modals
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedOrderIdForTracking, setSelectedOrderIdForTracking] = useState<string | undefined>(undefined);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutCouponCode, setCheckoutCouponCode] = useState('');

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Subscribe to public Firestore collections (products, economics) once auth is initialized
  useEffect(() => {
    if (!authReady) return;
    const unsubProducts = FirestoreService.subscribeProducts((cloudProducts) => {
      if (cloudProducts.length > 0) {
        setProducts(cloudProducts);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    });
    const unsubEconomics = FirestoreService.subscribeEconomics((cloudEcon) => {
      setEconomics(cloudEcon);
    });

    return () => {
      unsubProducts();
      unsubEconomics();
    };
  }, [authReady]);

  // Sync preferred locality from signed-in Firestore profile
  useEffect(() => {
    if (profile?.defaultLocality) {
      setSelectedLocality(profile.defaultLocality);
      StorageService.setSelectedLocality(profile.defaultLocality);
    }
  }, [profile?.defaultLocality]);

  // Subscribe to auth-protected Firestore collections (cart, orders, enquiries, retailers, users)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setOrders([]);
      setEnquiries([]);
      setUsers([]);
      setCloudCartDocs([]);
      setRetailers(INITIAL_RETAILERS);
      return;
    }

    // Merge any pre-login guest cart items into Firestore cart once authenticated
    const localGuestItems = StorageService.getCart();
    if (localGuestItems.length > 0) {
      FirestoreService.mergeGuestCart(user.uid, localGuestItems)
        .then(() => {
          StorageService.clearCart();
          setGuestCart([]);
        })
        .catch((err) => console.error('Failed to merge guest cart:', err));
    }

    const unsubCart = FirestoreService.subscribeCart(user.uid, (items) => {
      setCloudCartDocs(items);
    });

    const unsubOrders = FirestoreService.subscribeOrders(user.uid, isAdmin, (list) => {
      setOrders(list);
    });

    const unsubEnquiries = FirestoreService.subscribeEnquiries(user.uid, isAdmin, (list) => {
      setEnquiries(list);
    });

    let unsubRetailers = () => {};
    let unsubUsers = () => {};
    if (isAdmin) {
      unsubRetailers = FirestoreService.subscribeRetailers((list) => {
        if (list.length > 0) {
          setRetailers(list);
        } else {
          setRetailers(INITIAL_RETAILERS);
        }
      });
      unsubUsers = FirestoreService.subscribeUsers((list) => {
        setUsers(list);
      });
    }

    return () => {
      unsubCart();
      unsubOrders();
      unsubEnquiries();
      unsubRetailers();
      unsubUsers();
    };
  }, [authReady, user, isAdmin]);

  // Resolved active cart (Firestore-backed when authenticated, local guestCart when browsing signed-out)
  const cart = useMemo<CartItem[]>(() => {
    if (!user || !user.emailVerified) {
      return guestCart;
    }
    const productMap = new Map(products.map((p) => [p.id, p]));
    const resolved: CartItem[] = [];
    cloudCartDocs.forEach((docItem) => {
      const product = productMap.get(docItem.productId);
      if (product && docItem.quantity > 0) {
        resolved.push({ product, quantity: docItem.quantity });
      }
    });
    return resolved;
  }, [user, guestCart, cloudCartDocs, products]);

  const handleSelectLocality = async (loc: string) => {
    setSelectedLocality(loc);
    StorageService.setSelectedLocality(loc);
    if (user && user.emailVerified) {
      await FirestoreService.updateUserLocality(user.uid, loc);
    }
    showToast(`Delivery locality set to ${loc.split(',')[0]}`);
  };

  // Cart operations (persisted to Firestore when authenticated, localStorage when browsing as guest)
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const nextQty = (existingItem?.quantity || 0) + quantity;
    if (user && user.emailVerified) {
      await FirestoreService.setCartItemQuantity(user.uid, product.id, nextQty);
    } else {
      const updatedCart = existingItem
        ? guestCart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: nextQty } : item
          )
        : [...guestCart, { product, quantity }];
      setGuestCart(updatedCart);
      StorageService.saveCart(updatedCart);
    }
    showToast(`Added ${product.name} to cart`);
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    if (user && user.emailVerified) {
      await FirestoreService.setCartItemQuantity(user.uid, productId, quantity);
    } else {
      const updatedCart =
        quantity <= 0
          ? guestCart.filter((item) => item.product.id !== productId)
          : guestCart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            );
      setGuestCart(updatedCart);
      StorageService.saveCart(updatedCart);
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    if (user && user.emailVerified) {
      await FirestoreService.setCartItemQuantity(user.uid, productId, 0);
    } else {
      const updatedCart = guestCart.filter((item) => item.product.id !== productId);
      setGuestCart(updatedCart);
      StorageService.saveCart(updatedCart);
    }
  };

  const handleReorder = async (order: Order) => {
    const reorderItems: CartItem[] = [];
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        reorderItems.push({ product: prod, quantity: item.quantity });
      }
    });
    if (user && user.emailVerified) {
      await FirestoreService.mergeGuestCart(user.uid, reorderItems);
    } else {
      let newCart = [...guestCart];
      reorderItems.forEach((ri) => {
        const existing = newCart.find((ci) => ci.product.id === ri.product.id);
        if (existing) {
          existing.quantity += ri.quantity;
        } else {
          newCart.push(ri);
        }
      });
      setGuestCart(newCart);
      StorageService.saveCart(newCart);
    }
    setIsCartOpen(true);
    showToast(`Reordered ${order.items.length} items from ${order.orderNumber}`);
  };

  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory && p.category !== selectedCategory) return false;
        if (inStockOnly && !p.inStock) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesBrand = p.brand.toLowerCase().includes(q);
          const matchesCategory = p.category.toLowerCase().includes(q);
          const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
          return matchesName || matchesBrand || matchesCategory || matchesTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'pro_recommended') {
          if (a.isProRecommended && !b.isProRecommended) return -1;
          if (!a.isProRecommended && b.isProRecommended) return 1;
          return b.rating - a.rating;
        }
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return b.rating - a.rating;
      });
  }, [products, selectedCategory, inStockOnly, searchQuery, sortBy]);

  const frequentlyOrdered = useMemo(() => {
    return products.filter((p) => p.isPopular).slice(0, 4);
  }, [products]);

  const proPicks = useMemo(() => {
    return products.filter((p) => p.isProRecommended).slice(0, 4);
  }, [products]);

  const repairEssentials = useMemo(() => {
    return products.filter((p) => p.category === 'Repair Essentials' || p.category === 'Adhesives').slice(0, 4);
  }, [products]);

  const handleOrderSuccess = (newOrder: Order) => {
    setGuestCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setSelectedOrderIdForTracking(newOrder.id);
    setActiveView('tracking');
    showToast(`Order ${newOrder.orderNumber} placed successfully!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Header
        selectedLocality={selectedLocality}
        onSelectLocality={handleSelectLocality}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEnquiry={() => setIsEnquiryOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeView !== 'catalogue') {
            setActiveView('catalogue');
          }
        }}
      />

      {activeView === 'admin' ? (
        <AdminDashboard
          products={products}
          retailers={retailers}
          orders={orders}
          enquiries={enquiries}
          users={users}
          economics={economics}
          onClose={() => setActiveView('home')}
        />
      ) : activeView === 'tracking' ? (
        <OrderTrackingView
          orders={orders}
          selectedOrderId={selectedOrderIdForTracking}
          onSelectOrder={(id) => setSelectedOrderIdForTracking(id)}
          onContinueShopping={() => setActiveView('home')}
          onReorder={handleReorder}
        />
      ) : activeView === 'account' ? (
        <CustomerAccountView
          orders={orders}
          onTrackOrder={(id) => {
            setSelectedOrderIdForTracking(id);
            setActiveView('tracking');
          }}
          onReorder={handleReorder}
          onContinueShopping={() => setActiveView('home')}
          onOpenEnquiry={() => setIsEnquiryOpen(true)}
          onOpenAdmin={() => setActiveView('admin')}
        />
      ) : (
        <main className="flex-1">
          {activeView === 'home' && !searchQuery && (
            <Hero
              onShopClick={() => {
                setActiveView('catalogue');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              onJobOrderClick={() => {
                setSortBy('pro_recommended');
                setActiveView('catalogue');
              }}
              onSearchFocus={() => {
                setActiveView('catalogue');
              }}
              selectedLocality={selectedLocality}
            />
          )}

          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              if (activeView === 'home') {
                setActiveView('catalogue');
              }
            }}
            categoryCounts={categoryCounts}
          />

          {activeView === 'home' && !searchQuery && !selectedCategory && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                      <span>Frequently Ordered Hardware</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Standard packs commonly needed on carpentry, masonry, and painting jobs in Greater Noida.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy('popular');
                      setActiveView('catalogue');
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                  {frequentlyOrdered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={cartQuantityMap[product.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onOpenDetails={(p) => setSelectedProductDetail(p)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <HardHat className="w-5 h-5 text-slate-900" />
                      <span>Recommended for Professionals</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      High-tensile screws, Taparia insulated tools, Stanley tapes & ISI certified fittings.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy('pro_recommended');
                      setActiveView('catalogue');
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>View Pro Specs</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                  {proPicks.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={cartQuantityMap[product.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onOpenDetails={(p) => setSelectedProductDetail(p)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-emerald-600" />
                      <span>Emergency Repair Essentials</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      M-Seal leak sealants, WD-40 rust release, PTFE thread tapes & Araldite epoxies.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('Repair Essentials');
                      setActiveView('catalogue');
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Repair Catalogue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                  {repairEssentials.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={cartQuantityMap[product.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onOpenDetails={(p) => setSelectedProductDetail(p)}
                    />
                  ))}
                </div>
              </section>

              <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
                      <Store className="w-3.5 h-3.5" />
                      <span>Asset-Light Local Retailer Model</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">
                      Partnering with Greater Noida's Trusted Hardware Stores
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Instead of building expensive warehouses, Quickware digitizes neighbourhood hardware retailers in Sector Alpha 1, Pari Chowk, and Jagat Farm. When you order, items are picked directly from verified local shelves and delivered to your doorstep.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 4 Active Partner Stores
                      </span>
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Transparent Local Pricing
                      </span>
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cash on Delivery Available
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-3">
                    <button
                      onClick={() => setIsEnquiryOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all text-center"
                    >
                      Need an Unlisted Item? Request Sourcing
                    </button>
                    <button
                      onClick={() => setActiveView('catalogue')}
                      className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all text-center"
                    >
                      Browse Full 24+ Item Catalogue
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {(activeView === 'catalogue' || searchQuery || selectedCategory) && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    {selectedCategory ? selectedCategory : 'Hardware Catalogue'}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    ({filteredProducts.length} items)
                  </span>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-orange-600 hover:underline font-bold ml-1"
                    >
                      Clear Category ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded accent-orange-600"
                    />
                    <span className="font-medium">In Stock Only</span>
                  </label>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-medium">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="popular">Popular First</option>
                      <option value="pro_recommended">Recommended for Pros</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Search className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      No hardware matching "{searchQuery}"
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Can't find the exact bolt, screw gauge, or electrical fitting? Submit a quick sourcing request and our partner network will check their shelves.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEnquiryOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                  >
                    Submit Custom Hardware Request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={cartQuantityMap[product.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onOpenDetails={(p) => setSelectedProductDetail(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        cartQuantity={selectedProductDetail ? cartQuantityMap[selectedProductDetail.id] || 0 : 0}
        onAddToCart={handleAddToCart}
        allProducts={products}
        onSelectRelated={(p) => setSelectedProductDetail(p)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        economics={economics}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={(discount, code) => {
          setCheckoutDiscount(discount);
          setCheckoutCouponCode(code);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onContinueShopping={() => {
          setIsCartOpen(false);
          setActiveView('catalogue');
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        economics={economics}
        discount={checkoutDiscount}
        couponCode={checkoutCouponCode}
        defaultLocality={selectedLocality}
        onOrderSuccess={handleOrderSuccess}
      />

      <CustomEnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        defaultLocality={selectedLocality}
      />

      <Footer
        onOpenEnquiry={() => setIsEnquiryOpen(true)}
        onOpenAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
