<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReceiptController;

// Rute ini akan diakses lewat: http://127.0.0.1:8000/api/scan
Route::post('/scan', [ReceiptController::class, 'scan']);