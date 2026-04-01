import type { EnrichedBlogger, SocialPlatform, SpeedFilter, PriceType } from './types';

// ── Types ──────────────────────────────────────────────────

export interface PriorityWeights {
  category: number;    // 1-5
  geo: number;
  audience: number;
  reach: number;
  reliability: number;
  speed: number;
  cooperation: number;
  family: number;
}

export interface SellerCriteria {
  categories: string[];
  targetGender: 'male' | 'female' | 'unisex' | null;
  targetAgeRange: string | null;
  targetGeo: string | null;
  platforms: SocialPlatform[];
  minReach: number;
  reachMode: 'per_platform' | 'total';
  cooperationTypes: PriceType[];
  speed: SpeedFilter | null;
  familyRelevant: boolean;
  weights: PriorityWeights;
}

export interface BloggerPrediction {
  expectedViews: number;
  expectedClicks: number;
  expectedCtr: number;
}

export interface ScoredBlogger extends EnrichedBlogger {
  score: number;
  tier: 'recommended' | 'suitable' | 'weak';
  reasons: string[];
  coefficients: Record<string, number>;
  prediction: BloggerPrediction;
}

// ── Related categories map ─────────────────────────────────

const RELATED_CATEGORIES: Record<string, string[]> = {
  'Красота': ['Мода', 'Здоровье', 'Лайфстайл'],
  'Еда': ['Здоровье', 'Лайфстайл', 'Дом и уют', 'Дом'],
  'Фитнес': ['Здоровье', 'Лайфстайл', 'Красота', 'Спорт'],
  'Спорт': ['Фитнес', 'Здоровье', 'Лайфстайл'],
  'Мода': ['Красота', 'Аксессуары', 'Лайфстайл'],
  'Технологии': ['Электроника', 'Лайфстайл'],
  'Путешествия': ['Лайфстайл', 'Мода'],
  'Лайфстайл': ['Красота', 'Мода', 'Путешествия', 'Еда', 'Дом и уют', 'Дом'],
  'Дом и уют': ['Лайфстайл', 'Дети', 'Еда', 'Дом'],
  'Дом': ['Дом и уют', 'Лайфстайл', 'Дети'],
  'Дети': ['Дом и уют', 'Дом', 'Лайфстайл', 'Здоровье'],
  'Авто': ['Технологии', 'Лайфстайл'],
  'Здоровье': ['Фитнес', 'Спорт', 'Красота', 'Еда'],
  'Аксессуары': ['Мода', 'Красота'],
  'Электроника': ['Технологии', 'Лайфстайл'],
  'Финансы': ['Лайфстайл', 'Технологии'],
};

const FAMILY_CATEGORIES = ['Дети', 'Дом и уют'];

// ── Coefficient functions ──────────────────────────────────

function categoryCoeff(bloggerNiche: string | null, sellerCategories: string[]): number {
  if (!bloggerNiche || sellerCategories.length === 0) return 0.5;
  const bn = bloggerNiche.trim().toLowerCase();
  // Direct match with any selected category
  if (sellerCategories.some(sc => sc.trim().toLowerCase() === bn)) return 1;
  // Related match
  for (const sc of sellerCategories) {
    const related = RELATED_CATEGORIES[sc.trim()] || [];
    if (related.some(r => r.toLowerCase() === bn)) return 0.6;
  }
  return 0;
}

function geoCoeff(bloggerAudienceGeo: string | null, bloggerCity: string | null, targetGeo: string | null): number {
  if (!targetGeo) return 1; // no preference = everyone matches
  const tg = targetGeo.toLowerCase().trim();
  
  // Check audience_geo first (primary match — where the audience is)
  if (bloggerAudienceGeo) {
    const ag = bloggerAudienceGeo.toLowerCase();
    if (ag === tg) return 1;
    // "Россия, СНГ" includes "Россия", "Москва" etc.
    if (ag.includes(tg) || tg.includes(ag)) return 0.8;
    // Check comma-separated parts
    const agParts = ag.split(',').map(s => s.trim());
    if (agParts.some(p => p.includes(tg) || tg.includes(p))) return 0.7;
  }
  
  // Fallback: check blogger's personal city/country
  if (bloggerCity) {
    const bc = bloggerCity.toLowerCase().trim();
    if (bc === tg || bc.includes(tg) || tg.includes(bc)) return 0.5;
  }
  
  if (!bloggerAudienceGeo && !bloggerCity) return 0.4;
  return 0.1;
}

function audienceGenderCoeff(
  bloggerMalePercent: number,
  targetGender: 'male' | 'female' | 'unisex' | null
): number {
  if (!targetGender || targetGender === 'unisex') return 1;
  const bloggerMaleRatio = bloggerMalePercent / 100;
  if (targetGender === 'male') return bloggerMaleRatio;
  return 1 - bloggerMaleRatio;
}

function audienceAgeCoeff(bloggerAgeRange: string | null, targetAgeRange: string | null): number {
  if (!targetAgeRange) return 1;
  if (!bloggerAgeRange) return 0.5;
  // Simple overlap check
  if (bloggerAgeRange === targetAgeRange) return 1;
  // partial overlap heuristic
  const bloggerParts = bloggerAgeRange.match(/\d+/g)?.map(Number) || [];
  const targetParts = targetAgeRange.match(/\d+/g)?.map(Number) || [];
  if (bloggerParts.length >= 2 && targetParts.length >= 2) {
    const overlapStart = Math.max(bloggerParts[0], targetParts[0]);
    const overlapEnd = Math.min(bloggerParts[1], targetParts[1]);
    const targetSpan = targetParts[1] - targetParts[0];
    if (targetSpan > 0 && overlapEnd > overlapStart) {
      return Math.min(1, (overlapEnd - overlapStart) / targetSpan);
    }
  }
  return 0.3;
}

function reachCoeff(blogger: EnrichedBlogger, minReach: number, platforms: SocialPlatform[], reachMode: 'per_platform' | 'total'): number {
  if (minReach <= 0) return 1;
  const totalViews = blogger.stats.avgTotalViews;
  if (reachMode === 'total') {
    if (totalViews >= minReach) return 1;
    if (totalViews >= minReach * 0.7) return 0.7;
    return 0.3;
  }
  // per_platform: check that at least one platform meets threshold
  const shorts = blogger.stats.avgShortsViews;
  const reels = blogger.stats.avgReelsViews;
  const max = Math.max(shorts, reels, blogger.stats.avgLinkableViews);
  if (max >= minReach) return 1;
  if (max >= minReach * 0.7) return 0.7;
  return 0.3;
}

function reliabilityCoeff(blogger: EnrichedBlogger): number {
  const { completedDeals, totalDeals, avgRating } = blogger.stats;
  if (totalDeals === 0) {
    // Use questionnaire self-assessment
    const selfReliability = blogger.questionnaire?.self_reliability ?? 3;
    return selfReliability / 5;
  }
  const completionFactor = completedDeals / Math.max(1, totalDeals);
  const ratingFactor = avgRating / 5;
  return completionFactor * 0.7 + ratingFactor * 0.3;
}

function speedCoeff(blogger: EnrichedBlogger, targetSpeed: SpeedFilter | null): number {
  if (!targetSpeed) return 1;
  const { speedCategory } = blogger.stats;
  if (speedCategory === targetSpeed) return 1;
  if (targetSpeed === 'fast' && speedCategory === 'medium') return 0.5;
  if (targetSpeed === 'fast' && speedCategory === 'slow') return 0.2;
  if (targetSpeed === 'medium' && speedCategory === 'fast') return 1;
  if (targetSpeed === 'medium' && speedCategory === 'slow') return 0.5;
  // targetSpeed === 'slow' always gets 1 (no time pressure)
  return 0.7;
}

function cooperationCoeff(blogger: EnrichedBlogger, types: PriceType[]): number {
  if (types.length === 0) return 1;
  if (!blogger.questionnaire) return 0.5;
  const bp = blogger.questionnaire.pricing_type;
  // Both selected = everyone matches
  if (types.includes('barter') && types.includes('paid')) return 1;
  if (types.includes('barter')) return bp === 'barter' ? 1 : 0.3;
  return bp !== 'barter' ? 1 : 0.5;
}

function familyCoeff(blogger: EnrichedBlogger, familyRelevant: boolean, category: string): number {
  if (!familyRelevant && !FAMILY_CATEGORIES.includes(category)) return 1;
  const hasChildren = blogger.questionnaire?.has_children ?? false;
  const hasPartner = blogger.questionnaire?.has_partner ?? false;
  if (hasChildren || hasPartner) return 1;
  return 0.3;
}

// ── Hard filter ────────────────────────────────────────────

function passesHardFilter(blogger: EnrichedBlogger, criteria: SellerCriteria): boolean {
  // Platform filter
  if (criteria.platforms.length > 0) {
    const bp = blogger.platforms || {};
    const hasAny = criteria.platforms.some(p => bp[p]);
    if (!hasAny) return false;
  }

  // Barter filter: exclude non-barter bloggers if seller wants ONLY barter
  if (criteria.cooperationTypes.length === 1 && criteria.cooperationTypes[0] === 'barter' && blogger.questionnaire?.pricing_type && blogger.questionnaire.pricing_type !== 'barter') {
    return false;
  }

  // Excluded categories (blogger doesn't want any of seller's categories)
  if (blogger.questionnaire?.excluded_categories?.length && criteria.categories.length > 0) {
    const allExcluded = criteria.categories.every(cat =>
      blogger.questionnaire!.excluded_categories.some(ec => ec.toLowerCase() === cat.toLowerCase())
    );
    if (allExcluded) return false;
    }
  }

  return true;
}

// ── Prediction ─────────────────────────────────────────────

function predictPerformance(blogger: EnrichedBlogger, allBloggers: EnrichedBlogger[]): BloggerPrediction {
  const views = blogger.stats.avgTotalViews;

  // Category averages as fallback
  const sameCat = allBloggers.filter(b => b.niche === blogger.niche && b.stats.totalDeals > 0);
  const avgCatViews = sameCat.length > 0
    ? Math.round(sameCat.reduce((s, b) => s + b.stats.avgTotalViews, 0) / sameCat.length)
    : 1000;

  const expectedViews = views > 0 ? views : avgCatViews;
  // Estimate CTR 2-5% based on reliability
  const baseCtr = 0.02 + reliabilityCoeff(blogger) * 0.03;
  const expectedClicks = Math.round(expectedViews * baseCtr);
  const expectedCtr = Math.round(baseCtr * 10000) / 100;

  return { expectedViews, expectedClicks, expectedCtr };
}

// ── Main scoring function ──────────────────────────────────

export function scoreAndRankBloggers(
  bloggers: EnrichedBlogger[],
  criteria: SellerCriteria
): ScoredBlogger[] {
  const { weights } = criteria;

  const filtered = bloggers.filter(b => passesHardFilter(b, criteria));

  return filtered
    .map(blogger => {
      const coeffs: Record<string, number> = {
        category: categoryCoeff(blogger.niche, criteria.category),
        geo: geoCoeff(blogger.questionnaire?.audience_geo || null, blogger.questionnaire?.city || blogger.questionnaire?.country || null, criteria.targetGeo),
        audience: (
          audienceGenderCoeff(blogger.questionnaire?.audience_gender_male ?? 50, criteria.targetGender) +
          audienceAgeCoeff(blogger.questionnaire?.audience_age || null, criteria.targetAgeRange)
        ) / 2,
        reach: reachCoeff(blogger, criteria.minReach, criteria.platforms, criteria.reachMode),
        reliability: reliabilityCoeff(blogger),
        speed: speedCoeff(blogger, criteria.speed),
        cooperation: cooperationCoeff(blogger, criteria.cooperationType),
        family: familyCoeff(blogger, criteria.familyRelevant, criteria.category),
      };

      // Weighted score
      const weightKeys = Object.keys(weights) as (keyof PriorityWeights)[];
      let weightedSum = 0;
      let totalWeight = 0;
      for (const key of weightKeys) {
        const w = weights[key];
        const c = coeffs[key] ?? 0;
        weightedSum += c * w;
        totalWeight += w;
      }

      let score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 50;

      // ── Boosts ──
      const reasons: string[] = [];

      if (coeffs.category >= 1) reasons.push('Точная ниша');
      else if (coeffs.category >= 0.6) reasons.push('Смежная ниша');

      if (blogger.stats.speedCategory === 'fast') {
        score *= 1.1;
        reasons.push('Быстрый');
      }
      if (blogger.stats.completionRate >= 80 && blogger.stats.totalDeals >= 3) {
        score *= 1.15;
        reasons.push('Надёжный');
      }
      if (blogger.stats.avgRating >= 4.5 && blogger.stats.reviewCount >= 2) {
        score *= 1.1;
        reasons.push('Высокий рейтинг');
      }
      if (blogger.stats.hasDelays) {
        score *= 0.8;
        reasons.push('Были задержки');
      }
      if (blogger.stats.hasFails) {
        score *= 0.7;
        reasons.push('Есть отказы');
      }

      if (coeffs.geo >= 1 && criteria.targetGeo) reasons.push('Совпадает гео');
      if (coeffs.cooperation >= 1 && criteria.cooperationType) reasons.push(criteria.cooperationType === 'barter' ? 'Бартер' : 'С доплатой');
      if (coeffs.family >= 1 && criteria.familyRelevant) reasons.push('Семейный');

      score = Math.min(100, Math.max(0, Math.round(score)));

      const tier: ScoredBlogger['tier'] =
        score >= 80 ? 'recommended' :
        score >= 60 ? 'suitable' : 'weak';

      return {
        ...blogger,
        score,
        tier,
        reasons: reasons.slice(0, 5),
        coefficients: coeffs,
        prediction: predictPerformance(blogger, bloggers),
      } as ScoredBlogger;
    })
    .sort((a, b) => b.score - a.score);
}

// ── Auto-weights based on goals ────────────────────────────

export function getAutoWeights(goals: string[]): PriorityWeights {
  const base: PriorityWeights = {
    category: 3, geo: 2, audience: 3, reach: 3,
    reliability: 3, speed: 3, cooperation: 2, family: 1,
  };

  if (goals.includes('reviews')) {
    base.reliability = 5; base.speed = 3; base.category = 4;
  }
  if (goals.includes('fast')) {
    base.speed = 5; base.reliability = 3;
  }
  if (goals.includes('ugc')) {
    base.reach = 4; base.category = 4; base.audience = 4;
  }
  if (goals.includes('mass')) {
    base.cooperation = 5; base.reach = 2; base.reliability = 2;
  }

  return base;
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  category: 3, geo: 2, audience: 3, reach: 3,
  reliability: 3, speed: 3, cooperation: 2, family: 1,
};
