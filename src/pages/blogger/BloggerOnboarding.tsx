import DashboardLayout from '@/components/DashboardLayout';
import BloggerOnboardingWizard from '@/components/blogger-onboarding/BloggerOnboardingWizard';
import { useNavigate } from 'react-router-dom';

const BloggerOnboardingPage = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Заполнение анкеты">
      <BloggerOnboardingWizard onComplete={() => navigate('/blogger')} />
    </DashboardLayout>
  );
};

export default BloggerOnboardingPage;
