import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatIDR, getEffectivePrice } from '../utils/format';
import { StoreImage } from './StoreImage';

export const SearchOverlay: React.FC = () => {
  const { searchOpen, setSearchOpen, products } = useStore();
  const [queryText, setQueryText] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return products.slice(0, 4);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [products, queryText]);

  if (!searchOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(queryText.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[1px]"
        onClick={() => setSearchOpen(false)}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl p-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-zinc-200 pb-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Cari kaos boxy, hoodie, jaket workwear, jeans..."
            className="w-full text-base text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Tutup pencarian"
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-950"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            {queryText.trim() ? `Hasil Pencarian (${results.length})` : 'Rekomendasi Populer'}
          </p>

          {results.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              Tidak ada produk yang cocok dengan "{queryText}".
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    navigate(`/product/${product.id}`);
                  }}
                  className="w-full py-3 flex items-center gap-4 text-left hover:bg-zinc-50 px-2 transition-colors"
                >
                  <div className="w-14 h-14 bg-zinc-100 shrink-0 overflow-hidden border border-zinc-200">
                    <StoreImage
                      src={product.images[0] || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                      {product.category}
                    </p>
                    <p className="text-sm font-semibold text-zinc-950 truncate">{product.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-950 tabular-nums shrink-0">
                    {formatIDR(getEffectivePrice(product.price, product.discountPrice))}
                  </span>
                </button>
              ))}
            </div>
          )}

          {queryText.trim() && (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="mt-4 w-full h-10 bg-zinc-950 text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              <span>Lihat Semua Hasil di Katalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
