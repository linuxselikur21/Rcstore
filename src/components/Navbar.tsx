import React, { useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    wishlistIds,
    user,
    setCartDrawerOpen,
    setWishlistDrawerOpen,
    setSearchOpen,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleCategoriesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/shop');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
      isActive
        ? 'text-zinc-950 border-zinc-950'
        : 'text-zinc-600 border-transparent hover:text-zinc-950 hover:border-zinc-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo & Wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0"
        >
          <img
            src="/assets/aistudio/Minimalist_RC_Store_Logo_181a503e.png"
            alt="Logo RC STORE"
            className="w-9 h-9 object-contain bg-black rounded-sm shrink-0"
          />
          <span>RC STORE</span>
        </Link>

        {/* Zone 2: Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigasi Utama">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>
          <a
            href="#categories"
            onClick={handleCategoriesClick}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 border-b border-transparent hover:border-zinc-300 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Categories
          </a>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: Action Controls (Search, Wishlist, Account, Cart) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Cari produk"
            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-zinc-950"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => setWishlistDrawerOpen(true)}
            aria-label="Buka wishlist"
            className="relative w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-zinc-950"
          >
            <Heart className="w-[18px] h-[18px]" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-zinc-950 text-white text-[10px] font-semibold tabular-nums flex items-center justify-center rounded-full">
                {wishlistIds.length}
              </span>
            )}
          </button>

          <Link
            to="/account"
            aria-label={user ? 'Akun Saya' : 'Masuk atau Daftar'}
            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-zinc-950"
          >
            <UserIcon className={`w-[18px] h-[18px] ${user ? 'text-zinc-950' : ''}`} />
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label="Buka keranjang belanja"
            className="relative h-10 px-2.5 flex items-center gap-2 text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-zinc-950 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            <span className="text-xs font-semibold tabular-nums">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            className="md:hidden w-10 h-10 flex items-center justify-center text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-1">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            Home
          </NavLink>
          <NavLink
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            Shop
          </NavLink>
          <a
            href="#categories"
            onClick={handleCategoriesClick}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            Categories
          </a>
          <NavLink
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            Contact
          </NavLink>
          <NavLink
            to="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            {user ? 'Akun Saya & Pesanan' : 'Masuk / Daftar'}
          </NavLink>
          <NavLink
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-900 border-b border-zinc-100"
          >
            Keranjang Belanja ({cartCount})
          </NavLink>
          <NavLink
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-zinc-500"
          >
            Dashboard Admin
          </NavLink>
        </div>
      )}
    </header>
  );
};
