export interface BadgeLabels {
  CURRENT_STREAK: string;
  ANNUAL_SYNC_TOTAL: string;
  PEAK_STREAK: string;
  COMMITS_THIS_MONTH: string;
  VS_LAST_MONTH: string;
}

export const labels: Record<string, BadgeLabels> = {
  en: {
    CURRENT_STREAK: 'Current Streak',
    ANNUAL_SYNC_TOTAL: 'Annual Total',
    PEAK_STREAK: 'Peak Streak',
    COMMITS_THIS_MONTH: 'Commits This Month',
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
    CURRENT_STREAK: 'Racha Actual',
    ANNUAL_SYNC_TOTAL: 'Total Anual',
    PEAK_STREAK: 'Racha Máxima',
    COMMITS_THIS_MONTH: 'Commits Este Mes',
    VS_LAST_MONTH: 'vs mes anterior',
  },
  hi: {
    CURRENT_STREAK: 'वर्तमान स्ट्रीक',
    ANNUAL_SYNC_TOTAL: 'वार्षिक कुल',
    PEAK_STREAK: 'अधिकतम स्ट्रीक',
    COMMITS_THIS_MONTH: 'इस महीने के कमिट्स',
    VS_LAST_MONTH: 'पिछले महीने की तुलना में',
  },
  pt: {
    CURRENT_STREAK: 'Série Atual',
    ANNUAL_SYNC_TOTAL: 'Total Anual',
    PEAK_STREAK: 'Série Máxima',
    COMMITS_THIS_MONTH: 'Commits Este Mês',
    VS_LAST_MONTH: 'vs mês passado',
  },
  ko: {
    CURRENT_STREAK: '현재 연속',
    ANNUAL_SYNC_TOTAL: '연간 총계',
    PEAK_STREAK: '최고 연속',
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
    CURRENT_STREAK: 'Série Actuelle',
    ANNUAL_SYNC_TOTAL: 'Total Annuel',
    PEAK_STREAK: 'Série Maximale',
    COMMITS_THIS_MONTH: 'Commits Ce Mois',
    VS_LAST_MONTH: 'vs mois dernier',
  },
  ta: {
    CURRENT_STREAK: 'தற்போதைய தொடர்',
    ANNUAL_SYNC_TOTAL: 'ஆண்டு மொத்தம்',
    PEAK_STREAK: 'உச்ச தொடர்',
    COMMITS_THIS_MONTH: 'இம்மாத கமிட்கள்',
    VS_LAST_MONTH: 'கடந்த மாதத்துடன்',
  },
  de: {
    CURRENT_STREAK: 'Aktuelle Serie',
    ANNUAL_SYNC_TOTAL: 'Jahres Gesamt',
    PEAK_STREAK: 'Spitzen Serie',
    COMMITS_THIS_MONTH: 'Commits Diesen Monat',
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
