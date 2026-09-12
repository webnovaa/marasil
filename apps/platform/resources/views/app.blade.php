<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Marasil') }}</title>
        <link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon-16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png">
        <link rel="icon" type="image/png" sizes="48x48" href="/brand/favicon-48.png">
        <link rel="icon" type="image/png" sizes="64x64" href="/brand/favicon-64.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/brand/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/brand/icon-512.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="shortcut icon" href="/favicon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#321D3C">

        {{-- Self-hosted Tajawal from /public/fonts (no CDN) --}}
        <link rel="preload" href="/fonts/tajawal-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="/fonts/tajawal-arabic-700-normal.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="/fonts/tajawal-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased font-sans">
        @inertia
    </body>
</html>
