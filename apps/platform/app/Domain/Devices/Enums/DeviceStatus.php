<?php

declare(strict_types=1);

namespace App\Domain\Devices\Enums;

enum DeviceStatus: string
{
    case Pending = 'pending';
    case Starting = 'starting';
    case WaitingForQr = 'waiting_for_qr';
    case QrExpired = 'qr_expired';
    case Pairing = 'pairing';
    case Creating = 'creating';
    case QrRequired = 'qr_required';
    case Connecting = 'connecting';
    case Connected = 'connected';
    case Disconnected = 'disconnected';
    case Reconnecting = 'reconnecting';
    case LoggedOut = 'logged_out';
    case Suspended = 'suspended';
    case Error = 'error';
    case Failed = 'failed';
    case Deleting = 'deleting';
    case Deleted = 'deleted';
}
