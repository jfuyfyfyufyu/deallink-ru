import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/** Skeleton for a product/deal card */
export const CardSkeleton = () => (
  <Card className="glass-card">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </CardContent>
  </Card>
);

/** Multiple card skeletons */
export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/** Full-page skeleton for lazy-loaded pages */
export const PageSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-md space-y-4 px-4">
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <div className="space-y-3 mt-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);
