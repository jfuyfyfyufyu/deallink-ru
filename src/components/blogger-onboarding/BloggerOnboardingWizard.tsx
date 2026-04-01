import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { QuestionnaireData, defaultQuestionnaire, STEP_TITLES } from './types';
import StepBasicInfo from './steps/StepBasicInfo';
import StepSocials from './steps/StepSocials';
import StepAnalytics from './steps/StepAnalytics';
import StepAudience from './steps/StepAudience';
import StepExperience from './steps/StepExperience';
import StepWorkConditions from './steps/StepWorkConditions';
import StepAbout from './steps/StepAbout';
import StepConfirmation from './steps/StepConfirmation';

interface Props {
  onComplete: () => void;
}

const BloggerOnboardingWizard = ({ onComplete }: Props) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuestionnaireData>({ ...defaultQuestionnaire });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const totalSteps = STEP_TITLES.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // Load existing questionnaire
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: q } = await supabase
        .from('blogger_questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (q) {
        setData(prev => ({
          ...prev,
          ...q,
          social_platforms: (q.social_platforms as any) || {},
          content_examples: (q.content_examples as string[]) || [],
          content_types: (q.content_types as string[]) || [],
          content_style: (q.content_style as string[]) || [],
          worked_marketplaces: (q.worked_marketplaces as string[]) || [],
          excluded_categories: (q.excluded_categories as string[]) || [],
          motivation: (q.motivation as string[]) || [],
          portfolio_videos: (q.portfolio_videos as string[]) || [],
          portfolio_photos: (q.portfolio_photos as string[]) || [],
        }));
        setStep(Math.max(0, (q.current_step || 1) - 1));
      }
      setLoading(false);
    })();
  }, [user]);

  const onChange = (partial: Partial<QuestionnaireData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const saveProgress = async (completed = false) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      current_step: step + 1,
      completed,
      full_name: data.full_name,
      age: data.age,
      country: data.country,
      city: data.city,
      social_platforms: data.social_platforms,
      avg_shorts_views: data.avg_shorts_views,
      avg_reels_views: data.avg_reels_views,
      avg_stories_views: data.avg_stories_views,
      avg_video_views: data.avg_video_views,
      avg_post_views: data.avg_post_views,
      best_video_url: data.best_video_url,
      content_examples: data.content_examples,
      views_trend: data.views_trend,
      audience_gender_male: data.audience_gender_male,
      audience_age: data.audience_age,
      audience_geo: data.audience_geo,
      purchasing_power: data.purchasing_power,
      content_types: data.content_types,
      does_video: data.does_video,
      does_photo: data.does_photo,
      instagram_format: data.instagram_format,
      content_style: data.content_style,
      deals_experience: data.deals_experience,
      worked_marketplaces: data.worked_marketplaces,
      experience_results: data.experience_results,
      ready_to_buy: data.ready_to_buy,
      ready_for_tz: data.ready_for_tz,
      ready_for_wb_review: data.ready_for_wb_review,
      ready_for_photo_review: data.ready_for_photo_review,
      ready_for_video_review: data.ready_for_video_review,
      ready_for_shorts: data.ready_for_shorts,
      review_type: data.review_type,
      speed_days: data.speed_days,
      check_messages_frequency: data.check_messages_frequency,
      had_delays: data.had_delays,
      ready_for_reminders: data.ready_for_reminders,
      ready_for_stages: data.ready_for_stages,
      has_pvz_nearby: data.has_pvz_nearby,
      pickup_speed: data.pickup_speed,
      excluded_categories: data.excluded_categories,
      min_product_price: data.min_product_price,
      max_product_price: data.max_product_price,
      products_per_month: data.products_per_month,
      activity_level: data.activity_level,
      pricing_type: data.pricing_type,
      custom_price: data.custom_price,
      motivation: data.motivation,
      work_style: data.work_style,
      has_children: data.has_children,
      children_ages: data.children_ages,
      has_partner: data.has_partner,
      self_reliability: data.self_reliability,
      self_speed: data.self_speed,
      self_quality: data.self_quality,
      sample_review: data.sample_review,
      portfolio_videos: data.portfolio_videos,
      portfolio_photos: data.portfolio_photos,
      additional_info: data.additional_info,
      agreement_accepted: data.agreement_accepted,
    };

    const { error } = await supabase
      .from('blogger_questionnaires')
      .upsert(payload as any, { onConflict: 'user_id' });

    if (error) {
      toast({ title: 'Ошибка сохранения', description: error.message, variant: 'destructive' });
    }

    // Sync key fields to profiles
    if (completed || step >= 2) {
      const totalSubs = Object.values(data.social_platforms).reduce(
        (sum, p) => sum + (p?.subscribers || 0), 0
      );
      await supabase.from('profiles').update({
        name: data.full_name || profile?.name || '',
        subscribers_count: totalSubs,
        content_formats: data.content_types,
        bio: data.additional_info || undefined,
        platforms: data.social_platforms,
        niche: (data as any).niche || undefined,
      } as any).eq('user_id', user.id);
    }

    setSaving(false);
    return !error;
  };

  const next = async () => {
    if (step === totalSteps - 1) {
      if (!data.agreement_accepted) {
        toast({ title: 'Подтвердите обязательство', variant: 'destructive' });
        return;
      }
      const ok = await saveProgress(true);
      if (ok) {
        // Set moderation_status to pending
        await supabase
          .from('blogger_questionnaires')
          .update({ moderation_status: 'pending' } as any)
          .eq('user_id', user!.id);
        toast({ title: '🎉 Анкета отправлена на модерацию!' });
        onComplete();
      }
    } else {
      await saveProgress();
      setStep(s => s + 1);
    }
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return <StepBasicInfo data={data} onChange={onChange} avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />;
      case 1: return <StepSocials data={data} onChange={onChange} />;
      case 2: return <StepAnalytics data={data} onChange={onChange} />;
      case 3: return <StepAudience data={data} onChange={onChange} />;
      case 4: return <StepExperience data={data} onChange={onChange} />;
      case 5: return <StepWorkConditions data={data} onChange={onChange} />;
      case 6: return <StepAbout data={data} onChange={onChange} />;
      case 7: return <StepConfirmation data={data} onChange={onChange} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">Шаг {step + 1} из {totalSteps}</p>
          <p className="text-xs text-muted-foreground">{STEP_TITLES[step]}</p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">{STEP_TITLES[step]}</h2>
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={prev} disabled={step === 0 || saving} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" /> Назад
        </Button>
        <Button onClick={next} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {step === totalSteps - 1 ? (
            <><Check className="h-4 w-4 mr-1" /> Завершить</>
          ) : (
            <>Далее <ChevronRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BloggerOnboardingWizard;
