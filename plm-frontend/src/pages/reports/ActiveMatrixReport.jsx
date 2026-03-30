import { useActiveMatrixReport } from '../../hooks/useReports';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { formatPrice, formatVersion } from '../../utils/formatters';

export default function ActiveMatrixReport() {
  const { data, isLoading } = useActiveMatrixReport();

  const columns = [
    { header: 'Product', cell: (row) => <span className="text-text-primary font-medium">{row.product_name}</span> },
    { header: 'Active Version', cell: (row) => <span className="font-display text-accent-blue">{formatVersion(row.active_version?.version)}</span> },
    { header: 'Sale Price', cell: (row) => <span className="font-display text-sm">{formatPrice(row.active_version?.sale_price)}</span> },
    { header: 'Cost Price', cell: (row) => <span className="font-display text-sm">{formatPrice(row.active_version?.cost_price)}</span> },
    { header: 'BoM ID', cell: (row) => row.active_bom ? <span className="font-display text-sm">#{row.active_bom.bom_id}</span> : <span className="text-text-muted">—</span> },
    { header: 'BoM Version', cell: (row) => row.active_bom ? <span className="font-display text-accent-purple">{formatVersion(row.active_bom.bom_version)}</span> : <span className="text-text-muted">—</span> },
  ];

  return (
    <div>
      <PageHeader title="Active Product–Version–BoM Matrix" description="Operational reference for current active state" />
      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} />
    </div>
  );
}
