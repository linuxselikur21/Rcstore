import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Download,
  Eye,
  FolderTree,
  LogOut,
  Mail,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { StoreImage } from '../components/StoreImage';
import { useStore } from '../context/StoreContext';
import {
  deleteCategoryById,
  deleteProductById,
  fetchAllUsers,
  fetchContactMessages,
  fetchOrderItems,
  fetchSubscribers,
  saveCategory,
  saveProduct,
  subscribeOrders,
  updateOrderStatusById,
  updateProductStock,
} from '../lib/storeService';
import {
  Category,
  ContactMessage,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Subscriber,
  UserProfile,
} from '../types/store';
import { formatFirestoreDate, formatIDR, slugify } from '../utils/format';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'stock'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'inbox';

const STUDIO_IMAGES = [
  '/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg',
  '/src/assets/images/prod_tshirt_white_1795623882128.jpg',
  '/src/assets/images/prod_shirt_oxford_1795623882684.jpg',
  '/src/assets/images/prod_hoodie_boxy_1795623882722.jpg',
  '/src/assets/images/prod_hoodie_zip_1795623882576.jpg',
  '/src/assets/images/prod_jacket_workwear_1795623882609.jpg',
  '/src/assets/images/prod_jacket_denim_1795623882591.jpg',
  '/src/assets/images/prod_pants_cargo_1795623882686.jpg',
  '/src/assets/images/prod_jeans_selvedge_1795623882744.jpg',
  '/src/assets/images/prod_cap_tote_1795623906209.jpg',
];

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

const DEFAULT_CATEGORY_OPTIONS = [
  'T-Shirt',
  'Shirt',
  'Hoodie',
  'Jacket',
  'Pants',
  'Jeans',
  'Accessories',
];

export const AdminPage: React.FC = () => {
  const {
    products,
    categories,
    catalogLoading,
    isCatalogEmpty,
    user,
    authLoading,
    isAdmin,
    signInAdmin,
    signOutUser,
    syncSeedToFirestore,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [syncingSeed, setSyncingSeed] = useState(false);

  // Order filters & detail modal
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'T-Shirt',
    price: '199000',
    discountPrice: '0',
    stock: '25',
    rating: '4.8',
    reviewCount: '10',
    description: '',
    material: '100% Combed Cotton 280gsm',
    sizesText: 'S, M, L, XL, XXL',
    colorsText: 'Jet Black, Charcoal',
    imageUrl: STUDIO_IMAGES[0],
    isBestSeller: false,
    isNewArrival: true,
    isSale: false,
  });

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    imageUrl: STUDIO_IMAGES[0],
    displayOrder: '1',
  });

  // Stock filter & edits
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});

  // Product search in admin
  const [prodSearch, setProdSearch] = useState('');

  // Load admin-only Firestore collections when authorized
  useEffect(() => {
    if (!isAdmin) return;
    setOrdersLoading(true);
    setUsersLoading(true);
    const unsubOrders = subscribeOrders(
      (list) => {
        setOrders(list);
        setOrdersLoading(false);
      },
      () => {
        setOrdersLoading(false);
      }
    );

    void fetchAllUsers()
      .then(setRegisteredUsers)
      .catch(() => {})
      .finally(() => setUsersLoading(false));
    void fetchSubscribers().then(setSubscribers).catch(() => {});
    void fetchContactMessages().then(setMessages).catch(() => {});

    return () => {
      unsubOrders();
    };
  }, [isAdmin]);

  // Metrics
  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = validOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'Pending').length;
    const lowStockCount = products.filter((p) => p.stock <= 15).length;
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingCount,
      lowStockCount,
    };
  }, [products, orders]);

  // Aggregated Customers from Orders
  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        fullName: string;
        whatsapp: string;
        location: string;
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    >();

    for (const order of orders) {
      const key = order.whatsapp || order.fullName;
      const existing = map.get(key);
      const spent = order.status === 'Cancelled' ? 0 : order.totalAmount || 0;
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += spent;
      } else {
        map.set(key, {
          key,
          fullName: order.fullName,
          whatsapp: order.whatsapp,
          location: `${order.city}, ${order.province}`,
          orderCount: 1,
          totalSpent: spent,
          lastOrderDate: formatFirestoreDate(order.createdAt),
        });
      }
    }
    return Array.from(map.values());
  }, [orders]);

  // Sales breakdown by payment method and status
  const salesBreakdown = useMemo(() => {
    const byPayment: Record<string, { count: number; total: number }> = {
      'Transfer Bank': { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      COD: { count: 0, total: 0 },
    };
    const byStatus: Record<OrderStatus, number> = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Completed: 0,
      Cancelled: 0,
    };

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.status !== 'Cancelled') {
        if (!byPayment[o.paymentMethod]) {
          byPayment[o.paymentMethod] = { count: 0, total: 0 };
        }
        byPayment[o.paymentMethod].count += 1;
        byPayment[o.paymentMethod].total += o.totalAmount || 0;
      }
    }
    return { byPayment, byStatus };
  }, [orders]);

  const filteredAdminProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (lowStockOnly && p.stock > 15) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [products, prodSearch, lowStockOnly]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'All') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  // Handlers
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category: categories[0]?.name || 'T-Shirt',
      price: '199000',
      discountPrice: '0',
      stock: '25',
      rating: '4.8',
      reviewCount: '0',
      description: '',
      material: '100% Combed Cotton 280gsm',
      sizesText: 'S, M, L, XL, XXL',
      colorsText: 'Jet Black, Charcoal',
      imageUrl: STUDIO_IMAGES[0],
      isBestSeller: false,
      isNewArrival: true,
      isSale: false,
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      discountPrice: String(product.discountPrice || 0),
      stock: String(product.stock),
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      description: product.description,
      material: product.material,
      sizesText: product.sizes.join(', '),
      colorsText: product.colors.join(', '),
      imageUrl: product.images[0] || STUDIO_IMAGES[0],
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      isSale: product.isSale,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prodForm.name.trim().length < 2 || prodForm.description.trim().length < 5) {
      showToast('Nama produk (min. 2 karakter) dan deskripsi (min. 5 karakter) wajib diisi.', 'error');
      return;
    }

    const sizes = prodForm.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = prodForm.colorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      await saveProduct(
        {
          name: prodForm.name,
          slug: slugify(prodForm.name),
          category: prodForm.category,
          description: prodForm.description,
          material: prodForm.material,
          price: Number(prodForm.price),
          discountPrice: Number(prodForm.discountPrice || 0),
          stock: Number(prodForm.stock),
          rating: Number(prodForm.rating),
          reviewCount: Number(prodForm.reviewCount),
          sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL'],
          colors: colors.length > 0 ? colors : ['Jet Black'],
          images: [prodForm.imageUrl.trim() || STUDIO_IMAGES[0]],
          isBestSeller: prodForm.isBestSeller,
          isNewArrival: prodForm.isNewArrival,
          isSale: prodForm.isSale,
        },
        editingProduct ? editingProduct.id : undefined
      );
      setProductModalOpen(false);
      showToast(editingProduct ? 'Produk diperbarui.' : 'Produk baru ditambahkan.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan produk.', 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProductById(product.id);
      showToast(`${product.name} dihapus.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus produk.', 'error');
    }
  };

  const handleSaveStock = async (product: Product) => {
    const nextStock = stockDrafts[product.id] ?? product.stock;
    try {
      await updateProductStock(product.id, nextStock);
      showToast(`Stok ${product.name} diperbarui ke ${nextStock} pcs.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui stok.', 'error');
    }
  };

  const handleSyncSeed = async () => {
    setSyncingSeed(true);
    try {
      await syncSeedToFirestore();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan katalog awal.', 'error');
    } finally {
      setSyncingSeed(false);
    }
  };

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      description: '',
      imageUrl: STUDIO_IMAGES[0],
      displayOrder: String(categories.length + 1),
    });
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: String(cat.displayOrder),
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showToast('Nama kategori wajib diisi.', 'error');
      return;
    }
    try {
      await saveCategory(
        {
          name: catForm.name,
          slug: slugify(catForm.name),
          description: catForm.description,
          imageUrl: catForm.imageUrl,
          displayOrder: Number(catForm.displayOrder || 1),
        },
        editingCat ? editingCat.id : undefined
      );
      setCatModalOpen(false);
      showToast(editingCat ? 'Kategori diperbarui.' : 'Kategori ditambahkan.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan kategori.', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    try {
      await deleteCategoryById(cat.id);
      showToast(`Kategori ${cat.name} dihapus.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus kategori.', 'error');
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingOrderItems(true);
    try {
      const items = await fetchOrderItems(order.id);
      setSelectedOrderItems(items);
    } catch {
      setSelectedOrderItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusById(orderId, status);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      showToast(`Status pesanan diubah menjadi ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status pesanan.', 'error');
    }
  };

  const handleExportCsv = () => {
    const header = ['Order Number', 'Tanggal', 'Pelanggan', 'WhatsApp', 'Kota', 'Pembayaran', 'Status', 'Total'];
    const rows = orders.map((o) => [
      o.orderNumber,
      formatFirestoreDate(o.createdAt),
      `"${o.fullName.replace(/"/g, '""')}"`,
      o.whatsapp,
      `"${o.city}, ${o.province}"`,
      o.paymentMethod,
      o.status,
      String(o.totalAmount),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rc-store-laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan penjualan CSV diunduh.', 'success');
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-sm text-zinc-500">Memeriksa sesi admin...</p>
      </div>
    );
  }

  // Admin Login Gate
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="border border-zinc-200 bg-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/aistudio/Minimalist_RC_Store_Logo_181a503e.png"
              alt="Logo RC STORE"
              className="w-11 h-11 object-contain bg-black rounded-sm shrink-0"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                RC STORE Backoffice
              </p>
              <h1 className="font-display text-2xl font-bold text-zinc-950">
                Login Dashboard Admin
              </h1>
            </div>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed mb-6">
            Masuk menggunakan akun Google Admin terdaftar untuk mengelola produk, kategori, stok,
            pesanan pelanggan, dan laporan penjualan.
          </p>

          {user && !isAdmin && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Akses Ditolak</span>
              </div>
              <p>
                Akun <strong>{user.email}</strong> tidak memiliki izin administrator RC STORE.
              </p>
              <button
                type="button"
                onClick={signOutUser}
                className="underline font-medium text-red-900"
              >
                Keluar dan ganti akun
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={signInAdmin}
            className="w-full h-12 bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            Masuk dengan Google (Admin)
          </button>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Ringkasan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: 'Produk', icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'Kategori', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'stock', label: 'Stok', icon: <Boxes className="w-4 h-4" /> },
    { id: 'orders', label: 'Pesanan', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'customers', label: 'Pelanggan', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Laporan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'inbox', label: 'Pesan & Newsletter', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Admin Top Header */}
      <div className="border-b border-zinc-200 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Dashboard Admin · {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 mt-1">
            Manajemen Toko RC STORE
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!catalogLoading && (isCatalogEmpty || categories.length === 0) && (
            <button
              type="button"
              disabled={syncingSeed}
              onClick={handleSyncSeed}
              className="h-10 px-4 border border-zinc-950 bg-zinc-950 text-white text-xs font-medium inline-flex items-center gap-2 hover:bg-zinc-800 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSeed ? 'animate-spin' : ''}`} />
              <span>
                {syncingSeed ? 'Menyinkronkan...' : 'Sinkronkan Katalog Awal ke Firestore'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={signOutUser}
            className="h-10 px-4 border border-zinc-300 text-zinc-800 text-xs font-medium inline-flex items-center gap-2 hover:border-zinc-950 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 border-b border-zinc-200">
        {navItems.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 px-4 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-zinc-950 text-white'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-zinc-200 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total Produk</p>
              <p className="font-display text-3xl font-bold text-zinc-950 mt-2 tabular-nums">
                {metrics.totalProducts}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {metrics.lowStockCount} produk stok menipis (&le;15)
              </p>
            </div>
            <div className="border border-zinc-200 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total Pesanan</p>
              <p className="font-display text-3xl font-bold text-zinc-950 mt-2 tabular-nums">
                {metrics.totalOrders}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {metrics.pendingCount} menunggu diproses
              </p>
            </div>
            <div className="border border-zinc-200 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total Pendapatan</p>
              <p className="font-display text-3xl font-bold text-zinc-950 mt-2 tabular-nums">
                {formatIDR(metrics.totalRevenue)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Akumulasi pesanan aktif & selesai</p>
            </div>
            <div className="border border-zinc-200 p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total Pelanggan</p>
              <p className="font-display text-3xl font-bold text-zinc-950 mt-2 tabular-nums">
                {registeredUsers.length > 0 ? registeredUsers.length : customers.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {customers.length} pembeli · {subscribers.length} subscriber
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="border border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-zinc-950">
                Pesanan Terbaru
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs font-medium text-zinc-700 hover:text-zinc-950 underline"
              >
                Lihat Semua
              </button>
            </div>
            {ordersLoading ? (
              <p className="p-6 text-sm text-zinc-500">Memuat data pesanan...</p>
            ) : orders.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Belum ada pesanan masuk.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Pembayaran</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 tabular-nums">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50">
                        <td className="py-3 px-4 font-mono text-xs font-medium text-zinc-950">
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-4">{o.fullName}</td>
                        <td className="py-3 px-4 text-zinc-600">{o.paymentMethod}</td>
                        <td className="py-3 px-4 font-medium">{o.status}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatIDR(o.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="text"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="Cari produk atau kategori..."
              className="h-10 px-3.5 border border-zinc-300 text-sm w-full sm:w-80 focus:outline-none focus:border-zinc-950"
            />
            <button
              type="button"
              onClick={openCreateProduct}
              className="h-10 px-5 bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="border border-zinc-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga</th>
                  <th className="py-3 px-4 text-right">Diskon</th>
                  <th className="py-3 px-4 text-right">Stok</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {filteredAdminProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden">
                          <StoreImage
                            src={p.images[0] || ''}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-950 truncate max-w-[240px]">
                            {p.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {[
                              p.isBestSeller && 'Best Seller',
                              p.isNewArrival && 'New Arrival',
                              p.isSale && 'Sale',
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Reguler'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatIDR(p.price)}</td>
                    <td className="py-3 px-4 text-right text-zinc-600">
                      {p.discountPrice > 0 ? formatIDR(p.discountPrice) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{p.stock}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="px-3 py-1.5 border border-zinc-300 text-xs font-medium hover:border-zinc-950"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          aria-label={`Hapus ${p.name}`}
                          className="p-1.5 border border-zinc-300 text-zinc-600 hover:text-red-600 hover:border-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              Daftar Kategori ({categories.length})
            </h2>
            <button
              type="button"
              onClick={openCreateCategory}
              className="h-10 px-5 bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-zinc-800"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-zinc-200 p-4 flex gap-4 items-start">
                <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden">
                  <StoreImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-zinc-950 truncate">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-zinc-500 tabular-nums">#{cat.displayOrder}</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{cat.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="px-3 py-1 border border-zinc-300 text-xs font-medium hover:border-zinc-950"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="px-3 py-1 border border-zinc-300 text-xs text-red-600 hover:border-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STOCK MANAGEMENT */}
      {activeTab === 'stock' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              Manajemen Stok Inventaris
            </h2>
            <button
              type="button"
              onClick={() => setLowStockOnly((prev) => !prev)}
              className={`h-9 px-4 text-xs font-medium border ${
                lowStockOnly
                  ? 'bg-zinc-950 text-white border-zinc-950'
                  : 'bg-white text-zinc-700 border-zinc-300'
              }`}
            >
              Filter Stok Menipis (&le;15)
            </button>
          </div>

          <div className="border border-zinc-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Status Stok</th>
                  <th className="py-3 px-4 text-right">Ubah Jumlah</th>
                  <th className="py-3 px-4 text-right">Simpan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {filteredAdminProducts.map((p) => {
                  const val = stockDrafts[p.id] ?? p.stock;
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-medium text-zinc-950">{p.name}</td>
                      <td className="py-3 px-4 text-zinc-600">{p.category}</td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {p.stock === 0 ? (
                          <span className="text-red-600">Habis</span>
                        ) : p.stock <= 15 ? (
                          <span className="text-amber-700">Menipis ({p.stock})</span>
                        ) : (
                          <span className="text-zinc-700">Tersedia ({p.stock})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) =>
                            setStockDrafts((prev) => ({
                              ...prev,
                              [p.id]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className="w-24 h-9 px-2.5 border border-zinc-300 text-sm text-right tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveStock(p)}
                          className="h-9 px-4 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800"
                        >
                          Simpan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', ...ORDER_STATUSES] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setOrderStatusFilter(st)}
                className={`h-9 px-4 text-xs font-medium border ${
                  orderStatusFilter === st
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-white text-zinc-700 border-zinc-300'
                }`}
              >
                {st === 'All' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          <div className="border border-zinc-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Pembayaran</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      Tidak ada pesanan untuk filter status ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-zinc-950">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {formatFirestoreDate(o.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-zinc-950">{o.fullName}</p>
                        <p className="text-xs text-zinc-500">{o.whatsapp}</p>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{o.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatIDR(o.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={o.status}
                          onChange={(e) =>
                            handleOrderStatusChange(o.id, e.target.value as OrderStatus)
                          }
                          aria-label={`Ubah status pesanan ${o.orderNumber}`}
                          className="h-8 px-2 bg-white border border-zinc-300 text-xs font-medium"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(o)}
                          className="h-8 px-3 border border-zinc-300 text-xs font-medium inline-flex items-center gap-1.5 hover:border-zinc-950"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-8">
          <div className="border border-zinc-200 overflow-x-auto">
            <div className="px-4 py-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-zinc-950">
                Akun Pengguna Terdaftar ({registeredUsers.length})
              </h2>
              <span className="text-xs text-zinc-500">Collection: users</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Kota / Provinsi</th>
                  <th className="py-3 px-4">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Memuat data pengguna Firestore...
                    </td>
                  </tr>
                ) : registeredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Belum ada pengguna yang mendaftar.
                    </td>
                  </tr>
                ) : (
                  registeredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-semibold text-zinc-950">{u.displayName}</td>
                      <td className="py-3 px-4 text-zinc-700">{u.email}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-600">
                        {u.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {u.city ? `${u.city}, ${u.province}` : u.province || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-500">
                        {formatFirestoreDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-zinc-200 overflow-x-auto">
            <div className="px-4 py-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-zinc-950">
                Riwayat Pembeli dari Pesanan ({customers.length})
              </h2>
              <span className="text-xs text-zinc-500">Collection: orders</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4 text-right">Jumlah Pesanan</th>
                  <th className="py-3 px-4 text-right">Total Belanja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 tabular-nums">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Data pembeli akan terisi otomatis saat ada pesanan masuk.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.key}>
                      <td className="py-3 px-4 font-semibold text-zinc-950">{c.fullName}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-700">{c.whatsapp}</td>
                      <td className="py-3 px-4 text-zinc-600">{c.location}</td>
                      <td className="py-3 px-4 text-right font-medium">{c.orderCount}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatIDR(c.totalSpent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. SALES REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-zinc-950">
                Laporan Penjualan RC STORE
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ringkasan pendapatan berdasarkan metode pembayaran dan status pesanan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-10 px-5 bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-zinc-200 p-6">
              <h3 className="font-display text-base font-semibold text-zinc-950 mb-4">
                Pendapatan per Metode Pembayaran
              </h3>
              <div className="divide-y divide-zinc-100 text-sm tabular-nums">
                {Object.entries(salesBreakdown.byPayment).map(([method, stat]) => (
                  <div key={method} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-950">{method}</p>
                      <p className="text-xs text-zinc-500">{stat.count} transaksi</p>
                    </div>
                    <span className="font-semibold text-zinc-950">{formatIDR(stat.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-zinc-200 p-6">
              <h3 className="font-display text-base font-semibold text-zinc-950 mb-4">
                Distribusi Status Pesanan
              </h3>
              <div className="divide-y divide-zinc-100 text-sm tabular-nums">
                {ORDER_STATUSES.map((st) => (
                  <div key={st} className="py-3 flex items-center justify-between">
                    <span className="text-zinc-700">{st}</span>
                    <span className="font-semibold text-zinc-950">
                      {salesBreakdown.byStatus[st]} pesanan
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. INBOX & NEWSLETTER */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-zinc-200 p-6">
            <h2 className="font-display text-base font-semibold text-zinc-950 mb-4">
              Pesan Kontak Pelanggan ({messages.length})
            </h2>
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada pesan masuk.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {messages.map((m) => (
                  <div key={m.id} className="py-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-950">{m.name}</span>
                      <span>{formatFirestoreDate(m.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {m.email} {m.whatsapp ? `· ${m.whatsapp}` : ''}
                    </p>
                    <p className="text-sm font-semibold text-zinc-950 pt-1">{m.subject}</p>
                    <p className="text-sm text-zinc-700">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 border border-zinc-200 p-6">
            <h2 className="font-display text-base font-semibold text-zinc-950 mb-4">
              Newsletter Subscribers ({subscribers.length})
            </h2>
            {subscribers.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada pelanggan terdaftar.</p>
            ) : (
              <div className="divide-y divide-zinc-100 text-sm">
                {subscribers.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    <span className="text-zinc-900">{s.email}</span>
                    <span className="text-xs text-zinc-500">{formatFirestoreDate(s.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/50"
            onClick={() => setProductModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white border border-zinc-200 max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <h2 className="font-display text-xl font-bold text-zinc-950">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Kategori *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-zinc-300 text-sm"
                  >
                    {(categories.length > 0
                      ? categories.map((c) => c.name)
                      : DEFAULT_CATEGORY_OPTIONS
                    ).map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Harga Normal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Harga Diskon (0 = non-diskon)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodForm.discountPrice}
                    onChange={(e) => setProdForm({ ...prodForm, discountPrice: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Stok *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Deskripsi Produk *
                </label>
                <textarea
                  rows={3}
                  required
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full p-3 border border-zinc-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ukuran (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={prodForm.sizesText}
                    onChange={(e) => setProdForm({ ...prodForm, sizesText: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Warna (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={prodForm.colorsText}
                    onChange={(e) => setProdForm({ ...prodForm, colorsText: e.target.value })}
                    className="w-full h-10 px-3 border border-zinc-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Foto Produk Studio (pilih atau masukkan URL)
                </label>
                <input
                  type="text"
                  value={prodForm.imageUrl}
                  onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                  className="w-full h-10 px-3 border border-zinc-300 text-xs font-mono mb-2"
                />
                <div className="grid grid-cols-5 gap-2">
                  {STUDIO_IMAGES.slice(0, 5).map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, imageUrl: img })}
                      className={`aspect-[4/3] border overflow-hidden ${
                        prodForm.imageUrl === img ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200'
                      }`}
                    >
                      <StoreImage src={img} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-2 text-xs font-medium text-zinc-800">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isBestSeller}
                    onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                    className="accent-zinc-950"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isNewArrival}
                    onChange={(e) => setProdForm({ ...prodForm, isNewArrival: e.target.checked })}
                    className="accent-zinc-950"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isSale}
                    onChange={(e) => setProdForm({ ...prodForm, isSale: e.target.checked })}
                    className="accent-zinc-950"
                  />
                  <span>Label Sale</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="h-10 px-5 border border-zinc-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/50" onClick={() => setCatModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white border border-zinc-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                {editingCat ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button type="button" onClick={() => setCatModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full h-10 px-3 border border-zinc-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full p-3 border border-zinc-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Urutan Tampil</label>
                <input
                  type="number"
                  min={1}
                  value={catForm.displayOrder}
                  onChange={(e) => setCatForm({ ...catForm, displayOrder: e.target.value })}
                  className="w-full h-10 px-3 border border-zinc-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="h-10 px-4 border border-zinc-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-zinc-950 text-white text-xs font-semibold"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative z-10 w-full max-w-xl bg-white border border-zinc-200 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
              <div>
                <p className="font-mono text-xs text-zinc-500">{selectedOrder.orderNumber}</p>
                <h2 className="font-display text-lg font-bold text-zinc-950">
                  Detail Pesanan
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200 p-4 text-xs">
                <div>
                  <p className="text-zinc-500">Pelanggan</p>
                  <p className="font-semibold text-zinc-950">{selectedOrder.fullName}</p>
                  <p className="text-zinc-600">{selectedOrder.whatsapp}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Pengiriman & Bayar</p>
                  <p className="font-semibold text-zinc-950">{selectedOrder.shippingMethod}</p>
                  <p className="text-zinc-600">{selectedOrder.paymentMethod}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-200">
                  <p className="text-zinc-500">Alamat Tujuan</p>
                  <p className="text-zinc-900">
                    {selectedOrder.address}, {selectedOrder.district}, {selectedOrder.city},{' '}
                    {selectedOrder.province} {selectedOrder.postalCode}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-zinc-600 mt-1">Catatan: {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Item Pesanan
                </p>
                {loadingOrderItems ? (
                  <p className="text-xs text-zinc-500">Memuat detail item...</p>
                ) : selectedOrderItems.length > 0 ? (
                  <div className="divide-y divide-zinc-100 border border-zinc-200">
                    {selectedOrderItems.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-zinc-950">{item.productName}</p>
                          <p className="text-zinc-500">
                            {item.size} · {item.color} · x{item.quantity}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {formatIDR(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700 border border-zinc-200 p-3">
                    {selectedOrder.itemsSummary}
                  </p>
                )}
              </div>

              <div className="border-t border-zinc-200 pt-3 space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>{formatIDR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Ongkir</span>
                  <span>{formatIDR(selectedOrder.shippingCost)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-zinc-900">
                    <span>Diskon ({selectedOrder.promoCode})</span>
                    <span>-{formatIDR(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-100">
                  <span>Total</span>
                  <span>{formatIDR(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
