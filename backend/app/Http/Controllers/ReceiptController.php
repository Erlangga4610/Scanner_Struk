<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReceiptController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:4096',
        ]);

        try {
            Log::info('--- MULAI PROSES SCAN (REVISI FINAL) ---');

            $image = $request->file('image');
            $base64Image = base64_encode(file_get_contents($image->path()));
            $mimeType = $image->getMimeType();
            $apiKey = env('GEMINI_API_KEY');

            // Gunakan Model Experimental (Gratis & Cerdas)
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey;

            // PROMPT BARU: Kita minta STRING, jangan NUMBER. Biar tidak salah baca 36.000 jadi 36.
            $prompt = "Kamu adalah scanner struk Indonesia. Analisa gambar ini.
            Ekstrak data dan kembalikan JSON.
            
            ATURAN KHUSUS HARGA & ANGKA:
            1. Jangan ubah format angka. Kembalikan sebagai STRING apa adanya.
            2. Jika tertulis '36.000', kembalikan string \"36000\" (hilangkan titiknya).
            3. QTY: Jika ada '1 lusin', ubah jadi angka 12.
            
            Format JSON yang diminta:
            {
                \"nama_toko\": \"string\",
                \"tanggal\": \"YYYY-MM-DD\",
                \"items\": [
                    {
                        \"nama\": \"string\",
                        \"qty\": \"string angka\", 
                        \"harga_total\": \"string angka (harga di paling kanan baris)\"
                    }
                ],
                \"total_bayar\": \"string angka\"
            }
            
            Ingat: harga_total adalah angka yang ada di kanan setiap baris barang.";

            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, [
                    'contents' => [[
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $base64Image
                                ]
                            ]
                        ]
                    ]]
                ]);

            if ($response->failed()) {
                throw new \Exception('Gagal hubungi Google: ' . $response->status());
            }

            $result = $response->json();
            $textAnswer = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            // Bersihkan JSON
            $cleanJson = str_replace(['```json', '```'], '', $textAnswer);
            $data = json_decode($cleanJson, true);

            if (!$data) {
                throw new \Exception('Gagal decode JSON dari AI.');
            }

            // --- BAGIAN PEMBERSIHAN DATA (CLEANING) OLEH PHP ---
            // Kita pastikan formatnya benar-benar angka di sini, bukan di AI.
            
            // 1. Bersihkan Total Bayar
            $cleanTotal = isset($data['total_bayar']) ? $this->cleanNumber($data['total_bayar']) : 0;
            
            // 2. Bersihkan Setiap Item
            $cleanItems = [];
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $qty = $this->cleanNumber($item['qty'] ?? 1);
                    $totalHargaBaris = $this->cleanNumber($item['harga_total'] ?? 0);
                    
                    // Hitung harga satuan (Total / Qty)
                    $hargaSatuan = ($qty > 0) ? ($totalHargaBaris / $qty) : $totalHargaBaris;

                    $cleanItems[] = [
                        'name' => $item['nama'] ?? 'Item Tanpa Nama',
                        'qty' => $qty,
                        'price' => $totalHargaBaris, // Total per baris
                        'unit_price' => $hargaSatuan // Harga satuan hasil hitungan PHP
                    ];
                }
            }

            // Struktur Akhir yang dikirim ke Frontend
            $finalData = [
                'merchant_name' => $data['nama_toko'] ?? 'Toko Tidak Dikenal',
                'date' => $data['tanggal'] ?? date('Y-m-d'),
                'items' => $cleanItems,
                'total' => $cleanTotal
            ];

            return response()->json([
                'status' => 'success',
                'data' => $finalData
            ]);

        } catch (\Exception $e) {
            Log::error('Scan Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Fungsi Helper untuk membersihkan angka "Rp 36.000" jadi integer 36000
    private function cleanNumber($value)
    {
        // Hapus apa pun yang BUKAN angka (termasuk titik, koma, huruf)
        $clean = preg_replace('/[^0-9]/', '', (string)$value);
        return (int)$clean;
    }
}