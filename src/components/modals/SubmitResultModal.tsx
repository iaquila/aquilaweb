import React, { useEffect, useRef, useState } from 'react';
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
  Upload,
  Sparkles,
  Lock,
} from 'lucide-react';

const DEFAULT_OBSERVED_VOTES: Record<string, number> = {
  cand1: 260,
  cand2: 195,
  cand3: 140,
  cand4: 42,
};

interface SubmitResultContentProps {
  onClose: () => void;
  onSaveResult: (result: ResultSubmission, isDraft: boolean) => void;
  defaultPuId: string;
  userEmail?: string;
  assignedLocations?: string[];
  initialDraft?: ResultSubmission | null;
  isPollingAgent?: boolean;
}

const SubmitResultContent: React.FC<SubmitResultContentProps> = ({
  onClose,
  onSaveResult,
  defaultPuId,
  userEmail,
  assignedLocations,
  initialDraft,
  isPollingAgent = false,
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
  const [accreditedInec, setAccreditedInec] = useState<number>(
    initialDraft ? initialDraft.accreditedVotersInec ?? 0 : 650
  );
  const [rejectedVotes, setRejectedVotes] = useState<number>(
    initialDraft?.rejectedVotes ?? 8
  );
  const [rejectedInec, setRejectedInec] = useState<number>(
    initialDraft ? initialDraft.rejectedVotesInec ?? 0 : 8
  );
  const [cancelledVotes, setCancelledVotes] = useState<number>(
    initialDraft?.cancelledVotes ?? 0
  );
  const [cancelledInec, setCancelledInec] = useState<number>(
    initialDraft?.cancelledVotesInec ?? 0
  );
  const [votes, setVotes] = useState<Record<string, number>>(
    initialDraft?.candidateVotes
      ? { ...initialDraft.candidateVotes }
      : { ...DEFAULT_OBSERVED_VOTES }
  );
  const [inecVotes, setInecVotes] = useState<Record<string, number>>(
    initialDraft ? { ...initialDraft.candidateVotesInec } : { ...DEFAULT_OBSERVED_VOTES }
  );
  const [photoAttached, setPhotoAttached] = useState<boolean>(
    initialDraft ? !!initialDraft.evidencePhotoUrl : false
  );
  const [note, setNote] = useState<string>(
    initialDraft?.note || 'Form EC8A documented and verified on-site by parallel observer.'
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [captureName, setCaptureName] = useState<string | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [captureIsImage, setCaptureIsImage] = useState<boolean>(
    initialDraft ? !!initialDraft.evidencePhotoUrl : false
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractionTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (extractionTimerRef.current) {
        window.clearTimeout(extractionTimerRef.current);
      }
    },
    []
  );

  const lockedPuId = isPollingAgent ? assignedLocations?.[0] ?? defaultPuId : null;
  const effectivePuId = lockedPuId ?? selectedPuId;
  const selectedPu = allPollingUnits.find((p) => p.id === effectivePuId);

  const runDemoExtraction = () => {
    if (!selectedPu) return;

    if (extractionTimerRef.current) {
      window.clearTimeout(extractionTimerRef.current);
    }

    setIsExtracting(true);
    setValidationError(null);
    setExtractionNotice(null);

    extractionTimerRef.current = window.setTimeout(() => {
      const registered = selectedPu.registeredVoters ?? 700;
      const accredited = Math.max(1, Math.round(registered * 0.84));
      const rejected = Math.max(1, Math.round(accredited * 0.012));
      const totalCast = Math.max(1, accredited - Math.round(accredited * 0.04));
      const valid = Math.max(0, totalCast - rejected);
      const shares = [0.41, 0.31, 0.21, 0.07];
      let remaining = valid;
      const nextVotes: Record<string, number> = {};

      candidates.forEach((candidate, index) => {
        const isLast = index === candidates.length - 1;
        const value = isLast
          ? remaining
          : Math.round(valid * (shares[index] ?? 0.05));
        nextVotes[candidate.id] = Math.max(0, value);
        remaining -= nextVotes[candidate.id];
      });

      setAccreditedVoters(accredited);
      setAccreditedInec(accredited);
      setRejectedVotes(rejected);
      setRejectedInec(rejected);
      setCancelledVotes(0);
      setCancelledInec(0);
      setVotes(nextVotes);
      setInecVotes({ ...nextVotes });
      setNote(
        'Form EC8A captured and auto-extracted — verify figures against the uploaded sheet before publishing.'
      );
      setIsExtracting(false);
      setExtractionNotice('Demo extraction complete. Verify every figure against the sheet.');
      extractionTimerRef.current = null;
    }, 1200);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    setCaptureName(file.name);
    setCaptureIsImage(isImage);
    setPhotoAttached(true);
    setExtractionNotice(null);
    setValidationError(null);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturePreview(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(file);
    } else {
      setCapturePreview(null);
    }

    runDemoExtraction();
  };

  // Ballot accounting: observed field count vs what INEC's uploaded record says.
  const observedVoteTotal = Object.values(votes).reduce((sum, value) => sum + (value || 0), 0);
  const inecVoteTotal = Object.values(inecVotes).reduce((sum, value) => sum + (value || 0), 0);
  const ballotsCastObserved = observedVoteTotal + rejectedVotes;
  const ballotsCastInec = inecVoteTotal + rejectedInec;
  const unaccountedObserved =
    accreditedVoters - (observedVoteTotal + rejectedVotes + cancelledVotes);
  const exceedsAccredited = accreditedVoters > 0 && ballotsCastObserved > accreditedVoters;
  const accreditationOverdrawn = accreditedVoters > 0 && unaccountedObserved < 0;
  const ballotIntegrityOk = !exceedsAccredited && !accreditationOverdrawn;
  const totalVotesCast = ballotsCastObserved;

  const handleVoteChange = (
    candidateId: string,
    source: 'observed' | 'inec',
    val: string
  ) => {
    const num = parseInt(val, 10) || 0;
    if (source === 'inec') {
      setInecVotes((prev) => ({ ...prev, [candidateId]: num }));
    } else {
      setVotes((prev) => ({ ...prev, [candidateId]: num }));
    }
  };

  const handleAutoMatchInec = () => {
    setInecVotes({ ...votes });
    setAccreditedInec(accreditedVoters);
    setRejectedInec(rejectedVotes);
    setCancelledInec(cancelledVotes);
  };

  const handleSave = (isDraft: boolean) => {
    if (isSubmitting || isExtracting) return;

    if (!selectedPu || !effectivePuId) {
      setValidationError('Please select a valid polling unit.');
      return;
    }

    setValidationError(null);

    if (!isDraft) {
      if (accreditedVoters === 0) {
        setValidationError('Enter the total accredited voter count from BVAS.');
        return;
      }

      if (!ballotIntegrityOk) {
        const proceed = window.confirm(
          `Ballot accounting mismatch: ${ballotsCastObserved} cast against ${accreditedVoters} accredited. Publish anyway for collation audit?`
        );
        if (!proceed) return;
      }
    }

    setIsSubmitting(true);

    const newResult: ResultSubmission = {
      id: initialDraft?.id || `r-${Date.now()}`,
      electionId: 'e1',
      pollingUnitId: effectivePuId,
      pollingUnitName: selectedPu.name,
      candidateVotes: { ...votes },
      candidateVotesInec: { ...inecVotes },
      rejectedVotes,
      rejectedVotesInec: rejectedInec,
      totalAccreditedVoters: accreditedVoters,
      accreditedVotersInec: accreditedInec,
      cancelledVotes,
      cancelledVotesInec: cancelledInec,
      totalVotesCast,
      status: isDraft ? 'DRAFT' : 'PUBLISHED',
      latitude: selectedPu.latitude || 6.55,
      longitude: selectedPu.longitude || 3.35,
      submittedAt: initialDraft?.submittedAt || new Date().toISOString(),
      submittedBy: userEmail || 'observer@iaquila.com.ng',
      evidencePhotoUrl: photoAttached
        ? capturePreview ??
          initialDraft?.evidencePhotoUrl ??
          'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800'
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
          {/* Polling Unit */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1.5">
              {isPollingAgent ? 'Assigned Polling Unit:' : 'Select Polling Unit:'}
            </label>
            {isPollingAgent ? (
              <div className="p-3 bg-[#070C09] border border-[#1C2E24] rounded-xl flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {selectedPu?.name ?? 'Assigned Polling Unit'}
                  </p>
                  <p className="text-[10px] text-[#718579] truncate">
                    {selectedPu
                      ? `${selectedPu.code} · ${selectedPu.wardName} · ${selectedPu.lgaName}, ${selectedPu.stateName}`
                      : 'Polling unit details unavailable'}
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Ballot Accounting: observed field count vs INEC record */}
          <div className="space-y-3 pt-2 border-t border-[#1C2E24]">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Observed vs. INEC Record
              </span>
              <span className="text-[10px] text-[#718579]">
                Ballot accounting — left is what your agent observed, right is what INEC recorded.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[9px] font-bold uppercase tracking-wider text-[#718579]">
              <span>Observed</span>
              <span>INEC Record</span>
            </div>

            {[
              {
                label: 'Accredited',
                observed: accreditedVoters,
                inec: accreditedInec,
                onObserved: setAccreditedVoters,
                onInec: setAccreditedInec,
              },
              {
                label: 'Rejected',
                observed: rejectedVotes,
                inec: rejectedInec,
                onObserved: setRejectedVotes,
                onInec: setRejectedInec,
              },
              {
                label: 'Cancelled',
                observed: cancelledVotes,
                inec: cancelledInec,
                onObserved: setCancelledVotes,
                onInec: setCancelledInec,
              },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] text-[#718579] block mb-1">{row.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={row.observed}
                    onChange={(e) => row.onObserved(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-[#718579] block mb-1">{row.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={row.inec}
                    onChange={(e) => row.onInec(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            ))}

            <div className="rounded-xl border border-[#1C2E24] bg-[#070C09] p-3 space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[9px] font-bold uppercase tracking-wider text-[#718579]">
                <span>Derived</span>
                <span className="text-right">Observed</span>
                <span className="text-right">INEC</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs">
                <span className="text-[#94A89D]">Valid votes (sum of candidates)</span>
                <span className="font-mono font-bold text-white text-right">
                  {observedVoteTotal.toLocaleString()}
                </span>
                <span className="font-mono font-bold text-emerald-400 text-right">
                  {inecVoteTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs border-t border-[#1C2E24] pt-2">
                <span className="text-[#94A89D]">Total ballots cast</span>
                <span className="font-mono font-bold text-white text-right">
                  {ballotsCastObserved.toLocaleString()}
                </span>
                <span className="font-mono font-bold text-emerald-400 text-right">
                  {ballotsCastInec.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs border-t border-[#1C2E24] pt-2">
                <span className="text-[#94A89D]">Accredited, no ballot cast</span>
                <span
                  className={`font-mono font-bold text-right ${
                    unaccountedObserved < 0 ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {unaccountedObserved.toLocaleString()}
                </span>
                <span className="font-mono font-bold text-[#718579] text-right">—</span>
              </div>
            </div>
          </div>

          {/* Candidate Votes Breakdown & Real-Time Tally Meter */}
          <div className="space-y-3 pt-2 border-t border-[#1C2E24]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Candidate Ballots Tally
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#718579]">
                  Valid: <strong className="text-white">{observedVoteTotal}</strong> | Total Cast:{' '}
                  <strong className={exceedsAccredited ? 'text-red-400' : 'text-emerald-400'}>
                    {ballotsCastObserved}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleAutoMatchInec}
                  className="px-2.5 py-1 rounded-lg bg-[#15241D] border border-[#1C2E24] text-[10px] font-bold text-emerald-300 hover:border-emerald-500/40 transition shrink-0"
                >
                  Match INEC
                </button>
              </div>
            </div>

            {/* Real-Time Form Tally Validation Meter */}
            <div
              className={`rounded-xl border p-3 bg-[#070C09] space-y-2 transition-all duration-300 ${
                exceedsAccredited || accreditationOverdrawn
                  ? 'border-red-500/60 bg-red-950/20'
                  : ballotsCastObserved === accreditedVoters
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-[#1C2E24]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>Accreditation Balance</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                      exceedsAccredited || accreditationOverdrawn
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                        : ballotsCastObserved === accreditedVoters
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {exceedsAccredited
                      ? `EXCEEDED BY ${(ballotsCastObserved - accreditedVoters).toLocaleString()}`
                      : accreditationOverdrawn
                      ? 'INTEGRITY MISMATCH'
                      : ballotsCastObserved === accreditedVoters
                      ? '100% RECONCILED'
                      : `${(accreditedVoters - ballotsCastObserved).toLocaleString()} BALLOTS REMAINING`}
                  </span>
                </span>
                <span className="font-mono text-xs text-[#94A89D]">
                  <strong className={exceedsAccredited ? 'text-red-400' : 'text-white'}>
                    {ballotsCastObserved.toLocaleString()}
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
                    width: `${Math.min(100, accreditedVoters > 0 ? (ballotsCastObserved / accreditedVoters) * 100 : 0)}%`,
                    backgroundColor:
                      exceedsAccredited || accreditationOverdrawn
                        ? '#EF4444'
                        : ballotsCastObserved === accreditedVoters
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
                  className="bg-[#070C09] border border-[#1C2E24] p-3 rounded-xl space-y-2"
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
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#718579] block mb-1">
                        Observed
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={votes[cand.id] ?? 0}
                        onChange={(e) => handleVoteChange(cand.id, 'observed', e.target.value)}
                        className="w-full bg-[#0E1712] border border-[#1C2E24] rounded-lg px-2.5 py-1 text-sm font-mono text-right text-white focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#718579] block mb-1">
                        INEC
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={inecVotes[cand.id] ?? 0}
                        onChange={(e) => handleVoteChange(cand.id, 'inec', e.target.value)}
                        className="w-full bg-[#0E1712] border border-[#1C2E24] rounded-lg px-2.5 py-1 text-sm font-mono text-right text-white focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form EC8A Capture + Demo Extraction */}
          <div className="pt-2 border-t border-[#1C2E24] space-y-2">
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block">
              Form EC8A Result Sheet
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 bg-[#070C09] border border-[#1C2E24] rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    {isExtracting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : captureIsImage ? (
                      <Camera className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {captureName ??
                        (photoAttached ? 'EC8A sheet attached' : 'No EC8A sheet captured yet')}
                    </p>
                    <p className="text-[10px] text-[#718579]">
                      {isExtracting
                        ? 'Reading EC8A figures...'
                        : captureName || photoAttached
                        ? 'Signed sheet attached · auto-read for tally entry.'
                        : 'Capture or upload the signed sheet to auto-fill the tallies.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {photoAttached && (
                    <button
                      type="button"
                      onClick={() => {
                        setCaptureName(null);
                        setCapturePreview(null);
                        setCaptureIsImage(false);
                        setPhotoAttached(false);
                        setExtractionNotice(null);
                      }}
                      className="text-[10px] font-bold text-[#718579] hover:text-red-400 transition"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#15241D] text-emerald-300 border border-emerald-500/40 text-xs font-bold transition disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{photoAttached ? 'Replace' : 'Capture / Upload'}</span>
                  </button>
                </div>
              </div>

              {capturePreview && (
                <div className="rounded-xl border border-[#1C2E24] overflow-hidden bg-[#070C09]">
                  <img
                    src={capturePreview}
                    alt="EC8A sheet preview"
                    className="w-full max-h-40 object-contain"
                  />
                </div>
              )}

              {extractionNotice && (
                <p className="text-[10px] text-emerald-300/80 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {extractionNotice}
                </p>
              )}

              <p className="text-[10px] text-[#718579]">
                Demo extraction fills the tallies from the sheet. Swap in the EC8A OCR/Gemini
                service for production.
              </p>
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
            disabled={isSubmitting || isExtracting}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#15241D] hover:bg-[#1C2E24] text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isSubmitting ? 'Saving...' : initialDraft ? 'Save Updated Draft' : 'Save as Draft Queue'}</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting || isExtracting}
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
      isPollingAgent={user?.role === 'POLLING_AGENT'}
    />
  );
};
