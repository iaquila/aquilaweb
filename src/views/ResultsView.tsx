import React, { useState } from 'react';
import { useAppStore } from '../store';
import { electionService } from '../services/electionService';
import {
  Search,
  AlertTriangle,
  FileText,
  Plus,
  MapPin,
  Vote,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { Card } from '../components/Card';

export const ResultsView: React.FC = () => {
  const {
    results,
    setSubmitResultOpen,
    setDraftsQueueOpen,
    setSelectedResultId,
    user,
    selectedStateFilter,
    consumePuFilter,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState(selectedStateFilter || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'SUBMITTED' | 'DRAFT'>('ALL');

  React.useEffect(() => {
    const puFilter = consumePuFilter();
    if (puFilter) {
      setSearchQuery(puFilter);
    } else if (selectedStateFilter) {
      setSearchQuery(selectedStateFilter);
    }
  }, [consumePuFilter, selectedStateFilter]);

  const candidates = electionService.getCandidates('e1');

  // Filter results
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.pollingUnitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const draftsCount = results.filter((r) => r.status === 'DRAFT').length;

  const isFieldAgent =
    user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Results Collation &amp; Audit</h1>
          <p className="text-xs text-[#718579]">
            Independent Polling Unit ballot tallies, form EC8A image audits, and parallel voter reconciliation
          </p>
        </div>

        {isFieldAgent && (
          <div className="flex items-center gap-2.5">
            {draftsCount > 0 && (
              <button
                onClick={() => setDraftsQueueOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Drafts Queue ({draftsCount})</span>
              </button>
            )}

            <button
              onClick={() => setSubmitResultOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white text-xs font-bold transition shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Polling Unit Result</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Collation Executive Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 shadow-lg">
          <span className="text-[10px] font-bold text-[#718579] uppercase tracking-wider block">
            TOTAL PU RETURNS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{results.length}</span>
            <span className="text-xs text-[#10B981] font-semibold">100% Ingestion</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg">
          <span className="text-[10px] font-bold text-[#718579] uppercase tracking-wider block">
            ACCREDITED VOTERS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {results.reduce((sum, r) => sum + r.totalAccreditedVoters, 0).toLocaleString()}
            </span>
            <span className="text-xs text-[#718579]">BVAS verified</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg">
          <span className="text-[10px] font-bold text-[#718579] uppercase tracking-wider block">
            VERIFIED BALLOTS CAST
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#10B981] font-mono">
              {results.reduce((sum, r) => sum + r.totalVotesCast, 0).toLocaleString()}
            </span>
            <span className="text-xs text-[#10B981] font-semibold">Valid</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg">
          <span className="text-[10px] font-bold text-[#718579] uppercase tracking-wider block">
            PARALLEL AUDIT ALERTS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {
                results.filter((r) => {
                  if (r.status !== 'PUBLISHED') return false;
                  return candidates.some(
                    (c) =>
                      Math.abs(
                        (r.candidateVotes[c.id] || 0) -
                          (r.candidateVotesInec[c.id] || 0)
                      ) > 0
                  );
                }).length
              }
            </span>
            <span className="text-xs text-amber-400">Variances</span>
          </div>
        </Card>
      </div>

      {/* Search Bar & Status Filters */}
      <Card className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by polling unit name, code, or observer..."
            className="w-full pl-9 pr-4 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'PUBLISHED', 'SUBMITTED', 'DRAFT'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-[#15241D] text-emerald-400 border border-emerald-500/40'
                  : 'text-[#94A89D] hover:text-white hover:bg-[#121F18]'
              }`}
            >
              {filter === 'ALL' ? 'All Records' : filter}
            </button>
          ))}
        </div>
      </Card>

      {/* Collation Table Cards */}
      <div className="space-y-3">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => {
            // Check for discrepancy between Field and INEC official report
            let hasDiscrepancy = false;
            if (result.status === 'PUBLISHED') {
              for (const c of candidates) {
                const fVal = result.candidateVotes[c.id] || 0;
                const iVal = result.candidateVotesInec[c.id] || 0;
                if (Math.abs(fVal - iVal) > 0) hasDiscrepancy = true;
              }
            }

            return (
              <Card
                key={result.id}
                onClick={() => {
                  if (result.status === 'DRAFT') {
                    if (isFieldAgent) setDraftsQueueOpen(true);
                    // supervisors: no action — draft is uncertified, no EC8A
                    return;
                  }
                  setSelectedResultId(result.id);
                }}
                className={`p-4 lg:p-5 transition shadow-md space-y-4 ${
                  result.status === 'DRAFT' && !isFieldAgent
                    ? 'opacity-75 cursor-default border-amber-500/20 hover:border-amber-500/30'
                    : 'hover:border-emerald-500/50 cursor-pointer'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1C2E24]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {result.pollingUnitName}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          result.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : result.status === 'SUBMITTED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {result.status}
                      </span>
                      {hasDiscrepancy && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Parallel Variance
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#718579] mt-0.5">
                      Submitted by: {result.submittedBy} • {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Accredited
                      </span>
                      <span className="text-white font-bold">
                        {result.totalAccreditedVoters}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Votes Cast
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {result.totalVotesCast}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Rejected
                      </span>
                      <span className="text-red-400 font-bold">
                        {result.rejectedVotes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Draft Gate — supervisor cannot read uncertified field work */}
                {result.status === 'DRAFT' && !isFieldAgent ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/25">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-400">Unsubmitted Field Draft</p>
                      <p className="text-[11px] text-[#718579] mt-0.5">Numbers are unverified and uncertified. No EC8A form has been transmitted. Audit detail is locked until the field agent submits.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Candidate Vote Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {candidates.map((cand) => {
                        const votes = result.candidateVotes[cand.id] || 0;
                        const inecVotes = result.candidateVotesInec[cand.id] || 0;
                        const variance = votes - inecVotes;

                        return (
                          <div
                            key={cand.id}
                            className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: cand.partyColor || '#10B981' }}
                                />
                                <span className="font-bold text-white">
                                  {cand.partyAcronym}
                                </span>
                              </div>
                              {result.status === 'PUBLISHED' && variance !== 0 && (
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    variance > 0 ? 'text-red-400' : 'text-amber-400'
                                  }`}
                                >
                                  {variance > 0 ? `+${variance}` : variance}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between font-mono">
                              <span className="text-base font-extrabold text-white">
                                {votes}
                              </span>
                              {result.status === 'PUBLISHED' && (
                                <span className="text-[10px] text-[#718579]">
                                  INEC: {inecVotes}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer bar */}
                    <div className="flex items-center justify-between text-[11px] text-[#718579] pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        GPS: {result.latitude?.toFixed(4)}, {result.longitude?.toFixed(4)}
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        View Audit Detail &amp; Proof →
                      </span>
                    </div>
                  </>
                )}
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={Vote}
            title="No Results Found"
            subtitle="No polling unit result records match your query or filter."
            description="Adjust your search keywords or clear status filters to view polling unit collation returns."
            actionLabel={searchQuery || statusFilter !== 'ALL' ? 'Reset Filters' : undefined}
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />
        )}
      </div>
    </div>
  );
};
