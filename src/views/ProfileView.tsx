import React from 'react';
import { useAppStore, PREDEFINED_ACCOUNTS } from '../store';
import { electionService } from '../services/electionService';
import { Card } from '../components/Card';
import {
  Star,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, loginWithAccount, setWatchCandidate, results, incidents } =
    useAppStore();

  const candidates = electionService.getCandidates('e1');

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white">Observer Field Dossier &amp; Identity</h1>
        <p className="text-xs text-[#718579]">
          Accreditation credentials, assigned polling unit clusters, and non-partisan observer telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Observer Credential Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#1C2E24]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D6338] to-[#10B981] p-0.5 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-emerald-950/50">
                {user?.name.slice(0, 2).toUpperCase() || 'iAQ'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{user?.name}</h2>
                <p className="text-xs text-[#718579]">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {user?.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dossier Information Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#121F18]">
                <span className="text-[#718579]">Accredited Organization:</span>
                <strong className="text-emerald-400 font-semibold">
                  {user?.organizationName}
                </strong>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#121F18]">
                <span className="text-[#718579]">Accreditation Pass Code:</span>
                <span className="font-mono text-white font-bold">
                  IAQ-2027-NG-{user?.id.slice(-6).toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#121F18]">
                <span className="text-[#718579]">Security Clearance:</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Cluster Level 3 Certified
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#121F18]">
                <span className="text-[#718579]">Cluster Assignment:</span>
                <span className="text-white font-medium">
                  {user?.assignedLocations?.length
                    ? `${user.assignedLocations.length} Polling Units Assigned`
                    : 'Supervisory View (All Locations)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#718579]">Offline Data Storage:</span>
                <span className="text-emerald-400 font-semibold font-mono">
                  IndexedDB / MMKV Ready
                </span>
              </div>
            </div>

            {/* Primary Watch Candidate Setting */}
            <div className="pt-3 border-t border-[#1C2E24] space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Primary Watch Candidate Preference:
              </label>
              <p className="text-[11px] text-[#718579]">
                Pin your principal monitored candidate across live pulse tickers and projection cards.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {candidates.map((cand) => {
                  const isWatched = user?.watchCandidateId === cand.id;
                  return (
                    <button
                      key={cand.id}
                      onClick={() => setWatchCandidate(cand.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isWatched
                          ? 'bg-[#15241D] text-white border-emerald-500 shadow-sm'
                          : 'bg-[#070C09] text-[#94A89D] border-[#1C2E24] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{cand.shortName}</span>
                      <span className="font-mono text-[10px] text-[#718579]">
                        ({cand.partyAcronym})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Persona Switcher & Field System Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Persona Switcher */}
          <Card className="p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">
                Test Role Persona Switcher
              </h2>
              <p className="text-xs text-[#718579]">
                Switch between field observer roles to evaluate assigned polling unit limits, supervisory privileges, and submission queues.
              </p>
            </div>

            <div className="space-y-3">
              {PREDEFINED_ACCOUNTS.map((acc) => {
                const isActive = user?.email === acc.email;
                return (
                  <div
                    key={acc.email}
                    onClick={() => loginWithAccount(acc)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#15241D] border-emerald-500 shadow-md'
                        : 'bg-[#070C09] border-[#1C2E24] hover:border-[#2C4436]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{acc.name}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            acc.role === 'ELECTION_OFFICER'
                              ? 'bg-purple-900/60 text-purple-300'
                              : acc.role === 'FIELD_AGENT'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {acc.roleTitle}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                        {acc.organizationName}
                      </p>
                      <p className="text-[11px] text-[#718579] mt-1 leading-normal">
                        {acc.description}
                      </p>
                    </div>

                    <button
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        isActive
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#121F18] text-[#94A89D] hover:text-white'
                      }`}
                    >
                      {isActive ? 'Active Identity' : 'Switch Identity'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Local Storage & Device Integrity */}
          <Card className="p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2E24]">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Field Device Integrity &amp; Cache Status
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-[#15241D] px-2 py-0.5 rounded border border-[#1C2E24]">
                ENCRYPTED AES-256
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24]">
                <span className="text-[#718579] block text-[10px] uppercase font-bold">
                  Collated Returns
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {results.length} records
                </span>
              </div>
              <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24]">
                <span className="text-[#718579] block text-[10px] uppercase font-bold">
                  Logged Incidents
                </span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {incidents.length} events
                </span>
              </div>
              <div className="bg-[#070C09] p-3 rounded-xl border border-[#1C2E24]">
                <span className="text-[#718579] block text-[10px] uppercase font-bold">
                  Local Queue Sync
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  All Synced
                </span>
              </div>
            </div>
          </Card>

          {/* Sign Out Button (app/(app)/(tabs)/profile.tsx line 277) */}
          <button
            onClick={() => useAppStore.getState().logout()}
            className="w-full py-3 px-4 rounded-2xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 text-red-400 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <span>Disconnect &amp; Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
