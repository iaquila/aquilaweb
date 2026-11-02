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
  Eye,
  Landmark,
} from 'lucide-react';
import { NigeriaHeatMap } from '../components/NigeriaHeatMap';
import { Card } from '../components/Card';
import { LiveMarquee } from '../components/LiveMarquee';
import { PARTY_COLORS } from '../constants';
import type { DataSource, ResultSubmission } from '../types';

const isPublishedReturn = (result: ResultSubmission) =>
  result.status === 'PUBLISHED' || result.status === 'CORRECTED';

const hasInecFigures = (result: ResultSubmission) =>
  Object.values(result.candidateVotesInec ?? {}).some((votes) => votes > 0);

const candidateVotesForSource = (
  result: ResultSubmission,
  candidateId: string,
  source: DataSource
) =>
  (source === 'INEC'
    ? result.candidateVotesInec?.[candidateId]
    : result.candidateVotes?.[candidateId]) ?? 0;

const votesCastForSource = (result: ResultSubmission, source: DataSource) =>
  source === 'INEC'
    ? Object.values(result.candidateVotesInec ?? {}).reduce((sum, v) => sum + v, 0) +
      (result.rejectedVotesInec ?? 0)
    : result.totalVotesCast;

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
    setSelectedResultId,
    setSelectedPuFilter,
    setSelectedStateFilter,
    consumePuFilter,
    setEditingDraftResult,
    setActiveTab,
    dataSource,
    setDataSource,
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

  const isFieldUser = user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';
  const isOfficerOrAbove =
    user?.role === 'ELECTION_OFFICER' ||
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'SUPER_ADMINISTRATOR';
  const isSupervisory = !isFieldUser;
  const activeDataSource: DataSource = isOfficerOrAbove ? dataSource : 'OBSERVED';
  const isInecSource = activeDataSource === 'INEC';

  const publishedReturns = React.useMemo(
    () => results.filter(isPublishedReturn),
    [results]
  );
  const inecCoveredReturns = React.useMemo(
    () => publishedReturns.filter(hasInecFigures),
    [publishedReturns]
  );
  const eligibleReturns = isInecSource ? inecCoveredReturns : publishedReturns;

  const candidateScores = React.useMemo(() => {
    let grandTotal = 0;
    const list = candidates.map((c) => {
      const votes = eligibleReturns.reduce(
        (sum, r) => sum + candidateVotesForSource(r, c.id, activeDataSource),
        0
      );
      grandTotal += votes;
      return { ...c, votes };
    });

    return list
      .map((c) => ({
        ...c,
        pct: grandTotal > 0 ? (c.votes / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [candidates, eligibleReturns, activeDataSource]);

  const grandTotalVotes = React.useMemo(() => {
    return candidateScores.reduce((acc, c) => acc + c.votes, 0);
  }, [candidateScores]);

  // Candidate agent is tied to
  const myCandidateId = user?.watchCandidateId ?? 'cand3';
  const myCandidate = candidateScores.find((c) => c.id === myCandidateId) ?? candidateScores[0];
  const winningCandidate = candidateScores[0];

  const draftSubmissions = results.filter((r) => r.status === 'DRAFT');

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

  // Base assigned polling units cluster in Ikeja
  const baseAssignedPus = React.useMemo(() => [
    {
      id: 'pu-s25-lga-1-1',
      name: 'PU 001 - Ikeja Grammar School, Ward A',
      code: 'PU/25/01/01/001',
      lga: 'Ikeja',
      state: 'Lagos',
    },
    {
      id: 'pu-s25-lga-1-2',
      name: 'PU 002 - Alausa Community Center',
      code: 'PU/25/01/01/002',
      lga: 'Ikeja',
      state: 'Lagos',
    },
    {
      id: 'pu-s25-lga-1-3',
      name: 'PU 003 - Allen Avenue Junction Hall',
      code: 'PU/25/01/02/003',
      lga: 'Ikeja',
      state: 'Lagos',
    },
  ], []);

  // Derive dynamic status, vote counts, and matching draft from store results (SSOT)
  const assignedPus = React.useMemo(() => {
    return baseAssignedPus.map((pu) => {
      const matching = results.find(
        (r) =>
          r.pollingUnitId === pu.id ||
          r.pollingUnitName.toLowerCase().includes(pu.code.toLowerCase()) ||
          r.pollingUnitName.toLowerCase().includes(pu.name.toLowerCase())
      );

      if (matching) {
        return {
          ...pu,
          status: matching.status,
          votes: votesCastForSource(matching, activeDataSource),
          accredited: matching.totalAccreditedVoters,
          hasInecDeclaration: hasInecFigures(matching),
          result: matching,
        };
      }

      return {
        ...pu,
        status: 'PENDING' as const,
        votes: 0,
        accredited: 0,
        hasInecDeclaration: false,
        result: undefined,
      };
    });
  }, [baseAssignedPus, results, activeDataSource]);

  const activePus =
    user?.role === 'POLLING_AGENT'
      ? assignedPus.filter((p) => user?.assignedLocations?.includes(p.id)).length > 0
        ? assignedPus.filter((p) => user?.assignedLocations?.includes(p.id))
        : assignedPus.slice(2, 3) // Stations PU Agent at PU 003 (draft)
      : assignedPus;

  // Search autocomplete
  const searchResults = locationSearchQuery ? electionService.searchLocations(locationSearchQuery) : [];

  const openResultsClean = () => {
    setSelectedStateFilter(null);
    consumePuFilter();
    setActiveTab('results');
  };

  const recentResults = React.useMemo(
    () =>
      results
        .filter((r) => r.status !== 'DRAFT')
        .slice()
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        .slice(0, 8),
    [results]
  );

  const incidentMarqueeItems = React.useMemo(
    () =>
      incidents.slice(0, 8).map((incident) => ({
        id: incident.id,
        tag: incident.category.replace(/_/g, ' '),
        text: `@${incident.electoralArea}: ${incident.description}`,
        meta: incident.severity,
        tone: 'danger' as const,
      })),
    [incidents]
  );

  const resultMarqueeItems = React.useMemo(
    () =>
      recentResults.map((result) => {
        const leader = candidates
          .map((candidate) => ({
            candidate,
            votes: result.candidateVotes[candidate.id] || 0,
          }))
          .sort((a, b) => b.votes - a.votes)[0];

        return {
          id: result.id,
          tag: result.status,
          text: `${result.pollingUnitName} · ${result.totalVotesCast.toLocaleString()} votes`,
          meta: leader
            ? `${leader.candidate.partyAcronym} ${leader.votes.toLocaleString()}`
            : undefined,
          tone: 'success' as const,
        };
      }),
    [recentResults, candidates]
  );

  // Quick Actions Grid (Search Results / Enter Results, Incident Control, Collation Room, Locations)
  const renderQuickActions = () => (
    <div className="grid grid-cols-2 gap-2.5">
      {isSupervisory ? (
        <>
          <button
            onClick={openResultsClean}
            className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-[#10B981]/50 transition group flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white group-hover:text-[#10B981] transition truncate">Search Results</p>
              <p className="text-[10px] text-[#718579] truncate">Audit returns</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-red-500/50 transition group flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white group-hover:text-red-400 transition truncate">Incident Control</p>
              <p className="text-[10px] text-[#718579] truncate">Monitor &amp; triage</p>
            </div>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setSubmitResultOpen(true)}
            className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-[#10B981]/50 transition group flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white group-hover:text-[#10B981] transition truncate">Enter Results</p>
              <p className="text-[10px] text-[#718579] truncate">PU ballot return</p>
            </div>
          </button>

          <button
            onClick={() => setReportIncidentOpen(true)}
            className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-red-500/50 transition group flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white group-hover:text-red-400 transition truncate">Report Incident</p>
              <p className="text-[10px] text-[#718579] truncate">Live covert filing</p>
            </div>
          </button>
        </>
      )}

      <button
        onClick={openResultsClean}
        className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-amber-500/50 transition group flex items-center gap-2.5 sm:gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate">Collation Room</p>
          <p className="text-[10px] text-[#718579] truncate">Wards &amp; LGA summary</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTab('locations')}
        className="rounded-xl border border-[#1C2E24] bg-[#0E1712] p-2.5 sm:p-3 text-left hover:border-[#10B981]/50 transition group flex items-center gap-2.5 sm:gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
          <Map className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white group-hover:text-[#10B981] transition truncate">Locations</p>
          <p className="text-[10px] text-[#718579] truncate">National registry</p>
        </div>
      </button>
    </div>
  );

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Station Console Header + Horizontal Candidate Snapshot for Election Officer */}
      {isOfficerOrAbove ? (
        <div className="w-full rounded-xl border border-[#1C2E24] bg-[#0D6338]/[0.05] p-3 sm:p-3.5 lg:p-4 shadow-md backdrop-blur-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
            {/* Left Telemetry Strip (Presidential Collation + Active Source Total) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 flex-shrink-0">
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

              <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1C2E24]/60">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#718579] block leading-none">
                    {isInecSource ? 'INEC Declared' : 'Our Returns'}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-black whitespace-nowrap ${
                      isInecSource ? 'text-sky-400' : 'text-[#10B981]'
                    }`}
                  >
                    {grandTotalVotes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden xl:block h-10 w-px bg-[#1C2E24]" />

            {/* Right: Horizontal Snapshot Performance (Candidates in dead space row) */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-[#718579]">
                  {isInecSource ? (
                    <Landmark className="w-3 h-3 text-sky-400" />
                  ) : (
                    <Eye className="w-3 h-3 text-[#10B981]" />
                  )}
                  {isInecSource ? 'INEC Declared' : 'Our Returns'}
                </span>
                <div
                  role="group"
                  aria-label="Dashboard data source"
                  title="Officer control: switch dashboard figures between independent field returns and INEC declared results"
                  className="inline-flex w-full sm:w-auto items-center p-0.5 rounded-xl bg-[#070C09] border border-[#1C2E24]"
                >
                  <button
                    type="button"
                    aria-pressed={!isInecSource}
                    onClick={() => setDataSource('OBSERVED')}
                    className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      !isInecSource
                        ? 'bg-[#10B981] text-black shadow-sm'
                        : 'text-[#94A89D] hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Our Returns</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={isInecSource}
                    onClick={() => setDataSource('INEC')}
                    className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      isInecSource
                        ? 'bg-sky-500 text-black shadow-sm'
                        : 'text-[#94A89D] hover:text-white'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>INEC Declared</span>
                  </button>
                </div>
              </div>

              <p
                className={`text-[10px] ${
                  isInecSource ? 'text-sky-400/80' : 'text-[#718579]'
                }`}
              >
                {isInecSource
                  ? `${inecCoveredReturns.length} of ${publishedReturns.length} published returns carry INEC data`
                  : `${publishedReturns.length} published returns · drafts excluded`}
              </p>

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
                      <div className="flex items-center justify-between gap-1 mb-1">
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
        <div className="w-full rounded-xl border border-[#1C2E24] bg-[#0D6338]/[0.05] p-3 sm:p-3.5 lg:p-4 shadow-md backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 flex-shrink-0">
              <div className="flex items-center justify-between sm:justify-start gap-3">
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

              <div className="flex items-center gap-3 sm:gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#1C2E24]/60">
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

            {/* Right: Field Deployment Scope */}
            <div className="hidden lg:flex items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1C2E24]/60">
              <div className="h-8 w-px bg-[#1C2E24]" />
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#070C09]/80 border border-[#1C2E24]">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <div className="text-left">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#718579]">
                    Assigned Scope
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {user?.role === 'POLLING_AGENT'
                        ? (activePus[0]?.code ? `${activePus[0].code} · Ikeja` : 'PU 003 · Ikeja')
                        : 'Lagos West · Ikeja Sector'}
                    </span>
                    <span className="text-[9px] font-semibold text-[#10B981] px-1.5 py-0.5 rounded bg-[#10B981]/10">
                      {user?.role === 'POLLING_AGENT' ? 'PU' : 'Cluster'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2b. Drafts Alert Banner (Only for Field & Polling Agents) */}
      {isFieldUser && draftSubmissions.length > 0 && (
        <div
          onClick={() => {
            if (draftSubmissions.length === 1) {
              setEditingDraftResult(draftSubmissions[0]);
              setSubmitResultOpen(true);
            } else {
              setDraftsQueueOpen(true);
            }
          }}
          className="cursor-pointer rounded-2xl border border-amber-500/50 bg-amber-950/30 p-3.5 sm:p-4 shadow-md hover:bg-amber-950/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{draftSubmissions.length} Pending Result Draft{draftSubmissions.length > 1 ? 's' : ''}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ACTION REQUIRED
                </span>
              </p>
              <p className="text-xs text-[#94A89D] truncate sm:whitespace-normal">
                {draftSubmissions.length === 1
                  ? `${draftSubmissions[0].pollingUnitName} — Saved offline. Click to resume editing or publish.`
                  : 'You have saved drafts awaiting review and final publication.'}
              </p>
            </div>
          </div>

          {/* Center: Quick Telemetry Chips for Primary Draft (Eliminates dead void) */}
          {draftSubmissions.length === 1 && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex-shrink-0">
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/70 block leading-none">Tallied</span>
                <span className="font-mono font-bold text-amber-200">
                  {draftSubmissions[0].totalVotesCast.toLocaleString()} votes
                </span>
              </div>
              <div className="h-5 w-px bg-amber-500/30" />
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/70 block leading-none">Accredited</span>
                <span className="font-mono font-bold text-white">
                  {draftSubmissions[0].totalAccreditedVoters.toLocaleString()}
                </span>
              </div>
              <div className="h-5 w-px bg-amber-500/30" />
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/70 block leading-none">Form EC8A</span>
                <span className="text-[10px] font-bold text-[#10B981]">
                  {draftSubmissions[0].evidencePhotoUrl ? 'Photo Attached' : 'Pending Upload'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingDraftResult(draftSubmissions[0]);
                setSubmitResultOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-sm"
            >
              <span>Resume Editing</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {draftSubmissions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDraftsQueueOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#121F18] border border-[#1C2E24] text-[#94A89D] hover:text-white font-bold text-xs transition"
              >
                Queue ({draftSubmissions.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Executive Mid-Section for Election Officer: Tactical Heat Map (Reduced Width) & AI Projection Side-by-Side */}
      {isOfficerOrAbove && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Tactical Heat Map with reduced width */}
          <div className="transition-all duration-300 flex flex-col">
            <NigeriaHeatMap compact dataSource={activeDataSource} />
          </div>

          {/* Right Column: AI Projection Engine + Tactical Command Actions */}
          <div className="space-y-4 flex flex-col">
            {/* AI Election Projection Engine */}
            <div className="rounded-2xl border-2 border-[#10B981] bg-[#0E1712] p-5 shadow-xl flex flex-col gap-4">
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

            {/* AI Neural Simulation Intelligence — always fills remaining space */}
            <div className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-4 flex-1 flex flex-col justify-between space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579]">
                NEURAL SIMULATION INTELLIGENCE
              </span>

              {projection ? (
                /* Win Probability + Confidence row */
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0E1712] rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#718579] block">
                      WIN PROBABILITY
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-[#10B981]">
                        {projection.winProbability}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#121F18] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700"
                        style={{ width: `${projection.winProbability}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#0E1712] rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#718579] block">
                      MODEL CONFIDENCE
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-blue-400">
                        {projection.confidenceScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#121F18] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-700"
                        style={{ width: `${projection.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Idle state — no projection run yet */
                <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#10B981]/50" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#718579]">Awaiting Simulation Input</p>
                    <p className="text-[11px] text-[#718579]/60 mt-0.5">
                      Select a candidate and geographic scope above to run the neural projection model.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Command Quick Actions */}
          {renderQuickActions()}
        </div>
      </div>
    )}

      {/* 3. Candidate Snapshot Performance (For Field Agents & Polling Agents - Compact Horizontal Card Grid) */}
      {!isOfficerOrAbove && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">Snapshot Performance</h2>
              <span className="text-[11px] text-[#718579] hidden sm:inline">
                · Live top candidates ranked by verified vote tally
              </span>
            </div>
            {winningCandidate && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold">
                <Trophy className="w-3 h-3" />
                <span>{winningCandidate.fullName} Leading</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {candidateScores.map((cand) => {
              const rank = candidateScores.findIndex((c) => c.id === cand.id) + 1;
              const isWinner = rank === 1;
              const isMyCandidate = cand.id === myCandidate?.id;
              const partyCol = PARTY_COLORS[cand.partyAcronym] || '#10B981';

              return (
                <div
                  key={cand.id}
                  className={`rounded-lg border p-2.5 transition flex flex-col justify-between ${
                    isMyCandidate
                      ? 'border-[#10B981] bg-[#121F18]/60 ring-1 ring-[#10B981]'
                      : isWinner
                      ? 'border-[#10B981]/40 bg-[#121F18]/20'
                      : 'border-[#1C2E24] bg-[#070C09]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
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
        </Card>
      )}

      {/* Two-Column Responsive Section: Assigned Polling Units & Operations / Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 5. Assigned Polling Units (app/(app)/(tabs)/index.tsx lines 718-849) */}
        <Card className="space-y-4">
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
              const hasDeclaration = !isInecSource || pu.hasInecDeclaration;
              const isDeclared = isInecSource ? pu.hasInecDeclaration : isPub;
              const displayStatus = isInecSource
                ? pu.hasInecDeclaration
                  ? 'DECLARED'
                  : 'NOT DECLARED'
                : pu.status;
              const auditDisabled =
                isSupervisory && (isInecSource ? !pu.hasInecDeclaration : isDraft);

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
                        isDeclared
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : !isInecSource && isDraft
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isDeclared ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : !isInecSource && isDraft ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                      <span>{displayStatus}</span>
                    </div>
                  </div>

                  {/* Operational Telemetry for Single Assigned PU (Polling Agent) */}
                  {user?.role === 'POLLING_AGENT' && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0E1712] border border-[#1C2E24] text-center">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#718579] font-bold block">
                          Votes Cast
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {pu.votes.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-x border-[#1C2E24]">
                        <span className="text-[9px] uppercase tracking-wider text-[#718579] font-bold block">
                          Accredited
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {pu.accredited}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#718579] font-bold block">
                          Status
                        </span>
                        <span className={`text-xs font-bold ${isDraft ? 'text-amber-400' : isPub ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          {isDraft ? 'Offline Draft' : isPub ? 'Transmitted' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#1C2E24] text-xs">
                    <span className="text-[#718579]">
                      {!hasDeclaration
                        ? pu.result
                          ? `No INEC declaration on record · field return ${pu.status.toLowerCase()}`
                          : 'No INEC declaration on record'
                        : isPub
                        ? `${pu.votes.toLocaleString()} ${
                            isInecSource ? 'declared by INEC' : 'votes tallied'
                          } (${pu.accredited.toLocaleString()} accredited)`
                        : isDraft
                        ? `Draft: ${pu.votes.toLocaleString()} votes tallied (${pu.accredited.toLocaleString()} accredited)`
                        : isInecSource
                        ? `${pu.votes.toLocaleString()} declared by INEC`
                        : 'Awaiting accredited ballot entry'}
                    </span>

                    <button
                      disabled={auditDisabled}
                      onClick={() => {
                        if (auditDisabled) return;
                        if (isSupervisory || isPub) {
                          if (pu.result) {
                            setSelectedResultId(pu.result.id);
                          } else {
                            setSelectedPuFilter(pu.name);
                          }
                          setActiveTab('results');
                        } else if (isDraft) {
                          const draftToEdit = pu.result || draftSubmissions[0];
                          if (draftToEdit) {
                            setEditingDraftResult(draftToEdit);
                            setSubmitResultOpen(true);
                          } else {
                            setDraftsQueueOpen(true);
                          }
                        } else {
                          setEditingDraftResult(null);
                          setSubmitResultOpen(true);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        auditDisabled
                          ? 'bg-[#1C2E24] text-amber-500/50 cursor-not-allowed opacity-60'
                          : isPub || isSupervisory
                          ? 'bg-[#1C2E24] text-white hover:bg-[#253D30]'
                          : 'bg-[#10B981] text-black hover:bg-emerald-400'
                      }`}
                    >
                      <span>
                        {auditDisabled
                          ? isInecSource
                            ? 'Not Declared'
                            : 'Unsubmitted'
                          : isSupervisory
                          ? 'Audit'
                          : isPub
                          ? 'View'
                          : isDraft
                          ? 'Resume'
                          : 'Submit'}
                      </span>
                      {!auditDisabled && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Quick Actions + Live Stream */}
        <div className="space-y-6">
          {/* 6. Quick Actions Grid (For Field / Polling Agents where mid-section is hidden) */}
          {!isOfficerOrAbove && renderQuickActions()}

          {/* 7. Live Field Stream — incidents and returns as they arrive */}
          {(incidentMarqueeItems.length > 0 || resultMarqueeItems.length > 0) && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Live Field Stream</h2>
                  <p className="text-xs text-[#718579]">
                    {incidents.length} incidents · {recentResults.length} returns logged
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs font-bold text-[#10B981] hover:underline"
                  >
                    Incidents
                  </button>
                  <button
                    onClick={openResultsClean}
                    className="text-xs font-bold text-[#10B981] hover:underline"
                  >
                    Results
                  </button>
                </div>
              </div>

              <LiveMarquee
                label="Incidents"
                tone="danger"
                items={incidentMarqueeItems}
                ariaLabel="Live incident stream"
                onItemClick={(id) => {
                  setSelectedIncidentId(id);
                  setActiveTab('incidents');
                }}
              />

              <LiveMarquee
                label="Returns"
                tone="success"
                items={resultMarqueeItems}
                ariaLabel="Latest submitted returns"
                onItemClick={(id) => {
                  setSelectedResultId(id);
                  setActiveTab('results');
                }}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
