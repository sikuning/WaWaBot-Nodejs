import { WaWaBot } from '../src/index.js';

const bot = new WaWaBot({
  apiKey: process.env.WAWA_API_KEY || 'api-key',
  accountId: process.env.WAWA_ACCOUNT_ID || 'user-1',
});

// 1. Mulai sesi
await bot.start();

// 2. Ambil QR — tampilkan di terminal / browser, lalu scan di WhatsApp
const qr = await bot.getQr({ isHtml: false });
console.log('QR:', qr);

// 3. Cek status login
const session = await bot.getSession();
console.log('Session:', session);

// 4. Kirim teks
await bot.sendText({
  to: '6281234567890',
  text: 'Halo dari WaWaBot!',
});

// 5. Kirim gambar (uncomment jika ada file)
// await bot.sendMedia({
//   to: '6281234567890',
//   caption: 'ini pesan',
//   file: './foto.jpg',
// });

// 6. Cek nomor
// const lookup = await bot.lookup({ to: '085612312311' });
// console.log('Lookup:', lookup);
