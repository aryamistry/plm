import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoms, getBomById, createBom, getBomVersions, getBomVersionDiff } from '../api/boms.api';
import { toast } from 'sonner';

export const useBoms = (params) => useQuery({
  queryKey: ['boms', params],
  queryFn: () => getBoms(params).then(r => r.data),
});

export const useBom = (id) => useQuery({
  queryKey: ['boms', id],
  queryFn: () => getBomById(id).then(r => r.data),
  enabled: !!id,
});

export const useBomVersions = (id) => useQuery({
  queryKey: ['boms', id, 'versions'],
  queryFn: () => getBomVersions(id).then(r => r.data),
  enabled: !!id,
});

export const useBomVersionDiff = (id, versionId, compareWith) => useQuery({
  queryKey: ['boms', id, 'diff', versionId, compareWith],
  queryFn: () => getBomVersionDiff(id, versionId, compareWith).then(r => r.data),
  enabled: !!id && !!versionId && !!compareWith,
});

export const useCreateBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createBom(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boms'] }); toast.success('BoM created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create BoM'),
  });
};
