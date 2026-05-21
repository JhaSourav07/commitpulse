export interface BadgeLabels {
  CURRENT_STREAK: string;
  ANNUAL_SYNC_TOTAL: string;
  PEAK_STREAK: string;
}

export const labels: Record<string, BadgeLabels> = {
  en: {
    CURRENT_STREAK: 'CURRENT_STREAK',
    ANNUAL_SYNC_TOTAL: 'ANNUAL_SYNC_TOTAL',
    PEAK_STREAK: 'PEAK_STREAK',
  },
  es: {
    CURRENT_STREAK: 'RACHA_ACTUAL',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANUAL',
    PEAK_STREAK: 'RACHA_MÁXIMA',
  },
  hi: {
    CURRENT_STREAK: 'वर्तमान_स्ट्रीक',
    ANNUAL_SYNC_TOTAL: 'वार्षिक_कुल',
    PEAK_STREAK: 'अधिकतम_स्ट्रीक',
  },
  fr: {
    CURRENT_STREAK: 'SÉRIE_ACTUELLE',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANNUEL',
    PEAK_STREAK: 'SÉRIE_MAXIMALE',
  },
};

export function getLabels(lang: string = 'en'): BadgeLabels {
  return labels[lang.toLowerCase()] || labels['en'];
}
