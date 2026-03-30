import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProductById, createProduct, archiveProduct, getProductVersions } from '../api/products.api';
import { toast } from 'sonner';

export const useProducts = (params) => useQuery({
  queryKey: ['products', params],
  queryFn: () => getProducts(params).then(r => r.data),
});

export const useProduct = (id) => useQuery({
  queryKey: ['products', id],
  queryFn: () => getProductById(id).then(r => r.data),
  enabled: !!id,
});

export const useProductVersions = (id) => useQuery({
  queryKey: ['products', id, 'versions'],
  queryFn: () => getProductVersions(id).then(r => r.data),
  enabled: !!id,
});

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createProduct(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
  });
};

export const useArchiveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => archiveProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product archived'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to archive product'),
  });
};
