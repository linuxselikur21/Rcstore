import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  QrCode,
  Truck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { StoreImage } from '../components/StoreImage';
import { useStore } from '../context/StoreContext';
import { getShippingOptions, INDONESIAN_PROVINCES, STORE_INFO } from '../data/seedCatalog';
import { createOrderAtomic } from '../lib/storeService';
import { Order, PaymentMethod, ShippingOption } from '../types/store';
import { buildWhatsAppUrl, formatIDR, getEffectivePrice } from '../utils/format';

interface CheckoutLocationState {
  promoCode?: string;
  discountAmount?: number;
}

function getOrderSubmissionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  let detail = message;

  if (message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message) as { error?: unknown };
      if (typeof parsed.error === 'string') detail = parsed.error;
    } catch {
      detail = message;
    }
  }

  if (/permission-denied|missing or insufficient permissions/i.test(detail)) {
    return 'Firestore menolak penyimpanan pesanan. Pastikan aturan Firestore mengizinkan pelanggan membuat pesanan.';
  }
  if (/unavailable|network|offline/i.test(detail)) {
    return 'Tidak dapat terhubung ke Firebase. Periksa koneksi internet lalu coba lagi.';
  }
  return detail || 'Gagal membuat pesanan. Silakan coba lagi.';
}

export const CheckoutPage: React.FC = () => {
  const { cart, cartCount, cartSubtotal, userProfile, clearCart, showToast } = useStore();
  const location = useLocation();
  const navState = (location.state as CheckoutLocationState | null) || {};

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('DKI Jakarta');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    setFullName((prev) => prev || userProfile.displayName || '');
    setWhatsapp((prev) => prev || userProfile.phone || '');
    setAddress((prev) => prev || userProfile.address || '');
    if (userProfile.province) setProvince(userProfile.province);
    setCity((prev) => prev || userProfile.city || '');
    setDistrict((prev) => prev || userProfile.district || '');
    setPostalCode((prev) => prev || userProfile.postalCode || '');
  }, [userProfile]);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(() =>
    getShippingOptions('DKI Jakarta', cartSubtotal)
  );
  const [selectedShippingId, setSelectedShippingId] = useState('jne-reg');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');

  const [promoCodeInput, setPromoCodeInput] = useState(navState.promoCode || '');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(
    navState.promoCode && navState.discountAmount
      ? { code: navState.promoCode, discountAmount: navState.discountAmount }
      : null
  );
  const [promoFeedback, setPromoFeedback] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const submissionLock = useRef(false);

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ province, subtotal: cartSubtotal }),
        });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.options) && data.options.length > 0) {
            setShippingOptions(data.options);
            if (!data.options.some((o: ShippingOption) => o.id === selectedShippingId)) {
              setSelectedShippingId(data.options[0].id);
            }
            return;
          }
        }
      } catch {
        // Fallback below
      }
      if (active) {
        const fallback = getShippingOptions(province, cartSubtotal);
        setShippingOptions(fallback);
        if (!fallback.some((o) => o.id === selectedShippingId)) {
          setSelectedShippingId(fallback[0].id);
        }
      }
    };
    void loadRates();
    return () => {
      active = false;
    };
  }, [province, cartSubtotal, selectedShippingId]);

  const selectedShipping = useMemo(
    () => shippingOptions.find((o) => o.id === selectedShippingId) || shippingOptions[0],
    [shippingOptions, selectedShippingId]
  );

  const discountAmount = appliedPromo
    ? Math.min(cartSubtotal, Math.max(0, Math.round(appliedPromo.discountAmount)))
    : 0;
  const shippingCost = selectedShipping ? Math.max(0, Math.round(selectedShipping.cost)) : 0;
  const totalAmount = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cartSubtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
        setPromoFeedback(data.message);
      } else {
        setAppliedPromo(null);
        setPromoFeedback(data.message || 'Kode promo tidak valid.');
      }
    } catch {
      if (code === 'RCNEW15') {
        setAppliedPromo({ code, discountAmount: Math.min(100000, Math.round(cartSubtotal * 0.15)) });
        setPromoFeedback('Diskon 15% berhasil diterapkan.');
      } else {
        setAppliedPromo(null);
        setPromoFeedback('Kode promo tidak ditemukan.');
      }
    }
  };

  const normalizeWhatsApp = (value: string): string => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('08')) {
      digits = `62${digits.slice(1)}`;
    } else if (digits.startsWith('6208')) {
      digits = `628${digits.slice(4)}`;
    }
    return /^628[0-9]{8,14}$/.test(digits) ? digits : '';
  };

  const validate = (): string | null => {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2 || fullName.trim().length > 120) {
      next.fullName = 'Nama lengkap harus terdiri dari 2–120 karakter.';
    }
    if (!normalizeWhatsApp(whatsapp)) {
      next.whatsapp = 'Masukkan nomor WhatsApp Indonesia yang valid (contoh: 0895...).';
    }
    if (address.trim().length < 8 || address.trim().length > 400) {
      next.address = 'Alamat harus terdiri dari 8–400 karakter.';
    }
    if (!INDONESIAN_PROVINCES.includes(province)) next.province = 'Pilih provinsi yang tersedia.';
    if (city.trim().length < 2 || city.trim().length > 80) {
      next.city = 'Kota/kabupaten harus terdiri dari 2–80 karakter.';
    }
    if (district.trim().length < 2 || district.trim().length > 80) {
      next.district = 'Kecamatan harus terdiri dari 2–80 karakter.';
    }
    if (!/^[0-9]{5}$/.test(postalCode.trim())) next.postalCode = 'Kode pos harus 5 digit angka.';
    if (notes.trim().length > 500) next.notes = 'Catatan pesanan maksimal 500 karakter.';
    if (!(['Transfer Bank', 'QRIS', 'COD'] as PaymentMethod[]).includes(paymentMethod)) {
      next.paymentMethod = 'Pilih metode pembayaran yang tersedia.';
    }
    if (!selectedShipping || !shippingOptions.some((option) => option.id === selectedShipping.id)) {
      next.shipping = 'Pilih metode pengiriman yang tersedia.';
    }
    if (cart.length === 0 || cart.length > 499) {
      next.cart = 'Keranjang kosong atau jumlah produk melebihi batas checkout.';
    } else if (
      cart.some(
        (item) =>
          !item.productId.trim() ||
          !item.name.trim() ||
          !item.imageUrl.trim() ||
          !item.size.trim() ||
          !item.color.trim() ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 100 ||
          !Number.isFinite(getEffectivePrice(item.price, item.discountPrice)) ||
          getEffectivePrice(item.price, item.discountPrice) <= 0
      ) ||
      cart.reduce((count, item) => count + item.quantity, 0) > 500
    ) {
      next.cart = 'Ada produk di keranjang yang datanya tidak valid. Hapus lalu tambahkan kembali produk tersebut.';
    }

    setErrors(next);
    return Object.values(next)[0] || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    if (submissionLock.current) return;

    submissionLock.current = true;
    setSubmitting(true);
    try {
      const created = await createOrderAtomic({
        fullName,
        whatsapp: normalizeWhatsApp(whatsapp),
        address,
        province,
        city,
        district,
        postalCode,
        notes,
        shippingMethod: selectedShipping ? `${selectedShipping.name} (${selectedShipping.eta})` : 'JNE Regular',
        shippingCost,
        paymentMethod,
        promoCode: appliedPromo?.code || '',
        discountAmount,
        items: cart,
      });

      setConfirmedOrder(created);
      clearCart();
      showToast(`Pesanan ${created.orderNumber} berhasil dibuat!`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showToast(
        getOrderSubmissionError(err),
        'error'
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  // Post-Checkout Order Confirmation Screen
  if (confirmedOrder) {
    const waConfirmHref = buildWhatsAppUrl(
      STORE_INFO.whatsapp,
      `Halo RC STORE, saya ingin mengonfirmasi pesanan ${confirmedOrder.orderNumber} atas nama ${confirmedOrder.fullName} dengan total ${formatIDR(confirmedOrder.totalAmount)} (${confirmedOrder.paymentMethod}).`
    );

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="border border-zinc-200 bg-white p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-7 h-7 text-zinc-950" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Pesanan Diterima
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
                Order #{confirmedOrder.orderNumber} Confirmed
              </h1>
            </div>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed mb-8">
            Terima kasih, <strong>{confirmedOrder.fullName}</strong>. Pesanan Anda telah tercatat
            dalam sistem RC STORE dengan status <strong>{confirmedOrder.status}</strong>.
          </p>

          {/* Payment Instructions */}
          <div className="border border-zinc-200 bg-zinc-50 p-5 mb-6 space-y-2 text-sm">
            <p className="font-semibold text-zinc-950">
              Instruksi Pembayaran: {confirmedOrder.paymentMethod}
            </p>
            {confirmedOrder.paymentMethod === 'Transfer Bank' && (
              <div className="text-zinc-700 space-y-1">
                <p>Silakan transfer tepat sebesar total tagihan ke salah satu rekening resmi:</p>
                <p className="font-mono text-xs bg-white border border-zinc-200 p-3 mt-2">
                  BRI 602701001915501 a.n. WAHYU CAHYO SAPUTRO ·
                </p>
              </div>
            )}
            {confirmedOrder.paymentMethod === 'QRIS' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <div className="w-28 h-28 bg-white border border-zinc-300 flex flex-col items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-zinc-950" />
                  <span className="font-mono text-[10px] text-zinc-500 mt-1">QRIS RC STORE</span>
                </div>
                <p className="text-zinc-700 text-xs leading-relaxed">
                  Scan QRIS di atas melalui aplikasi e-wallet atau mobile banking Anda (BCA, Mandiri,
                  GoPay, OVO, DANA, ShopeePay), lalu kirimkan bukti bayar via WhatsApp.
                </p>
              </div>
            )}
            {confirmedOrder.paymentMethod === 'COD' && (
              <p className="text-zinc-700 text-xs leading-relaxed">
                Siapkan uang tunai sejumlah <strong>{formatIDR(confirmedOrder.totalAmount)}</strong>{' '}
                saat kurir tiba di alamat tujuan. Tim kami akan menghubungi nomor WhatsApp Anda
                sebelum pengiriman diproses.
              </p>
            )}
          </div>

          {/* Receipt Details */}
          <div className="border-t border-zinc-200 pt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Produk</span>
              <span className="text-zinc-950 text-right max-w-md">{confirmedOrder.itemsSummary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pengiriman</span>
              <span className="text-zinc-950">{confirmedOrder.shippingMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Alamat</span>
              <span className="text-zinc-950 text-right max-w-md">
                {confirmedOrder.address}, {confirmedOrder.district}, {confirmedOrder.city},{' '}
                {confirmedOrder.province} {confirmedOrder.postalCode}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-zinc-100 font-semibold text-base tabular-nums">
              <span>Total Pembayaran</span>
              <span>{formatIDR(confirmedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={waConfirmHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 bg-zinc-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konfirmasi Pesanan via WhatsApp</span>
            </a>
            <Link
              to="/shop"
              className="h-12 px-6 border border-zinc-300 text-zinc-950 text-sm font-medium inline-flex items-center justify-center hover:bg-zinc-50"
            >
              Kembali Belanja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-950">
          Tidak Ada Produk untuk Checkout
        </h1>
        <p className="text-sm text-zinc-600 mt-2 mb-6">
          Tambahkan produk ke keranjang belanja terlebih dahulu sebelum melanjutkan checkout.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 h-11 px-6 bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-800"
        >
          <span>Belanja Sekarang</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Keranjang</span>
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-950 mb-8">
        Checkout Pesanan
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Shipping & Payment Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer & Address */}
          <section className="border border-zinc-200 p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
              1. Informasi Penerima & Alamat Pengiriman
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Bagas Pratama"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0895xxxxxxxx"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
                {errors.whatsapp && (
                  <p className="text-xs text-red-600 mt-1">{errors.whatsapp}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Alamat Lengkap *
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                className="w-full p-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Provinsi *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                >
                  {INDONESIAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-xs text-red-600 mt-1">{errors.province}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
                {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Kecamatan *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Contoh: Kebayoran Baru"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
                {errors.district && (
                  <p className="text-xs text-red-600 mt-1">{errors.district}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Kode Pos *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="12160"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm tabular-nums focus:outline-none focus:border-zinc-950"
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Catatan Pesanan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titip di pos satpam atau kirim sore hari"
                className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
              {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes}</p>}
            </div>
          </section>

          {/* Shipping Method */}
          <section className="border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Truck className="w-4 h-4 text-zinc-950" />
              <h2 className="font-display text-lg font-semibold text-zinc-950">
                2. Metode Pengiriman
              </h2>
            </div>

            <div className="space-y-2.5">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    selectedShipping?.id === opt.id
                      ? 'border-zinc-950 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={selectedShipping?.id === opt.id}
                      onChange={() => setSelectedShippingId(opt.id)}
                      className="accent-zinc-950"
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{opt.name}</p>
                      <p className="text-xs text-zinc-500">Estimasi {opt.eta}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                    {opt.cost === 0 ? 'Gratis' : formatIDR(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
            {errors.shipping && <p className="text-xs text-red-600">{errors.shipping}</p>}
          </section>

          {/* Payment Method */}
          <section className="border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <CreditCard className="w-4 h-4 text-zinc-950" />
              <h2 className="font-display text-lg font-semibold text-zinc-950">
                3. Metode Pembayaran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Transfer Bank', 'QRIS', 'COD'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 border text-left transition-colors ${
                    paymentMethod === method
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400'
                  }`}
                >
                  <p className="text-sm font-semibold">{method}</p>
                  <p
                    className={`text-xs mt-1 ${
                      paymentMethod === method ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {method === 'Transfer Bank'
                      ? 'BCA & Mandiri'
                      : method === 'QRIS'
                      ? 'Semua e-wallet & bank'
                      : 'Bayar tunai ke kurir'}
                  </p>
                </button>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="text-xs text-red-600">{errors.paymentMethod}</p>
            )}
          </section>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 border border-zinc-200 bg-zinc-50 p-6 lg:sticky lg:top-24 space-y-5">
          <h2 className="font-display text-lg font-semibold text-zinc-950 pb-3 border-b border-zinc-200">
            Ringkasan Pesanan ({cartCount} item)
          </h2>
          {errors.cart && <p className="text-xs text-red-600">{errors.cart}</p>}

          <div className="divide-y divide-zinc-200 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => {
              const unitPrice = getEffectivePrice(item.price, item.discountPrice);
              return (
                <div key={item.key} className="py-3 flex gap-3 items-center">
                  <div className="w-14 h-14 bg-white border border-zinc-200 shrink-0 overflow-hidden">
                    <StoreImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-950 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.size} · {item.color} · x{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-950 tabular-nums shrink-0">
                    {formatIDR(unitPrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Promo Input */}
          <div className="pt-2 border-t border-zinc-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Kode promo (RCNEW15)"
                className="flex-1 h-10 px-3 bg-white border border-zinc-300 text-xs uppercase focus:outline-none focus:border-zinc-950"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="h-10 px-4 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800"
              >
                Pakai
              </button>
            </div>
            {promoFeedback && (
              <p className={`text-xs mt-1.5 ${appliedPromo ? 'text-zinc-900' : 'text-red-600'}`}>
                {promoFeedback}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-zinc-200 pt-4 space-y-2.5 text-sm tabular-nums">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal Produk</span>
              <span>{formatIDR(cartSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-zinc-950 font-medium">
                <span>Diskon ({appliedPromo?.code})</span>
                <span>-{formatIDR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Ongkos Kirim ({selectedShipping?.name})</span>
              <span>{shippingCost === 0 ? 'Gratis' : formatIDR(shippingCost)}</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 flex items-center justify-between">
            <span className="font-semibold text-zinc-950">Total Pembayaran</span>
            <span className="font-display text-2xl font-bold text-zinc-950 tabular-nums">
              {formatIDR(totalAmount)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors"
          >
            {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
          </button>
        </aside>
      </form>
    </div>
  );
};
