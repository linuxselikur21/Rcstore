import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { STORE_INFO } from '../data/seedCatalog';
import { formatIDR, getEffectivePrice } from '../utils/format';
import { StoreImage } from './StoreImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQty,
    removeFromCart,
  } = useStore();
  const navigate = useNavigate();

  if (!cartDrawerOpen) return null;

  const remainingForFreeShipping = Math.max(0, STORE_INFO.freeShippingThreshold - cartSubtotal);
  const progressPct = Math.min(100, Math.round((cartSubtotal / STORE_INFO.freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl"
        aria-label="Keranjang Belanja"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-zinc-950" />
            <h2 className="font-display text-base font-semibold text-zinc-950">
              Keranjang ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Tutup keranjang"
            className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Bar */}
        {cart.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
            <p className="text-xs text-zinc-700 mb-2">
              {remainingForFreeShipping === 0
                ? 'Selamat! Pesanan Anda memenuhi syarat Gratis Ongkir Reguler.'
                : `Belanja ${formatIDR(remainingForFreeShipping)} lagi untuk Gratis Ongkir Reguler.`}
            </p>
            <div className="w-full h-1 bg-zinc-200 overflow-hidden">
              <div
                className="h-full bg-zinc-950 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-zinc-300 mb-3 stroke-[1.25]" />
              <p className="font-display text-base font-semibold text-zinc-950">
                Keranjang Anda Masih Kosong
              </p>
              <p className="text-sm text-zinc-500 mt-1 mb-6 max-w-xs">
                Jelajahi koleksi T-Shirt, Hoodie, Jacket, hingga Denim pilihan dari RC STORE.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/shop');
                }}
                className="px-6 py-2.5 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice = getEffectivePrice(item.price, item.discountPrice);
              return (
                <div key={item.key} className="py-4 flex gap-4">
                  <Link
                    to={`/product/${item.productId}`}
                    onClick={() => setCartDrawerOpen(false)}
                    className="w-20 h-20 bg-zinc-100 shrink-0 overflow-hidden border border-zinc-200"
                  >
                    <StoreImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={() => setCartDrawerOpen(false)}
                          className="text-sm font-semibold text-zinc-950 hover:underline truncate"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          aria-label={`Hapus ${item.name}`}
                          className="text-zinc-400 hover:text-zinc-950 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Ukuran {item.size} · Warna {item.color}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-zinc-300">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.key, item.quantity - 1)}
                          aria-label="Kurangi jumlah"
                          className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.key, item.quantity + 1)}
                          aria-label="Tambah jumlah"
                          className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                        {formatIDR(unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-display text-lg font-semibold text-zinc-950 tabular-nums">
                {formatIDR(cartSubtotal)}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Ongkos kirim dan kode promo dihitung pada halaman checkout.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/cart');
                }}
                className="h-11 border border-zinc-300 text-zinc-950 text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                Lihat Keranjang
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="h-11 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
