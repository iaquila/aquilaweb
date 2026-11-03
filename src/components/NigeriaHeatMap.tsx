import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  ChevronRight,
  Sparkles,
  Globe,
  Flame,
  Search,
  X,
  BarChart3,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../store';
import { PARTY_COLORS, TOTAL_LGAS, TOTAL_POLLING_UNITS } from '../constants';
import type { DataSource } from '../types';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  NIGERIA_MAP_VIEWBOX,
  NIGERIA_RIVERS,
  NIGERIA_STATE_GEOMETRIES,
} from '../data/nigeriaMapData';
import {
  NIGERIA_LGA_GEOMETRIES,
  getLgaGeometriesForState,
} from '../data/nigeriaLgaMapData';
import { POLLING_UNITS } from '../data/mockData';

export type GeoLevel = 'state' | 'lga';
export type MapHeatMode = 'party' | 'coverage';

type ViewBox = { x: number; y: number; width: number; height: number };

const parseViewBox = (value: string): ViewBox => {
  const [x, y, width, height] = value.split(' ').map(Number);
  return { x, y, width, height };
};

const viewBoxToString = (value: ViewBox) =>
  `${value.x.toFixed(2)} ${value.y.toFixed(2)} ${value.width.toFixed(2)} ${value.height.toFixed(2)}`;

const MIN_ZOOM_SCALE = 8;

export interface NigeriaHeatMapProps {
  compact?: boolean;
  className?: string;
  dataSource?: DataSource;
}

export type LgaCollation = {
  id: string;
  name: string;
  state: string;
  totalPus: number;
  baseCollated: number;
  totalVotes: number;
  reportingPct: number;
  leadingParty: 'CPA' | 'DPP' | 'PL' | 'PPNN';
  leadingCandidate: string;
  leadingPct: string;
  margin: string;
  shares: Array<{ party: 'CPA' | 'DPP' | 'PL' | 'PPNN'; votes: number; pct: number }>;
};

export type StateCollation = {
  id: string;
  name: string;
  zone: string;
  code: string;
  lgaCount: number;
  totalPus: number;
  baseCollated: number;
  totalVotes: number;
  reportingPct: number;
  leadingParty: 'CPA' | 'DPP' | 'PL' | 'PPNN';
  leadingCandidate: string;
  leadingPct: string;
  margin: string;
  shares: Array<{ party: 'CPA' | 'DPP' | 'PL' | 'PPNN'; votes: number; pct: number }>;
};

// Sequential reporting-coverage ramp
const COVERAGE_RAMP = [
  '#092618',
  '#0E3E26',
  '#135C38',
  '#197E4D',
  '#22A465',
  '#2ECC80',
  '#48E59B',
];

export const NigeriaHeatMap: React.FC<NigeriaHeatMapProps> = ({
  compact = false,
  className = '',
  dataSource = 'OBSERVED',
}) => {
  const { results, setActiveTab, setSelectedStateFilter } = useAppStore();

  const [geoLevel, setGeoLevel] = useState<GeoLevel>('state');
  const [mapHeatMode, setMapHeatMode] = useState<MapHeatMode>('party');
  const [activeLgaState, setActiveLgaState] = useState<string>('Lagos');
  const [selectedMapStateId, setSelectedMapStateId] = useState<string>('state-lagos');
  const [selectedMapLgaId, setSelectedMapLgaId] = useState<string>('lga-lagos-ikeja');
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [hoveredLgaId, setHoveredLgaId] = useState<string | null>(null);
  const [showLgaLabels, setShowLgaLabels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectModalUnit, setInspectModalUnit] = useState<LgaCollation | StateCollation | null>(null);
  const [viewBoxOverride, setViewBoxOverride] = useState<ViewBox | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startViewBox: ViewBox;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startMidpoint: { x: number; y: number };
    startViewBox: ViewBox;
  } | null>(null);
  const suppressClickRef = useRef(false);

  useModalA11y({
    isOpen: !!inspectModalUnit,
    onClose: () => setInspectModalUnit(null),
  });

  // ---------------------------------------------------------------------------
  // Aggregate Comprehensive 37-State Baseline LGA Data (Official 774 Canonical LGAs)
  // ---------------------------------------------------------------------------
  const lgaHeatmapData: LgaCollation[] = useMemo(() => {
    const primaryHubOverrides: Record<
      string,
      { totalPus: number; baseCollated: number; baseVotes: Record<'CPA' | 'DPP' | 'PL' | 'PPNN', number> }
    > = {
      'ikeja': { totalPus: 450, baseCollated: 412, baseVotes: { CPA: 42350, DPP: 28140, PL: 21980, PPNN: 3200 } },
      'lagos mainland': { totalPus: 380, baseCollated: 345, baseVotes: { CPA: 27800, DPP: 35900, PL: 18450, PPNN: 2800 } },
      'alimosho': { totalPus: 620, baseCollated: 540, baseVotes: { CPA: 41200, DPP: 22400, PL: 53100, PPNN: 4600 } },
      'eti-osa': { totalPus: 340, baseCollated: 298, baseVotes: { CPA: 24600, DPP: 14200, PL: 39800, PPNN: 2100 } },
      'surulere': { totalPus: 395, baseCollated: 360, baseVotes: { CPA: 36400, DPP: 19800, PL: 31200, PPNN: 3100 } },
      'kosofe': { totalPus: 310, baseCollated: 275, baseVotes: { CPA: 30100, DPP: 24500, PL: 19400, PPNN: 2950 } },
      'fagge': { totalPus: 320, baseCollated: 292, baseVotes: { CPA: 18400, DPP: 9600, PL: 3100, PPNN: 58700 } },
      'tarauni': { totalPus: 280, baseCollated: 241, baseVotes: { CPA: 15200, DPP: 8100, PL: 2600, PPNN: 46300 } },
      'nasarawa': { totalPus: 350, baseCollated: 305, baseVotes: { CPA: 22100, DPP: 11400, PL: 3900, PPNN: 54200 } },
      'obio-akpor': { totalPus: 420, baseCollated: 381, baseVotes: { CPA: 19800, DPP: 47200, PL: 24600, PPNN: 1800 } },
      'port harcourt': { totalPus: 300, baseCollated: 256, baseVotes: { CPA: 16400, DPP: 28900, PL: 24700, PPNN: 1400 } },
      'municipal': { totalPus: 380, baseCollated: 340, baseVotes: { CPA: 22100, DPP: 18400, PL: 34900, PPNN: 3200 } },
      'bwari': { totalPus: 220, baseCollated: 186, baseVotes: { CPA: 9800, DPP: 11200, PL: 28600, PPNN: 1100 } },
      'kaduna north': { totalPus: 340, baseCollated: 295, baseVotes: { CPA: 38200, DPP: 29400, PL: 12100, PPNN: 11200 } },
      'kaduna south': { totalPus: 310, baseCollated: 260, baseVotes: { CPA: 31500, DPP: 33800, PL: 15400, PPNN: 8900 } },
      'ibadan north': { totalPus: 410, baseCollated: 375, baseVotes: { CPA: 39100, DPP: 36200, PL: 18700, PPNN: 2400 } },
      'ibadan south-west': { totalPus: 360, baseCollated: 318, baseVotes: { CPA: 34800, DPP: 31200, PL: 16900, PPNN: 1900 } },
      'enugu north': { totalPus: 290, baseCollated: 270, baseVotes: { CPA: 4200, DPP: 12800, PL: 58400, PPNN: 800 } },
      'nsukka': { totalPus: 320, baseCollated: 285, baseVotes: { CPA: 5100, DPP: 14200, PL: 61200, PPNN: 950 } },
      'maiduguri': { totalPus: 380, baseCollated: 340, baseVotes: { CPA: 54200, DPP: 19800, PL: 4100, PPNN: 8300 } },
      'jere': { totalPus: 290, baseCollated: 245, baseVotes: { CPA: 41800, DPP: 16200, PL: 3200, PPNN: 6400 } },
    };

    const allBases: Array<{
      id: string;
      name: string;
      rawName: string;
      state: string;
      totalPus: number;
      baseCollated: number;
      baseVotes: Record<'CPA' | 'DPP' | 'PL' | 'PPNN', number>;
    }> = [];

    const normalizeKey = (value: string) =>
      value
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const overrideByKey = Object.fromEntries(
      Object.entries(primaryHubOverrides).map(([key, value]) => [normalizeKey(key), value])
    );

    Object.values(NIGERIA_STATE_GEOMETRIES).forEach((geom) => {
      const stateLgas = getLgaGeometriesForState(geom.name);
      const zone = geom.zone;

      let defaultRatio: { CPA: number; DPP: number; PL: number; PPNN: number };
      if (zone === 'North West') {
        defaultRatio = { CPA: 0.44, DPP: 0.28, PL: 0.08, PPNN: 0.20 };
      } else if (zone === 'North East') {
        defaultRatio = { CPA: 0.48, DPP: 0.38, PL: 0.06, PPNN: 0.08 };
      } else if (zone === 'North Central') {
        defaultRatio = { CPA: 0.36, DPP: 0.34, PL: 0.25, PPNN: 0.05 };
      } else if (zone === 'South West') {
        defaultRatio = { CPA: 0.46, DPP: 0.24, PL: 0.27, PPNN: 0.03 };
      } else if (zone === 'South East') {
        defaultRatio = { CPA: 0.08, DPP: 0.22, PL: 0.68, PPNN: 0.02 };
      } else {
        // South South
        defaultRatio = { CPA: 0.28, DPP: 0.42, PL: 0.27, PPNN: 0.03 };
      }

      stateLgas.forEach((lgaGeom) => {
        const cleanName = lgaGeom.name.trim();
        const key = normalizeKey(cleanName);
        const override =
          overrideByKey[key] ||
          overrideByKey[key.replace(/ area council$/, '')] ||
          overrideByKey[key.replace(/ council$/, '')];
        const displayName =
          cleanName.endsWith('LGA') || cleanName.endsWith('Council')
            ? cleanName
            : `${cleanName} LGA`;

        if (override) {
          allBases.push({
            id: lgaGeom.id,
            name: displayName,
            rawName: cleanName,
            state: geom.name,
            totalPus: override.totalPus,
            baseCollated: override.baseCollated,
            baseVotes: { ...override.baseVotes },
          });
          return;
        }

        // Deterministic pseudo-random seed per state + LGA
        const seed = (geom.name + '_' + cleanName)
          .split('')
          .reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0);
        const hash = Math.abs(seed);

        const pus = 175 + (hash % 210);
        const collatedPct = 0.85 + ((hash % 12) / 100);
        const collated = Math.round(pus * collatedPct);
        const totalV = collated * (110 + (hash % 30));

        // Deterministic minor margin variation (+/- 3%)
        const deltaCPA = ((hash % 7) - 3) / 100;
        const deltaDPP = (((hash >> 2) % 7) - 3) / 100;
        const ratioCPA = Math.max(0.04, defaultRatio.CPA + deltaCPA);
        const ratioDPP = Math.max(0.04, defaultRatio.DPP + deltaDPP);
        const rem = 1 - (ratioCPA + ratioDPP);
        const ratioPL = Math.max(0.02, (defaultRatio.PL * rem) / (defaultRatio.PL + defaultRatio.PPNN));
        const ratioPPNN = Math.max(0.02, 1 - (ratioCPA + ratioDPP + ratioPL));

        allBases.push({
          id: lgaGeom.id,
          name: displayName,
          rawName: cleanName,
          state: geom.name,
          totalPus: pus,
          baseCollated: collated,
          baseVotes: {
            CPA: Math.round(totalV * ratioCPA),
            DPP: Math.round(totalV * ratioDPP),
            PL: Math.round(totalV * ratioPL),
            PPNN: Math.round(totalV * ratioPPNN),
          },
        });
      });
    });

    const rawPusTotal = allBases.reduce((acc, base) => acc + base.totalPus, 0);
    const pusScale = rawPusTotal > 0 ? TOTAL_POLLING_UNITS / rawPusTotal : 1;
    let remainingPus = TOTAL_POLLING_UNITS;
    allBases.forEach((base, index) => {
      if (index === allBases.length - 1) {
        base.totalPus = Math.max(1, remainingPus);
      } else {
        base.totalPus = Math.max(1, Math.round(base.totalPus * pusScale));
        remainingPus -= base.totalPus;
      }
      base.baseCollated = Math.min(
        base.totalPus,
        Math.round(base.baseCollated * pusScale)
      );
    });

    const candidateNames: Record<string, string> = {
      CPA: 'Ahmed Okwute',
      DPP: 'Abubakar Matthew',
      PL: 'Peter Muhammed',
      PPNN: 'Borro Nassiru',
    };

    const normalizeLgaKey = (state: string, value: string) => {
      let key = normalizeKey(value)
        .replace(/\b(lga|area council|council)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (state === 'FCT' && key === 'abuja municipal') key = 'municipal';
      return key;
    };

    const puById = new Map(POLLING_UNITS.map((pu) => [pu.id, pu]));
    const resultsByLga = new Map<
      string,
      { votes: Record<string, number>; count: number }
    >();

    results
      .filter((r) => r.status === 'PUBLISHED' || r.status === 'CORRECTED')
      .forEach((r) => {
        const sourceVotes = dataSource === 'INEC' ? r.candidateVotesInec : r.candidateVotes;
        if (dataSource === 'INEC' && !Object.values(sourceVotes ?? {}).some((v) => v > 0)) {
          return;
        }
        const pu = puById.get(r.pollingUnitId);
        if (!pu) return;

        const key = `${normalizeKey(pu.stateName)}|${normalizeLgaKey(pu.stateName, pu.lgaName)}`;
        const entry = resultsByLga.get(key) ?? { votes: {}, count: 0 };
        Object.entries(sourceVotes ?? {}).forEach(([candId, count]) => {
          if (typeof count === 'number' && Number.isFinite(count)) {
            entry.votes[candId] = (entry.votes[candId] ?? 0) + count;
          }
        });
        entry.count += 1;
        resultsByLga.set(key, entry);
      });

    return allBases.map((base) => {
      const matched = resultsByLga.get(
        `${normalizeKey(base.state)}|${normalizeLgaKey(base.state, base.rawName)}`
      );

      const dynamicVotes = { ...base.baseVotes };
      const candMap: Record<string, keyof typeof dynamicVotes> = {
        cand1: 'CPA',
        cand2: 'DPP',
        cand3: 'PL',
        cand4: 'PPNN',
      };
      if (matched) {
        Object.entries(matched.votes).forEach(([candId, count]) => {
          const party = candMap[candId];
          if (party && party in dynamicVotes) {
            dynamicVotes[party] += count;
          }
        });
      }

      const collated = Math.min(
        base.totalPus,
        base.baseCollated + (matched?.count ?? 0)
      );

      const totalVotes =
        (dynamicVotes.CPA || 0) +
        (dynamicVotes.DPP || 0) +
        (dynamicVotes.PL || 0) +
        (dynamicVotes.PPNN || 0);

      const shares = (
        Object.entries(dynamicVotes) as Array<[LgaCollation['leadingParty'], number]>
      )
        .map(([party, votes]) => ({
          party,
          votes,
          pct: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      const leader = shares[0]!;
      const runnerUp = shares[1]!;
      const marginPct = (leader.pct - runnerUp.pct).toFixed(1);

      return {
        id: base.id,
        name: base.name,
        state: base.state,
        totalPus: base.totalPus,
        baseCollated: collated,
        totalVotes,
        reportingPct: Math.min(
          100,
          Number(((collated / base.totalPus) * 100).toFixed(0))
        ),
        leadingParty: leader.party,
        leadingCandidate: candidateNames[leader.party] ?? leader.party,
        leadingPct: leader.pct.toFixed(1),
        margin: `+${marginPct} pts ahead`,
        shares,
      };
    });
  }, [results, dataSource]);

  // ---------------------------------------------------------------------------
  // Derived State Collation for All 37 Nigerian States and FCT
  // ---------------------------------------------------------------------------
  const stateHeatmapData: StateCollation[] = useMemo(() => {
    const candidateNames: Record<string, string> = {
      CPA: 'Ahmed Okwute',
      DPP: 'Abubakuar Matthew',
      PL: 'Peter Muhammed',
      PPNN: 'Borro Nassiru',
    };

    const byState = new Map<
      string,
      {
        totalPus: number;
        baseCollated: number;
        votes: Record<'CPA' | 'DPP' | 'PL' | 'PPNN', number>;
        lgaCount: number;
      }
    >();

    lgaHeatmapData.forEach((lga) => {
      const entry = byState.get(lga.state) ?? {
        totalPus: 0,
        baseCollated: 0,
        votes: { CPA: 0, DPP: 0, PL: 0, PPNN: 0 },
        lgaCount: 0,
      };
      entry.totalPus += lga.totalPus;
      entry.baseCollated += lga.baseCollated;
      (Object.keys(entry.votes) as Array<'CPA' | 'DPP' | 'PL' | 'PPNN'>).forEach((p) => {
        const share = lga.shares.find((s) => s.party === p);
        entry.votes[p] += share?.votes ?? 0;
      });
      entry.lgaCount += 1;
      byState.set(lga.state, entry);
    });

    return [...byState.entries()]
      .map(([state, entry]) => {
        const totalVotes =
          entry.votes.CPA + entry.votes.DPP + entry.votes.PL + entry.votes.PPNN;
        const shares = (
          Object.entries(entry.votes) as Array<[StateCollation['leadingParty'], number]>
        )
          .map(([party, votes]) => ({
            party,
            votes,
            pct: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
          }))
          .sort((a, b) => b.votes - a.votes);
        const leader = shares[0]!;
        const runnerUp = shares[1]!;
        const stateKey = `state-${state.toLowerCase().replace(/\s+/g, '-')}`;
        const geom = NIGERIA_STATE_GEOMETRIES[stateKey];

        return {
          id: stateKey,
          name: state,
          zone: geom?.zone ?? 'Federation Zone',
          code: geom?.code ?? state.substring(0, 3).toUpperCase(),
          lgaCount: entry.lgaCount,
          totalPus: entry.totalPus,
          baseCollated: entry.baseCollated,
          totalVotes,
          reportingPct:
            entry.totalPus > 0
              ? Number(Math.min(100, (entry.baseCollated / entry.totalPus) * 100).toFixed(0))
              : 0,
          leadingParty: leader.party,
          leadingCandidate: candidateNames[leader.party] ?? leader.party,
          leadingPct: leader.pct.toFixed(1),
          margin: `+${(leader.pct - runnerUp.pct).toFixed(1)} pts lead`,
          shares,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lgaHeatmapData]);

  const statesInView = useMemo(() => {
    return stateHeatmapData.map((s) => s.name);
  }, [stateHeatmapData]);

  const effectiveLgaState = activeLgaState || statesInView[0] || 'Lagos';

  const mapLgas = useMemo(() => {
    return lgaHeatmapData.filter(
      (l) => l.state.toLowerCase() === effectiveLgaState.toLowerCase()
    );
  }, [lgaHeatmapData, effectiveLgaState]);

  const lgaViewBox = useMemo(() => {
    const geoms = mapLgas
      .map((l) => NIGERIA_LGA_GEOMETRIES[l.id])
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
    if (!geoms.length) return NIGERIA_MAP_VIEWBOX;

    const pad = 12;
    const minX = Math.min(...geoms.map((g) => g.bounds.minX)) - pad;
    const minY = Math.min(...geoms.map((g) => g.bounds.minY)) - pad;
    const maxX = Math.max(...geoms.map((g) => g.bounds.maxX)) + pad;
    const maxY = Math.max(...geoms.map((g) => g.bounds.maxY)) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [mapLgas]);

  const mapAspect = useMemo(() => {
    if (geoLevel !== 'lga') return 16 / 11;
    const parts = lgaViewBox.split(' ').map(Number);
    return parts.length === 4 && parts[3] > 0 ? parts[2] / parts[3] : 16 / 11;
  }, [geoLevel, lgaViewBox]);

  const baseViewBox = useMemo(
    () => parseViewBox(geoLevel === 'state' ? NIGERIA_MAP_VIEWBOX : lgaViewBox),
    [geoLevel, lgaViewBox]
  );
  const activeViewBox = viewBoxOverride ?? baseViewBox;
  const activeViewBoxString = viewBoxToString(activeViewBox);
  const isZoomed = activeViewBox.width < baseViewBox.width - 0.5;
  const canZoomIn = activeViewBox.width > baseViewBox.width / MIN_ZOOM_SCALE + 0.5;
  const canZoomOut = isZoomed;

  const clampViewBox = useCallback(
    (next: ViewBox): ViewBox => {
      const minWidth = baseViewBox.width / MIN_ZOOM_SCALE;
      const width = Math.min(baseViewBox.width, Math.max(minWidth, next.width));
      const height = width * (baseViewBox.height / baseViewBox.width);
      return {
        x: Math.min(
          Math.max(next.x, baseViewBox.x),
          baseViewBox.x + baseViewBox.width - width
        ),
        y: Math.min(
          Math.max(next.y, baseViewBox.y),
          baseViewBox.y + baseViewBox.height - height
        ),
        width,
        height,
      };
    },
    [baseViewBox]
  );

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const rect = mapContainerRef.current?.getBoundingClientRect();
      const ratioX =
        clientX !== undefined && rect ? (clientX - rect.left) / rect.width : 0.5;
      const ratioY =
        clientY !== undefined && rect ? (clientY - rect.top) / rect.height : 0.5;

      setViewBoxOverride((currentOverride) => {
        const current = currentOverride ?? baseViewBox;
        const width = current.width / factor;
        const height = width * (baseViewBox.height / baseViewBox.width);
        return clampViewBox({
          x: current.x + ratioX * current.width - ratioX * width,
          y: current.y + ratioY * current.height - ratioY * height,
          width,
          height,
        });
      });
    },
    [baseViewBox, clampViewBox]
  );

  useEffect(() => {
    setViewBoxOverride(null);
    dragRef.current = null;
    pinchRef.current = null;
    pointersRef.current.clear();
    suppressClickRef.current = false;
  }, [baseViewBox]);

  const handleMapPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('[data-map-controls]')) {
      return;
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    suppressClickRef.current = false;

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startViewBox: viewBoxOverride ?? baseViewBox,
        moved: false,
      };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        startDistance: Math.hypot(a.x - b.x, a.y - b.y),
        startMidpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startViewBox: viewBoxOverride ?? baseViewBox,
      };
      dragRef.current = null;
      const el = mapContainerRef.current;
      if (el) {
        Array.from(pointersRef.current.keys()).forEach((pointerId) => {
          if (!el.hasPointerCapture(pointerId)) el.setPointerCapture(pointerId);
        });
      }
    }
  };

  const handleMapPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      event.preventDefault();
      const [a, b] = Array.from(pointersRef.current.values());
      const pinch = pinchRef.current;
      const currentDistance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = pinch.startDistance > 0 ? currentDistance / pinch.startDistance : 1;
      const currentMidpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const start = pinch.startViewBox;
      const startMidX =
        start.x + ((pinch.startMidpoint.x - rect.left) / rect.width) * start.width;
      const startMidY =
        start.y + ((pinch.startMidpoint.y - rect.top) / rect.height) * start.height;
      const width = start.width / factor;
      const height = width * (baseViewBox.height / baseViewBox.width);

      setViewBoxOverride(
        clampViewBox({
          x: startMidX - ((currentMidpoint.x - rect.left) / rect.width) * width,
          y: startMidY - ((currentMidpoint.y - rect.top) / rect.height) * height,
          width,
          height,
        })
      );
      suppressClickRef.current = true;
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (!drag.moved) return;

    event.preventDefault();
    const el = mapContainerRef.current;
    if (el && !el.hasPointerCapture(event.pointerId)) {
      el.setPointerCapture(event.pointerId);
    }
    setViewBoxOverride(
      clampViewBox({
        x: drag.startViewBox.x - (dx / rect.width) * drag.startViewBox.width,
        y: drag.startViewBox.y - (dy / rect.height) * drag.startViewBox.height,
        width: drag.startViewBox.width,
        height: drag.startViewBox.height,
      })
    );
    suppressClickRef.current = true;
  };

  const handleMapPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (dragRef.current?.pointerId === event.pointerId) {
      if (!dragRef.current.moved) suppressClickRef.current = false;
      dragRef.current = null;
    }
    if (pointersRef.current.size < 2) pinchRef.current = null;
    const el = mapContainerRef.current;
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  };

  const handleMapPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    if (pointersRef.current.size < 2) pinchRef.current = null;
    suppressClickRef.current = false;
    const el = mapContainerRef.current;
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  };

  const handleMapClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[data-map-controls]')) {
      return;
    }
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  const activeSelectedLga = useMemo(() => {
    return (
      lgaHeatmapData.find((l) => l.id === selectedMapLgaId) ??
      mapLgas[0] ??
      lgaHeatmapData[0]!
    );
  }, [lgaHeatmapData, selectedMapLgaId, mapLgas]);

  const activeSelectedState = useMemo(() => {
    return (
      stateHeatmapData.find((s) => s.id === selectedMapStateId) ??
      stateHeatmapData[0]!
    );
  }, [stateHeatmapData, selectedMapStateId]);


  const totalCollatedAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.baseCollated, 0);
  }, [lgaHeatmapData]);

  const totalPusAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.totalPus, 0);
  }, [lgaHeatmapData]);

  const totalVotesAcrossAll = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.totalVotes, 0);
  }, [lgaHeatmapData]);

  const scopeCollated =
    geoLevel === 'state'
      ? totalCollatedAcrossLgas
      : mapLgas.reduce((acc, lga) => acc + lga.baseCollated, 0);
  const scopePus =
    geoLevel === 'state'
      ? totalPusAcrossLgas
      : mapLgas.reduce((acc, lga) => acc + lga.totalPus, 0);
  const scopeVotes =
    geoLevel === 'state'
      ? totalVotesAcrossAll
      : mapLgas.reduce((acc, lga) => acc + lga.totalVotes, 0);
  const scopeReportingPct =
    scopePus > 0 ? Math.round((scopeCollated / scopePus) * 100) : 0;

  const coverageValues =
    geoLevel === 'state'
      ? stateHeatmapData.map((state) => state.reportingPct)
      : mapLgas.map((lga) => lga.reportingPct);
  const coverageMin = coverageValues.length ? Math.min(...coverageValues) : 0;
  const coverageMax = coverageValues.length ? Math.max(...coverageValues) : 100;

  // Fill color calculation based on display mode
  const getFillColor = (item: { leadingParty: 'CPA' | 'DPP' | 'PL' | 'PPNN'; reportingPct: number }) => {
    if (mapHeatMode === 'coverage') {
      const ratio =
        coverageMax > coverageMin
          ? (item.reportingPct - coverageMin) / (coverageMax - coverageMin)
          : 1;
      const idx = Math.min(
        COVERAGE_RAMP.length - 1,
        Math.max(0, Math.floor(ratio * COVERAGE_RAMP.length))
      );
      return COVERAGE_RAMP[idx]!;
    }
    return PARTY_COLORS[item.leadingParty] ?? '#10B981';
  };

  // Filtered list for search table in dossier view
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) {
      return geoLevel === 'state' ? stateHeatmapData : mapLgas;
    }
    const q = searchQuery.toLowerCase();
    if (geoLevel === 'state') {
      return stateHeatmapData.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
    }
    return lgaHeatmapData.filter(
      (l) => l.name.toLowerCase().includes(q) || l.state.toLowerCase().includes(q)
    );
  }, [geoLevel, stateHeatmapData, mapLgas, lgaHeatmapData, searchQuery]);

  // Seamless audit action linking to the Results view with PU search applied
  const handleAuditUnit = (unit: StateCollation | LgaCollation) => {
    setInspectModalUnit(null);
    const filterTerm = 'state' in unit
      ? unit.name.replace(/ LGA| Area Council/gi, '').trim()
      : unit.name;
    setSelectedStateFilter(filterTerm);
    setActiveTab('results');
  };

  const handleDrilldownLga = (stateName: string) => {
    setInspectModalUnit(null);
    setActiveLgaState(stateName);
    setGeoLevel('lga');
    const firstLga = lgaHeatmapData.find(
      (l) => l.state.toLowerCase() === stateName.toLowerCase()
    );
    if (firstLga) setSelectedMapLgaId(firstLga.id);
  };

  return (
    <div
      className={`rounded-2xl border border-[#1C2E24] bg-[#0E1712] shadow-xl overflow-hidden ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
      } ${className}`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* Map Header */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1C2E24]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#10B981]">
              {geoLevel === 'state'
                ? 'LIVE NATIONAL RESULTS'
                : `${effectiveLgaState.toUpperCase()} LOCAL GOVERNMENT RESULTS`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
            {geoLevel === 'state'
              ? 'National Presidential Results Map'
              : `${effectiveLgaState} Local Government Results`}
          </h2>
          <p className="text-xs text-[#718579]">
            {geoLevel === 'state'
              ? `All 36 states + FCT · ${TOTAL_LGAS} LGAs · ${totalCollatedAcrossLgas.toLocaleString()} of ${totalPusAcrossLgas.toLocaleString()} polling units reported`
              : `${mapLgas.length} LGAs · ${mapLgas.reduce(
                  (a, b) => a + b.baseCollated,
                  0
                )} of ${mapLgas.reduce((a, b) => a + b.totalPus, 0)} polling units reported`}
          </p>
        </div>

        {/* Action Controls: Geo Level Pills + Map Heat Mode Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* States vs LGAs Pill Group */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#070C09] border border-[#1C2E24]">
            <button
              onClick={() => setGeoLevel('state')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                geoLevel === 'state'
                  ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                  : 'text-[#718579] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>States ({stateHeatmapData.length})</span>
            </button>
            <button
              onClick={() => setGeoLevel('lga')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                geoLevel === 'lga'
                  ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                  : 'text-[#718579] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>LGAs ({mapLgas.length})</span>
            </button>
          </div>

          {/* Lead vs Coverage Mode Pill Group */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#070C09] border border-[#1C2E24]">
            <button
              onClick={() => setMapHeatMode('party')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mapHeatMode === 'party'
                  ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                  : 'text-[#718579] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Leading Party</span>
            </button>
            <button
              onClick={() => setMapHeatMode('coverage')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mapHeatMode === 'coverage'
                  ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                  : 'text-[#718579] hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Reporting Coverage</span>
            </button>
          </div>

          {geoLevel === 'lga' && (
            <button
              type="button"
              onClick={() => setShowLgaLabels((prev) => !prev)}
              aria-pressed={showLgaLabels}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                showLgaLabels
                  ? 'bg-[#10B981] text-black border-[#10B981]'
                  : 'bg-[#070C09] text-[#718579] border-[#1C2E24] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{showLgaLabels ? 'Hide labels' : 'Show labels'}</span>
            </button>
          )}

          {/* Overall Reporting Percentage Pill */}
          <div className="px-3 py-1 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-black text-[#10B981]">
            {scopeReportingPct}% REPORTED
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Map Quick Navigation (State & LGA Dropdowns + Search) */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 py-2.5 px-3 border-b border-[#1C2E24]/70 bg-[#080E0A]/80 rounded-xl my-2 text-xs">
        {/* State Alphabetical Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#0D1812] border border-[#1F3327] rounded-lg px-2.5 py-1.5 focus-within:border-emerald-500 transition shrink-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <label htmlFor="heatmap-state-select" className="text-[10px] font-bold uppercase tracking-wider text-[#718579] shrink-0">
            State:
          </label>
          <select
            id="heatmap-state-select"
            value={effectiveLgaState}
            onChange={(e) => {
              const selectedState = e.target.value;
              setActiveLgaState(selectedState);
              const stateItem = stateHeatmapData.find((s) => s.name === selectedState);
              if (stateItem) {
                setSelectedMapStateId(stateItem.id);
              }
              const firstLga = lgaHeatmapData.find((l) => l.state === selectedState);
              if (firstLga) {
                setSelectedMapLgaId(firstLga.id);
              }
            }}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
          >
            {statesInView.map((stName) => {
              const st = stateHeatmapData.find((s) => s.name === stName);
              return (
                <option key={stName} value={stName} className="bg-[#0E1712] text-white">
                  {stName} {st ? `(${st.leadingParty} lead · ${st.lgaCount} LGAs)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* LGA Alphabetical Dropdown (active when geoLevel === 'lga') */}
        {geoLevel === 'lga' && (
          <div className="flex items-center gap-1.5 bg-[#0D1812] border border-[#1F3327] rounded-lg px-2.5 py-1.5 focus-within:border-emerald-500 transition shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <label htmlFor="heatmap-lga-select" className="text-[10px] font-bold uppercase tracking-wider text-[#718579] shrink-0">
              LGA:
            </label>
            <select
              id="heatmap-lga-select"
              value={activeSelectedLga.id}
              onChange={(e) => {
                const lgaId = e.target.value;
                setSelectedMapLgaId(lgaId);
              }}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1 max-w-[210px] truncate"
            >
              {mapLgas
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((lga) => (
                  <option key={lga.id} value={lga.id} className="bg-[#0E1712] text-white">
                    {lga.name} ({lga.leadingParty} {lga.leadingPct}%)
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Quick Search Jump Input */}
        <div className="relative flex-1 min-w-[200px] max-w-full">
          <Search className="w-3.5 h-3.5 text-[#718579] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value;
              setSearchQuery(q);
              if (q.trim().length >= 2) {
                if (geoLevel === 'state') {
                  const matchedState = stateHeatmapData.find((s) =>
                    s.name.toLowerCase().includes(q.toLowerCase())
                  );
                  if (matchedState) setSelectedMapStateId(matchedState.id);
                } else {
                  const matchedInState = mapLgas.find((l) =>
                    l.name.toLowerCase().includes(q.toLowerCase())
                  );
                  if (matchedInState) {
                    setSelectedMapLgaId(matchedInState.id);
                  } else {
                    const anyMatch = lgaHeatmapData.find((l) =>
                      l.name.toLowerCase().includes(q.toLowerCase())
                    );
                    if (anyMatch) {
                      setActiveLgaState(anyMatch.state);
                      setSelectedMapLgaId(anyMatch.id);
                    }
                  }
                }
              }
            }}
            placeholder={
              geoLevel === 'state'
                ? 'Quick search 37 states...'
                : `Quick search ${effectiveLgaState} LGAs...`
            }
            className="w-full pl-8 pr-7 py-1.5 bg-[#0D1812] border border-[#1F3327] rounded-lg text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#718579] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Map Canvas Layout */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={
          compact
            ? 'mt-4 flex flex-col gap-4'
            : 'mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
        }
      >
        {/* SVG Map Canvas */}
        <div
          className={`${
            compact ? 'w-full' : 'lg:col-span-7'
          } rounded-2xl bg-[#07120B] border border-[#19482D]/50 p-4 relative overflow-hidden flex flex-col justify-between`}
        >
          {/* Top Canvas Telemetry Strip */}
          <div className="flex items-center justify-between text-[11px] text-[#A3E6C2] pb-2 border-b border-[#142D1E]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {geoLevel === 'state' ? '37 STATES REPORTING' : `${effectiveLgaState.toUpperCase()} LGAs`}
              </span>
              <span className="text-[#718579]">•</span>
              <span className="text-[#94A89D]">
                {mapHeatMode === 'party' ? 'Leading party' : 'Reporting coverage'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {mapHeatMode === 'party' ? (
                <div className="flex items-center gap-2">
                  {(['CPA', 'DPP', 'PL', 'PPNN'] as const).map((party) => (
                    <span
                      key={party}
                      className="flex items-center gap-1 text-[9px] font-bold text-[#94A89D]"
                    >
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: PARTY_COLORS[party] }}
                      />
                      {party}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#94A89D]">
                  <span>{Math.round(coverageMin)}%</span>
                  <span
                    className="h-2 w-16 rounded-sm"
                    style={{
                      background: `linear-gradient(to right, ${COVERAGE_RAMP.join(', ')})`,
                    }}
                  />
                  <span>{Math.round(coverageMax)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Map Container */}
          <div
            ref={mapContainerRef}
            className={`relative w-full flex items-center justify-center my-2 touch-none ${
              compact ? 'max-h-[340px]' : ''
            }`}
            style={{ aspectRatio: `${mapAspect}` }}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerUp}
            onPointerCancel={handleMapPointerCancel}
            onClickCapture={handleMapClickCapture}
          >
            <div
              data-map-controls
              role="group"
              aria-label="Map zoom controls"
              title="Drag to pan. Pinch or use the buttons to zoom."
              className="absolute right-2 top-2 z-20 flex flex-col gap-1"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => zoomAt(1.35)}
                disabled={!canZoomIn}
                aria-label="Zoom in"
                title="Zoom in"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1C2E24] bg-[#070C09]/90 text-[#94A89D] backdrop-blur transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => zoomAt(1 / 1.35)}
                disabled={!canZoomOut}
                aria-label="Zoom out"
                title="Zoom out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1C2E24] bg-[#070C09]/90 text-[#94A89D] backdrop-blur transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewBoxOverride(null)}
                disabled={!isZoomed}
                aria-label="Reset map zoom"
                title="Reset map zoom"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1C2E24] bg-[#070C09]/90 text-[#94A89D] backdrop-blur transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <svg
              viewBox={activeViewBoxString}
              role="region"
              aria-label="National Presidential Results Map of Nigeria"
              className="w-full h-full drop-shadow-2xl select-none"
            >
              <title>National Presidential Results Map</title>
              <desc>Interactive results map of Nigeria showing returns across all 36 states and FCT.</desc>
              <defs>
                <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {geoLevel === 'lga' ? (
                <g key="lga-layer">
                  {mapLgas.map((lga) => {
                    const geom = NIGERIA_LGA_GEOMETRIES[lga.id];
                    if (!geom) return null;
                    const isSelected = selectedMapLgaId === lga.id;
                    const isHovered = hoveredLgaId === lga.id;
                    const fillColor = getFillColor(lga);

                    return (
                      <g
                        key={lga.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${lga.name}: ${lga.leadingParty} leading, ${lga.reportingPct}% collated. Click to inspect.`}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedMapLgaId(lga.id);
                          setInspectModalUnit(lga);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedMapLgaId(lga.id);
                            setInspectModalUnit(lga);
                          }
                        }}
                        onMouseEnter={() => setHoveredLgaId(lga.id)}
                        onMouseLeave={() => setHoveredLgaId(null)}
                        className="cursor-pointer transition-all duration-150 focus:outline-none"
                      >
                        <title>{`${lga.name}: ${lga.leadingParty} ${lga.leadingPct}% · ${lga.reportingPct}% reported`}</title>
                        <path
                          d={geom.path}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.96 : isHovered ? 0.9 : 0.8}
                          stroke={isSelected ? '#FFFFFF' : isHovered ? '#6EE7B7' : '#040B06'}
                          strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 1}
                          strokeLinejoin="round"
                        />
                        {isSelected && (
                          <path
                            d={geom.path}
                            fill="none"
                            stroke="#FDE047"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                          />
                        )}
                        {(showLgaLabels || isSelected) && (
                          <text
                            x={geom.labelX}
                            y={geom.labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={isSelected ? 4.2 : 2.8}
                            fontWeight="bold"
                            fill={isSelected ? '#FDE047' : '#FFFFFF'}
                            stroke="#040B06"
                            strokeWidth={isSelected ? 0.9 : 0.6}
                            paintOrder="stroke"
                            style={{ pointerEvents: 'none' }}
                          >
                            {lga.name.replace(/ LGA$/, '')}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
                            ) : (
                // -----------------------------------------------------------
                // 37-State Results Layer
                // -----------------------------------------------------------
                <g key="state-layer">


                  {/* Iconic River Niger & River Benue Confluence */}
                  <path
                    d={NIGERIA_RIVERS.riverNiger}
                    stroke="#38BDF866"
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <path
                    d={NIGERIA_RIVERS.riverBenue}
                    stroke="#38BDF866"
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <path
                    d={NIGERIA_RIVERS.lowerNiger}
                    stroke="#38BDF888"
                    strokeWidth={3}
                    fill="none"
                  />
                  <circle
                    cx={NIGERIA_RIVERS.confluence.x}
                    cy={NIGERIA_RIVERS.confluence.y}
                    r={3.5}
                    fill="#38BDF8"
                  />
                  <text
                    x={145}
                    y={255}
                    fill="#38BDF855"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    R. Niger
                  </text>
                  <text
                    x={410}
                    y={315}
                    fill="#38BDF855"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    R. Benue
                  </text>

                  {/* All 36 States + FCT Polygons */}
                  {stateHeatmapData.map((st) => {
                    const geom = NIGERIA_STATE_GEOMETRIES[st.id];
                    if (!geom) return null;
                    const isSelected = selectedMapStateId === st.id;
                    const isHovered = hoveredStateId === st.id;
                    const fill = getFillColor(st);

                    return (
                      <g
                        key={st.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${st.name} State: ${st.leadingParty} leading with ${st.leadingPct}%, ${st.reportingPct}% collated. Click to inspect.`}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedMapStateId(st.id);
                          setActiveLgaState(st.name);
                          setInspectModalUnit(st);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedMapStateId(st.id);
                            setActiveLgaState(st.name);
                            setInspectModalUnit(st);
                          }
                        }}
                        onMouseEnter={() => setHoveredStateId(st.id)}
                        onMouseLeave={() => setHoveredStateId(null)}
                        className="cursor-pointer transition-all duration-150 focus:outline-none"
                      >
                        <title>{`${st.name} (${st.code}) - ${st.leadingParty}: ${st.leadingPct}% | ${st.reportingPct}% collated`}</title>

                        {/* Outer Glow Halo for Selected State */}
                        {isSelected && (
                          <path
                            d={geom.path}
                            fill="none"
                            stroke="#34D399"
                            strokeWidth={6}
                            strokeOpacity={0.65}
                            filter="url(#map-glow)"
                          />
                        )}

                        {/* State Polygon Body */}
                        <path
                          d={geom.path}
                          fill={fill}
                          fillOpacity={isSelected ? 0.96 : isHovered ? 0.9 : 0.8}
                          stroke={isSelected ? '#FFFFFF' : isHovered ? '#6EE7B7' : '#040B06'}
                          strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 1.1}
                        />

                        {/* High-Contrast Badge Plate behind State Label */}
                        <rect
                          x={geom.labelX - 22}
                          y={geom.labelY - 11}
                          width={44}
                          height={22}
                          rx={4}
                          fill="#040B06F2"
                          stroke={isSelected ? '#FDE047' : isHovered ? '#34D39988' : '#FFFFFF20'}
                          strokeWidth={isSelected ? 1.5 : 0.8}
                        />
                        <text
                          x={geom.labelX}
                          y={geom.labelY - 1}
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {geom.code}
                        </text>
                        <text
                          x={geom.labelX}
                          y={geom.labelY + 8}
                          fill={isSelected ? '#FDE047' : '#34D399'}
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {mapHeatMode === 'party'
                            ? `${st.leadingParty} ${st.leadingPct}%`
                            : `${st.reportingPct}%`}
                        </text>

                        {/* Center Indicator Pin for Active Unit */}
                        {isSelected && (
                          <>
                            <circle
                              cx={geom.labelX}
                              cy={geom.labelY - 15}
                              r={3.5}
                              fill="#FFFFFF"
                            />
                            <circle
                              cx={geom.labelX}
                              cy={geom.labelY - 15}
                              r={7.5}
                              stroke="#FFFFFF99"
                              strokeWidth={1.5}
                              fill="none"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          {/* Quick Stats Ticker below Map */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#142D1E] text-center">
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Reporting Progress</p>
              <p className="text-xs font-black text-emerald-400">{scopeReportingPct}%</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Valid Votes</p>
              <p className="text-xs font-black text-white">{scopeVotes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Selected Unit Lead</p>
              <p
                className="text-xs font-black"
                style={{
                  color:
                    PARTY_COLORS[
                      geoLevel === 'state'
                        ? activeSelectedState.leadingParty
                        : activeSelectedLga.leadingParty
                    ],
                }}
              >
                {geoLevel === 'state'
                  ? `${activeSelectedState.name} (${activeSelectedState.leadingParty})`
                  : `${activeSelectedLga.name} (${activeSelectedLga.leadingParty})`}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Compact Mode: High-density Operational Telemetry Strip */}
        {/* ------------------------------------------------------------------- */}
        {compact && (
          <div className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                style={{
                  backgroundColor: `${
                    PARTY_COLORS[
                      geoLevel === 'state'
                        ? activeSelectedState.leadingParty
                        : activeSelectedLga.leadingParty
                    ]
                  }20`,
                  color:
                    PARTY_COLORS[
                      geoLevel === 'state'
                        ? activeSelectedState.leadingParty
                        : activeSelectedLga.leadingParty
                    ],
                  border: `1px solid ${
                    PARTY_COLORS[
                      geoLevel === 'state'
                        ? activeSelectedState.leadingParty
                        : activeSelectedLga.leadingParty
                    ]
                  }50`,
                }}
              >
                {geoLevel === 'state'
                  ? activeSelectedState.leadingParty
                  : activeSelectedLga.leadingParty}
              </div>
              <div>
                <p className="font-bold text-white">
                  {geoLevel === 'state'
                    ? `${activeSelectedState.name} State Hub`
                    : `${activeSelectedLga.name} (${activeSelectedLga.state})`}
                </p>
                <p className="text-[11px] text-[#718579]">
                  {geoLevel === 'state'
                    ? `${activeSelectedState.zone} · ${activeSelectedState.reportingPct}% returns · ${activeSelectedState.totalVotes.toLocaleString()} votes`
                    : `${activeSelectedLga.reportingPct}% collated · Margin: ${activeSelectedLga.margin}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setInspectModalUnit(
                    geoLevel === 'state' ? activeSelectedState : activeSelectedLga
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#15241D] hover:bg-[#1E3629] text-white border border-[#2A4435] font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspect</span>
              </button>
              <button
                onClick={() =>
                  handleAuditUnit(
                    geoLevel === 'state' ? activeSelectedState : activeSelectedLga
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 transition shadow-sm"
              >
                <span>Audit Returns</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* Non-Compact Mode: Detailed Dossier & Searchable Breakdown (5 Cols) */}
        {/* ------------------------------------------------------------------- */}
        {!compact && (
          <div className="lg:col-span-5 space-y-4">
            {/* Active Selected Unit Dossier Card */}
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-[#0F261A] to-[#0A160F] p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white tracking-wide">
                      {geoLevel === 'state'
                        ? `${activeSelectedState.name} State`
                        : activeSelectedLga.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-xs">
                      {geoLevel === 'state' ? activeSelectedState.code : activeSelectedLga.state}
                    </span>
                  </div>
                  <p className="text-xs text-[#718579] font-medium">
                    {geoLevel === 'state'
                      ? `${activeSelectedState.zone} · ${activeSelectedState.totalPus.toLocaleString()} Registered PUs`
                      : `${activeSelectedLga.state} State · ${activeSelectedLga.totalPus} Registered PUs`}
                  </p>
                </div>

                {/* Leading Party Badge */}
                <div
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${
                      PARTY_COLORS[
                        geoLevel === 'state'
                          ? activeSelectedState.leadingParty
                          : activeSelectedLga.leadingParty
                      ]
                    }20`,
                    borderColor: `${
                      PARTY_COLORS[
                        geoLevel === 'state'
                          ? activeSelectedState.leadingParty
                          : activeSelectedLga.leadingParty
                      ]
                    }50`,
                    color:
                      PARTY_COLORS[
                        geoLevel === 'state'
                          ? activeSelectedState.leadingParty
                          : activeSelectedLga.leadingParty
                      ],
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        PARTY_COLORS[
                          geoLevel === 'state'
                            ? activeSelectedState.leadingParty
                            : activeSelectedLga.leadingParty
                        ],
                    }}
                  />
                  <span>
                    {geoLevel === 'state'
                      ? activeSelectedState.leadingParty
                      : activeSelectedLga.leadingParty}{' '}
                    LEADING
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Leading Candidate</p>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">
                    {geoLevel === 'state'
                      ? activeSelectedState.leadingCandidate
                      : activeSelectedLga.leadingCandidate}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    {geoLevel === 'state'
                      ? `${activeSelectedState.leadingPct}% vote share`
                      : `${activeSelectedLga.leadingPct}% vote share`}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Votes Tallied</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {geoLevel === 'state'
                      ? activeSelectedState.totalVotes.toLocaleString()
                      : activeSelectedLga.totalVotes.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-[#718579]">
                    {geoLevel === 'state'
                      ? activeSelectedState.margin
                      : activeSelectedLga.margin}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Collation Returns</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {geoLevel === 'state'
                      ? `${activeSelectedState.reportingPct}%`
                      : `${activeSelectedLga.reportingPct}%`}
                  </p>
                  <p className="text-[11px] text-blue-400 font-semibold">
                    {geoLevel === 'state'
                      ? `${activeSelectedState.baseCollated} / ${activeSelectedState.totalPus} PUs`
                      : `${activeSelectedLga.baseCollated} / ${activeSelectedLga.totalPus} PUs`}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Party Breakdown</p>
                  <div className="mt-1 space-y-1">
                    {(geoLevel === 'state'
                      ? activeSelectedState.shares
                      : activeSelectedLga.shares
                    ).map((s) => (
                      <div
                        key={s.party}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="font-bold" style={{ color: PARTY_COLORS[s.party] }}>
                          {s.party}
                        </span>
                        <span className="font-mono text-[#94A89D]">
                          {s.pct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row: Inspect Full Modal + Audit Results */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() =>
                    setInspectModalUnit(
                      geoLevel === 'state' ? activeSelectedState : activeSelectedLga
                    )
                  }
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#15241D] hover:bg-[#1E3629] text-white border border-[#2A4435] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect Telemetry</span>
                </button>

                <button
                  onClick={() =>
                    handleAuditUnit(
                      geoLevel === 'state' ? activeSelectedState : activeSelectedLga
                    )
                  }
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <span>Audit PUs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Search & Breakdown Table */}
            <div className="rounded-2xl border border-[#1C2E24] bg-[#080E0A] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#718579]">
                  {geoLevel === 'state'
                    ? `Federation States (${filteredList.length})`
                    : `${effectiveLgaState} LGAs (${filteredList.length})`}
                </h4>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search unit..."
                  className="w-36 px-2.5 py-1 rounded-lg bg-[#0E1712] border border-[#1C2E24] text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {filteredList.map((item) => {
                  const isSelected =
                    geoLevel === 'state'
                      ? selectedMapStateId === item.id
                      : selectedMapLgaId === item.id;
                  const partyColor = PARTY_COLORS[item.leadingParty];

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (geoLevel === 'state') {
                          setSelectedMapStateId(item.id);
                          setActiveLgaState(item.name);
                        } else {
                          setSelectedMapLgaId(item.id);
                        }
                        setInspectModalUnit(item);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-[#0E1712] border-[#1C2E24] text-[#94A89D] hover:border-[#2A4435] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-[10px] text-[#718579]">
                          {'state' in item ? `(${item.state})` : `(${item.code})`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-xs font-bold" style={{ color: partyColor }}>
                          {item.leadingParty} ({item.leadingPct}%)
                        </span>
                        <span className="text-[11px] text-[#718579]">
                          {item.reportingPct}% Returns
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Dedicated Interactive LGA District Cards Grid (Locations Full View Only) */}
      {/* --------------------------------------------------------------------- */}
      {!compact && geoLevel === 'lga' && (
        <div className="mt-5 pt-4 border-t border-[#1C2E24] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>
                  {effectiveLgaState} Local Government Areas ({mapLgas.length})
                </span>
              </h3>
              <p className="text-xs text-[#718579]">
                Tap any district card to view enlarged telemetry, party breakdown, or audit its polling units.
              </p>
            </div>

            <button
              onClick={() => handleAuditUnit(activeSelectedState)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <span>Audit All {effectiveLgaState} Units</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {mapLgas.map((lga) => {
                const isSelected = selectedMapLgaId === lga.id;
                const partyColor = PARTY_COLORS[lga.leadingParty];

                return (
                  <div
                    key={lga.id}
                    onClick={() => {
                      setSelectedMapLgaId(lga.id);
                      setInspectModalUnit(lga);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#122E1E] to-[#0A160F] border-emerald-500 shadow-lg shadow-emerald-950/40'
                        : 'bg-[#080E0A] border-[#1C2E24] hover:border-[#2D4E3A] hover:bg-[#0B150F]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${partyColor}18`,
                            borderColor: `${partyColor}50`,
                            color: partyColor,
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{lga.name}</h4>
                          <p className="text-[11px] text-[#718579] font-medium">
                            {lga.baseCollated} of {lga.totalPus} Polling Units Collated
                          </p>
                        </div>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded-lg text-xs font-black border font-mono shrink-0"
                        style={{
                          backgroundColor: `${partyColor}20`,
                          borderColor: `${partyColor}50`,
                          color: partyColor,
                        }}
                      >
                        {lga.leadingParty} {lga.leadingPct}%
                      </span>
                    </div>

                    {/* Reporting Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#718579]">
                        <span className="font-semibold">Reporting Progress</span>
                        <span className="font-bold text-emerald-400">
                          {lga.reportingPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#121F18] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${lga.reportingPct}%`,
                            backgroundColor: partyColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Stats & Inspect Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#1C2E24]/60 text-xs">
                      <span className="text-[11px] text-[#94A89D] font-mono">
                        {lga.totalVotes.toLocaleString()} votes ({lga.margin})
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMapLgaId(lga.id);
                          setInspectModalUnit(lga);
                        }}
                        className="px-2 py-1 rounded bg-[#10B981]/15 hover:bg-[#10B981]/25 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* LGA Inspection Modal (Full Interactive Telemetry) */}
      {/* --------------------------------------------------------------------- */}
      {inspectModalUnit && (
        <div
          onClick={() => setInspectModalUnit(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8 text-white"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  {'zone' in inspectModalUnit ? (
                    <Globe className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{inspectModalUnit.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono font-bold text-xs">
                      {'zone' in inspectModalUnit
                        ? inspectModalUnit.code
                        : inspectModalUnit.state}
                    </span>
                  </div>
                  <p className="text-xs text-[#718579]">
                    {'zone' in inspectModalUnit
                      ? `${inspectModalUnit.zone} · National Administrative Hub`
                      : `${inspectModalUnit.state} State Electoral District`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectModalUnit(null)}
                aria-label="Close LGA details"
                className="p-1.5 rounded-xl text-[#718579] hover:text-white hover:bg-[#15241D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reporting Progress Bar Strip */}
            <div className="bg-[#080E0A] border border-[#1C2E24] p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#718579] uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  Reporting Progress
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {inspectModalUnit.reportingPct}% Complete
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#121F18] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${inspectModalUnit.reportingPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#94A89D]">
                <span>
                  <strong>{inspectModalUnit.baseCollated.toLocaleString()}</strong> of{' '}
                  <strong>{inspectModalUnit.totalPus.toLocaleString()}</strong> polling units reported
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {dataSource === 'INEC' ? 'INEC Declared' : 'Observed Returns'}
                </span>
              </div>
            </div>

            {/* Leaderboard Callout */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between"
              style={{
                backgroundColor: `${PARTY_COLORS[inspectModalUnit.leadingParty]}15`,
                borderColor: `${PARTY_COLORS[inspectModalUnit.leadingParty]}50`,
              }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#718579] block">
                  Leading Candidate
                </span>
                <h4 className="text-base font-black text-white mt-0.5">
                  {inspectModalUnit.leadingCandidate}
                </h4>
                <p className="text-xs font-semibold text-[#94A89D]">
                  Margin of Lead: <strong className="text-white">{inspectModalUnit.margin}</strong>
                </p>
              </div>

              <div
                className="px-3.5 py-1.5 rounded-xl font-black text-sm border"
                style={{
                  backgroundColor: `${PARTY_COLORS[inspectModalUnit.leadingParty]}25`,
                  borderColor: PARTY_COLORS[inspectModalUnit.leadingParty],
                  color: PARTY_COLORS[inspectModalUnit.leadingParty],
                }}
              >
                {inspectModalUnit.leadingParty} ({inspectModalUnit.leadingPct}%)
              </div>
            </div>

            {/* Comprehensive Party Vote Distribution with Full-Size Bars */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#718579]">
                Candidate & Party Distribution ({inspectModalUnit.totalVotes.toLocaleString()} Valid Votes)
              </h4>

              <div className="space-y-2">
                {inspectModalUnit.shares.map((share) => {
                  const pColor = PARTY_COLORS[share.party];
                  return (
                    <div
                      key={share.party}
                      className="p-3 rounded-xl bg-[#080E0A] border border-[#1C2E24] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: pColor }}
                          />
                          <span className="font-extrabold text-white text-sm">
                            {share.party}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-xs text-[#94A89D]">
                            {share.votes.toLocaleString()} votes
                          </span>
                          <span className="text-sm font-black text-white" style={{ color: pColor }}>
                            {share.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#121F18] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${share.pct}%`,
                            backgroundColor: pColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#1C2E24]">
              {'zone' in inspectModalUnit && (
                <button
                  onClick={() => handleDrilldownLga(inspectModalUnit.name)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#15241D] hover:bg-[#1E3629] text-white border border-[#2A4435] text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Explore State LGAs</span>
                </button>
              )}

              <button
                onClick={() => handleAuditUnit(inspectModalUnit)}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Audit Polling Units in {inspectModalUnit.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
