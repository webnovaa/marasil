<?php

declare(strict_types=1);

return [
    'disk' => env('MEDIA_DISK', 'local'),
    'max_upload_mb' => (int) env('MEDIA_MAX_UPLOAD_MB', 16),
    'allowed_mimes' => [
        'jpeg', 'jpg', 'png', 'gif', 'webp',
        'pdf',
        'mp4', 'mp3', 'ogg', 'opus',
        'doc', 'docx', 'xls', 'xlsx',
    ],
    'allowed_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/opus',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
];
