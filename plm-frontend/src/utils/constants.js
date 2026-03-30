export const ROLES = {
  ENGINEERING: 'engineering',
  APPROVER: 'approver',
  OPERATIONS: 'operations',
  ADMIN: 'admin',
};

export const ROLE_OPTIONS = [
  { value: 1, label: 'Engineering User' },
  { value: 2, label: 'Approver' },
  { value: 3, label: 'Operations User' },
];

export const ECO_TYPES = {
  PRODUCT: 'PRODUCT',
  BOM: 'BOM',
};

export const ECO_STATUSES = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  REJECTED: 'REJECTED',
};

export const VERSION_STATUSES = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
};

export const APPROVAL_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};
