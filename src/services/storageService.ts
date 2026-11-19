import {
  Product,
  Retailer,
  Order,
  CartItem,
  CustomerEnquiry,
  EconomicsConfig,
  OrderStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_RETAILERS,
  INITIAL_ORDERS,
  INITIAL_ENQUIRIES,
  DEFAULT_ECONOMICS,
  GREATER_NOIDA_LOCALITIES,
} from '../data/seedData';

const KEYS = {
  PRODUCTS: 'quickware_products_v1',
  RETAILERS: 'quickware_retailers_v1',
  ORDERS: 'quickware_orders_v1',
  CART: 'quickware_cart_v1',
  ENQUIRIES: 'quickware_enquiries_v1',
  ECONOMICS: 'quickware_economics_v1',
  LOCALITY: 'quickware_locality_v1',
  CUSTOMER_PROFILE: 'quickware_customer_v1',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeStorage = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // silence
    }
  });
};

// Safe JSON parse with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyListeners();
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const StorageService = {
  // Products
  getProducts(): Product[] {
    return loadFromStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  saveProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    saveToStorage(KEYS.PRODUCTS, products);
  },

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    saveToStorage(KEYS.PRODUCTS, products);
  },

  // Retailers
  getRetailers(): Retailer[] {
    return loadFromStorage<Retailer[]>(KEYS.RETAILERS, INITIAL_RETAILERS);
  },

  saveRetailer(retailer: Retailer): void {
    const retailers = this.getRetailers();
    const index = retailers.findIndex((r) => r.id === retailer.id);
    if (index >= 0) {
      retailers[index] = retailer;
    } else {
      retailers.push(retailer);
    }
    saveToStorage(KEYS.RETAILERS, retailers);
  },

  // Cart
  getCart(): CartItem[] {
    return loadFromStorage<CartItem[]>(KEYS.CART, []);
  },

  saveCart(cart: CartItem[]): void {
    saveToStorage(KEYS.CART, cart);
  },

  clearCart(): void {
    saveToStorage(KEYS.CART, []);
  },

  // Orders
  getOrders(): Order[] {
    return loadFromStorage<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  },

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id || o.orderNumber === id);
  },

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>): Order {
    const orders = this.getOrders();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `QW-${randomSuffix}`;
    const now = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'Order Placed',
          timestamp: timeFormatted,
          note: `Order registered via Quickware platform for delivery to ${orderData.locality}.`,
        },
        {
          status: 'Awaiting Retailer Confirmation',
          timestamp: timeFormatted,
          note: `Routed to partner store ${orderData.retailerName} for packing.`,
        },
      ],
    };

    orders.unshift(newOrder);
    saveToStorage(KEYS.ORDERS, orders);
    this.clearCart();
    return newOrder;
  },

  updateOrderStatus(orderId: string, nextStatus: OrderStatus, customNote?: string): Order | null {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let defaultNote = '';
    switch (nextStatus) {
      case 'Confirmed':
        defaultNote = `${order.retailerName} verified stock availability and confirmed order fulfillment.`;
        break;
      case 'Preparing Order':
        defaultNote = 'Items picked, verified for quantities and packed in tamper-proof hardware kit.';
        break;
      case 'Out for Delivery':
        defaultNote = 'Dispatched with hyperlocal delivery partner. En route to customer location.';
        break;
      case 'Delivered':
        defaultNote = 'Successfully handed over to customer. Verification confirmed.';
        order.paymentStatus = 'Paid on Delivery';
        break;
      case 'Cancelled':
        defaultNote = customNote || 'Order cancelled by customer or retailer due to stock/location constraints.';
        break;
      default:
        defaultNote = `Order status updated to ${nextStatus}.`;
    }

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status: nextStatus,
      timestamp: timeFormatted,
      note: customNote || defaultNote,
    });

    saveToStorage(KEYS.ORDERS, orders);
    return order;
  },

  // Customer Enquiries
  getEnquiries(): CustomerEnquiry[] {
    return loadFromStorage<CustomerEnquiry[]>(KEYS.ENQUIRIES, INITIAL_ENQUIRIES);
  },

  createEnquiry(enquiry: Omit<CustomerEnquiry, 'id' | 'createdAt' | 'status'>): CustomerEnquiry {
    const enquiries = this.getEnquiries();
    const newEnquiry: CustomerEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Received',
    };
    enquiries.unshift(newEnquiry);
    saveToStorage(KEYS.ENQUIRIES, enquiries);
    return newEnquiry;
  },

  updateEnquiry(id: string, updates: Partial<CustomerEnquiry>): void {
    const enquiries = this.getEnquiries();
    const index = enquiries.findIndex((e) => e.id === id);
    if (index >= 0) {
      enquiries[index] = { ...enquiries[index], ...updates };
      saveToStorage(KEYS.ENQUIRIES, enquiries);
    }
  },

  // Economics Config
  getEconomics(): EconomicsConfig {
    return loadFromStorage<EconomicsConfig>(KEYS.ECONOMICS, DEFAULT_ECONOMICS);
  },

  saveEconomics(config: EconomicsConfig): void {
    saveToStorage(KEYS.ECONOMICS, config);
  },

  // Selected Locality
  getSelectedLocality(): string {
    return loadFromStorage<string>(KEYS.LOCALITY, GREATER_NOIDA_LOCALITIES[0]);
  },

  setSelectedLocality(locality: string): void {
    saveToStorage(KEYS.LOCALITY, locality);
  },

  // Reset demo data
  resetAllDemoData(): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(KEYS.RETAILERS, JSON.stringify(INITIAL_RETAILERS));
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(KEYS.CART, JSON.stringify([]));
    localStorage.setItem(KEYS.ENQUIRIES, JSON.stringify(INITIAL_ENQUIRIES));
    localStorage.setItem(KEYS.ECONOMICS, JSON.stringify(DEFAULT_ECONOMICS));
    localStorage.setItem(KEYS.LOCALITY, JSON.stringify(GREATER_NOIDA_LOCALITIES[0]));
    notifyListeners();
  },
};
