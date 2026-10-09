import {
  Candidate,
  AIProjectionResult,
  Election,
  ElectionCycle,
  PoliticalParty,
} from '../types';
import {
  ELECTION_CYCLES,
  ELECTIONS,
  CANDIDATES_BY_ELECTION,
  NIGERIA_STATES,
  LGAS,
  POLLING_UNITS,
  PARTIES,
} from '../data/mockData';

export const electionService = {
  getCycles: (): ElectionCycle[] => ELECTION_CYCLES,
  getElections: (cycleId?: string): Election[] => {
    if (cycleId) return ELECTIONS.filter((e) => e.cycleId === cycleId);
    return ELECTIONS;
  },
  getCandidates: (electionId: string): Candidate[] => {
    return CANDIDATES_BY_ELECTION[electionId] ?? CANDIDATES_BY_ELECTION.e1 ?? [];
  },
  getParties: (): PoliticalParty[] => PARTIES,
  getStates: () => NIGERIA_STATES,
  getLgas: (stateId?: string) => {
    if (stateId) return LGAS.filter((l) => l.stateId === stateId);
    return LGAS;
  },
  getPollingUnits: (lgaId?: string) => {
    if (lgaId) return POLLING_UNITS.filter((p) => p.lgaId === lgaId);
    return POLLING_UNITS;
  },
  getAIProjection: (
    candidateId: string = 'cand1',
    baseline: 0 | 1 | 2 = 0,
    pulseOffset: number = 0
  ): AIProjectionResult => {
    const pastLabelMap: Record<0 | 1 | 2, '2023' | '2019' | 'Combined'> = {
      0: '2023',
      1: '2019',
      2: 'Combined',
    };

    const pastDataYear = pastLabelMap[baseline];

    const profiles: Record<
      string,
      {
        name: string;
        party: string;
        baseWinProb: number;
        baseVoteShare: number;
        totalVotes: number;
        margin: string;
        swing: string;
        insight: string;
        histParty: string;
      }
    > = {
      cand1: {
        name: 'Ahmed Okwute',
        party: 'CPA',
        baseWinProb: baseline === 1 ? 52.4 : baseline === 2 ? 61.8 : 64.7,
        baseVoteShare: baseline === 1 ? 42.1 : baseline === 2 ? 40.5 : 44.2,
        totalVotes: 9840300 + pulseOffset * 1420,
        margin: '+1,480,200 votes ahead',
        swing: '+3.8% in South-West corridor',
        insight: `iAquila Neural Model projects strong incumbency retention across the South-West and North-West axis based on the ${pastDataYear} General Election baseline. Polling Unit collation shows steady reporting resilience in commercial urban centres.`,
        histParty: 'CPA',
      },
      cand2: {
        name: 'Abubakar Matthew',
        party: 'DPP',
        baseWinProb: baseline === 1 ? 48.6 : baseline === 2 ? 38.2 : 31.5,
        baseVoteShare: baseline === 1 ? 39.8 : baseline === 2 ? 33.4 : 29.8,
        totalVotes: 6640100 + pulseOffset * 980,
        margin: '-1,720,000 votes behind',
        swing: '-4.2% across North-Central',
        insight: `Analysis reveals vote fragmentation in traditional North-East strongholds combined with split opposition ballot shares in South-South wards under ${pastDataYear} modeling.`,
        histParty: baseline === 1 ? 'DPP' : 'DPP (Ex-CPA 2015)',
      },
      cand3: {
        name: 'Peter Gregory Obi',
        party: 'PL',
        baseWinProb: baseline === 1 ? 22.0 : baseline === 2 ? 46.5 : 51.2,
        baseVoteShare: baseline === 1 ? 18.4 : baseline === 2 ? 31.8 : 34.6,
        totalVotes: 7720900 + pulseOffset * 1150,
        margin: '+380,000 votes in high-density PUs',
        swing: '+12.4% urban momentum',
        insight: `Simulations indicate high youth voter surges and notable gains in South-East, South-South, and urban FCT/Lagos polling units when cross-referenced against ${pastDataYear} historical baselines.`,
        histParty: baseline === 1 ? 'DPP (VP Candidate)' : 'PL (Ex-DPP)',
      },
      cand4: {
        name: 'Rabiu Borro',
        party: 'PPNN',
        baseWinProb: baseline === 1 ? 8.5 : baseline === 2 ? 11.2 : 14.8,
        baseVoteShare: baseline === 1 ? 6.0 : baseline === 2 ? 7.8 : 9.4,
        totalVotes: 2100400 + pulseOffset * 430,
        margin: 'Regional concentration (Kano & Jigawa)',
        swing: '+1.5% localized growth',
        insight: `Concentrated territorial density in Kano metropolitan corridor. High single-state margin with localized conversion under ${pastDataYear} baseline.`,
        histParty: baseline === 1 ? 'DPP' : 'PPNN (Ex-DPP)',
      },
    };

    const target = profiles[candidateId] || profiles.cand1;

    return {
      candidateId,
      candidateName: target.name,
      partyAcronym: target.party,
      projectedVoteShare: Number((target.baseVoteShare + (pulseOffset % 5) * 0.1).toFixed(1)),
      projectedVotes: target.totalVotes,
      winProbability: Number((target.baseWinProb + (pulseOffset % 3) * 0.2).toFixed(1)),
      confidenceScore: 92.4,
      leadingMargin: target.margin,
      swingDelta: target.swing,
      historicalBaselineYear: pastDataYear,
      historicalParty: target.histParty,
      locationScope: 'National (All 36 States + FCT)',
      keyInsights: [
        target.insight,
        `Collation rate weighting applied with 99.4% precinct integrity threshold.`,
      ],
      disclaimer:
        'This projection is based on available data and AI simulation. It may not be 100% accurate.',
    };
  },
  searchLocations: (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      id: string;
      name: string;
      type: 'PU' | 'WARD' | 'LGA' | 'STATE';
      qualification: string;
    }> = [];

    POLLING_UNITS.forEach((pu) => {
      if (pu.name.toLowerCase().includes(q) || pu.code.toLowerCase().includes(q) || pu.lgaName.toLowerCase().includes(q)) {
        results.push({
          id: pu.id,
          name: `${pu.name} (${pu.code})`,
          type: 'PU',
          qualification: `${pu.lgaName}, ${pu.stateName} State`,
        });
      }
    });

    LGAS.forEach((l) => {
      if (l.name.toLowerCase().includes(q)) {
        const stateName = NIGERIA_STATES.find((s) => s.id === l.stateId)?.name ?? 'State';
        results.push({
          id: l.id,
          name: l.name,
          type: 'LGA',
          qualification: `${stateName} State · 774 LGA Directory`,
        });
      }
    });

    NIGERIA_STATES.forEach((s) => {
      if (s.name.toLowerCase().includes(q)) {
        const lgaCount = LGAS.filter((l) => l.stateId === s.id).length;
        results.push({
          id: s.id,
          name: s.name,
          type: 'STATE',
          qualification: `${lgaCount} LGAs on record · State Directory`,
        });
      }
    });

    return results.slice(0, 6);
  },
};
