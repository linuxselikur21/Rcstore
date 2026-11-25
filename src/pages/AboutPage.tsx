import React from 'react';
import { ArrowRight, Award, Layers, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoreImage } from '../components/StoreImage';
import { HERO_IMAGE, PROMO_IMAGE, STORE_INFO } from '../data/seedCatalog';
import { buildWhatsAppUrl } from '../utils/format';

export const AboutPage: React.FC = () => {
  const waHref = buildWhatsAppUrl(
    STORE_INFO.whatsapp,
    'Halo RC STORE, saya ingin konsultasi ukuran atau pemesanan.'
  );

  return (
    <div>
      {/* Intro Banner */}
      <section className="bg-zinc-950 text-white py-16 sm:py-24 border-b border-zinc-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-3">
              Tentang RC STORE
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-balance leading-[1.08]">
              Pakaian Pria Berkualitas Tinggi dengan Harga yang Ramah Dikantong.
            </h1>
            <p className="mt-5 text-base text-zinc-300 leading-relaxed">
              RC STORE lahir dari keyakinan sederhana: setiap pria—baik pelajar, mahasiswa, maupun
              pekerja kreatif—berhak mengenakan pakaian berpotongan rapi dan material premium tanpa
              harus membayar harga butik yang melambung.
            </p>
          </div>
          <div className="lg:col-span-6 aspect-[16/10] bg-zinc-900 overflow-hidden">
            <StoreImage
              src={HERO_IMAGE}
              alt="RC STORE Editorial Studio"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-zinc-200 p-7">
            <Layers className="w-6 h-6 text-zinc-950 mb-4 stroke-[1.5]" />
            <h2 className="font-display text-xl font-semibold text-zinc-950 mb-2">
              Material Pilihan
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Kami menggunakan katun combed 260–280gsm, fleece 420gsm, kanvas 12oz, hingga selvedge
              denim 14oz yang telah melalui uji susut dan ketahanan jahitan.
            </p>
          </div>

          <div className="border border-zinc-200 p-7">
            <Sparkles className="w-6 h-6 text-zinc-950 mb-4 stroke-[1.5]" />
            <h2 className="font-display text-xl font-semibold text-zinc-950 mb-2">
              Mengikuti Tren Global
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Siluet boxy, cropped jacket, dan celana wide-pleated kami dikembangkan khusus
              mengikuti proporsi tubuh pria Asia agar nyaman dipakai seharian.
            </p>
          </div>

          <div className="border border-zinc-200 p-7">
            <Award className="w-6 h-6 text-zinc-950 mb-4 stroke-[1.5]" />
            <h2 className="font-display text-xl font-semibold text-zinc-950 mb-2">
              Kepuasan Pelanggan
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Setiap pesanan melewati inspeksi kualitas ganda sebelum dikirim, didukung layanan
              konsultasi ukuran cepat dan garansi tukar ukuran 7 hari.
            </p>
          </div>
        </div>
      </section>

      {/* Studio & Direct WhatsApp */}
      <section className="bg-zinc-50 border-y border-zinc-200 py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 aspect-[16/10] bg-zinc-200 overflow-hidden">
            <StoreImage
              src={PROMO_IMAGE}
              alt="RC STORE Garment Selection"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Layanan Personal
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Butuh Bantuan Memilih Ukuran atau Padu Padan Outfit?
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Tim stylist RC STORE siap membantu Anda melalui WhatsApp resmi di{' '}
              <strong className="text-zinc-950">{STORE_INFO.whatsapp}</strong> setiap hari pukul
              09.00 – 21.00 WIB.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-6 bg-zinc-950 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp {STORE_INFO.whatsapp}</span>
              </a>
              <Link
                to="/shop"
                className="h-11 px-6 border border-zinc-300 bg-white text-zinc-950 text-sm font-medium inline-flex items-center gap-2 hover:border-zinc-950 transition-colors"
              >
                <span>Jelajahi Katalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
