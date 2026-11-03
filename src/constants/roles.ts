import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMINISTRATOR: 'Super Administrator',
  ADMINISTRATOR: 'Administrator',
  ELECTION_OFFICER: 'Election Officer',
  FIELD_AGENT: 'Field Agent',
  POLLING_AGENT: 'Polling Unit Agent',
};
