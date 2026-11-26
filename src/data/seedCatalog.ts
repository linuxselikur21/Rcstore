import { Category, Product, ShippingOption } from '../types/store';

export const STORE_INFO = {
  name: 'RC STORE',
  tagline: 'Define Your Style, Own Your Look.',
  whatsapp: '0895364565750',
  email: 'wahyu21cahyo@gmail.com',
  instagram: 'wahyuselikur',
  tiktok: 'wahyuselikur',
  address: '3/2 Bonang, lasem, Rembang, Jawa Tengah, Indonesia',
  hours: 'Senin – Minggu, 06.00 – 24.00 WIB',
  freeShippingThreshold: 500000,
};

export const HERO_IMAGE = '/src/assets/images/hero_rc_editorial_1795623909363.jpg';
export const PROMO_IMAGE = '/src/assets/images/promo_rc_monochrome_1795623883406.jpg';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-tshirt',
    name: 'T-Shirt',
    slug: 't-shirt',
    description: 'Kaos heavyweight 280gsm dan boxy fit esensial untuk gaya harian.',
    imageUrl: '/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg',
    displayOrder: 1,
  },
  {
    id: 'cat-shirt',
    name: 'Shirt',
    slug: 'shirt',
    description: 'Kemeja camp collar dan oxford modern dengan siluet clean dan breathable.',
    imageUrl: '/src/assets/images/prod_shirt_oxford_1795623882684.jpg',
    displayOrder: 2,
  },
  {
    id: 'cat-hoodie',
    name: 'Hoodie',
    slug: 'hoodie',
    description: 'Pullover dan zip hoodie fleece gramasi tebal berpotongan boxy.',
    imageUrl: '/src/assets/images/prod_hoodie_boxy_1795623882722.jpg',
    displayOrder: 3,
  },
  {
    id: 'cat-jacket',
    name: 'Jacket',
    slug: 'jacket',
    description: 'Outerwear workwear canvas dan washed denim berstruktur tegas.',
    imageUrl: '/src/assets/images/prod_jacket_workwear_1795623882609.jpg',
    displayOrder: 4,
  },
  {
    id: 'cat-pants',
    name: 'Pants',
    slug: 'pants',
    description: 'Celana pleated wide-leg dan chino relaxed fit untuk tampilan rapi.',
    imageUrl: '/src/assets/images/prod_pants_cargo_1795623882686.jpg',
    displayOrder: 5,
  },
  {
    id: 'cat-jeans',
    name: 'Jeans',
    slug: 'jeans',
    description: 'Selvedge dan straight-leg washed denim berkualitas tinggi.',
    imageUrl: '/src/assets/images/prod_jeans_selvedge_1795623882744.jpg',
    displayOrder: 6,
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Topi twill terstruktur dan tas kanvas heavyweight pelengkap outfit.',
    imageUrl: '/src/assets/images/prod_cap_tote_1795623906209.jpg',
    displayOrder: 7,
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'rc-tee-noir-280',
    name: 'Noir Heavyweight Boxy Tee',
    slug: 'noir-heavyweight-boxy-tee',
    category: 'T-Shirt',
    description:
      'Kaos oversized berpotongan boxy yang dirancang untuk siluet bahu jatuh yang tegas. Menggunakan katun combed 280gsm yang padat namun tetap adem dipakai di iklim tropis Indonesia.',
    material: '100% Combed Cotton 280gsm · Kerah rib tebal 2.5cm · Pre-shrunk',
    price: 199000,
    discountPrice: 159000,
    stock: 42,
    rating: 4.9,
    reviewCount: 128,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Jet Black', 'Charcoal', 'Chalk White'],
    images: [
      '/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg',
      '/src/assets/images/prod_tshirt_white_1795623882128.jpg',
    ],
    isBestSeller: true,
    isNewArrival: false,
    isSale: true,
  },
  {
    id: 'rc-tee-chalk-260',
    name: 'Chalk Essential Crew Tee',
    slug: 'chalk-essential-crew-tee',
    category: 'T-Shirt',
    description:
      'Kaos putih kapur esensial dengan struktur kerah mock-rib tebal yang tidak mudah melar. Cocok dijadikan inner jaket kerja maupun dipakai satuan untuk tampilan bersih.',
    material: '100% Heavy Cotton 260gsm · Jahitan rantai bahu ganda',
    price: 179000,
    discountPrice: 0,
    stock: 56,
    rating: 4.8,
    reviewCount: 94,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Chalk White', 'Ash Grey', 'Jet Black'],
    images: [
      '/src/assets/images/prod_tshirt_white_1795623882128.jpg',
      '/src/assets/images/prod_tshirt_heavyweight_1795623882987.jpg',
    ],
    isBestSeller: false,
    isNewArrival: true,
    isSale: false,
  },
  {
    id: 'rc-shirt-stone-camp',
    name: 'Stone Linen Camp Collar Shirt',
    slug: 'stone-linen-camp-collar-shirt',
    category: 'Shirt',
    description:
      'Kemeja lengan pendek dengan kerah camp terbuka yang santai namun tetap terstruktur. Paduan katun dan linen menghasilkan tekstur natural yang sejuk untuk kuliah, kerja kreatif, hingga akhir pekan.',
    material: '65% Cotton 35% Linen · Kancing resin matte · Relaxed boxy cut',
    price: 329000,
    discountPrice: 279000,
    stock: 28,
    rating: 4.9,
    reviewCount: 73,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Stone Grey', 'Chalk White', 'Jet Black'],
    images: [
      '/src/assets/images/prod_shirt_oxford_1795623882684.jpg',
      '/src/assets/images/promo_rc_monochrome_1795623883406.jpg',
    ],
    isBestSeller: true,
    isNewArrival: true,
    isSale: true,
  },
  {
    id: 'rc-hoodie-slate-boxy',
    name: 'Monolith Boxy Pullover Hoodie',
    slug: 'monolith-boxy-pullover-hoodie',
    category: 'Hoodie',
    description:
      'Hoodie pullover bergaya arsitektural dengan tudung dua lapis tanpa tali berlebih dan potongan crop-boxy modern. Memberikan siluet rapi tanpa menggembung di pinggang.',
    material: '420gsm French Terry Cotton Fleece · Ribbing elastis premium',
    price: 449000,
    discountPrice: 389000,
    stock: 24,
    rating: 4.9,
    reviewCount: 152,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Jet Black', 'Ash Grey'],
    images: [
      '/src/assets/images/prod_hoodie_boxy_1795623882722.jpg',
      '/src/assets/images/prod_hoodie_zip_1795623882576.jpg',
    ],
    isBestSeller: true,
    isNewArrival: false,
    isSale: true,
  },
  {
    id: 'rc-hoodie-ash-zip',
    name: 'Heather Two-Way Zip Hoodie',
    slug: 'heather-two-way-zip-hoodie',
    category: 'Hoodie',
    description:
      'Zip hoodie warna abu-abu heather dengan ritsleting logam dua arah yang memudahkan styling layering bersama kaos boxy maupun kemeja.',
    material: '390gsm Cotton Fleece · Metal two-way zipper · Kantong welt',
    price: 429000,
    discountPrice: 0,
    stock: 19,
    rating: 4.8,
    reviewCount: 61,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Heather Ash', 'Charcoal', 'Jet Black'],
    images: [
      '/src/assets/images/prod_hoodie_zip_1795623882576.jpg',
      '/src/assets/images/prod_hoodie_boxy_1795623882722.jpg',
    ],
    isBestSeller: false,
    isNewArrival: true,
    isSale: false,
  },
  {
    id: 'rc-jacket-canvas-work',
    name: 'Atelier Cropped Canvas Jacket',
    slug: 'atelier-cropped-canvas-jacket',
    category: 'Jacket',
    description:
      'Jaket kerja berpotongan sedikit cropped dengan bahan kanvas katun padat dan lapisan dalam halus. Dirancang untuk melengkapi celana wide-leg maupun denim lurus.',
    material: '12oz Cotton Duck Canvas · Full satin lining · Matte black zipper',
    price: 599000,
    discountPrice: 499000,
    stock: 14,
    rating: 5.0,
    reviewCount: 87,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Jet Black', 'Charcoal'],
    images: [
      '/src/assets/images/prod_jacket_workwear_1795623882609.jpg',
      '/src/assets/images/promo_rc_monochrome_1795623883406.jpg',
    ],
    isBestSeller: true,
    isNewArrival: false,
    isSale: true,
  },
  {
    id: 'rc-jacket-washed-denim',
    name: 'Shadow Washed Trucker Jacket',
    slug: 'shadow-washed-trucker-jacket',
    category: 'Jacket',
    description:
      'Jaket denim washed hitam keabuan dengan karakter fade halus dan kancing gunmetal matte. Potongan boxy modern memberikan ruang gerak nyaman sepanjang hari.',
    material: '13.5oz Washed Cotton Denim · Gunmetal hardware · Boxy fit',
    price: 549000,
    discountPrice: 0,
    stock: 18,
    rating: 4.8,
    reviewCount: 45,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Washed Charcoal', 'Jet Black'],
    images: [
      '/src/assets/images/prod_jacket_denim_1795623882591.jpg',
      '/src/assets/images/prod_jacket_workwear_1795623882609.jpg',
    ],
    isBestSeller: false,
    isNewArrival: true,
    isSale: false,
  },
  {
    id: 'rc-pants-pleated-wide',
    name: 'Tailored Double-Pleat Trousers',
    slug: 'tailored-double-pleat-trousers',
    category: 'Pants',
    description:
      'Celana panjang lipit ganda berpotongan wide-tapered yang jatuh rapi di atas sepatu. Memberikan kesan elegan dan profesional tanpa terasa kaku.',
    material: 'Semi-Wool Viscose Blend · YKK zipper · Adjustable side tab',
    price: 389000,
    discountPrice: 339000,
    stock: 31,
    rating: 4.9,
    reviewCount: 109,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Jet Black', 'Stone Grey'],
    images: [
      '/src/assets/images/prod_pants_cargo_1795623882686.jpg',
      '/src/assets/images/hero_rc_editorial_1795623909363.jpg',
    ],
    isBestSeller: true,
    isNewArrival: false,
    isSale: true,
  },
  {
    id: 'rc-jeans-selvedge-slate',
    name: 'Raw Slate Straight Selvedge Jeans',
    slug: 'raw-slate-straight-selvedge-jeans',
    category: 'Jeans',
    description:
      'Denim potongan lurus klasik dari kain selvedge 14oz dengan detail jahitan kontras halus. Kuat, berstruktur, dan membentuk karakter pribadi seiring pemakaian.',
    material: '14oz Red-Line Selvedge Denim · Copper rivets · Straight fit',
    price: 499000,
    discountPrice: 449000,
    stock: 22,
    rating: 4.9,
    reviewCount: 64,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Dark Slate', 'Washed Charcoal'],
    images: [
      '/src/assets/images/prod_jeans_selvedge_1795623882744.jpg',
      '/src/assets/images/prod_jacket_denim_1795623882591.jpg',
    ],
    isBestSeller: false,
    isNewArrival: true,
    isSale: true,
  },
  {
    id: 'rc-acc-twill-set',
    name: 'Minimalist Twill Cap & Tote Bundle',
    slug: 'minimalist-twill-cap-tote-bundle',
    category: 'Accessories',
    description:
      'Paket pelengkap harian berisi topi 6-panel katun twill hitam matte dan tas tote kanvas 16oz dengan kompartemen laptop 15 inci.',
    material: 'Heavy Cotton Twill & 16oz Canvas · Metal strap buckle',
    price: 249000,
    discountPrice: 199000,
    stock: 37,
    rating: 4.8,
    reviewCount: 53,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black / Natural', 'Jet Black'],
    images: [
      '/src/assets/images/prod_cap_tote_1795623906209.jpg',
      '/src/assets/images/promo_rc_monochrome_1795623883406.jpg',
    ],
    isBestSeller: false,
    isNewArrival: true,
    isSale: true,
  },
];

export const TESTIMONIALS = [
  {
    id: 'testi-1',
    name: 'Dimas Pratama',
    role: 'Mahasiswa Arsitektur, Bandung',
    product: 'Noir Heavyweight Boxy Tee',
    quote:
      'Dulu susah cari kaos lokal yang kerahnya nggak cepat melar. Setelah pakai Noir Boxy Tee dari RC STORE selama 4 bulan, bahannya tetap tebal dan jatuhnya rapi untuk ke kampus.',
  },
  {
    id: 'testi-2',
    name: 'Raka Mahendra',
    role: 'Product Designer, Jakarta Selatan',
    product: 'Atelier Cropped Canvas Jacket',
    quote:
      'Potongan jaket dan celana lipitnya setara brand butik luar, tapi harganya jauh lebih masuk akal. Pengiriman cepat dan kemasan monokromnya terasa sangat premium.',
  },
  {
    id: 'testi-3',
    name: 'Fajar Nugroho',
    role: 'Content Creator, Yogyakarta',
    product: 'Monolith Boxy Pullover Hoodie',
    quote:
      'Siluet hoodie-nya bersih tanpa logo mencolok. Gampang banget dipadukan sama celana bahan maupun selvedge jeans untuk syuting konten sehari-hari.',
  },
];

export const INDONESIAN_PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Kalimantan Timur',
  'Sulawesi Selatan',
];

export function getShippingOptions(province: string, subtotal: number): ShippingOption[] {
  const isJava = ['DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur'].includes(
    province
  );
  const baseReg = isJava ? 18000 : 32000;
  const baseExpress = isJava ? 29000 : 48000;
  const freeEligible = subtotal >= STORE_INFO.freeShippingThreshold;

  const options: ShippingOption[] = [
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

  return options;
}
