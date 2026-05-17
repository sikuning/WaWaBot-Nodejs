# WaWaBot

Client Node.js untuk mengirim pesan WhatsApp lewat [WaWa API](https://wa-api.knn.my.id).

## Install

```bash
npm install wawabot
```

## Quick start

```javascript
import { WaWaBot } from 'wawabot';

const bot = new WaWaBot({
  apiKey: 'api-key',
  accountId: 'user-1',
});

await bot.start();
const qr = await bot.getQr();
await bot.sendText({ to: '6281234567890', text: 'Halo!' });
```

## API

| Method | Keterangan |
|--------|------------|
| `start()` | Mulai sesi |
| `getQr({ isHtml })` | Ambil QR untuk scan |
| `getSession()` | Cek status login |
| `getInfoMe()` | Info akun |
| `sendText({ to, text })` | Kirim teks |
| `sendMedia({ to, caption, file })` | Kirim gambar/file |
| `lookup({ to })` | Cek nomor WA |
| `logout()` | Logout |

Butuh Node.js **18+**.
