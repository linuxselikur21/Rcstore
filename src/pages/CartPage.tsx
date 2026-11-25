import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreImage } from '../components/StoreImage';
import { useStore } from '../context/StoreContext';
import { STORE_INFO } from '../data/seedCatalog';
import { formatIDR, getEffectivePrice } from '../utils/format';

export const CartPage: React.FC = () => {
  const { cart, cartCount, cartSubtotal, updateCartQty, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(
    null
  );
  const [promoMessage, setPromoMessage] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoMessage('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), subtotal: cartSubtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
        setPromoMessage(data.message);
      } else {
        setAppliedPromo(null);
        setPromoMessage(data.message || 'Kode promo tidak valid.');
      }
    } catch {
      const code = promoInput.trim().toUpperCase();
      if (code === 'RCNEW15') {
        const discount = Math.min(100000, Math.round(cartSubtotal * 0.15));
        setAppliedPromo({ code, discountAmount: discount });
        setPromoMessage('Diskon 15% berhasil diterapkan.');
      } else {
        setAppliedPromo(null);
        setPromoMessage('Kode promo tidak ditemukan.');
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const discount = appliedPromo ? Math.min(cartSubtotal, appliedPromo.discountAmount) : 0;
  const totalPayable = Math.max(0, cartSubtotal - discount);

  if (cart.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-4 stroke-[1.25]" />
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
          Keranjang Belanja Kosong
        </h1>
        <p className="text-sm text-zinc-600 mt-2 mb-8 max-w-md mx-auto">
          Anda belum menambahkan produk ke keranjang. Jelajahi koleksi pakaian pria terbaik di RC STORE.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 h-11 px-7 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800"
        >
          <span>Lihat Katalog Produk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1">
            Ringkasan Belanja
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-950">
            Keranjang Belanja ({cartCount})
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-950 underline underline-offset-4"
        >
          Kosongkan Keranjang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Itemized List */}
        <div className="lg:col-span-8 divide-y divide-zinc-200 border-t border-b border-zinc-200">
          {cart.map((item) => {
            const unitPrice = getEffectivePrice(item.price, item.discountPrice);
            return (
              <div key={item.key} className="py-5 flex gap-4 sm:gap-6 items-start">
                <Link
                  to={`/product/${item.productId}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden"
                >
                  <StoreImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      {item.category}
                    </p>
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-display text-base font-semibold text-zinc-950 hover:underline block mt-0.5"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-zinc-600 mt-1">
                      Ukuran: <strong className="text-zinc-950">{item.size}</strong> · Warna:{' '}
                      <strong className="text-zinc-950">{item.color}</strong>
                    </p>
                    <p className="text-sm font-medium text-zinc-950 mt-2 tabular-nums">
                      {formatIDR(unitPrice)} / pcs
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center border border-zinc-300">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity - 1)}
                        aria-label="Kurangi jumlah"
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity + 1)}
                        aria-label="Tambah jumlah"
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="font-display text-base font-semibold text-zinc-950 tabular-nums">
                        {formatIDR(unitPrice * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Box */}
        <aside className="lg:col-span-4 border border-zinc-200 bg-zinc-50 p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-zinc-950">
            Ringkasan Pembayaran
          </h2>

          <form onSubmit={handleApplyPromo} className="space-y-2">
            <label htmlFor="cart-promo" className="block text-xs font-medium text-zinc-700">
              Kode Promo (Opsional — coba <span className="font-mono">RCNEW15</span>)
            </label>
            <div className="flex gap-2">
              <input
                id="cart-promo"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Masukkan kode"
                className="flex-1 h-10 px-3 bg-white border border-zinc-300 text-sm uppercase focus:outline-none focus:border-zinc-950"
              />
              <button
                type="submit"
                disabled={promoLoading}
                className="h-10 px-4 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800"
              >
                {promoLoading ? '...' : 'Terapkan'}
              </button>
            </div>
            {promoMessage && (
              <p className={`text-xs ${appliedPromo ? 'text-zinc-900' : 'text-red-600'}`}>
                {promoMessage}
              </p>
            )}
          </form>

          <div className="border-t border-zinc-200 pt-4 space-y-2.5 text-sm tabular-nums">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal ({cartCount} item)</span>
              <span>{formatIDR(cartSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-zinc-950 font-medium">
                <span>Diskon ({appliedPromo?.code})</span>
                <span>-{formatIDR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Estimasi Pengiriman</span>
              <span>
                {cartSubtotal >= STORE_INFO.freeShippingThreshold
                  ? 'Gratis (Reguler)'
                  : 'Dihitung saat checkout'}
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-950">Total Sementara</span>
            <span className="font-display text-xl font-bold text-zinc-950 tabular-nums">
              {formatIDR(totalPayable)}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/checkout', {
                state: {
                  promoCode: appliedPromo?.code || '',
                  discountAmount: discount,
                },
              })
            }
            className="w-full h-12 bg-zinc-950 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <span>Lanjut ke Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/shop"
            className="block text-center text-xs font-medium text-zinc-600 hover:text-zinc-950 underline underline-offset-4"
          >
            Lanjutkan Belanja
          </Link>
        </aside>
      </div>
    </div>
  );
};
