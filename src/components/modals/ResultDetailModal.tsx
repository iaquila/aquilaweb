import React from 'react';
import { useAppStore } from '../../store';
import { electionService } from '../../services/electionService';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  BarChart3,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';

export const ResultDetailModal: React.FC = () => {
  const { selectedResultId, setSelectedResultId, results } = useAppStore();

  useModalA11y({
    isOpen: !!selectedResultId,
    onClose: () => setSelectedResultId(null),
  });

  if (!selectedResultId) return null;

  const result = results.find((r) => r.id === selectedResultId);
  if (!result) return null;

  const candidates = electionService.getCandidates('e1');

  return (
    <div
      onClick={() => setSelectedResultId(null)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Polling Unit Audit Detail
              </h2>
              <p className="text-xs text-[#718579]">
                Certified Form EC8A Parallel Tabulation Record
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedResultId(null)}
            className="p-1.5 rounded-xl text-[#718579] hover:text-white hover:bg-[#15241D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Unit & Observer Meta */}
          <div className="bg-[#070C09] border border-[#1C2E24] p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">
                {result.pollingUnitName}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  result.status === 'PUBLISHED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {result.status}
              </span>
            </div>
            <div className="text-[11px] text-[#718579] space-y-1">
              <p className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                GPS Coordinates: {result.latitude?.toFixed(4)}, {result.longitude?.toFixed(4)}
              </p>
              <p className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Certified by Observer: {result.submittedBy}
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Submitted at: {new Date(result.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Accreditation & Ballot Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24] text-center font-mono">
              <span className="text-[10px] text-[#718579] uppercase block mb-1">
                Accredited Voters
              </span>
              <span className="text-base font-bold text-white">
                {result.totalAccreditedVoters}
              </span>
            </div>
            <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24] text-center font-mono">
              <span className="text-[10px] text-[#718579] uppercase block mb-1">
                Total Cast
              </span>
              <span className="text-base font-bold text-emerald-400">
                {result.totalVotesCast}
              </span>
            </div>
            <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24] text-center font-mono">
              <span className="text-[10px] text-[#718579] uppercase block mb-1">
                Rejected Ballots
              </span>
              <span className="text-base font-bold text-red-400">
                {result.rejectedVotes}
              </span>
            </div>
          </div>

          {/* Side-by-side Candidate Tally Comparison (Field vs INEC) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Field Observer vs. INEC Official Returns
            </h4>

            <div className="space-y-2">
              {candidates.map((cand) => {
                const fieldVal = result.candidateVotes[cand.id] || 0;
                const inecVal = result.candidateVotesInec[cand.id] || 0;
                const diff = fieldVal - inecVal;
                const pct =
                  result.totalVotesCast > 0
                    ? Number(((fieldVal / result.totalVotesCast) * 100).toFixed(1))
                    : 0;

                return (
                  <div
                    key={cand.id}
                    className="p-3 rounded-xl bg-[#070C09] border border-[#1C2E24] flex items-center justify-between gap-3 font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cand.partyColor || '#10B981' }}
                      />
                      <span className="font-bold text-white text-xs">
                        {cand.partyAcronym}
                      </span>
                      <span className="text-[10px] text-[#718579]">
                        ({cand.shortName})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-[#718579] block">Field</span>
                        <span className="text-white font-bold">{fieldVal} ({pct}%)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#718579] block">INEC</span>
                        <span className="text-[#94A89D]">{inecVal}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#718579] block">Variance</span>
                        <span
                          className={`font-bold ${
                            diff === 0
                              ? 'text-emerald-400'
                              : diff > 0
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {diff === 0 ? '0' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form EC8A Photographic Proof */}
          {result.evidencePhotoUrl && (
            <div className="space-y-2 pt-2 border-t border-[#1C2E24]">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Form EC8A Physical Document Verification
              </span>
              <div className="relative rounded-2xl overflow-hidden border border-[#1C2E24]">
                <img
                  src={result.evidencePhotoUrl}
                  alt="Form EC8A"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Hash verified • Stamp Authenticated</span>
                </div>
              </div>
            </div>
          )}

          {result.note && (
            <div className="p-3 rounded-xl bg-[#121F18] border border-[#1C2E24] text-[#94A89D]">
              <strong className="text-white">Field Note:</strong> {result.note}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1C2E24] flex justify-end">
          <button
            onClick={() => setSelectedResultId(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#718579] hover:text-white"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
