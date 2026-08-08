import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-white/5", className)} {...props} />;
}

export { Skeleton };

export function CourseCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl border border-white/5">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-4 flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

