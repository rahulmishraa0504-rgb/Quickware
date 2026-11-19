export type ProductCategory =
  | 'Screws & Fasteners'
  | 'Nails & Fixings'
  | 'Adhesives'
  | 'Hand Tools'
  | 'Electrical Fittings'
  | 'Plumbing Fittings'
  | 'Locks & Security'
  | 'Repair Essentials';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string;
  price: number;
  mrp?: number;
  unit: string; // e.g. "Pack of 100", "500g Bottle", "1 Piece"
  inStock: boolean;
  stockCount: number;
  isPopular?: boolean;
  isProRecommended?: boolean;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  retailerId: string;
  retailerName: string;
  retailerLocality: string;
  specifications: Record<string, string>;
  tags: string[];
}

export interface Retailer {
  id: string;
  name: string;
  locality: string;
  sector: string;
  address: string;
  phone: string;
  rating: number;
  ordersFulfilled: number;
  active: boolean;
  distanceKm: number;
  commissionPct: number;
  contactPerson: string;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartItemDoc {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  updatedAt?: any;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Awaiting Retailer Confirmation'
  | 'Confirmed'
  | 'Preparing Order'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  retailerName: string;
}

export interface StatusTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  defaultLocality: string;
  role: 'customer' | 'admin';
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  contactName: string;
  phone: string;
  address: string;
  locality: string;
  instructions?: string;
  createdAt?: any;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "QW-90482"
  userId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  locality: string; // Greater Noida Sector
  city: string;
  deliveryInstructions?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'whatsapp_order' | 'online_simulated';
  paymentStatus: 'Pending' | 'Paid on Delivery' | 'Simulated Paid';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  retailerId: string;
  retailerName: string;
  estimatedDeliveryTime: string;
  timeline: StatusTimelineEvent[];
}

export interface CustomerEnquiry {
  id: string;
  userId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  locality: string;
  itemDescription: string;
  category: string;
  urgency: 'Job Stalled (Urgent)' | 'Within 2 Hours' | 'Today';
  status: 'Received' | 'Checking Retailers' | 'Available for Sourcing' | 'Fulfilled' | 'Unserviceable';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
}

export interface EconomicsConfig {
  baseDeliveryCharge: number;
  freeDeliveryThreshold: number;
  retailerCommissionPct: number;
  defaultAssumedAOV: number;
  defaultAssumedVariableCost: number;
}
