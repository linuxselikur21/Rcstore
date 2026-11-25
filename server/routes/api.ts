import { Router } from 'express';

const apiRouter = Router();

const JAVA_PROVINCES = new Set([
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
]);

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'RC STORE API' });
});

apiRouter.post('/shipping/calculate', (req, res) => {
  const province = typeof req.body?.province === 'string' ? req.body.province.trim() : '';
  const subtotal = Number(req.body?.subtotal || 0);

  if (!province || Number.isNaN(subtotal) || subtotal < 0) {
    return res.status(400).json({ error: 'Provinsi dan subtotal harus valid.' });
  }

  const isJava = JAVA_PROVINCES.has(province);
  const freeEligible = subtotal >= 500000;
  const baseReg = isJava ? 18000 : 32000;
  const baseExpress = isJava ? 29000 : 48000;

  const options = [
    {
      id: 'jne-reg',
      name: 'JNE Regular',
      eta: isJava ? '2–3 hari kerja' : '4–6 hari kerja',
      cost: freeEligible ? 0 : baseReg,
    },
    {
      id: 'jnt-exp',
      name: 'J&T Express',
      eta: isJava ? '1–2 hari kerja' : '3–5 hari kerja',
      cost: freeEligible ? 0 : baseReg + 2000,
    },
    {
      id: 'sicepat-best',
      name: 'SiCepat BEST',
      eta: isJava ? '1 hari kerja' : '2–3 hari kerja',
      cost: baseExpress,
    },
  ];

  if (province === 'DKI Jakarta' || province === 'Banten' || province === 'Jawa Barat') {
    options.push({
      id: 'instant-same-day',
      name: 'Instant / Same-Day Courier',
      eta: 'Tiba di hari yang sama (Jabodetabek)',
      cost: 42000,
    });
  }

  return res.json({ options, freeShippingThreshold: 500000 });
});

apiRouter.post('/promo/validate', (req, res) => {
  const rawCode = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const subtotal = Number(req.body?.subtotal || 0);

  if (!rawCode) {
    return res.status(400).json({ valid: false, message: 'Masukkan kode promo terlebih dahulu.' });
  }
  if (Number.isNaN(subtotal) || subtotal <= 0) {
    return res.status(400).json({ valid: false, message: 'Subtotal keranjang tidak valid.' });
  }

  if (rawCode === 'RCNEW15') {
    const discountAmount = Math.min(100000, Math.round(subtotal * 0.15));
    return res.json({
      valid: true,
      code: 'RCNEW15',
      discountAmount,
      freeShipping: false,
      message: 'Diskon 15% (maks. Rp 100.000) berhasil diterapkan.',
    });
  }

  if (rawCode === 'RCLOCAL10') {
    const discountAmount = Math.min(75000, Math.round(subtotal * 0.1));
    return res.json({
      valid: true,
      code: 'RCLOCAL10',
      discountAmount,
      freeShipping: false,
      message: 'Diskon 10% (maks. Rp 75.000) berhasil diterapkan.',
    });
  }

  return res.status(404).json({
    valid: false,
    discountAmount: 0,
    message: 'Kode promo tidak ditemukan atau sudah berakhir.',
  });
});

export default apiRouter;
