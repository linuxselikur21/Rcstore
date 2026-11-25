export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';

export type PaymentMethod = 'Transfer Bank' | 'QRIS' | 'COD';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  createdAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  material: string;
  price: number;
  discountPrice: number; // 0 means no discount
  stock: number;
  rating: number;
  reviewCount: number;
  sizes: string[];
  colors: string[];
  images: string[];
  isBestSeller: boolean;
  isNewArrival: boolean;
  isSale: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  role: 'customer' | 'admin';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  key: string; // sanitized Firestore document ID `${productId}__${size}__${color}`
  productId: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  discountPrice: number;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  orderUserId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
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
  itemsSummary: string;
  itemsCount: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  promoCode: string;
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  subject: string;
  message: string;
  createdAt?: unknown;
}

export interface ShippingOption {
  id: string;
  name: string;
  eta: string;
  cost: number;
}
