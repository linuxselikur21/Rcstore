import React from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { formatIDR, getDiscountPercentage, getEffectivePrice } from '../utils/format';
import { StoreImage } from './StoreImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPct = getDiscountPercentage(product.price, product.discountPrice);

  // Determine a single clean text label (no pill spam)
  const labelText = product.isSale && discountPct > 0
    ? `Sale -${discountPct}%`
    : product.isBestSeller
    ? 'Best Seller'
    : product.isNewArrival
    ? 'New Arrival'
    : '';

  const defaultSize = product.sizes.includes('L') ? 'L' : product.sizes[0] || 'L';
  const defaultColor = product.colors[0] || 'Jet Black';

  return (
    <article className="group flex flex-col bg-white border border-zinc-200 hover:border-zinc-400 transition-all duration-200 hover:-translate-y-0.5">
      {/* Studio Image */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <StoreImage
            src={product.images[0] || ''}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Wishlist Toggle */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={wishlisted ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name} ke wishlist`}
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center transition-colors ${
            wishlisted
              ? 'bg-zinc-950 text-white'
              : 'bg-white/90 text-zinc-700 hover:bg-zinc-950 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Sold out overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-950">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Unboxed Metadata Line */}
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1.5">
            <span className="uppercase tracking-wider">{product.category}</span>
            {labelText && (
              <span className="font-semibold text-zinc-950 uppercase tracking-wider">
                {labelText}
              </span>
            )}
          </div>

          {/* Product Name */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-display text-base font-semibold text-zinc-950 leading-snug line-clamp-1 group-hover:underline underline-offset-4">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600 tabular-nums">
            <Star className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
            <span className="font-medium text-zinc-900">{product.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-500">{product.reviewCount} ulasan</span>
          </div>
        </div>

        {/* Price + Quick Add */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex flex-col tabular-nums">
            <span className="text-[15px] font-semibold text-zinc-950">
              {formatIDR(effectivePrice)}
            </span>
            {discountPct > 0 && (
              <span className="text-xs text-zinc-400 line-through">
                {formatIDR(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, defaultSize, defaultColor, 1)}
            className="h-9 px-3.5 bg-zinc-950 text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
};
