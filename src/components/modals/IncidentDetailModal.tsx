import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { IncidentStatus, IncidentReport } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Camera,
} from 'lucide-react';

interface IncidentDetailContentProps {
  incident: IncidentReport;
  onClose: () => void;
  onUpdate: (id: string, status: IncidentStatus, note: string) => void;
}

const IncidentDetailContent: React.FC<IncidentDetailContentProps> = ({
  incident,
  onClose,
  onUpdate,
}) => {
  useModalA11y({ isOpen: true, onClose });

  const { user } = useAppStore();
  const canTriage =
    user?.role === 'SUPER_ADMINISTRATOR' ||
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'ELECTION_OFFICER';

  const [newStatus, setNewStatus] = useState<IncidentStatus>(incident.status);
  const [resolutionText, setResolutionText] = useState<string>(
    incident.resolutionNote || ''
  );

  const handleUpdate = () => {
    if (!canTriage) return;
    onUpdate(incident.id, newStatus, resolutionText);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E1712] border border-red-900/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2E24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-red-500 text-white'
                      : incident.severity === 'HIGH'
                      ? 'bg-amber-500 text-black'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {incident.severity}
                </span>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  {incident.category.replace(/_/g, ' ')}
                </h2>
              </div>
              <p className="text-[11px] text-[#718579] mt-0.5">
                Report ID: {incident.id}
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

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Metadata */}
          <div className="bg-[#070C09] border border-[#1C2E24] p-3.5 rounded-2xl space-y-1.5 text-[11px] text-[#718579]">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span className="text-white font-medium">{incident.electoralArea}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-400" />
              <span>Reported by: {incident.reportedBy}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span>Time: {new Date(incident.reportedAt).toLocaleString()}</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              Field Description:
            </h4>
            <div className="p-3 bg-[#070C09] rounded-xl border border-[#1C2E24] text-xs text-white leading-relaxed">
              {incident.description}
            </div>
          </div>

          {/* Attached Evidence */}
          {incident.mediaUrls.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Evidence Media ({incident.mediaUrls.length})
              </h4>
              <div className="space-y-2">
                {incident.mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#070C09] border border-[#1C2E24] rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="text-emerald-400 truncate max-w-[240px]">
                      {url.includes('http') ? 'live_camera_capture_001.jpg' : url}
                    </span>
                    <span className="text-[10px] text-[#718579]">Secure Encrypted</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incident Triage Status: HQ Supervisory Controls vs Field Agent Read-Only Feed */}
          <div className="space-y-3 pt-3 border-t border-[#1C2E24]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Command Room Triage Status
              </h4>
              {!canTriage && (
                <span className="text-[10px] text-[#718579] font-medium">
                  Supervisory Controlled
                </span>
              )}
            </div>

            {canTriage ? (
              <>
                <div>
                  <label className="text-[11px] text-[#718579] block mb-1">
                    Update Status:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                          newStatus === st
                            ? st === 'RESOLVED'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : st === 'UNDER_REVIEW'
                              ? 'bg-amber-500 text-black border-amber-400'
                              : 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#070C09] text-[#94A89D] border-[#1C2E24]'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#718579] block mb-1">
                    Resolution / Response Note:
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Details of security intervention, INEC re-supply, or resolution..."
                    className="w-full bg-[#070C09] border border-[#1C2E24] rounded-xl p-2.5 text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2.5 bg-[#070C09] border border-[#1C2E24] rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#718579] uppercase font-bold">Current Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      incident.status === 'RESOLVED'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : incident.status === 'UNDER_REVIEW'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                        : 'bg-blue-950/80 text-blue-300 border-blue-700'
                    }`}
                  >
                    {incident.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {incident.resolutionNote ? (
                  <div className="bg-[#121F18] border border-emerald-900/40 p-2.5 rounded-xl text-[11px] text-emerald-300">
                    <strong className="text-emerald-400 block mb-0.5">Headquarters Directive / Resolution:</strong>
                    {incident.resolutionNote}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#718579] italic">
                    Under active review by accredited Election Officers &amp; Situation Room desk.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1C2E24] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-bold ${
              canTriage
                ? 'text-[#718579] hover:text-white'
                : 'rounded-xl bg-[#1C2E24] hover:bg-[#253D30] text-white'
            }`}
          >
            {canTriage ? 'Cancel' : 'Close'}
          </button>
          {canTriage && (
            <button
              onClick={handleUpdate}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white text-xs font-bold transition shadow-sm"
            >
              Save Triage Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const IncidentDetailModal: React.FC = () => {
  const {
    selectedIncidentId,
    setSelectedIncidentId,
    incidents,
    updateIncidentStatus,
  } = useAppStore();

  if (!selectedIncidentId) return null;

  const incident = incidents.find((i) => i.id === selectedIncidentId);
  if (!incident) return null;

  return (
    <IncidentDetailContent
      key={incident.id}
      incident={incident}
      onClose={() => setSelectedIncidentId(null)}
      onUpdate={updateIncidentStatus}
    />
  );
};
