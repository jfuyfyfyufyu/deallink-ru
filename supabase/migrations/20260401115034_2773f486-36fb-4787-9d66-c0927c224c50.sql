
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'blogger');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role app_role NOT NULL DEFAULT 'blogger',
  telegram_id TEXT,
  avatar_url TEXT,
  trust_score NUMERIC DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  niche TEXT,
  content_formats TEXT[],
  bio TEXT,
  platforms JSONB,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- USER ROLES (separate table for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own role" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  marketplace_url TEXT,
  description TEXT,
  requirements TEXT,
  target_audience TEXT,
  min_views INTEGER DEFAULT 0,
  image_url TEXT,
  deadline_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by authenticated users" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sellers can insert own products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- ============================================
-- DEALS
-- ============================================
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  blogger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested',
  initiated_by TEXT DEFAULT 'seller',
  order_number TEXT,
  content_url TEXT,
  content_status TEXT,
  review_text TEXT,
  review_media_urls TEXT[],
  review_status TEXT,
  review_screenshot_url TEXT,
  social_links JSONB,
  payment_amount NUMERIC,
  payment_status TEXT,
  payment_note TEXT,
  payment_details JSONB,
  payment_proof_url TEXT,
  deadline_pickup TIMESTAMPTZ,
  deadline_content TIMESTAMPTZ,
  pickup_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view deals" ON public.deals FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = blogger_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create deals" ON public.deals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = blogger_id);
CREATE POLICY "Deal participants can update deals" ON public.deals FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = blogger_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DEAL MESSAGES
-- ============================================
CREATE TABLE public.deal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view messages" ON public.deal_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.seller_id = auth.uid() OR d.blogger_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "Deal participants can send messages" ON public.deal_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.seller_id = auth.uid() OR d.blogger_id = auth.uid())
  ));

-- ============================================
-- DEAL ARCHIVES
-- ============================================
CREATE TABLE public.deal_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

ALTER TABLE public.deal_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archives" ON public.deal_archives FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own archives" ON public.deal_archives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own archives" ON public.deal_archives FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- BLOGGER QUESTIONNAIRES
-- ============================================
CREATE TABLE public.blogger_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'draft',
  moderation_note TEXT,
  full_name TEXT,
  age INTEGER,
  country TEXT,
  city TEXT,
  social_platforms JSONB,
  avg_shorts_views INTEGER,
  avg_reels_views INTEGER,
  avg_stories_views INTEGER,
  avg_video_views INTEGER,
  avg_post_views INTEGER,
  best_video_url TEXT,
  content_examples TEXT[],
  views_trend TEXT,
  audience_gender_male INTEGER,
  audience_age TEXT,
  audience_geo TEXT,
  purchasing_power TEXT,
  content_types TEXT[],
  does_video BOOLEAN DEFAULT false,
  does_photo BOOLEAN DEFAULT false,
  instagram_format TEXT,
  content_style TEXT[],
  deals_experience TEXT,
  worked_marketplaces TEXT[],
  experience_results TEXT,
  ready_to_buy BOOLEAN DEFAULT false,
  ready_for_tz BOOLEAN DEFAULT false,
  ready_for_wb_review BOOLEAN DEFAULT false,
  ready_for_photo_review BOOLEAN DEFAULT false,
  ready_for_video_review BOOLEAN DEFAULT false,
  ready_for_shorts BOOLEAN DEFAULT false,
  review_type TEXT,
  speed_days INTEGER,
  check_messages_frequency TEXT,
  had_delays BOOLEAN DEFAULT false,
  ready_for_reminders BOOLEAN DEFAULT false,
  ready_for_stages BOOLEAN DEFAULT false,
  has_pvz_nearby BOOLEAN DEFAULT false,
  pickup_speed TEXT,
  excluded_categories TEXT[],
  min_product_price INTEGER,
  max_product_price INTEGER,
  products_per_month INTEGER,
  activity_level TEXT,
  pricing_type TEXT,
  custom_price INTEGER,
  motivation TEXT[],
  work_style TEXT,
  has_children BOOLEAN DEFAULT false,
  children_ages TEXT,
  has_partner BOOLEAN DEFAULT false,
  self_reliability INTEGER,
  self_speed INTEGER,
  self_quality INTEGER,
  sample_review TEXT,
  portfolio_videos TEXT[],
  portfolio_photos TEXT[],
  additional_info TEXT,
  agreement_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blogger_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questionnaires are viewable by authenticated" ON public.blogger_questionnaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own questionnaire" ON public.blogger_questionnaires FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questionnaire" ON public.blogger_questionnaires FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by authenticated" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON public.blogger_questionnaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'blogger');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'blogger');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proofs');
CREATE POLICY "Users can update own proofs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'proofs');

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
