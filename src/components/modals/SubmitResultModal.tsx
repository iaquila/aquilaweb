import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { electionService } from '../../services/electionService';
import { ResultSubmission } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  FileText,
  Camera,
  MapPin,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface SubmitResultContentProps {
  onClose: () => void;
  onSaveResult: (result: ResultSubmission, isDraft: boolean) => void;
  defaultPuId: string;
  userEmail?: string;
  assignedLocations?: string[];
  initialDraft?: ResultSubmission | null;
}

const SubmitResultContent: React.FC<SubmitResultContentProps> = ({
  onClose,
  onSaveResult,
  defaultPuId,
  userEmail,
  assignedLocations,
  initialDraft,
}) => {
  useModalA11y({ isOpen: true, onClose });

  const candidates = electionService.getCandidates('e1');
  const allPollingUnits = electionService.getPollingUnits();

  const [selectedPuId, setSelectedPuId] = useState(
    initialDraft?.pollingUnitId || defaultPuId || allPollingUnits[0]?.id || ''
  );
  const [accreditedVoters, setAccreditedVoters] = useState<number>(
    initialDraft?.totalAccreditedVoters ?? 650
  );
  const [rejectedVotes, setRejectedVotes] = useState<number>(
    initialDraft?.rejectedVotes ?? 8
  );
  const [votes, setVotes] = useState<Record<string, number>>(
    initialDraft?.candidateVotes
      ? { ...initialDraft.candidateVotes }
      : {
          cand1: 260,
          cand2: 195,
          cand3: 140,
          cand4: 42,
        }
  );
  const [photoAttached, setPhotoAttached] = useState<boolean>(
    initialDraft ? !!initialDraft.evidencePhotoUrl : true
  );
  const [note, setNote] = useState<string>(
    initialDraft?.note || 'Form EC8A documented and verified on-site by parallel observer.'
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPu = allPollingUnits.find((p) => p.id === selectedPuId);

  // Calculate sum of candidate votes
  const candidateVotesSum = Object.values(votes).reduce((a, b) => a + (b || 0), 0);
  const totalVotesCast = candidateVotesSum + rejectedVotes;

  const handleVoteChange = (candidateId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setVotes((prev) => ({ ...prev, [candidateId]: num }));
  };

  const handleSave = (isDraft: boolean) => {
    if (isSubmitting) return;

    if (!selectedPu) {
      setValidationError('Please select a valid polling unit.');
      return;
    }

    if (totalVotesCast > accreditedVoters) {
      setValidationError(
        `Critical Validation Error: Total votes cast (${totalVotesCast}) cannot exceed accredited voters (${accreditedVoters}). Please verify tallies.`
      );
      return;
    }

    setIsSubmitting(true);

    const newResult: ResultSubmission = {
      id: initialDraft?.id || `r-${Date.now()}`,
      electionId: 'e1',
      pollingUnitId: selectedPu.id,
      pollingUnitName: selectedPu.name,
      candidateVotes: { ...votes },
      candidateVotesInec: isDraft
        ? { cand1: 0, cand2: 0, cand3: 0, cand4: 0 }
        : {
            cand1: votes.cand1 || 0,
            cand2: votes.cand2 || 0,
            cand3: votes.cand3 || 0,
            cand4: votes.cand4 || 0,
          },
      rejectedVotes,
      rejectedVotesInec: isDraft ? 0 : rejectedVotes,
      totalAccreditedVoters: accreditedVoters,
      totalVotesCast,
      status: isDraft ? 'DRAFT' : 'PUBLISHED',
      latitude: selectedPu.latitude || 6.55,
      longitude: selectedPu.longitude || 3.35,
      submittedAt: initialDraft?.submittedAt || new Date().toISOString(),
      submittedBy: userEmail || 'observer@iaquila.com.ng',
      evidencePhotoUrl: photoAttached
        ? 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800'
        : undefined,
      note,
    };

    onSaveResult(newResult, isDraft);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {initialDraft ? 'Edit Form EC8A Result Draft' : 'Record Polling Unit Result (Form EC8A)'}
              </h2>
              <p className="text-xs text-[#718579]">
                {initialDraft
                  ? 'Update offline draft tallies, voter accreditation, and parallel observations'
                  : 'Independent Observer Parallel Vote Tabulation Entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#718579] hover:text-white hover:bg-[#15241D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Polling Unit Selector */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1.5">
              Select Polling Unit:
            </label>
            <select
              value={selectedPuId}
              onChange={(e) => setSelectedPuId(e.target.value)}
              className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {allPollingUnits.map((pu) => {
                const isAssigned = assignedLocations?.includes(pu.id);
                return (
                  <option key={pu.id} value={pu.id}>
                    {isAssigned ? '★ [Assigned] ' : ''}
                    {pu.name} ({pu.code})
                  </option>
                );
              })}
            </select>
            {selectedPu && (
              <p className="text-[11px] text-[#718579] mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {selectedPu.wardName} • {selectedPu.lgaName}, {selectedPu.stateName}
              </p>
            )}
          </div>

          {/* Accreditation Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#94A89D] block mb-1">
                Total Accredited Voters (BVAS count):
              </label>
              <input
                type="number"
                min="0"
                value={accreditedVoters}
                onChange={(e) => setAccreditedVoters(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#94A89D] block mb-1">
                Rejected / Void Ballots:
              </label>
              <input
                type="number"
                min="0"
                value={rejectedVotes}
                onChange={(e) => setRejectedVotes(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Candidate Votes Breakdown & Real-Time Tally Meter */}
          <div className="space-y-3 pt-2 border-t border-[#1C2E24]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Recorded Candidate Votes Cast
              </label>
              <span className="text-xs font-mono text-[#718579]">
                Valid: <strong className="text-white">{candidateVotesSum}</strong> | Total Cast:{' '}
                <strong className={totalVotesCast > accreditedVoters ? 'text-red-400' : 'text-emerald-400'}>
                  {totalVotesCast}
                </strong>
              </span>
            </div>

            {/* Real-Time Form Tally Validation Meter */}
            <div
              className={`rounded-xl border p-3 bg-[#070C09] space-y-2 transition-all duration-300 ${
                totalVotesCast > accreditedVoters
                  ? 'border-red-500/60 bg-red-950/20'
                  : totalVotesCast === accreditedVoters
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-[#1C2E24]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>Accreditation Balance</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                      totalVotesCast > accreditedVoters
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                        : totalVotesCast === accreditedVoters
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {totalVotesCast > accreditedVoters
                      ? `EXCEEDED BY ${(totalVotesCast - accreditedVoters).toLocaleString()}`
                      : totalVotesCast === accreditedVoters
                      ? '100% RECONCILED'
                      : `${(accreditedVoters - totalVotesCast).toLocaleString()} BALLOTS REMAINING`}
                  </span>
                </span>
                <span className="font-mono text-xs text-[#94A89D]">
                  <strong className={totalVotesCast > accreditedVoters ? 'text-red-400' : 'text-white'}>
                    {totalVotesCast.toLocaleString()}
                  </strong>
                  {' / '}
                  <span className="text-[#718579]">{accreditedVoters.toLocaleString()}</span>
                </span>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="w-full bg-[#1C2E24] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, accreditedVoters > 0 ? (totalVotesCast / accreditedVoters) * 100 : 0)}%`,
                    backgroundColor:
                      totalVotesCast > accreditedVoters
                        ? '#EF4444'
                        : totalVotesCast === accreditedVoters
                        ? '#10B981'
                        : '#34D399',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-[#070C09] border border-[#1C2E24] p-3 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cand.partyColor || '#10B981' }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {cand.partyAcronym}
                      </span>
                      <span className="text-[10px] text-[#718579] truncate max-w-[120px] block">
                        {cand.shortName}
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={votes[cand.id] ?? 0}
                    onChange={(e) => handleVoteChange(cand.id, e.target.value)}
                    className="w-24 bg-[#0E1712] border border-[#1C2E24] rounded-lg px-2.5 py-1 text-sm font-mono text-right text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form EC8A Photographic Proof Simulator */}
          <div className="pt-2 border-t border-[#1C2E24] space-y-2">
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block">
              Form EC8A Result Sheet Photographic Proof
            </label>
            <div className="p-3 bg-[#070C09] border border-[#1C2E24] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {photoAttached ? 'EC8A_Scan_001_Signed.jpg' : 'No photo captured yet'}
                  </p>
                  <p className="text-[10px] text-[#718579]">
                    GPS and timestamp embedded automatically in EXIF metadata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoAttached(!photoAttached)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  photoAttached
                    ? 'bg-[#15241D] text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-500 text-black'
                }`}
              >
                {photoAttached ? 'Retake Photo' : 'Capture Photo'}
              </button>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] block mb-1">
              Field Observer Audit Note:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. EC8A signed by all party agents without protest..."
              className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-[#1C2E24]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-[#718579] hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#15241D] hover:bg-[#1C2E24] text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isSubmitting ? 'Saving...' : initialDraft ? 'Save Updated Draft' : 'Save as Draft Queue'}</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting || totalVotesCast > accreditedVoters}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white text-xs font-bold transition shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isSubmitting ? 'Publishing...' : 'Publish Live Result'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SubmitResultModal: React.FC = () => {
  const {
    isSubmitResultOpen,
    setSubmitResultOpen,
    addResult,
    updateResult,
    user,
    setDraftsQueueOpen,
    editingDraftResult,
    setEditingDraftResult,
  } = useAppStore();

  if (!isSubmitResultOpen) return null;

  const defaultPuId =
    editingDraftResult?.pollingUnitId ||
    user?.selectedPollingUnitId ||
    user?.assignedLocations?.[0] ||
    '';

  const handleClose = () => {
    setEditingDraftResult(null);
    setSubmitResultOpen(false);
  };

  const handleSaveResult = (newResult: ResultSubmission, isDraft: boolean) => {
    if (editingDraftResult) {
      updateResult(editingDraftResult.id, newResult);
    } else {
      addResult(newResult);
    }
    setEditingDraftResult(null);
    setSubmitResultOpen(false);
    if (isDraft) {
      setDraftsQueueOpen(true);
    }
  };

  return (
    <SubmitResultContent
      onClose={handleClose}
      onSaveResult={handleSaveResult}
      defaultPuId={defaultPuId}
      userEmail={user?.email}
      assignedLocations={user?.assignedLocations}
      initialDraft={editingDraftResult}
    />
  );
};
