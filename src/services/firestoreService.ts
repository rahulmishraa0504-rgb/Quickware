import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  Retailer,
  Order,
  CustomerEnquiry,
  EconomicsConfig,
  UserProfile,
  SavedAddress,
  CartItem,
  CartItemDoc,
  OrderStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_RETAILERS,
  DEFAULT_ECONOMICS,
  GREATER_NOIDA_LOCALITIES,
} from '../data/seedData';

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      clean[k] = v;
    }
  }
  return clean as T;
}

export const FirestoreService = {
  // --- User Profile ---
  async ensureUserProfile(user: User): Promise<UserProfile> {
    const path = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      const newProfile: Record<string, any> = {
        uid: user.uid,
        email: user.email || '',
        displayName: (user.displayName || user.email?.split('@')[0] || 'Quickware User').slice(0, 100),
        defaultLocality: GREATER_NOIDA_LOCALITIES[0],
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (user.photoURL) {
        newProfile.photoURL = user.photoURL.slice(0, 500);
      }
      await setDoc(userRef, newProfile);
      const created = await getDoc(userRef);
      return created.data() as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateUserProfile(
    uid: string,
    existingProfile: UserProfile,
    updates: { displayName?: string; phone?: string; defaultLocality?: string }
  ): Promise<void> {
    const path = `users/${uid}`;
    const userRef = doc(db, 'users', uid);
    try {
      const payload: Record<string, any> = {
        displayName: (updates.displayName ?? existingProfile.displayName).trim().slice(0, 100) || existingProfile.displayName,
        defaultLocality: (updates.defaultLocality ?? existingProfile.defaultLocality).trim().slice(0, 120) || GREATER_NOIDA_LOCALITIES[0],
        updatedAt: serverTimestamp(),
      };
      if (updates.phone !== undefined) {
        payload.phone = updates.phone.trim().slice(0, 20);
      }
      await updateDoc(userRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateUserLocality(uid: string, defaultLocality: string): Promise<void> {
    const path = `users/${uid}`;
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, {
        defaultLocality: defaultLocality.trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeUsers(onData: (users: UserProfile[]) => void): () => void {
    const path = 'users';
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } as UserProfile;
        });
        list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // --- Persisted Cart Subcollection ---
  subscribeCart(uid: string, onData: (items: CartItemDoc[]) => void): () => void {
    const path = `users/${uid}/cart`;
    const q = query(collection(db, 'users', uid, 'cart'), where('userId', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as CartItemDoc);
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async setCartItemQuantity(uid: string, productId: string, quantity: number): Promise<void> {
    const path = `users/${uid}/cart/${productId}`;
    const itemRef = doc(db, 'users', uid, 'cart', productId);
    try {
      if (quantity <= 0) {
        await deleteDoc(itemRef);
        return;
      }
      const clampedQty = Math.min(999, Math.max(1, Math.round(quantity)));
      const existingSnap = await getDoc(itemRef);
      if (existingSnap.exists()) {
        await updateDoc(itemRef, {
          quantity: clampedQty,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(itemRef, {
          id: productId,
          userId: uid,
          productId,
          quantity: clampedQty,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async mergeGuestCart(uid: string, guestItems: CartItem[]): Promise<void> {
    if (!guestItems.length) return;
    const path = `users/${uid}/cart`;
    try {
      const existingSnap = await getDocs(
        query(collection(db, 'users', uid, 'cart'), where('userId', '==', uid))
      );
      const existingMap = new Map<string, number>();
      existingSnap.forEach((d) => {
        const data = d.data() as CartItemDoc;
        existingMap.set(data.productId, data.quantity);
      });

      const batch = writeBatch(db);
      guestItems.forEach((item) => {
        const pid = item.product?.id;
        if (!pid) return;
        const currentQty = existingMap.get(pid) || 0;
        const mergedQty = Math.min(999, Math.max(1, currentQty + item.quantity));
        const itemRef = doc(db, 'users', uid, 'cart', pid);
        if (existingMap.has(pid)) {
          batch.update(itemRef, {
            quantity: mergedQty,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(itemRef, {
            id: pid,
            userId: uid,
            productId: pid,
            quantity: mergedQty,
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async clearUserCart(uid: string): Promise<void> {
    const path = `users/${uid}/cart`;
    try {
      const snap = await getDocs(
        query(collection(db, 'users', uid, 'cart'), where('userId', '==', uid))
      );
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // --- Saved Addresses ---
  subscribeSavedAddresses(
    uid: string,
    onData: (addresses: SavedAddress[]) => void
  ): () => void {
    const path = `users/${uid}/addresses`;
    const q = query(collection(db, 'users', uid, 'addresses'), where('userId', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          ...d.data(),
          createdAt: timestampToIso(d.data().createdAt),
        })) as SavedAddress[];
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async addSavedAddress(
    uid: string,
    addr: Omit<SavedAddress, 'id' | 'userId' | 'createdAt'>
  ): Promise<void> {
    const id = `addr-${Date.now()}`;
    const path = `users/${uid}/addresses/${id}`;
    try {
      const payload: Record<string, any> = {
        id,
        userId: uid,
        label: addr.label.trim().slice(0, 60),
        contactName: addr.contactName.trim().slice(0, 100),
        phone: addr.phone.trim().slice(0, 20),
        address: addr.address.trim().slice(0, 300),
        locality: addr.locality.trim().slice(0, 120),
        createdAt: serverTimestamp(),
      };
      if (addr.instructions && addr.instructions.trim()) {
        payload.instructions = addr.instructions.trim().slice(0, 250);
      }
      await setDoc(doc(db, 'users', uid, 'addresses', id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteSavedAddress(uid: string, addressId: string): Promise<void> {
    const path = `users/${uid}/addresses/${addressId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // --- Products (Public Read, Admin Write) ---
  subscribeProducts(onData: (products: Product[]) => void): () => void {
    const path = 'products';
    return onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (snap.empty) {
          onData([]);
          return;
        }
        const items = snap.docs.map((d) => d.data() as Product);
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async saveProduct(product: Product): Promise<void> {
    const path = `products/${product.id}`;
    try {
      const clean = stripUndefined({
        ...product,
        name: product.name.trim().slice(0, 160),
        brand: product.brand.trim().slice(0, 80),
        description: product.description.trim().slice(0, 1000),
        unit: product.unit.trim().slice(0, 80),
        price: Math.max(0, Number(product.price)),
        stockCount: Math.max(0, Number(product.stockCount)),
        imageUrl: product.imageUrl.trim().slice(0, 500),
        retailerName: product.retailerName.trim().slice(0, 120),
        retailerLocality: product.retailerLocality.trim().slice(0, 120),
        tags: (product.tags || []).slice(0, 10),
      });
      await setDoc(doc(db, 'products', product.id), clean);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // --- Retailers (Admin Only) ---
  subscribeRetailers(onData: (retailers: Retailer[]) => void): () => void {
    const path = 'retailers';
    return onSnapshot(
      collection(db, 'retailers'),
      (snap) => {
        onData(snap.docs.map((d) => d.data() as Retailer));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async saveRetailer(retailer: Retailer): Promise<void> {
    const path = `retailers/${retailer.id}`;
    try {
      await setDoc(doc(db, 'retailers', retailer.id), stripUndefined({
        ...retailer,
        name: retailer.name.trim().slice(0, 140),
        locality: retailer.locality.trim().slice(0, 120),
        sector: retailer.sector.trim().slice(0, 120),
        address: retailer.address.trim().slice(0, 300),
        phone: retailer.phone.trim().slice(0, 25),
        contactPerson: retailer.contactPerson.trim().slice(0, 100),
        commissionPct: Math.min(100, Math.max(0, Number(retailer.commissionPct))),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // --- Orders (Owner or Admin) ---
  subscribeOrders(
    userId: string,
    isAdmin: boolean,
    onData: (orders: Order[]) => void
  ): () => void {
    const path = 'orders';
    const q = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('userId', '==', userId));

    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } as Order;
        });
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async createOrder(
    user: User,
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline' | 'userId' | 'customerEmail'>
  ): Promise<Order> {
    const id = `ord-${Date.now()}`;
    const path = `orders/${id}`;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `QW-${randomSuffix}`;
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const timeline = [
      {
        status: 'Order Placed' as OrderStatus,
        timestamp: timeFormatted,
        note: `Order registered via Quickware (${user.email}) for delivery to ${orderData.locality}.`,
      },
    ];

    const payload: Record<string, any> = {
      id,
      orderNumber,
      userId: user.uid,
      customerEmail: user.email || '',
      customerName: orderData.customerName.trim().slice(0, 100),
      customerPhone: orderData.customerPhone.trim().slice(0, 25),
      deliveryAddress: orderData.deliveryAddress.trim().slice(0, 350),
      locality: orderData.locality.trim().slice(0, 120),
      city: orderData.city.trim().slice(0, 60),
      items: orderData.items.slice(0, 50),
      subtotal: Math.max(0, Number(orderData.subtotal)),
      deliveryCharge: Math.max(0, Number(orderData.deliveryCharge)),
      discount: Math.max(0, Number(orderData.discount)),
      total: Math.max(0, Number(orderData.total)),
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      status: 'Order Placed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      retailerId: orderData.retailerId,
      retailerName: orderData.retailerName.slice(0, 140),
      timeline,
    };

    if (orderData.deliveryInstructions && orderData.deliveryInstructions.trim()) {
      payload.deliveryInstructions = orderData.deliveryInstructions.trim().slice(0, 300);
    }
    if (orderData.estimatedDeliveryTime) {
      payload.estimatedDeliveryTime = orderData.estimatedDeliveryTime.slice(0, 100);
    }

    try {
      await setDoc(doc(db, 'orders', id), payload);
      return {
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Order;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateOrderStatus(order: Order, nextStatus: OrderStatus, customNote?: string): Promise<void> {
    const path = `orders/${order.id}`;
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
        break;
      case 'Cancelled':
        defaultNote = customNote || 'Order cancelled.';
        break;
      default:
        defaultNote = `Order status updated to ${nextStatus}.`;
    }

    const updatedTimeline = [
      ...order.timeline,
      {
        status: nextStatus,
        timestamp: timeFormatted,
        note: customNote || defaultNote,
      },
    ].slice(-20);

    try {
      const docRef = doc(db, 'orders', order.id);
      const updatePayload: Record<string, any> = {
        status: nextStatus,
        timeline: updatedTimeline,
        updatedAt: serverTimestamp(),
      };
      if (nextStatus === 'Delivered') {
        updatePayload.paymentStatus = 'Paid on Delivery';
      }
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Enquiries (Owner or Admin) ---
  subscribeEnquiries(
    userId: string,
    isAdmin: boolean,
    onData: (enquiries: CustomerEnquiry[]) => void
  ): () => void {
    const path = 'enquiries';
    const q = isAdmin
      ? query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'enquiries'), where('userId', '==', userId));

    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          } as CustomerEnquiry;
        });
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async createEnquiry(
    user: User,
    enquiry: Omit<CustomerEnquiry, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'customerEmail'>
  ): Promise<void> {
    const id = `enq-${Date.now()}`;
    const path = `enquiries/${id}`;
    try {
      const payload = {
        id,
        userId: user.uid,
        customerEmail: user.email || '',
        customerName: enquiry.customerName.trim().slice(0, 100),
        customerPhone: enquiry.customerPhone.trim().slice(0, 25),
        locality: enquiry.locality.trim().slice(0, 120),
        itemDescription: enquiry.itemDescription.trim().slice(0, 1000),
        category: enquiry.category.trim().slice(0, 80),
        urgency: enquiry.urgency,
        status: 'Received',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'enquiries', id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateEnquiry(enquiryId: string, updates: { status?: CustomerEnquiry['status']; adminNotes?: string }): Promise<void> {
    const path = `enquiries/${enquiryId}`;
    try {
      const docRef = doc(db, 'enquiries', enquiryId);
      const payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.status !== undefined) {
        payload.status = updates.status;
      }
      if (updates.adminNotes !== undefined) {
        payload.adminNotes = updates.adminNotes.slice(0, 500);
      }
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Economics Config ---
  subscribeEconomics(onData: (config: EconomicsConfig) => void): () => void {
    const path = 'config/economics';
    return onSnapshot(
      doc(db, 'config', 'economics'),
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as EconomicsConfig);
        } else {
          onData(DEFAULT_ECONOMICS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  async saveEconomics(config: EconomicsConfig): Promise<void> {
    const path = 'config/economics';
    try {
      await setDoc(doc(db, 'config', 'economics'), {
        baseDeliveryCharge: Math.max(0, Number(config.baseDeliveryCharge)),
        freeDeliveryThreshold: Math.max(0, Number(config.freeDeliveryThreshold)),
        retailerCommissionPct: Math.min(100, Math.max(0, Number(config.retailerCommissionPct))),
        defaultAssumedAOV: Math.max(0, Number(config.defaultAssumedAOV)),
        defaultAssumedVariableCost: Math.max(0, Number(config.defaultAssumedVariableCost)),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // --- Admin Seed Helper ---
  async seedInitialCatalogueIfEmpty(): Promise<void> {
    try {
      const prodSnap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      let ops = 0;

      if (prodSnap.empty) {
        INITIAL_PRODUCTS.forEach((p) => {
          batch.set(doc(db, 'products', p.id), stripUndefined(p));
          ops++;
        });
      }

      const retSnap = await getDocs(collection(db, 'retailers'));
      if (retSnap.empty) {
        INITIAL_RETAILERS.forEach((r) => {
          batch.set(doc(db, 'retailers', r.id), stripUndefined(r));
          ops++;
        });
      }

      const econSnap = await getDoc(doc(db, 'config', 'economics'));
      if (!econSnap.exists()) {
        batch.set(doc(db, 'config', 'economics'), DEFAULT_ECONOMICS);
        ops++;
      }

      if (ops > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/retailers/config');
    }
  },

  async forceResetDemoSeeds(): Promise<void> {
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((p) => {
        batch.set(doc(db, 'products', p.id), stripUndefined(p));
      });
      INITIAL_RETAILERS.forEach((r) => {
        batch.set(doc(db, 'retailers', r.id), stripUndefined(r));
      });
      batch.set(doc(db, 'config', 'economics'), DEFAULT_ECONOMICS);
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_reset');
    }
  },
};
