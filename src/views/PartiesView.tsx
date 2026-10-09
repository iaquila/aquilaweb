import React, { useState } from 'react';
import { electionService } from '../services/electionService';
import { PARTY_COLORS } from '../constants';

export const PartiesView: React.FC = () => {
  const parties = electionService.getParties();
  const candidates = electionService.getCandidates('e1');
  const [activeTab, setActiveTab] = useState<'candidates' | 'parties'>('candidates');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Block matching app/(app)/parties.tsx */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">Parties &amp; Candidate Directory</h1>
          <p className="text-xs text-[#718579]">
            INEC registered political entities and candidate party affiliations
          </p>
        </div>

        {/* Tab Switcher: Candidates & History vs Registered Parties */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#0E1712] border border-[#1C2E24]">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'candidates'
                ? 'bg-[#10B981] text-black shadow-md'
                : 'text-[#94A89D] hover:text-white'
            }`}
          >
            Candidates &amp; History ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'parties'
                ? 'bg-[#10B981] text-black shadow-md'
                : 'text-[#94A89D] hover:text-white'
            }`}
          >
            Registered Parties ({parties.length})
          </button>
        </div>
      </div>

      {activeTab === 'candidates' ? (
        <div className="space-y-4">
          {candidates.map((cand) => {
            const pColor = PARTY_COLORS[cand.partyAcronym] || '#10B981';

            return (
              <div
                key={cand.id}
                className="bg-[#0E1712] border border-[#1C2E24] rounded-2xl p-5 shadow-lg space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2E24]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{cand.fullName}</h2>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${pColor}26`,
                          color: pColor,
                        }}
                      >
                        {cand.partyAcronym}
                      </span>
                    </div>
                    <p className="text-xs text-[#718579] mt-0.5">
                      Running Mate: <strong className="text-white">{cand.runningMate}</strong>
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    Candidate #{cand.candidateNumber}
                  </span>
                </div>

                {/* Political Migration History Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#718579] mb-2">
                    Electoral History &amp; Party Affiliations
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cand.partyHistory && cand.partyHistory.length > 0 ? (
                      cand.partyHistory.map((hist, idx) => (
                        <div
                          key={idx}
                          className="bg-[#070C09] border border-[#1C2E24] rounded-xl p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{hist.electionYear}</span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                              style={{
                                backgroundColor: `${PARTY_COLORS[hist.partyAcronym] || '#10B981'}26`,
                                color: PARTY_COLORS[hist.partyAcronym] || '#10B981',
                              }}
                            >
                              {hist.partyAcronym}
                            </span>
                          </div>
                          <p className="text-[#94A89D] text-[11px] truncate">{hist.electionName}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#718579] pt-1 border-t border-[#121F18]">
                            <span>{hist.votes.toLocaleString()} votes</span>
                            <span className="font-bold text-white">{hist.percentage}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#718579]">No prior cycles on record.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {parties.map((party) => (
            <div
              key={party.id}
              className="bg-[#0E1712] border border-[#1C2E24] rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-[#1C2E24]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: party.color }}
                    />
                    <div>
                      <span className="text-lg font-black text-white font-mono">
                        {party.acronym}
                      </span>
                      <span className="text-[10px] block font-bold text-emerald-400">
                        Code: {party.code}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {party.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 leading-snug">
                  {party.name}
                </h3>

                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-center justify-between text-[#718579]">
                    <span>National Chairman:</span>
                    <strong className="text-white font-medium">
                      {party.nationalChairman}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#718579]">
                    <span>Founded:</span>
                    <strong className="text-white font-medium">
                      {party.founded ?? '—'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
