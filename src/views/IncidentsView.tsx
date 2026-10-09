import React, { useState } from 'react';
import { useAppStore } from '../store';
import {
  AlertTriangle,
  Search,
  MapPin,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { Card } from '../components/Card';

export const IncidentsView: React.FC = () => {
  const { incidents, setReportIncidentOpen, setSelectedIncidentId, user } = useAppStore();

  const isFieldAgent =
    user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const categories = [
    'ALL',
    'VIOLENCE',
    'BALLOT_SNATCHING',
    'VOTE_BUYING',
    'VOTER_INTIMIDATION',
    'BVAS_FAILURE',
    'LATE_MATERIALS',
    'SECURITY_INCIDENT',
    'EQUIPMENT_FAILURE',
  ];

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.electoralArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || inc.category === selectedCategory;

    const matchesSeverity =
      selectedSeverity === 'ALL' || inc.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Quick Report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Incident Control Room</h1>
          <p className="text-xs text-[#718579]">
            {incidents.length} total logged incidents across operational sectors
          </p>
        </div>

        {isFieldAgent && (
          <button
            onClick={() => setReportIncidentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Live Incident</span>
          </button>
        )}
      </div>

      {/* Incident Status Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 shadow-lg">
          <span className="text-[10px] font-bold text-[#718579] uppercase tracking-wider block">
            TOTAL LOGGED
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{incidents.length}</span>
            <span className="text-xs text-[#718579]">Field reports</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg border-red-500/30">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
            CRITICAL / HIGH SEVERITY
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-400 font-mono">
              {incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length}
            </span>
            <span className="text-xs text-red-400">Escalated</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
            UNDER REVIEW
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {incidents.filter((i) => i.status === 'UNDER_REVIEW').length}
            </span>
            <span className="text-xs text-amber-400">Active triage</span>
          </div>
        </Card>

        <Card className="p-4 shadow-lg border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            RESOLVED / MITIGATED
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {incidents.filter((i) => i.status === 'RESOLVED').length}
            </span>
            <span className="text-xs text-emerald-400">De-escalated</span>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 shadow-xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident descriptions, locations, or reporters..."
            className="w-full pl-9 pr-4 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {/* Severity Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-[#718579] uppercase">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedSeverity === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-red-500 text-white'
                    : sev === 'HIGH'
                    ? 'bg-amber-500 text-black'
                    : 'bg-emerald-500 text-black'
                  : 'bg-[#070C09] text-[#94A89D] border border-[#1C2E24] hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-[#718579] uppercase">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#15241D] text-emerald-400 border border-emerald-500/40'
                  : 'text-[#94A89D] hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Incidents' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </Card>

      {/* Incident Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((inc) => (
            <Card
              key={inc.id}
              onClick={() => setSelectedIncidentId(inc.id)}
              className="hover:border-red-500/50 p-4 lg:p-5 transition cursor-pointer shadow-md space-y-3 flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-red-500 text-white'
                        : inc.severity === 'HIGH'
                        ? 'bg-amber-500 text-black'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                    {inc.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      inc.status === 'RESOLVED'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : inc.status === 'UNDER_REVIEW'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                        : 'bg-blue-950/80 text-blue-300 border-blue-700'
                    }`}
                  >
                    {inc.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[#718579] font-mono text-[11px]">
                    {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#F1F7F3] leading-relaxed">
                {inc.description}
              </p>

              {inc.resolutionNote && (
                <div className="bg-[#121F18] border border-emerald-900/40 p-2.5 rounded-xl text-[11px] text-emerald-300">
                  <strong className="text-emerald-400">Resolution Update:</strong> {inc.resolutionNote}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#1C2E24] text-[11px] text-[#718579]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    {inc.electoralArea}
                  </span>
                  <span>Reported by: {inc.reportedBy}</span>
                </div>

                <div className="flex items-center gap-3">
                  {inc.mediaUrls.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Camera className="w-3 h-3" />
                      {inc.mediaUrls.length} Media Attached
                    </span>
                  )}
                  <span className="text-red-400 font-semibold">Triage / Inspect →</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={ShieldCheck}
              title="No Incidents Found"
              subtitle="No incident reports match your selected severity or category."
              description="The field security feed is clear for these filters."
              actionLabel={searchQuery || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL' ? 'Reset Filters' : undefined}
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
