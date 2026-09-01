export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'accent';

export type DeviceOrMessageStatus =
  | 'connected'
  | 'connecting'
  | 'qr_required'
  | 'disconnected'
  | 'logged_out'
  | 'suspended'
  | 'queued'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

const STATUS_LABELS_AR: Record<DeviceOrMessageStatus, string> = {
  connected: 'متصل وجاهز',
  connecting: 'جارٍ الاتصال',
  qr_required: 'يحتاج ربطًا',
  disconnected: 'الاتصال منقطع',
  logged_out: 'تم تسجيل الخروج',
  suspended: 'موقوف',
  queued: 'بانتظار الإرسال',
  processing: 'جارٍ الإرسال',
  sent: 'تم الإرسال',
  delivered: 'تم التسليم',
  read: 'تمت القراءة',
  failed: 'فشل الإرسال',
};

const STATUS_TONES: Record<DeviceOrMessageStatus, StatusTone> = {
  connected: 'success',
  connecting: 'info',
  qr_required: 'warning',
  disconnected: 'neutral',
  logged_out: 'neutral',
  suspended: 'danger',
  queued: 'neutral',
  processing: 'info',
  sent: 'brand',
  delivered: 'success',
  read: 'success',
  failed: 'danger',
};

export function statusLabel(status: DeviceOrMessageStatus, locale: 'ar' | 'en' = 'ar'): string {
  if (locale === 'ar') {
    return STATUS_LABELS_AR[status];
  }

  return status.replaceAll('_', ' ');
}

export function statusTone(status: DeviceOrMessageStatus): StatusTone {
  return STATUS_TONES[status];
}
