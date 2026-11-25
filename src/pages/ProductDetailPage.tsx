import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { StoreImage } from '../components/StoreImage';
import { useStore } from '../context/StoreContext';
import { formatIDR, getDiscountPercentage, getEffectivePrice } from '../utils/format';

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart, toggleWishlist, isWishlisted } = useStore();
  const navigate = useNavigate();

  const product = useMemo(
    () => products.find((p) => p.id === id || p.slug === id),
    [products, id]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setActiveImageIdx(0);
      setSelectedSize(product.sizes.includes('L') ? 'L' : product.sizes[0] || 'L');
      setSelectedColor(product.colors[0] || 'Jet Black');
      setQuantity(1);
    }
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.category === product.category
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.category !== product.category
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [products, product]);

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-950">
          Produk Tidak Ditemukan
        </h1>
        <p className="text-sm text-zinc-600 mt-2 mb-6">
          Produk yang Anda cari mungkin telah diperbarui atau dihapus dari katalog.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 h-11 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPct = getDiscountPercentage(product.price, product.discountPrice);
  const wishlisted = isWishlisted(product.id);
  const availableSizes = product.sizes.length > 0 ? product.sizes : STANDARD_SIZES;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-zinc-950">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-zinc-950">
          Shop
        </Link>
        <span>/</span>
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-zinc-950"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-zinc-950 font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Split Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left: Sticky Photo Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-[4/3] bg-zinc-100 border border-zinc-200 overflow-hidden">
            <StoreImage
              src={product.images[activeImageIdx] || product.images[0] || ''}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[4/3] bg-zinc-100 border overflow-hidden transition-colors ${
                    activeImageIdx === idx
                      ? 'border-zinc-950 ring-1 ring-zinc-950'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <StoreImage
                    src={img}
                    alt={`${product.name} tampilan ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
              <span>{product.category}</span>
              {product.isBestSeller && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-zinc-950 font-semibold">Best Seller</span>
                </>
              )}
              {product.isNewArrival && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-zinc-950 font-semibold">New Arrival</span>
                </>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              {product.name}
            </h1>

            <div className="mt-2.5 flex items-center gap-2 text-sm text-zinc-600 tabular-nums">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                <span className="font-semibold text-zinc-950">{product.rating.toFixed(1)}</span>
              </div>
              <span aria-hidden="true">·</span>
              <span>{product.reviewCount} ulasan pelanggan</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3 tabular-nums">
              <span className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
                {formatIDR(effectivePrice)}
              </span>
              {discountPct > 0 && (
                <>
                  <span className="text-base text-zinc-400 line-through">
                    {formatIDR(product.price)}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
                    Hemat {discountPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-5 space-y-3 text-sm text-zinc-700 leading-relaxed">
            <p>{product.description}</p>
            <p className="text-xs text-zinc-500 font-medium">{product.material}</p>
          </div>

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-semibold uppercase tracking-wider text-zinc-950">
                Pilih Ukuran: {selectedSize}
              </span>
              <span className="text-zinc-500">Regular / Boxy Indonesian Fit</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {STANDARD_SIZES.map((size) => {
                const enabled = availableSizes.includes(size);
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : enabled
                        ? 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-950'
                        : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-950 mb-2.5">
              Pilih Warna: {selectedColor}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 px-4 text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                    selectedColor === color
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-950'
                  }`}
                >
                  {selectedColor === color && <Check className="w-3.5 h-3.5" />}
                  <span>{color}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Stock Info */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
                Jumlah
              </span>
              <div className="inline-flex items-center border border-zinc-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Kurangi jumlah"
                  className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Tambah jumlah"
                  className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs font-medium tabular-nums text-zinc-600">
              {product.stock > 0 ? (
                <>
                  Stok tersedia: <strong className="text-zinc-950">{product.stock} pcs</strong>
                </>
              ) : (
                <span className="text-red-600 font-semibold">Stok sedang habis</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                className="h-12 px-5 border border-zinc-950 bg-white text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-zinc-100 disabled:border-zinc-300 disabled:text-zinc-400 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="h-12 px-5 bg-zinc-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
              >
                <span>Buy Now</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id, product.name)}
              className="w-full h-11 border border-zinc-200 text-xs font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-zinc-950 text-zinc-950' : ''}`} />
              <span>{wishlisted ? 'Tersimpan di Wishlist' : 'Simpan ke Wishlist'}</span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="border-t border-zinc-200 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-950">Pengiriman Setiap Hari</p>
                <p className="mt-0.5">Order sebelum 16.00 WIB dikirim di hari yang sama.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-950">Garansi Tukar Ukuran</p>
                <p className="mt-0.5">Penukaran ukuran maksimal 7 hari setelah barang diterima.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-20 pt-14 border-t border-zinc-200">
        <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 mb-8">
          Rekomendasi Produk Terkait
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
};
