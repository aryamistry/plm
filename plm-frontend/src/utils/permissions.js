export const canCreateProduct = (user) => ['engineering', 'admin'].includes(user?.role);
export const canArchiveProduct = (user) => user?.role === 'admin';
export const canCreateBom = (user) => ['engineering', 'admin'].includes(user?.role);
export const canCreateEco = (user) => ['engineering', 'admin'].includes(user?.role);
export const canProposeChanges = (user, eco) =>
  ['engineering', 'admin'].includes(user?.role) && eco?.status === 'NEW';
export const canSubmitEco = (user, eco) =>
  canCreateEco(user) && eco?.status === 'NEW';
export const canValidateEco = (user, eco, stage) =>
  ['approver', 'admin'].includes(user?.role) && eco?.status === 'IN_PROGRESS' && !stage?.requires_approval;
export const canApproveEco = (user, eco, stage, approval) =>
  ['approver', 'admin'].includes(user?.role) &&
  eco?.status === 'IN_PROGRESS' &&
  stage?.requires_approval &&
  approval?.approver_id === user?.id &&
  approval?.status === 'PENDING';
export const canDeleteEco = (user, eco) =>
  ['engineering', 'admin'].includes(user?.role) && eco?.status === 'NEW';
export const canViewArchived = (user) => user?.role !== 'operations';
export const canAccessSettings = (user) => user?.role === 'admin';
export const canAccessApprovals = (user) => ['approver', 'admin'].includes(user?.role);
