import React from 'react';
import { ArrowUpRight, Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STORE_INFO } from '../data/seedCatalog';
import { buildWhatsAppUrl } from '../utils/format';

export const Footer: React.FC = () => {
  const waHref = buildWhatsAppUrl(
    STORE_INFO.whatsapp,
    'Halo RC STORE, saya ingin bertanya mengenai koleksi pakaian pria.'
  );

  return (
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-900">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 font-display text-xl font-bold tracking-tight text-white"
            >
              <img
                src="/assets/aistudio/Minimalist_RC_Store_Logo_181a503e.png"
                alt="Logo RC STORE"
                className="w-12 h-12 object-contain bg-black rounded-sm border border-zinc-800 shrink-0"
              />
              <span>RC STORE</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-xs">
              Brand fashion pria modern dengan siluet clean, bahan berkualitas, dan harga yang tetap
              terjangkau untuk mahasiswa, profesional muda, dan aktivitas harian.
            </p>
            <div className="mt-5 text-xs text-zinc-400 space-y-1">
              <p>{STORE_INFO.address}</p>
              <p>{STORE_INFO.hours}</p>
            </div>
          </div>

          {/* Kategori Produk */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Kategori
            </h3>
            <ul className="space-y-2.5 text-sm">
              {['T-Shirt', 'Shirt', 'Hoodie', 'Jacket', 'Pants', 'Jeans', 'Accessories'].map(
                (cat) => (
                  <li key={cat}>
                    <Link
                      to={`/shop?category=${encodeURIComponent(cat)}`}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Navigasi Toko */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Informasi
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop" className="text-zinc-400 hover:text-white transition-colors">
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-zinc-400 hover:text-white transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-zinc-400 hover:text-white transition-colors">
                  Keranjang Belanja
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-zinc-400 hover:text-white transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-zinc-400 hover:text-white transition-colors">
                  Akun Saya & Pesanan
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-zinc-400 hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak & Media Sosial */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Layanan Pelanggan
            </h3>
            <div className="space-y-3 text-sm">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp {STORE_INFO.whatsapp}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <p className="text-zinc-400">{STORE_INFO.email}</p>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram {STORE_INFO.instagram}</span>
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>TikTok {STORE_INFO.tiktok}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} RC STORE. Seluruh hak cipta dilindungi.</p>
          <p>Pembayaran: Transfer Bank · QRIS · COD Seluruh Indonesia</p>
        </div>
      </div>
    </footer>
  );
};
