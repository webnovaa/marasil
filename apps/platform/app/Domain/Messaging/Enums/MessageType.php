<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Enums;

enum MessageType: string
{
    case Text = 'text';
    case Image = 'image';
    case Document = 'document';
    case Audio = 'audio';
    case Video = 'video';
    case Location = 'location';
    case Contact = 'contact';
}
