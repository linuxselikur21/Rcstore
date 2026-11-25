import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../data/seedCatalog';
import {
  CartItem,
  Category,
  ContactMessage,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  Subscriber,
  UserProfile,
} from '../types/store';
import { getEffectivePrice, slugify } from '../utils/format';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreError';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function makeCartItemId(productId: string, size: string, color: string): string {
  const raw = `${productId}__${size}__${color}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export async function checkIsAdmin(uid: string, email: string | null): Promise<boolean> {
  if (!uid) return false;
  if (email === 'linuxselikur@gmail.com') return true;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

// --- Users / Profiles ---
export async function ensureUserProfile(
  firebaseUser: User,
  extra?: { displayName?: string; phone?: string }
): Promise<UserProfile> {
  const path = `users/${firebaseUser.uid}`;
  const ref = doc(db, 'users', firebaseUser.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const displayName = (
      extra?.displayName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Pelanggan RC'
    )
      .trim()
      .slice(0, 120);

    const profileData = {
      uid: firebaseUser.uid,
      displayName,
      email: (firebaseUser.email || '').trim().slice(0, 160),
      phone: (extra?.phone || '').trim().slice(0, 24),
      address: '',
      province: 'DKI Jakarta',
      city: '',
      district: '',
      postalCode: '',
      role: 'customer' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, profileData);
    return {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): () => void {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function updateUserProfileData(
  uid: string,
  updates: Pick<
    UserProfile,
    'displayName' | 'phone' | 'address' | 'province' | 'city' | 'district' | 'postalCode'
  >
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: updates.displayName.trim().slice(0, 120),
      phone: updates.phone.trim().slice(0, 24),
      address: updates.address.trim().slice(0, 400),
      province: updates.province.trim().slice(0, 80),
      city: updates.city.trim().slice(0, 80),
      district: updates.district.trim().slice(0, 80),
      postalCode: updates.postalCode.trim().slice(0, 12),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// --- User Persistent Cart in Firestore ---
export function subscribeUserCart(
  uid: string,
  onData: (items: CartItem[]) => void
): () => void {
  const path = `users/${uid}/cart`;
  return onSnapshot(
    collection(db, 'users', uid, 'cart'),
    (snapshot) => {
      const items: CartItem[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<CartItem, 'key'>;
        return {
          key: d.id,
          ...data,
        };
      });
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function upsertUserCartItem(uid: string, item: CartItem): Promise<void> {
  const key = makeCartItemId(item.productId, item.size, item.color);
  const path = `users/${uid}/cart/${key}`;
  const price = Math.max(1000, Math.round(item.price));
  const discountPrice =
    item.discountPrice > 0 && item.discountPrice < price ? Math.round(item.discountPrice) : 0;

  try {
    await setDoc(doc(db, 'users', uid, 'cart', key), {
      productId: item.productId.slice(0, 128),
      name: item.name.slice(0, 140),
      category: item.category.slice(0, 60),
      imageUrl: item.imageUrl.slice(0, 500),
      price,
      discountPrice,
      size: item.size.slice(0, 10),
      color: item.color.slice(0, 40),
      quantity: Math.min(100, Math.max(1, Math.round(item.quantity))),
      maxStock: Math.max(0, Math.round(item.maxStock)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeUserCartItem(uid: string, key: string): Promise<void> {
  const path = `users/${uid}/cart/${key}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'cart', key));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearUserCartInFirestore(uid: string): Promise<void> {
  const path = `users/${uid}/cart`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'cart'));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function mergeGuestCartToFirestore(uid: string, guestItems: CartItem[]): Promise<void> {
  if (guestItems.length === 0) return;
  const path = `users/${uid}/cart`;
  try {
    const existingSnap = await getDocs(collection(db, 'users', uid, 'cart'));
    const existingMap = new Map<string, CartItem>();
    existingSnap.docs.forEach((d) => {
      existingMap.set(d.id, { key: d.id, ...(d.data() as Omit<CartItem, 'key'>) });
    });

    const batch = writeBatch(db);
    for (const item of guestItems) {
      const key = makeCartItemId(item.productId, item.size, item.color);
      const prev = existingMap.get(key);
      const nextQty = Math.min(item.maxStock || 99, (prev?.quantity || 0) + item.quantity);
      const price = Math.max(1000, Math.round(item.price));
      const discountPrice =
        item.discountPrice > 0 && item.discountPrice < price ? Math.round(item.discountPrice) : 0;

      batch.set(doc(db, 'users', uid, 'cart', key), {
        productId: item.productId.slice(0, 128),
        name: item.name.slice(0, 140),
        category: item.category.slice(0, 60),
        imageUrl: item.imageUrl.slice(0, 500),
        price,
        discountPrice,
        size: item.size.slice(0, 10),
        color: item.color.slice(0, 40),
        quantity: Math.min(100, Math.max(1, nextQty)),
        maxStock: Math.max(0, Math.round(item.maxStock)),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- User Persistent Wishlist in Firestore ---
export function subscribeUserWishlist(
  uid: string,
  onData: (productIds: string[]) => void
): () => void {
  const path = `users/${uid}/wishlist`;
  return onSnapshot(
    collection(db, 'users', uid, 'wishlist'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.id));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function toggleUserWishlistInFirestore(
  uid: string,
  productId: string,
  existsCurrently: boolean
): Promise<void> {
  const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${uid}/wishlist/${safeId}`;
  try {
    if (existsCurrently) {
      await deleteDoc(doc(db, 'users', uid, 'wishlist', safeId));
    } else {
      await setDoc(doc(db, 'users', uid, 'wishlist', safeId), {
        productId: safeId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Categories & Products ---
export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'categories';
  const q = query(collection(db, path), orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'products';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function seedInitialCatalog(): Promise<{ categoriesSeeded: number; productsSeeded: number }> {
  try {
    const batch = writeBatch(db);
    const catSnap = await getDocs(collection(db, 'categories'));
    const prodSnap = await getDocs(collection(db, 'products'));

    let categoriesSeeded = 0;
    let productsSeeded = 0;

    if (catSnap.empty) {
      for (const cat of SEED_CATEGORIES) {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, {
          name: cat.name.slice(0, 60),
          slug: slugify(cat.slug || cat.name).slice(0, 60),
          description: cat.description.slice(0, 240),
          imageUrl: cat.imageUrl.slice(0, 500),
          displayOrder: cat.displayOrder,
          createdAt: serverTimestamp(),
        });
        categoriesSeeded += 1;
      }
    }

    if (prodSnap.empty) {
      for (const prod of SEED_PRODUCTS) {
        const ref = doc(db, 'products', prod.id);
        batch.set(ref, {
          name: prod.name.slice(0, 140),
          slug: slugify(prod.slug || prod.name).slice(0, 160),
          category: prod.category.slice(0, 60),
          description: prod.description.slice(0, 2000),
          material: prod.material.slice(0, 240),
          price: Number(prod.price),
          discountPrice: Number(prod.discountPrice || 0),
          stock: Number(prod.stock),
          rating: Number(prod.rating),
          reviewCount: Number(prod.reviewCount),
          sizes: prod.sizes.slice(0, 8),
          colors: prod.colors.slice(0, 10),
          images: prod.images.slice(0, 8),
          isBestSeller: Boolean(prod.isBestSeller),
          isNewArrival: Boolean(prod.isNewArrival),
          isSale: Boolean(prod.isSale),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        productsSeeded += 1;
      }
    }

    if (categoriesSeeded > 0 || productsSeeded > 0) {
      await batch.commit();
    }
    return { categoriesSeeded, productsSeeded };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

export async function saveProduct(
  input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<string> {
  const id = existingId || makeSafeId('prod');
  const path = `products/${id}`;
  const price = Math.max(1000, Math.round(Number(input.price)));
  const rawDiscount = Math.max(0, Math.round(Number(input.discountPrice || 0)));
  const discountPrice = rawDiscount > 0 && rawDiscount < price ? rawDiscount : 0;

  const payload = {
    name: input.name.trim().slice(0, 140),
    slug: (slugify(input.slug || input.name) || id).slice(0, 160),
    category: input.category.trim().slice(0, 60),
    description: input.description.trim().slice(0, 2000),
    material: (input.material || '100% Cotton').trim().slice(0, 240),
    price,
    discountPrice,
    stock: Math.max(0, Math.round(Number(input.stock))),
    rating: Math.min(5, Math.max(0, Number(input.rating || 4.8))),
    reviewCount: Math.max(0, Math.round(Number(input.reviewCount || 0))),
    sizes: (input.sizes.length > 0 ? input.sizes : ['S', 'M', 'L', 'XL', 'XXL']).slice(0, 8),
    colors: (input.colors.length > 0 ? input.colors : ['Jet Black']).slice(0, 10),
    images: (
      input.images.length > 0
        ? input.images
        : ['/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg']
    ).slice(0, 8),
    isBestSeller: Boolean(input.isBestSeller),
    isNewArrival: Boolean(input.isNewArrival),
    isSale: discountPrice > 0 ? true : Boolean(input.isSale),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, 'products', existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'products', id), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteProductById(id: string): Promise<void> {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateProductStock(id: string, stock: number): Promise<void> {
  const path = `products/${id}`;
  try {
    await updateDoc(doc(db, 'products', id), {
      stock: Math.max(0, Math.round(stock)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCategory(
  input: Omit<Category, 'id' | 'createdAt'>,
  existingId?: string
): Promise<string> {
  const id = existingId || makeSafeId('cat');
  const path = `categories/${id}`;
  const payload = {
    name: input.name.trim().slice(0, 60),
    slug: (slugify(input.slug || input.name) || id).slice(0, 60),
    description: (input.description || '').trim().slice(0, 240),
    imageUrl: (
      input.imageUrl || '/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg'
    )
      .trim()
      .slice(0, 500),
    displayOrder: Math.max(0, Math.round(Number(input.displayOrder || 1))),
  };
  try {
    if (existingId) {
      await updateDoc(doc(db, 'categories', existingId), payload);
    } else {
      await setDoc(doc(db, 'categories', id), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteCategoryById(id: string): Promise<void> {
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Orders ---
export interface CreateOrderInput {
  fullName: string;
  whatsapp: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  notes: string;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  promoCode: string;
  discountAmount: number;
  items: CartItem[];
}

export async function createOrderAtomic(input: CreateOrderInput): Promise<Order> {
  const orderId = makeSafeId('ord');
  const orderNumber = `RC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
  const userId = auth.currentUser?.uid || '';

  const subtotal = input.items.reduce(
    (sum, item) => sum + getEffectivePrice(item.price, item.discountPrice) * item.quantity,
    0
  );
  const itemsCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Math.round(input.discountAmount)));
  const shippingCost = Math.max(0, Math.round(input.shippingCost));
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  const itemsSummary = input.items
    .map((i) => `${i.name} (${i.size}/${i.color}) x${i.quantity}`)
    .join(', ')
    .slice(0, 400);

  const orderData = {
    orderNumber,
    userId,
    fullName: input.fullName.trim().slice(0, 120),
    whatsapp: input.whatsapp.trim().slice(0, 24),
    address: input.address.trim().slice(0, 400),
    province: input.province.trim().slice(0, 80),
    city: input.city.trim().slice(0, 80),
    district: input.district.trim().slice(0, 80),
    postalCode: input.postalCode.trim().slice(0, 12),
    notes: (input.notes || '').trim().slice(0, 500),
    shippingMethod: input.shippingMethod.trim().slice(0, 80),
    shippingCost,
    paymentMethod: input.paymentMethod,
    itemsSummary,
    itemsCount,
    subtotal,
    discountAmount,
    totalAmount,
    promoCode: (input.promoCode || '').trim().toUpperCase().slice(0, 40),
    status: 'Pending' as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', orderId);
    batch.set(orderRef, orderData);

    input.items.forEach((item, index) => {
      const unitPrice = getEffectivePrice(item.price, item.discountPrice);
      const itemId = `item-${index + 1}-${Date.now()}`;
      const itemRef = doc(db, 'orders', orderId, 'items', itemId);
      const lineItem: Omit<OrderItem, 'id'> = {
        orderId,
        orderUserId: userId,
        productId: item.productId.slice(0, 128),
        productName: item.name.slice(0, 140),
        imageUrl: item.imageUrl.slice(0, 500),
        size: item.size.slice(0, 10),
        color: item.color.slice(0, 40),
        quantity: Math.max(1, Math.round(item.quantity)),
        unitPrice,
        lineTotal: unitPrice * Math.max(1, Math.round(item.quantity)),
      };
      batch.set(itemRef, lineItem);
    });

    await batch.commit();
    return {
      id: orderId,
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: Order[]) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }))
        .sort((a, b) => {
          const getMs = (v: unknown) => {
            if (v && typeof v === 'object' && 'toMillis' in v) {
              return (v as { toMillis: () => number }).toMillis();
            }
            return 0;
          };
          return getMs(b.createdAt) - getMs(a.createdAt);
        });
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const path = `orders/${orderId}/items`;
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<OrderItem, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatusById(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Newsletter & Contact ---
export async function subscribeNewsletterEmail(email: string): Promise<void> {
  const id = makeSafeId('sub');
  const path = `subscribers/${id}`;
  try {
    await setDoc(doc(db, 'subscribers', id), {
      email: email.trim().toLowerCase().slice(0, 160),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchSubscribers(): Promise<Subscriber[]> {
  const path = 'subscribers';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Subscriber, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitContactInquiry(input: {
  name: string;
  email: string;
  whatsapp: string;
  subject: string;
  message: string;
}): Promise<void> {
  const id = makeSafeId('msg');
  const path = `contact_messages/${id}`;
  try {
    await setDoc(doc(db, 'contact_messages', id), {
      name: input.name.trim().slice(0, 120),
      email: input.email.trim().slice(0, 160),
      whatsapp: input.whatsapp.trim().slice(0, 24),
      subject: input.subject.trim().slice(0, 160),
      message: input.message.trim().slice(0, 1500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const path = 'contact_messages';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ContactMessage, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
