import React, { useState } from 'react';
import { useAppStore } from '../store';
import { electionService } from '../services/electionService';
import {
  MapPin,
  Search,
  Building,
  ChevronRight,
  Layers,
  Map as MapIcon,
} from 'lucide-react';
import { NigeriaHeatMap } from '../components/NigeriaHeatMap';
import { Card } from '../components/Card';

export const LocationsView: React.FC = () => {
  const { results, setSubmitResultOpen, user, selectedStateFilter } = useAppStore();

  const [viewMode, setViewMode] = useState<'hierarchy' | 'map'>('hierarchy');
  const states = electionService.getStates();
  const [selectedStateId, setSelectedStateId] = useState<string>(() => {
    if (selectedStateFilter && states.some((s) => s.id === selectedStateFilter)) {
      return selectedStateFilter;
    }
    const matching = states.find((s) => s.name.toLowerCase() === selectedStateFilter?.toLowerCase());
    return matching?.id || 's25';
  });
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (selectedStateFilter) {
      if (states.some((s) => s.id === selectedStateFilter)) {
        setSelectedStateId(selectedStateFilter);
        const newLgas = electionService.getLgas(selectedStateFilter);
        if (newLgas[0]) setSelectedLgaId(newLgas[0].id);
      } else {
        const matching = states.find((s) => s.name.toLowerCase() === selectedStateFilter.toLowerCase());
        if (matching) {
          setSelectedStateId(matching.id);
          const newLgas = electionService.getLgas(matching.id);
          if (newLgas[0]) setSelectedLgaId(newLgas[0].id);
        }
      }
    }
  }, [selectedStateFilter, states]);

  const lgas = electionService.getLgas(selectedStateId);
  const [selectedLgaId, setSelectedLgaId] = useState<string>(lgas[0]?.id || '');

  const pollingUnits = electionService.getPollingUnits(selectedLgaId);

  const selectedState = states.find((s) => s.id === selectedStateId);
  const selectedLga = lgas.find((l) => l.id === selectedLgaId);

  const filteredPus = pollingUnits.filter((pu) =>
    pu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pu.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Title & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Electoral Hierarchy &amp; Geography</h1>
          <p className="text-xs text-[#718579]">
            36 States + FCT, 774 Local Government Areas, 8,809 Electoral Wards, and 176,846 Polling Units
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#080E0A] border border-[#1C2E24] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'hierarchy'
                ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                : 'text-[#718579] hover:text-white hover:bg-[#121F18]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PU Registry Explorer</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'map'
                ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                : 'text-[#718579] hover:text-white hover:bg-[#121F18]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive Heat Map</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <NigeriaHeatMap />
      ) : (
        <>
          {/* State Selector Horizontal Chips */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#718579] uppercase tracking-wider block">
          Select State ({states.length})
        </label>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {states.map((state) => {
            const isSelected = selectedStateId === state.id;
            return (
              <button
                key={state.id}
                onClick={() => {
                  setSelectedStateId(state.id);
                  const newLgas = electionService.getLgas(state.id);
                  if (newLgas[0]) setSelectedLgaId(newLgas[0].id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#0D6338] to-[#10B981] text-white border-emerald-500 shadow-sm'
                    : 'bg-[#0E1712] text-[#94A89D] border-[#1C2E24] hover:text-white'
                }`}
              >
                {state.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: LGA Column (4 cols) & Polling Units List (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LGA Selector */}
        <Card className="lg:col-span-4 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2E24]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              {selectedState?.name} LGAs ({lgas.length})
            </h2>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {lgas.map((lga) => {
              const isSelected = selectedLgaId === lga.id;
              return (
                <div
                  key={lga.id}
                  onClick={() => setSelectedLgaId(lga.id)}
                  className={`p-3 rounded-xl cursor-pointer transition text-xs flex items-center justify-between border ${
                    isSelected
                      ? 'bg-[#15241D] text-white border-emerald-500/60 font-bold'
                      : 'bg-[#070C09] text-[#94A89D] border-[#1C2E24] hover:text-white hover:border-[#2C4436]'
                  }`}
                >
                  <span>{lga.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#718579]" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Polling Units Column */}
        <Card className="lg:col-span-8 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2E24]">
            <div>
              <h2 className="text-base font-extrabold text-white">
                Polling Units in {selectedLga?.name || 'Selected LGA'}
              </h2>
              <p className="text-xs text-[#718579]">
                Certified INEC polling stations for primary voter accreditation &amp; counting
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-[#15241D] px-2.5 py-1 rounded-lg border border-[#1C2E24]">
              {filteredPus.length} Units Available
            </span>
          </div>

          {/* Search within this LGA */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit by code or street address..."
              className="w-full pl-9 pr-4 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Polling Units List */}
          <div className="space-y-3">
            {filteredPus.length > 0 ? (
              filteredPus.map((pu) => {
                const hasResult = results.some((r) => r.pollingUnitId === pu.id);
                const isDraft = results.some(
                  (r) => r.pollingUnitId === pu.id && r.status === 'DRAFT'
                );

                return (
                  <div
                    key={pu.id}
                    className="p-4 rounded-2xl bg-[#070C09] border border-[#1C2E24] hover:border-emerald-500/40 transition space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {pu.code}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {pu.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#718579] mt-0.5">
                          {pu.wardName} • Registered Voters: <strong className="text-white">{pu.registeredVoters}</strong>
                        </p>
                      </div>

                      <div>
                        {hasResult ? (
                          isDraft ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Draft Recorded
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Published
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            Awaiting Returns
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#121F18] text-xs">
                      <span className="text-[11px] text-[#718579] flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {pu.latitude?.toFixed(4)}, {pu.longitude?.toFixed(4)}
                      </span>

                      {user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT' ? (
                        <button
                          onClick={() => {
                            useAppStore.setState({
                              user: user ? { ...user, selectedPollingUnitId: pu.id, selectedPollingUnitName: pu.name } : null,
                            });
                            setSubmitResultOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#15241D] hover:bg-[#0D6338] text-emerald-300 text-xs font-semibold transition"
                        >
                          Record PU Result →
                        </button>
                      ) : hasResult ? (
                        <button
                          onClick={() => {
                            const foundResult = results.find((r) => r.pollingUnitId === pu.id);
                            if (foundResult) {
                              useAppStore.getState().setSelectedResultId(foundResult.id);
                            }
                            useAppStore.getState().setActiveTab('results');
                          }}
                          className="px-3 py-1 rounded-lg bg-[#1C2E24] hover:bg-[#253D30] text-emerald-300 text-xs font-semibold transition"
                        >
                          Audit Return →
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#718579] italic">
                          Awaiting Field Entry
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#718579]">
                <p>No polling units found matching your search in this LGA.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
};
