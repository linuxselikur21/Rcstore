import React, { useState } from 'react';
import { Clock, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STORE_INFO } from '../data/seedCatalog';
import { submitContactInquiry } from '../lib/storeService';
import { buildWhatsAppUrl } from '../utils/format';

export const ContactPage: React.FC = () => {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const waHref = buildWhatsAppUrl(
    STORE_INFO.whatsapp,
    'Halo RC STORE, saya ingin menghubungi tim layanan pelanggan.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Alamat email tidak valid.');
      return;
    }
    if (subject.trim().length < 2 || message.trim().length < 5) {
      setError('Subjek dan pesan harus diisi dengan lengkap.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry({ name, email, whatsapp, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setWhatsapp('');
      setSubject('');
      setMessage('');
      showToast('Pesan Anda telah terkirim ke tim RC STORE.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-2xl mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-2">
          Hubungi Kami
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
          Layanan Pelanggan RC STORE
        </h1>
        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          Punya pertanyaan soal ketersediaan ukuran, status pengiriman, atau kerja sama? Kirim pesan
          melalui formulir di bawah atau hubungi langsung via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Store Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-zinc-200 p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <MessageCircle className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">WhatsApp Resmi</p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-zinc-950 hover:underline mt-0.5 inline-block"
                >
                  {STORE_INFO.whatsapp}
                </a>
                <p className="text-xs text-zinc-500 mt-1">Respon cepat untuk cek stok & konfirmasi order.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-zinc-100">
              <Mail className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Email</p>
                <p className="text-sm font-medium text-zinc-950 mt-0.5">{STORE_INFO.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-zinc-100">
              <MapPin className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Studio & Showroom</p>
                <p className="text-sm font-medium text-zinc-950 mt-0.5">{STORE_INFO.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 border-t border-zinc-100">
              <Clock className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Jam Operasional</p>
                <p className="text-sm font-medium text-zinc-950 mt-0.5">{STORE_INFO.hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 border border-zinc-200 p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-zinc-950 mb-5">
            Kirim Pesan Langsung
          </h2>

          {sent && (
            <div className="mb-6 p-4 bg-zinc-50 border border-zinc-300 text-sm text-zinc-900">
              Terima kasih! Pesan Anda sudah kami terima dan akan dibalas dalam 1x24 jam kerja.
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Subjek *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Tanya stok / ukuran / kerjasama"
                  className="w-full h-11 px-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Pesan *
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 border border-zinc-300 text-sm focus:outline-none focus:border-zinc-950"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-6 bg-zinc-950 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Pesan'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
