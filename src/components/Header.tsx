import React, { useState } from 'react';
import { useAppStore, PREDEFINED_ACCOUNTS } from '../store';
import {
  FileText,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    user,
    loginWithAccount,
    results,
    setSubmitResultOpen,
    setReportIncidentOpen,
    setDraftsQueueOpen,
    setActiveTab,
  } = useAppStore();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const draftsCount = results.filter((r) => r.status === 'DRAFT').length;

  const isFieldAgent =
    user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';

  const roleBadgeColor =
    user?.role === 'ELECTION_OFFICER'
      ? 'bg-purple-900/60 text-purple-200 border-purple-700/60'
      : user?.role === 'FIELD_AGENT'
      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
      : 'bg-amber-950/80 text-amber-300 border-amber-600/60';

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

  return (
    <header className="sticky top-0 z-40 bg-[#070C09]/95 backdrop-blur-md border-b border-[#1C2E24] px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0D6338] to-[#10B981] p-1 shadow-lg shadow-emerald-950/50 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/assets/eagle-head.png"
                alt="iAquila"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">iAQUILA</span>
                <span
                  title="iAquila Real-time Election Intelligence Platform"
                  className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block"
                >
                  2027 ELECTION
                </span>
              </div>
              <p className="text-[11px] text-[#718579] font-medium leading-none hidden sm:block">
                trusted election intelligence in real time
              </p>
            </div>
          </div>

          {/* Live Status Indicator */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#1C2E24]">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E1712] border border-[#1C2E24]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                LIVE
              </span>
              <span className="text-[10px] text-[#718579] font-medium hidden lg:inline">
                · Synced
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & User Account Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Field Agent Actions (Submit Result, Report Incident, Drafts Queue) - Only for Polling Unit & Field Agents per PRD Pages 13-16 */}
          {isFieldAgent && (
            <>
              {/* Drafts Alert Badge */}
              {draftsCount > 0 && (
                <button
                  onClick={() => setDraftsQueueOpen(true)}
                  title="Drafts Queue"
                  aria-label="Drafts Queue"
                  className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Drafts</span>
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-black text-[10px] sm:text-[11px] font-bold flex items-center justify-center">
                    {draftsCount}
                  </span>
                </button>
              )}

              {/* Submit Result CTA */}
              <button
                onClick={() => setSubmitResultOpen(true)}
                title="Submit Result"
                aria-label="Submit Result"
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#0D6338] hover:bg-[#15803D] text-white text-xs font-semibold transition shadow-sm shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Submit Result</span>
              </button>

              {/* Report Incident CTA */}
              <button
                onClick={() => setReportIncidentOpen(true)}
                title="Report Incident"
                aria-label="Report Incident"
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-800/50 text-xs font-semibold transition shrink-0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Report Incident</span>
              </button>
            </>
          )}

          {/* Supervisory / Management Role Indicator */}
          {!isFieldAgent && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0E1712] border border-[#1C2E24] text-xs text-[#94A89D]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">Supervisory Command</span>
            </div>
          )}

          {/* Role & Org Switcher Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#0E1712] hover:bg-[#15241D] border border-[#1C2E24] transition text-left"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-[#10B981]/30 to-[#0D6338]/30 flex items-center justify-center text-[10px] sm:text-xs font-bold text-emerald-300">
                {user?.name?.slice(0, 2).toUpperCase() || 'AQ'}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-[#718579] truncate max-w-[120px]">
                  {user?.organizationName}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor} hidden sm:inline-block`}
              >
                {roleLabel}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#718579] hidden xs:block sm:block" />
            </button>

            {/* Switch Account Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0E1712] border border-[#1C2E24] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-[#1C2E24]">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Observer Identity
                  </p>
                  <p className="text-[11px] text-[#718579]">
                    Switch between predefined role personas to test workflow restrictions.
                  </p>
                </div>
                <div className="py-1 space-y-1">
                  {PREDEFINED_ACCOUNTS.map((acc) => {
                    const isSelected = user?.email === acc.email;
                    return (
                      <button
                        key={acc.email}
                        onClick={() => {
                          loginWithAccount(acc);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-[#15241D] border border-emerald-500/30'
                            : 'hover:bg-[#121F18] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{acc.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              acc.role === 'ELECTION_OFFICER'
                                ? 'bg-purple-900/60 text-purple-300'
                                : acc.role === 'FIELD_AGENT'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {acc.roleTitle.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium">
                          {acc.organizationName}
                        </p>
                        <p className="text-[10px] text-[#718579] line-clamp-2">
                          {acc.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-[#1C2E24] px-2 flex justify-between items-center text-[11px] text-[#718579]">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      setActiveTab('profile');
                    }}
                    className="text-[#94A89D] hover:text-white font-semibold"
                  >
                    View Dossier
                  </button>
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      useAppStore.getState().logout();
                    }}
                    className="text-red-400 hover:text-red-300 font-bold"
                  >
                    Sign Out →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
