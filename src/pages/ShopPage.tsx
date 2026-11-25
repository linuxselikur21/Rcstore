import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { getEffectivePrice } from '../utils/format';

type PriceFilter = 'all' | 'under-200' | '200-400' | 'above-400';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export const ShopPage: React.FC = () => {
  const { products, categories, catalogLoading, isCatalogEmpty } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';
  const initialSale = searchParams.get('sale') === 'true';
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchText, setSearchText] = useState(initialQuery);
  const [priceRange, setPriceRange] = useState<PriceFilter>('all');
  const [saleOnly, setSaleOnly] = useState(initialSale);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setSearchText(searchParams.get('q') || '');
    setSaleOnly(searchParams.get('sale') === 'true');
    const urlSort = searchParams.get('sort') as SortOption | null;
    if (urlSort) setSortBy(urlSort);
  }, [searchParams]);

  const categoryNames = useMemo(
    () => ['All', ...categories.map((c) => c.name)],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (saleOnly && !(p.isSale || (p.discountPrice > 0 && p.discountPrice < p.price))) {
        return false;
      }
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      const eff = getEffectivePrice(p.price, p.discountPrice);
      if (priceRange === 'under-200' && eff >= 200000) return false;
      if (priceRange === '200-400' && (eff < 200000 || eff > 400000)) return false;
      if (priceRange === 'above-400' && eff <= 400000) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const priceA = getEffectivePrice(a.price, a.discountPrice);
      const priceB = getEffectivePrice(b.price, b.discountPrice);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'popular') {
        if (a.isBestSeller !== b.isBestSeller) return a.isBestSeller ? -1 : 1;
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      }
      if (a.isNewArrival !== b.isNewArrival) return a.isNewArrival ? -1 : 1;
      return 0;
    });
  }, [products, selectedCategory, saleOnly, searchText, priceRange, sortBy]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchText('');
    setPriceRange('all');
    setSaleOnly(false);
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            Katalog RC STORE
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
            {selectedCategory === 'All' ? 'Semua Produk Pria' : selectedCategory}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 max-w-xl">
            Koleksi pakaian pria bergaya modern minimalis langsung dari database Cloud Firestore RC STORE.
          </p>
        </div>
        <p className="text-xs font-medium text-zinc-500 tabular-nums shrink-0">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {categoryNames.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`h-9 px-4 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-zinc-950 text-white border-zinc-950'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950'
            }`}
          >
            {cat === 'All' ? 'Semua Kategori' : cat}
          </button>
        ))}
      </div>

      {/* Search, Price Filter & Sorting Toolbar */}
      <div className="bg-zinc-50 border border-zinc-200 p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari nama produk..."
            aria-label="Cari nama produk"
            className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-300 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
          />
        </div>

        {/* Price Filter */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500 shrink-0 hidden sm:block" />
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value as PriceFilter)}
            aria-label="Filter harga"
            className="w-full h-10 px-3 bg-white border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-zinc-950"
          >
            <option value="all">Semua Rentang Harga</option>
            <option value="under-200">Di bawah Rp 200.000</option>
            <option value="200-400">Rp 200.000 – Rp 400.000</option>
            <option value="above-400">Di atas Rp 400.000</option>
          </select>
        </div>

        {/* Sort */}
        <div className="lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Urutkan produk"
            className="w-full h-10 px-3 bg-white border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-zinc-950"
          >
            <option value="newest">Produk Terbaru</option>
            <option value="popular">Terlaris & Rating</option>
            <option value="price-asc">Harga Terendah</option>
            <option value="price-desc">Harga Tertinggi</option>
          </select>
        </div>

        {/* Sale toggle + Reset */}
        <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2">
          <button
            type="button"
            onClick={() => setSaleOnly((prev) => !prev)}
            className={`h-10 px-3 text-xs font-medium border transition-colors whitespace-nowrap ${
              saleOnly
                ? 'bg-zinc-950 text-white border-zinc-950'
                : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-950'
            }`}
          >
            Sedang Diskon
          </button>

          <button
            type="button"
            onClick={resetFilters}
            title="Reset filter"
            aria-label="Reset semua filter"
            className="h-10 w-10 bg-white border border-zinc-300 flex items-center justify-center text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Grid / Loading / Empty State */}
      {catalogLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="border border-zinc-200 p-4 animate-pulse">
              <div className="aspect-[4/3] bg-zinc-100 mb-4" />
              <div className="h-4 bg-zinc-100 w-3/4 mb-2" />
              <div className="h-4 bg-zinc-100 w-1/2" />
            </div>
          ))}
        </div>
      ) : isCatalogEmpty ? (
        <div className="border border-zinc-200 bg-zinc-50 py-16 px-6 text-center">
          <p className="font-display text-lg font-semibold text-zinc-950">
            Koleksi Produk Firestore Masih Kosong
          </p>
          <p className="text-sm text-zinc-600 mt-1.5 mb-6 max-w-md mx-auto">
            Tambahkan produk pertama atau sinkronkan katalog awal melalui Dashboard Admin.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center h-10 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Kelola Produk di Admin
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-zinc-200 bg-zinc-50 py-16 px-6 text-center">
          <p className="font-display text-lg font-semibold text-zinc-950">
            Produk Tidak Ditemukan
          </p>
          <p className="text-sm text-zinc-600 mt-1.5 mb-6 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau atur ulang filter kategori dan rentang harga.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Tampilkan Semua Produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
