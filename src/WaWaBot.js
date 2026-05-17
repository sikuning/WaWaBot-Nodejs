import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const DEFAULT_BASE_URL = 'https://wa-api.knn.my.id';

/**
 * Client WaWaBot — kirim pesan WhatsApp via WaWa API.
 *
 * @example
 * const bot = new WaWaBot({ apiKey: 'api-key', accountId: 'user-1' });
 * await bot.start();
 * const qr = await bot.getQr();
 * await bot.sendText({ to: '6281234567890', text: 'Halo!' });
 */
export class WaWaBot {
  /**
   * @param {object} options
   * @param {string} options.apiKey - API key dari penyedia layanan
   * @param {string} options.accountId - ID akun (mis. user-1)
   * @param {string} [options.baseUrl] - Base URL API (default: https://wa-api.knn.my.id)
   */
  constructor({ apiKey, accountId, baseUrl = DEFAULT_BASE_URL }) {
    if (!apiKey) throw new Error('apiKey wajib diisi');
    if (!accountId) throw new Error('accountId wajib diisi');

    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /** @param {string} path */
  _url(path) {
    return `${this.baseUrl}/accounts/${this.accountId}${path}`;
  }

  /** @param {Record<string, string>} [headers] */
  _headers(headers = {}) {
    return {
      accept: 'application/json',
      'x-api-key': this.apiKey,
      ...headers,
    };
  }

  /**
   * @param {Response} res
   * @returns {Promise<unknown>}
   */
  async _parseResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message =
        body && typeof body === 'object' && body.message
          ? body.message
          : typeof body === 'string'
            ? body
            : `Request gagal (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body;
  }

  /**
   * @param {string} path
   * @param {RequestInit} [init]
   */
  async _request(path, init = {}) {
    const res = await fetch(this._url(path), {
      ...init,
      headers: this._headers(init.headers),
    });
    return this._parseResponse(res);
  }

  /** Mulai sesi WhatsApp — scan QR setelah ini. */
  async start() {
    return this._request('/start', { method: 'POST', body: '' });
  }

  /**
   * Ambil QR code untuk scan di HP.
   * @param {{ isHtml?: boolean }} [options]
   */
  async getQr(options = {}) {
    const isHtml = options.isHtml ?? false;
    const res = await fetch(this._url(`/qr?ishtml=${isHtml}`), {
      headers: {
        accept: '*/*',
        'x-api-key': this.apiKey,
      },
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      return this._parseResponse(res);
    }

    if (contentType.includes('application/json')) {
      return res.json();
    }

    return res.text();
  }

  /** Cek status sesi / login. */
  async getSession() {
    return this._request('/session');
  }

  /** Alias: cek nomor & status login (endpoint info-me). */
  async getInfoMe() {
    const res = await fetch(`${this.baseUrl}/info-me`, {
      headers: this._headers(),
    });
    return this._parseResponse(res);
  }

  /**
   * Kirim pesan teks.
   * @param {{ to: string, text: string }} params
   */
  async sendText({ to, text }) {
    if (!to) throw new Error('to wajib diisi');
    if (!text) throw new Error('text wajib diisi');

    return this._request('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    });
  }

  /**
   * Kirim gambar / media.
   * @param {{ to: string, caption?: string, file: string | { path: string, filename?: string, mimeType?: string } }} params
   */
  async sendMedia({ to, caption, file }) {
    if (!to) throw new Error('to wajib diisi');
    if (!file) throw new Error('file wajib diisi');

    const filePath = typeof file === 'string' ? file : file.path;
    const filename =
      (typeof file === 'object' && file.filename) || basename(filePath);
    const mimeType =
      (typeof file === 'object' && file.mimeType) || 'application/octet-stream';

    const buffer = readFileSync(filePath);
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('to', to);
    if (caption) formData.append('caption', caption);
    formData.append('file', blob, filename);

    const res = await fetch(this._url('/send-media'), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-api-key': this.apiKey,
      },
      body: formData,
    });

    return this._parseResponse(res);
  }

  /**
   * Cek nomor WhatsApp terdaftar atau tidak.
   * @param {{ to: string }} params
   */
  async lookup({ to }) {
    if (!to) throw new Error('to wajib diisi');
    return this._request(`/lookup?to=${encodeURIComponent(to)}`);
  }

  /** Logout / putuskan sesi WhatsApp. */
  async logout() {
    return this._request('/logout', { method: 'POST', body: '' });
  }
}
