import { create } from 'zustand';
import {
  User,
  UserRole,
  ResultSubmission,
  IncidentReport,
} from '../types';
import {
  INITIAL_RESULTS,
  INITIAL_INCIDENTS,
} from '../data/mockData';

export interface PredefinedAccount {
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organizationId: string;
  organizationName: string;
  description: string;
  assignedPus: string[];
}

export const PREDEFINED_ACCOUNTS: PredefinedAccount[] = [
  {
    name: 'Ibrahim Danladi',
    email: 'agent@iaquila.com.ng',
    role: 'FIELD_AGENT',
    roleTitle: 'Field Agent',
    organizationId: 'org-iaquila',
    organizationName: 'iAQUILA Situation Room HQ',
    description: 'Assigned to 3 Polling Units in Ikeja cluster for parallel vote tabulation.',
    assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
  },
  {
    name: 'Chinedu Okafor',
    email: 'polling@iaquila.com.ng',
    role: 'POLLING_AGENT',
    roleTitle: 'Polling Unit Agent',
    organizationId: 'org-iaquila',
    organizationName: 'iAQUILA Situation Room HQ',
    description: 'Stationed exclusively at PU 001 Ikeja Grammar School.',
    assignedPus: ['pu-s25-lga-1-1'],
  },
  {
    name: 'Dr. Adebayo Adeleke',
    email: 'officer@iaquila.com.ng',
    role: 'ELECTION_OFFICER',
    roleTitle: 'Election Officer',
    organizationId: 'org-cdd',
    organizationName: 'CDD West Africa',
    description: 'National election situation room supervisor with collation audit access.',
    assignedPus: [],
  },
  {
    name: 'Amina Bello',
    email: 'admin@iaquila.com.ng',
    role: 'ADMINISTRATOR',
    roleTitle: 'Administrator',
    organizationId: 'org-iaquila',
    organizationName: 'iAQUILA Situation Room HQ',
    description: 'Operational manager for live dashboards, collation records and incident review.',
    assignedPus: [],
  },
  {
    name: 'Dr. Farouk Al-Mansoor',
    email: 'superadmin@iaquila.com.ng',
    role: 'SUPER_ADMINISTRATOR',
    roleTitle: 'Super Administrator',
    organizationId: 'org-iaquila',
    organizationName: 'iAQUILA Situation Room HQ',
    description: 'Full system governance, electoral geography, positions & user roles.',
    assignedPus: [],
  },
];

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  loginWithAccount: (account: PredefinedAccount) => void;
  logout: () => void;
  setWatchCandidate: (candidateId?: string) => void;

  // Navigation
  activeTab: 'dashboard' | 'elections' | 'results' | 'incidents' | 'locations' | 'parties' | 'profile';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Election Selection
  selectedCycleId: string;
  selectedElectionId: string;
  setSelectedCycleId: (id: string) => void;
  setSelectedElectionId: (id: string) => void;

  // Results & Drafts
  results: ResultSubmission[];
  addResult: (result: ResultSubmission) => void;
  updateResult: (id: string, data: Partial<ResultSubmission>) => void;
  deleteResult: (id: string) => void;
  publishDraft: (id: string) => void;

  // Incidents
  incidents: IncidentReport[];
  addIncident: (incident: IncidentReport) => void;
  updateIncidentStatus: (id: string, status: IncidentReport['status'], resolutionNote?: string) => void;

  // Live Pulse Simulation
  pulseActive: boolean;
  pulseTick: number;
  pulseProcessedPus: number;
  totalPus: number;
  togglePulse: () => void;
  stepPulse: () => void;
  setPulseActive: (active: boolean) => void;

  // Modals & UI States
  isSubmitResultOpen: boolean;
  setSubmitResultOpen: (open: boolean) => void;
  isReportIncidentOpen: boolean;
  setReportIncidentOpen: (open: boolean) => void;
  isDraftsQueueOpen: boolean;
  setDraftsQueueOpen: (open: boolean) => void;
  selectedResultId: string | null;
  setSelectedResultId: (id: string | null) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedCandidateDetailId: string | null;
  setSelectedCandidateDetailId: (id: string | null) => void;
  selectedStateFilter: string | null;
  setSelectedStateFilter: (state: string | null) => void;
  selectedPuFilter: string | null;
  setSelectedPuFilter: (pu: string | null) => void;
  consumePuFilter: () => string | null;
}

const defaultAccount = PREDEFINED_ACCOUNTS[0];

export const useAppStore = create<AppState>((set, get) => ({
  // Default to unauthenticated so users start on the Login screen
  user: null,
  isAuthenticated: false,

  loginWithAccount: (account) => {
    set({
      user: {
        id: `u-${Date.now()}`,
        email: account.email,
        name: account.name,
        role: account.role,
        organizationId: account.organizationId,
        organizationName: account.organizationName,
        assignedLocations: account.assignedPus,
        watchCandidateId: get().user?.watchCandidateId || 'cand1',
      },
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  setWatchCandidate: (candidateId) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, watchCandidateId: candidateId } });
    }
  },

  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedCycleId: 'c1',
  selectedElectionId: 'e1',
  setSelectedCycleId: (id) => set({ selectedCycleId: id }),
  setSelectedElectionId: (id) => set({ selectedElectionId: id }),

  results: [
    ...INITIAL_RESULTS,
    // Add an initial draft in the queue to show the drafts workflow immediately!
    {
      id: 'draft-001',
      electionId: 'e1',
      pollingUnitId: 'pu-s25-lga-1-3',
      pollingUnitName: 'PU 003 - Allen Avenue Junction Hall',
      candidateVotes: { cand1: 275, cand2: 198, cand3: 142, cand4: 25 },
      candidateVotesInec: { cand1: 0, cand2: 0, cand3: 0, cand4: 0 },
      rejectedVotes: 8,
      rejectedVotesInec: 0,
      totalAccreditedVoters: 650,
      totalVotesCast: 648,
      status: 'DRAFT',
      latitude: 6.6011,
      longitude: 3.3512,
      submittedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      submittedBy: defaultAccount.email,
      note: 'Saved locally as draft awaiting final party agent signature.',
    },
  ],

  addResult: (result) => set((s) => ({ results: [result, ...s.results] })),
  updateResult: (id, data) =>
    set((s) => ({
      results: s.results.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),
  deleteResult: (id) =>
    set((s) => ({
      results: s.results.filter((r) => r.id !== id),
    })),
  publishDraft: (id) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'PUBLISHED',
              submittedAt: new Date().toISOString(),
              candidateVotesInec: { ...r.candidateVotes },
              rejectedVotesInec: r.rejectedVotes,
            }
          : r
      ),
    })),

  incidents: INITIAL_INCIDENTS,
  addIncident: (incident) => set((s) => ({ incidents: [incident, ...s.incidents] })),
  updateIncidentStatus: (id, status, resolutionNote) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              resolutionNote: resolutionNote || i.resolutionNote,
            }
          : i
      ),
    })),

  // Live simulation
  pulseActive: true,
  pulseTick: 124,
  pulseProcessedPus: 128450,
  totalPus: 176846,
  togglePulse: () => set((s) => ({ pulseActive: !s.pulseActive })),
  setPulseActive: (active) => set({ pulseActive: active }),
  stepPulse: () => {
    set((s) => {
      const nextTick = s.pulseTick + 1;
      const addedPus = Math.floor(Math.random() * 8) + 3;
      const newProcessed = Math.min(s.totalPus, s.pulseProcessedPus + addedPus);
      return {
        pulseTick: nextTick,
        pulseProcessedPus: newProcessed,
      };
    });
  },

  // Modals
  isSubmitResultOpen: false,
  setSubmitResultOpen: (open) => set({ isSubmitResultOpen: open }),
  isReportIncidentOpen: false,
  setReportIncidentOpen: (open) => set({ isReportIncidentOpen: open }),
  isDraftsQueueOpen: false,
  setDraftsQueueOpen: (open) => set({ isDraftsQueueOpen: open }),
  selectedResultId: null,
  setSelectedResultId: (id) => set({ selectedResultId: id }),
  selectedIncidentId: null,
  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),
  selectedCandidateDetailId: null,
  setSelectedCandidateDetailId: (id) => set({ selectedCandidateDetailId: id }),
  selectedStateFilter: null,
  setSelectedStateFilter: (state) => set({ selectedStateFilter: state }),
  selectedPuFilter: null,
  setSelectedPuFilter: (pu) => set({ selectedPuFilter: pu }),
  consumePuFilter: () => {
    const val = get().selectedPuFilter;
    if (val) {
      set({ selectedPuFilter: null });
    }
    return val;
  },
}));
