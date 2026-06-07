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
  zh: {
    CURRENT_STREAK: '当前连续记录',
    ANNUAL_SYNC_TOTAL: '年度总计',
    PEAK_STREAK: '最长连续记录',
    COMMITS_THIS_MONTH: '本月提交次数',
    VS_LAST_MONTH: '较上个月',
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
  pt: {
    CURRENT_STREAK: 'SÉRIE_ATUAL',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANUAL',
    PEAK_STREAK: 'SÉRIE_MÁXIMA',
    COMMITS_THIS_MONTH: 'COMMITS ESTE MÊS',
    VS_LAST_MONTH: 'vs mês passado',
  },
  ko: {
    CURRENT_STREAK: '현재_연속',
    ANNUAL_SYNC_TOTAL: '연간_총계',
    PEAK_STREAK: '최고_연속',
    COMMITS_THIS_MONTH: '이번 달 커밋',
    VS_LAST_MONTH: '지난달 대비',
  },
  ja: {
    CURRENT_STREAK: '現在のストリーク',
    ANNUAL_SYNC_TOTAL: '年間合計',
    PEAK_STREAK: '最高ストリーク',
    COMMITS_THIS_MONTH: '今月のコミット数',
    VS_LAST_MONTH: '先月比',
  },
  fr: {
    CURRENT_STREAK: 'SÉRIE_ACTUELLE',
    ANNUAL_SYNC_TOTAL: 'TOTAL_ANNUEL',
    PEAK_STREAK: 'SÉRIE_MAXIMALE',
    COMMITS_THIS_MONTH: 'COMMITS CE MOIS',
    VS_LAST_MONTH: 'vs mois dernier',
  },
  ta: {
    CURRENT_STREAK: 'தற்போதைய_தொடர்',
    ANNUAL_SYNC_TOTAL: 'ஆண்டு_மொத்தம்',
    PEAK_STREAK: 'உச்ச_தொடர்',
    COMMITS_THIS_MONTH: 'இம்மாத கமிட்கள்',
    VS_LAST_MONTH: 'கடந்த மாதத்துடன்',
  },
  de: {
    CURRENT_STREAK: 'AKTUELLE_SERIE',
    ANNUAL_SYNC_TOTAL: 'JAHRES_GESAMT',
    PEAK_STREAK: 'SPITZEN_SERIE',
    COMMITS_THIS_MONTH: 'COMMITS DIESEN MONAT',
    VS_LAST_MONTH: 'im Vgl. zum Vormonat',
  },
};

export const supportedLanguages = Object.keys(labels) as [
  keyof typeof labels,
  ...(keyof typeof labels)[],
];

export function getLabels(lang: string = 'en'): BadgeLabels {
  return labels[lang.toLowerCase()] || labels['en'];
}
