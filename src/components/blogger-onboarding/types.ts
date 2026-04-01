export interface QuestionnaireData {
  // Step 1: Basic
  full_name: string;
  age: number | null;
  country: string;
  city: string;

  // Step 2: Platforms
  social_platforms: Record<string, { url: string; subscribers: number; avg_views: number }>;

  // Step 3: Analytics
  avg_shorts_views: number;
  avg_reels_views: number;
  avg_stories_views: number;
  avg_video_views: number;
  avg_post_views: number;
  best_video_url: string;
  content_examples: string[];
  views_trend: string;

  // Step 4: Audience
  audience_gender_male: number;
  audience_age: string;
  audience_geo: string;
  purchasing_power: string;

  // Step 5: Content
  content_types: string[];
  does_video: boolean;
  does_photo: boolean;
  instagram_format: string;
  content_style: string[];

  // Step 6: Experience
  deals_experience: string;
  worked_marketplaces: string[];
  experience_results: string;

  // Step 7: Readiness
  ready_to_buy: boolean;
  ready_for_tz: boolean;
  ready_for_wb_review: boolean;
  ready_for_photo_review: boolean;
  ready_for_video_review: boolean;
  ready_for_shorts: boolean;

  // Step 8: Review type
  review_type: string;

  // Step 9: Speed
  speed_days: number | null;

  // Step 10: Discipline
  check_messages_frequency: string;
  had_delays: boolean;
  ready_for_reminders: boolean;
  ready_for_stages: boolean;

  // Step 11: Logistics
  has_pvz_nearby: boolean;
  pickup_speed: string;

  // Step 12: Restrictions
  excluded_categories: string[];
  min_product_price: number;
  max_product_price: number;

  // Step 13: Capacity
  products_per_month: string;
  activity_level: string;

  // Step 14: Pricing
  pricing_type: string;
  custom_price: number | null;

  // Step 15: Motivation
  motivation: string[];

  // Step 16: Work style
  work_style: string;

  // Step 17: Family
  has_children: boolean;
  children_ages: string;
  has_partner: boolean;

  // Step 18-19: Self-assessment
  self_reliability: number;
  self_speed: number;
  self_quality: number;

  // Step 20: Sample review
  sample_review: string;

  // Step 21: Portfolio
  portfolio_videos: string[];
  portfolio_photos: string[];

  // Step 22: Additional
  additional_info: string;

  // Step 23: Agreement
  agreement_accepted: boolean;

  // Meta
  current_step: number;
  completed: boolean;
}

export const defaultQuestionnaire: QuestionnaireData = {
  full_name: '',
  age: null,
  country: 'Россия',
  city: '',
  social_platforms: {},
  avg_shorts_views: 0,
  avg_reels_views: 0,
  avg_stories_views: 0,
  avg_video_views: 0,
  avg_post_views: 0,
  best_video_url: '',
  content_examples: [],
  views_trend: 'stable',
  audience_gender_male: 50,
  audience_age: '18-24',
  audience_geo: '',
  purchasing_power: 'medium',
  content_types: [],
  does_video: false,
  does_photo: false,
  instagram_format: '',
  content_style: [],
  deals_experience: '0-5',
  worked_marketplaces: [],
  experience_results: '',
  ready_to_buy: true,
  ready_for_tz: true,
  ready_for_wb_review: true,
  ready_for_photo_review: false,
  ready_for_video_review: false,
  ready_for_shorts: false,
  review_type: 'text_photo',
  speed_days: 3,
  check_messages_frequency: 'daily',
  had_delays: false,
  ready_for_reminders: true,
  ready_for_stages: true,
  has_pvz_nearby: true,
  pickup_speed: '1-2_days',
  excluded_categories: [],
  min_product_price: 0,
  max_product_price: 50000,
  products_per_month: '3-5',
  activity_level: 'active',
  pricing_type: 'barter',
  custom_price: null,
  motivation: [],
  work_style: 'balance',
  has_children: false,
  children_ages: '',
  has_partner: false,
  self_reliability: 3,
  self_speed: 3,
  self_quality: 3,
  sample_review: '',
  portfolio_videos: [],
  portfolio_photos: [],
  additional_info: '',
  agreement_accepted: false,
  current_step: 1,
  completed: false,
};

export const STEP_TITLES = [
  'Базовая информация',
  'Социальные сети',
  'Аналитика и контент',
  'Аудитория',
  'Опыт и готовность',
  'Условия работы',
  'О себе',
  'Подтверждение',
];

export const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'vk', label: 'VK' },
] as const;

export const CONTENT_TYPES = [
  'Разговорные видео', 'Распаковки', 'Обзоры', 'Lifestyle',
];

export const CONTENT_STYLES = [
  'Нативный', 'Рекламный', 'Экспертный', 'Развлекательный',
];

export const NICHES = [
  'Бьюти', 'Еда', 'Фитнес', 'Мода', 'Технологии', 'Путешествия',
  'Лайфстайл', 'Дом и уют', 'Дети', 'Авто', 'Финансы', 'Здоровье',
  'Образование', 'Игры',
];
