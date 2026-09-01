import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
  type E164Number,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

export type DialCountry = {
  iso2: CountryCode;
  dial: string;
  nameAr: string;
  nameEn: string;
};

/** Priority countries for WhatsApp SaaS (MENA-first), then the rest. */
const PRIORITY: CountryCode[] = [
  'SY',
  'SA',
  'AE',
  'EG',
  'IQ',
  'JO',
  'LB',
  'KW',
  'QA',
  'BH',
  'OM',
  'YE',
  'PS',
  'TR',
  'DE',
  'FR',
  'GB',
  'US',
  'CA',
  'MA',
  'TN',
  'DZ',
  'LY',
  'SD',
];

const NAMES_AR: Partial<Record<CountryCode, string>> = {
  SY: 'سوريا',
  SA: 'السعودية',
  AE: 'الإمارات',
  EG: 'مصر',
  IQ: 'العراق',
  JO: 'الأردن',
  LB: 'لبنان',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عُمان',
  YE: 'اليمن',
  PS: 'فلسطين',
  TR: 'تركيا',
  DE: 'ألمانيا',
  FR: 'فرنسا',
  GB: 'بريطانيا',
  US: 'الولايات المتحدة',
  CA: 'كندا',
  MA: 'المغرب',
  TN: 'تونس',
  DZ: 'الجزائر',
  LY: 'ليبيا',
  SD: 'السودان',
};

function regionDisplayName(iso2: CountryCode, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

let cachedCountries: DialCountry[] | null = null;

export function listDialCountries(): DialCountry[] {
  if (cachedCountries) {
    return cachedCountries;
  }

  const all = getCountries().map((iso2) => {
    const dial = `+${getCountryCallingCode(iso2)}`;
    return {
      iso2,
      dial,
      nameAr: NAMES_AR[iso2] ?? regionDisplayName(iso2, 'ar'),
      nameEn: regionDisplayName(iso2, 'en'),
    } satisfies DialCountry;
  });

  const prioritySet = new Set(PRIORITY);
  const preferred = PRIORITY.map((iso2) => all.find((c) => c.iso2 === iso2)).filter(
    Boolean,
  ) as DialCountry[];
  const rest = all
    .filter((c) => !prioritySet.has(c.iso2))
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));

  cachedCountries = [...preferred, ...rest];
  return cachedCountries;
}

export type PhoneParseResult = {
  e164: string;
  country: CountryCode | undefined;
  nationalNumber: string;
  valid: boolean;
  possible: boolean;
  isMobileLike: boolean;
  error: string | null;
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatNationalInput(country: CountryCode, national: string): string {
  const typed = new AsYouType(country);
  return typed.input(digitsOnly(national));
}

export function exampleNational(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, examples);
    return example?.formatNational() ?? '';
  } catch {
    return '';
  }
}

export function parseWhatsAppPhone(
  country: CountryCode,
  national: string,
): PhoneParseResult {
  const nationalDigits = digitsOnly(national);

  if (nationalDigits === '') {
    return {
      e164: '',
      country,
      nationalNumber: '',
      valid: false,
      possible: false,
      isMobileLike: false,
      error: null,
    };
  }

  const raw = `+${getCountryCallingCode(country)}${nationalDigits}`;
  const parsed = parsePhoneNumberFromString(raw, country);

  if (!parsed) {
    return {
      e164: '',
      country,
      nationalNumber: nationalDigits,
      valid: false,
      possible: false,
      isMobileLike: false,
      error: 'تعذر قراءة الرقم. تحقق من رمز الدولة والرقم.',
    };
  }

  const e164 = parsed.number as E164Number;
  const valid = isValidPhoneNumber(e164);
  const type = parsed.getType();
  const isMobileLike =
    type === 'MOBILE' ||
    type === 'FIXED_LINE_OR_MOBILE' ||
    type === undefined; // some regions omit type; still allow if valid

  if (!valid) {
    return {
      e164,
      country: parsed.country,
      nationalNumber: parsed.nationalNumber,
      valid: false,
      possible: parsed.isPossible(),
      isMobileLike,
      error: 'رقم واتساب غير صالح لهذا البلد.',
    };
  }

  if (type === 'FIXED_LINE' || type === 'PREMIUM_RATE' || type === 'SHARED_COST' || type === 'VOIP') {
    return {
      e164,
      country: parsed.country,
      nationalNumber: parsed.nationalNumber,
      valid: false,
      possible: true,
      isMobileLike: false,
      error: 'يجب إدخال رقم جوال صالح لواتساب (وليس رقم أرضي).',
    };
  }

  return {
    e164,
    country: parsed.country ?? country,
    nationalNumber: parsed.nationalNumber,
    valid: true,
    possible: true,
    isMobileLike: true,
    error: null,
  };
}

export function splitE164(
  e164: string,
  fallbackCountry: CountryCode = 'SY',
): { country: CountryCode; national: string } {
  if (!e164) {
    return { country: fallbackCountry, national: '' };
  }

  const parsed = parsePhoneNumberFromString(e164);
  if (parsed?.country) {
    return {
      country: parsed.country,
      national: parsed.formatNational(),
    };
  }

  return { country: fallbackCountry, national: digitsOnly(e164) };
}

export function isValidWhatsAppE164(e164: string): boolean {
  if (!e164.startsWith('+')) {
    return false;
  }

  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed || !isValidPhoneNumber(e164)) {
    return false;
  }

  const type = parsed.getType();
  if (type === 'FIXED_LINE' || type === 'PREMIUM_RATE' || type === 'SHARED_COST') {
    return false;
  }

  return true;
}
