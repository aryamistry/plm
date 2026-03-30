import { useArchivedProductsReport } from '../../hooks/useReports';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { formatPrice, formatVersion, formatDate } from '../../utils/formatters';

export default function ArchivedProductsReport() {
  const { data, isLoading } = useArchivedProductsReport();

  const columns = [
    { header: 'Product', cell: (row) => <span className="text-text-primary">{row.product_name}</span> },
    { header: 'Version', cell: (row) => <span className="font-display text-text-muted line-through">{formatVersion(row.version)}</span> },
    { header: 'Sale Price', cell: (row) => <span className="font-display text-sm">{formatPrice(row.sale_price)}</span> },
    { header: 'Cost Price', cell: (row) => <span className="font-display text-sm">{formatPrice(row.cost_price)}</span> },
    { header: 'Archived At', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Archived Products" description="Historical record of all archived product versions" />
      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} />
    </div>
  );
}
