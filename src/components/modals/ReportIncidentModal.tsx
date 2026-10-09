import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { electionService } from '../../services/electionService';
import { IncidentReport, IncidentCategory, IncidentSeverity } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  AlertTriangle,
  Camera,
  Mic,
  StopCircle,
  Loader2,
} from 'lucide-react';

interface ReportIncidentContentProps {
  onClose: () => void;
  onSubmitReport: (incident: IncidentReport) => void;
  defaultPuId: string;
  userEmail?: string;
}

const ReportIncidentContent: React.FC<ReportIncidentContentProps> = ({
  onClose,
  onSubmitReport,
  defaultPuId,
  userEmail,
}) => {
  useModalA11y({ isOpen: true, onClose });

  const pollingUnits = electionService.getPollingUnits();

  const [category, setCategory] = useState<IncidentCategory>('VOTE_BUYING');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [selectedPuId, setSelectedPuId] = useState<string>(
    defaultPuId || pollingUnits[0]?.id || ''
  );
  const [description, setDescription] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 120-second audio recorder timer simulation (as requested in PRD Part 7)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 120) {
            // Auto-stop at 2 minutes
            setIsRecordingAudio(false);
            setMediaUrls((m) => [...m, 'covert_audio_evidence_2min.m4a']);
            return 120;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const toggleRecording = () => {
    if (isRecordingAudio) {
      setIsRecordingAudio(false);
      setMediaUrls((m) => [...m, `covert_audio_${recordSeconds}s.m4a`]);
    } else {
      setRecordSeconds(0);
      setIsRecordingAudio(true);
    }
  };

  const handleCapturePhoto = () => {
    setMediaUrls((m) => [
      ...m,
      'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800',
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const pu = pollingUnits.find((p) => p.id === selectedPuId);

    const newIncident: IncidentReport = {
      id: `inc-${Date.now()}`,
      electionId: 'e1',
      pollingUnitId: pu?.id,
      electoralArea: pu
        ? `${pu.lgaName}, ${pu.stateName} (${pu.code})`
        : 'National Field Zone',
      category,
      severity,
      status: 'SUBMITTED',
      description:
        description.trim() ||
        `Urgent field irregularity recorded at ${pu?.name || 'specified location'}. Evidence collected.`,
      latitude: pu?.latitude || 6.595,
      longitude: pu?.longitude || 3.342,
      mediaUrls,
      reportedBy: userEmail || 'observer@iaquila.com.ng',
      reportedAt: new Date().toISOString(),
    };

    onSubmitReport(newIncident);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E1712] border border-red-900/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Report Field Incident
              </h2>
              <p className="text-xs text-[#718579]">
                Live transmission to accredited command situation desk
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Dropdown */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1">
              Incident Category:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="VIOLENCE">VIOLENCE / ARMED DISRUPTION</option>
              <option value="BALLOT_SNATCHING">BALLOT BOX SNATCHING</option>
              <option value="VOTE_BUYING">VOTE BUYING &amp; SOLICITATION</option>
              <option value="VOTER_INTIMIDATION">VOTER INTIMIDATION / HARASSMENT</option>
              <option value="BVAS_FAILURE">BVAS BIOMETRIC DEVICE FAILURE</option>
              <option value="LATE_MATERIALS">LATE ARRIVAL OF SENSITIVE MATERIALS</option>
              <option value="LATE_OFFICIALS">INEC OFFICIAL ABSENTEEISM</option>
              <option value="PU_NOT_OPEN">POLLING UNIT NOT OPENED</option>
              <option value="OVER_VOTING">OVER-VOTING DETECTED</option>
              <option value="UNDER_AGE_VOTING">UNDER-AGE VOTER REGISTRATION</option>
              <option value="SECURITY_INCIDENT">SECURITY FORCE ABSENCE / COLLUSION</option>
              <option value="WEATHER_DISRUPTION">WEATHER / LOGISTICAL SEVERITY</option>
              <option value="OTHER">OTHER IRREGULARITY</option>
            </select>
          </div>

          {/* Severity Radio Buttons */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1.5">
              Severity Level:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    severity === s
                      ? s === 'CRITICAL'
                        ? 'bg-red-600 text-white border-red-500'
                        : s === 'HIGH'
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-[#070C09] text-[#94A89D] border-[#1C2E24] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location Selector */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1">
              Polling Unit / Geographic Cluster:
            </label>
            <select
              value={selectedPuId}
              onChange={(e) => setSelectedPuId(e.target.value)}
              className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {pollingUnits.map((pu) => (
                <option key={pu.id} value={pu.id}>
                  {pu.name} ({pu.code}) • {pu.lgaName}, {pu.stateName}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[#94A89D] uppercase tracking-wider block mb-1">
              Field Observation Details:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide objective facts: sequence of events, individuals involved, current safety status..."
              className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl p-3 text-xs text-white placeholder-[#718579] focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Covert Photo & Audio Capture Simulation (PRD Part 7) */}
          <div className="space-y-2 pt-2 border-t border-[#1C2E24]">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Evidence Attachments (Live Field Capture Only)
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Photo button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="p-3 rounded-2xl bg-[#070C09] border border-[#1C2E24] hover:border-emerald-500/40 text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Snap Live Photo</span>
              </button>

              {/* Audio recording button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  isRecordingAudio
                    ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse'
                    : 'bg-[#070C09] border-[#1C2E24] text-white hover:border-red-500/40'
                }`}
              >
                {isRecordingAudio ? (
                  <>
                    <StopCircle className="w-4 h-4 text-red-400" />
                    <span>Stop ({recordSeconds}s / 120s)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-red-400" />
                    <span>Covert Audio (2m max)</span>
                  </>
                )}
              </button>
            </div>

            {mediaUrls.length > 0 && (
              <div className="p-2 bg-[#070C09] rounded-xl border border-[#1C2E24] text-[11px] text-emerald-400">
                ✓ {mediaUrls.length} evidence file(s) attached and verified
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C2E24]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-[#718579] hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Transmit Urgent Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ReportIncidentModal: React.FC = () => {
  const { isReportIncidentOpen, setReportIncidentOpen, addIncident, user } =
    useAppStore();

  if (!isReportIncidentOpen) return null;

  return (
    <ReportIncidentContent
      onClose={() => setReportIncidentOpen(false)}
      onSubmitReport={addIncident}
      defaultPuId={user?.selectedPollingUnitId || ''}
      userEmail={user?.email}
    />
  );
};
