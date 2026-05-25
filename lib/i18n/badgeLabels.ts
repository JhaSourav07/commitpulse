export interface BadgeLabels {
  CURRENT_STREAK: string;
  ANNUAL_SYNC_TOTAL: string;
  PEAK_STREAK: string;
  COMMITS_THIS_MONTH: string;
  VS_LAST_MONTH: string;
}

export const labels: Record<string, BadgeLabels> = {
  en: {
    CURRENT_STREAK: 'CURRENT_STREAK',
    ANNUAL_SYNC_TOTAL: 'ANNUAL_SYNC_TOTAL',
    PEAK_STREAK: 'PEAK_STREAK',
    COMMITS_THIS_MONTH: 'COMMITS THIS MONTH',
    VS_LAST_MONTH: 'vs last month',
  },
  es: {
    CURRENT_STREAK: 'RACHA_ACTUAL',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANUAL',
    PEAK_STREAK: 'RACHA_MÁXIMA',
    COMMITS_THIS_MONTH: 'COMMITS ESTE MES',
    VS_LAST_MONTH: 'vs mes anterior',
  },
  hi: {
    CURRENT_STREAK: 'वर्तमान_स्ट्रीक',
    ANNUAL_SYNC_TOTAL: 'वार्षिक_कुल',
    PEAK_STREAK: 'अधिकतम_स्ट्रीक',
    COMMITS_THIS_MONTH: 'इस महीने के कमिट्स',
    VS_LAST_MONTH: 'पिछले महीने की तुलना में',
  },
  fr: {
    CURRENT_STREAK: 'SÉRIE_ACTUELLE',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANNUEL',
    PEAK_STREAK: 'SÉRIE_MAXIMALE',
    COMMITS_THIS_MONTH: 'COMMITS CE MOIS',
    VS_LAST_MONTH: 'vs mois dernier',
  },
};

export function getLabels(lang: string = 'en'): BadgeLabels {
  return labels[lang.toLowerCase()] || labels['en'];
}
