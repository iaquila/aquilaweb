import React from 'react';
import { useAppStore } from '../store';
import { useDebouncedCallback } from '../hooks/useDebounce';
import {
  LayoutDashboard,
  Vote,
  BarChart3,
  AlertOctagon,
  MapPin,
  Flag,
  UserCheck,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, results, incidents, user } = useAppStore();

  const isFieldAgent =
    user?.role === 'FIELD_AGENT' || user?.role === 'POLLING_AGENT';

  const draftsCount = results.filter((r) => r.status === 'DRAFT').length;
  const activeIncidentsCount = incidents.filter(
    (i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW'
  ).length;

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Situation Console',
      shortLabel: 'Console',
      icon: LayoutDashboard,
    },
    {
      id: 'elections' as const,
      label: 'Elections',
      shortLabel: 'Elections',
      icon: Vote,
    },
    {
      id: 'results' as const,
      label: 'Results Collation',
      shortLabel: 'Results',
      icon: BarChart3,
      badge: isFieldAgent && draftsCount > 0 ? `${draftsCount} Draft` : undefined,
      badgeColor: 'bg-amber-500 text-black',
    },
    {
      id: 'incidents' as const,
      label: 'Field Incidents',
      shortLabel: 'Incidents',
      icon: AlertOctagon,
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'locations' as const,
      label: 'Locations',
      shortLabel: 'Locations',
      icon: MapPin,
    },
    {
      id: 'parties' as const,
      label: 'Parties & Candidates',
      shortLabel: 'Parties',
      icon: Flag,
    },
    {
      id: 'profile' as const,
      label: isFieldAgent ? 'Field Agent Profile' : 'Account & Access',
      shortLabel: 'Profile',
      icon: UserCheck,
    },
  ];

  const handleTabClick = useDebouncedCallback((tabId: typeof activeTab) => {
    setActiveTab(tabId);
  }, 250);

  return (
    <nav className="bg-[#0E1712] border-b border-[#1C2E24] px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar gap-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#0D6338] to-[#10B981] text-white shadow-md shadow-emerald-950/40'
                  : 'text-[#94A89D] hover:text-white hover:bg-[#15241D]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#718579]'}`} />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
