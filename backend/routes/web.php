<?php


use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/cek-model-google', function () {
    $apiKey = env('GEMINI_API_KEY');
    
    // Kita minta Google kasih daftar semua model yang tersedia untuk kunci ini
    $response = Http::get("https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}");
    
    return $response->json();
});

Route::get('/', function () {
    return view('welcome');
});
