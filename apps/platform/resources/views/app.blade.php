<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Marasil') }}</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/brand/marasil-logo.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/brand/marasil-logo.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="shortcut icon" href="/favicon.png">
        <meta name="theme-color" content="#321A39">

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
