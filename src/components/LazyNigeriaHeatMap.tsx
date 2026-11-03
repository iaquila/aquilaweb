import React, { Suspense } from 'react';
import type { NigeriaHeatMapProps } from './NigeriaHeatMap';
import { Skeleton } from './Skeleton';

const NigeriaHeatMap = React.lazy(() =>
  import('./NigeriaHeatMap').then((module) => ({ default: module.NigeriaHeatMap }))
);

export const LazyNigeriaHeatMap: React.FC<NigeriaHeatMapProps> = (props) => (
  <Suspense
    fallback={
      <div className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 min-h-[420px] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-3 w-28" />
            <Skeleton variant="text" className="h-5 w-48" />
            <Skeleton variant="text" className="h-3 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rect" className="h-8 w-20" />
            <Skeleton variant="rect" className="h-8 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" className="h-8 w-24" />
          <Skeleton variant="rect" className="h-8 w-28" />
          <Skeleton variant="rect" className="h-8 w-32" />
        </div>
        <Skeleton variant="rect" className="h-60 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton variant="rect" className="h-12" />
          <Skeleton variant="rect" className="h-12" />
          <Skeleton variant="rect" className="h-12" />
        </div>
      </div>
    }
  >
    <NigeriaHeatMap {...props} />
  </Suspense>
);
