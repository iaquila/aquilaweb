import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ChevronRight,
  Sparkles,
  Layers,
  Globe,
  Flame,
} from 'lucide-react';
import { useAppStore } from '../store';
import { PARTY_COLORS } from '../constants';

export type GeoLevel = 'state' | 'lga';
export type MapHeatMode = 'party' | 'density';

interface NigeriaHeatMapProps {
  compact?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// SVG Polygon Definitions for LGAs and States (ViewBox 380x250)
// ---------------------------------------------------------------------------

const LGA_MAP_POLYGONS: Record<
  string,
  { path: string; labelX: number; labelY: number; label: string }
> = {
  // Lagos LGAs
  'lga-alimosho': {
    path: 'M 30 45 L 125 35 L 135 110 L 70 130 L 25 95 Z',
    labelX: 75,
    labelY: 80,
    label: 'Alimosho',
  },
  'lga-ikeja': {
    path: 'M 125 35 L 220 30 L 225 100 L 135 110 Z',
    labelX: 172,
    labelY: 65,
    label: 'Ikeja',
  },
  'lga-kosofe': {
    path: 'M 220 30 L 345 25 L 355 105 L 225 100 Z',
    labelX: 285,
    labelY: 62,
    label: 'Kosofe',
  },
  'lga-mainland': {
    path: 'M 135 110 L 225 100 L 230 160 L 150 170 Z',
    labelX: 180,
    labelY: 132,
    label: 'Mainland',
  },
  'lga-surulere': {
    path: 'M 70 130 L 150 170 L 135 210 L 55 180 Z',
    labelX: 102,
    labelY: 170,
    label: 'Surulere',
  },
  'lga-etiosa': {
    path: 'M 150 170 L 230 160 L 360 145 L 355 195 L 240 205 L 135 210 Z',
    labelX: 250,
    labelY: 178,
    label: 'Eti-Osa',
  },
  // Kano LGAs
  'lga-fagge': {
    path: 'M 40 40 L 195 40 L 180 128 L 40 128 Z',
    labelX: 115,
    labelY: 82,
    label: 'Fagge',
  },
  'lga-tarauni': {
    path: 'M 195 40 L 340 40 L 340 128 L 180 128 Z',
    labelX: 260,
    labelY: 82,
    label: 'Tarauni',
  },
  'lga-nassarawa-kn': {
    path: 'M 40 128 L 340 128 L 320 215 L 60 215 Z',
    labelX: 190,
    labelY: 170,
    label: 'Nassarawa',
  },
  // Rivers LGAs
  'lga-obio-akpor': {
    path: 'M 45 45 L 335 45 L 335 125 L 45 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Obio-Akpor',
  },
  'lga-phalga': {
    path: 'M 45 125 L 335 125 L 310 210 L 70 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Port Harcourt',
  },
  // FCT Councils
  'lga-bwari': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Bwari',
  },
  'lga-amac': {
    path: 'M 70 125 L 310 125 L 285 210 L 95 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'AMAC',
  },
  // Kaduna LGAs
  'lga-kaduna-north': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Kaduna North',
  },
  'lga-kaduna-south': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Kaduna South',
  },
  // Oyo LGAs
  'lga-ibadan-north': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Ibadan North',
  },
  'lga-ibadan-sw': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Ibadan South-West',
  },
  // Enugu LGAs
  'lga-nsukka': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Nsukka',
  },
  'lga-enugu-north': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Enugu North',
  },
  // Borno LGAs
  'lga-maiduguri': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Maiduguri',
  },
  'lga-jere': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Jere',
  },
};

const STATE_MAP_POLYGONS: Record<
  string,
  {
    path: string;
    labelX: number;
    labelY: number;
    name: string;
    code: string;
    zone: string;
  }
> = {
  'state-kano': {
    path: 'M 180 38 L 240 32 L 252 74 L 202 82 L 180 62 Z',
    labelX: 212,
    labelY: 56,
    name: 'Kano',
    code: 'KAN',
    zone: 'North West',
  },
  'state-kaduna': {
    path: 'M 148 76 L 202 82 L 210 122 L 154 118 Z',
    labelX: 178,
    labelY: 98,
    name: 'Kaduna',
    code: 'KAD',
    zone: 'North West',
  },
  'state-fct': {
    path: 'M 168 122 L 204 122 L 208 148 L 170 150 Z',
    labelX: 187,
    labelY: 135,
    name: 'FCT',
    code: 'FCT',
    zone: 'North Central',
  },
  'state-oyo': {
    path: 'M 54 142 L 102 138 L 108 178 L 62 182 Z',
    labelX: 80,
    labelY: 158,
    name: 'Oyo',
    code: 'OYO',
    zone: 'South West',
  },
  'state-lagos': {
    path: 'M 58 184 L 120 180 L 122 206 L 54 206 Z',
    labelX: 86,
    labelY: 195,
    name: 'Lagos',
    code: 'LOS',
    zone: 'South West',
  },
  'state-rivers': {
    path: 'M 184 192 L 230 190 L 236 222 L 182 221 Z',
    labelX: 208,
    labelY: 206,
    name: 'Rivers',
    code: 'RIV',
    zone: 'South South',
  },
  'state-enugu': {
    path: 'M 208 152 L 248 150 L 252 186 L 210 188 Z',
    labelX: 228,
    labelY: 168,
    name: 'Enugu',
    code: 'ENU',
    zone: 'South East',
  },
  'state-borno': {
    path: 'M 268 42 L 334 52 L 322 105 L 264 92 Z',
    labelX: 296,
    labelY: 72,
    name: 'Borno',
    code: 'BOR',
    zone: 'North East',
  },
};

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


const DENSITY_RAMP = [
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
}) => {
  const { results, setActiveTab, setSelectedStateFilter } = useAppStore();

  const [geoLevel, setGeoLevel] = useState<GeoLevel>('state');
  const [mapHeatMode, setMapHeatMode] = useState<MapHeatMode>('party');
  const [activeLgaState, setActiveLgaState] = useState<string>('Lagos');
  const [selectedMapStateId, setSelectedMapStateId] = useState<string>('state-lagos');
  const [selectedMapLgaId, setSelectedMapLgaId] = useState<string>('lga-ikeja');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------------------------------------------------------------------
  // Aggregate LGA Collation Heatmap data
  // ---------------------------------------------------------------------------
  const lgaHeatmapData: LgaCollation[] = useMemo(() => {
    const lgaBases = [
      { id: 'lga-ikeja', name: 'Ikeja LGA', state: 'Lagos', totalPus: 450, baseCollated: 412, baseVotes: { CPA: 42350, DPP: 28140, PL: 21980, PPNN: 3200 } },
      { id: 'lga-mainland', name: 'Lagos Mainland', state: 'Lagos', totalPus: 380, baseCollated: 345, baseVotes: { CPA: 27800, DPP: 35900, PL: 18450, PPNN: 2800 } },
      { id: 'lga-alimosho', name: 'Alimosho LGA', state: 'Lagos', totalPus: 620, baseCollated: 540, baseVotes: { CPA: 41200, DPP: 22400, PL: 53100, PPNN: 4600 } },
      { id: 'lga-etiosa', name: 'Eti-Osa LGA', state: 'Lagos', totalPus: 340, baseCollated: 298, baseVotes: { CPA: 24600, DPP: 14200, PL: 39800, PPNN: 2100 } },
      { id: 'lga-surulere', name: 'Surulere LGA', state: 'Lagos', totalPus: 395, baseCollated: 360, baseVotes: { CPA: 36400, DPP: 19800, PL: 31200, PPNN: 3100 } },
      { id: 'lga-kosofe', name: 'Kosofe LGA', state: 'Lagos', totalPus: 310, baseCollated: 275, baseVotes: { CPA: 30100, DPP: 24500, PL: 19400, PPNN: 2950 } },
      { id: 'lga-fagge', name: 'Fagge LGA', state: 'Kano', totalPus: 320, baseCollated: 292, baseVotes: { CPA: 18400, DPP: 9600, PL: 3100, PPNN: 58700 } },
      { id: 'lga-tarauni', name: 'Tarauni LGA', state: 'Kano', totalPus: 280, baseCollated: 241, baseVotes: { CPA: 15200, DPP: 8100, PL: 2600, PPNN: 46300 } },
      { id: 'lga-nassarawa-kn', name: 'Nassarawa LGA', state: 'Kano', totalPus: 350, baseCollated: 305, baseVotes: { CPA: 22100, DPP: 11400, PL: 3900, PPNN: 54200 } },
      { id: 'lga-obio-akpor', name: 'Obio-Akpor LGA', state: 'Rivers', totalPus: 420, baseCollated: 381, baseVotes: { CPA: 19800, DPP: 47200, PL: 24600, PPNN: 1800 } },
      { id: 'lga-phalga', name: 'Port Harcourt LGA', state: 'Rivers', totalPus: 300, baseCollated: 256, baseVotes: { CPA: 16400, DPP: 28900, PL: 24700, PPNN: 1400 } },
      { id: 'lga-amac', name: 'AMAC Area Council', state: 'FCT', totalPus: 380, baseCollated: 340, baseVotes: { CPA: 22100, DPP: 11400, PL: 3900, PPNN: 54200 } },
      { id: 'lga-bwari', name: 'Bwari Area Council', state: 'FCT', totalPus: 220, baseCollated: 186, baseVotes: { CPA: 9800, DPP: 11200, PL: 28600, NNPP: 1100 } },
      { id: 'lga-kaduna-north', name: 'Kaduna North LGA', state: 'Kaduna', totalPus: 340, baseCollated: 295, baseVotes: { CPA: 38200, DPP: 29400, PL: 12100, NNPP: 11200 } },
      { id: 'lga-kaduna-south', name: 'Kaduna South LGA', state: 'Kaduna', totalPus: 310, baseCollated: 260, baseVotes: { CPA: 31500, DPP: 33800, PL: 15400, NNPP: 8900 } },
      { id: 'lga-ibadan-north', name: 'Ibadan North LGA', state: 'Oyo', totalPus: 410, baseCollated: 375, baseVotes: { CPA: 39100, DPP: 36200, PL: 18700, NNPP: 2400 } },
      { id: 'lga-ibadan-sw', name: 'Ibadan South-West LGA', state: 'Oyo', totalPus: 360, baseCollated: 318, baseVotes: { CPA: 34800, DPP: 31200, PL: 16900, NNPP: 1900 } },
      { id: 'lga-enugu-north', name: 'Enugu North LGA', state: 'Enugu', totalPus: 290, baseCollated: 270, baseVotes: { CPA: 4200, DPP: 12800, PL: 58400, NNPP: 800 } },
      { id: 'lga-nsukka', name: 'Nsukka LGA', state: 'Enugu', totalPus: 320, baseCollated: 285, baseVotes: { CPA: 5100, DPP: 14200, PL: 61200, NNPP: 950 } },
      { id: 'lga-maiduguri', name: 'Maiduguri LGA', state: 'Borno', totalPus: 380, baseCollated: 340, baseVotes: { CPA: 54200, DPP: 19800, PL: 4100, NNPP: 8300 } },
      { id: 'lga-jere', name: 'Jere LGA', state: 'Borno', totalPus: 290, baseCollated: 245, baseVotes: { CPA: 41800, DPP: 16200, PL: 3200, NNPP: 6400 } },
    ];

    const candidateNames: Record<string, string> = {
      CPA: 'Ahmed Okwute',
      DPP: 'Abubakuar Matthew',
      PL: 'Peter Muhammed',
      PPNN: 'Borro Nassiru',
    };

    return lgaBases.map((base) => {
      // Incorporate any published results from the active store
      const matchingStoreResults = results.filter(
        (r) =>
          r.status === 'PUBLISHED' &&
          r.pollingUnitName?.toLowerCase().includes(base.state.toLowerCase())
      );

      const dynamicVotes = { ...base.baseVotes };
      const candMap: Record<string, keyof typeof dynamicVotes> = {
        cand1: 'CPA',
        cand2: 'DPP',
        cand3: 'PL',
        cand4: 'PPNN',
      };
      matchingStoreResults.forEach((r) => {
        if (r.candidateVotes) {
          Object.entries(r.candidateVotes).forEach(([candId, count]) => {
            const party = candMap[candId];
            if (party && party in dynamicVotes) {
              dynamicVotes[party] += count;
            }
          });
        }
      });

      const totalVotes =
        dynamicVotes.CPA + dynamicVotes.DPP + dynamicVotes.PL + dynamicVotes.PPNN;

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
        baseCollated: base.baseCollated,
        totalVotes,
        reportingPct: Math.min(
          100,
          Number(((base.baseCollated / base.totalPus) * 100).toFixed(0))
        ),
        leadingParty: leader.party,
        leadingCandidate: candidateNames[leader.party] ?? leader.party,
        leadingPct: leader.pct.toFixed(1),
        margin: `+${marginPct}% ahead`,
        shares,
      };
    });
  }, [results]);

  // ---------------------------------------------------------------------------
  // State aggregation derived from LGA rows
  // ---------------------------------------------------------------------------
  const stateHeatmapData: StateCollation[] = useMemo(() => {
    const STATE_ZONES: Record<string, { zone: string; code: string }> = {
      Lagos: { zone: 'South West', code: 'LOS' },
      Kano: { zone: 'North West', code: 'KAN' },
      Rivers: { zone: 'South South', code: 'RIV' },
      FCT: { zone: 'North Central', code: 'FCT' },
      Kaduna: { zone: 'North West', code: 'KAD' },
      Oyo: { zone: 'South West', code: 'OYO' },
      Enugu: { zone: 'South East', code: 'ENU' },
      Borno: { zone: 'North East', code: 'BOR' },
    };

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

    return [...byState.entries()].map(([state, entry]) => {
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
      const meta =
        STATE_ZONES[state] ?? {
          zone: 'Federation Zone',
          code: state.substring(0, 3).toUpperCase(),
        };

      return {
        id: `state-${state.toLowerCase().replace(/\s+/g, '-')}`,
        name: state,
        zone: meta.zone,
        code: meta.code,
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
        margin: `+${(leader.pct - runnerUp.pct).toFixed(1)}% lead`,
        shares,
      };
    });
  }, [lgaHeatmapData]);

  const statesInView = useMemo(() => {
    return [...new Set(lgaHeatmapData.map((l) => l.state))];
  }, [lgaHeatmapData]);

  const effectiveLgaState = activeLgaState || statesInView[0] || 'Lagos';

  const mapLgas = useMemo(() => {
    return lgaHeatmapData.filter(
      (l) => l.state.toLowerCase() === effectiveLgaState.toLowerCase()
    );
  }, [lgaHeatmapData, effectiveLgaState]);

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

  const overallReportingPct =
    totalPusAcrossLgas > 0
      ? Math.round((totalCollatedAcrossLgas / totalPusAcrossLgas) * 100)
      : 88;

  // Fill color calculation
  const getFillColor = (item: { leadingParty: 'CPA' | 'DPP' | 'PL' | 'PPNN'; reportingPct: number }) => {
    if (mapHeatMode === 'density') {
      const idx = Math.min(
        DENSITY_RAMP.length - 1,
        Math.floor((item.reportingPct / 100) * DENSITY_RAMP.length)
      );
      return DENSITY_RAMP[idx]!;
    }
    return PARTY_COLORS[item.leadingParty] ?? '#10B981';
  };

  // Filtered list for search table in non-compact view
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

  return (
    <div
      className={`rounded-2xl border border-[#1C2E24] bg-[#0E1712] shadow-xl overflow-hidden ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
      } ${className}`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* Top Header Controls Bar */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1C2E24]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#10B981]">
              {geoLevel === 'state'
                ? 'FEDERATION TACTICAL RADAR'
                : `${effectiveLgaState.toUpperCase()} DISTRICT RADAR`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
            {geoLevel === 'state'
              ? 'National Presidential Collation Map'
              : `${effectiveLgaState} State LGA Collation Map`}
          </h2>
          <p className="text-xs text-[#718579]">
            {geoLevel === 'state'
              ? `${stateHeatmapData.length} Key Hubs · ${totalCollatedAcrossLgas.toLocaleString()} / ${totalPusAcrossLgas.toLocaleString()} PUs Collated`
              : `${mapLgas.length} Monitored LGAs · ${mapLgas.reduce(
                  (a, b) => a + b.baseCollated,
                  0
                )} of ${mapLgas.reduce((a, b) => a + b.totalPus, 0)} PUs collated`}
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

          {/* Lead vs Heat Mode Pill Group */}
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
              <span>Lead</span>
            </button>
            <button
              onClick={() => setMapHeatMode('density')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mapHeatMode === 'density'
                  ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                  : 'text-[#718579] hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heat</span>
            </button>
          </div>

          {/* Overall Reporting Percentage Pill */}
          <div className="px-3 py-1 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-black text-[#10B981]">
            {overallReportingPct}% COLLATED
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* State Scoping Selector Chips for LGA Mode */}
      {/* --------------------------------------------------------------------- */}
      {geoLevel === 'lga' && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-[#1C2E24]/60 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718579] shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            Select State:
          </span>
          {statesInView.map((st) => {
            const isSelected = effectiveLgaState.toLowerCase() === st.toLowerCase();
            return (
              <button
                key={st}
                onClick={() => {
                  setActiveLgaState(st);
                  const firstLga = lgaHeatmapData.find(
                    (l) => l.state.toLowerCase() === st.toLowerCase()
                  );
                  if (firstLga) setSelectedMapLgaId(firstLga.id);
                }}
                className={`shrink-0 px-3 py-1 rounded-lg border font-bold text-xs transition ${
                  isSelected
                    ? 'bg-[#10B981] text-black border-[#10B981] shadow-md shadow-emerald-950/50'
                    : 'bg-[#080E0A] text-[#94A89D] border-[#1C2E24] hover:text-white hover:border-[#2A4435]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Main Tactical Canvas Layout */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={
          compact
            ? 'mt-4 flex flex-col gap-4'
            : 'mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
        }
      >
        {/* SVG Tactical Map Canvas */}
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
                {geoLevel === 'state' ? 'NATIONAL FEDERATION' : `${effectiveLgaState.toUpperCase()} LGAS`}
              </span>
              <span className="text-[#718579]">•</span>
              <span className="text-[#94A89D]">
                {mapHeatMode === 'party' ? 'Mode: Leading Party' : 'Mode: Collation Density'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#34D399]/70 font-mono">GRID: NGA-WGS84</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">▲ N 09°04'</span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div
            className={`relative w-full flex items-center justify-center my-2 ${
              compact ? 'max-h-[300px] aspect-[16/9]' : 'aspect-[16/10]'
            }`}
          >
            <svg
              viewBox="0 0 380 250"
              className="w-full h-full drop-shadow-2xl select-none"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {geoLevel === 'lga' ? (
                // -----------------------------------------------------------
                // LGA Layer for Active State
                // -----------------------------------------------------------
                <g key="lga-layer">
                  {mapLgas.map((lga) => {
                    const poly = LGA_MAP_POLYGONS[lga.id];
                    if (!poly) return null;
                    const isSelected = selectedMapLgaId === lga.id;
                    const fillColor = getFillColor(lga);

                    return (
                      <g
                        key={lga.id}
                        onClick={() => setSelectedMapLgaId(lga.id)}
                        className="cursor-pointer transition-all duration-150"
                      >
                        {isSelected && (
                          <path
                            d={poly.path}
                            fill="none"
                            stroke="#34D399"
                            strokeWidth={5}
                            strokeOpacity={0.6}
                          />
                        )}
                        <path
                          d={poly.path}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.95 : 0.78}
                          stroke={isSelected ? '#FFFFFF' : '#070C09'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />

                        {/* Contrast Badge Plate behind text for crisp readability */}
                        <rect
                          x={poly.labelX - 44}
                          y={poly.labelY - 14}
                          width={88}
                          height={28}
                          rx={5}
                          fill="#040B06EE"
                          stroke={isSelected ? '#FDE047' : '#FFFFFF25'}
                          strokeWidth={isSelected ? 1.5 : 0.8}
                        />
                        <text
                          x={poly.labelX}
                          y={poly.labelY - 2}
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {poly.label}
                        </text>
                        <text
                          x={poly.labelX}
                          y={poly.labelY + 9}
                          fill={isSelected ? '#FDE047' : '#FFFFFFCC'}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {mapHeatMode === 'party'
                            ? `${lga.leadingParty} (${lga.leadingPct}%)`
                            : `${lga.reportingPct}% PUs`}
                        </text>

                        {isSelected && (
                          <>
                            <circle
                              cx={poly.labelX}
                              cy={poly.labelY - 19}
                              r={4.5}
                              fill="#FFFFFF"
                            />
                            <circle
                              cx={poly.labelX}
                              cy={poly.labelY - 19}
                              r={8.5}
                              stroke="#FFFFFF88"
                              strokeWidth={1.5}
                              fill="none"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              ) : (
                // -----------------------------------------------------------
                // National Federation State Layer
                // -----------------------------------------------------------
                <g key="state-layer">
                  {/* Nigeria Land Boundary Contour Silhouette */}
                  <path
                    d="M 52 206 L 40 165 L 38 120 L 50 82 L 85 52 L 138 35 L 180 38 L 240 32 L 270 26 L 336 48 L 348 85 L 324 135 L 310 170 L 265 202 L 236 222 L 182 221 L 140 216 L 80 208 Z"
                    fill="#0B1A12"
                    stroke="#19482D"
                    strokeWidth={1.5}
                    strokeDasharray="4,2"
                  />

                  {/* Ambient Geopolitical Background Zones */}
                  {/* North West Ambient */}
                  <path
                    d="M 85 52 L 180 38 L 180 62 L 148 76 L 95 95 Z"
                    fill="#0E281B"
                    stroke="#1B422D"
                    strokeWidth={1}
                    opacity={0.65}
                  />
                  <text
                    x={126}
                    y={64}
                    fill="#34D39944"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    NW ZONE
                  </text>

                  {/* North East Ambient */}
                  <path
                    d="M 240 32 L 270 26 L 268 42 L 264 92 L 210 122 Z"
                    fill="#0E281B"
                    stroke="#1B422D"
                    strokeWidth={1}
                    opacity={0.65}
                  />
                  <text
                    x={242}
                    y={72}
                    fill="#34D39944"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    NE ZONE
                  </text>

                  {/* North Central / Middle Belt Ambient */}
                  <path
                    d="M 95 95 L 148 76 L 168 122 L 102 138 Z"
                    fill="#0E281B"
                    stroke="#1B422D"
                    strokeWidth={1}
                    opacity={0.65}
                  />
                  <text
                    x={128}
                    y={114}
                    fill="#34D39944"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    NC ZONE
                  </text>

                  {/* Benue / Plateau Ambient */}
                  <path
                    d="M 206 150 L 264 92 L 310 135 L 252 152 Z"
                    fill="#0E281B"
                    stroke="#1B422D"
                    strokeWidth={1}
                    opacity={0.65}
                  />

                  {/* South South Ambient */}
                  <path
                    d="M 115 180 L 184 192 L 182 221 L 122 206 Z"
                    fill="#0E281B"
                    stroke="#1B422D"
                    strokeWidth={1}
                    opacity={0.65}
                  />
                  <text
                    x={148}
                    y={204}
                    fill="#34D39944"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    SS ZONE
                  </text>

                  {/* Iconic River Niger & River Benue Confluence */}
                  <path
                    d="M 68 85 Q 115 110 172 144"
                    stroke="#38BDF866"
                    strokeWidth={2}
                    fill="none"
                  />
                  <path
                    d="M 312 125 Q 245 138 172 144"
                    stroke="#38BDF866"
                    strokeWidth={2}
                    fill="none"
                  />
                  <path
                    d="M 172 144 Q 182 178 190 220"
                    stroke="#38BDF888"
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <text x={112} y={112} fill="#38BDF855" fontSize="7" fontWeight="bold">
                    R. Niger
                  </text>
                  <text x={245} y={135} fill="#38BDF855" fontSize="7" fontWeight="bold">
                    R. Benue
                  </text>
                  <circle cx={172} cy={144} r={2.5} fill="#38BDF8" />

                  {/* Tactical Border Labels */}
                  <text
                    x={210}
                    y={14}
                    fill="#34D39944"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    letterSpacing="2"
                  >
                    NIGERIA REPUBLIC
                  </text>
                  <text
                    x={16}
                    y={115}
                    fill="#34D39944"
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    BENIN
                  </text>
                  <text
                    x={358}
                    y={115}
                    fill="#34D39944"
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    CAMEROON
                  </text>

                  {/* Reporting State Polygons */}
                  {stateHeatmapData.map((st) => {
                    const poly = STATE_MAP_POLYGONS[st.id];
                    if (!poly) return null;
                    const isSelected = selectedMapStateId === st.id;
                    const fill = getFillColor(st);

                    return (
                      <g
                        key={st.id}
                        onClick={() => {
                          setSelectedMapStateId(st.id);
                          setActiveLgaState(st.name);
                        }}
                        className="cursor-pointer transition-all duration-150"
                      >
                        {isSelected && (
                          <path
                            d={poly.path}
                            fill="none"
                            stroke="#34D399"
                            strokeWidth={5}
                            strokeOpacity={0.6}
                          />
                        )}
                        <path
                          d={poly.path}
                          fill={fill}
                          fillOpacity={isSelected ? 0.95 : 0.78}
                          stroke={isSelected ? '#FFFFFF' : '#070C09'}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                        />

                        {/* Contrast Badge Plate behind State Label */}
                        <rect
                          x={poly.labelX - 40}
                          y={poly.labelY - 14}
                          width={80}
                          height={28}
                          rx={5}
                          fill="#040B06EE"
                          stroke={isSelected ? '#FDE047' : '#FFFFFF25'}
                          strokeWidth={isSelected ? 1.5 : 0.8}
                        />
                        <text
                          x={poly.labelX}
                          y={poly.labelY - 2}
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {poly.code} · {poly.name}
                        </text>
                        <text
                          x={poly.labelX}
                          y={poly.labelY + 9}
                          fill={isSelected ? '#FDE047' : '#FFFFFFCC'}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {mapHeatMode === 'party'
                            ? `${st.leadingParty} (${st.leadingPct}%)`
                            : `${st.reportingPct}%`}
                        </text>

                        {isSelected && (
                          <>
                            <circle
                              cx={poly.labelX}
                              cy={poly.labelY - 18}
                              r={4.5}
                              fill="#FFFFFF"
                            />
                            <circle
                              cx={poly.labelX}
                              cy={poly.labelY - 18}
                              r={8.5}
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
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#142D1E] text-center">
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Reporting PUs</p>
              <p className="text-xs font-black text-white">
                {totalCollatedAcrossLgas.toLocaleString()} / {totalPusAcrossLgas.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Collation Progress</p>
              <p className="text-xs font-black text-emerald-400">{overallReportingPct}%</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Total Votes Cast</p>
              <p className="text-xs font-black text-white">{totalVotesAcrossAll.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Leaderboard Lead</p>
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
                onClick={() => {
                  setSelectedStateFilter(
                    geoLevel === 'state' ? activeSelectedState.name : activeSelectedLga.state
                  );
                  setActiveTab('results');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 transition shadow-sm"
              >
                <span>Audit Unit Collation</span>
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

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedStateFilter(
                    geoLevel === 'state' ? activeSelectedState.name : activeSelectedLga.state
                  );
                  setActiveTab('results');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <span>
                  Audit{' '}
                  {geoLevel === 'state' ? activeSelectedState.name : activeSelectedLga.name}{' '}
                  Results
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Search & Breakdown Table */}
            <div className="rounded-2xl border border-[#1C2E24] bg-[#080E0A] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#718579]">
                  {geoLevel === 'state'
                    ? `State Breakdown (${filteredList.length})`
                    : `LGA Breakdown (${filteredList.length})`}
                </h4>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search unit..."
                  className="w-36 px-2.5 py-1 rounded-lg bg-[#0E1712] border border-[#1C2E24] text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
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
    </div>
  );
};
