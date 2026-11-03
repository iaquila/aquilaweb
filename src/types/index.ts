export type UserRole =
  | 'SUPER_ADMINISTRATOR'
  | 'ADMINISTRATOR'
  | 'ELECTION_OFFICER'
  | 'FIELD_AGENT'
  | 'POLLING_AGENT';

export type DataSource = 'OBSERVED' | 'INEC';

export type ElectionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type ResultStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'CORRECTED';

export type IncidentStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentCategory =
  | 'VIOLENCE'
  | 'BALLOT_SNATCHING'
  | 'VOTE_BUYING'
  | 'VOTER_INTIMIDATION'
  | 'OVER_VOTING'
  | 'UNDER_AGE_VOTING'
  | 'PU_NOT_OPEN'
  | 'LATE_OFFICIALS'
  | 'LATE_MATERIALS'
  | 'EQUIPMENT_FAILURE'
  | 'BVAS_FAILURE'
  | 'SECURITY_INCIDENT'
  | 'PROTEST'
  | 'WEATHER_DISRUPTION'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  assignedLocations?: string[];
  avatarUrl?: string;
  token?: string;
  watchCandidateId?: string;
  selectedPollingUnitId?: string;
  selectedPollingUnitName?: string;
}

export interface Election {
  id: string;
  cycleId: string;
  position: string;
  electoralArea: string;
  electoralAreaType: string;
  electionDate: string;
  status: ElectionStatus;
  candidateCount: number;
}

export interface ElectionCycle {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
}

export interface CandidatePartyHistory {
  electionYear: number;
  electionName: string;
  partyAcronym: string;
  partyName: string;
  votes: number;
  percentage: number;
}

export interface Candidate {
  id: string;
  candidateNumber?: number;
  electionId: string;
  partyId: string;
  partyName: string;
  partyAcronym: string;
  partyLogoUrl?: string;
  partyColor?: string;
  fullName: string;
  shortName?: string;
  runningMate?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'WITHDRAWN';
  partyHistory?: CandidatePartyHistory[];
}

export interface AIProjectionResult {
  candidateId: string;
  candidateName: string;
  partyAcronym: string;
  projectedVoteShare: number;
  projectedVotes: number;
  winProbability: number;
  confidenceScore: number;
  leadingMargin: string;
  swingDelta: string;
  historicalBaselineYear: '2023' | '2019' | 'Combined';
  historicalParty: string;
  locationScope: string;
  keyInsights: string[];
  disclaimer: string;
}

export interface ResultSubmission {
  id: string;
  electionId: string;
  pollingUnitId: string;
  pollingUnitName: string;
  candidateVotes: Record<string, number>;
  candidateVotesInec: Record<string, number>;
  rejectedVotes: number;
  rejectedVotesInec: number;
  totalAccreditedVoters: number;
  accreditedVotersInec?: number;
  cancelledVotes?: number;
  cancelledVotesInec?: number;
  totalVotesCast: number;
  status: ResultStatus;
  latitude?: number;
  longitude?: number;
  submittedAt: string;
  submittedBy: string;
  evidencePhotoUrl?: string;
  note?: string;
}

export interface IncidentReport {
  id: string;
  electionId: string;
  pollingUnitId?: string;
  electoralArea: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  latitude?: number;
  longitude?: number;
  mediaUrls: string[];
  reportedBy: string;
  reportedAt: string;
  resolutionNote?: string;
}

export interface PollingUnit {
  id: string;
  name: string;
  code: string;
  wardId: string;
  wardName: string;
  lgaId: string;
  lgaName: string;
  stateId: string;
  stateName: string;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'INACTIVE';
  registeredVoters?: number;
}

export interface PoliticalParty {
  id: string;
  name: string;
  acronym: string;
  code: string;
  logoUrl?: string;
  color: string;
  founded?: number;
  nationalChairman?: string;
  status: 'ACTIVE' | 'INACTIVE';
}
