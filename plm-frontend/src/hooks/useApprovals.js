import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyApprovals, approveEco, rejectEco } from '../api/approvals.api';
import { toast } from 'sonner';

export const useApprovals = () => useQuery({
  queryKey: ['approvals'],
  queryFn: () => getMyApprovals().then(r => r.data),
});

export const useApproveEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ecoId) => approveEco(ecoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals'] }); qc.invalidateQueries({ queryKey: ['ecos'] }); toast.success('ECO approved'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });
};

export const useRejectEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ecoId) => rejectEco(ecoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals'] }); qc.invalidateQueries({ queryKey: ['ecos'] }); toast.success('ECO rejected'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });
};
