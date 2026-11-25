import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  createUserWithEmailAndPassword,
  googleProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from '../lib/firebase';
import {
  checkIsAdmin,
  clearUserCartInFirestore,
  ensureUserProfile,
  makeCartItemId,
  mergeGuestCartToFirestore,
  removeUserCartItem,
  seedInitialCatalog,
  subscribeCategories,
  subscribeProducts,
  subscribeUserCart,
  subscribeUserProfile,
  subscribeUserWishlist,
  toggleUserWishlistInFirestore,
  upsertUserCartItem,
} from '../lib/storeService';
import { CartItem, Category, Product, UserProfile } from '../types/store';
import { getEffectivePrice } from '../utils/format';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextValue {
  products: Product[];
  categories: Category[];
  catalogLoading: boolean;
  isCatalogEmpty: boolean;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  wishlistIds: string[];
  wishlistProducts: Product[];
  cartDrawerOpen: boolean;
  wishlistDrawerOpen: boolean;
  searchOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  setWishlistDrawerOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (key: string) => void;
  updateCartQty: (key: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  isAdmin: boolean;
  registerWithEmail: (name: string, email: string, password: string, phone: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInAdmin: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncSeedToFirestore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk dengan akun Anda.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah. Silakan periksa kembali.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum selesai.';
    case 'auth/operation-not-allowed':
      return 'Login Email/Password belum diaktifkan di Firebase Console (Authentication > Sign-in method).';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi.';
    default:
      return error instanceof Error ? error.message : 'Terjadi kesalahan autentikasi.';
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Guest in-memory session state (no localStorage database) + Firestore synced state for signed-in users
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const [firestoreCart, setFirestoreCart] = useState<CartItem[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [firestoreWishlist, setFirestoreWishlist] = useState<string[]>([]);

  const guestCartRef = useRef<CartItem[]>([]);
  guestCartRef.current = guestCart;

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Subscribe directly to Cloud Firestore products & categories
  useEffect(() => {
    let resolvedProducts = false;
    let resolvedCategories = false;
    const checkDone = () => {
      if (resolvedProducts && resolvedCategories) {
        setCatalogLoading(false);
      }
    };

    const unsubProducts = subscribeProducts(
      (items) => {
        setProducts(items);
        resolvedProducts = true;
        checkDone();
      },
      () => {
        setProducts([]);
        resolvedProducts = true;
        checkDone();
      }
    );

    const unsubCategories = subscribeCategories(
      (items) => {
        setCategories(items);
        resolvedCategories = true;
        checkDone();
      },
      () => {
        setCategories([]);
        resolvedCategories = true;
        checkDone();
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // Firebase Auth listener + Firestore user/cart/wishlist sync
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubCart: (() => void) | undefined;
    let unsubWishlist: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubProfile) unsubProfile();
      if (unsubCart) unsubCart();
      if (unsubWishlist) unsubWishlist();

      setUser(currentUser);
      if (currentUser) {
        try {
          const adminOk = await checkIsAdmin(currentUser.uid, currentUser.email);
          setIsAdmin(adminOk);

          await ensureUserProfile(currentUser);

          if (guestCartRef.current.length > 0) {
            await mergeGuestCartToFirestore(currentUser.uid, guestCartRef.current);
            setGuestCart([]);
          }

          unsubProfile = subscribeUserProfile(currentUser.uid, setUserProfile);
          unsubCart = subscribeUserCart(currentUser.uid, setFirestoreCart);
          unsubWishlist = subscribeUserWishlist(currentUser.uid, setFirestoreWishlist);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setFirestoreCart([]);
        setFirestoreWishlist([]);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubCart) unsubCart();
      if (unsubWishlist) unsubWishlist();
    };
  }, []);

  const cart = user ? firestoreCart : guestCart;
  const wishlistIds = user ? firestoreWishlist : guestWishlist;
  const isCatalogEmpty = !catalogLoading && products.length === 0;

  const addToCart = useCallback(
    (product: Product, size: string, color: string, quantity = 1) => {
      if (product.stock <= 0) {
        showToast('Maaf, stok produk ini sedang habis.', 'error');
        return;
      }
      const key = makeCartItemId(product.id, size, color);
      const currentList = user ? firestoreCart : guestCart;
      const existing = currentList.find((item) => item.key === key);
      const nextQty = existing
        ? Math.min(product.stock, existing.quantity + quantity)
        : Math.min(product.stock, Math.max(1, quantity));

      const nextItem: CartItem = {
        key,
        productId: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.images[0] || '',
        price: product.price,
        discountPrice: product.discountPrice,
        size,
        color,
        quantity: nextQty,
        maxStock: product.stock,
      };

      if (user) {
        void upsertUserCartItem(user.uid, nextItem);
      } else {
        setGuestCart((prev) => {
          const found = prev.some((i) => i.key === key);
          if (found) {
            return prev.map((i) => (i.key === key ? nextItem : i));
          }
          return [...prev, nextItem];
        });
      }
      showToast(`${product.name} (${size}) ditambahkan ke keranjang.`, 'success');
    },
    [user, firestoreCart, guestCart, showToast]
  );

  const removeFromCart = useCallback(
    (key: string) => {
      if (user) {
        void removeUserCartItem(user.uid, key);
      } else {
        setGuestCart((prev) => prev.filter((item) => item.key !== key));
      }
    },
    [user]
  );

  const updateCartQty = useCallback(
    (key: string, quantity: number) => {
      if (user) {
        const target = firestoreCart.find((i) => i.key === key);
        if (!target) return;
        if (quantity <= 0) {
          void removeUserCartItem(user.uid, key);
        } else {
          void upsertUserCartItem(user.uid, {
            ...target,
            quantity: Math.min(target.maxStock || 99, quantity),
          });
        }
      } else {
        setGuestCart((prev) => {
          if (quantity <= 0) {
            return prev.filter((item) => item.key !== key);
          }
          return prev.map((item) =>
            item.key === key ? { ...item, quantity: Math.min(item.maxStock || 99, quantity) } : item
          );
        });
      }
    },
    [user, firestoreCart]
  );

  const clearCart = useCallback(() => {
    if (user) {
      void clearUserCartInFirestore(user.uid);
    } else {
      setGuestCart([]);
    }
  }, [user]);

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      const exists = wishlistIds.includes(productId);
      if (user) {
        void toggleUserWishlistInFirestore(user.uid, productId, exists);
      } else {
        setGuestWishlist((prev) =>
          exists ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
      }
      showToast(
        exists
          ? productName
            ? `${productName} dihapus dari wishlist.`
            : 'Dihapus dari wishlist.'
          : productName
          ? `${productName} disimpan ke wishlist.`
          : 'Disimpan ke wishlist.',
        exists ? 'info' : 'success'
      );
    },
    [user, wishlistIds, showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + getEffectivePrice(item.price, item.discountPrice) * item.quantity,
        0
      ),
    [cart]
  );

  // Auth Actions
  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string, phone: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await ensureUserProfile(cred.user, { displayName: name.trim(), phone: phone.trim() });
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Non-blocking verification email send
        }
        showToast('Pendaftaran berhasil! Selamat datang di RC STORE.', 'success');
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
    [showToast]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserProfile(cred.user);
        showToast('Berhasil masuk ke akun RC STORE.', 'success');
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
    [showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(cred.user);
      showToast('Berhasil masuk dengan Google.', 'success');
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, [showToast]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        showToast('Link reset password telah dikirim ke email Anda.', 'success');
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
    [showToast]
  );

  const signInAdmin = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(result.user);
      const adminOk = await checkIsAdmin(result.user.uid, result.user.email);
      setIsAdmin(adminOk);
      if (adminOk) {
        showToast('Berhasil masuk sebagai Admin RC STORE.', 'success');
      } else {
        showToast('Akun Google ini tidak terdaftar sebagai Admin.', 'error');
      }
    } catch (error) {
      showToast(mapFirebaseAuthError(error), 'error');
    }
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setIsAdmin(false);
    setUserProfile(null);
    setFirestoreCart([]);
    setFirestoreWishlist([]);
    showToast('Anda telah keluar dari akun.', 'info');
  }, [showToast]);

  const syncSeedToFirestore = useCallback(async () => {
    const res = await seedInitialCatalog();
    showToast(
      `Katalog Firestore disinkronkan (${res.categoriesSeeded} kategori, ${res.productsSeeded} produk).`,
      'success'
    );
  }, [showToast]);

  const value: StoreContextValue = {
    products,
    categories,
    catalogLoading,
    isCatalogEmpty,
    cart,
    cartCount,
    cartSubtotal,
    wishlistIds,
    wishlistProducts,
    cartDrawerOpen,
    wishlistDrawerOpen,
    searchOpen,
    setCartDrawerOpen,
    setWishlistDrawerOpen,
    setSearchOpen,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    toggleWishlist,
    isWishlisted,
    toasts,
    showToast,
    dismissToast,
    user,
    userProfile,
    authLoading,
    isAdmin,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    signInAdmin,
    signOutUser,
    syncSeedToFirestore,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
