import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BloggerStats, EnrichedBlogger } from './types';

function computeStats(
  blogger: any,
  deals: any[],
  reviews: any[],
  profileMap: Record<string, string>,
  questionnaire: any | null
): { stats: BloggerStats; latestReviews: EnrichedBlogger['latestReviews'] } {
  const bloggerDeals = deals.filter(d => d.blogger_id === blogger.user_id);
  const total = bloggerDeals.length;
  const completed = bloggerDeals.filter(d => d.status === 'finished').length;
  const pickedUp = bloggerDeals.filter(d =>
    ['picked_up', 'filming', 'review_posted', 'finished'].includes(d.status)
  ).length;
  const reviewed = bloggerDeals.filter(d =>
    ['review_posted', 'finished'].includes(d.status)
  ).length;
  const withContent = bloggerDeals.filter(d => d.content_url).length;
  const cancelled = bloggerDeals.filter(d => d.status === 'cancelled').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pickupRate = total > 0 ? Math.round((pickedUp / total) * 100) : 0;
  const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const ugcRate = total > 0 ? Math.round((withContent / total) * 100) : 0;

  let avgDays = 0;
  const finishedDeals = bloggerDeals.filter(d => d.status === 'finished' || d.status === 'review_posted');
  if (finishedDeals.length > 0) {
    const totalDays = finishedDeals.reduce((sum, d) => {
      const start = new Date(d.created_at).getTime();
      const end = new Date(d.updated_at).getTime();
      return sum + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    avgDays = Math.round(totalDays / finishedDeals.length);
  } else if (questionnaire?.speed_days) {
    avgDays = questionnaire.speed_days;
  } else {
    avgDays = Math.max(3, 14 - Math.round((blogger.trust_score || 0) * 2));
  }

  const bloggerReviews = reviews.filter(r => r.target_id === blogger.user_id);
  const avgRating = bloggerReviews.length > 0
    ? bloggerReviews.reduce((s, r) => s + r.rating, 0) / bloggerReviews.length
    : blogger.trust_score || 0;

  const formats = (blogger.content_formats || []) as string[];
  const doesVideo = questionnaire?.does_video ?? formats.some(f =>
    f.toLowerCase().includes('reel') || f.toLowerCase().includes('short') ||
    f.toLowerCase().includes('обзор') || f.toLowerCase().includes('распаковка')
  );
  const doesPhoto = questionnaire?.does_photo ?? formats.some(f => f.toLowerCase().includes('фото'));

  const hasDelays = questionnaire?.had_delays ?? avgDays > 10;
  const hasFails = total > 2 && cancelled / total > 0.3;

  let badge: BloggerStats['badge'] = null;
  if (total < 3) badge = 'new';
  else if (completionRate >= 80 && avgRating >= 4) badge = 'recommended';
  else if (completionRate < 50 || hasFails) badge = 'risk';

  // Use questionnaire data for views if available, else estimate
  const avgShortsViews = questionnaire?.avg_shorts_views ||
    Math.round((blogger.subscribers_count || 0) * 0.5);
  const avgReelsViews = questionnaire?.avg_reels_views ||
    Math.round((blogger.subscribers_count || 0) * 0.37);
  const avgStoriesViews = questionnaire?.avg_stories_views || 0;
  const avgVideoViews = questionnaire?.avg_video_views || 0;
  const avgPostViews = questionnaire?.avg_post_views || 0;

  const avgTotalViews = avgShortsViews + avgReelsViews + avgStoriesViews + avgVideoViews + avgPostViews;
  const avgLinkableViews = avgStoriesViews + avgPostViews; // Stories + VK/Telegram

  // Risk score from questionnaire or computed
  let riskScore: number;
  if (questionnaire?.reliability_index) {
    riskScore = Math.round(questionnaire.reliability_index);
  } else {
    riskScore = hasFails ? 1 : hasDelays ? 2 : completionRate >= 80 ? 5 : completionRate >= 60 ? 4 : 3;
  }

  // Speed from questionnaire or computed
  let speedCategory: 'fast' | 'medium' | 'slow';
  if (questionnaire?.speed_days) {
    speedCategory = questionnaire.speed_days <= 2 ? 'fast' : questionnaire.speed_days <= 7 ? 'medium' : 'slow';
  } else {
    speedCategory = avgDays <= 3 ? 'fast' : avgDays <= 7 ? 'medium' : 'slow';
  }

  const stats: BloggerStats = {
    totalDeals: total,
    completedDeals: completed,
    completionRate: total > 0 ? completionRate : Math.min(95, Math.round((blogger.trust_score || 3) * 20)),
    pickupRate: total > 0 ? pickupRate : Math.min(98, Math.round((blogger.trust_score || 3) * 22)),
    reviewRate: total > 0 ? reviewRate : Math.min(90, Math.round((blogger.trust_score || 3) * 18)),
    ugcRate: total > 0 ? ugcRate : (doesVideo || doesPhoto ? Math.round((blogger.trust_score || 3) * 15) : 0),
    avgDaysToReview: avgDays,
    hasDelays,
    hasFails: total > 0 ? hasFails : false,
    reviewCount: bloggerReviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
    doesVideo,
    doesPhoto: doesPhoto || !doesVideo,
    badge: total > 0 ? badge : (blogger.trust_score >= 4 ? 'recommended' : 'new'),
    avgShortsViews,
    avgReelsViews,
    avgTotalViews,
    avgLinkableViews,
    riskScore,
    speedCategory,
  };

  const latestReviews = bloggerReviews.slice(0, 2).map(r => ({
    comment: r.comment || '',
    rating: r.rating,
    reviewer_name: profileMap[r.reviewer_id] || 'Селлер',
  }));

  return { stats, latestReviews };
}

export function useBloggerSearch(enabled: boolean) {
  return useQuery({
    queryKey: ['blogger-search-enriched'],
    queryFn: async (): Promise<EnrichedBlogger[]> => {
      // Only fetch approved questionnaires and bloggers who passed moderation
      const [{ data: questionnaires }, { data: sellerProfiles }] = await Promise.all([
        supabase.from('blogger_questionnaires').select('*').eq('completed', true).eq('moderation_status', 'approved'),
        supabase.from('profiles').select('user_id, name').eq('role', 'seller'),
      ]);

      // Get approved blogger IDs to filter profiles
      const approvedUserIds = (questionnaires || []).map((q: any) => q.user_id);
      if (approvedUserIds.length === 0) return [];

      const [{ data: bloggers }, { data: allDeals }, { data: allReviews }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'blogger').in('user_id', approvedUserIds).order('trust_score', { ascending: false }),
        supabase.from('deals').select('*').in('blogger_id', approvedUserIds),
        supabase.from('reviews').select('*').in('target_id', approvedUserIds),
      ]);

      const profileMap: Record<string, string> = {};
      (sellerProfiles || []).forEach(p => { profileMap[p.user_id] = p.name; });

      const questionnaireMap: Record<string, any> = {};
      (questionnaires || []).forEach((q: any) => { questionnaireMap[q.user_id] = q; });

      return (bloggers || []).map(b => {
        const q = questionnaireMap[b.user_id] || null;
        const { stats, latestReviews } = computeStats(b, allDeals || [], allReviews || [], profileMap, q);

        // Use questionnaire data to enrich profile
        const totalSubs = q?.social_platforms
          ? Object.values(q.social_platforms as Record<string, any>).reduce((sum: number, p: any) => sum + (p?.subscribers || 0), 0)
          : b.subscribers_count || 0;

        return {
          id: b.id,
          user_id: b.user_id,
          name: q?.full_name || b.name || 'Без имени',
          avatar_url: b.avatar_url,
          niche: b.niche,
          subscribers_count: totalSubs,
          trust_score: b.trust_score || 0,
          content_formats: q?.content_types || b.content_formats,
          telegram_id: b.telegram_id,
          bio: q?.additional_info || b.bio,
          platforms: q?.social_platforms || b.platforms,
          stats,
          latestReviews,
          // Extra questionnaire fields for filtering
          questionnaire: q ? {
            pricing_type: q.pricing_type || '',
            review_type: q.review_type || '',
            activity_level: q.activity_level || '',
            audience_age: q.audience_age || '',
            audience_geo: q.audience_geo || '',
            purchasing_power: q.purchasing_power || '',
            work_style: q.work_style || '',
            deals_experience: q.deals_experience || '',
            content_style: q.content_style || [],
            excluded_categories: q.excluded_categories || [],
            full_name: q.full_name || '',
            age: q.age,
            country: q.country || '',
            city: q.city || '',
            audience_gender_male: q.audience_gender_male ?? 50,
            has_children: q.has_children ?? false,
            children_ages: q.children_ages || '',
            has_partner: q.has_partner ?? false,
            motivation: q.motivation || [],
            self_reliability: q.self_reliability ?? 3,
            self_speed: q.self_speed ?? 3,
            self_quality: q.self_quality ?? 3,
            sample_review: q.sample_review || '',
            best_video_url: q.best_video_url || '',
            portfolio_videos: q.portfolio_videos || [],
            portfolio_photos: q.portfolio_photos || [],
            content_examples: q.content_examples || [],
            avg_shorts_views: q.avg_shorts_views ?? 0,
            avg_reels_views: q.avg_reels_views ?? 0,
            avg_stories_views: q.avg_stories_views ?? 0,
            avg_video_views: q.avg_video_views ?? 0,
            avg_post_views: q.avg_post_views ?? 0,
            does_video: q.does_video ?? false,
            does_photo: q.does_photo ?? false,
            speed_days: q.speed_days,
            had_delays: q.had_delays ?? false,
            reliability_index: q.reliability_index ?? 0,
            speed_index: q.speed_index ?? 0,
            quality_index: q.quality_index ?? 0,
            discipline_index: q.discipline_index ?? 0,
            completion_probability: q.completion_probability ?? 0,
            additional_info: q.additional_info || '',
          } : null,
        } as EnrichedBlogger;
      });
    },
    enabled,
  });
}
