import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { electionService } from '../services/electionService';
import {
  Sparkles,
  FileText,
  ChevronRight,
  Trophy,
  Search,
  X,
  MapPin,
  Info,
  CheckCircle2,
  Clock,
  Circle,
  PlusCircle,
  AlertTriangle,
  BarChart3,
  Map,
} from 'lucide-react';
import { NigeriaHeatMap } from '../components/NigeriaHeatMap';

const PARTY_COLORS: Record<string, string> = {
  CPA: '#0D6338',
  DPP: '#DC2626',
  PL: '#16A34A',
  PPNN: '#2563EB',
  PAGA: '#D97706',
};

const BASE_VOTES_MAP: Record<string, number> = {
  cand1: 6420,
  cand3: 5890,
  cand2: 3980,
  cand4: 1210,
};

export const DashboardView: React.FC = () => {
  const {
    user,
    pulseTick,
    results,
    incidents,
    setSubmitResultOpen,
    setReportIncidentOpen,
    setDraftsQueueOpen,
    setSelectedIncidentId,
    setActiveTab,
  } = useAppStore();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    user?.watchCandidateId || 'cand1'
  );
  const [pastDataEnum, setPastDataEnum] = useState<0 | 1 | 2>(0);
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
    qualification: string;
  } | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Sync candidate selection when user profile changes
  useEffect(() => {
    if (user?.watchCandidateId) {
      setSelectedCandidateId(user.watchCandidateId);
    }
  }, [user?.watchCandidateId]);

  const candidates = electionService.getCandidates('e1');
  const projection = electionService.getAIProjection(
    selectedCandidateId,
    pastDataEnum,
    pulseTick
  );

  const candidateScores = React.useMemo(() => {
    let grandTotal = 0;
    const list = candidates.map((c) => {
      const dbVotes = results.reduce(
        (sum, r) => sum + (r.candidateVotes[c.id] || 0),
        0
      );
      const base = dbVotes > 0 ? dbVotes : (BASE_VOTES_MAP[c.id] ?? 500);
      const pulseAdd = Math.floor(pulseTick * 18);
      const votes = base + pulseAdd;
      grandTotal += votes;
      return { ...c, votes };
    });

    return list
      .map((c) => ({
        ...c,
        pct: grandTotal > 0 ? (c.votes / grandTotal) * 100 : 25,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [candidates, results, pulseTick]);

  const grandTotalVotes = React.useMemo(() => {
    return candidateScores.reduce((acc, c) => acc + c.votes, 0);
  }, [candidateScores]);

  // Candidate agent is tied to
  const myCandidateId = user?.watchCandidateId ?? 'cand3';
  const myCandidate = candidateScores.find((c) => c.id === myCandidateId) ?? candidateScores[0];
  const myCandidateRank = candidateScores.findIndex((c) => c.id === myCandidate?.id) + 1;
  const otherCandidates = candidateScores.filter((c) => c.id !== myCandidate?.id).slice(0, 3);
  const winningCandidate = candidateScores[0];

  const draftSubmissions = results.filter((r) => r.status === 'DRAFT');
  const isFieldUser = user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';
  const isOfficerOrAbove =
    user?.role === 'ELECTION_OFFICER' ||
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'SUPER_ADMINISTRATOR';
  const isSupervisory = !isFieldUser;

  const roleLabel =
    user?.role === 'SUPER_ADMINISTRATOR'
      ? 'Super Administrator'
      : user?.role === 'ADMINISTRATOR'
      ? 'Administrator'
      : user?.role === 'ELECTION_OFFICER'
      ? 'Election Officer'
      : user?.role === 'FIELD_AGENT'
      ? 'Field Agent'
      : 'Polling Unit Agent';

  // Demo assigned PUs matching ASSIGNED_DEMO_PUS in app/(app)/(tabs)/index.tsx
  const assignedDemoPus = [
    {
      id: 'pu-s25-lga-1-1',
      name: 'Ward 1 PU 01 - Alausa Central',
      code: 'PU/25/01/001',
      lga: 'Ikeja',
      state: 'Lagos',
      status: 'PUBLISHED' as const,
      votes: 486,
      accredited: 520,
    },
    {
      id: 'pu-s25-lga-1-2',
      name: 'Ward 1 PU 02 - Secretariat Road',
      code: 'PU/25/01/002',
      lga: 'Ikeja',
      state: 'Lagos',
      status: 'DRAFT' as const,
      votes: 312,
      accredited: 410,
    },
    {
      id: 'pu-s25-lga-1-3',
      name: 'Ward 2 PU 01 - Allen Junction',
      code: 'PU/25/02/001',
      lga: 'Ikeja',
      state: 'Lagos',
      status: 'PENDING' as const,
      votes: 0,
      accredited: 0,
    },
  ];

  const activePus = user?.role === 'POLLING_AGENT' ? assignedDemoPus.slice(0, 1) : assignedDemoPus;

  // Search autocomplete
  const searchResults = locationSearchQuery ? electionService.searchLocations(locationSearchQuery) : [];

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Station Console Header + Horizontal Candidate Snapshot for Election Officer */}
      {isOfficerOrAbove ? (
        <div className="w-full rounded-xl border border-[#1C2E24] bg-[#0D6338]/[0.05] p-3 sm:p-3.5 lg:p-4 shadow-md backdrop-blur-sm">
          <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
            {/* Left Telemetry Strip (Presidential Collation + Reporting PUs + Total Tallied) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#10B981]">
                      {(user?.organizationName ?? 'iAQUILA Situation Room HQ').replace(/i?aquila/gi, 'iAQUILA')}
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5 whitespace-nowrap">
                    Presidential Collation
                  </h1>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-[#1C2E24]" />

              <div className="flex items-center gap-3 sm:gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1C2E24]/60">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                    Reporting PUs
                  </span>
                  <span className="text-sm sm:text-base font-black text-white whitespace-nowrap">
                    {(725 + pulseTick).toLocaleString()}
                  </span>
                </div>

                <div className="h-6 w-px bg-[#1C2E24]" />

                <div className="text-left sm:text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                    Total Tallied
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#10B981] whitespace-nowrap">
                    {grandTotalVotes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden 2xl:block h-10 w-px bg-[#1C2E24]" />

            {/* Right: Horizontal Snapshot Performance (Candidates in dead space row) */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {candidateScores.map((cand) => {
                  const rank = candidateScores.findIndex((c) => c.id === cand.id) + 1;
                  const isWinner = rank === 1;
                  const isMyCandidate = cand.id === myCandidate?.id;
                  const isSelected = selectedCandidateId === cand.id;
                  const partyCol = PARTY_COLORS[cand.partyAcronym] || '#10B981';

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      title={`Select ${cand.fullName} (${cand.partyAcronym}) for AI projection`}
                      className={`cursor-pointer rounded-lg border p-2 sm:p-2.5 transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#10B981] bg-[#121F18]/70 ring-1 ring-[#10B981]'
                          : isMyCandidate
                          ? 'border-[#10B981]/60 bg-[#121F18]/40 hover:border-[#10B981]'
                          : isWinner
                          ? 'border-[#10B981]/40 bg-[#121F18]/20 hover:border-[#10B981]/70'
                          : 'border-[#1C2E24] bg-[#070C09]/80 hover:border-[#10B981]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded text-[9px] sm:text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                              isWinner ? 'bg-[#10B981] text-black' : 'bg-[#1C2E24] text-[#94A89D]'
                            }`}
                          >
                            #{rank}
                          </span>
                          <span
                            className="text-xs font-bold text-white truncate"
                            title={`${cand.fullName} (${cand.partyAcronym})`}
                          >
                            {cand.fullName} ({cand.partyAcronym})
                          </span>
                        </div>
                        {isMyCandidate && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 flex-shrink-0">
                            MY
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between gap-1 text-xs">
                        <span className="font-mono font-bold text-white text-[11px] sm:text-xs">
                          {cand.votes.toLocaleString()}
                        </span>
                        <span className="font-mono font-bold text-[#10B981] text-[10px] sm:text-[11px]">
                          {cand.pct.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-[#1C2E24] rounded-full h-1 overflow-hidden mt-1.5">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(cand.pct, 100)}%`,
                            backgroundColor: partyCol,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Field Agent / Polling Agent Station Console Header */
        <div className="w-full md:w-fit rounded-xl border border-[#1C2E24] bg-[#0D6338]/[0.05] p-3 sm:p-3.5 lg:p-4 shadow-md backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 lg:gap-8">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#10B981]">
                    {(user?.organizationName ?? 'iAQUILA Situation Room HQ').replace(/i?aquila/gi, 'iAQUILA')}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5 whitespace-nowrap">
                  Presidential Collation
                </h1>
              </div>

              <div className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                  LIVE
                </span>
              </div>
            </div>

            <div className="hidden md:block h-8 w-px bg-[#1C2E24]" />

            <div className="flex items-center justify-between md:justify-start gap-2.5 sm:gap-5 pt-2.5 md:pt-0 border-t md:border-t-0 border-[#1C2E24]/60">
              <div className="text-left md:text-right">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                  Reporting PUs
                </span>
                <span className="text-sm sm:text-base font-black text-white whitespace-nowrap">
                  {(725 + pulseTick).toLocaleString()}
                </span>
              </div>

              <div className="h-6 w-px bg-[#1C2E24]" />

              <div className="text-left md:text-right">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                  Total Tallied
                </span>
                <span className="text-sm sm:text-base font-black text-[#10B981] whitespace-nowrap">
                  {grandTotalVotes.toLocaleString()}
                </span>
              </div>

              <div className="h-6 w-px bg-[#1C2E24]" />

              <div className="text-left md:text-right">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                  Status
                </span>
                <span className="text-sm sm:text-base font-black text-amber-400">
                  ACTIVE
                </span>
              </div>

              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 ml-2 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                  LIVE COLLATION
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2b. Drafts Alert Banner (Only for Field & Polling Agents) */}
      {isFieldUser && draftSubmissions.length > 0 && (
        <div
          onClick={() => setDraftsQueueOpen(true)}
          className="cursor-pointer rounded-2xl border border-amber-500/50 bg-amber-950/30 p-4 shadow-md hover:bg-amber-950/40 transition flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {draftSubmissions.length} Pending Result Draft{draftSubmissions.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#94A89D]">
                You have saved drafts awaiting review and final publication.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-black font-bold text-xs flex-shrink-0">
            <span>Resume</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. Executive Mid-Section for Election Officer: Tactical Heat Map (Reduced Width) & AI Projection Side-by-Side */}
      {isOfficerOrAbove && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Tactical Heat Map with reduced width */}
          <div className="transition-all duration-300">
            <NigeriaHeatMap compact />
          </div>

          {/* AI Election Projection Engine */}
          <div className="rounded-2xl border-2 border-[#10B981] bg-[#0E1712] p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#10B981] text-black flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">iAquila AI Projection</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                    NEURAL ELECTION SIMULATION MODEL
                  </span>
                </div>
              </div>

              {projection && (
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-bold text-xs">
                  {projection.winProbability}% Win Prob
                </div>
              )}
            </div>

            {/* SELECT CANDIDATE TO PROJECT - Aligned Name and Party */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block mb-2">
                SELECT CANDIDATE TO PROJECT
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {candidates.map((c) => {
                  const active = selectedCandidateId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                        active
                          ? 'bg-[#10B981] border-[#10B981] text-black shadow-sm'
                          : 'bg-[#070C09] border-[#1C2E24] text-white hover:border-[#10B981]/50'
                      }`}
                    >
                      {c.fullName} ({c.partyAcronym})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HISTORICAL BASELINE DATASET (0: 2023, 1: 2019, 2: Combined) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block mb-2">
                HISTORICAL BASELINE DATASET
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { enumVal: 0 as const, label: '2023 Election' },
                  { enumVal: 1 as const, label: '2019 Election' },
                  { enumVal: 2 as const, label: 'Combined 19+23' },
                ].map((tab) => {
                  const active = pastDataEnum === tab.enumVal;
                  return (
                    <button
                      key={tab.enumVal}
                      onClick={() => setPastDataEnum(tab.enumVal)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center border ${
                        active
                          ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                          : 'bg-[#070C09] border-[#1C2E24] text-[#94A89D] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GEOGRAPHIC PROJECTION SCOPE with Autocomplete Search */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579]">
                  GEOGRAPHIC PROJECTION SCOPE
                </span>
                {selectedLocation && (
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setLocationSearchQuery('');
                      setShowLocationDropdown(false);
                    }}
                    className="text-xs font-bold text-[#10B981] hover:underline"
                  >
                    Reset to National
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={selectedLocation ? `${selectedLocation.name} (${selectedLocation.qualification})` : locationSearchQuery}
                  onChange={(e) => {
                    setSelectedLocation(null);
                    setLocationSearchQuery(e.target.value);
                    setShowLocationDropdown(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => {
                    if (locationSearchQuery.trim().length >= 2) setShowLocationDropdown(true);
                  }}
                  placeholder="Search State, LGA, Ward, or PU to simulate..."
                  className="w-full pl-9 pr-8 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
                {(locationSearchQuery || selectedLocation) && (
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setLocationSearchQuery('');
                      setShowLocationDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#718579] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0E1712] border border-[#10B981] rounded-xl shadow-2xl z-30 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#718579]">
                      No matching locations found.
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLocation(item);
                          setShowLocationDropdown(false);
                        }}
                        className="p-3 border-b border-[#1C2E24] hover:bg-[#15241D] cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                            {item.type}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{item.name}</p>
                            <p className="text-[10px] text-[#718579]">{item.qualification}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#718579]" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* AI Projection Output Metrics */}
            {projection && (
              <div className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-4 space-y-3">
                {/* Scope Banner */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1712] border border-[#1C2E24] text-xs text-[#718579]">
                  <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>
                    Scope:{' '}
                    <strong className="text-white">
                      {selectedLocation
                        ? `${selectedLocation.name} (${selectedLocation.qualification})`
                        : projection.locationScope}
                    </strong>
                  </span>
                </div>

                {/* Metric Row */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block">
                      PROJECTED SHARE
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#10B981]">
                      {projection.projectedVoteShare}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block">
                      HISTORICAL PARTY
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white">
                      {projection.historicalParty}
                    </span>
                  </div>
                </div>

                {/* Insight Box */}
                <div className="p-3 rounded-lg bg-[#10B981]/[0.08] border border-[#10B981]/20 text-xs text-white leading-relaxed">
                  {projection.keyInsights[0]}
                </div>

                {/* Mandatory AI Disclaimer */}
                <div className="flex items-start gap-1.5 text-[11px] text-[#718579] pt-1">
                  <Info className="w-3.5 h-3.5 text-[#718579] flex-shrink-0 mt-0.5" />
                  <span>{projection.disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Candidate Snapshot Performance (For Field Agents & Polling Agents - Full Width Vertical Card) */}
      {!isOfficerOrAbove && (
        <div className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Snapshot Performance</h2>
              <p className="text-xs text-[#718579]">
                Live top candidates ranked by verified vote tally
              </p>
            </div>
            {winningCandidate && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>Leading</span>
              </div>
            )}
          </div>

          {/* Pinned My Candidate Row */}
          {myCandidate && (
            <div className="rounded-xl border-2 border-[#10B981] bg-[#121F18]/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#10B981] text-black font-black text-xs flex items-center justify-center">
                    #{myCandidateRank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {myCandidate.fullName} ({myCandidate.partyAcronym})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                        MY CANDIDATE
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white font-mono block">
                    {myCandidate.votes.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#10B981] font-mono">
                    {myCandidate.pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-[#1C2E24] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(myCandidate.pct, 100)}%`,
                    backgroundColor: PARTY_COLORS[myCandidate.partyAcronym] || '#10B981',
                  }}
                />
              </div>
            </div>
          )}

          {/* Other Contesting Candidates */}
          <div className="space-y-2">
            {otherCandidates.map((cand) => {
              const rank = candidateScores.findIndex((c) => c.id === cand.id) + 1;
              const isWinner = rank === 1;
              const partyCol = PARTY_COLORS[cand.partyAcronym] || '#10B981';

              return (
                <div
                  key={cand.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 transition ${
                    isWinner ? 'border-[#10B981] bg-[#121F18]/20' : 'border-[#1C2E24] bg-[#070C09]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                          isWinner ? 'bg-[#10B981] text-black' : 'bg-[#1C2E24] text-[#94A89D]'
                        }`}
                      >
                        #{rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {cand.fullName} ({cand.partyAcronym})
                          </span>
                          {isWinner && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] flex items-center gap-1">
                              <Trophy className="w-2.5 h-2.5" />
                              LEADING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-white font-mono block">
                        {cand.votes.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-[#10B981] font-mono">
                        {cand.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#1C2E24] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(cand.pct, 100)}%`,
                        backgroundColor: partyCol,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column Responsive Section: Assigned Polling Units & Operations / Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 5. Assigned Polling Units (app/(app)/(tabs)/index.tsx lines 718-849) */}
      <div className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {user?.role === 'POLLING_AGENT'
                ? 'My Assigned Polling Unit'
                : isSupervisory
                ? 'Jurisdictional Collation Sample Units'
                : 'My Assigned Polling Units'}
            </h2>
            <p className="text-xs text-[#718579]">
              {user?.role === 'POLLING_AGENT'
                ? 'Polling Unit Agent assignment · 1 Polling Unit'
                : isSupervisory
                ? `${roleLabel ?? 'Supervisory'} overview · 3 Reporting Units`
                : 'Field Agent jurisdiction · 3 Polling Units'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('locations')}
            className="text-xs font-bold text-[#10B981] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {activePus.map((pu) => {
            const isPub = pu.status === 'PUBLISHED';
            const isDraft = pu.status === 'DRAFT';

            return (
              <div
                key={pu.id}
                className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-4 space-y-3 hover:border-[#10B981]/50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{pu.name}</h3>
                    <p className="text-xs text-[#718579]">
                      {pu.code} · {pu.lga}, {pu.state}
                    </p>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isPub
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : isDraft
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isPub ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isDraft ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    <span>{pu.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2E24] text-xs">
                  <span className="text-[#718579]">
                    {isPub
                      ? `${pu.votes} Votes tallied (${pu.accredited} accredited)`
                      : isDraft
                      ? 'Draft saved in local store'
                      : 'Awaiting accredited ballot entry'}
                  </span>

                  <button
                    onClick={() => {
                      if (isSupervisory || isPub) {
                        setActiveTab('results');
                      } else if (isDraft) {
                        setDraftsQueueOpen(true);
                      } else {
                        setSubmitResultOpen(true);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isPub || isSupervisory
                        ? 'bg-[#1C2E24] text-white hover:bg-[#253D30]'
                        : 'bg-[#10B981] text-black hover:bg-emerald-400'
                    }`}
                  >
                    <span>{isSupervisory ? 'Audit' : isPub ? 'View' : isDraft ? 'Resume' : 'Submit'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

        {/* Right Column: Quick Actions + Field Incident Stream */}
        <div className="space-y-6">
          {/* 6. Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {isSupervisory ? (
          <>
            <button
              onClick={() => setActiveTab('results')}
              className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-[#10B981]/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-[#10B981] transition">Search Results</p>
              <p className="text-xs text-[#718579]">Audit returns</p>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-red-500/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-red-400 transition">Incident Control</p>
              <p className="text-xs text-[#718579]">Monitor &amp; triage</p>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setSubmitResultOpen(true)}
              className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-[#10B981]/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-2">
                <PlusCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-[#10B981] transition">Enter Results</p>
              <p className="text-xs text-[#718579]">PU ballot return</p>
            </button>

            <button
              onClick={() => setReportIncidentOpen(true)}
              className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-red-500/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-red-400 transition">Report Incident</p>
              <p className="text-xs text-[#718579]">Live covert filing</p>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('results')}
          className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-amber-500/50 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-white group-hover:text-amber-400 transition">Collation Room</p>
          <p className="text-xs text-[#718579]">Wards &amp; LGA summary</p>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-4 text-left hover:border-[#10B981]/50 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-2">
            <Map className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-white group-hover:text-[#10B981] transition">Locations</p>
          <p className="text-xs text-[#718579]">National registry</p>
        </button>
      </div>

      {/* 7. Field Incident Stream (app/(app)/(tabs)/index.tsx lines 956-986) */}
      {incidents.length > 0 && (
        <div className="rounded-2xl border border-[#1C2E24] bg-[#0E1712] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Field Incident Stream</h2>
              <p className="text-xs text-[#718579]">
                {incidents.length} security & logistical issues logged
              </p>
            </div>
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-xs font-bold text-[#10B981] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                onClick={() => {
                  setSelectedIncidentId(inc.id);
                  setActiveTab('incidents');
                }}
                className="p-3.5 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-red-500/40 cursor-pointer transition text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    {inc.category.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : inc.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <p className="text-[#94A89D] text-xs line-clamp-1">{inc.description}</p>
                <div className="flex items-center justify-between text-[10px] text-[#718579] pt-1">
                  <span>{inc.electoralArea}</span>
                  <span>Status: {inc.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
