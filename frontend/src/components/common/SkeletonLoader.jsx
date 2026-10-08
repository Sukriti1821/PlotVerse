/**
 * Skeleton card matching ListingCard aspect ratio and layout
 */
export const SpotCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm animate-pulse">
      {/* Image thumbnail skeleton */}
      <div className="h-56 w-full rounded-2xl bg-slate-200/80" />

      {/* Content skeleton */}
      <div className="mt-4 space-y-3 px-1">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="h-4 w-12 rounded-full bg-slate-200" />
        </div>

        <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
        <div className="h-4 w-1/2 rounded-md bg-slate-200" />

        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 rounded-lg bg-slate-100" />
          <div className="h-6 w-20 rounded-lg bg-slate-100" />
          <div className="h-6 w-14 rounded-lg bg-slate-100" />
        </div>

        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <div className="h-6 w-20 rounded-lg bg-slate-200" />
          <div className="h-9 w-24 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of spot skeletons
 */
export const SpotGridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SpotCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Full page skeleton for PlotDetails
 */
export const PlotDetailsSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3 mb-8">
        <div className="h-5 w-32 rounded-full bg-slate-200" />
        <div className="h-9 w-2/3 rounded-xl bg-slate-200" />
        <div className="h-4 w-1/3 rounded-md bg-slate-200" />
      </div>

      {/* Gallery Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="md:col-span-2 h-96 rounded-3xl bg-slate-200" />
        <div className="grid grid-rows-2 gap-4 h-96">
          <div className="rounded-2xl bg-slate-200" />
          <div className="rounded-2xl bg-slate-200" />
        </div>
      </div>

      {/* 2-Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-6 w-40 rounded-lg bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-4/6 rounded bg-slate-200" />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-6 w-32 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Booking Sidebar Skeleton */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 h-fit">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-12 rounded-2xl bg-slate-100" />
          <div className="h-12 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-12 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

/**
 * Booking card skeleton for MyBookings and OwnerBookings
 */
export const BookingCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse lg:p-8">
      <div className="grid gap-6 md:grid-cols-12 items-center">
        <div className="md:col-span-3 h-44 w-full rounded-2xl bg-slate-200" />
        <div className="md:col-span-6 space-y-3">
          <div className="flex gap-3">
            <div className="h-6 w-24 rounded-full bg-slate-200" />
            <div className="h-6 w-32 rounded-full bg-slate-100" />
          </div>
          <div className="h-7 w-3/4 rounded-lg bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="flex gap-3 pt-2">
            <div className="h-8 w-28 rounded-xl bg-slate-100" />
            <div className="h-8 w-36 rounded-xl bg-slate-100" />
          </div>
        </div>
        <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end space-y-4">
          <div className="h-8 w-28 rounded-lg bg-slate-200" />
          <div className="h-10 w-36 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export const BookingListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default {
  SpotCardSkeleton,
  SpotGridSkeleton,
  PlotDetailsSkeleton,
  BookingCardSkeleton,
  BookingListSkeleton,
};
