import React from 'react';
import { useAppStore } from '../../store';
import { electionService } from '../../services/electionService';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

export const DraftsQueueModal: React.FC = () => {
  const {
    isDraftsQueueOpen,
    setDraftsQueueOpen,
    results,
    publishDraft,
    deleteResult,
    setEditingDraftResult,
    setSubmitResultOpen,
  } = useAppStore();

  useModalA11y({
    isOpen: isDraftsQueueOpen,
    onClose: () => setDraftsQueueOpen(false),
  });

  if (!isDraftsQueueOpen) return null;

  const drafts = results.filter((r) => r.status === 'DRAFT');
  const candidates = electionService.getCandidates('e1');

  return (
    <div
      onClick={() => setDraftsQueueOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E1712] border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Drafts Queue ({drafts.length})
              </h2>
              <p className="text-xs text-[#718579]">
                Offline &amp; pending polling unit returns awaiting live publication
              </p>
            </div>
          </div>
          <button
            onClick={() => setDraftsQueueOpen(false)}
            className="p-1.5 rounded-xl text-[#718579] hover:text-white hover:bg-[#15241D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drafts List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {drafts.length > 0 ? (
            drafts.map((draft) => {
              return (
                <div
                  key={draft.id}
                  className="bg-[#070C09] border border-[#1C2E24] rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {draft.pollingUnitName}
                      </h4>
                      <p className="text-[11px] text-[#718579] mt-0.5">
                        Recorded: {new Date(draft.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Draft Saved
                    </span>
                  </div>

                  {/* Summary of tallies */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0E1712] p-2.5 rounded-xl border border-[#1C2E24] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Accredited
                      </span>
                      <span className="text-white font-bold">
                        {draft.totalAccreditedVoters}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Votes Cast
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {draft.totalVotesCast}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#718579] uppercase block">
                        Rejected
                      </span>
                      <span className="text-red-400 font-bold">
                        {draft.rejectedVotes}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Vote Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {candidates.map((cand) => (
                      <span
                        key={cand.id}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-[#121F18] border border-[#1C2E24] text-[#94A89D]"
                      >
                        <strong className="text-white">{cand.partyAcronym}:</strong>{' '}
                        {draft.candidateVotes[cand.id] ?? 0}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#121F18]">
                    <button
                      onClick={() => deleteResult(draft.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingDraftResult(draft);
                        setDraftsQueueOpen(false);
                        setSubmitResultOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#15241D] hover:bg-[#1C2E24] text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Draft</span>
                    </button>
                    <button
                      onClick={() => publishDraft(draft.id)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Publish Live Now</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-[#718579]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p>Queue is empty. All entered results have been published!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#1C2E24] flex justify-end">
          <button
            onClick={() => setDraftsQueueOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#718579] hover:text-white"
          >
            Close Queue
          </button>
        </div>
      </div>
    </div>
  );
};
