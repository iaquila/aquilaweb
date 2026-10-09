import React, { useState } from 'react';
import { useAppStore } from '../store';
import { electionService } from '../services/electionService';
import {
  MapPin,
  History,
  Award,
  Star,
} from 'lucide-react';
import { Card } from '../components/Card';

export const ElectionsView: React.FC = () => {
  const {
    selectedCycleId,
    setSelectedCycleId,
    selectedElectionId,
    setSelectedElectionId,
    user,
    setWatchCandidate,
  } = useAppStore();

  const cycles = electionService.getCycles();
  const elections = electionService.getElections(selectedCycleId);
  const activeElection =
    elections.find((e) => e.id === selectedElectionId) || elections[0];

  const candidates = activeElection
    ? electionService.getCandidates(activeElection.id)
    : [];

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) ||
    candidates[0] ||
    null;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Cycle Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Elections &amp; Candidates</h1>
          <p className="text-xs text-[#718579]">
            Certified electoral contests, ballot candidates, and historical cross-cycle party movements
          </p>
        </div>

        {/* Cycle Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {cycles.map((cycle) => {
            const isSelected = selectedCycleId === cycle.id;
            return (
              <button
                key={cycle.id}
                onClick={() => {
                  setSelectedCycleId(cycle.id);
                  const firstInCycle = electionService.getElections(cycle.id)[0];
                  if (firstInCycle) setSelectedElectionId(firstInCycle.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#0D6338] to-[#10B981] text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-[#0E1712] text-[#94A89D] border-[#1C2E24] hover:text-white'
                }`}
              >
                {cycle.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Election Selector (Left 4 cols) & Election Details / Candidates (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contests in this cycle */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 shadow-xl">
            <h2 className="text-xs font-bold text-[#718579] uppercase tracking-wider px-2 mb-3">
              Ballot Positions ({elections.length})
            </h2>

            <div className="space-y-2">
              {elections.map((election) => {
                const isSelected = activeElection?.id === election.id;
                return (
                  <div
                    key={election.id}
                    onClick={() => {
                      setSelectedElectionId(election.id);
                      const cands = electionService.getCandidates(election.id);
                      setSelectedCandidateId(cands[0]?.id || null);
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border text-left flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#15241D] border-emerald-500/60 shadow-sm'
                        : 'bg-[#070C09] border-[#1C2E24] hover:border-[#2C4436]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {election.position}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          election.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : election.status === 'COMPLETED'
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {election.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#718579]">
                      <MapPin className="w-3 h-3 text-[#10B981]" />
                      <span>{election.electoralArea}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#718579] pt-1">
                      <span>Date: {election.electionDate}</span>
                      <span>{election.candidateCount} Candidates</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Election Overview & Candidate Party Histories */}
        <div className="lg:col-span-8 space-y-6">
          {activeElection && (
            <Card className="p-6 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1C2E24]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeElection.electoralAreaType} CONTEST
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1.5">
                    {activeElection.position} — {activeElection.electoralArea}
                  </h2>
                  <p className="text-xs text-[#718579] mt-0.5">
                    Scheduled Election Day: {activeElection.electionDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-[#15241D] px-3 py-1.5 rounded-xl border border-[#1C2E24]">
                    {candidates.length} Registered Candidates
                  </span>
                </div>
              </div>

              {/* Candidate Cards Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#718579] uppercase tracking-wider">
                  Accredited Ballot Nominees
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((cand) => {
                    const isWatched = user?.watchCandidateId === cand.id;
                    const isSelected = selectedCandidate?.id === cand.id;

                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#15241D] border-emerald-500 shadow-md'
                            : 'bg-[#070C09] border-[#1C2E24] hover:border-[#2C4436]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cand.partyColor || '#10B981' }}
                              />
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {cand.partyAcronym}
                              </span>
                              <span className="text-[11px] text-[#718579] truncate max-w-[140px]">
                                {cand.partyName}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWatchCandidate(cand.id);
                              }}
                              title="Set as Watch Candidate"
                              className="text-[#718579] hover:text-amber-400 transition"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isWatched ? 'text-amber-400 fill-amber-400' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <h4 className="text-base font-bold text-white mt-2">
                            {cand.fullName}
                          </h4>
                          {cand.runningMate && (
                            <p className="text-xs text-[#94A89D]">
                              Running Mate: <strong className="text-white">{cand.runningMate}</strong>
                            </p>
                          )}
                        </div>

                        {/* Quick indicator of historical data */}
                        {cand.partyHistory && cand.partyHistory.length > 0 && (
                          <div className="pt-2 border-t border-[#121F18] flex items-center justify-between text-[11px] text-[#718579]">
                            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                              <History className="w-3 h-3" />
                              {cand.partyHistory.length} Past Cycles on Record
                            </span>
                            <span>Inspect Dossier →</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Candidate Detailed Dossier & Party History (PRD Part 2) */}
              {selectedCandidate && (
                <div className="bg-[#070C09] border border-[#1C2E24] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1C2E24]">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Candidate Electoral Dossier: {selectedCandidate.fullName}
                        </h4>
                        <p className="text-xs text-[#718579]">
                          Party: {selectedCandidate.partyName} ({selectedCandidate.partyAcronym})
                        </p>
                      </div>
                    </div>
                    {user?.watchCandidateId === selectedCandidate.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Primary Watch Candidate
                      </span>
                    )}
                  </div>

                  {/* Candidate Party History & Cross-Party Movements */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-[#718579] uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      Historical Electoral Returns &amp; Party Allegiance
                    </h5>

                    {selectedCandidate.partyHistory && selectedCandidate.partyHistory.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCandidate.partyHistory.map((hist, idx) => (
                          <div
                            key={idx}
                            className="bg-[#0E1712] border border-[#1C2E24] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs">
                                  {hist.electionYear}
                                </span>
                                <span className="text-xs font-semibold text-emerald-300">
                                  {hist.electionName}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#718579]">
                                Ticket: {hist.partyName} ({hist.partyAcronym})
                              </p>
                            </div>

                            <div className="sm:text-right font-mono">
                              <span className="text-white font-bold block">
                                {hist.votes.toLocaleString()} votes
                              </span>
                              <span className="text-emerald-400 text-[11px]">
                                {hist.percentage}% vote share
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#718579] italic p-3 bg-[#0E1712] rounded-xl">
                        No previous national contested cycles recorded in database. First-time principal ticket.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
