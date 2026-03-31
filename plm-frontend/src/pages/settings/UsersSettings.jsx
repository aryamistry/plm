import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { formatDate } from '../../utils/formatters';
import { toast } from 'sonner';

const roleNameToId = (name) => {
  const map = { engineering: 1, approver: 2, operations: 3, admin: 4 };
  return map[name] || 3;
};

export default function UsersSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role_id }) => api.patch(`/users/${id}/role`, { role_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update role'),
  });

  useEffect(() => { document.title = 'User Management — PLM'; }, []);

  const users = data?.data || [];

  const columns = [
    { header: '#', cell: (row) => <span className="font-display text-text-muted">{row.id}</span> },
    { header: 'Name', cell: (row) => <span className="text-text-primary font-medium">{row.name}</span> },
    { header: 'Email', cell: (row) => <span className="text-text-secondary text-sm">{row.email}</span> },
    { header: 'Role', cell: (row) => (
      <select
        defaultValue={row.role_id || roleNameToId(row.role)}
        onChange={(e) => updateMutation.mutate({ id: row.id, role_id: parseInt(e.target.value) })}
        className="bg-bg-elevated border border-bg-border rounded-input px-2 py-1 text-xs text-text-primary font-display uppercase cursor-pointer"
      >
        <option value={1}>Engineering</option>
        <option value={2}>Approver</option>
        <option value={3}>Operations</option>
        <option value={4}>Admin</option>
      </select>
    )},
    { header: 'Joined', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="User Management" description="Manage user accounts and role assignments" />
      <DataTable columns={columns} data={users} isLoading={isLoading} />
    </div>
  );
}
