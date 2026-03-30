import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEcos, getEcoById, createEco, proposeEcoChanges, getEcoDiff, submitEco, validateEco, deleteEco } from '../api/ecos.api';
import { getEcoStages } from '../api/eco-stages.api';
import { toast } from 'sonner';

export const useEcos = (params) => useQuery({
  queryKey: ['ecos', params],
  queryFn: () => getEcos(params).then(r => r.data),
});

export const useEco = (id) => useQuery({
  queryKey: ['ecos', id],
  queryFn: () => getEcoById(id).then(r => r.data),
  enabled: !!id,
});

export const useEcoDiff = (id) => useQuery({
  queryKey: ['ecos', id, 'diff'],
  queryFn: () => getEcoDiff(id).then(r => r.data),
  enabled: !!id,
});

export const useEcoStages = () => useQuery({
  queryKey: ['eco-stages'],
  queryFn: () => getEcoStages().then(r => r.data),
});

export const useCreateEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createEco(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ecos'] }); toast.success('ECO created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ECO'),
  });
};

export const useProposeChanges = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => proposeEcoChanges(id, data),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ['ecos', id] }); toast.success('Changes proposed'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to propose changes'),
  });
};

export const useSubmitEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => submitEco(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['ecos', id] }); qc.invalidateQueries({ queryKey: ['ecos'] }); toast.success('ECO submitted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit ECO'),
  });
};

export const useValidateEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => validateEco(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['ecos', id] }); toast.success('ECO validated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to validate ECO'),
  });
};

export const useDeleteEco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteEco(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ecos'] }); toast.success('ECO deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete ECO'),
  });
};
