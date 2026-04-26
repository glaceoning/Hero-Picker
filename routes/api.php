<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/{endpoint}', function (string $endpoint) {
    $allowedEndpoints = [
        'map-info',
        'map-type',
        'hero-info',
        'hero-img',
        'hero-tiers',
        'hero-counters',
        'hero-synergies',
        'hero-maps',
        'hero-adc',
        'version',
    ];

    abort_unless(in_array($endpoint, $allowedEndpoints, true), 404);

    $apiResponse = Http::timeout(10)->get("https://api.overpicker.com/{$endpoint}");

    abort_unless($apiResponse->successful(), $apiResponse->status());

    return response($apiResponse->body(), 200)
        ->header('Content-Type', 'application/json')
        ->header('Cache-Control', 'public, max-age=300');
})->where('endpoint', '[A-Za-z0-9-]+');
