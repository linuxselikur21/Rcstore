import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { StoreImage } from '../components/StoreImage';
import { useStore } from '../context/StoreContext';
import { HERO_IMAGE, PROMO_IMAGE, TESTIMONIALS } from '../data/seedCatalog';
import { subscribeNewsletterEmail } from '../lib/storeService';

export const HomePage: React.FC = () => {
  const { products, categories, catalogLoading, isCatalogEmpty, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);

  const handleCopyPromo = async () => {
    try {
      await navigator.clipboard.writeText('RCNEW15');
      setCopiedPromo(true);
      showToast('Kode promo RCNEW15 disalin.', 'success');
      window.setTimeout(() => setCopiedPromo(false), 2500);
    } catch {
      showToast('Gunakan kode RCNEW15 saat checkout.', 'info');
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError('');
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterError('Masukkan alamat email yang valid.');
      return;
    }
    setNewsletterLoading(true);
    try {
      await subscribeNewsletterEmail(email);
      setNewsletterDone(true);
      setNewsletterEmail('');
      showToast('Terima kasih! Anda berhasil berlangganan newsletter RC STORE.', 'success');
    } catch (err) {
      setNewsletterError(
        err instanceof Error ? err.message : 'Gagal mendaftarkan email. Silakan coba lagi.'
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="bg-zinc-950 text-white border-b border-zinc-900">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4">
              RC STORE · Koleksi Pria Esensial
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06] text-balance">
              DEFINE YOUR STYLE, OWN YOUR LOOK.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-lg">
              Discover your style with RC STORE. Find your perfect outfit for every moment.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="h-12 px-7 bg-white text-zinc-950 text-sm font-semibold inline-flex items-center gap-2 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="h-12 px-6 border border-zinc-700 text-zinc-200 text-sm font-medium inline-flex items-center hover:border-white hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Tentang Brand
              </Link>
            </div>

            {/* Key Value Strip */}
            <div className="mt-12 pt-8 border-t border-zinc-800 grid grid-cols-3 gap-4 text-xs text-zinc-400">
              <div>
                <p className="font-semibold text-white">Katun 280gsm</p>
                <p className="mt-0.5">Adem & tahan lama</p>
              </div>
              <div>
                <p className="font-semibold text-white">Gratis Ongkir</p>
                <p className="mt-0.5">Min. belanja Rp 500rb</p>
              </div>
              <div>
                <p className="font-semibold text-white">COD & QRIS</p>
                <p className="mt-0.5">Kirim seluruh Indonesia</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[320px] sm:min-h-[420px] lg:min-h-[560px] bg-zinc-900 overflow-hidden">
            <StoreImage
              src={HERO_IMAGE}
              alt="RC STORE Men's Editorial Campaign"
              fallbackTitle="RC STORE Editorial"
              className="w-full h-full object-cover object-center lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* 2. Best Seller Section */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
              Pilihan Terfavorit
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Best Seller
            </h2>
          </div>
          <Link
            to="/shop?sort=popular"
            className="text-sm font-medium text-zinc-950 inline-flex items-center gap-1.5 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            <span>Lihat Semua Best Seller</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {catalogLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="border border-zinc-200 p-4 animate-pulse">
                <div className="aspect-[4/3] bg-zinc-100 mb-4" />
                <div className="h-4 bg-zinc-100 w-3/4 mb-2" />
                <div className="h-4 bg-zinc-100 w-1/2" />
              </div>
            ))}
          </div>
        ) : isCatalogEmpty ? (
          <div className="border border-zinc-200 bg-zinc-50 p-10 text-center">
            <p className="font-display text-lg font-semibold text-zinc-950">
              Katalog Produk Firestore Belum Terisi
            </p>
            <p className="text-sm text-zinc-600 mt-1.5 mb-5 max-w-md mx-auto">
              Masuk ke Dashboard Admin untuk menambahkan produk atau menyinkronkan katalog awal ke
              database Firestore.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center h-10 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800"
            >
              Buka Dashboard Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Shop by Categories */}
      <section id="categories" className="bg-zinc-50 border-y border-zinc-200 py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Eksplorasi Koleksi
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                Shop by Categories
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-sm font-medium text-zinc-950 inline-flex items-center gap-1.5 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              <span>Buka Katalog Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white border border-zinc-200 hover:border-zinc-950 transition-colors flex flex-col overflow-hidden"
              >
                <div className="aspect-[4/3] bg-zinc-100 overflow-hidden">
                  <StoreImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fallbackTitle={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between gap-1">
                  <span className="font-display text-sm font-semibold text-zinc-950 truncate">
                    {cat.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 shrink-0 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Promo / Diskon Spesial */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="border border-zinc-200 bg-zinc-950 text-white grid grid-cols-1 lg:grid-cols-12 items-stretch overflow-hidden">
          <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[380px] bg-zinc-900">
            <StoreImage
              src={PROMO_IMAGE}
              alt="RC STORE Curated Monochrome Promo"
              fallbackTitle="RC STORE Promo"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
              Penawaran Khusus Pelanggan
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Diskon 15% untuk Pembelian Koleksi Esensial Pertama Anda.
            </h2>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-md">
              Gunakan kode promo di halaman keranjang atau checkout untuk menikmati potongan langsung
              hingga Rp 100.000, berlaku untuk seluruh kategori produk.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyPromo}
                className="h-11 px-4 border border-zinc-700 bg-zinc-900 text-white font-mono text-sm inline-flex items-center gap-2.5 hover:border-white transition-colors"
              >
                <span>RCNEW15</span>
                {copiedPromo ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              <Link
                to="/shop?sale=true"
                className="h-11 px-6 bg-white text-zinc-950 text-sm font-semibold inline-flex items-center gap-2 hover:bg-zinc-200 transition-colors"
              >
                <span>Belanja Produk Diskon</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
              Rilis Terbaru
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop?sort=newest"
            className="text-sm font-medium text-zinc-950 inline-flex items-center gap-1.5 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            <span>Lihat Semua Produk Baru</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="bg-zinc-50 border-y border-zinc-200 py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
              Ulasan Terverifikasi
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Dipakai & Dipercaya Pelanggan di Berbagai Kota
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.id}
                className="bg-white border border-zinc-200 p-6 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">"{item.quote}"</p>
                </div>
                <footer className="pt-4 border-t border-zinc-100">
                  <p className="font-display text-sm font-semibold text-zinc-950">{item.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {item.role} · {item.product}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Newsletter Subscription */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-2">
            RC STORE Journal
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 text-balance">
            Dapatkan Kabar Rilis Koleksi Baru & Promo Eksklusif
          </h2>
          <p className="mt-3 text-sm text-zinc-600">
            Tanpa spam. Hanya informasi restock ukuran, rilisan terbatas, dan penawaran khusus member.
          </p>

          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-7 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Masukkan alamat email Anda"
              aria-label="Alamat email newsletter"
              className="flex-1 h-11 px-4 border border-zinc-300 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="h-11 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors whitespace-nowrap shrink-0"
            >
              {newsletterLoading ? 'Menyimpan...' : 'Berlangganan'}
            </button>
          </form>

          {newsletterError && (
            <p className="mt-2.5 text-xs text-red-600 font-medium">{newsletterError}</p>
          )}
          {newsletterDone && (
            <p className="mt-2.5 text-xs text-zinc-800 font-medium">
              Email Anda telah terdaftar di newsletter RC STORE.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
