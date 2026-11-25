import React from 'react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatIDR, getEffectivePrice } from '../utils/format';
import { StoreImage } from './StoreImage';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlistProducts,
    wishlistDrawerOpen,
    setWishlistDrawerOpen,
    toggleWishlist,
    addToCart,
  } = useStore();
  const navigate = useNavigate();

  if (!wishlistDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        onClick={() => setWishlistDrawerOpen(false)}
      />

      <aside
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl"
        aria-label="Wishlist"
      >
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-zinc-950" />
            <h2 className="font-display text-base font-semibold text-zinc-950">
              Wishlist ({wishlistProducts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setWishlistDrawerOpen(false)}
            aria-label="Tutup wishlist"
            className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Heart className="w-10 h-10 text-zinc-300 mb-3 stroke-[1.25]" />
              <p className="font-display text-base font-semibold text-zinc-950">
                Wishlist Masih Kosong
              </p>
              <p className="text-sm text-zinc-500 mt-1 mb-6 max-w-xs">
                Simpan produk favorit Anda dengan menekan ikon hati di katalog RC STORE.
              </p>
              <button
                type="button"
                onClick={() => {
                  setWishlistDrawerOpen(false);
                  navigate('/shop');
                }}
                className="px-6 py-2.5 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Jelajahi Katalog
              </button>
            </div>
          ) : (
            wishlistProducts.map((product) => {
              const price = getEffectivePrice(product.price, product.discountPrice);
              const size = product.sizes.includes('L') ? 'L' : product.sizes[0] || 'L';
              const color = product.colors[0] || 'Jet Black';
              return (
                <div key={product.id} className="py-4 flex gap-4">
                  <Link
                    to={`/product/${product.id}`}
                    onClick={() => setWishlistDrawerOpen(false)}
                    className="w-20 h-20 bg-zinc-100 shrink-0 border border-zinc-200 overflow-hidden"
                  >
                    <StoreImage
                      src={product.images[0] || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                          {product.category}
                        </p>
                        <Link
                          to={`/product/${product.id}`}
                          onClick={() => setWishlistDrawerOpen(false)}
                          className="text-sm font-semibold text-zinc-950 hover:underline line-clamp-1"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id, product.name)}
                        aria-label={`Hapus ${product.name} dari wishlist`}
                        className="text-zinc-400 hover:text-zinc-950 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                        {formatIDR(price)}
                      </span>
                      <button
                        type="button"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product, size, color, 1)}
                        className="h-8 px-3 bg-zinc-950 text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
