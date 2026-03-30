import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { formatDate } from '../../utils/formatters';

export default function UsersSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const users = data?.data || [];

  const columns = [
    { header: '#', cell: (row) => <span className="font-display text-text-muted">{row.id}</span> },
    { header: 'Name', cell: (row) => <span className="text-text-primary font-medium">{row.name}</span> },
    { header: 'Email', cell: (row) => <span className="text-text-secondary text-sm">{row.email}</span> },
    { header: 'Role', cell: (row) => (
      <span className="font-display text-xs uppercase bg-bg-elevated px-2 py-1 rounded text-text-secondary">{row.role || row.role_name}</span>
    )},
    { header: 'Joined', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="User Management" description="View all registered users" />
      <DataTable columns={columns} data={users} isLoading={isLoading} />
    </div>
  );
}
