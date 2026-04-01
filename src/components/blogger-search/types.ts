export interface BloggerStats {
  totalDeals: number;
  completedDeals: number;
  completionRate: number;
  pickupRate: number;
  reviewRate: number;
  ugcRate: number;
  avgDaysToReview: number;
  hasDelays: boolean;
  hasFails: boolean;
  reviewCount: number;
  avgRating: number;
  doesVideo: boolean;
  doesPhoto: boolean;
  badge: 'recommended' | 'risk' | 'new' | null;
  avgShortsViews: number;
  avgReelsViews: number;
  avgTotalViews: number;
  avgLinkableViews: number;
  riskScore: number;
  speedCategory: 'fast' | 'medium' | 'slow';
}

export interface EnrichedBlogger {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  niche: string | null;
  subscribers_count: number;
  trust_score: number;
  content_formats: string[] | null;
  telegram_id: string | null;
  bio: string | null;
  platforms: any;
  stats: BloggerStats;
  latestReviews: { comment: string; rating: number; reviewer_name: string }[];
  questionnaire?: {
    pricing_type: string;
    review_type: string;
    activity_level: string;
    audience_age: string;
    audience_geo: string;
    purchasing_power: string;
    work_style: string;
    deals_experience: string;
    content_style: string[];
    excluded_categories: string[];
    full_name: string;
    age: number | null;
    country: string;
    city: string;
    audience_gender_male: number;
    has_children: boolean;
    children_ages: string;
    has_partner: boolean;
    motivation: string[];
    self_reliability: number;
    self_speed: number;
    self_quality: number;
    sample_review: string;
    best_video_url: string;
    portfolio_videos: string[];
    portfolio_photos: string[];
    content_examples: string[];
    avg_shorts_views: number;
    avg_reels_views: number;
    avg_stories_views: number;
    avg_video_views: number;
    avg_post_views: number;
    does_video: boolean;
    does_photo: boolean;
    speed_days: number | null;
    had_delays: boolean;
    reliability_index: number;
    speed_index: number;
    quality_index: number;
    discipline_index: number;
    completion_probability: number;
    additional_info: string;
  } | null;
}

export type SearchGoal = 'reviews' | 'fast' | 'ugc' | 'mass';

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'telegram' | 'vk';
export type SpeedFilter = 'fast' | 'medium' | 'slow';
export type PriceType = 'barter' | 'paid';

export interface MatchingParams {
  productUrl: string;
  categories: string[];
  goals: SearchGoal[];
  platforms: SocialPlatform[];
  minReach: string;
  reachMode: 'per_platform' | 'total';
  speed: SpeedFilter | null;
  minRiskScore: number;
  priceTypes: PriceType[];
  // Extended fields for recommendation engine
  targetGender: 'male' | 'female' | 'unisex' | null;
  targetAgeRange: string | null;
  targetGeo: string | null;
  familyRelevant: boolean;
  weights: {
    category: number;
    geo: number;
    audience: number;
    reach: number;
    reliability: number;
    speed: number;
    cooperation: number;
    family: number;
  };
}

export type QuickFilter = 'reviews' | 'fast' | 'ugc' | 'reliable';

export type SearchStep = 'prediction' | 'matching' | 'results';
