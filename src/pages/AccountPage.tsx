import React, { useEffect, useState } from 'react';
import { LogOut, PackageCheck, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { INDONESIAN_PROVINCES } from '../data/seedCatalog';
import { subscribeUserOrders, updateUserProfileData } from '../lib/storeService';
import { Order } from '../types/store';
import { formatFirestoreDate, formatIDR } from '../utils/format';

export const AccountPage: React.FC = () => {
  const {
    user,
    userProfile,
    authLoading,
    isAdmin,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    signOutUser,
    showToast,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Profile form state when signed in
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    address: '',
    province: 'DKI Jakarta',
    city: '',
    district: '',
    postalCode: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        province: userProfile.province || 'DKI Jakarta',
        city: userProfile.city || '',
        district: userProfile.district || '',
        postalCode: userProfile.postalCode || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }
    setOrdersLoading(true);
    const unsub = subscribeUserOrders(user.uid, (list) => {
      setMyOrders(list);
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setAuthError('Nama lengkap minimal 2 karakter.');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Konfirmasi password tidak cocok.');
        return;
      }
      setSubmitting(true);
      try {
        await registerWithEmail(name, email, password, phone);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Registrasi gagal.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(true);
      try {
        await loginWithEmail(email, password);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Login gagal.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthError('');
    if (!email.trim()) {
      setAuthError('Masukkan alamat email Anda terlebih dahulu untuk reset password.');
      return;
    }
    try {
      await sendPasswordReset(email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal mengirim email reset password.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (profileForm.displayName.trim().length < 2) {
      showToast('Nama lengkap minimal 2 karakter.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfileData(user.uid, profileForm);
      showToast('Profil dan alamat pengiriman berhasil disimpan ke Firestore.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <p className="text-sm text-zinc-500">Memuat informasi akun...</p>
      </div>
    );
  }

  // Unauthenticated View: Login & Registration
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-14 sm:py-20">
        <div className="border border-zinc-200 bg-white p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/aistudio/Minimalist_RC_Store_Logo_181a503e.png"
              alt="Logo RC STORE"
              className="w-11 h-11 object-contain bg-black rounded-sm shrink-0"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Akun Pelanggan RC STORE
              </p>
              <h1 className="font-display text-2xl font-bold text-zinc-950">
                {mode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
              </h1>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 border border-zinc-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError('');
              }}
              className={`h-10 text-xs font-semibold transition-colors ${
                mode === 'login' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-600'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError('');
              }}
              className={`h-10 text-xs font-semibold transition-colors ${
                mode === 'register' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-600'
              }`}
            >
              Daftar
            </button>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dimas Pratama"
                    className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Alamat Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700">Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-zinc-500 hover:text-zinc-950 underline"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Konfirmasi Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors"
            >
              {submitting
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk dengan Email'
                : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">atau</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
            className="w-full h-11 border border-zinc-300 bg-white text-zinc-950 text-sm font-medium hover:border-zinc-950 transition-colors"
          >
            Lanjutkan dengan Google
          </button>
        </div>
      </div>
    );
  }

  // Authenticated View: Profile + Orders History
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="border-b border-zinc-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-zinc-950 text-white flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Akun Saya · {user.email}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
              {userProfile?.displayName || user.displayName || 'Pelanggan RC STORE'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="h-10 px-4 bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dashboard Admin</span>
            </Link>
          )}
          <button
            type="button"
            onClick={signOutUser}
            className="h-10 px-4 border border-zinc-300 text-zinc-800 text-xs font-medium inline-flex items-center gap-2 hover:border-zinc-950 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Saved Profile & Shipping Info */}
        <section className="lg:col-span-5 border border-zinc-200 p-6">
          <h2 className="font-display text-lg font-semibold text-zinc-950 pb-3 border-b border-zinc-100 mb-5">
            Profil & Alamat Tersimpan
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                className="w-full h-10 px-3 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full h-10 px-3 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full p-3 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Provinsi</label>
                <select
                  value={profileForm.province}
                  onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-zinc-300 text-sm"
                >
                  {INDONESIAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Kota/Kabupaten</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full h-10 px-3 border border-zinc-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full h-10 px-3 border border-zinc-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  maxLength={5}
                  value={profileForm.postalCode}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      postalCode: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full h-10 px-3 border border-zinc-300 text-sm tabular-nums"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-11 bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors"
            >
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </section>

        {/* Order History */}
        <section className="lg:col-span-7 border border-zinc-200 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-5">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-zinc-950" />
              <h2 className="font-display text-lg font-semibold text-zinc-950">
                Riwayat Pesanan Saya ({myOrders.length})
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-medium text-zinc-700 hover:text-zinc-950 underline">
              Belanja Lagi
            </Link>
          </div>

          {ordersLoading ? (
            <p className="text-sm text-zinc-500 py-8 text-center">Memuat riwayat pesanan...</p>
          ) : myOrders.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-zinc-600 mb-4">
                Anda belum memiliki riwayat pesanan dengan akun ini.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center h-10 px-5 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800"
              >
                Lihat Produk
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {myOrders.map((o) => (
                <div key={o.id} className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-950">
                      {o.orderNumber}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">{o.itemsSummary}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 tabular-nums">
                    <span>
                      {formatFirestoreDate(o.createdAt)} · {o.paymentMethod} · {o.shippingMethod}
                    </span>
                    <span className="text-sm font-semibold text-zinc-950">
                      {formatIDR(o.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
