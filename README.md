# 🧾 Scanner Struk AI (Receipt Scanner)

Aplikasi web modern untuk memindai struk belanja secara otomatis menggunakan kecerdasan buatan (Google Gemini AI). Aplikasi ini mampu mengekstrak nama toko, tanggal, daftar barang, dan total harga, lalu menyusunnya menjadi laporan yang dapat diunduh dalam format PDF.

![Project Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 Fitur Utama

* **AI OCR Scanning:** Menggunakan Google Gemini 2.0 Flash (Experimental) untuk membaca teks struk dengan akurasi tinggi.
* **Smart Parsing:** Otomatis mendeteksi item belanja, qty, dan harga satuan.
* **Auto-Correction:** Logika cerdas di Backend untuk membersihkan format angka rupiah (misal: "36.000" dibaca 36000, bukan 36).
* **Multi-Scan Mode:** Bisa scan banyak struk berturut-turut tanpa reload halaman.
* **PDF Export:** Generate laporan rekapitulasi pengeluaran rapi siap cetak.
* **Modern UI:** Antarmuka responsif dan bersih menggunakan React + CSS modern.

## 🛠️ Teknologi yang Digunakan

**Backend:**
* Laravel (PHP Framework)
* Google Gemini API (Generative AI)
* HTTP Client (Guzzle)

**Frontend:**
* React.js (Vite)
* Axios (API Request)
* jsPDF & jspdf-autotable (PDF Generation)
* CSS3 (Custom Styling)

## ⚙️ Prasyarat (Requirements)

Sebelum menjalankan project, pastikan kamu sudah menginstall:
* PHP >= 8.1
* Composer
* Node.js & npm
* Akun Google AI Studio (untuk mendapatkan API Key)

## 🚀 Cara Install & Menjalankan

### 1. Setup Backend (Laravel)

```bash
# Clone repository
git clone [https://github.com/username-kamu/Scanner_Struk.git](https://github.com/username-kamu/Scanner_Struk.git)
cd Scanner_Struk/backend

# Install dependency PHP
composer install

# Buat file .env
cp .env.example .env

# Generate App Key
php artisan key:generate
