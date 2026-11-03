import React, { Suspense } from 'react';
import type { NigeriaHeatMapProps } from './NigeriaHeatMap';

const NigeriaHeatMap = React.lazy(() =>
  import('./NigeriaHeatMap').then((module) => ({ default: module.NigeriaHeatMap }))
);

export const LazyNigeriaHeatMap: React.FC<NigeriaHeatMapProps> = (props) => (
  <Suspense
    fallback={
      <div className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 min-h-[420px] space-y-3">
        <div className="h-4 w-40 rounded bg-[#1C2E24] animate-pulse" />
        <div className="h-9 w-full rounded-xl bg-[#121F18] animate-pulse" />
        <div className="h-64 w-full rounded-xl bg-[#121F18] animate-shimmer" />
      </div>
    }
  >
    <NigeriaHeatMap {...props} />
  </Suspense>
);
